import type { GitHubRepo, GitHubUser, DashboardOverviewStats } from '../types/github';
import { calculateLanguageAnalytics } from './languageAnalytics';

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

    totalBatchStars += repo.stargazers_count;
    totalBatchForks += repo.forks_count;

    // Highest starred repo
    if (!mostStarredRepo || repo.stargazers_count > mostStarredRepo.stargazers_count) {
      mostStarredRepo = repo;
    }

    // Most recently pushed repo
    const currentPushTime = new Date(repo.pushed_at || repo.updated_at).getTime();
    const prevBestPushTime = mostRecentlyPushedRepo
      ? new Date(mostRecentlyPushedRepo.pushed_at || mostRecentlyPushedRepo.updated_at).getTime()
      : 0;

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
