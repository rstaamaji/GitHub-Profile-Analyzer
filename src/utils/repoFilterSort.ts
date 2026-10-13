import type { GitHubRepo, RepoFilterOptions } from '../types/github';

/**
 * Safely parses the last activity timestamp for a repository.
 * Prefers pushed_at, falls back to updated_at or created_at, and returns 0 if invalid/missing.
 */
export function getSafeRepoTimestamp(repo: GitHubRepo): number {
  const dateStr = repo.pushed_at || repo.updated_at || repo.created_at;
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Extracts distinct non-null programming languages from a repository list,
 * sorted by repository count descending, then alphabetically A-Z.
 */
export function extractAvailableLanguages(repos: GitHubRepo[]): Array<[string, number]> {
  const langCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language && repo.language.trim() !== '') {
      const lang = repo.language.trim();
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }
  }
  return Object.entries(langCounts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

/**
 * Deterministically filters and sorts a list of repositories based on user-selected criteria.
 * Safely handles null descriptions, null languages, and identical timestamps.
 */
export function filterAndSortRepos(
  repos: GitHubRepo[],
  options: RepoFilterOptions = {}
): GitHubRepo[] {
  const {
    searchQuery = '',
    language = 'all',
    type = 'all',
    minStars = 0,
    sortBy = 'pushed',
  } = options;

  const query = searchQuery.trim().toLowerCase();

  return repos
    .filter((repo) => {
      // 1. Search by name and description (safe null handling)
      if (query) {
        const matchName = (repo.name || '').toLowerCase().includes(query);
        const matchDesc = (repo.description || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      // 2. Filter by primary programming language
      if (language !== 'all') {
        if (!repo.language || repo.language !== language) {
          return false;
        }
      }

      // 3. Filter by repository type (original, fork, archived)
      if (type === 'sources' && repo.fork) return false;
      if (type === 'forks' && !repo.fork) return false;
      if (type === 'archived' && !repo.archived) return false;

      // 4. Filter by minimum stargazers count
      if (minStars > 0 && (repo.stargazers_count ?? 0) < minStars) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'stars') {
        const diff = (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'forks') {
        const diff = (b.forks_count ?? 0) - (a.forks_count ?? 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'pushed_asc') {
        const timeA = getSafeRepoTimestamp(a);
        const timeB = getSafeRepoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      // Default: 'pushed' (Recently Updated / Newest first)
      const timeA = getSafeRepoTimestamp(a);
      const timeB = getSafeRepoTimestamp(b);
      if (timeB !== timeA) return timeB - timeA;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}
