import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'
import { NextRequest } from 'next/server.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const users = {
  anonymous: null,
  seafarer: { id: 'candidate-a', role: 'SEAFARER' },
  otherSeafarer: { id: 'candidate-b', role: 'SEAFARER' },
  recruiterA: { id: 'recruiter-a', role: 'RECRUITER' },
  recruiterB: { id: 'recruiter-b', role: 'RECRUITER' },
  admin: { id: 'administrator', role: 'ADMIN' },
}

const jobs = [
  ['a-open', 'recruiter-a', 'OPEN', 'Master', 'Container Ship', 'Rotterdam'],
  ['a-closed', 'recruiter-a', 'CLOSED', 'Master', 'Container Ship', 'Rotterdam'],
  ['b-open', 'recruiter-b', 'OPEN', 'Chief Officer', 'Oil Tanker', 'Copenhagen'],
  ['b-closed', 'recruiter-b', 'CLOSED', 'Chief Officer', 'Oil Tanker', 'Copenhagen'],
].map(([id, recruiterId, status, rank, vesselType, location], index) => ({
  id, recruiterId, status, rank, vesselType, location,
  title: `${rank} vacancy`,
  companyName: recruiterId === 'recruiter-a' ? 'Company A' : 'Company B',
  salaryMin: '1000', salaryMax: '2000', currency: 'USD',
  contractDuration: '6 months', joiningDate: null,
  description: `Description for ${id}`, requirements: 'Relevant qualifications',
  createdAt: new Date(Date.UTC(2026, 0, index + 1)),
  updatedAt: new Date(Date.UTC(2026, 1, 1)),
  recruiter: {
    id: recruiterId, name: `Name ${recruiterId}`, company: `Company ${recruiterId}`,
    email: 'private@example.invalid', phone: '+000000000',
    passwordHash: 'synthetic-private-hash',
  },
  _count: { applications: 1 },
}))

// Synthetic relationship exists even for a closed job. It must not grant direct
// detail access: application creation currently does not enforce OPEN status.
const applications = [
  { jobId: 'a-open', seafarerId: 'profile-a', status: 'SHORTLISTED' },
  { jobId: 'b-closed', seafarerId: 'profile-a', status: 'PENDING' },
]

// Evaluate the small Prisma predicate subset used by these handlers against
// independent fixtures. Unknown filters fail the test instead of being ignored.
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (Array.isArray(value) ? value : [value]).every((part) => matches(row, part))
    if (key === 'OR') return value.some((part) => matches(row, part))
    assert.ok(['id', 'recruiterId', 'status', 'rank', 'vesselType', 'title', 'companyName', 'location'].includes(key), `Unsupported filter ${key}`)
    if (typeof value !== 'object' || value === null) return row[key] === value
    if ('contains' in value) return row[key]?.includes(value.contains) ?? false
    if ('in' in value) return value.in.includes(row[key])
    assert.fail(`Unsupported condition for ${key}`)
  })
}

function project(row, select) {
  return Object.fromEntries(Object.entries(select).filter(([, value]) => value).map(([key, value]) => [
    key,
    value === true ? row[key] : project(row[key], value.select),
  ]))
}

