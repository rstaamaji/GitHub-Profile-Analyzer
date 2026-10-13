import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOverviewStats } from './overviewAnalytics';
import type { GitHubRepo, GitHubUser } from '../types/github';

const mockUser: GitHubUser = {
  login: 'testdev',
  id: 1,
  avatar_url: '',
  html_url: 'https://github.com/testdev',
  name: 'Test Dev',
  company: 'Test Org',
  blog: null,
  location: 'Jakarta',
  email: null,
  hireable: true,
  bio: 'Software engineer',
  twitter_username: null,
  public_repos: 5,
  public_gists: 3,
  followers: 120,
  following: 45,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2026-10-12T00:00:00Z',
};

function createRepo(overrides: Partial<GitHubRepo> & { id: number; name: string }): GitHubRepo {
  return {
    id: overrides.id,
    name: overrides.name,
    full_name: `testdev/${overrides.name}`,
    private: false,
    html_url: `https://github.com/testdev/${overrides.name}`,
    description: overrides.description ?? null,
    fork: overrides.fork ?? false,
    url: '',
    created_at: overrides.created_at ?? '2024-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00Z',
    pushed_at: overrides.pushed_at ?? '2026-01-01T00:00:00Z',
    homepage: null,
    size: 100,
    stargazers_count: overrides.stargazers_count ?? 0,
    watchers_count: overrides.watchers_count ?? 0,
    language: overrides.language ?? null,
    forks_count: overrides.forks_count ?? 0,
    archived: overrides.archived ?? false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  };
}

describe('calculateOverviewStats', () => {
  it('aggregates repository counts, stars, forks, most starred, most recently pushed, and partial status', () => {
    const repos: GitHubRepo[] = [
      createRepo({
        id: 1,
        name: 'top-star-repo',
        stargazers_count: 500,
        forks_count: 50,
        language: 'TypeScript',
        pushed_at: '2026-05-01T00:00:00Z',
      }),
      createRepo({
        id: 2,
        name: 'recent-pushed-repo',
        stargazers_count: 20,
        forks_count: 5,
        language: 'TypeScript',
        pushed_at: '2026-10-11T12:00:00Z',
      }),
      createRepo({
        id: 3,
        name: 'forked-tool',
        fork: true,
        archived: true,
        stargazers_count: 5,
        forks_count: 1,
        language: 'Go',
        pushed_at: '2026-08-01T00:00:00Z',
      }),
    ];

    const stats = calculateOverviewStats(mockUser, repos);

    assert.equal(stats.totalPublicRepos, 5);
    assert.equal(stats.followers, 120);
    assert.equal(stats.publicGists, 3);
    assert.equal(stats.totalLoadedRepos, 3);
    assert.equal(stats.originalReposCount, 2);
    assert.equal(stats.forkedReposCount, 1);
    assert.equal(stats.archivedReposCount, 1);
    assert.equal(stats.totalBatchStars, 525);
    assert.equal(stats.totalBatchForks, 56);
    assert.equal(stats.mostStarredRepo?.name, 'top-star-repo');
    assert.equal(stats.mostRecentlyPushedRepo?.name, 'recent-pushed-repo');
    assert.equal(stats.topLanguage?.language, 'TypeScript');
    assert.equal(stats.isPartial, true);
  });

  it('handles empty repository list and 0 public repos without error', () => {
    const zeroRepoUser: GitHubUser = { ...mockUser, public_repos: 0 };
    const stats = calculateOverviewStats(zeroRepoUser, []);

    assert.equal(stats.totalPublicRepos, 0);
    assert.equal(stats.totalLoadedRepos, 0);
    assert.equal(stats.totalBatchStars, 0);
    assert.equal(stats.mostStarredRepo, null);
    assert.equal(stats.mostRecentlyPushedRepo, null);
    assert.equal(stats.topLanguage, null);
    assert.equal(stats.isPartial, false);
  });

  it('does not poison mostRecentlyPushedRepo when an earlier repo has empty or invalid timestamps', () => {
    const repos: GitHubRepo[] = [
      createRepo({
        id: 10,
        name: 'uninitialized-repo',
        pushed_at: '',
        updated_at: 'invalid-date',
        created_at: '',
      }),
      createRepo({
        id: 11,
        name: 'valid-recent-repo',
        pushed_at: '2026-09-15T10:00:00Z',
      }),
    ];

    const stats = calculateOverviewStats({ ...mockUser, public_repos: 2 }, repos);
    assert.equal(stats.mostRecentlyPushedRepo?.name, 'valid-recent-repo');
    assert.equal(stats.isPartial, false);
  });
});
