/**
 * Sanitizes external user-provided website/blog URLs from the GitHub API.
 * Ensures the target destination uses a safe scheme (`http:` or `https:`)
 * preventing protocol hijacking such as `javascript:`, `data:`, `vbscript:`, or `file:`.
 *
 * @param rawUrl The raw URL string provided in the user's public profile
 * @returns A safe, normalized absolute URL string, or null if the URL is invalid or unsafe
 */
export function sanitizeExternalUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject explicit dangerous protocols early
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return null;
  }

  // Prepend https:// if no protocol scheme is present
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    // Strictly restrict to standard web protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates a GitHub username according to official GitHub username constraints:
 * - May only contain alphanumeric characters or single hyphens
 * - Cannot begin or end with a hyphen
 * - Maximum length of 39 characters
 *
 * @param username The raw username string to inspect
 * @returns An object detailing whether the username matches standard GitHub naming rules
 */
export function validateGitHubUsername(username: string): {
  isValid: boolean;
  cleanUsername: string;
  reason?: string;
} {
  const clean = username.trim().replace(/^@/, '');

  if (!clean) {
    return {
      isValid: false,
      cleanUsername: '',
      reason: 'Username cannot be empty.',
    };
  }

  if (clean.length > 39) {
    return {
      isValid: false,
      cleanUsername: clean,
      reason: 'GitHub usernames cannot exceed 39 characters.',
    };
  }

  if (clean.startsWith('-') || clean.endsWith('-')) {
    return {
      isValid: false,
      cleanUsername: clean,
      reason: 'GitHub usernames cannot start or end with a hyphen.',
    };
  }

  if (/--/.test(clean)) {
    return {
      isValid: false,
      cleanUsername: clean,
      reason: 'GitHub usernames cannot contain consecutive hyphens.',
    };
  }

  if (!/^[a-zA-Z0-9-]+$/.test(clean)) {
    return {
      isValid: false,
      cleanUsername: clean,
      reason: 'GitHub usernames may only contain alphanumeric characters and hyphens.',
    };
  }

  return {
    isValid: true,
    cleanUsername: clean,
  };
}
