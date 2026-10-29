export type CsvCell = string | number | boolean | null | undefined

// Inspect leading whitespace, controls and invisible formatting characters
// without trimming, normalizing or deleting any of the original value.
const FORMULA_PREFIX = /^[\s\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}]*[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]/u

/** Serialize one cell for spreadsheet viewing, including formula neutralization. */
export function serializeCsvCell(value: CsvCell): string {
  const text = value === null || value === undefined ? '' : String(value)
  // A quoted leading tab targets Excel's CSV handling. The following apostrophe
  // remains a literal-text guard for importers that trim leading whitespace.
  // Both markers are export-only; consumers must not strip them before opening.
  const guarded = FORMULA_PREFIX.test(text) ? `\t'${text}` : text
  return `"${guarded.replace(/"/g, '""')}"`
}

/** Comma-separated, LF-delimited CSV; callers retain their existing BOM policy. */
export function serializeCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(serializeCsvCell).join(',')).join('\n')
}