function loadRoutes(user) {
  const queries = []
  const readJob = (row, args) => {
    if (args.select) return project(row, args.select)
    // Supports the old implementation so the same tests reproduce the original
    // scope and personal-data leaks before the patch is applied.
    const result = { ...row }
    delete result.recruiter
    delete result._count
    if (args.include?.recruiter) result.recruiter = project(row.recruiter, args.include.recruiter.select)
    if (args.include?._count) result._count = row._count
    return result
  }
  const db = {
    job: {
      findMany: async (args) => {
        queries.push(args)
        return jobs.filter((row) => matches(row, args.where))
          .sort((a, b) => b.createdAt - a.createdAt).map((row) => readJob(row, args))
      },
      findFirst: async (args) => {
        queries.push(args)
        const row = jobs.find((row) => matches(row, args.where))
        return row ? readJob(row, args) : null
      },
      findUnique: async (args) => {
        queries.push(args)
        const row = jobs.find((row) => matches(row, args.where))
        return row ? readJob(row, args) : null
      },
    },
    seafarerProfile: {
      findUnique: async ({ where }) => where.userId === 'candidate-a' ? { id: 'profile-a' } : null,
    },
    application: {
      findMany: async ({ where }) => applications.filter((row) => row.seafarerId === where.seafarerId),
    },
  }
  const cache = new Map()
  function load(file) {
    if (cache.has(file)) return cache.get(file)
    const exports = {}
    cache.set(file, exports)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: file,
    }).outputText
    const externalRequire = createRequire(file)
    const requireDependency = (specifier) => {
      if (specifier === '@/lib/db') return { db }
      if (specifier === '@/lib/auth') return { getCurrentUser: async () => user }
      if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const target = specifier.startsWith('@/')
          ? path.join(root, 'src', specifier.slice(2))
          : path.resolve(path.dirname(file), specifier)
        const resolved = [target, `${target}.ts`, `${target}.mjs`].find((candidate) => existsSync(candidate))
        assert.ok(resolved, `Cannot resolve ${specifier}`)
        return load(resolved)
      }
      return externalRequire(specifier)
    }
    // Execute real route/helper/validation source in memory, replacing only the
    // authentication and database boundaries. Never import the real DB module.
    runInThisContext(`(function(exports, require) { ${code}\n})`, { filename: file })(exports, requireDependency)
    return exports
  }
  return {
    list: load(path.join(root, 'src/app/api/jobs/route.ts')).GET,
    detail: load(path.join(root, 'src/app/api/jobs/[id]/route.ts')).GET,
    queries,
  }
}

const request = (query = '') => new NextRequest(`http://localhost/api/jobs${query}`)
const ids = (body) => body.jobs.map((job) => job.id).sort()

for (const identity of ['anonymous', 'seafarer', 'recruiterA', 'recruiterB', 'admin']) {
  test(`${identity}: discovery lists only OPEN jobs`, async () => {
    const routes = loadRoutes(users[identity])
    const response = await routes.list(request())
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.deepEqual(ids(body), ['a-open', 'b-open'])
    assert.equal(body.total, 2)
    assert.equal(body.jobs[0].id, 'b-open', 'Preserve newest-first order')
  })
}

for (const [identity, status] of [['anonymous', 401], ['seafarer', 403], ['admin', 403]]) {
  for (const query of ['?mine=1', '?mine=%31&search=vacancy', '?mine=1&mine=0&rank=Master']) {
    test(`${identity}: rejects recruiter-only list ${query}`, async () => {
      const routes = loadRoutes(users[identity])
      const response = await routes.list(request(query))
      assert.equal(response.status, status)
      assert.deepEqual(await response.json(), { error: 'unauthorized' })
      assert.equal(routes.queries.length, 0, 'Reject before querying jobs')
    })
  }
}

for (const [identity, expected] of [['recruiterA', ['a-closed', 'a-open']], ['recruiterB', ['b-closed', 'b-open']]]) {
  test(`${identity}: mine=1 includes only own OPEN and CLOSED jobs`, async () => {
    const response = await loadRoutes(users[identity]).list(request('?mine=1'))
    assert.equal(response.status, 200)
    assert.deepEqual(ids(await response.json()), expected)
  })
}

test('search/rank/vessel filters cannot broaden ownership or public scope', async () => {
  for (const [user, query, expected] of [
    [null, '?search=vacancy&rank=Master&vesselType=Container%20Ship', ['a-open']],
    [users.recruiterA, '?mine=1&search=Company%20B', []],
    [users.recruiterA, '?mine=1&search=Rotterdam', ['a-closed', 'a-open']],
    [users.recruiterA, '?mine=1&rank=Chief%20Officer&vesselType=Oil%20Tanker', []],
    [users.seafarer, '?mine=0&mine=1&status=CLOSED&recruiterId=recruiter-b', ['a-open', 'b-open']],
  ]) {
    const response = await loadRoutes(user).list(request(query))
    assert.equal(response.status, 200)
    assert.deepEqual(ids(await response.json()), expected)
  }
})

