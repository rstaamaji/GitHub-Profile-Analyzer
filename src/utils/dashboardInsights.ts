import type {
  GitHubRepo,
  GitHubUser,
  DashboardAnalyticsInsights,
  StarDistributionTier,
  DashboardInsightItem,
} from '../types/github';
import { getSafeRepoTimestamp } from './repoFilterSort';

/**
 * Calculates the median value of a numerical array deterministically.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

/**
 * Categorizes repositories into star distribution tiers (100+, 10-99, 1-9, 0 stars).
 */
export function calculateStarDistributionTiers(repos: GitHubRepo[]): StarDistributionTier[] {
  const counts = {
    '100+': 0,
    '10-99': 0,
    '1-9': 0,
    '0': 0,
  };

  for (const repo of repos) {
    const stars = repo.stargazers_count ?? 0;
    if (stars >= 100) {
      counts['100+']++;
    } else if (stars >= 10) {
      counts['10-99']++;
    } else if (stars >= 1) {
      counts['1-9']++;
    } else {
      counts['0']++;
    }
  }

  const total = repos.length || 1;
  return [
    {
      label: '100+ stars',
      rangeKey: '100+',
      count: counts['100+'],
      percentage: Math.round((counts['100+'] / total) * 100),
    },
    {
      label: '10–99 stars',
      rangeKey: '10-99',
      count: counts['10-99'],
      percentage: Math.round((counts['10-99'] / total) * 100),
    },
    {
      label: '1–9 stars',
      rangeKey: '1-9',
      count: counts['1-9'],
      percentage: Math.round((counts['1-9'] / total) * 100),
    },
    {
      label: '0 stars',
      rangeKey: '0',
      count: counts['0'],
      percentage: Math.round((counts['0'] / total) * 100),
    },
  ];
}

/**
 * Deterministically computes comprehensive dashboard insights and metrics
 * strictly from actual GitHub API payloads without speculative or qualitative inferences.
 */
