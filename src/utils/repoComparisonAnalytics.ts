import type {
  GitHubRepo,
  RepoComparisonMetric,
  RepoComparisonItem,
} from '../types/github';
import { calculateMedian } from './dashboardInsights';

export interface RepoComparisonSummary {
  metric: RepoComparisonMetric;
  metricLabel: string;
  unit: string;
  items: Array<RepoComparisonItem & { ratioToMax: number }>;
  maxValue: number;
  medianValue: number;
  averageValue: number;
  totalValue: number;
  zeroCount: number;
  totalReposAvailable: number;
}

export const METRIC_CONFIG: Record<
  RepoComparisonMetric,
  { label: string; unit: string; extractor: (repo: GitHubRepo) => number }
> = {
  stars: {
    label: 'Stargazers',
    unit: 'stars',
    extractor: (r) => r.stargazers_count ?? 0,
  },
  forks: {
    label: 'Network Forks',
    unit: 'forks',
    extractor: (r) => r.forks_count ?? 0,
  },
  issues: {
    label: 'Open Issues & PRs',
    unit: 'issues',
    extractor: (r) => r.open_issues_count ?? 0,
  },
  size: {
    label: 'Repository Size',
    unit: 'KB',
    extractor: (r) => r.size ?? 0,
  },
};

/**
 * Normalizes and extracts comparison items for a specific metric across loaded repositories.
 */
export function buildRepoComparisonSummary(
  repos: GitHubRepo[],
  metric: RepoComparisonMetric = 'stars',
  limit: number = 10
): RepoComparisonSummary {
  const config = METRIC_CONFIG[metric] || METRIC_CONFIG.stars;

  // Map to structured items
  const mapped: RepoComparisonItem[] = repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    sizeKb: repo.size ?? 0,
    pushedAt: repo.pushed_at,
    isFork: repo.fork,
    isArchived: repo.archived,
  }));

  // Sort descending by selected metric, tie-breaking by name ascending
  const sorted = [...mapped].sort((a, b) => {
    const valA =
      metric === 'stars'
        ? a.stars
        : metric === 'forks'
          ? a.forks
          : metric === 'issues'
            ? a.openIssues
            : a.sizeKb;
    const valB =
      metric === 'stars'
        ? b.stars
        : metric === 'forks'
          ? b.forks
          : metric === 'issues'
            ? b.openIssues
            : b.sizeKb;

    if (valB !== valA) {
      return valB - valA;
    }
    return a.name.localeCompare(b.name);
  });

  const sliced = limit > 0 ? sorted.slice(0, limit) : sorted;

  // Extract metric numerical values for statistics
  const values = sliced.map((item) => {
    if (metric === 'stars') return item.stars;
    if (metric === 'forks') return item.forks;
    if (metric === 'issues') return item.openIssues;
    return item.sizeKb;
  });

  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const totalValue = values.reduce((sum, v) => sum + v, 0);
  const averageValue =
    values.length > 0 ? Math.round((totalValue / values.length) * 10) / 10 : 0;
  const medianValue = calculateMedian(values);
  const zeroCount = values.filter((v) => v === 0).length;

  // Calculate ratio to max (0 to 100) for visual comparative bars
  const itemsWithRatio = sliced.map((item) => {
    const val =
      metric === 'stars'
        ? item.stars
        : metric === 'forks'
          ? item.forks
          : metric === 'issues'
            ? item.openIssues
            : item.sizeKb;

    const ratioToMax = maxValue > 0 ? Math.round((val / maxValue) * 100) : 0;
    return {
      ...item,
      ratioToMax,
    };
  });

  return {
    metric,
    metricLabel: config.label,
    unit: config.unit,
    items: itemsWithRatio,
    maxValue,
    medianValue,
    averageValue,
    totalValue,
    zeroCount,
    totalReposAvailable: repos.length,
  };
}