test('seafarer application status belongs to current caller only', async () => {
  const response = await loadRoutes(users.seafarer).list(request())
  const body = await response.json()
  assert.equal(body.jobs.find((job) => job.id === 'a-open').myApplicationStatus, 'SHORTLISTED')
  assert.equal(body.jobs.find((job) => job.id === 'b-open').myApplicationStatus, null)
  for (const user of [null, users.otherSeafarer, users.recruiterA]) {
    const response = await loadRoutes(user).list(request())
    assert.ok((await response.json()).jobs.every((job) => job.myApplicationStatus === null))
  }
})

for (const identity of Object.keys(users)) {
  test(`${identity}: OPEN detail is public discovery`, async () => {
    const response = await loadRoutes(users[identity]).detail(request(), { params: Promise.resolve({ id: 'b-open' }) })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).job.id, 'b-open')
  })
}

for (const [identity, id, expectedStatus] of [
  ['anonymous', 'b-closed', 404],
  ['seafarer', 'a-closed', 404],
  ['seafarer', 'b-closed', 404], // Own application does not unlock closed detail.
  ['otherSeafarer', 'b-closed', 404],
  ['recruiterA', 'b-closed', 404],
  ['recruiterA', 'a-closed', 200],
  ['recruiterB', 'a-closed', 404],
  ['recruiterB', 'b-closed', 200],
  ['admin', 'a-closed', 200],
  ['admin', 'b-closed', 200],
]) {
  test(`${identity}: ${id} detail returns ${expectedStatus}`, async () => {
    const response = await loadRoutes(users[identity]).detail(request('?mine=1&status=OPEN'), { params: Promise.resolve({ id }) })
    assert.equal(response.status, expectedStatus)
    assert.deepEqual(await response.json(), expectedStatus === 200
      ? JSON.parse(JSON.stringify({ job: project(jobs.find((row) => row.id === id), loadJobSelect()) }))
      : { error: 'not_found' })
  })
}

function loadJobSelect() {
  // Explicit response contract independent of the production projection.
  return {
    id: true, recruiterId: true, title: true, rank: true, vesselType: true,
    companyName: true, salaryMin: true, salaryMax: true, currency: true,
    contractDuration: true, joiningDate: true, location: true, description: true,
    requirements: true, status: true, createdAt: true, updatedAt: true,
    recruiter: { select: { id: true, name: true, company: true } },
    _count: { select: { applications: true } },
  }
}

for (const identity of Object.keys(users)) {
  test(`${identity}: unknown and forbidden IDs do not disclose details`, async () => {
    const response = await loadRoutes(users[identity]).detail(request(), { params: Promise.resolve({ id: 'unknown' }) })
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'not_found' })
  })
}

test('all allowed job responses exclude recruiter personal fields', async () => {
  for (const user of Object.values(users)) {
    const routes = loadRoutes(user)
    const listResponse = await routes.list(request(user?.role === 'RECRUITER' ? '?mine=1' : ''))
    const listBody = await listResponse.json()
    const detailResponse = await routes.detail(request(), { params: Promise.resolve({ id: user?.role === 'RECRUITER' ? `${user.id === 'recruiter-a' ? 'a' : 'b'}-closed` : 'a-open' }) })
    const detailBody = await detailResponse.json()
    for (const job of [...listBody.jobs, detailBody.job]) {
      assert.deepEqual(Object.keys(job.recruiter).sort(), ['company', 'id', 'name'])
      assert.equal(JSON.stringify(job).includes('private@example.invalid'), false)
      assert.equal(JSON.stringify(job).includes('synthetic-private-hash'), false)
    }
  }
})