export function calculateDashboardInsights(
  user: GitHubUser,
  repos: GitHubRepo[]
): DashboardAnalyticsInsights {
  const totalLoaded = repos.length;
  const totalPublic = user.public_repos;
  const isPartial = totalLoaded < totalPublic;

  // 1. Star metrics
  const starValues = repos.map((r) => r.stargazers_count ?? 0);
  const totalBatchStars = starValues.reduce((acc, curr) => acc + curr, 0);
  const averageStars = totalLoaded > 0 ? Math.round((totalBatchStars / totalLoaded) * 10) / 10 : 0;
  const medianStars = calculateMedian(starValues);

  let dominantRepo: { name: string; stars: number } | null = null;
  if (totalLoaded > 0) {
    const sortedByStars = [...repos].sort(
      (a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0)
    );
    const top = sortedByStars[0];
    if ((top.stargazers_count ?? 0) > 0) {
      dominantRepo = {
        name: top.name,
        stars: top.stargazers_count ?? 0,
      };
    }
  }

  const starConcentrationPercentage =
    totalBatchStars > 0 && dominantRepo
      ? Math.round((dominantRepo.stars / totalBatchStars) * 100)
      : 0;

  const starTiers = calculateStarDistributionTiers(repos);

  // 2. Fork metrics & Engagement ratio
  const forkValues = repos.map((r) => r.forks_count ?? 0);
  const totalBatchForks = forkValues.reduce((acc, curr) => acc + curr, 0);
  const averageForks = totalLoaded > 0 ? Math.round((totalBatchForks / totalLoaded) * 10) / 10 : 0;
  const forkToStarRatio =
    totalBatchStars > 0 ? Math.round((totalBatchForks / totalBatchStars) * 100) / 100 : null;

  // 3. Portfolio composition
  let originalCount = 0;
  let forkedCount = 0;
  let archivedCount = 0;

  for (const r of repos) {
    if (r.fork) {
      forkedCount++;
    } else {
      originalCount++;
    }
    if (r.archived) {
      archivedCount++;
    }
  }

  const originalPercentage = totalLoaded > 0 ? Math.round((originalCount / totalLoaded) * 100) : 0;
  const forkedPercentage = totalLoaded > 0 ? Math.round((forkedCount / totalLoaded) * 100) : 0;
  const archivedPercentage =
    totalLoaded > 0 ? Math.round((archivedCount / totalLoaded) * 100) : 0;

  // 4. Activity & Recency
  const now = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * MS_PER_DAY;
  const NINETY_DAYS_MS = 90 * MS_PER_DAY;

  let pushedIn30dCount = 0;
  let pushedIn90dCount = 0;
  let mostRecentPushTimestamp = 0;

  for (const repo of repos) {
    const timestamp = getSafeRepoTimestamp(repo);
    if (timestamp > mostRecentPushTimestamp) {
      mostRecentPushTimestamp = timestamp;
    }

    const elapsed = now - timestamp;
    if (timestamp > 0 && elapsed <= THIRTY_DAYS_MS) {
      pushedIn30dCount++;
    }
    if (timestamp > 0 && elapsed <= NINETY_DAYS_MS) {
      pushedIn90dCount++;
    }
  }

  const pushedIn30dPercentage =
    totalLoaded > 0 ? Math.round((pushedIn30dCount / totalLoaded) * 100) : 0;
  const pushedIn90dPercentage =
    totalLoaded > 0 ? Math.round((pushedIn90dCount / totalLoaded) * 100) : 0;

  const mostRecentPushDaysAgo =
    mostRecentPushTimestamp > 0
      ? Math.max(0, Math.floor((now - mostRecentPushTimestamp) / MS_PER_DAY))
      : null;

  // 5. Build structured analytical insight items (traceable, no subjective claims)
  const insights: DashboardInsightItem[] = [];

  // Insight A: Star Concentration
  if (totalLoaded > 0) {
    if (totalBatchStars === 0) {
      insights.push({
        id: 'stars-distribution',
        category: 'stars',
        title: 'Star Distribution',
        value: '0 stars',
        description: 'None of the loaded repositories have recorded stargazers yet.',
        sentiment: 'neutral',
      });
    } else if (dominantRepo && starConcentrationPercentage >= 65) {
      insights.push({
        id: 'stars-distribution',
        category: 'stars',
        title: 'Star Concentration',
        value: `${starConcentrationPercentage}% in Top Repo`,
        description: `${dominantRepo.name} accounts for ${dominantRepo.stars.toLocaleString()} of ${totalBatchStars.toLocaleString()} total batch stars.`,
        contextNote: `${totalLoaded} repositories loaded`,
        sentiment: 'info',
      });
    } else {
      insights.push({
        id: 'stars-distribution',
        category: 'stars',
        title: 'Distributed Stargazers',
        value: `${medianStars} median stars`,
        description: `Stars are distributed across multiple repositories; top repo represents ${starConcentrationPercentage}% of batch stars.`,
        contextNote: `Average ${averageStars} stars/repo`,
        sentiment: 'positive',
      });
    }
  }

  // Insight B: Fork & Community Engagement Ratio
  if (totalLoaded > 0) {
    if (forkToStarRatio !== null) {
      insights.push({
        id: 'engagement-ratio',
        category: 'engagement',
        title: 'Fork-to-Star Ratio',
        value: `1 : ${(1 / (forkToStarRatio || 0.01)).toFixed(1)}`,
        description: `Batch average of ${forkToStarRatio} forks per star (${totalBatchForks.toLocaleString()} forks / ${totalBatchStars.toLocaleString()} stars).`,
        sentiment: 'info',
      });
    } else {
      insights.push({
        id: 'engagement-ratio',
        category: 'engagement',
        title: 'Fork Engagement',
        value: `${totalBatchForks} forks total`,
        description: `${averageForks} average forks per loaded repository.`,
        sentiment: 'neutral',
      });
    }
  }

  // Insight C: Portfolio Architecture
  if (totalLoaded > 0) {
    insights.push({
      id: 'portfolio-composition',
      category: 'portfolio',
      title: 'Repository Composition',
      value: `${originalPercentage}% Original`,
      description: `${originalCount} original source ${originalCount === 1 ? 'repo' : 'repos'} and ${forkedCount} ${forkedCount === 1 ? 'fork' : 'forks'}${archivedCount > 0 ? `, ${archivedCount} archived` : ''}.`,
      contextNote: `${totalLoaded} analyzed`,
      sentiment: 'neutral',
    });
  }

  // Insight D: Maintenance Recency
  if (totalLoaded > 0 && mostRecentPushDaysAgo !== null) {
    const recencyText =
      mostRecentPushDaysAgo === 0
        ? 'Today'
        : mostRecentPushDaysAgo === 1
          ? 'Yesterday'
          : `${mostRecentPushDaysAgo} days ago`;

    insights.push({
      id: 'maintenance-recency',
      category: 'activity',
      title: 'Recent Push Recency',
      value: recencyText,
      description: `${pushedIn90dCount} of ${totalLoaded} repositories (${pushedIn90dPercentage}%) recorded code pushes in the past 90 days.`,
      contextNote: `${pushedIn30dCount} pushed in 30 days`,
      sentiment: pushedIn90dPercentage >= 50 ? 'positive' : 'neutral',
    });
  }

  return {
    totalLoadedRepos: totalLoaded,
    totalPublicRepos: totalPublic,
    isPartial,
    totalBatchStars,
    averageStars,
    medianStars,
    starConcentrationPercentage,
    dominantRepo,
    starTiers,
    totalBatchForks,
    averageForks,
    forkToStarRatio,
    originalCount,
    forkedCount,
    archivedCount,
    originalPercentage,
    forkedPercentage,
    archivedPercentage,
    pushedIn30dCount,
    pushedIn90dCount,
    pushedIn30dPercentage,
    pushedIn90dPercentage,
    mostRecentPushDaysAgo,
    insights,
  };
}
