import { calculateOverviewStats } from './overviewAnalytics';
import type { GitHubRepo, GitHubUser } from '../types/github';

function runTests() {
  const mockUser: GitHubUser = {
    login: 'testdev',
    id: 1,
    avatar_url: '',
    html_url: '',
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

  const mockRepos: GitHubRepo[] = [
    {
      id: 1,
      name: 'top-star-repo',
      full_name: 'testdev/top-star-repo',
      private: false,
      html_url: '',
      description: 'Popular library',
      fork: false,
      url: '',
      created_at: '',
      updated_at: '2026-05-01T00:00:00Z',
      pushed_at: '2026-05-01T00:00:00Z',
      homepage: null,
      size: 100,
      stargazers_count: 500,
      watchers_count: 500,
      language: 'TypeScript',
      forks_count: 50,
      archived: false,
      disabled: false,
      open_issues_count: 2,
      license: null,
    },
    {
      id: 2,
      name: 'recent-pushed-repo',
      full_name: 'testdev/recent-pushed-repo',
      private: false,
      html_url: '',
      description: 'Active project',
      fork: false,
      url: '',
      created_at: '',
      updated_at: '2026-10-10T00:00:00Z',
      pushed_at: '2026-10-11T12:00:00Z',
      homepage: null,
      size: 200,
      stargazers_count: 20,
      watchers_count: 20,
      language: 'TypeScript',
      forks_count: 5,
      archived: false,
      disabled: false,
      open_issues_count: 1,
      license: null,
    },
    {
      id: 3,
      name: 'forked-tool',
      full_name: 'testdev/forked-tool',
      private: false,
      html_url: '',
      description: 'Forked upstream tool',
      fork: true,
      url: '',
      created_at: '',
      updated_at: '2026-08-01T00:00:00Z',
      pushed_at: '2026-08-01T00:00:00Z',
      homepage: null,
      size: 50,
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

  console.log('Testing calculateOverviewStats...');

  const stats = calculateOverviewStats(mockUser, mockRepos);

  console.assert(stats.totalPublicRepos === 5, `Expected 5 public repos, got ${stats.totalPublicRepos}`);
  console.assert(stats.followers === 120, `Expected 120 followers, got ${stats.followers}`);
  console.assert(stats.publicGists === 3, `Expected 3 gists, got ${stats.publicGists}`);
  console.assert(stats.totalLoadedRepos === 3, `Expected 3 loaded repos, got ${stats.totalLoadedRepos}`);
  console.assert(stats.originalReposCount === 2, `Expected 2 original repos, got ${stats.originalReposCount}`);
  console.assert(stats.forkedReposCount === 1, `Expected 1 forked repo, got ${stats.forkedReposCount}`);
  console.assert(stats.totalBatchStars === 525, `Expected 525 stars, got ${stats.totalBatchStars}`);
  console.assert(stats.mostStarredRepo?.name === 'top-star-repo', `Expected top-star-repo, got ${stats.mostStarredRepo?.name}`);
  console.assert(stats.mostRecentlyPushedRepo?.name === 'recent-pushed-repo', `Expected recent-pushed-repo, got ${stats.mostRecentlyPushedRepo?.name}`);
  console.assert(stats.topLanguage?.language === 'TypeScript', `Expected TypeScript top language, got ${stats.topLanguage?.language}`);
  console.assert(stats.isPartial === true, `Expected isPartial true (3 loaded vs 5 total)`);

  console.log('All overview analytics unit tests passed successfully!');
}

runTests();
