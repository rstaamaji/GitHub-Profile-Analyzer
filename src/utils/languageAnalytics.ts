import type { GitHubRepo, LanguageAnalyticsResult, LanguageStat } from '../types/github';

/**
 * Curated, accessible color palette for programming languages.
 * Covers major languages while falling back to consistent palette hashes.
 */
export const LANGUAGE_PALETTE: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  R: '#198CE7',
  Zig: '#ec915c',
  Lua: '#000080',
  Haskell: '#5e5086',
};

const FALLBACK_PALETTE = [
  '#58a6ff', // blue
  '#3fb950', // green
  '#d29922', // amber
  '#bc8cff', // purple
  '#f85149', // coral
  '#39c5cf', // cyan
  '#db61a2', // pink
  '#7ee787', // light green
];

export function getLanguageColor(language: string, index: number = 0): string {
  if (LANGUAGE_PALETTE[language]) {
    return LANGUAGE_PALETTE[language];
  }
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export interface AnalyzeLanguagesOptions {
  /**
   * Whether to exclude forked repositories from analysis.
   * Defaults to true to measure the author's own original works.
   */
  excludeForks?: boolean;
  /**
   * Total public repositories reported on user's GitHub profile.
   * Used to accurately assess if the analyzed set is partial or complete.
   */
  totalPublicRepos?: number;
}

/**
 * Deterministically aggregates repository-count programming language distribution.
 *
 * INCLUSION RULES:
 * 1. Analyzes public repositories provided in the dataset.
 * 2. By default (`excludeForks: true`), forked repositories are excluded so the distribution
 *    accurately reflects the author's original creation rather than upstreams.
 * 3. Repositories without a `language` field are counted in `totalWithoutLanguage` and NOT
 *    assigned an artificial language.
 * 4. Calculates the percentage of repositories listing each language as primary.
 *    (Explicitly not confused with byte-level line counts).
 * 5. Flags `isPartial: true` if `repos.length < totalPublicRepos`.
 */
export function calculateLanguageAnalytics(
  repos: GitHubRepo[],
  options: AnalyzeLanguagesOptions = {}
): LanguageAnalyticsResult {
  const { excludeForks = true, totalPublicRepos = repos.length } = options;

  let forksExcludedCount = 0;
  const eligibleRepos: GitHubRepo[] = [];

  for (const repo of repos) {
    if (excludeForks && repo.fork) {
      forksExcludedCount++;
    } else {
      eligibleRepos.push(repo);
    }
  }

  const countsByLanguage: Record<string, number> = {};
  let totalWithoutLanguage = 0;
  let totalWithLanguage = 0;

  for (const repo of eligibleRepos) {
    if (repo.language && repo.language.trim() !== '') {
      const lang = repo.language.trim();
      countsByLanguage[lang] = (countsByLanguage[lang] || 0) + 1;
      totalWithLanguage++;
    } else {
      totalWithoutLanguage++;
    }
  }

  const distinctLanguagesCount = Object.keys(countsByLanguage).length;

  // Build ranked breakdown list (count desc, then alphabetical A-Z for deterministic tie-breaking)
  const breakdown: LanguageStat[] = Object.entries(countsByLanguage)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([language, count], idx) => {
      // Calculate percentage against total repositories that have a designated primary language
      const percentage = totalWithLanguage > 0 ? (count / totalWithLanguage) * 100 : 0;
      return {
        language,
        count,
        percentage: Math.round(percentage * 10) / 10, // 1 decimal place
        color: getLanguageColor(language, idx),
      };
    });

  const topLanguage = breakdown.length > 0 ? breakdown[0] : null;

  // True if user account has more public repositories than currently fetched in memory
  const isPartial = repos.length < totalPublicRepos;

  return {
    totalAnalyzed: eligibleRepos.length,
    totalWithLanguage,
    totalWithoutLanguage,
    forksExcludedCount,
    distinctLanguagesCount,
    topLanguage,
    breakdown,
    isPartial,
    totalPublicRepos,
  };
}
