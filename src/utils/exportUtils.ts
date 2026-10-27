import type { GitHubRepo, GitHubUser, DashboardOverviewStats } from '../types/github';

/**
 * Escapes a single string or primitive value for standard RFC 4180 CSV output.
 *
 * Rules:
 * - null/undefined become empty string "".
 * - Numbers and booleans are converted to string.
 * - Formula injection prevention: values starting with '=', '+', '-', '@', '\t', '\r'
 *   are prepended with a single quote (') to prevent spreadsheet execution vulnerabilities.
 * - Values containing commas (,), quotes ("), newlines (\n), or carriage returns (\r)
 *   are wrapped in double quotes, with internal quotes escaped as two double quotes ("").
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Guard against CSV / Spreadsheet formula injection (CSV Injection / DDE)
  let safeStr = str;
  if (/^[=+\-@\t\r]/.test(safeStr)) {
    safeStr = `'${safeStr}`;
  }

  // Check if quoting is needed
  if (/[",\n\r]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}

/**
 * Sanitizes a string for use as a safe filename across Windows, macOS, and Linux.
 * Removes control characters and illegal filesystem characters (\ / : * ? " < > |).
 */
export function sanitizeExportFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'export';
  }

  // Remove leading/trailing spaces and dots, replace unsafe chars with hyphens
  const sanitized = rawName
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');

  return sanitized || 'export';
}

/**
 * Formats a Date object into a compact YYYYMMDD date stamp string.
 */
export function getExportDateStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Builds a standardized, safe filename for exports.
 */
export function buildExportFilename(
  username: string,
  type: 'profile-summary' | 'repositories' | 'complete-report',
  extension: 'csv' | 'json',
  date = new Date()
): string {
  const safeUser = sanitizeExportFilename(username.toLowerCase());
  const dateStamp = getExportDateStamp(date);
  return `${safeUser}-${type}-${dateStamp}.${extension}`;
}

/**
 * Generates a standard UTF-8 CSV string representing the user profile summary
 * and available overview statistics, prepended with a UTF-8 BOM for Microsoft Excel compatibility.
 */
export function generateProfileSummaryCsv(
  user: GitHubUser,
  stats?: DashboardOverviewStats | null
): string {
  const headers = [
    'Username',
    'Full Name',
    'GitHub URL',
    'Bio',
    'Company',
    'Location',
    'Website / Blog',
    'Public Repositories (Total)',
    'Public Gists',
    'Followers',
    'Following',
    'Account Created At',
    'Profile Updated At',
    'Loaded Repositories Count',
    'Total Stars (Loaded Repos)',
    'Total Forks (Loaded Repos)',
    'Top Language',
    'Dataset Status',
  ];

  const loadedCount = stats?.totalLoadedRepos ?? 0;
  const isPartial = stats?.isPartial ?? (loadedCount < user.public_repos);
  const datasetStatus = isPartial ? 'Partial (Pagination in progress)' : 'Complete';

  const values = [
    user.login,
    user.name ?? '',
    user.html_url,
    user.bio ?? '',
    user.company ?? '',
    user.location ?? '',
    user.blog ?? '',
    user.public_repos,
    user.public_gists,
    user.followers,
    user.following,
    user.created_at,
    user.updated_at,
    loadedCount,
    stats?.totalBatchStars ?? 0,
    stats?.totalBatchForks ?? 0,
    stats?.topLanguage?.language ?? 'None',
    datasetStatus,
  ];

  const headerRow = headers.map(escapeCsvValue).join(',');
  const valueRow = values.map(escapeCsvValue).join(',');

  // \uFEFF is UTF-8 Byte Order Mark (BOM) to force Excel into UTF-8 decoding mode
  return `\uFEFF${headerRow}\r\n${valueRow}\r\n`;
}

/**
 * Generates a standard UTF-8 CSV string for all loaded repositories with UTF-8 BOM.
 */
export function generateRepositoriesCsv(
  repos: GitHubRepo[],
  username: string
): string {
  const headers = [
    'Repository Name',
    'Full Name',
    'Owner',
    'URL',
    'Description',
    'Primary Language',
    'Stars',
    'Forks',
    'Open Issues',
    'License',
    'Is Fork',
    'Is Archived',
    'Created At',
    'Last Updated',
    'Last Pushed',
  ];

  const headerRow = headers.map(escapeCsvValue).join(',');

  const rows = repos.map((repo) => {
    const values = [
      repo.name,
      repo.full_name,
      repo.owner?.login || username,
      repo.html_url,
      repo.description ?? '',
      repo.language ?? 'None',
      repo.stargazers_count ?? 0,
      repo.forks_count ?? 0,
      repo.open_issues_count ?? 0,
      repo.license?.spdx_id || repo.license?.name || 'None',
      repo.fork ? 'Yes' : 'No',
      repo.archived ? 'Yes' : 'No',
      repo.created_at,
      repo.updated_at,
      repo.pushed_at,
    ];
    return values.map(escapeCsvValue).join(',');
  });

  return `\uFEFF${headerRow}\r\n${rows.length > 0 ? rows.join('\r\n') + '\r\n' : ''}`;
}

