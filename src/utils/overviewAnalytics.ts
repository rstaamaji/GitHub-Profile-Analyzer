import type { GitHubRepo, GitHubUser, DashboardOverviewStats } from '../types/github';
import { calculateLanguageAnalytics } from './languageAnalytics';
import { getSafeRepoTimestamp } from './repoFilterSort';

/**
 * Calculates aggregate developer overview metrics deterministically.
 *
 * RULES:
 * - Public Repos, Followers, Following, Public Gists come directly from GitHubUser payload.
 * - Fork / Original counts are calculated based on repo.fork on loaded repositories and explicitly labeled.
 * - Star aggregates are explicitly labeled as "from loaded repositories" rather than full lifetime stars.
 * - Identifies most starred and most recently updated/pushed repositories.
 * - Extracts top primary language using the established languageAnalytics utility.
 */
export function calculateOverviewStats(
  user: GitHubUser,
  repos: GitHubRepo[]
): DashboardOverviewStats {
  let originalReposCount = 0;
  let forkedReposCount = 0;
  let archivedReposCount = 0;
  let totalBatchStars = 0;
  let totalBatchForks = 0;

  let mostStarredRepo: GitHubRepo | null = null;
  let mostRecentlyPushedRepo: GitHubRepo | null = null;

  for (const repo of repos) {
    if (repo.fork) {
      forkedReposCount++;
    } else {
      originalReposCount++;
    }

    if (repo.archived) {
      archivedReposCount++;
    }

    const stars = repo.stargazers_count ?? 0;
    const forks = repo.forks_count ?? 0;
    totalBatchStars += stars;
    totalBatchForks += forks;

    // Highest starred repo
    if (!mostStarredRepo || stars > (mostStarredRepo.stargazers_count ?? 0)) {
      mostStarredRepo = repo;
    }

    // Most recently pushed repo (safe against empty/null/invalid timestamps)
    const currentPushTime = getSafeRepoTimestamp(repo);
    const prevBestPushTime = mostRecentlyPushedRepo
      ? getSafeRepoTimestamp(mostRecentlyPushedRepo)
      : -1;

    if (!mostRecentlyPushedRepo || currentPushTime > prevBestPushTime) {
      mostRecentlyPushedRepo = repo;
    }
  }

  // Language aggregation for loaded repositories (exclude forks by default)
  const langAnalytics = calculateLanguageAnalytics(repos, {
    excludeForks: true,
    totalPublicRepos: user.public_repos,
  });

  const isPartial = repos.length < user.public_repos;

  return {
    totalPublicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    publicGists: user.public_gists,
    totalLoadedRepos: repos.length,
    originalReposCount,
    forkedReposCount,
    archivedReposCount,
    totalBatchStars,
    totalBatchForks,
    mostStarredRepo,
    mostRecentlyPushedRepo,
    topLanguage: langAnalytics.topLanguage,
    isPartial,
  };
}
