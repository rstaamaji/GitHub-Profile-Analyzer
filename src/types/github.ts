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

export interface ApiError {
  message: string;
  status?: number;
  resetTime?: Date;
  documentation_url?: string;
}
