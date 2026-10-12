import type { GitHubRepo, GitHubUser, RateLimitInfo, ApiError, ReadmeData } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Service options that can be extended or injected.
 * Designed to seamlessly support future backend proxy endpoints.
 */
class GitHubService {
  private token: string | null = null;

  constructor() {
    // Reads optional personal access token to prevent strict rate limiting (60 req/hr -> 5,000 req/hr)
    this.token = import.meta.env.VITE_GITHUB_TOKEN || null;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private parseRateLimit(response: Response): RateLimitInfo | undefined {
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const used = response.headers.get('x-ratelimit-used');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        used: used ? parseInt(used, 10) : 0,
      };
    }
    return undefined;
  }

  private handleResponseError(status: number, message: string, headers: Headers): never {
    const resetHeader = headers.get('x-ratelimit-reset');
    const resetTime = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000) : undefined;

    let friendlyMessage = message;
    if (status === 404) {
      friendlyMessage = 'GitHub user not found. Please verify the username and try again.';
    } else if (status === 403 && headers.get('x-ratelimit-remaining') === '0') {
      friendlyMessage = `GitHub API rate limit exceeded. Unauthenticated requests are limited to 60/hr. Resets at ${
        resetTime ? resetTime.toLocaleTimeString() : 'the next hour'
      }.`;
    }

    const error: ApiError = {
      message: friendlyMessage,
      status,
      resetTime,
    };
    throw error;
  }

  /**
   * Fetch user public profile
   */
  async getUser(
    username: string,
    signal?: AbortSignal
  ): Promise<{ data: GitHubUser; rateLimit?: RateLimitInfo }> {
    const cleanUsername = username.trim().toLowerCase();
    try {
      const response = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(cleanUsername)}`, {
        headers: this.getHeaders(),
        signal,
      });

      const rateLimit = this.parseRateLimit(response);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        this.handleResponseError(response.status, errorBody.message, response.headers);
      }

      const data: GitHubUser = await response.json();
      return { data, rateLimit };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        throw err;
      }
      // If error already shaped by handleResponseError, rethrow
      if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        throw err;
      }
      // Network or unexpected failure
      const error: ApiError = {
        message: 'Network connection failed. Please check your internet connectivity or try again later.',
      };
      throw error;
    }
  }


  /**
   * Fetch public repositories for user (supports sort, perPage, page, signal)
   */
  async getUserRepos(
    username: string,
    perPage: number = 30,
    page: number = 1,
    sort: 'pushed' | 'updated' | 'full_name' | 'created' = 'pushed',
    signal?: AbortSignal
  ): Promise<{ data: GitHubRepo[]; rateLimit?: RateLimitInfo; hasNextPage?: boolean }> {
    const cleanUsername = username.trim().toLowerCase();
    const url = new URL(`${GITHUB_API_BASE}/users/${encodeURIComponent(cleanUsername)}/repos`);
    url.searchParams.set('sort', sort);
    url.searchParams.set('per_page', perPage.toString());
    url.searchParams.set('page', page.toString());

    try {
      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
        signal,
      });

      const rateLimit = this.parseRateLimit(response);
      const linkHeader = response.headers.get('link');
      const hasNextPage = Boolean(linkHeader && linkHeader.includes('rel="next"'));


      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        this.handleResponseError(response.status, errorBody.message, response.headers);
      }

      const data: GitHubRepo[] = await response.json();
      return { data, rateLimit, hasNextPage };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        throw err;
      }
      if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        throw err;
      }
      const error: ApiError = {
        message: 'Network connection failed while fetching user repositories.',
      };
      throw error;
    }
  }


  /**
   * Fetch complete repository detail: GET /repos/{owner}/{repo}
   */
  async getRepoDetail(
    owner: string,
    repo: string,
    signal?: AbortSignal
  ): Promise<{ data: GitHubRepo; rateLimit?: RateLimitInfo }> {
    const cleanOwner = owner.trim().toLowerCase();
    const cleanRepo = repo.trim();
    const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal,
      });

      const rateLimit = this.parseRateLimit(response);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        this.handleResponseError(response.status, errorBody.message, response.headers);
      }

      const data: GitHubRepo = await response.json();
      return { data, rateLimit };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        throw err;
      }
      if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        throw err;
      }
      const error: ApiError = {
        message: 'Network connection failed while fetching repository details.',
      };
      throw error;
    }
  }

  /**
   * Fetch repository README: GET /repos/{owner}/{repo}/readme
   */
  async getRepoReadme(
    owner: string,
    repo: string,
    signal?: AbortSignal
  ): Promise<{ data: ReadmeData | null; rateLimit?: RateLimitInfo }> {
    const cleanOwner = owner.trim().toLowerCase();
    const cleanRepo = repo.trim();
    const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/readme`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal,
      });

      const rateLimit = this.parseRateLimit(response);

      if (response.status === 404) {
        // Repository has no README
        return { data: null, rateLimit };
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        this.handleResponseError(response.status, errorBody.message, response.headers);
      }

      const raw = await response.json();
      // Decode Base64 content
      let decodedContent = '';
      if (raw.content && raw.encoding === 'base64') {
        try {
          const binaryString = atob(raw.content.replace(/\s/g, ''));
          const bytes = Uint8Array.from(binaryString, (m) => m.charCodeAt(0));
          decodedContent = new TextDecoder().decode(bytes);
        } catch {
          decodedContent = atob(raw.content.replace(/\s/g, ''));
        }
      } else if (raw.content) {
        decodedContent = raw.content;
      }

      const data: ReadmeData = {
        content: decodedContent,
        html_url: raw.html_url,
        download_url: raw.download_url,
        name: raw.name,
        path: raw.path,
        size: raw.size,
      };

      return { data, rateLimit };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        throw err;
      }
      if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        throw err;
      }
      const error: ApiError = {
        message: 'Network connection failed while fetching repository README.',
      };
      throw error;
    }
  }

  /**
   * Check current GitHub API rate limit status
   */
  async getRateLimit(): Promise<RateLimitInfo | null> {

    try {
      const response = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      const json = await response.json();
      return {
        limit: json.rate.limit,
        remaining: json.rate.remaining,
        reset: json.rate.reset,
        used: json.rate.used,
      };
    } catch {
      return null;
    }
  }
}

export const githubService = new GitHubService();
