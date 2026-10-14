import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatStatAriaLabel,
  getAccessibleRatioDescription,
  getAriaTabKeyNav,
  formatScreenReaderDate,
} from './accessibility';

describe('accessibility utility functions', () => {
  it('formats accessible aria-labels for stat cards with and without hints', () => {
    assert.equal(
      formatStatAriaLabel('Total Repositories', 42),
      'Total Repositories: 42'
    );
    assert.equal(
      formatStatAriaLabel('Followers', 1250, '1.2k developer followers'),
      'Followers: 1,250. 1.2k developer followers'
    );
    assert.equal(
      formatStatAriaLabel('Public Gists', '0', ''),
      'Public Gists: 0'
    );
  });

  it('formats progress and comparison bar descriptions accurately', () => {
    assert.equal(getAccessibleRatioDescription(74.6), '75%');
    assert.equal(getAccessibleRatioDescription(80, 'TypeScript Share'), 'TypeScript Share: 80%');
    assert.equal(getAccessibleRatioDescription(0, 'Rust', ' pts'), 'Rust: 0 pts');
  });

  it('calculates APG tab keyboard navigation correctly with circular wrapping', () => {
    // 4 tabs: 0, 1, 2, 3
    assert.equal(getAriaTabKeyNav('ArrowRight', 0, 4), 1);
    assert.equal(getAriaTabKeyNav('ArrowRight', 3, 4), 0); // wrap
    assert.equal(getAriaTabKeyNav('ArrowLeft', 0, 4), 3); // wrap backwards
    assert.equal(getAriaTabKeyNav('ArrowLeft', 2, 4), 1);
    assert.equal(getAriaTabKeyNav('Home', 2, 4), 0);
    assert.equal(getAriaTabKeyNav('End', 1, 4), 3);
    assert.equal(getAriaTabKeyNav('Tab', 1, 4), null);
    assert.equal(getAriaTabKeyNav('Enter', 1, 4), null);
    assert.equal(getAriaTabKeyNav('ArrowRight', 0, 0), null);
  });

  it('safely formats dates for assistive technology', () => {
    assert.equal(formatScreenReaderDate(null), 'No date available');
    assert.equal(formatScreenReaderDate(undefined), 'No date available');
    assert.equal(formatScreenReaderDate('invalid-date-string'), 'Invalid date');
    assert.equal(
      formatScreenReaderDate('2024-03-15T12:00:00Z'),
      'March 15, 2024'
    );
  });
});
