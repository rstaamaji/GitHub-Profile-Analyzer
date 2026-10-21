import {
  CACHE_TTL_MS,
  GitHubService,
  buildRepoDetailCacheKey,
  buildUserCacheKey,
  buildUserReposCacheKey,
} from './githubService';
import type { ApiError, GitHubUser } from '../types/github';

function assertEqual<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`FAIL: ${message}\n  Expected: ${expectedStr}\n  Actual:   ${actualStr}`);
  }
}

function createMockUser(login: string, followers: number = 100): GitHubUser {
  return {
    login,
    id: 1,
    avatar_url: '',
    html_url: `https://github.com/${login}`,
    name: login,
    company: null,
    blog: null,
    location: null,
    email: null,
    hireable: null,
    bio: null,
    twitter_username: null,
    public_repos: 5,
    public_gists: 0,
    followers,
    following: 0,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function createJsonResponse(
  body: unknown,
  status: number = 200,
  headersInit: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '58',
      'x-ratelimit-reset': '1790000000',
      'x-ratelimit-used': '2',
      ...headersInit,
    },
  });
}

async function runTests() {
  // 1. Test deterministic cache key builders
  assertEqual(
    buildUserCacheKey(' @Torvalds '),
    'user:torvalds',
    'buildUserCacheKey should normalize case, whitespace, and @ prefix'
  );
  assertEqual(
    buildUserReposCacheKey('Torvalds', 30, 1, 'pushed'),
    'repos:torvalds:page=1:per_page=30:sort=pushed',
    'buildUserReposCacheKey should build consistent key'
  );
  assertEqual(
    buildRepoDetailCacheKey('Torvalds', 'Linux'),
    'repo-detail:torvalds/linux',
    'buildRepoDetailCacheKey should normalize owner and repo'
  );

  // 2. Test Cache Hit, Miss, TTL Expiration, and Stale Fallback on Rate Limit
  let currentTime = 1_000_000;
  let fetchCount = 0;
  let shouldFailWithRateLimit = false;

  const service = new GitHubService({
    enableSessionStorage: false,
    nowFn: () => currentTime,
    fetchFn: async () => {
      fetchCount++;
      if (shouldFailWithRateLimit) {
        return createJsonResponse(
          { message: 'API rate limit exceeded' },
          403,
          {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1790003600',
          }
        );
      }
      return createJsonResponse(createMockUser('torvalds', 100 + fetchCount));
    },
  });

  // Initial call -> cache miss
  const firstRes = await service.getUser('torvalds');
  assertEqual(fetchCount, 1, 'First call should invoke fetch once');
  assertEqual(firstRes.fromCache, false, 'First call should not be fromCache');
  assertEqual(firstRes.isStale, false, 'First call should not be stale');
  assertEqual(firstRes.data.followers, 101, 'First call returns followers=101');

  // Second call within 5-minute TTL -> cache hit
  currentTime += 60_000; // +1 min
  const secondRes = await service.getUser(' @TORVALDS ');
  assertEqual(fetchCount, 1, 'Second call within TTL should NOT invoke fetch');
  assertEqual(secondRes.fromCache, true, 'Second call should be a cache hit');
  assertEqual(secondRes.isStale, false, 'Second call within TTL is fresh');
  assertEqual(secondRes.data.followers, 101, 'Second call returns cached followers=101');

  // Advance clock past 5-minute TTL, and simulate Rate Limit error -> Stale cache fallback
  currentTime += CACHE_TTL_MS.user + 1_000;
  shouldFailWithRateLimit = true;
  const staleRes = await service.getUser('torvalds');
  assertEqual(fetchCount, 2, 'Expired cache should trigger network fetch');
  assertEqual(staleRes.fromCache, true, 'Failed network fetch should fall back to cache');
  assertEqual(staleRes.isStale, true, 'Fallback cache must be marked isStale: true');
  assertEqual(staleRes.data.followers, 101, 'Fallback returns previously cached data');
  assertEqual(
    Boolean(staleRes.staleReason && staleRes.staleReason.includes('rate limit')),
    true,
    'Stale fallback should include staleReason explaining rate limit'
  );

  // Recover network -> fresh update replaces stale cache
  shouldFailWithRateLimit = false;
  const freshRes = await service.getUser('torvalds');
  assertEqual(fetchCount, 3, 'Next call after stale fallback should fetch fresh data');
  assertEqual(freshRes.fromCache, false, 'Recovered call should be fresh from network');
  assertEqual(freshRes.isStale, false, 'Recovered call should not be stale');
  assertEqual(freshRes.data.followers, 103, 'Recovered call should return updated followers=103');

  // 3. Test Concurrent In-Flight Deduplication & AbortSignal Isolation
  let concurrentFetches = 0;
  const dedupService = new GitHubService({
    enableSessionStorage: false,
    nowFn: () => currentTime,
    fetchFn: async (input) => {
      concurrentFetches++;
      await new Promise((r) => setTimeout(r, 30));
      const urlStr = String(input);
      const login = urlStr.split('/').pop() || 'unknown';
      return createJsonResponse(createMockUser(login, 500));
    },
  });

  const [dupA, dupB, distinctC] = await Promise.all([
    dedupService.getUser('gaearon'),
    dedupService.getUser('GAEARON'),
    dedupService.getUser('yyx990803'),
  ]);

  assertEqual(
    concurrentFetches,
    2,
    'Two identical concurrent requests + one distinct request should result in exactly 2 fetches'
  );
  assertEqual(dupA.data.login, 'gaearon', 'First deduplicated caller gets gaearon');
  assertEqual(dupB.data.login, 'gaearon', 'Second deduplicated caller gets gaearon');
  assertEqual(distinctC.data.login, 'yyx990803', 'Distinct caller gets yyx990803 without mixing');

  // Test AbortSignal on one of two shared callers
  const abortController1 = new AbortController();
  const sharedPromise1 = dedupService.getUser('sindresorhus', abortController1.signal);
  const sharedPromise2 = dedupService.getUser('sindresorhus');

  abortController1.abort();

  let caller1Aborted = false;
  try {
    await sharedPromise1;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
      caller1Aborted = true;
    }
  }
  assertEqual(caller1Aborted, true, 'Aborted caller should reject with AbortError');

  const caller2Result = await sharedPromise2;
  assertEqual(
    caller2Result.data.login,
    'sindresorhus',
    'Non-aborted concurrent caller should still resolve normally'
  );

  // 4. Test Rate Limit (403/429) vs Non-Rate-Limit Forbidden (403) vs 404 Error Distinction
  const errorService = new GitHubService({
    enableSessionStorage: false,
    fetchFn: async (input) => {
      const url = String(input);
      if (url.includes('ratelimited429')) {
        return createJsonResponse({ message: 'Too many requests' }, 429, {
          'retry-after': '60',
          'x-ratelimit-remaining': '0',
        });
      }
      if (url.includes('forbidden403')) {
        return createJsonResponse(
          { message: 'Repository access blocked' },
          403,
          { 'x-ratelimit-remaining': '42' }
        );
      }
      return createJsonResponse({ message: 'Not Found' }, 404);
    },
  });

  let err429: ApiError | null = null;
  try {
    await errorService.getUser('ratelimited429');
  } catch (e) {
    err429 = e as ApiError;
  }
  assertEqual(err429?.isRateLimit, true, 'HTTP 429 should be flagged as isRateLimit: true');
  assertEqual(err429?.isAuthError, false, 'HTTP 429 should not be flagged as isAuthError');

  let err403Forbidden: ApiError | null = null;
  try {
    await errorService.getUser('forbidden403');
  } catch (e) {
    err403Forbidden = e as ApiError;
  }
  assertEqual(
    err403Forbidden?.isRateLimit,
    false,
    'HTTP 403 with remaining > 0 should NOT be flagged as rate limit'
  );
  assertEqual(
    err403Forbidden?.isAuthError,
    true,
    'HTTP 403 with remaining > 0 should be flagged as isAuthError / access forbidden'
  );

  // 5. Test Cache Invalidation per username
  dedupService.invalidateUserCache('gaearon');
  const afterInvalidate = await dedupService.getUser('gaearon');
  assertEqual(
    afterInvalidate.fromCache,
    false,
    'invalidated user should be re-fetched from network'
  );
  const stillCachedOther = await dedupService.getUser('yyx990803');
  assertEqual(
    stillCachedOther.fromCache,
    true,
    'other users should remain cached when invalidating a specific username'
  );

  // 6. Test HTTP 5xx Server Error Handling
  const server503Service = new GitHubService({
    enableSessionStorage: false,
    fetchFn: async () => {
      return createJsonResponse({ message: 'Service Unavailable' }, 503);
    },
  });

  let err503: ApiError | null = null;
  try {
    await server503Service.getUser('torvalds');
  } catch (e) {
    err503 = e as ApiError;
  }
  assertEqual(err503?.status, 503, '503 error must retain status 503');
  assertEqual(err503?.isServerError, true, '503 error must be flagged as isServerError: true');
  assertEqual(
    Boolean(err503?.message.includes('HTTP 503')),
    true,
    '503 error message must indicate HTTP 503 service issue'
  );

  // 7. Test Invalid / Malformed Response Payload Handling
  const invalidJsonService = new GitHubService({
    enableSessionStorage: false,
    fetchFn: async () => {
      return new Response('<html><head><title>502 Bad Gateway</title></head><body>Bad Gateway</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    },
  });

  let malformedJsonErr: ApiError | null = null;
  try {
    await invalidJsonService.getUser('torvalds');
  } catch (e) {
    malformedJsonErr = e as ApiError;
  }
  assertEqual(
    malformedJsonErr?.isInvalidResponse,
    true,
    'Malformed non-JSON payload must be flagged with isInvalidResponse: true'
  );

  // 8. Test Pre-flight Validation to Prevent Wasting Network Quota
  let preflightFetchCount = 0;
  const preflightService = new GitHubService({
    enableSessionStorage: false,
    fetchFn: async () => {
      preflightFetchCount++;
      return createJsonResponse(createMockUser('validuser'));
    },
  });

  let invalidUsernameErr: ApiError | null = null;
  try {
    await preflightService.getUser('-invalid-leading-hyphen');
  } catch (e) {
    invalidUsernameErr = e as ApiError;
  }
  assertEqual(invalidUsernameErr?.status, 400, 'Invalid username must reject with status 400');
  assertEqual(
    preflightFetchCount,
    0,
    'Pre-flight validation must NOT make network requests for invalid usernames'
  );

  // 9. Test Network Offline / Fetch Failure
  const offlineService = new GitHubService({
    enableSessionStorage: false,
    fetchFn: async () => {
      throw new TypeError('Failed to fetch');
    },
  });

  let networkErr: ApiError | null = null;
  try {
    await offlineService.getUser('torvalds');
  } catch (e) {
    networkErr = e as ApiError;
  }
  assertEqual(networkErr?.status, undefined, 'Network error should not have an HTTP status code');
  assertEqual(
    Boolean(networkErr?.message.toLowerCase().includes('network')),
    true,
    'Network error message must explain connectivity failure'
  );

  // 10. Test Retry-After Header Parsing with Seconds and HTTP Date
  let parsedResetSeconds: Date | undefined;
  let parsedResetDate: Date | undefined;

  const retryHeaderService = new GitHubService({
    enableSessionStorage: false,
    nowFn: () => 1_700_000_000_000,
    fetchFn: async (input) => {
      const url = String(input);
      if (url.includes('retry-seconds')) {
        return createJsonResponse({ message: 'Rate limit' }, 429, {
          'retry-after': '120',
          'x-ratelimit-remaining': '0',
        });
      }
      return createJsonResponse({ message: 'Rate limit' }, 429, {
        'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT',
        'x-ratelimit-remaining': '0',
      });
    },
  });

  try {
    await retryHeaderService.getUser('retry-seconds');
  } catch (e) {
    parsedResetSeconds = (e as ApiError).resetTime;
  }
  assertEqual(
    parsedResetSeconds?.getTime(),
    1_700_000_000_000 + 120_000,
    'Retry-After seconds must be added to current time'
  );

  try {
    await retryHeaderService.getUser('retry-date');
  } catch (e) {
    parsedResetDate = (e as ApiError).resetTime;
  }
  assertEqual(
    parsedResetDate?.toUTCString(),
    'Wed, 21 Oct 2026 07:28:00 GMT',
    'Retry-After HTTP date string must be parsed correctly'
  );

  // 11. Test Bounded Cache Size and LRU Eviction
  let boundedFetchCount = 0;
  const boundedService = new GitHubService({
    enableSessionStorage: false,
    maxMemoryEntries: 3,
    fetchFn: async (input) => {
      boundedFetchCount++;
      const urlStr = String(input);
      const user = urlStr.split('/').pop() || 'unknown';
      return createJsonResponse(createMockUser(user));
    },
  });

  await boundedService.getUser('user1');
  await boundedService.getUser('user2');
  await boundedService.getUser('user3');
  assertEqual(boundedFetchCount, 3, 'Fetched 3 distinct users');
  assertEqual(boundedService.getCacheStats().memoryEntriesCount, 3, 'Cache reaches max limit of 3');

  // Read user1 to refresh its LRU recency
  await boundedService.getUser('user1');
  assertEqual(boundedFetchCount, 3, 'Reading user1 from cache does not fetch');

  // Add user4 -> should evict user2 (least recently used)
  await boundedService.getUser('user4');
  assertEqual(boundedFetchCount, 4, 'Fetching user4 increments fetch count');
  assertEqual(boundedService.getCacheStats().memoryEntriesCount, 3, 'Cache remains bounded at 3');

  // Verify user1 is still cached
  const checkUser1 = await boundedService.getUser('user1');
  assertEqual(checkUser1.fromCache, true, 'Recently accessed user1 remains in cache');

  // Verify user2 was evicted (requires re-fetch)
  const checkUser2 = await boundedService.getUser('user2');
  assertEqual(checkUser2.fromCache, false, 'Evicted user2 must be re-fetched from network');
  assertEqual(boundedFetchCount, 5, 'Re-fetching evicted user2 increases fetch count to 5');

  console.log('✓ All githubService caching, TTL, deduplication, 5xx, invalid payload, pre-flight, and bounded LRU tests passed!');
}

runTests();