export interface JsonExportPayload {
  schemaVersion: '1.0.0';
  exportedAt: string;
  profile: {
    login: string;
    name: string | null;
    html_url: string;
    avatar_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    email: string | null;
    hireable: boolean | null;
    twitter_username: string | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
  };
  overviewStats: {
    totalLoadedRepos: number;
    originalReposCount: number;
    forkedReposCount: number;
    archivedReposCount: number;
    totalBatchStars: number;
    totalBatchForks: number;
    topLanguage: {
      language: string;
      count: number;
      percentage: number;
    } | null;
    mostStarredRepo: {
      name: string;
      html_url: string;
      stars: number;
    } | null;
    mostRecentlyPushedRepo: {
      name: string;
      html_url: string;
      pushed_at: string;
    } | null;
    isPartial: boolean;
  } | null;
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    license: string | null;
    fork: boolean;
    archived: boolean;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    homepage: string | null;
  }>;
  meta: {
    generator: 'GitHub Profile Analyzer';
    totalPublicRepos: number;
    loadedReposCount: number;
    isPartialDataset: boolean;
  };
}

/**
 * Generates an indented, structured JSON export string for the profile, overview, and repositories.
 * Avoids any sensitive credentials or circular React component state.
 */
export function generateProfileJson(
  user: GitHubUser,
  repos: GitHubRepo[],
  stats?: DashboardOverviewStats | null
): string {
  const payload: JsonExportPayload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    profile: {
      login: user.login,
      name: user.name,
      html_url: user.html_url,
      avatar_url: user.avatar_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      email: user.email,
      hireable: user.hireable,
      twitter_username: user.twitter_username,
      public_repos: user.public_repos,
      public_gists: user.public_gists,
      followers: user.followers,
      following: user.following,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    overviewStats: stats
      ? {
          totalLoadedRepos: stats.totalLoadedRepos,
          originalReposCount: stats.originalReposCount,
          forkedReposCount: stats.forkedReposCount,
          archivedReposCount: stats.archivedReposCount,
          totalBatchStars: stats.totalBatchStars,
          totalBatchForks: stats.totalBatchForks,
          topLanguage: stats.topLanguage
            ? {
                language: stats.topLanguage.language,
                count: stats.topLanguage.count,
                percentage: stats.topLanguage.percentage,
              }
            : null,
          mostStarredRepo: stats.mostStarredRepo
            ? {
                name: stats.mostStarredRepo.name,
                html_url: stats.mostStarredRepo.html_url,
                stars: stats.mostStarredRepo.stargazers_count ?? 0,
              }
            : null,
          mostRecentlyPushedRepo: stats.mostRecentlyPushedRepo
            ? {
                name: stats.mostRecentlyPushedRepo.name,
                html_url: stats.mostRecentlyPushedRepo.html_url,
                pushed_at: stats.mostRecentlyPushedRepo.pushed_at,
              }
            : null,
          isPartial: stats.isPartial,
        }
      : null,
    repositories: repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      language: r.language,
      stargazers_count: r.stargazers_count ?? 0,
      forks_count: r.forks_count ?? 0,
      open_issues_count: r.open_issues_count ?? 0,
      license: r.license?.spdx_id || r.license?.name || null,
      fork: r.fork,
      archived: r.archived,
      created_at: r.created_at,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      homepage: r.homepage,
    })),
    meta: {
      generator: 'GitHub Profile Analyzer',
      totalPublicRepos: user.public_repos,
      loadedReposCount: repos.length,
      isPartialDataset: repos.length < user.public_repos,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Triggers a browser download of the given content string as a file using Blob and object URL.
 * Cleans up temporary object URLs automatically after the download initiates.
 */
export function triggerBlobDownload(
  content: string,
  filename: string,
  mimeType: 'text/csv;charset=utf-8;' | 'application/json;charset=utf-8;'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up the object URL and remove the anchor tag
  window.setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}
