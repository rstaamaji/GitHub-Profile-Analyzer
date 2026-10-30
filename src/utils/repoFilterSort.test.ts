import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countUnclassifiedLanguages,
  extractAvailableLanguages,
  filterAndSortRepos,
  getSafeCreationTimestamp,
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
    description: null,
    language: null,
    stargazers_count: 5,
    forks_count: 2,
    fork: true,
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
    archived: true,
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

describe('repoFilterSort utilities', () => {
  it('extractAvailableLanguages counts non-null languages and sorts by count desc then A-Z', () => {
    const langs = extractAvailableLanguages([
      ...mockRepos,
      createMockRepo({ id: 6, name: 'go-tool', language: 'Go' }),
      createMockRepo({ id: 7, name: 'blank-lang', language: '   ' }),
    ]);
    assert.deepEqual(langs, [
      ['TypeScript', 3],
      ['Go', 1],
      ['Rust', 1],
    ]);
  });

  it('filters repositories by keyword across name and description with null safety', () => {
    const byName = filterAndSortRepos(mockRepos, { searchQuery: '  BETA ' });
    assert.deepEqual(
      byName.map((r) => r.name),
      ['beta-docs']
    );

    const byDescription = filterAndSortRepos(mockRepos, { searchQuery: 'rendering' });
    assert.deepEqual(
      byDescription.map((r) => r.name),
      ['zeta-engine']
    );
  });

  it('filters repositories by primary programming language, type, and minimum stars', () => {
    const tsRepos = filterAndSortRepos(mockRepos, { language: 'TypeScript', sortBy: 'name' });
    assert.deepEqual(
      tsRepos.map((r) => r.name),
      ['alpha-ui', 'delta-fork-ts', 'gamma-legacy']
    );

    const sourcesOnly = filterAndSortRepos(mockRepos, { type: 'sources', sortBy: 'name' });
    assert.deepEqual(
      sourcesOnly.map((r) => r.name),
      ['alpha-ui', 'gamma-legacy', 'zeta-engine']
    );

    const forksOnly = filterAndSortRepos(mockRepos, { type: 'forks', sortBy: 'name' });
    assert.deepEqual(
      forksOnly.map((r) => r.name),
      ['beta-docs', 'delta-fork-ts']
    );

    const archivedOnly = filterAndSortRepos(mockRepos, { type: 'archived', sortBy: 'name' });
    assert.deepEqual(
      archivedOnly.map((r) => r.name),
      ['gamma-legacy']
    );

    const minStars100 = filterAndSortRepos(mockRepos, { minStars: 100, sortBy: 'stars' });
    assert.deepEqual(
      minStars100.map((r) => r.name),
      ['zeta-engine', 'gamma-legacy']
    );
  });

  it('applies combined search, language, type, and minStars filters simultaneously', () => {
    const combined = filterAndSortRepos(mockRepos, {
      searchQuery: 'TypeScript',
      language: 'TypeScript',
      type: 'sources',
      minStars: 50,
    });
    assert.deepEqual(
      combined.map((r) => r.name),
      ['gamma-legacy']
    );
  });

  it('sorts repositories deterministically by name, stars, forks, and update timestamps with tie-breaking', () => {
    assert.deepEqual(
      filterAndSortRepos(mockRepos, { sortBy: 'name' }).map((r) => r.name),
      ['alpha-ui', 'beta-docs', 'delta-fork-ts', 'gamma-legacy', 'zeta-engine']
    );

    assert.deepEqual(
      filterAndSortRepos(mockRepos, { sortBy: 'name_desc' }).map((r) => r.name),
      ['zeta-engine', 'gamma-legacy', 'delta-fork-ts', 'beta-docs', 'alpha-ui']
    );

    assert.deepEqual(
      filterAndSortRepos(mockRepos, { sortBy: 'stars' }).map((r) => r.name),
      ['zeta-engine', 'gamma-legacy', 'alpha-ui', 'delta-fork-ts', 'beta-docs']
    );

    assert.deepEqual(
      filterAndSortRepos(mockRepos, { sortBy: 'forks' }).map((r) => r.name),
      ['gamma-legacy', 'zeta-engine', 'alpha-ui', 'beta-docs', 'delta-fork-ts']
    );

    assert.deepEqual(
      filterAndSortRepos(mockRepos, { sortBy: 'pushed' }).map((r) => r.name),
      ['alpha-ui', 'delta-fork-ts', 'zeta-engine', 'beta-docs', 'gamma-legacy']
    );

    assert.deepEqual(
      filterAndSortRepos(mockRepos, { sortBy: 'pushed_asc' }).map((r) => r.name),
      ['gamma-legacy', 'beta-docs', 'zeta-engine', 'delta-fork-ts', 'alpha-ui']
    );

    // Tie-breaking by name when stars are equal
    const tiedStarRepos = [
      createMockRepo({ id: 10, name: 'z-repo', stargazers_count: 50 }),
      createMockRepo({ id: 11, name: 'a-repo', stargazers_count: 50 }),
    ];
    assert.deepEqual(
      filterAndSortRepos(tiedStarRepos, { sortBy: 'stars' }).map((r) => r.name),
      ['a-repo', 'z-repo']
    );
  });

  it('getSafeRepoTimestamp safely falls back across pushed_at, updated_at, created_at, and returns 0 on invalid dates', () => {
    const fallbackToUpdated = createMockRepo({
      id: 98,
      name: 'fallback-updated',
      pushed_at: '',
      updated_at: '2026-05-01T00:00:00Z',
    });
    assert.equal(getSafeRepoTimestamp(fallbackToUpdated), Date.parse('2026-05-01T00:00:00Z'));

    const brokenDateRepo = createMockRepo({
      id: 99,
      name: 'broken-date',
      pushed_at: '',
      updated_at: 'invalid-date',
      created_at: '',
    });
    assert.equal(getSafeRepoTimestamp(brokenDateRepo), 0);
  });

  it('countUnclassifiedLanguages counts repositories with null, undefined, or blank language strings', () => {
    const mixed = [
      createMockRepo({ id: 101, name: 'repo-null', language: null }),
      createMockRepo({ id: 102, name: 'repo-empty', language: '' }),
      createMockRepo({ id: 103, name: 'repo-spaces', language: '   ' }),
      createMockRepo({ id: 104, name: 'repo-ts', language: 'TypeScript' }),
      createMockRepo({ id: 105, name: 'repo-python', language: 'Python' }),
    ];
    assert.equal(countUnclassifiedLanguages(mixed), 3);
    assert.equal(countUnclassifiedLanguages([]), 0);
  });

  it('getSafeCreationTimestamp safely returns creation epoch and handles invalid or missing values', () => {
    const validRepo = createMockRepo({
      id: 201,
      name: 'created-valid',
      created_at: '2024-06-15T10:30:00Z',
    });
    assert.equal(getSafeCreationTimestamp(validRepo), Date.parse('2024-06-15T10:30:00Z'));

    const invalidRepo = createMockRepo({
      id: 202,
      name: 'created-invalid',
      created_at: 'not-a-date',
    });
    assert.equal(getSafeCreationTimestamp(invalidRepo), 0);

    const emptyRepo = createMockRepo({
      id: 203,
      name: 'created-empty',
      created_at: '',
    });
    assert.equal(getSafeCreationTimestamp(emptyRepo), 0);
  });

  it('filters repositories by minimum forks count', () => {
    const forkRepos = [
      createMockRepo({ id: 301, name: 'zero-forks', forks_count: 0 }),
      createMockRepo({ id: 302, name: 'ten-forks', forks_count: 10 }),
      createMockRepo({ id: 303, name: 'fifty-forks', forks_count: 50 }),
      createMockRepo({ id: 304, name: 'hundred-forks', forks_count: 100 }),
    ];

    const min10 = filterAndSortRepos(forkRepos, { minForks: 10, sortBy: 'forks' });
    assert.deepEqual(min10.map((r) => r.name), ['hundred-forks', 'fifty-forks', 'ten-forks']);

    const min50 = filterAndSortRepos(forkRepos, { minForks: 50, sortBy: 'forks' });
    assert.deepEqual(min50.map((r) => r.name), ['hundred-forks', 'fifty-forks']);

    const min200 = filterAndSortRepos(forkRepos, { minForks: 200 });
    assert.deepEqual(min200, []);
  });

  it('filters repositories by activity range (30d, 90d, 1y, all)', () => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const timeRepos = [
      createMockRepo({
        id: 401,
        name: 'recent-10d',
        pushed_at: new Date(now - 10 * MS_PER_DAY).toISOString(),
      }),
      createMockRepo({
        id: 402,
        name: 'mid-60d',
        pushed_at: new Date(now - 60 * MS_PER_DAY).toISOString(),
      }),
      createMockRepo({
        id: 403,
        name: 'past-200d',
        pushed_at: new Date(now - 200 * MS_PER_DAY).toISOString(),
      }),
      createMockRepo({
        id: 404,
        name: 'old-500d',
        pushed_at: new Date(now - 500 * MS_PER_DAY).toISOString(),
      }),
      createMockRepo({
        id: 405,
        name: 'no-timestamp',
        pushed_at: '',
        updated_at: '',
        created_at: '',
      }),
    ];

    const within30 = filterAndSortRepos(timeRepos, { activityRange: '30d' });
    assert.deepEqual(within30.map((r) => r.name), ['recent-10d']);

    const within90 = filterAndSortRepos(timeRepos, { activityRange: '90d', sortBy: 'name' });
    assert.deepEqual(within90.map((r) => r.name), ['mid-60d', 'recent-10d']);

    const within1y = filterAndSortRepos(timeRepos, { activityRange: '1y', sortBy: 'name' });
    assert.deepEqual(within1y.map((r) => r.name), ['mid-60d', 'past-200d', 'recent-10d']);

    const allRepos = filterAndSortRepos(timeRepos, { activityRange: 'all' });
    assert.equal(allRepos.length, 5);
  });
});
