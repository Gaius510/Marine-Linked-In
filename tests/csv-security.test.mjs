import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { routeLoader } from './helpers/load-route.mjs'

const { serializeCsvCell, serializeCsv } = routeLoader({})('src/lib/csv.ts')
const guard = "\t'"

// Independent CSV parser: assertions concern decoded cells/records, not just
// whether a particular escaping expression or substring appears in output.
function parseCsv(csv) {
  if (csv === '') return []
  const rows = []
  let row = [], field = '', quoted = false
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index]
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') { field += '"'; index++ }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') {
      assert.equal(field, '', 'Quote must begin at the cell boundary')
      quoted = true
    } else if (char === ',') {
      row.push(field); field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[index + 1] === '\n') index++
      rows.push([...row, field]); row = []; field = ''
    } else field += char
  }
  assert.equal(quoted, false, 'No unterminated quoted field')
  rows.push([...row, field])
  return rows
}

const normalValues = [
  'Master', 'Chief Officer / STCW II/2', 'LNG Carrier; DP AHTS',
  'محمد أحمد', 'رئيس المهندسين — خبرة بحرية', 'Müller 李 ⚓🚢',
  "O'Connor", "'=1+1", '  Alexandria  ', 'a,b', 'a;b',
  'Captain "Ali"', 'first\nsecond', 'first\rsecond', 'first\r\nsecond',
  'first\n=1+1', 'Port = Rotterdam', '\u200fأحمد',
  '', null, undefined, 0, 123.5, true, false,
]
for (const value of normalValues) {
  test(`CSV preserves normal cell ${JSON.stringify(value)}`, () => {
    const expected = value === null || value === undefined ? '' : String(value)
    const result = serializeCsvCell(value)
    assert.ok(result.startsWith('"') && result.endsWith('"'))
    assert.deepEqual(parseCsv(result), [[expected]])
  })
}

const formulas = ['=1+1', '+SUM(1,2)', '-1+2', '@SUM(1,2)', '＝1+1', '＋1+1', '－1+1', '＠SUM(1,2)']
for (const value of formulas) {
  test(`CSV neutralizes formula starter ${value}`, () => {
    assert.deepEqual(parseCsv(serializeCsvCell(value)), [[guard + value]])
    // A whitespace-trimming importer still sees an apostrophe before a formula.
    assert.ok(parseCsv(serializeCsvCell(value))[0][0].trimStart().startsWith("'"))
  })
}

test('all leading C0/C1 controls and DEL are handled without deleting data', () => {
  const controls = [...Array.from({ length: 32 }, (_, i) => String.fromCodePoint(i)), ...Array.from({ length: 33 }, (_, i) => String.fromCodePoint(i + 0x7f))]
  for (const control of controls) {
    for (const formula of formulas) {
      const value = control + formula
      assert.deepEqual(parseCsv(serializeCsvCell(value)), [[guard + value]])
    }
  }
})

test('Unicode whitespace, invisible marks and mixed-prefix bypasses are guarded', () => {
  const prefixes = [
    ' ', '\t', '\r', '\n', '\v', '\f', '\u0085', '\u00a0', '\u1680',
    '\u2000', '\u2007', '\u200b', '\u200c', '\u200d', '\u200e', '\u200f',
    '\u2028', '\u2029', '\u202a', '\u202b', '\u202d', '\u202e', '\u202f',
    '\u205f', '\u2060', '\u2066', '\u2067', '\u2068', '\u2069', '\u3000',
    '\ufeff', '\u034f', '\ufe0f', '\u{e0001}', ' \t\u0000\u0085\u200b\ufeff\r\n',
  ]
  for (const prefix of prefixes) {
    for (const formula of formulas) {
      const value = prefix + formula
      assert.deepEqual(parseCsv(serializeCsvCell(value)), [[guard + value]])
    }
  }
})

test('formula-like numbers and handles are conservatively exported as text', () => {
  for (const value of [-10, '-10', '+49123456', '@captain']) {
    assert.deepEqual(parseCsv(serializeCsvCell(value)), [[guard + String(value)]])
  }
})

test('embedded quotes, separators and CRLF cannot break out into new cells', () => {
  const values = [
    'Safe",=1+1', 'Safe";=1+1', 'Safe\",\r\n=1+1',
    '=HYPERLINK("https://example.invalid","text")',
    '\u0000\r\n=1+1,"quoted"\nمرحبا',
  ]
  const csv = serializeCsv([['Name', 'Notes'], ...values.map((value) => [value, 'Safe second column'])])
  const decoded = parseCsv(csv)
  assert.equal(decoded.length, values.length + 1)
  assert.ok(decoded.every((row) => row.length === 2))
  assert.deepEqual(decoded.slice(1), values.map((value, index) => [index >= 3 ? guard + value : value, 'Safe second column']))
})

test('empty exports, headers and inputs retain their documented shapes', () => {
  assert.equal(serializeCsv([]), '')
  const rows = [['=Header', 'الاسم'], [null, 'أحمد، "الربان"\r\nAlexandria']]
  const before = structuredClone(rows)
  assert.deepEqual(parseCsv(serializeCsv(rows)), [[guard + '=Header', 'الاسم'], ['', 'أحمد، "الربان"\r\nAlexandria']])
  assert.deepEqual(rows, before, 'Serialization does not mutate inputs')
  assert.ok(!serializeCsv(rows).startsWith('\ufeff'), 'The download caller owns the UTF-8 BOM')
})

