import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  escapeCsvValue,
  sanitizeExportFilename,
  getExportDateStamp,
  buildExportFilename,
  generateProfileSummaryCsv,
  generateRepositoriesCsv,
  generateProfileJson,
  type JsonExportPayload,
} from './exportUtils';
import type { GitHubRepo, GitHubUser, DashboardOverviewStats } from '../types/github';

const mockUser: GitHubUser = {
  login: 'octocat',
  id: 1,
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  html_url: 'https://github.com/octocat',
  name: 'The Octocat',
  company: 'GitHub, Inc.',
  blog: 'https://github.blog',
  location: 'San Francisco, CA',
  email: 'octocat@github.com',
  hireable: true,
  bio: 'Building tools for developers.\nOpen source enthusiast.',
  twitter_username: 'octocat',
  public_repos: 8,
  public_gists: 2,
  followers: 5000,
  following: 10,
  created_at: '2011-01-25T18:44:36Z',
  updated_at: '2026-10-01T12:00:00Z',
};

const mockRepos: GitHubRepo[] = [
  {
    id: 101,
    name: 'Spoon-Knife',
    full_name: 'octocat/Spoon-Knife',
    private: false,
    html_url: 'https://github.com/octocat/Spoon-Knife',
    description: 'This repo is for forking, cloning, and "testing" stuff.',
    fork: false,
    url: 'https://api.github.com/repos/octocat/Spoon-Knife',
    created_at: '2011-01-27T19:30:43Z',
    updated_at: '2026-10-15T08:00:00Z',
    pushed_at: '2026-10-15T09:00:00Z',
    homepage: 'https://spoon-knife.com',
    size: 1024,
    stargazers_count: 12000,
    watchers_count: 12000,
    language: 'HTML',
    forks_count: 3500,
    archived: false,
    disabled: false,
    open_issues_count: 5,
    license: {
      key: 'mit',
      name: 'MIT License',
      spdx_id: 'MIT',
      url: 'https://api.github.com/licenses/mit',
    },
  },
  {
    id: 102,
    name: 'formula-repo',
    full_name: 'octocat/formula-repo',
    private: false,
    html_url: 'https://github.com/octocat/formula-repo',
    description: '=cmd|’ /C calc’!A0', // Potential CSV injection attempt
    fork: true,
    url: 'https://api.github.com/repos/octocat/formula-repo',
    created_at: '2015-05-10T10:00:00Z',
    updated_at: '2026-09-01T12:00:00Z',
    pushed_at: '2026-09-01T12:00:00Z',
    homepage: null,
    size: 256,
    stargazers_count: 42,
    watchers_count: 42,
    language: null,
    forks_count: 7,
    archived: true,
    disabled: false,
    open_issues_count: 0,
    license: null,
  },
];

const mockStats: DashboardOverviewStats = {
  totalPublicRepos: 8,
  followers: 5000,
  following: 10,
  publicGists: 2,
  totalLoadedRepos: 2,
  originalReposCount: 1,
  forkedReposCount: 1,
  archivedReposCount: 1,
  totalBatchStars: 12042,
  totalBatchForks: 3507,
  mostStarredRepo: mockRepos[0],
  mostRecentlyPushedRepo: mockRepos[0],
  topLanguage: {
    language: 'HTML',
    count: 1,
    percentage: 100,
    color: '#e34c26',
  },
  isPartial: true,
};

describe('exportUtils - escapeCsvValue', () => {
  it('returns empty string for null and undefined', () => {
    assert.strictEqual(escapeCsvValue(null), '');
    assert.strictEqual(escapeCsvValue(undefined), '');
  });

  it('converts numbers and booleans correctly', () => {
    assert.strictEqual(escapeCsvValue(123), '123');
    assert.strictEqual(escapeCsvValue(0), '0');
    assert.strictEqual(escapeCsvValue(true), 'true');
    assert.strictEqual(escapeCsvValue(false), 'false');
  });

  it('escapes commas, quotes, and newlines per RFC 4180', () => {
    assert.strictEqual(escapeCsvValue('Hello, world'), '"Hello, world"');
    assert.strictEqual(escapeCsvValue('He said "hello"'), '"He said ""hello"""');
    assert.strictEqual(escapeCsvValue('Line 1\nLine 2'), '"Line 1\nLine 2"');
    assert.strictEqual(escapeCsvValue('Mixed, "with quotes"\nand newlines'), '"Mixed, ""with quotes""\nand newlines"');
  });

  it('neutralizes CSV / spreadsheet formula injection risks', () => {
    assert.strictEqual(escapeCsvValue('=SUM(A1:A10)'), "'=SUM(A1:A10)");
    assert.strictEqual(escapeCsvValue('+12345'), "'+12345");
    assert.strictEqual(escapeCsvValue('-12345'), "'-12345");
    assert.strictEqual(escapeCsvValue('@command'), "'@command");
    assert.strictEqual(escapeCsvValue('=cmd|’ /C calc’!A0'), "'=cmd|’ /C calc’!A0");
  });
});

