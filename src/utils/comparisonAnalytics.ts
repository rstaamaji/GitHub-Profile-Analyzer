import type {
  ComparisonInputValidation,
  GitHubRepo,
  GitHubUser,
  LanguageComparisonRow,
  MetricComparisonItem,
  ProfileComparisonSummary,
} from '../types/github';
import { calculateLanguageAnalytics, getLanguageColor } from './languageAnalytics';
import { calculateOverviewStats } from './overviewAnalytics';

/**
 * Validates the two GitHub username inputs before initiating a comparison request.
 */
export function validateComparisonInputs(
  rawUserA: string,
  rawUserB: string
): ComparisonInputValidation {
  const normalizedUserA = rawUserA.trim().replace(/^@/, '');
  const normalizedUserB = rawUserB.trim().replace(/^@/, '');

  if (!normalizedUserA && !normalizedUserB) {
    return {
      isValid: false,
      errorMessage: 'Please enter GitHub usernames for both Developer A and Developer B.',
      normalizedUserA,
      normalizedUserB,
    };
  }

  if (!normalizedUserA) {
    return {
      isValid: false,
      errorMessage: 'Please enter a GitHub username for Developer A.',
      normalizedUserA,
      normalizedUserB,
    };
  }

  if (!normalizedUserB) {
    return {
      isValid: false,
      errorMessage: 'Please enter a GitHub username for Developer B.',
      normalizedUserA,
      normalizedUserB,
    };
  }

  if (normalizedUserA.toLowerCase() === normalizedUserB.toLowerCase()) {
    return {
      isValid: false,
      errorMessage:
        'Developer A and Developer B have the same username. Please enter two different GitHub profiles to compare.',
      normalizedUserA,
      normalizedUserB,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
    normalizedUserA,
    normalizedUserB,
  };
}

interface BuildMetricOptions {
  key: string;
  label: string;
  valueA: number | null;
  valueB: number | null;
  subLabelA?: string;
  subLabelB?: string;
  isPartialA?: boolean;
  isPartialB?: boolean;
  footnote?: string;
}

/**
 * Builds a single objective metric comparison row with consistent 0-100 visual bar ratios.
 */
export function buildMetricComparisonItem(options: BuildMetricOptions): MetricComparisonItem {
  const {
    key,
    label,
    valueA,
    valueB,
    subLabelA,
    subLabelB,
    isPartialA = false,
    isPartialB = false,
    footnote,
  } = options;

  const formattedA = valueA !== null ? valueA.toLocaleString() : 'N/A';
  const formattedB = valueB !== null ? valueB.toLocaleString() : 'N/A';

  if (valueA === null || valueB === null) {
    return {
      key,
      label,
      valueA,
      valueB,
      formattedA,
      formattedB,
      subLabelA,
      subLabelB,
      isPartialA,
      isPartialB,
      higherSide: 'unavailable',
      diffFormatted: null,
      ratioA: valueA !== null && valueA > 0 ? 100 : 0,
      ratioB: valueB !== null && valueB > 0 ? 100 : 0,
      footnote,
    };
  }

  const maxVal = Math.max(valueA, valueB);
  const ratioA = maxVal > 0 ? Math.round((valueA / maxVal) * 1000) / 10 : 0;
  const ratioB = maxVal > 0 ? Math.round((valueB / maxVal) * 1000) / 10 : 0;

  let higherSide: 'A' | 'B' | 'equal' = 'equal';
  let diffFormatted: string | null = 'Equal';

  if (valueA > valueB) {
    higherSide = 'A';
    diffFormatted = `+${(valueA - valueB).toLocaleString()}`;
  } else if (valueB > valueA) {
    higherSide = 'B';
    diffFormatted = `+${(valueB - valueA).toLocaleString()}`;
  }

  return {
    key,
    label,
    valueA,
    valueB,
    formattedA,
    formattedB,
    subLabelA,
    subLabelB,
    isPartialA,
    isPartialB,
    higherSide,
    diffFormatted,
    ratioA,
    ratioB,
    footnote,
  };
}

export interface ProfilePayload {
  user: GitHubUser;
  repos: GitHubRepo[];
}

export interface ComparisonOptions {
  excludeForks?: boolean;
}

/**
 * Computes side-by-side profile metrics and language comparison using existing analytics utilities.
 * Never fabricates data and explicitly distinguishes partial vs complete repository pagination.
 */
export function calculateProfileComparison(
  profileA: ProfilePayload | null,
  profileB: ProfilePayload | null,
  options: ComparisonOptions = {}
): ProfileComparisonSummary {
  const { excludeForks = true } = options;

  const statsA = profileA ? calculateOverviewStats(profileA.user, profileA.repos) : null;
  const statsB = profileB ? calculateOverviewStats(profileB.user, profileB.repos) : null;

  const languageAnalyticsA = profileA
    ? calculateLanguageAnalytics(profileA.repos, {
        excludeForks,
        totalPublicRepos: profileA.user.public_repos,
      })
    : null;

  const languageAnalyticsB = profileB
    ? calculateLanguageAnalytics(profileB.repos, {
        excludeForks,
        totalPublicRepos: profileB.user.public_repos,
      })
    : null;

  const anyPartial = Boolean(statsA?.isPartial || statsB?.isPartial);

  const metrics: MetricComparisonItem[] = [
    buildMetricComparisonItem({
      key: 'public_repos',
      label: 'Public Repositories',
      valueA: statsA ? statsA.totalPublicRepos : null,
      valueB: statsB ? statsB.totalPublicRepos : null,
      subLabelA: statsA
        ? `${statsA.originalReposCount} original, ${statsA.forkedReposCount} forks (in ${statsA.totalLoadedRepos} loaded)`
        : undefined,
      subLabelB: statsB
        ? `${statsB.originalReposCount} original, ${statsB.forkedReposCount} forks (in ${statsB.totalLoadedRepos} loaded)`
        : undefined,
    }),
    buildMetricComparisonItem({
      key: 'followers',
      label: 'Followers',
      valueA: statsA ? statsA.followers : null,
      valueB: statsB ? statsB.followers : null,
      footnote: 'Reflects community reach; not a direct measure of engineering skill.',
    }),
    buildMetricComparisonItem({
      key: 'following',
      label: 'Following',
      valueA: statsA ? statsA.following : null,
      valueB: statsB ? statsB.following : null,
    }),
    buildMetricComparisonItem({
      key: 'public_gists',
      label: 'Public Gists',
      valueA: statsA ? statsA.publicGists : null,
      valueB: statsB ? statsB.publicGists : null,
    }),
    buildMetricComparisonItem({
      key: 'repo_stars',
      label: anyPartial
        ? 'Repository Stars (Loaded Sample)'
        : 'Total Repository Stars',
      valueA: statsA ? statsA.totalBatchStars : null,
      valueB: statsB ? statsB.totalBatchStars : null,
      isPartialA: statsA?.isPartial ?? false,
      isPartialB: statsB?.isPartial ?? false,
      subLabelA: statsA
        ? statsA.isPartial
          ? `Partial (${statsA.totalLoadedRepos} of ${statsA.totalPublicRepos} repos loaded)`
          : `Complete (${statsA.totalLoadedRepos} repos)`
        : undefined,
      subLabelB: statsB
        ? statsB.isPartial
          ? `Partial (${statsB.totalLoadedRepos} of ${statsB.totalPublicRepos} repos loaded)`
          : `Complete (${statsB.totalLoadedRepos} repos)`
        : undefined,
      footnote: anyPartial
        ? 'One or both profiles have more public repositories than currently loaded. Values reflect loaded repositories only.'
        : 'Sum of stargazers across all public repositories.',
    }),
    buildMetricComparisonItem({
      key: 'repo_forks',
      label: anyPartial
        ? 'Repository Forks (Loaded Sample)'
        : 'Total Repository Forks',
      valueA: statsA ? statsA.totalBatchForks : null,
      valueB: statsB ? statsB.totalBatchForks : null,
      isPartialA: statsA?.isPartial ?? false,
      isPartialB: statsB?.isPartial ?? false,
      subLabelA: statsA
        ? statsA.isPartial
          ? `From ${statsA.totalLoadedRepos}/${statsA.totalPublicRepos} loaded repos`
          : `From all ${statsA.totalLoadedRepos} repos`
        : undefined,
      subLabelB: statsB
        ? statsB.isPartial
          ? `From ${statsB.totalLoadedRepos}/${statsB.totalPublicRepos} loaded repos`
          : `From all ${statsB.totalLoadedRepos} repos`
        : undefined,
    }),
  ];

  // Combine languages across both profiles
  const mapA = new Map<string, { count: number; percentage: number; color: string }>();
  const mapB = new Map<string, { count: number; percentage: number; color: string }>();

  if (languageAnalyticsA) {
    for (const item of languageAnalyticsA.breakdown) {
      mapA.set(item.language, {
        count: item.count,
        percentage: item.percentage,
        color: item.color,
      });
    }
  }

  if (languageAnalyticsB) {
    for (const item of languageAnalyticsB.breakdown) {
      mapB.set(item.language, {
        count: item.count,
        percentage: item.percentage,
        color: item.color,
      });
    }
  }

  const allLanguageNames = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));
  const sharedLanguages: string[] = [];
  const uniqueLanguagesA: string[] = [];
  const uniqueLanguagesB: string[] = [];

  const languageRows: LanguageComparisonRow[] = allLanguageNames
    .map((language, idx) => {
      const entryA = mapA.get(language);
      const entryB = mapB.get(language);
      const countA = entryA?.count ?? 0;
      const percentageA = entryA?.percentage ?? 0;
      const countB = entryB?.count ?? 0;
      const percentageB = entryB?.percentage ?? 0;

      if (countA > 0 && countB > 0) {
        sharedLanguages.push(language);
      } else if (countA > 0) {
        uniqueLanguagesA.push(language);
      } else if (countB > 0) {
        uniqueLanguagesB.push(language);
      }

      return {
        language,
        color: entryA?.color || entryB?.color || getLanguageColor(language, idx),
        countA,
        percentageA,
        countB,
        percentageB,
      };
    })
    .sort((a, b) => {
      const totalDiff = b.countA + b.countB - (a.countA + a.countB);
      if (totalDiff !== 0) return totalDiff;
      return a.language.localeCompare(b.language);
    });

  return {
    statsA,
    statsB,
    languageAnalyticsA,
    languageAnalyticsB,
    metrics,
    sharedLanguages,
    uniqueLanguagesA,
    uniqueLanguagesB,
    languageRows,
  };
}
