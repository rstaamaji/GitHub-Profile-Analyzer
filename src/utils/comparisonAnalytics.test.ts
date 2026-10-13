import {
  buildMetricComparisonItem,
  calculateProfileComparison,
  validateComparisonInputs,
} from './comparisonAnalytics';
import type { GitHubRepo, GitHubUser } from '../types/github';

function createMockUser(overrides: Partial<GitHubUser> & { login: string; id: number }): GitHubUser {
  return {
    login: overrides.login,
    id: overrides.id,
    avatar_url: `https://avatars.githubusercontent.com/u/${overrides.id}`,
    html_url: `https://github.com/${overrides.login}`,
    name: overrides.name ?? overrides.login,
    company: overrides.company ?? null,
    blog: overrides.blog ?? null,
    location: overrides.location ?? null,
    email: null,
    hireable: null,
    bio: overrides.bio ?? null,
    twitter_username: null,
    public_repos: overrides.public_repos ?? 2,
    public_gists: overrides.public_gists ?? 1,
    followers: overrides.followers ?? 100,
    following: overrides.following ?? 10,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function createMockRepo(overrides: Partial<GitHubRepo> & { id: number; name: string }): GitHubRepo {
  return {
    id: overrides.id,
    name: overrides.name,
    full_name: `dev/${overrides.name}`,
    private: false,
    html_url: `https://github.com/dev/${overrides.name}`,
    description: overrides.description ?? null,
    fork: overrides.fork ?? false,
    url: `https://api.github.com/repos/dev/${overrides.name}`,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    pushed_at: '2026-01-01T00:00:00Z',
    homepage: null,
    size: 100,
    stargazers_count: overrides.stargazers_count ?? 0,
    watchers_count: overrides.stargazers_count ?? 0,
    language: overrides.language ?? null,
    forks_count: overrides.forks_count ?? 0,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  };
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`FAIL: ${message}\n  Expected: ${expectedStr}\n  Actual:   ${actualStr}`);
  }
}

function runTests() {
  // 1. Validate empty inputs
  const emptyBoth = validateComparisonInputs('  ', '');
  assertEqual(emptyBoth.isValid, false, 'Both empty inputs should be invalid');

  const emptyA = validateComparisonInputs('', 'torvalds');
  assertEqual(emptyA.isValid, false, 'Empty Developer A should be invalid');

  const emptyB = validateComparisonInputs('torvalds', '   ');
  assertEqual(emptyB.isValid, false, 'Empty Developer B should be invalid');

  // 2. Validate identical usernames (case-insensitive and @ prefix)
  const sameUser = validateComparisonInputs('@Torvalds ', 'torvalds');
  assertEqual(sameUser.isValid, false, 'Identical usernames (case-insensitive) should be invalid');

  // 3. Validate valid distinct usernames
  const validPair = validateComparisonInputs(' @torvalds ', 'gaearon ');
  assertEqual(validPair.isValid, true, 'Distinct usernames should be valid');
  assertEqual(validPair.normalizedUserA, 'torvalds', 'Should strip @ and whitespace for A');
  assertEqual(validPair.normalizedUserB, 'gaearon', 'Should strip @ and whitespace for B');

  // 4. Test buildMetricComparisonItem ratios and higherSide
  const metricItem = buildMetricComparisonItem({
    key: 'followers',
    label: 'Followers',
    valueA: 250,
    valueB: 1000,
  });
  assertEqual(metricItem.higherSide, 'B', 'Higher side should be B when B > A');
  assertEqual(metricItem.ratioA, 25, 'Ratio A should be 25% of max');
  assertEqual(metricItem.ratioB, 100, 'Ratio B should be 100% of max');
  assertEqual(metricItem.diffFormatted, '+750', 'Diff should be +750');

  // 5. Test full vs partial repository stars comparison and language overlap
  const userA = createMockUser({
    login: 'alice',
    id: 1,
    public_repos: 2, // Complete (2 loaded == 2 public_repos)
    followers: 300,
  });
  const reposA: GitHubRepo[] = [
    createMockRepo({ id: 101, name: 'alice-ts', language: 'TypeScript', stargazers_count: 80 }),
    createMockRepo({ id: 102, name: 'alice-rust', language: 'Rust', stargazers_count: 120 }),
  ];

  const userB = createMockUser({
    login: 'bob',
    id: 2,
    public_repos: 150, // Partial (only 2 loaded out of 150)
    followers: 150,
  });
  const reposB: GitHubRepo[] = [
    createMockRepo({ id: 201, name: 'bob-ts', language: 'TypeScript', stargazers_count: 40 }),
    createMockRepo({ id: 202, name: 'bob-py', language: 'Python', stargazers_count: 60 }),
  ];

  const comparison = calculateProfileComparison(
    { user: userA, repos: reposA },
    { user: userB, repos: reposB }
  );

  const starsMetric = comparison.metrics.find((m) => m.key === 'repo_stars');
  assertEqual(
    starsMetric?.label,
    'Repository Stars (Loaded Sample)',
    'Stars metric should be labeled as Loaded Sample when at least one profile is partial'
  );
  assertEqual(starsMetric?.isPartialA, false, 'Alice dataset is complete');
  assertEqual(starsMetric?.isPartialB, true, 'Bob dataset is partial');
  assertEqual(starsMetric?.valueA, 200, 'Alice total loaded stars should be 200');
  assertEqual(starsMetric?.valueB, 100, 'Bob total loaded stars should be 100');

  assertEqual(
    comparison.sharedLanguages,
    ['TypeScript'],
    'TypeScript should be identified as shared language'
  );
  assertEqual(
    comparison.uniqueLanguagesA,
    ['Rust'],
    'Rust should be unique to Alice'
  );
  assertEqual(
    comparison.uniqueLanguagesB,
    ['Python'],
    'Python should be unique to Bob'
  );
  assertEqual(
    comparison.statsA?.mostStarredRepo?.name,
    'alice-rust',
    'Alice most starred repo should be alice-rust'
  );
  assertEqual(
    comparison.statsB?.mostStarredRepo?.name,
    'bob-py',
    'Bob most starred repo should be bob-py'
  );

  // 6. Test partial failure (when one profile is null because its API call failed)
  const oneSideOnly = calculateProfileComparison({ user: userA, repos: reposA }, null);
  const followersOneSide = oneSideOnly.metrics.find((m) => m.key === 'followers');
  assertEqual(
    followersOneSide?.higherSide,
    'unavailable',
    'Comparison should mark higherSide as unavailable when one profile failed to load'
  );
  assertEqual(followersOneSide?.formattedA, '300', 'Loaded side should still format value');
  assertEqual(followersOneSide?.formattedB, 'N/A', 'Missing side should show N/A');

  console.log('✓ All comparisonAnalytics unit tests passed!');
}

runTests();
