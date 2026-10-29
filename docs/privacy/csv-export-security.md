# Spreadsheet CSV export security — Phase 1C

## Confirmed boundary

The only active CSV export found in application code, API routes and scripts is `src/components/admin/admin-master-list.tsx` (`exportCsv`). Candidate-provided names, rank, nationality, vessel types and location pass through the admin API into this browser download. Registration/profile/experience validators constrain length and trim some fields, but do not prevent formula-like content; existing database data must also be treated as untrusted.

The previous local `escapeCsv` only escaped CSV commas, quotes and line breaks. For example, `=1+1`, `+1+1`, `-1+1`, `@SUM(1)`, and formulas preceded by tab, NUL or zero-width space were returned unchanged. CSV quotation alone does not make a spreadsheet formula literal text.

## Neutralization strategy

`src/lib/csv.ts` supplies `serializeCsvCell` and `serializeCsv`. The admin export uses the shared serializer for **every header and cell**, keeping the existing nine-column allowlist and ordering:

1. Name
2. Rank
3. Nationality
4. Availability
5. Vessel-type summary
6. Years of experience
7. City
8. Country
9. Registration date

The helper converts null/undefined to an empty cell and other supported scalar values to strings. It checks the first significant character after leading whitespace, Unicode control/format characters and Unicode default-ignorable characters. Dangerous ASCII prefixes are `=`, `+`, `-`, `@`; their full-width forms `＝`, `＋`, `－`, `＠` are guarded as well. Detection does not trim or normalize the exported value.

For a suspicious cell, prefix **TAB followed by an apostrophe** before the entire original value. The quoted tab targets Excel CSV handling; the apostrophe is an additional literal-text guard for importers that trim leading whitespace. For example, `=1+1` becomes the CSV field `"\t'=1+1"`, where `\t` represents an actual U+0009 tab. All fields are enclosed in double quotes and internal quotes are doubled, preventing embedded separators or line breaks from creating new cells. Never use formula wrappers such as `="..."` for escaping.

Ordinary content round-trips unchanged as decoded CSV cells: Arabic names and combining marks, maritime terminology, emoji, Unicode, whitespace, commas, quotes and original CR/LF sequences. Existing LF record separators, UTF-8 BOM, filename pattern, MIME type, supplied filtered-record set and browser download lifecycle remain unchanged. No underlying data is edited. The serialization changes only exported bytes; potentially formula-like numeric strings such as `-10`, positive-sign numbers and `@handles` are deliberately treated as text.

The [OWASP CSV injection guidance](https://community.owasp.org/attacks/CSV_Injection) identifies formula starters, full-width variants, delimiter/quote breakout, and Excel's quoted-tab mitigation. It also warns that escape handling varies by application and after saving/reopening. CrewLink combines the tab and apostrophe guards for this human-viewing export; this is a defense-in-depth choice, not a claim of universal spreadsheet compatibility.

## Spreadsheet-specific limits

- CSV has no cell-type metadata. There is no universal neutralization that is safe across every spreadsheet/import configuration and downstream consumer. This export is designed for human spreadsheet viewing, not a byte-identical interchange format.
- Guard bytes remain part of the decoded value. Excel, LibreOffice, Google Sheets and plain CSV parsers may display or preserve the tab/apostrophe differently. Do not strip them, trim/rewrite protected values, or copy reconstructed raw content into a formula-enabled cell.
- Spreadsheet save/export/reopen, conversion, copy/paste or import transformations can remove protection or reinterpret content. The initial serialized output is covered by automated tests; safety after arbitrary transformations is not guaranteed. If this lifecycle is required, consider a separately reviewed typed XLSX export rather than CSV.
- Use comma as the import delimiter and UTF-8 encoding; locale-driven delimiter guesses can change layout. Preserve quoted multiline fields and the existing BOM.
- Non-formula numeric/date-looking values may still be autoformatted by a spreadsheet. Exact text fidelity for identifiers requires importing columns as Text. Formula protection does not replace the existing authorization and privacy column allowlist.

## Verification

Run `node --test tests/csv-security.test.mjs`, then `node --test tests/*.test.mjs`. Tests exercise the actual helper and admin download function with synthetic records and browser boundaries. An independent CSV parser checks decoded values and column/record counts; coverage includes all C0/C1/DEL leading controls, selected Unicode whitespace/invisible bypasses, all dangerous starters, full-width forms, Arabic, quoting, multiline values, header protection, data minimization, BOM and download behavior. No database or application preferences are accessed.

Manual acceptance is still required in supported versions of Excel, LibreOffice Calc and Google Sheets: open/import a synthetic CSV, verify formula-like values are displayed as text without evaluation, inspect all nine columns and Arabic/multiline values, then assess save/reopen and copy/paste separately. Use harmless examples such as `=1+1`; do not use external links, macros or executable payloads for verification. Automated serialization tests do not certify a spreadsheet application or a transformed/re-exported CSV.
