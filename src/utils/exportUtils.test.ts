import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  escapeCsvValue,
  sanitizeExportFilename,
  getExportDateStamp,
  buildExportFilename,
} from './exportUtils';

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