describe('exportUtils - sanitizeExportFilename & buildExportFilename', () => {
  it('sanitizes unsafe filesystem characters and whitespaces', () => {
    assert.strictEqual(sanitizeExportFilename('user/repo:name*test?'), 'user-repo-name-test');
    assert.strictEqual(sanitizeExportFilename('   john doe  '), 'john-doe');
    assert.strictEqual(sanitizeExportFilename('..invalid...'), 'invalid');
    assert.strictEqual(sanitizeExportFilename(''), 'export');
  });

  it('builds standard date stamp and filename format', () => {
    const testDate = new Date(2026, 9, 27); // 2026-10-27
    const dateStamp = getExportDateStamp(testDate);
    assert.strictEqual(dateStamp, '20261027');

    const csvFilename = buildExportFilename('Octocat', 'profile-summary', 'csv', testDate);
    assert.strictEqual(csvFilename, 'octocat-profile-summary-20261027.csv');

    const jsonFilename = buildExportFilename('Octocat', 'complete-report', 'json', testDate);
    assert.strictEqual(jsonFilename, 'octocat-complete-report-20261027.json');
  });
});

describe('exportUtils - generateProfileSummaryCsv', () => {
  it('generates valid UTF-8 CSV with BOM and correct profile headers', () => {
    const csv = generateProfileSummaryCsv(mockUser, mockStats);

    // Starts with UTF-8 BOM
    assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');

    // Contains essential headers
    assert.ok(csv.includes('Username,Full Name,GitHub URL,Bio'));
    assert.ok(csv.includes('Public Repositories (Total),Public Gists,Followers,Following'));

    // Values properly escaped and present
    assert.ok(csv.includes('octocat'));
    assert.ok(csv.includes('"GitHub, Inc."')); // Escaped company containing comma
    assert.ok(csv.includes('"Building tools for developers.\nOpen source enthusiast."')); // Escaped multiline bio
    assert.ok(csv.includes('Partial (Pagination in progress)'));
  });

  it('handles null stats gracefully', () => {
    const csv = generateProfileSummaryCsv(mockUser, null);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('octocat'));
  });
});

describe('exportUtils - generateRepositoriesCsv', () => {
  it('generates valid repository list CSV with UTF-8 BOM and escaped fields', () => {
    const csv = generateRepositoriesCsv(mockRepos, 'octocat');

    assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
    assert.ok(csv.includes('Repository Name,Full Name,Owner,URL,Description,Primary Language,Stars'));

    // Row 1
    assert.ok(csv.includes('Spoon-Knife,octocat/Spoon-Knife,octocat,https://github.com/octocat/Spoon-Knife'));
    assert.ok(csv.includes('12000,3500,5,MIT,No,No'));

    // Row 2 with formula injection protection
    assert.ok(csv.includes('formula-repo'));
    assert.ok(csv.includes("'=cmd|’ /C calc’!A0")); // Neutralized formula injection
    assert.ok(csv.includes('None,42,7,0,None,Yes,Yes'));
  });

  it('handles empty repositories array with header only', () => {
    const csv = generateRepositoriesCsv([], 'octocat');
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Repository Name,Full Name,Owner'));
    const lines = csv.trim().split('\r\n');
    assert.strictEqual(lines.length, 1);
  });
});

describe('exportUtils - generateProfileJson', () => {
  it('generates valid, well-structured JSON without leaking internal state', () => {
    const jsonString = generateProfileJson(mockUser, mockRepos, mockStats);
    const parsed: JsonExportPayload = JSON.parse(jsonString);

    assert.strictEqual(parsed.schemaVersion, '1.0.0');
    assert.ok(parsed.exportedAt);
    assert.strictEqual(parsed.profile.login, 'octocat');
    assert.strictEqual(parsed.profile.followers, 5000);
    assert.strictEqual(parsed.repositories.length, 2);
    assert.strictEqual(parsed.repositories[0].name, 'Spoon-Knife');
    assert.strictEqual(parsed.repositories[0].stargazers_count, 12000);
    assert.strictEqual(parsed.meta.generator, 'GitHub Profile Analyzer');
    assert.strictEqual(parsed.meta.totalPublicRepos, 8);
    assert.strictEqual(parsed.meta.loadedReposCount, 2);
    assert.strictEqual(parsed.meta.isPartialDataset, true);

    // Ensure no secrets or undefined tokens are present
    assert.strictEqual(parsed.overviewStats?.totalBatchStars, 12042);
  });
});
