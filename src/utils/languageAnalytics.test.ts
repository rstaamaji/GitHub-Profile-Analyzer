import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateLanguageAnalytics, getLanguageColor } from './languageAnalytics';
import type { GitHubRepo } from '../types/github';

function createRepo(overrides: Partial<GitHubRepo> & { id: number; name: string }): GitHubRepo {
  return {
    id: overrides.id,
    name: overrides.name,
    full_name: `test/${overrides.name}`,
    private: false,
    html_url: '',
    description: null,
    fork: overrides.fork ?? false,
    url: '',
    created_at: '',
    updated_at: '',
    pushed_at: '',
    homepage: null,
    size: 100,
    stargazers_count: 0,
    watchers_count: 0,
    language: overrides.language ?? null,
    forks_count: 0,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
  };
}

const mockRepos: GitHubRepo[] = [
  createRepo({ id: 1, name: 'repo-ts-1', language: 'TypeScript' }),
  createRepo({ id: 2, name: 'repo-ts-2', language: 'TypeScript' }),
  createRepo({ id: 3, name: 'repo-py', language: 'Python' }),
  createRepo({ id: 4, name: 'repo-fork-go', language: 'Go', fork: true }),
  createRepo({ id: 5, name: 'repo-empty-lang', language: null }),
  createRepo({ id: 6, name: 'repo-whitespace-lang', language: '   ' }),
];

describe('calculateLanguageAnalytics', () => {
  it('excludes forked repositories by default and counts repositories without language separately', () => {
    const result = calculateLanguageAnalytics(mockRepos, {
      excludeForks: true,
      totalPublicRepos: 6,
    });

    assert.equal(result.totalAnalyzed, 5);
    assert.equal(result.forksExcludedCount, 1);
    assert.equal(result.totalWithLanguage, 3);
    assert.equal(result.totalWithoutLanguage, 2);
    assert.equal(result.distinctLanguagesCount, 2);
    assert.equal(result.topLanguage?.language, 'TypeScript');
    assert.equal(result.topLanguage?.count, 2);
    assert.equal(result.topLanguage?.percentage, 66.7);
    assert.equal(result.isPartial, false);
  });

  it('includes forked repositories when excludeForks is false', () => {
    const result = calculateLanguageAnalytics(mockRepos, {
      excludeForks: false,
      totalPublicRepos: 6,
    });

    assert.equal(result.totalAnalyzed, 6);
    assert.equal(result.forksExcludedCount, 0);
    assert.equal(result.distinctLanguagesCount, 3);
  });

  it('flags isPartial: true when loaded repositories are fewer than totalPublicRepos', () => {
    const result = calculateLanguageAnalytics(mockRepos, {
      excludeForks: true,
      totalPublicRepos: 100,
    });
    assert.equal(result.isPartial, true);
    assert.equal(result.totalPublicRepos, 100);
  });

  it('breaks ties deterministically in alphabetical order when language counts are equal', () => {
    const tiedRepos = [
      createRepo({ id: 10, name: 'r1', language: 'Rust' }),
      createRepo({ id: 11, name: 'r2', language: 'Go' }),
    ];
    const result = calculateLanguageAnalytics(tiedRepos);
    assert.deepEqual(
      result.breakdown.map((b) => b.language),
      ['Go', 'Rust']
    );
    assert.equal(result.topLanguage?.language, 'Go');
  });

  it('handles empty repository list and fallback colors cleanly', () => {
    const emptyResult = calculateLanguageAnalytics([]);
    assert.equal(emptyResult.totalAnalyzed, 0);
    assert.equal(emptyResult.topLanguage, null);
    assert.deepEqual(emptyResult.breakdown, []);

    assert.equal(getLanguageColor('TypeScript'), '#3178c6');
    assert.ok(getLanguageColor('CustomUnknownDSL', 2).startsWith('#'));
  });
});
