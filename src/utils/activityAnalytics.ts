import type {
  GitHubRepo,
  ActivityTimeRange,
  ActivityBucket,
  ActivityRepoItem,
  ActivityAnalyticsResult,
} from '../types/github';

export interface CalculateActivityOptions {
  range?: ActivityTimeRange;
  now?: Date; // Configurable current timestamp for deterministic unit tests
  totalPublicRepos?: number;
}

/**
 * Deterministically computes repository activity analytics from public repository
 * pushed_at and updated_at timestamps.
 *
 * EXACT METRIC DEFINITIONS:
 * - pushed_at: Timestamp of the most recent git push to the repository default branch or refs.
 *   Represents code push recency (though not necessarily by this user alone if shared).
 * - updated_at: Timestamp of the latest general repository update, which includes metadata edits,
 *   new issues/PRs, descriptions, starring, and push events.
 * - Distinct Repository Counts: In any bucket or summary, each repository is counted at most once
 *   even if multiple events occur.
 * - Time Range Boundaries:
 *   - 30d: 30 days prior to now, bucketed by 7-day calendar weeks (4-5 weekly buckets)
 *   - 90d: 90 days prior to now, bucketed by 2-week intervals (~6-7 intervals)
 *   - 12m: 365 days prior to now, bucketed by calendar months (12 monthly buckets)
 */
export function calculateActivityAnalytics(
  repos: GitHubRepo[],
  options: CalculateActivityOptions = {}
): ActivityAnalyticsResult {
  const { range = '30d', now = new Date(), totalPublicRepos = repos.length } = options;

  const nowMs = now.getTime();
  let windowDurationMs = 30 * 24 * 60 * 60 * 1000;
  if (range === '90d') {
    windowDurationMs = 90 * 24 * 60 * 60 * 1000;
  } else if (range === '12m') {
    windowDurationMs = 365 * 24 * 60 * 60 * 1000;
  }

  const cutoffTime = nowMs - windowDurationMs;

  // Filter repositories within the active time window
  const activeReposSet = new Set<number>();
  const pushedReposSet = new Set<number>();
  const updatedOnlyReposSet = new Set<number>();

  const eligibleRepos: ActivityRepoItem[] = [];

  for (const repo of repos) {
    const pushedTime = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;
    const updatedTime = repo.updated_at ? new Date(repo.updated_at).getTime() : 0;

    const isPushedInRange = pushedTime >= cutoffTime && pushedTime <= nowMs;
    const isUpdatedInRange = updatedTime >= cutoffTime && updatedTime <= nowMs;

    if (isPushedInRange || isUpdatedInRange) {
      activeReposSet.add(repo.id);

      if (isPushedInRange) {
        pushedReposSet.add(repo.id);
      } else {
        updatedOnlyReposSet.add(repo.id);
      }

      eligibleRepos.push({
        id: repo.id,
        name: repo.name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        pushedAt: repo.pushed_at || repo.updated_at,
        updatedAt: repo.updated_at,
        stargazersCount: repo.stargazers_count,
        fork: repo.fork,
      });
    }
  }

  // Deterministically sort recently active repositories: latest push desc, then name asc
  eligibleRepos.sort((a, b) => {
    const timeA = new Date(a.pushedAt).getTime();
    const timeB = new Date(b.pushedAt).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return a.name.localeCompare(b.name);
  });

  // Time Bucket Grouping
  const buckets = buildTimeBuckets(repos, range, cutoffTime, nowMs);

  const isPartial = repos.length < totalPublicRepos;

  return {
    range,
    totalReposInDataset: repos.length,
    activeReposCount: activeReposSet.size,
    pushedReposCount: pushedReposSet.size,
    updatedOnlyReposCount: updatedOnlyReposSet.size,
    buckets,
    recentActiveRepos: eligibleRepos.slice(0, 10), // Top 10 most recent
    isPartial,
    totalPublicRepos,
  };
}

function buildTimeBuckets(
  repos: GitHubRepo[],
  range: ActivityTimeRange,
  cutoffTime: number,
  nowMs: number
): ActivityBucket[] {
  if (range === '12m') {
    // 12 monthly buckets
    const buckets: ActivityBucket[] = [];
    const nowDate = new Date(nowMs);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const startMs = d.getTime();
      const endMs = nextMonth.getTime() - 1;

      const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Count distinct repos pushed or updated in this month
      const pushedSet = new Set<number>();
      const updatedSet = new Set<number>();

      for (const repo of repos) {
        const pTime = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;
        const uTime = repo.updated_at ? new Date(repo.updated_at).getTime() : 0;

        if (pTime >= startMs && pTime <= endMs) {
          pushedSet.add(repo.id);
        }
        if (uTime >= startMs && uTime <= endMs) {
          updatedSet.add(repo.id);
        }
      }

      buckets.push({
        periodLabel: label,
        periodKey: key,
        pushCount: pushedSet.size,
        updateCount: updatedSet.size,
      });
    }
    return buckets;
  }

  // 30d (approx 4 weeks) or 90d (approx 6-7 bi-weeks)
  const bucketCount = range === '30d' ? 5 : 7;
  const intervalMs = (nowMs - cutoffTime) / bucketCount;
  const buckets: ActivityBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const startMs = cutoffTime + i * intervalMs;
    const endMs = cutoffTime + (i + 1) * intervalMs;

    const startDate = new Date(startMs);
    const endDate = new Date(endMs);

    const startLabel = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endLabel = endDate.toLocaleDateString(undefined, { day: 'numeric' });
    const label = `${startLabel}-${endLabel}`;
    const key = startDate.toISOString().split('T')[0];

    const pushedSet = new Set<number>();
    const updatedSet = new Set<number>();

    for (const repo of repos) {
      const pTime = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;
      const uTime = repo.updated_at ? new Date(repo.updated_at).getTime() : 0;

      if (pTime >= startMs && pTime < endMs) {
        pushedSet.add(repo.id);
      }
      if (uTime >= startMs && uTime < endMs) {
        updatedSet.add(repo.id);
      }
    }

    buckets.push({
      periodLabel: label,
      periodKey: key,
      pushCount: pushedSet.size,
      updateCount: updatedSet.size,
    });
  }

  return buckets;
}
