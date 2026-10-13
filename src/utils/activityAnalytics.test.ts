import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateActivityAnalytics } from './activityAnalytics';
import type { GitHubRepo } from '../types/github';

const referenceNow = new Date('2026-10-12T12:00:00Z');

const mockRepos: GitHubRepo[] = [
  {
    id: 101,
    name: 'repo-recent-push',
    full_name: 'test/repo-recent-push',
    private: false,
    html_url: 'https://github.com/test/repo-recent-push',
    description: 'Pushed 5 days ago',
    fork: false,
    url: '',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-10-08T00:00:00Z',
    pushed_at: '2026-10-07T12:00:00Z', // 5 days ago
    homepage: null,
    size: 100,
    stargazers_count: 50,
    watchers_count: 50,
    language: 'TypeScript',
    forks_count: 10,
    archived: false,
    disabled: false,
    open_issues_count: 2,
    license: null,
  },
  {
    id: 102,
    name: 'repo-recent-update-only',
    full_name: 'test/repo-recent-update-only',
    private: false,
    html_url: 'https://github.com/test/repo-recent-update-only',
    description: 'Updated 10 days ago, last pushed 1 year ago',
    fork: false,
    url: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-10-02T12:00:00Z', // 10 days ago
    pushed_at: '2025-01-01T00:00:00Z', // outside 30d window
    homepage: null,
    size: 50,
    stargazers_count: 2,
    watchers_count: 2,
    language: 'Python',
    forks_count: 0,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
  {
    id: 103,
    name: 'repo-dormant',
    full_name: 'test/repo-dormant',
    private: false,
    html_url: 'https://github.com/test/repo-dormant',
    description: 'Inactive for 2 years',
    fork: false,
    url: '',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-05-01T00:00:00Z',
    pushed_at: '2024-05-01T00:00:00Z',
    homepage: null,
    size: 10,
    stargazers_count: 0,
    watchers_count: 0,
    language: 'C',
    forks_count: 0,
    archived: true,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
  {
    id: 104,
    name: 'repo-60d-push',
    full_name: 'test/repo-60d-push',
    private: false,
    html_url: 'https://github.com/test/repo-60d-push',
    description: 'Pushed 60 days ago',
    fork: false,
    url: '',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-08-13T12:00:00Z',
    pushed_at: '2026-08-13T12:00:00Z', // 60 days ago
    homepage: null,
    size: 30,
    stargazers_count: 5,
    watchers_count: 5,
    language: 'Go',
    forks_count: 1,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
];

describe('calculateActivityAnalytics', () => {
  it('computes 30d window activity and distinguishes code pushes from metadata-only updates', () => {
    const res30d = calculateActivityAnalytics(mockRepos, {
      range: '30d',
      now: referenceNow,
      totalPublicRepos: 4,
    });

    assert.equal(res30d.totalReposInDataset, 4);
    assert.equal(res30d.activeReposCount, 2);
    assert.equal(res30d.pushedReposCount, 1);
    assert.equal(res30d.updatedOnlyReposCount, 1);
    assert.equal(res30d.recentActiveRepos.length, 2);
    assert.equal(res30d.recentActiveRepos[0].name, 'repo-recent-push');
    assert.equal(res30d.buckets.length, 5);
    assert.equal(res30d.isPartial, false);
  });

  it('computes 90d and 12m windows and flags partial pagination accurately', () => {
    const res90d = calculateActivityAnalytics(mockRepos, {
      range: '90d',
      now: referenceNow,
      totalPublicRepos: 4,
    });
    assert.equal(res90d.activeReposCount, 3);
    assert.equal(res90d.pushedReposCount, 2);
    assert.equal(res90d.buckets.length, 7);

    const res12m = calculateActivityAnalytics(mockRepos, {
      range: '12m',
      now: referenceNow,
      totalPublicRepos: 10,
    });
    assert.equal(res12m.buckets.length, 12);
    assert.equal(res12m.isPartial, true);
  });

  it('handles empty repository lists and invalid date strings safely', () => {
    const resEmpty = calculateActivityAnalytics([], { now: referenceNow });
    assert.equal(resEmpty.activeReposCount, 0);
    assert.equal(resEmpty.recentActiveRepos.length, 0);

    const brokenRepo: GitHubRepo = {
      ...mockRepos[0],
      id: 999,
      name: 'broken-timestamps',
      pushed_at: 'invalid-date',
      updated_at: '',
    };
    const resWithBroken = calculateActivityAnalytics([brokenRepo, mockRepos[0]], {
      range: '30d',
      now: referenceNow,
    });
    assert.equal(resWithBroken.activeReposCount, 1);
    assert.equal(resWithBroken.recentActiveRepos[0].name, 'repo-recent-push');
  });
});