// Extract the actual download function and its two local formatting dependencies
// to exercise the current nine-column export without rendering React or touching
// real browser preferences, files, authentication or databases.
function downloadHarness() {
  const file = new URL('../src/components/admin/admin-master-list.tsx', import.meta.url)
  const source = ts.createSourceFile(file.pathname, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const names = ['formatDate', 'vesselTypeSummary', 'exportCsv']
  const functions = names.map((name) => {
    const node = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name)
    assert.ok(node, `Missing export dependency ${name}`)
    return node.getText(source)
  })
  assert.ok(source.statements.some((node) => ts.isImportDeclaration(node) && node.moduleSpecifier.text === '@/lib/csv' && node.importClause?.namedBindings?.elements.some((item) => item.name.text === 'serializeCsv')), 'Download must use the shared serializer')
  const code = ts.transpileModule(functions.join('\n') + '\nexports.exportCsv = exportCsv;', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const capture = { clicks: 0, attached: 0, removed: 0, revoked: [], toasts: [] }
  const exports = {}
  const document = {
    createElement: (tag) => { assert.equal(tag, 'a'); return capture.anchor = { click: () => { capture.clicks++ } } },
    body: { appendChild: () => { capture.attached++ }, removeChild: () => { capture.removed++ } },
  }
  const url = {
    createObjectURL: (blob) => { capture.blob = blob; return 'blob:csv-test' },
    revokeObjectURL: (value) => capture.revoked.push(value),
  }
  new Function('exports', 'serializeCsv', 'Blob', 'URL', 'document', 'toast', code)(exports, serializeCsv, Blob, url, document, { success: (text) => capture.toasts.push(text) })
  return { exportCsv: exports.exportCsv, capture }
}

test('actual admin download preserves nine columns, Arabic BOM, filename and selected records', async () => {
  const { exportCsv, capture } = downloadHarness()
  const headers = ['الاسم', 'الرتبة', 'الجنسية', 'الجاهزية', 'الخدمة البحرية', 'سنوات الخبرة', 'المدينة', 'الدولة', 'تاريخ التسجيل']
  const headerKeys = ['admin.name', 'admin.rank', 'admin.nationality', 'admin.availability', 'admin.vesselExp', 'cv.yearsExperience', 'auth.city', 'auth.country', 'admin.registeredDate']
  const t = (key, vars) => key === 'admin.exportSuccess' ? `exported ${vars.count}` : headers[headerKeys.indexOf(key)]
  const records = [{
    user: { name: '\u200b=1+1', city: 'الإسكندرية, "ميناء"\r\nالمحطة', country: 'مصر', createdAt: '2026-01-02T00:00:00Z', email: 'private@example.invalid', phone: '+00000000' },
    rank: 'Master', nationality: 'Egyptian', availability: 'AVAILABLE', yearsExperience: '12',
    vesselExperiences: [{ vesselType: 'LNG Carrier' }, { vesselType: 'LNG Carrier' }, { vesselType: 'Oil Tanker' }],
    passportNo: 'PRIVATE-PASSPORT', notes: 'PRIVATE-NOTES',
  }]
  const before = structuredClone(records)
  exportCsv(records, t)
  const bytes = new Uint8Array(await capture.blob.arrayBuffer())
  assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xef, 0xbb, 0xbf])
  const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)
  const rows = parseCsv(csv.slice(1))
  assert.deepEqual(rows[0], headers)
  assert.equal(rows.length, 2, 'Export only the supplied filtered records')
  assert.equal(rows[1].length, 9)
  assert.deepEqual(rows[1].slice(0, 8), [guard + records[0].user.name, 'Master', 'Egyptian', 'AVAILABLE', 'LNG Carrier; Oil Tanker', '12', records[0].user.city, 'مصر'])
  assert.ok(rows[1][8].length > 0, 'Registration date remains populated')
  assert.ok(!csv.includes('private@example.invalid') && !csv.includes('PRIVATE-PASSPORT') && !csv.includes('PRIVATE-NOTES'))
  assert.equal(capture.blob.type, 'text/csv;charset=utf-8;')
  assert.match(capture.anchor.download, /^seafarers-\d{4}-\d{2}-\d{2}\.csv$/)
  assert.equal(capture.anchor.href, 'blob:csv-test')
  assert.deepEqual([capture.clicks, capture.attached, capture.removed], [1, 1, 1])
  assert.deepEqual(capture.revoked, ['blob:csv-test'])
  assert.deepEqual(capture.toasts, ['exported 1'])
  assert.deepEqual(records, before)
})

test('every actual export column and translated header passes through neutralization', async () => {
  const { exportCsv, capture } = downloadHarness()
  exportCsv([{
    user: { name: '=name', city: '\u0000-city', country: '\u2060@country', createdAt: '=invalid-date' },
    rank: '+rank', nationality: '-nationality', availability: '@availability', yearsExperience: '＝years',
    vesselExperiences: [{ vesselType: '\t=vessel' }],
  }], (key) => `=${key}`)
  const csv = new TextDecoder().decode(await capture.blob.arrayBuffer())
  const rows = parseCsv(csv)
  assert.equal(rows.length, 2)
  assert.ok(rows.every((row) => row.length === 9 && row.every((cell) => cell.startsWith(guard))))
})
