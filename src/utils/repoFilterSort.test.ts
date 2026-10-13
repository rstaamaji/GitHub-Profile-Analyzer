import {
  extractAvailableLanguages,
  filterAndSortRepos,
  getSafeRepoTimestamp,
} from './repoFilterSort';
import type { GitHubRepo } from '../types/github';

function createMockRepo(overrides: Partial<GitHubRepo> & { id: number; name: string }): GitHubRepo {
  return {
    id: overrides.id,
    name: overrides.name,
    full_name: `user/${overrides.name}`,
    private: false,
    html_url: `https://github.com/user/${overrides.name}`,
    description: overrides.description ?? null,
    fork: overrides.fork ?? false,
    url: `https://api.github.com/repos/user/${overrides.name}`,
    created_at: overrides.created_at ?? '2023-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2025-01-01T00:00:00Z',
    pushed_at: overrides.pushed_at ?? '2025-01-01T00:00:00Z',
    homepage: overrides.homepage ?? null,
    size: overrides.size ?? 100,
    stargazers_count: overrides.stargazers_count ?? 0,
    watchers_count: overrides.watchers_count ?? 0,
    language: overrides.language ?? null,
    forks_count: overrides.forks_count ?? 0,
    archived: overrides.archived ?? false,
    disabled: overrides.disabled ?? false,
    open_issues_count: overrides.open_issues_count ?? 0,
    license: overrides.license ?? null,
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
  const mockRepos: GitHubRepo[] = [
    createMockRepo({
      id: 1,
      name: 'zeta-engine',
      description: 'Fast rendering engine in Rust',
      language: 'Rust',
      stargazers_count: 250,
      forks_count: 30,
      fork: false,
      archived: false,
      pushed_at: '2026-08-15T12:00:00Z',
    }),
    createMockRepo({
      id: 2,
      name: 'alpha-ui',
      description: 'Accessible React component library',
      language: 'TypeScript',
      stargazers_count: 45,
      forks_count: 12,
      fork: false,
      archived: false,
      pushed_at: '2026-10-01T09:00:00Z',
    }),
    createMockRepo({
      id: 3,
      name: 'beta-docs',
      description: null, // Null description
      language: null, // Null language
      stargazers_count: 5,
      forks_count: 2,
      fork: true, // Forked repo
      archived: false,
      pushed_at: '2025-03-10T00:00:00Z',
    }),
    createMockRepo({
      id: 4,
      name: 'gamma-legacy',
      description: 'Deprecated TypeScript CLI toolkit',
      language: 'TypeScript',
      stargazers_count: 120,
      forks_count: 40,
      fork: false,
      archived: true, // Archived repo
      pushed_at: '2024-01-20T00:00:00Z',
    }),
    createMockRepo({
      id: 5,
      name: 'delta-fork-ts',
      description: 'Forked TypeScript starter template',
      language: 'TypeScript',
      stargazers_count: 15,
      forks_count: 1,
      fork: true,
      archived: false,
      pushed_at: '2026-09-10T00:00:00Z',
    }),
  ];

  // 1. Test extractAvailableLanguages
  const langs = extractAvailableLanguages(mockRepos);
  assertEqual(
    langs,
    [
      ['TypeScript', 3],
      ['Rust', 1],
    ],
    'extractAvailableLanguages should count non-null languages and sort by count descending'
  );

  // 2. Test search by name and description (including null description safety)
  const searchByName = filterAndSortRepos(mockRepos, { searchQuery: 'BETA' });
  assertEqual(
    searchByName.map((r) => r.name),
    ['beta-docs'],
    'Search should match repository name case-insensitively even when description is null'
  );

  const searchByDescription = filterAndSortRepos(mockRepos, { searchQuery: 'rendering' });
  assertEqual(
    searchByDescription.map((r) => r.name),
    ['zeta-engine'],
    'Search should match repository description case-insensitively'
  );

  // 3. Test language filter
  const tsRepos = filterAndSortRepos(mockRepos, { language: 'TypeScript', sortBy: 'name' });
  assertEqual(
    tsRepos.map((r) => r.name),
    ['alpha-ui', 'delta-fork-ts', 'gamma-legacy'],
    'Language filter should return only matching repositories'
  );

  // 4. Test type filter (sources, forks, archived)
  const sourcesOnly = filterAndSortRepos(mockRepos, { type: 'sources', sortBy: 'name' });
  assertEqual(
    sourcesOnly.map((r) => r.name),
    ['alpha-ui', 'gamma-legacy', 'zeta-engine'],
    'Type filter "sources" should exclude forks'
  );

  const forksOnly = filterAndSortRepos(mockRepos, { type: 'forks', sortBy: 'name' });
  assertEqual(
    forksOnly.map((r) => r.name),
    ['beta-docs', 'delta-fork-ts'],
    'Type filter "forks" should include only forks'
  );

  const archivedOnly = filterAndSortRepos(mockRepos, { type: 'archived', sortBy: 'name' });
  assertEqual(
    archivedOnly.map((r) => r.name),
    ['gamma-legacy'],
    'Type filter "archived" should include only archived repositories'
  );

  // 5. Test minimum stars filter
  const minStars100 = filterAndSortRepos(mockRepos, { minStars: 100, sortBy: 'stars' });
  assertEqual(
    minStars100.map((r) => r.name),
    ['zeta-engine', 'gamma-legacy'],
    'minStars filter should exclude repositories below threshold'
  );

  // 6. Test combined filters simultaneously (search + language + type + minStars)
  const combined = filterAndSortRepos(mockRepos, {
    searchQuery: 'TypeScript',
    language: 'TypeScript',
    type: 'sources',
    minStars: 50,
  });
  assertEqual(
    combined.map((r) => r.name),
    ['gamma-legacy'],
    'All filters (search, language, type, minStars) must work together simultaneously'
  );

  // 7. Test sorting options
  const sortNameAsc = filterAndSortRepos(mockRepos, { sortBy: 'name' });
  assertEqual(
    sortNameAsc.map((r) => r.name),
    ['alpha-ui', 'beta-docs', 'delta-fork-ts', 'gamma-legacy', 'zeta-engine'],
    'Sort by name (A-Z) should order alphabetically ascending'
  );

  const sortNameDesc = filterAndSortRepos(mockRepos, { sortBy: 'name_desc' });
  assertEqual(
    sortNameDesc.map((r) => r.name),
    ['zeta-engine', 'gamma-legacy', 'delta-fork-ts', 'beta-docs', 'alpha-ui'],
    'Sort by name_desc (Z-A) should order alphabetically descending'
  );

  const sortStars = filterAndSortRepos(mockRepos, { sortBy: 'stars' });
  assertEqual(
    sortStars.map((r) => r.name),
    ['zeta-engine', 'gamma-legacy', 'alpha-ui', 'delta-fork-ts', 'beta-docs'],
    'Sort by stars should order by stargazers_count descending'
  );

  const sortForks = filterAndSortRepos(mockRepos, { sortBy: 'forks' });
  assertEqual(
    sortForks.map((r) => r.name),
    ['gamma-legacy', 'zeta-engine', 'alpha-ui', 'beta-docs', 'delta-fork-ts'],
    'Sort by forks should order by forks_count descending'
  );

  const sortNewest = filterAndSortRepos(mockRepos, { sortBy: 'pushed' });
  assertEqual(
    sortNewest.map((r) => r.name),
    ['alpha-ui', 'delta-fork-ts', 'zeta-engine', 'beta-docs', 'gamma-legacy'],
    'Sort by pushed should order by newest activity timestamp first'
  );

  const sortOldest = filterAndSortRepos(mockRepos, { sortBy: 'pushed_asc' });
  assertEqual(
    sortOldest.map((r) => r.name),
    ['gamma-legacy', 'beta-docs', 'zeta-engine', 'delta-fork-ts', 'alpha-ui'],
    'Sort by pushed_asc should order by oldest activity timestamp first'
  );

  // 8. Test safe timestamp fallback for missing/invalid dates
  const brokenDateRepo = createMockRepo({
    id: 99,
    name: 'broken-date',
    pushed_at: '',
    updated_at: 'invalid-date',
    created_at: '',
  });
  assertEqual(
    getSafeRepoTimestamp(brokenDateRepo),
    0,
    'getSafeRepoTimestamp should return 0 for missing or invalid dates without throwing'
  );

  console.log('✓ All repoFilterSort unit tests passed!');
}

runTests();
