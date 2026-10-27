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
