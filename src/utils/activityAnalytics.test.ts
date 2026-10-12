import { calculateActivityAnalytics } from './activityAnalytics';
import type { GitHubRepo } from '../types/github';

function runTests() {
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
      pushed_at: '2026-10-07T12:00:00Z', // 5 days ago (in 30d window)
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
      description: 'Starred/updated 10 days ago, last pushed 1 year ago',
      fork: false,
      url: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2026-10-02T12:00:00Z', // 10 days ago (in 30d window)
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

  console.log('Testing calculateActivityAnalytics...');

  // Test 1: Past 30 Days window
  const res30d = calculateActivityAnalytics(mockRepos, {
    range: '30d',
    now: referenceNow,
    totalPublicRepos: 4,
  });

  console.assert(res30d.totalReposInDataset === 4, `Expected 4 repos, got ${res30d.totalReposInDataset}`);
  console.assert(res30d.activeReposCount === 2, `Expected 2 active repos in 30d, got ${res30d.activeReposCount}`);
  console.assert(res30d.pushedReposCount === 1, `Expected 1 pushed repo, got ${res30d.pushedReposCount}`);
  console.assert(res30d.updatedOnlyReposCount === 1, `Expected 1 updated-only repo, got ${res30d.updatedOnlyReposCount}`);
  console.assert(res30d.recentActiveRepos.length === 2, `Expected 2 recent repos, got ${res30d.recentActiveRepos.length}`);
  console.assert(res30d.recentActiveRepos[0].name === 'repo-recent-push', `Expected repo-recent-push first, got ${res30d.recentActiveRepos[0].name}`);
  console.assert(res30d.buckets.length === 5, `Expected 5 intervals in 30d, got ${res30d.buckets.length}`);

  // Test 2: Past 90 Days window
  const res90d = calculateActivityAnalytics(mockRepos, {
    range: '90d',
    now: referenceNow,
    totalPublicRepos: 4,
  });
  console.assert(res90d.activeReposCount === 3, `Expected 3 active repos in 90d (including 60d push), got ${res90d.activeReposCount}`);
  console.assert(res90d.pushedReposCount === 2, `Expected 2 pushed repos in 90d, got ${res90d.pushedReposCount}`);

  // Test 3: Past 12 Months window
  const res12m = calculateActivityAnalytics(mockRepos, {
    range: '12m',
    now: referenceNow,
    totalPublicRepos: 10,
  });
  console.assert(res12m.buckets.length === 12, `Expected 12 monthly buckets in 12m, got ${res12m.buckets.length}`);
  console.assert(res12m.isPartial === true, 'Expected isPartial true when dataset < totalPublicRepos');

  // Test 4: Empty list
  const resEmpty = calculateActivityAnalytics([], { now: referenceNow });
  console.assert(resEmpty.activeReposCount === 0, 'Expected 0 active repos for empty list');
  console.assert(resEmpty.recentActiveRepos.length === 0, 'Expected empty recent repos');

  console.log('All activity analytics unit tests passed successfully!');
}

runTests();
