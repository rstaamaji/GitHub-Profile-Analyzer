/**
 * Utilities and formatting helpers for Web Accessibility (WCAG 2.1 AA)
 */

/**
 * Formats a clear, descriptive aria-label for key metrics and statistics cards.
 */
export function formatStatAriaLabel(
  title: string,
  value: string | number,
  hint?: string
): string {
  const cleanTitle = title.trim();
  const cleanValue = typeof value === 'number' ? value.toLocaleString('en-US') : String(value).trim();
  if (hint && hint.trim()) {
    return `${cleanTitle}: ${cleanValue}. ${hint.trim()}`;
  }
  return `${cleanTitle}: ${cleanValue}`;
}

/**
 * Formats an accessible description for progress and comparison bars.
 */
export function getAccessibleRatioDescription(
  value: number,
  label?: string,
  unit = '%'
): string {
  const rounded = Math.round(value);
  if (label && label.trim()) {
    return `${label.trim()}: ${rounded}${unit}`;
  }
  return `${rounded}${unit}`;
}

/**
 * Calculates target index for W3C APG Tablist keyboard navigation.
 * Supports ArrowRight, ArrowLeft, Home, and End keys with circular wrapping.
 */
export function getAriaTabKeyNav(
  key: string,
  currentIndex: number,
  totalTabs: number
): number | null {
  if (totalTabs <= 0) return null;

  switch (key) {
    case 'ArrowRight':
      return (currentIndex + 1) % totalTabs;
    case 'ArrowLeft':
      return (currentIndex - 1 + totalTabs) % totalTabs;
    case 'Home':
      return 0;
    case 'End':
      return totalTabs - 1;
    default:
      return null;
  }
}

/**
 * Safely converts an ISO date or timestamp into a readable text string for screen readers.
 */
export function formatScreenReaderDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'No date available';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
