import type {
  GitHubRepo,
  GitHubUser,
  RateLimitInfo,
  ApiError,
  ReadmeData,
  ServiceRequestOptions,
} from '../types/github';

const DEFAULT_GITHUB_API_BASE = 'https://api.github.com';
const SESSION_STORAGE_PREFIX = 'gh_analyzer_cache_v1:';

export const CACHE_TTL_MS = {
  user: 5 * 60 * 1000, // 5 minutes for public user profile
  repos: 3 * 60 * 1000, // 3 minutes for repository lists
  repoDetail: 5 * 60 * 1000, // 5 minutes for repository detail metadata
  readme: 10 * 60 * 1000, // 10 minutes for repository README content
} as const;

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  hasNextPage?: boolean;
}

export interface ServiceResponse<T> {
  data: T;
  rateLimit?: RateLimitInfo;
  hasNextPage?: boolean;
  fromCache?: boolean;
  isStale?: boolean;
  cachedAt?: number;
  staleReason?: string;
}

interface InFlightRequest<T> {
  promise: Promise<ServiceResponse<T>>;
  controller: AbortController;
  activeSubscribers: number;
}

export interface GitHubServiceConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  nowFn?: () => number;
  enableSessionStorage?: boolean;
}

function createAbortError(): Error {
  const err = new Error('The operation was aborted.');
  err.name = 'AbortError';
  return err;
}

export function buildUserCacheKey(username: string): string {
  return `user:${username.trim().replace(/^@/, '').toLowerCase()}`;
}

export function buildUserReposCacheKey(
  username: string,
  perPage: number,
  page: number,
  sort: string
): string {
  const cleanUser = username.trim().replace(/^@/, '').toLowerCase();
  return `repos:${cleanUser}:page=${page}:per_page=${perPage}:sort=${sort}`;
}

export function buildRepoDetailCacheKey(owner: string, repo: string): string {
  return `repo-detail:${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}`;
}

export function buildRepoReadmeCacheKey(owner: string, repo: string): string {
  return `repo-readme:${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}`;
}

/**
 * GitHub REST API v3 Service with TTL response caching, stale-on-error fallback,
 * and concurrent in-flight request deduplication.
 *
 * Security Note: Never stores or exposes personal access tokens or secrets in browser bundles or storage.
 */
export class GitHubService {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly nowFn: () => number;
  private readonly enableSessionStorage: boolean;
  private readonly memoryCache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlightRequests = new Map<string, InFlightRequest<unknown>>();
  private lastKnownRateLimit: RateLimitInfo | undefined;

  constructor(config: GitHubServiceConfig = {}) {
    const envBaseUrl =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_API_BASE_URL
        ? String(import.meta.env.VITE_GITHUB_API_BASE_URL).replace(/\/+$/, '')
        : DEFAULT_GITHUB_API_BASE;

    this.baseUrl = config.baseUrl || envBaseUrl;
    this.fetchFn = config.fetchFn || ((input, init) => fetch(input, init));
    this.nowFn = config.nowFn || (() => Date.now());
    this.enableSessionStorage =
      config.enableSessionStorage ?? typeof window !== 'undefined';
  }

  private getHeaders(): HeadersInit {
    return {
      Accept: 'application/vnd.github.v3+json',
    };
  }

  public getLastKnownRateLimit(): RateLimitInfo | undefined {
    return this.lastKnownRateLimit;
  }

  private parseRateLimit(response: Response): RateLimitInfo | undefined {
    return this.parseRateLimitFromHeaders(response.headers);
  }

  private readCache<T>(key: string): CacheEntry<T> | null {
    const memEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      return memEntry;
    }

