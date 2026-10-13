import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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

describe('comparisonAnalytics utilities', () => {
  it('validates empty and identical usernames and normalizes valid pairs', () => {
    assert.equal(validateComparisonInputs('  ', '').isValid, false);
    assert.equal(validateComparisonInputs('', 'torvalds').isValid, false);
    assert.equal(validateComparisonInputs('torvalds', '   ').isValid, false);
    assert.equal(validateComparisonInputs('@Torvalds ', 'torvalds').isValid, false);

    const validPair = validateComparisonInputs(' @torvalds ', 'gaearon ');
    assert.equal(validPair.isValid, true);
    assert.equal(validPair.normalizedUserA, 'torvalds');
    assert.equal(validPair.normalizedUserB, 'gaearon');
  });

  it('builds metric comparison items with normalized 0-100 visual ratios and equal/zero handling', () => {
    const metricItem = buildMetricComparisonItem({
      key: 'followers',
      label: 'Followers',
      valueA: 250,
      valueB: 1000,
    });
    assert.equal(metricItem.higherSide, 'B');
    assert.equal(metricItem.ratioA, 25);
    assert.equal(metricItem.ratioB, 100);
    assert.equal(metricItem.diffFormatted, '+750');

    const equalZeros = buildMetricComparisonItem({
      key: 'gists',
      label: 'Public Gists',
      valueA: 0,
      valueB: 0,
    });
    assert.equal(equalZeros.higherSide, 'equal');
    assert.equal(equalZeros.ratioA, 0);
    assert.equal(equalZeros.ratioB, 0);
  });

  it('compares full vs partial repository datasets and identifies shared and unique languages', () => {
    const userA = createMockUser({
      login: 'alice',
      id: 1,
      public_repos: 2,
      followers: 300,
    });
    const reposA: GitHubRepo[] = [
      createMockRepo({ id: 101, name: 'alice-ts', language: 'TypeScript', stargazers_count: 80 }),
      createMockRepo({ id: 102, name: 'alice-rust', language: 'Rust', stargazers_count: 120 }),
    ];

    const userB = createMockUser({
      login: 'bob',
      id: 2,
      public_repos: 150, // Partial dataset (2 of 150 loaded)
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
    assert.equal(starsMetric?.label, 'Repository Stars (Loaded Sample)');
    assert.equal(starsMetric?.isPartialA, false);
    assert.equal(starsMetric?.isPartialB, true);
    assert.equal(starsMetric?.valueA, 200);
    assert.equal(starsMetric?.valueB, 100);

    assert.deepEqual(comparison.sharedLanguages, ['TypeScript']);
    assert.deepEqual(comparison.uniqueLanguagesA, ['Rust']);
    assert.deepEqual(comparison.uniqueLanguagesB, ['Python']);
    assert.equal(comparison.statsA?.mostStarredRepo?.name, 'alice-rust');
    assert.equal(comparison.statsB?.mostStarredRepo?.name, 'bob-py');
  });

  it('handles partial comparison when one profile fails to load', () => {
    const userA = createMockUser({ login: 'alice', id: 1, followers: 300 });
    const reposA = [createMockRepo({ id: 101, name: 'alice-ts', language: 'TypeScript' })];

    const oneSideOnly = calculateProfileComparison({ user: userA, repos: reposA }, null);
    const followersOneSide = oneSideOnly.metrics.find((m) => m.key === 'followers');
    assert.equal(followersOneSide?.higherSide, 'unavailable');
    assert.equal(followersOneSide?.formattedA, '300');
    assert.equal(followersOneSide?.formattedB, 'N/A');
  });
});
