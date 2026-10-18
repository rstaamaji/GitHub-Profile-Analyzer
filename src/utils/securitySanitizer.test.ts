import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeExternalUrl, validateGitHubUsername } from './securitySanitizer.ts';

describe('securitySanitizer - sanitizeExternalUrl', () => {
  it('allows valid https and http URLs', () => {
    assert.strictEqual(
      sanitizeExternalUrl('https://example.com/blog'),
      'https://example.com/blog'
    );
    assert.strictEqual(
      sanitizeExternalUrl('http://example.com'),
      'http://example.com/'
    );
  });

  it('prepends https to bare domains', () => {
    assert.strictEqual(
      sanitizeExternalUrl('developer.dev/portfolio'),
      'https://developer.dev/portfolio'
    );
  });

  it('blocks dangerous protocols like javascript: and data:', () => {
    assert.strictEqual(sanitizeExternalUrl('javascript:alert(1)'), null);
    assert.strictEqual(sanitizeExternalUrl('JAVASCRIPT:void(0)'), null);
    assert.strictEqual(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>'), null);
    assert.strictEqual(sanitizeExternalUrl('vbscript:msgbox("x")'), null);
    assert.strictEqual(sanitizeExternalUrl('file:///etc/passwd'), null);
  });

  it('handles null, undefined, and empty string safely', () => {
    assert.strictEqual(sanitizeExternalUrl(null), null);
    assert.strictEqual(sanitizeExternalUrl(undefined), null);
    assert.strictEqual(sanitizeExternalUrl('   '), null);
  });
});

describe('securitySanitizer - validateGitHubUsername', () => {
  it('validates legitimate GitHub usernames and strips leading @', () => {
    const res1 = validateGitHubUsername('@torvalds');
    assert.strictEqual(res1.isValid, true);
    assert.strictEqual(res1.cleanUsername, 'torvalds');

    const res2 = validateGitHubUsername('yyx990803');
    assert.strictEqual(res2.isValid, true);
    assert.strictEqual(res2.cleanUsername, 'yyx990803');
  });

  it('rejects empty strings or whitespace', () => {
    const res = validateGitHubUsername('   ');
    assert.strictEqual(res.isValid, false);
    assert.match(res.reason || '', /cannot be empty/i);
  });

  it('rejects leading or trailing hyphens', () => {
    assert.strictEqual(validateGitHubUsername('-badusername').isValid, false);
    assert.strictEqual(validateGitHubUsername('badusername-').isValid, false);
  });

  it('rejects illegal characters like spaces, slashes, or script tags', () => {
    assert.strictEqual(validateGitHubUsername('user<script>').isValid, false);
    assert.strictEqual(validateGitHubUsername('user/repo').isValid, false);
    assert.strictEqual(validateGitHubUsername('user name').isValid, false);
  });

  it('rejects usernames exceeding 39 characters', () => {
    const longName = 'a'.repeat(40);
    assert.strictEqual(validateGitHubUsername(longName).isValid, false);
  });
});