    if (this.enableSessionStorage && typeof sessionStorage !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry<T>;
          if (
            parsed &&
            typeof parsed.cachedAt === 'number' &&
            typeof parsed.expiresAt === 'number'
          ) {
            this.memoryCache.set(key, parsed);
            return parsed;
          }
        }
      } catch {
        // Ignore storage read/parse errors safely
      }
    }

    return null;
  }

  private writeCache<T>(
    key: string,
    data: T,
    ttlMs: number,
    hasNextPage?: boolean
  ): CacheEntry<T> {
    const now = this.nowFn();
    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
      hasNextPage,
    };

    this.memoryCache.set(key, entry);

    if (this.enableSessionStorage && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch {
        // Ignore sessionStorage quota errors safely
      }
    }

    return entry;
  }

  /**
   * Invalidates cached entries for a specific username or clears the entire cache.
   */
  public invalidateUserCache(username?: string): void {
    if (!username) {
      this.clearCache();
      return;
    }

    const clean = username.trim().replace(/^@/, '').toLowerCase();
    const prefixes = [`user:${clean}`, `repos:${clean}:`, `repo-detail:${clean}/`, `repo-readme:${clean}/`];

    for (const key of Array.from(this.memoryCache.keys())) {
      if (prefixes.some((p) => key === p || key.startsWith(p))) {
        this.memoryCache.delete(key);
      }
    }

    if (this.enableSessionStorage && typeof sessionStorage !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const storageKey = sessionStorage.key(i);
          if (storageKey && storageKey.startsWith(SESSION_STORAGE_PREFIX)) {
            const logicalKey = storageKey.slice(SESSION_STORAGE_PREFIX.length);
            if (prefixes.some((p) => logicalKey === p || logicalKey.startsWith(p))) {
              keysToRemove.push(storageKey);
            }
          }
        }
        for (const k of keysToRemove) {
          sessionStorage.removeItem(k);
        }
      } catch {
        // Ignore storage errors safely
      }
    }
  }

  public clearCache(): void {
    this.memoryCache.clear();
    if (this.enableSessionStorage && typeof sessionStorage !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(SESSION_STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          sessionStorage.removeItem(k);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  private buildApiError(
    status: number,
    rawMessage: string,
    headers: Headers,
    resourceContext: 'user' | 'repos' | 'repoDetail' | 'readme' = 'user'
  ): ApiError {
    const rateLimit = this.parseRateLimitFromHeaders(headers);
    const remainingHeader = headers.get('x-ratelimit-remaining');
    const resetHeader = headers.get('x-ratelimit-reset');
    const retryAfterHeader = headers.get('retry-after');

    let resetTime: Date | undefined;
    if (resetHeader) {
      const resetEpochMs = parseInt(resetHeader, 10) * 1000;
      if (!Number.isNaN(resetEpochMs)) {
        resetTime = new Date(resetEpochMs);
      }
    } else if (retryAfterHeader) {
      const retrySeconds = parseInt(retryAfterHeader, 10);
      if (!Number.isNaN(retrySeconds)) {
        resetTime = new Date(this.nowFn() + retrySeconds * 1000);
      }
    }

    const lowerMsg = (rawMessage || '').toLowerCase();
    const isRateLimit =
      status === 429 ||
      (status === 403 &&
        (remainingHeader === '0' ||
          retryAfterHeader !== null ||
          lowerMsg.includes('rate limit') ||
          lowerMsg.includes('secondary rate limit')));

    const isAuthError = status === 401 || (status === 403 && !isRateLimit);

    let friendlyMessage = rawMessage || 'Unexpected GitHub API error.';

    if (status === 404) {
      friendlyMessage =
        resourceContext === 'repoDetail' || resourceContext === 'readme'
          ? 'GitHub repository not found. It may have been renamed, moved, or made private.'
          : 'GitHub user not found. Please verify the username spelling and try again.';
    } else if (isRateLimit) {
      friendlyMessage = `GitHub API rate limit exceeded (60 requests/hr for unauthenticated clients). Quota resets at ${
        resetTime ? resetTime.toLocaleTimeString() : 'the next hour'
      }.`;
    } else if (status === 401) {
      friendlyMessage =
        'GitHub API authentication failed (HTTP 401). Please verify API access configuration.';
    } else if (isAuthError) {
      friendlyMessage = `Access forbidden by GitHub API (HTTP 403)${
        rawMessage ? `: ${rawMessage}` : '.'
      }`;
    }

    return {
      message: friendlyMessage,
      status,
      resetTime,
      isRateLimit,
      isAuthError,
      rateLimit,
    };
  }

  private parseRateLimitFromHeaders(headers: Headers): RateLimitInfo | undefined {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const used = headers.get('x-ratelimit-used');

    if (limit !== null && remaining !== null && reset !== null) {
      const limitNum = parseInt(limit, 10);
      const remainingNum = parseInt(remaining, 10);
      const resetNum = parseInt(reset, 10);
      const usedNum = used !== null ? parseInt(used, 10) : 0;

      if (!Number.isNaN(limitNum) && !Number.isNaN(remainingNum) && !Number.isNaN(resetNum)) {
        const parsed: RateLimitInfo = {
          limit: limitNum,
          remaining: remainingNum,
          reset: resetNum,
          used: Number.isNaN(usedNum) ? 0 : usedNum,
        };
        this.lastKnownRateLimit = parsed;
        return parsed;
      }
    }
    return undefined;
  }

  /**
   * Executes a cached + deduplicated request.
   * - Returns fresh cache immediately if within TTL and !forceRefresh.
   * - Deduplicates concurrent identical requests via `inFlightRequests`.
   * - Falls back to stale cached data (explicitly marked `isStale: true`) if a network or rate-limit failure occurs.
   */
  private async executeWithCacheAndDedup<T>(
    cacheKey: string,
    ttlMs: number,
    options: ServiceRequestOptions,
    fetcher: (signal: AbortSignal) => Promise<{
      data: T;
      rateLimit?: RateLimitInfo;
      hasNextPage?: boolean;
    }>
  ): Promise<ServiceResponse<T>> {
    const { signal, forceRefresh = false } = options;

    if (signal?.aborted) {
      throw createAbortError();
    }

    const existingCache = this.readCache<T>(cacheKey);
    const now = this.nowFn();

    // 1. Fresh cache hit
    if (!forceRefresh && existingCache && now < existingCache.expiresAt) {
      return {
        data: existingCache.data,
        rateLimit: this.lastKnownRateLimit,
        hasNextPage: existingCache.hasNextPage,
        fromCache: true,
        isStale: false,
        cachedAt: existingCache.cachedAt,
      };
    }

    // 2. Check or create shared in-flight request for deduplication
    let inFlight = this.inFlightRequests.get(cacheKey) as InFlightRequest<T> | undefined;

    if (!inFlight) {
      const sharedController = new AbortController();
      let createdInFlight: InFlightRequest<T> | undefined;

      const requestPromise: Promise<ServiceResponse<T>> = (async () => {
        try {
          const result = await fetcher(sharedController.signal);
          const saved = this.writeCache(cacheKey, result.data, ttlMs, result.hasNextPage);
          return {
            data: result.data,
            rateLimit: result.rateLimit ?? this.lastKnownRateLimit,
            hasNextPage: result.hasNextPage,
            fromCache: false,
            isStale: false,
            cachedAt: saved.cachedAt,
          };
        } catch (err: unknown) {
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            throw err;
          }

          const apiErr = err as ApiError;

          // If request failed due to rate limit, network error, or server error (not 404),
          // and we have a cached snapshot, return it honestly labeled as stale
          if (existingCache && apiErr.status !== 404) {
            return {
              data: existingCache.data,
              rateLimit: apiErr.rateLimit ?? this.lastKnownRateLimit,
              hasNextPage: existingCache.hasNextPage,
              fromCache: true,
              isStale: true,
              cachedAt: existingCache.cachedAt,
              staleReason: apiErr.message,
            };
          }

          throw err;
        } finally {
          if (this.inFlightRequests.get(cacheKey) === createdInFlight) {
            this.inFlightRequests.delete(cacheKey);
          }
        }
      })();

      createdInFlight = {
        promise: requestPromise,
        controller: sharedController,
        activeSubscribers: 0,
      };
      inFlight = createdInFlight;
      this.inFlightRequests.set(cacheKey, inFlight);
    }

    inFlight.activeSubscribers += 1;
    const currentInFlight = inFlight;

    if (!signal) {
      try {
        return await currentInFlight.promise;
      } finally {
        currentInFlight.activeSubscribers = Math.max(0, currentInFlight.activeSubscribers - 1);
      }
    }

    // Wrap shared promise with caller-specific AbortSignal listener
    return new Promise<ServiceResponse<T>>((resolve, reject) => {
      const onAbort = () => {
        currentInFlight.activeSubscribers = Math.max(0, currentInFlight.activeSubscribers - 1);
        if (currentInFlight.activeSubscribers === 0) {
          currentInFlight.controller.abort();
          if (this.inFlightRequests.get(cacheKey) === currentInFlight) {
            this.inFlightRequests.delete(cacheKey);
          }
        }
        reject(createAbortError());
      };

      signal.addEventListener('abort', onAbort, { once: true });

      currentInFlight.promise.then(
        (res) => {
          signal.removeEventListener('abort', onAbort);
          currentInFlight.activeSubscribers = Math.max(0, currentInFlight.activeSubscribers - 1);
          resolve(res);
        },
        (err) => {
          signal.removeEventListener('abort', onAbort);
          currentInFlight.activeSubscribers = Math.max(0, currentInFlight.activeSubscribers - 1);
          reject(err);
        }
      );
    });
  }

  /**
   * Fetch user public profile (`GET /users/{username}`)
   */
  async getUser(
    username: string,
    signalOrOptions?: AbortSignal | ServiceRequestOptions
  ): Promise<ServiceResponse<GitHubUser>> {
    const options: ServiceRequestOptions =
      signalOrOptions && 'aborted' in signalOrOptions
        ? { signal: signalOrOptions }
        : (signalOrOptions ?? {});

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cacheKey = buildUserCacheKey(cleanUsername);

    return this.executeWithCacheAndDedup<GitHubUser>(
      cacheKey,
      CACHE_TTL_MS.user,
      options,
      async (reqSignal) => {
        try {
          const response = await this.fetchFn(
            `${this.baseUrl}/users/${encodeURIComponent(cleanUsername)}`,
            {
              headers: this.getHeaders(),
              signal: reqSignal,
            }
          );

          const rateLimit = this.parseRateLimit(response);

          if (!response.ok) {
            const errorBody = await response
              .json()
              .catch(() => ({ message: response.statusText }));
            throw this.buildApiError(response.status, errorBody.message, response.headers, 'user');
          }

          let data: GitHubUser;
          try {
            data = (await response.json()) as GitHubUser;
          } catch {
            throw {
              message: 'Unexpected response format from GitHub API (invalid JSON payload).',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          if (!data || typeof data !== 'object' || typeof data.login !== 'string') {
            throw {
              message: 'Unexpected user profile response format from GitHub API.',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          return { data, rateLimit };
        } catch (err: unknown) {
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            throw err;
          }
          if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
            throw err;
          }
          const error: ApiError = {
            message:
              'Network connection failed. Please check your internet connectivity or try again later.',
          };
          throw error;
        }
      }
    );
  }

  /**
   * Fetch public repositories for user (`GET /users/{username}/repos`)
   */
  async getUserRepos(
    username: string,
    perPage: number = 30,
    page: number = 1,
    sort: 'pushed' | 'updated' | 'full_name' | 'created' = 'pushed',
    signalOrOptions?: AbortSignal | ServiceRequestOptions
  ): Promise<ServiceResponse<GitHubRepo[]>> {
    const options: ServiceRequestOptions =
      signalOrOptions && 'aborted' in signalOrOptions
        ? { signal: signalOrOptions }
        : (signalOrOptions ?? {});

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cacheKey = buildUserReposCacheKey(cleanUsername, perPage, page, sort);

    return this.executeWithCacheAndDedup<GitHubRepo[]>(
      cacheKey,
      CACHE_TTL_MS.repos,
      options,
      async (reqSignal) => {
        const url = new URL(`${this.baseUrl}/users/${encodeURIComponent(cleanUsername)}/repos`);
        url.searchParams.set('sort', sort);
        url.searchParams.set('per_page', perPage.toString());
        url.searchParams.set('page', page.toString());

        try {
          const response = await this.fetchFn(url.toString(), {
            headers: this.getHeaders(),
            signal: reqSignal,
          });

          const rateLimit = this.parseRateLimit(response);
          const linkHeader = response.headers.get('link');
          const hasNextPage = Boolean(linkHeader && linkHeader.includes('rel="next"'));

          if (!response.ok) {
            const errorBody = await response
              .json()
              .catch(() => ({ message: response.statusText }));
            throw this.buildApiError(
              response.status,
              errorBody.message,
              response.headers,
              'repos'
            );
          }

          let data: GitHubRepo[];
          try {
            data = (await response.json()) as GitHubRepo[];
          } catch {
            throw {
              message: 'Unexpected response format from GitHub API (invalid JSON payload).',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          if (!Array.isArray(data)) {
            throw {
              message: 'Unexpected repository list response format from GitHub API.',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          return { data, rateLimit, hasNextPage };
        } catch (err: unknown) {
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            throw err;
          }
          if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
            throw err;
          }
          const error: ApiError = {
            message: 'Network connection failed while fetching user repositories.',
          };
          throw error;
        }
      }
    );
  }

  /**
   * Fetch complete repository detail (`GET /repos/{owner}/{repo}`)
   */
  async getRepoDetail(
    owner: string,
    repo: string,
    signalOrOptions?: AbortSignal | ServiceRequestOptions
  ): Promise<ServiceResponse<GitHubRepo>> {
    const options: ServiceRequestOptions =
      signalOrOptions && 'aborted' in signalOrOptions
        ? { signal: signalOrOptions }
        : (signalOrOptions ?? {});

    const cleanOwner = owner.trim().toLowerCase();
    const cleanRepo = repo.trim();
    const cacheKey = buildRepoDetailCacheKey(cleanOwner, cleanRepo);

    return this.executeWithCacheAndDedup<GitHubRepo>(
      cacheKey,
      CACHE_TTL_MS.repoDetail,
      options,
      async (reqSignal) => {
        const url = `${this.baseUrl}/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}`;

        try {
          const response = await this.fetchFn(url, {
            headers: this.getHeaders(),
            signal: reqSignal,
          });

          const rateLimit = this.parseRateLimit(response);

          if (!response.ok) {
            const errorBody = await response
              .json()
              .catch(() => ({ message: response.statusText }));
            throw this.buildApiError(
              response.status,
              errorBody.message,
              response.headers,
              'repoDetail'
            );
          }

          let data: GitHubRepo;
          try {
            data = (await response.json()) as GitHubRepo;
          } catch {
            throw {
              message: 'Unexpected response format from GitHub API (invalid JSON payload).',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          if (!data || typeof data !== 'object' || typeof data.name !== 'string') {
            throw {
              message: 'Unexpected repository detail response format from GitHub API.',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          return { data, rateLimit };
        } catch (err: unknown) {
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            throw err;
          }
          if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
            throw err;
          }
          const error: ApiError = {
            message: 'Network connection failed while fetching repository details.',
          };
          throw error;
        }
      }
    );
  }

  /**
   * Fetch repository README (`GET /repos/{owner}/{repo}/readme`)
   */
  async getRepoReadme(
    owner: string,
    repo: string,
    signalOrOptions?: AbortSignal | ServiceRequestOptions
  ): Promise<ServiceResponse<ReadmeData | null>> {
    const options: ServiceRequestOptions =
      signalOrOptions && 'aborted' in signalOrOptions
        ? { signal: signalOrOptions }
        : (signalOrOptions ?? {});

    const cleanOwner = owner.trim().toLowerCase();
    const cleanRepo = repo.trim();
    const cacheKey = buildRepoReadmeCacheKey(cleanOwner, cleanRepo);

    return this.executeWithCacheAndDedup<ReadmeData | null>(
      cacheKey,
      CACHE_TTL_MS.readme,
      options,
      async (reqSignal) => {
        const url = `${this.baseUrl}/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/readme`;

        try {
          const response = await this.fetchFn(url, {
            headers: this.getHeaders(),
            signal: reqSignal,
          });

          const rateLimit = this.parseRateLimit(response);

          if (response.status === 404) {
            return { data: null, rateLimit };
          }

          if (!response.ok) {
            const errorBody = await response
              .json()
              .catch(() => ({ message: response.statusText }));
            throw this.buildApiError(
              response.status,
              errorBody.message,
              response.headers,
              'readme'
            );
          }

          let raw: Record<string, unknown>;
          try {
            raw = (await response.json()) as Record<string, unknown>;
          } catch {
            throw {
              message: 'Unexpected response format from GitHub API (invalid JSON payload).',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          if (!raw || typeof raw !== 'object') {
            throw {
              message: 'Unexpected README response format from GitHub API.',
              status: response.status,
              rateLimit,
            } satisfies ApiError;
          }

          let decodedContent = '';
          const rawContent = typeof raw.content === 'string' ? raw.content : '';
          if (rawContent && raw.encoding === 'base64') {
            try {
              const binaryString = atob(rawContent.replace(/\s/g, ''));
              const bytes = Uint8Array.from(binaryString, (m) => m.charCodeAt(0));
              decodedContent = new TextDecoder().decode(bytes);
            } catch {
              decodedContent = atob(rawContent.replace(/\s/g, ''));
            }
          } else if (rawContent) {
            decodedContent = rawContent;
          }

          const data: ReadmeData = {
            content: decodedContent,
            html_url: String(raw.html_url ?? ''),
            download_url: raw.download_url ? String(raw.download_url) : null,
            name: String(raw.name ?? 'README.md'),
            path: String(raw.path ?? 'README.md'),
            size: typeof raw.size === 'number' ? raw.size : decodedContent.length,
          };

          return { data, rateLimit };
        } catch (err: unknown) {
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            throw err;
          }
          if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
            throw err;
          }
          const error: ApiError = {
            message: 'Network connection failed while fetching repository README.',
          };
          throw error;
        }
      }
    );
  }

  /**
   * Check current GitHub API rate limit status
   */
  async getRateLimit(): Promise<RateLimitInfo | null> {
    try {
      const response = await this.fetchFn(`${this.baseUrl}/rate_limit`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      const json = await response.json();
      if (!json || !json.rate || typeof json.rate.limit !== 'number') {
        return null;
      }
      const info: RateLimitInfo = {
        limit: json.rate.limit,
        remaining: json.rate.remaining,
        reset: json.rate.reset,
        used: json.rate.used ?? 0,
      };
      this.lastKnownRateLimit = info;
      return info;
    } catch {
      return null;
    }
  }
}

export const githubService = new GitHubService();
