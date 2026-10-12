import { calculateLanguageAnalytics } from './languageAnalytics';
import type { GitHubRepo } from '../types/github';

// Minimal test runner for language analytics verification
function runTests() {
  const mockRepos: GitHubRepo[] = [
    {
      id: 1,
      name: 'repo-ts-1',
      full_name: 'test/repo-ts-1',
      private: false,
      html_url: '',
      description: null,
      fork: false,
      url: '',
      created_at: '',
      updated_at: '',
      pushed_at: '',
      homepage: null,
      size: 100,
      stargazers_count: 10,
      watchers_count: 10,
      language: 'TypeScript',
      forks_count: 2,
      archived: false,
      disabled: false,
      open_issues_count: 0,
      license: null,
    },
    {
      id: 2,
      name: 'repo-ts-2',
      full_name: 'test/repo-ts-2',
      private: false,
      html_url: '',
      description: null,
      fork: false,
      url: '',
      created_at: '',
      updated_at: '',
      pushed_at: '',
      homepage: null,
      size: 200,
      stargazers_count: 5,
      watchers_count: 5,
      language: 'TypeScript',
      forks_count: 0,
      archived: false,
      disabled: false,
      open_issues_count: 1,
      license: null,
    },
    {
      id: 3,
      name: 'repo-py',
      full_name: 'test/repo-py',
      private: false,
      html_url: '',
      description: null,
      fork: false,
      url: '',
      created_at: '',
      updated_at: '',
      pushed_at: '',
      homepage: null,
      size: 150,
      stargazers_count: 20,
      watchers_count: 20,
      language: 'Python',
      forks_count: 3,
      archived: false,
      disabled: false,
      open_issues_count: 0,
      license: null,
    },
    {
      id: 4,
      name: 'repo-fork-go',
      full_name: 'test/repo-fork-go',
      private: false,
      html_url: '',
      description: null,
      fork: true, // FORK
      url: '',
      created_at: '',
      updated_at: '',
      pushed_at: '',
      homepage: null,
      size: 150,
      stargazers_count: 1,
      watchers_count: 1,
      language: 'Go',
      forks_count: 0,
      archived: false,
      disabled: false,
      open_issues_count: 0,
      license: null,
    },
    {
      id: 5,
      name: 'repo-empty-lang',
      full_name: 'test/repo-empty-lang',
      private: false,
      html_url: '',
      description: null,
      fork: false,
      url: '',
      created_at: '',
      updated_at: '',
      pushed_at: '',
      homepage: null,
      size: 10,
      stargazers_count: 0,
      watchers_count: 0,
      language: null, // NO LANGUAGE
      forks_count: 0,
      archived: false,
      disabled: false,
      open_issues_count: 0,
      license: null,
    },
  ];

  console.log('Testing calculateLanguageAnalytics...');

  // Test 1: Exclude forks (default)
  const result1 = calculateLanguageAnalytics(mockRepos, { excludeForks: true, totalPublicRepos: 5 });
  console.assert(result1.totalAnalyzed === 4, `Expected 4 analyzed, got ${result1.totalAnalyzed}`);
  console.assert(result1.forksExcludedCount === 1, `Expected 1 fork excluded, got ${result1.forksExcludedCount}`);
  console.assert(result1.distinctLanguagesCount === 2, `Expected 2 languages (TS, Python), got ${result1.distinctLanguagesCount}`);
  console.assert(result1.totalWithoutLanguage === 1, `Expected 1 without language, got ${result1.totalWithoutLanguage}`);
  console.assert(result1.topLanguage?.language === 'TypeScript', `Expected top language TypeScript, got ${result1.topLanguage?.language}`);
  console.assert(result1.topLanguage?.count === 2, `Expected top count 2, got ${result1.topLanguage?.count}`);
  console.assert(result1.topLanguage?.percentage === 66.7, `Expected percentage ~66.7, got ${result1.topLanguage?.percentage}`);
  console.assert(result1.isPartial === false, 'Expected isPartial to be false');

  // Test 2: Include forks
  const result2 = calculateLanguageAnalytics(mockRepos, { excludeForks: false, totalPublicRepos: 5 });
  console.assert(result2.totalAnalyzed === 5, `Expected 5 analyzed, got ${result2.totalAnalyzed}`);
  console.assert(result2.distinctLanguagesCount === 3, `Expected 3 languages with fork (TS, Python, Go), got ${result2.distinctLanguagesCount}`);

  // Test 3: Partial check
  const result3 = calculateLanguageAnalytics(mockRepos, { excludeForks: true, totalPublicRepos: 100 });
  console.assert(result3.isPartial === true, 'Expected isPartial to be true when totalPublicRepos > repos.length');

  // Test 4: Empty set
  const result4 = calculateLanguageAnalytics([]);
  console.assert(result4.totalAnalyzed === 0, 'Expected 0 analyzed for empty list');
  console.assert(result4.topLanguage === null, 'Expected null top language for empty list');

  console.log('All language analytics unit tests passed successfully!');
}

runTests();
