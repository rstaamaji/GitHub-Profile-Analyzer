import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildRepoComparisonSummary,
} from './repoComparisonAnalytics';
import type { GitHubRepo } from '../types/github';

const mockRepos: GitHubRepo[] = [
  {
    id: 1,
    name: 'alpha-tool',
    full_name: 'test/alpha-tool',
    private: false,
    html_url: 'https://github.com/test/alpha-tool',
    description: 'First repository',
    fork: false,
    url: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    pushed_at: '2026-10-01T00:00:00Z',
    homepage: null,
    size: 500,
    stargazers_count: 100,
    watchers_count: 100,
    language: 'TypeScript',
    forks_count: 20,
    archived: false,
    disabled: false,
    open_issues_count: 5,
    license: null,
  },
  {
    id: 2,
    name: 'beta-tool',
    full_name: 'test/beta-tool',
    private: false,
    html_url: 'https://github.com/test/beta-tool',
    description: 'Second repository',
    fork: true,
    url: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    pushed_at: '2026-10-01T00:00:00Z',
    homepage: null,
    size: 2000,
    stargazers_count: 200,
    watchers_count: 200,
    language: 'Go',
    forks_count: 5,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
  {
    id: 3,
    name: 'gamma-tool',
    full_name: 'test/gamma-tool',
    private: false,
    html_url: 'https://github.com/test/gamma-tool',
    description: 'Third repository with zero stars',
    fork: false,
    url: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    pushed_at: '2026-10-01T00:00:00Z',
    homepage: null,
    size: 100,
    stargazers_count: 0,
    watchers_count: 0,
    language: null,
    forks_count: 0,
    archived: false,
    disabled: false,
    open_issues_count: 2,
    license: null,
  },
];

describe('repoComparisonAnalytics - buildRepoComparisonSummary', () => {
  it('sorts repositories by stars descending and calculates ratios', () => {
    const summary = buildRepoComparisonSummary(mockRepos, 'stars', 10);

    assert.strictEqual(summary.metric, 'stars');
    assert.strictEqual(summary.metricLabel, 'Stargazers');
    assert.strictEqual(summary.unit, 'stars');
    assert.strictEqual(summary.items.length, 3);

    // Order: beta-tool (200), alpha-tool (100), gamma-tool (0)
    assert.strictEqual(summary.items[0].name, 'beta-tool');
    assert.strictEqual(summary.items[0].stars, 200);
    assert.strictEqual(summary.items[0].ratioToMax, 100);

    assert.strictEqual(summary.items[1].name, 'alpha-tool');
    assert.strictEqual(summary.items[1].stars, 100);
    assert.strictEqual(summary.items[1].ratioToMax, 50);

    assert.strictEqual(summary.items[2].name, 'gamma-tool');
    assert.strictEqual(summary.items[2].stars, 0);
    assert.strictEqual(summary.items[2].ratioToMax, 0);

    // Summary statistics
    assert.strictEqual(summary.maxValue, 200);
    assert.strictEqual(summary.totalValue, 300);
    assert.strictEqual(summary.averageValue, 100);
    assert.strictEqual(summary.medianValue, 100);
    assert.strictEqual(summary.zeroCount, 1);
  });

  it('sorts repositories by forks descending', () => {
    const summary = buildRepoComparisonSummary(mockRepos, 'forks', 10);

    // Order: alpha-tool (20), beta-tool (5), gamma-tool (0)
    assert.strictEqual(summary.items[0].name, 'alpha-tool');
    assert.strictEqual(summary.items[0].forks, 20);
    assert.strictEqual(summary.maxValue, 20);
    assert.strictEqual(summary.totalValue, 25);
  });

  it('sorts repositories by size descending', () => {
    const summary = buildRepoComparisonSummary(mockRepos, 'size', 10);

    // Order: beta-tool (2000), alpha-tool (500), gamma-tool (100)
    assert.strictEqual(summary.items[0].name, 'beta-tool');
    assert.strictEqual(summary.items[0].sizeKb, 2000);
    assert.strictEqual(summary.maxValue, 2000);
    assert.strictEqual(summary.totalValue, 2600);
  });

  it('sorts repositories by open issues descending', () => {
    const summary = buildRepoComparisonSummary(mockRepos, 'issues', 10);

    // Order: alpha-tool (5), gamma-tool (2), beta-tool (0)
    assert.strictEqual(summary.items[0].name, 'alpha-tool');
    assert.strictEqual(summary.items[0].openIssues, 5);
    assert.strictEqual(summary.items[2].name, 'beta-tool');
    assert.strictEqual(summary.items[2].openIssues, 0);
    assert.strictEqual(summary.zeroCount, 1);
  });

  it('respects limit slicing parameter', () => {
    const summary = buildRepoComparisonSummary(mockRepos, 'stars', 2);
    assert.strictEqual(summary.items.length, 2);
    assert.strictEqual(summary.totalReposAvailable, 3);
  });

  it('handles empty repository array safely', () => {
    const summary = buildRepoComparisonSummary([], 'stars', 10);
    assert.strictEqual(summary.items.length, 0);
    assert.strictEqual(summary.maxValue, 0);
    assert.strictEqual(summary.medianValue, 0);
    assert.strictEqual(summary.averageValue, 0);
    assert.strictEqual(summary.totalValue, 0);
    assert.strictEqual(summary.zeroCount, 0);
  });
});
