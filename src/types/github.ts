export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  topics?: string[];
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
  } | null;
  owner?: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  default_branch?: string;
  subscribers_count?: number;
  network_count?: number;
}

export interface ReadmeData {
  content: string; // decoded text
  html_url?: string;
  download_url?: string;
  name?: string;
  path?: string;
  size?: number;
}


export interface LanguageStat {
  language: string;
  count: number;
  percentage: number; // Percentage of analyzed repositories that list this as primary language
  color: string;
}

export interface LanguageAnalyticsResult {
  totalAnalyzed: number; // Total eligible repositories analyzed (forks excluded by default)
  totalWithLanguage: number; // Repositories with a detected primary language
  totalWithoutLanguage: number; // Repositories without a primary language (e.g. config, docs)
  forksExcludedCount: number; // Number of forks omitted from analysis
  distinctLanguagesCount: number; // Count of distinct languages found
  topLanguage: LanguageStat | null; // Most frequently represented primary language
  breakdown: LanguageStat[]; // Ranked list of languages by repository count
  isPartial: boolean; // True if user has more public repositories than currently fetched
  totalPublicRepos: number; // Total public repositories on user's GitHub account
}

export type ActivityTimeRange = '30d' | '90d' | '12m';


export interface ActivityBucket {
  periodLabel: string; // e.g. "Week 40" or "Sep 2026"
  periodKey: string; // ISO date key for deterministic sorting
  pushCount: number; // Distinct repositories pushed in this bucket
  updateCount: number; // Distinct repositories updated in this bucket
}

export interface ActivityRepoItem {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  updatedAt: string;
  stargazersCount: number;
  fork: boolean;
}

export interface ActivityAnalyticsResult {
  range: ActivityTimeRange;
  totalReposInDataset: number;
  activeReposCount: number; // Distinct repos with pushes or updates in the period
  pushedReposCount: number; // Distinct repos pushed to in the period
  updatedOnlyReposCount: number; // Distinct repos updated (e.g. metadata/stars/issues) without push in period
  buckets: ActivityBucket[];
  recentActiveRepos: ActivityRepoItem[]; // Top recently active repos within time window
  isPartial: boolean;
  totalPublicRepos: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}


export interface ProfileAnalysisData {
  user: GitHubUser;
  repos: GitHubRepo[];
  rateLimit?: RateLimitInfo;
}

export type ViewState = 'idle' | 'loading' | 'success' | 'error';

export type NavigationTab = 'overview' | 'repositories' | 'analytics' | 'compare';

export type RepoSortOption = 'pushed' | 'stars' | 'name' | 'forks';

export interface ApiError {
  message: string;
  status?: number;
  resetTime?: Date;
  documentation_url?: string;
}
