import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateMedian,
  calculateStarDistributionTiers,
  calculateDashboardInsights,
} from './dashboardInsights';
import type { GitHubRepo, GitHubUser } from '../types/github';

const mockUser: GitHubUser = {
  login: 'sampledev',
  id: 12345,
  avatar_url: 'https://avatars.githubusercontent.com/u/12345',
  html_url: 'https://github.com/sampledev',
  name: 'Sample Developer',
  company: 'Open Source Corp',
  blog: 'https://sample.dev',
  location: 'Earth',
  email: 'sample@dev.io',
  hireable: true,
  bio: 'Building open source software.',
  twitter_username: 'sampledev',
  public_repos: 5,
  public_gists: 1,
  followers: 250,
  following: 50,
  created_at: '2018-05-10T10:00:00Z',
  updated_at: '2026-10-01T12:00:00Z',
};

const now = Date.now();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const mockRepos: GitHubRepo[] = [
  {
    id: 1,
    name: 'top-star-repo',
    full_name: 'sampledev/top-star-repo',
    private: false,
    html_url: 'https://github.com/sampledev/top-star-repo',
    description: 'Flagship library with 500 stars',
    fork: false,
    url: 'https://api.github.com/repos/sampledev/top-star-repo',
    created_at: new Date(now - 120 * MS_PER_DAY).toISOString(),
    updated_at: new Date(now - 2 * MS_PER_DAY).toISOString(),
    pushed_at: new Date(now - 2 * MS_PER_DAY).toISOString(),
    homepage: null,
    size: 2048,
    stargazers_count: 500,
    watchers_count: 500,
    language: 'TypeScript',
    forks_count: 50,
    archived: false,
    disabled: false,
    open_issues_count: 4,
    license: { key: 'mit', name: 'MIT', spdx_id: 'MIT', url: null },
  },
  {
    id: 2,
    name: 'popular-tool',
    full_name: 'sampledev/popular-tool',
    private: false,
    html_url: 'https://github.com/sampledev/popular-tool',
    description: 'Helpful developer CLI',
    fork: false,
    url: 'https://api.github.com/repos/sampledev/popular-tool',
    created_at: new Date(now - 200 * MS_PER_DAY).toISOString(),
    updated_at: new Date(now - 15 * MS_PER_DAY).toISOString(),
    pushed_at: new Date(now - 15 * MS_PER_DAY).toISOString(),
    homepage: null,
    size: 512,
    stargazers_count: 45,
    watchers_count: 45,
    language: 'Go',
    forks_count: 10,
    archived: false,
    disabled: false,
    open_issues_count: 1,
    license: null,
  },
  {
    id: 3,
    name: 'experimental-fork',
    full_name: 'sampledev/experimental-fork',
    private: false,
    html_url: 'https://github.com/sampledev/experimental-fork',
    description: 'A contributed upstream fork',
    fork: true,
    url: 'https://api.github.com/repos/sampledev/experimental-fork',
    created_at: new Date(now - 300 * MS_PER_DAY).toISOString(),
    updated_at: new Date(now - 45 * MS_PER_DAY).toISOString(),
    pushed_at: new Date(now - 45 * MS_PER_DAY).toISOString(),
    homepage: null,
    size: 1024,
    stargazers_count: 5,
    watchers_count: 5,
    language: 'Rust',
    forks_count: 1,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
  {
    id: 4,
    name: 'legacy-archive',
    full_name: 'sampledev/legacy-archive',
    private: false,
    html_url: 'https://github.com/sampledev/legacy-archive',
    description: 'Archived tutorial repo',
    fork: false,
    url: 'https://api.github.com/repos/sampledev/legacy-archive',
    created_at: new Date(now - 500 * MS_PER_DAY).toISOString(),
    updated_at: new Date(now - 180 * MS_PER_DAY).toISOString(),
    pushed_at: new Date(now - 180 * MS_PER_DAY).toISOString(),
    homepage: null,
    size: 128,
    stargazers_count: 0,
    watchers_count: 0,
    language: null,
    forks_count: 0,
    archived: true,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
];

describe('dashboardInsights - calculateMedian', () => {
  it('returns 0 for empty array', () => {
    assert.strictEqual(calculateMedian([]), 0);
  });

  it('calculates median for odd-length numerical arrays', () => {
    assert.strictEqual(calculateMedian([5]), 5);
    assert.strictEqual(calculateMedian([1, 10, 20]), 10);
    assert.strictEqual(calculateMedian([500, 5, 45]), 45);
  });

  it('calculates average of two middle values for even-length arrays', () => {
    assert.strictEqual(calculateMedian([10, 20, 30, 40]), 25);
    assert.strictEqual(calculateMedian([0, 5, 45, 500]), 25);
  });
});

describe('dashboardInsights - calculateStarDistributionTiers', () => {
  it('categorizes repositories across four tiers correctly', () => {
    const tiers = calculateStarDistributionTiers(mockRepos);
    assert.strictEqual(tiers.length, 4);

    const tier100 = tiers.find((t) => t.rangeKey === '100+');
    const tier10 = tiers.find((t) => t.rangeKey === '10-99');
    const tier1 = tiers.find((t) => t.rangeKey === '1-9');
    const tier0 = tiers.find((t) => t.rangeKey === '0');

    assert.strictEqual(tier100?.count, 1); // 500
    assert.strictEqual(tier10?.count, 1);  // 45
    assert.strictEqual(tier1?.count, 1);   // 5
    assert.strictEqual(tier0?.count, 1);   // 0

    assert.strictEqual(tier100?.percentage, 25);
    assert.strictEqual(tier0?.percentage, 25);
  });

  it('handles empty repository array safely', () => {
    const tiers = calculateStarDistributionTiers([]);
    assert.strictEqual(tiers.length, 4);
    assert.strictEqual(tiers[0].count, 0);
    assert.strictEqual(tiers[0].percentage, 0);
  });
});

describe('dashboardInsights - calculateDashboardInsights', () => {
  it('computes accurate star metrics, concentration, and dominant repo', () => {
    const insights = calculateDashboardInsights(mockUser, mockRepos);

    assert.strictEqual(insights.totalLoadedRepos, 4);
    assert.strictEqual(insights.totalPublicRepos, 5);
    assert.strictEqual(insights.isPartial, true);

    // 500 + 45 + 5 + 0 = 550
    assert.strictEqual(insights.totalBatchStars, 550);
    assert.strictEqual(insights.averageStars, 137.5);
    assert.strictEqual(insights.medianStars, 25);

    // Dominant repo: top-star-repo has 500 of 550 = 91%
    assert.strictEqual(insights.dominantRepo?.name, 'top-star-repo');
    assert.strictEqual(insights.dominantRepo?.stars, 500);
    assert.strictEqual(insights.starConcentrationPercentage, 91);
  });

  it('computes accurate engagement and fork ratios', () => {
    const insights = calculateDashboardInsights(mockUser, mockRepos);

    // 50 + 10 + 1 + 0 = 61 forks
    assert.strictEqual(insights.totalBatchForks, 61);
    assert.strictEqual(insights.averageForks, 15.3);

    // 61 / 550 = 0.11
    assert.strictEqual(insights.forkToStarRatio, 0.11);
  });

  it('computes portfolio architecture breakdown', () => {
    const insights = calculateDashboardInsights(mockUser, mockRepos);

    assert.strictEqual(insights.originalCount, 3);
    assert.strictEqual(insights.forkedCount, 1);
    assert.strictEqual(insights.archivedCount, 1);

    assert.strictEqual(insights.originalPercentage, 75);
    assert.strictEqual(insights.forkedPercentage, 25);
    assert.strictEqual(insights.archivedPercentage, 25);
  });

  it('computes maintenance recency and push activity windows', () => {
    const insights = calculateDashboardInsights(mockUser, mockRepos);

    // Pushed in 30d: repo 1 (2d ago), repo 2 (15d ago) = 2 repos
    assert.strictEqual(insights.pushedIn30dCount, 2);
    assert.strictEqual(insights.pushedIn30dPercentage, 50);

    // Pushed in 90d: repo 1 (2d), repo 2 (15d), repo 3 (45d) = 3 repos
    assert.strictEqual(insights.pushedIn90dCount, 3);
    assert.strictEqual(insights.pushedIn90dPercentage, 75);

    // Most recent push was 2 days ago
    assert.strictEqual(insights.mostRecentPushDaysAgo, 2);
  });

  it('generates structured traceable insight items', () => {
    const insights = calculateDashboardInsights(mockUser, mockRepos);

    assert.ok(insights.insights.length >= 4);
    const starInsight = insights.insights.find((i) => i.id === 'stars-distribution');
    const ratioInsight = insights.insights.find((i) => i.id === 'engagement-ratio');
    const portfolioInsight = insights.insights.find((i) => i.id === 'portfolio-composition');
    const recencyInsight = insights.insights.find((i) => i.id === 'maintenance-recency');

    assert.ok(starInsight);
    assert.ok(starInsight?.value.includes('91%'));
    assert.ok(ratioInsight);
    assert.ok(portfolioInsight?.value.includes('75%'));
    assert.ok(recencyInsight?.description.includes('3 of 4'));
  });

  it('handles empty repositories gracefully with zero-safe defaults', () => {
    const emptyUser = { ...mockUser, public_repos: 0 };
    const insights = calculateDashboardInsights(emptyUser, []);

    assert.strictEqual(insights.totalLoadedRepos, 0);
    assert.strictEqual(insights.totalBatchStars, 0);
    assert.strictEqual(insights.averageStars, 0);
    assert.strictEqual(insights.medianStars, 0);
    assert.strictEqual(insights.forkToStarRatio, null);
    assert.strictEqual(insights.dominantRepo, null);
    assert.strictEqual(insights.mostRecentPushDaysAgo, null);
    assert.strictEqual(insights.insights.length, 0);
  });
});
