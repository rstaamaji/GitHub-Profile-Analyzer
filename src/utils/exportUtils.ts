/**
 * Escapes a single string or primitive value for standard RFC 4180 CSV output.
 *
 * Rules:
 * - null/undefined become empty string "".
 * - Numbers and booleans are converted to string.
 * - Formula injection prevention: values starting with '=', '+', '-', '@', '\t', '\r'
 *   are prepended with a single quote (') to prevent spreadsheet execution vulnerabilities.
 * - Values containing commas (,), quotes ("), newlines (\n), or carriage returns (\r)
 *   are wrapped in double quotes, with internal quotes escaped as two double quotes ("").
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Guard against CSV / Spreadsheet formula injection (CSV Injection / DDE)
  let safeStr = str;
  if (/^[=+\-@\t\r]/.test(safeStr)) {
    safeStr = `'${safeStr}`;
  }

  // Check if quoting is needed
  if (/[",\n\r]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}


/**
 * Sanitizes a string for use as a safe filename across Windows, macOS, and Linux.
 * Removes control characters and illegal filesystem characters (\ / : * ? " < > |).
 */
export function sanitizeExportFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'export';
  }

  // Remove leading/trailing spaces and dots, replace unsafe chars with hyphens
  const sanitized = rawName
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');

  return sanitized || 'export';
}

/**
 * Formats a Date object into a compact YYYYMMDD date stamp string.
 */
export function getExportDateStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Builds a standardized, safe filename for exports.
 */
export function buildExportFilename(
  username: string,
  type: 'profile-summary' | 'repositories' | 'complete-report',
  extension: 'csv' | 'json',
  date = new Date()
): string {
  const safeUser = sanitizeExportFilename(username.toLowerCase());
  const dateStamp = getExportDateStamp(date);
  return `${safeUser}-${type}-${dateStamp}.${extension}`;
}

/**
 * Triggers a browser download of the given content string as a file using Blob and object URL.
 * Cleans up temporary object URLs automatically after the download initiates.
 */
export function triggerBlobDownload(
  content: string,
  filename: string,
  mimeType: 'text/csv;charset=utf-8;' | 'application/json;charset=utf-8;'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up the object URL and remove the anchor tag
  window.setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}
