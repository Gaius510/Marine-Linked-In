import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Prisma } from '@prisma/client'
import { NextRequest } from 'next/server.js'
import { routeLoader } from './helpers/load-route.mjs'

const identities = {
  anonymous: null,
  seafarer: { id: 'candidate-a', role: 'SEAFARER' },
  otherSeafarer: { id: 'candidate-b', role: 'SEAFARER' },
  noProfile: { id: 'candidate-missing', role: 'SEAFARER' },
  recruiterA: { id: 'recruiter-a', role: 'RECRUITER' },
  recruiterB: { id: 'recruiter-b', role: 'RECRUITER' },
  admin: { id: 'administrator', role: 'ADMIN' },
}
const future = () => new Date(Date.now() + 86_400_000).toISOString()
const request = (endpoint, body, method = 'POST') => new NextRequest(`http://localhost/api/${endpoint}`, {
  method, headers: { 'Content-Type': 'application/json' },
  ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
})
const context = (id) => ({ params: Promise.resolve({ id }) })
const databaseError = (code) => new Prisma.PrismaClientKnownRequestError('sensitive database detail: private@example.invalid', { code, clientVersion: 'test' })

function fixture(identity = 'seafarer', { failAt, failure, duplicateRace = false, closeAtTransaction = false } = {}) {
  const users = Object.values(identities).filter(Boolean).map((user) => ({
    ...user, name: `Name ${user.id}`, company: `Company ${user.id}`,
    email: `${user.id}@example.invalid`, phone: '+000000', passwordHash: 'private-hash', city: null, country: null,
  }))
  const profiles = [
    { id: 'profile-a', userId: 'candidate-a', availability: 'AVAILABLE' },
    { id: 'profile-b', userId: 'candidate-b', availability: 'AVAILABLE' },
  ]
  const jobs = [
    { id: 'a-open', recruiterId: 'recruiter-a', status: 'OPEN', title: 'Open A' },
    { id: 'a-closed', recruiterId: 'recruiter-a', status: 'CLOSED', title: 'Closed A' },
    { id: 'b-open', recruiterId: 'recruiter-b', status: 'OPEN', title: 'Open B' },
    { id: 'b-closed', recruiterId: 'recruiter-b', status: 'CLOSED', title: 'Closed B' },
  ]
  const applications = [
    { id: 'application-history', jobId: 'a-closed', seafarerId: 'profile-a', status: 'REVIEWED', message: 'Historical message', createdAt: new Date() },
    { id: 'application-other', jobId: 'b-open', seafarerId: 'profile-b', status: 'PENDING', message: 'Other private message', createdAt: new Date() },
  ]
  const interviews = [
    { id: 'interview-a', recruiterId: 'recruiter-a', seafarerId: 'profile-a', jobId: 'a-closed', status: 'SCHEDULED', scheduledAt: future(), notes: 'PRIVATE RECRUITER A NOTES', createdAt: new Date() },
    { id: 'interview-b', recruiterId: 'recruiter-b', seafarerId: 'profile-b', jobId: null, status: 'SCHEDULED', scheduledAt: future(), notes: 'PRIVATE RECRUITER B NOTES', createdAt: new Date() },
  ]
  const tables = { user: users, seafarerProfile: profiles, job: jobs, application: applications, interview: interviews }
  const calls = []
  let inTransaction = false
  let queue = Promise.resolve()

  function related(model, row, key) {
    if (key === 'user' && model === 'seafarerProfile') return ['user', users.find((u) => u.id === row.userId)]
    if (key === 'recruiter') return ['user', users.find((u) => u.id === row.recruiterId)]
    if (key === 'job') return ['job', jobs.find((j) => j.id === row.jobId) ?? null]
    if (key === 'seafarer') return ['seafarerProfile', profiles.find((p) => p.id === row.seafarerId)]
    if (key === 'applications') return ['application', applications.filter((a) => a.seafarerId === row.id)]
    if (['certificates', 'vesselExperiences', 'travelAuthorizations'].includes(key)) return [key, []]
    assert.fail(`Unexpected relation ${model}.${key}`)
  }
  function matches(model, row, where = {}) {
    return Object.entries(where).every(([key, value]) => {
      if (key === 'AND') return (Array.isArray(value) ? value : [value]).every((part) => matches(model, row, part))
      if (key === 'jobId_seafarerId') return row.jobId === value.jobId && row.seafarerId === value.seafarerId
      if (typeof value !== 'object' || value === null) return row[key] === value
      const [nextModel, relation] = related(model, row, key)
      return relation && matches(nextModel, relation, value)
    })
  }
  function shape(model, row, args = {}) {
    if (row === null) return null
    if (Array.isArray(row)) return row.filter((r) => matches(model, r, args.where)).map((r) => shape(model, r, args))
    const result = args.select ? {} : { ...row }
    for (const [key, value] of Object.entries(args.select ?? args.include ?? {})) {
      if (key in row && value === true) result[key] = row[key]
      else if (key in row && !value) continue
      else {
        const [nextModel, relation] = related(model, row, key)
        result[key] = shape(nextModel, relation, value === true ? {} : value)
      }
    }
    return result
  }
  const db = {}
  for (const model of Object.keys(tables)) {
    db[model] = {}
    for (const operation of ['findUnique', 'findFirst', 'findMany', 'create', 'update']) {
      db[model][operation] = async (args) => {
        calls.push({ model, operation, args, inTransaction })
        if (`${model}.${operation}` === failAt) throw failure ?? new Error('sensitive database detail: private@example.invalid')
        const rows = tables[model]
        if (operation === 'findMany') return shape(model, rows.filter((row) => matches(model, row, args.where)), args)
        if (operation === 'findUnique' || operation === 'findFirst') {
          // Simulate a simultaneous duplicate that was not seen by the precheck.
          if (duplicateRace && model === 'application') return null
          const row = rows.find((row) => matches(model, row, args.where))
          return row ? shape(model, row, args) : null
        }
        if (operation === 'create') {
          if (model === 'application' && (duplicateRace || applications.some((a) => a.jobId === args.data.jobId && a.seafarerId === args.data.seafarerId))) throw databaseError('P2002')
          const row = { id: `${model}-new-${rows.length}`, status: model === 'application' ? 'PENDING' : 'SCHEDULED', createdAt: new Date(), ...args.data }
          rows.push(row)
          return shape(model, row, args)
        }
        const row = rows.find((row) => matches(model, row, args.where))
        if (!row) throw databaseError('P2025')
        Object.assign(row, args.data)
        return shape(model, row, args)
      }
    }
  }
  // A serialized synthetic transaction boundary: no real DB or filesystem data.
  db.$transaction = async (callback) => {
    const previous = queue
    let release
    queue = new Promise((resolve) => { release = resolve })
    await previous
    if (closeAtTransaction) jobs.find((job) => job.id === 'a-open').status = 'CLOSED'
    inTransaction = true
    const before = structuredClone({ applications, interviews })
    try { return await callback(db) }
    catch (error) {
      applications.splice(0, applications.length, ...before.applications)
      interviews.splice(0, interviews.length, ...before.interviews)
      throw error
    } finally { inTransaction = false; release() }
  }
  const load = routeLoader({ db, user: identities[identity] })
  return {
    applications, interviews, jobs, calls,
    applicationsRoute: load('src/app/api/applications/route.ts'),
    applicationUpdate: load('src/app/api/applications/[id]/route.ts').PUT,
    interviewsRoute: load('src/app/api/interviews/route.ts'),
    interviewUpdate: load('src/app/api/interviews/[id]/route.ts').PUT,
    profileRoute: load('src/app/api/seafarers/me/route.ts'),
  }
}

async function expectError(response, status, error) {
  assert.equal(response.status, status)
  assert.deepEqual(await response.json(), { error })
}

test('application to OPEN job uses the authenticated seafarer and keeps message', async () => {
  const f = fixture()
  const response = await f.applicationsRoute.POST(request('applications', { jobId: 'a-open', message: 'Available now' }))
  assert.equal(response.status, 200)
  const { application } = await response.json()
  assert.equal(application.seafarerId, 'profile-a')
  assert.equal(application.jobId, 'a-open')
  assert.equal(application.message, 'Available now')
  assert.equal(application.status, 'PENDING')
  assert.ok(f.calls.filter((call) => call.model === 'job' || call.operation === 'create').every((call) => call.inTransaction), 'Eligibility and insertion share a transaction')
})

for (const jobId of ['a-closed', 'b-closed', 'unknown']) {
  test(`application rejects ${jobId} without inserting or exposing details`, async () => {
    const f = fixture()
    await expectError(await f.applicationsRoute.POST(request('applications', { jobId })), 404, 'not_found')
    assert.equal(f.applications.length, 2)
    assert.equal(f.calls.some((call) => call.operation === 'create'), false)
  })
}
for (const [identity, status] of [['anonymous', 401], ['recruiterA', 403], ['admin', 403]]) {
  test(`${identity} cannot create an application`, async () => {
    const f = fixture(identity)
    await expectError(await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' })), status, 'unauthorized')
    assert.equal(f.calls.length, 0)
  })
}
test('application requires a seafarer profile', async () => {
  await expectError(await fixture('noProfile').applicationsRoute.POST(request('applications', { jobId: 'a-open' })), 404, 'no_profile')
})
test('duplicate OPEN application returns 409 without the existing record', async () => {
  const f = fixture()
  await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' }))
  await expectError(await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' })), 409, 'already_applied')
  assert.equal(f.applications.filter((a) => a.jobId === 'a-open').length, 1)
})
test('duplicate insertion race returns safe 409', async () => {
  const f = fixture('seafarer', { duplicateRace: true })
  await expectError(await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' })), 409, 'already_applied')
})
test('two simultaneous requests create one application', async () => {
  const f = fixture()
  const responses = await Promise.all([1, 2].map(() => f.applicationsRoute.POST(request('applications', { jobId: 'a-open' }))))
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409])
  assert.equal(f.applications.filter((a) => a.jobId === 'a-open').length, 1)
})
test('job closed before transaction is rejected', async () => {
  const f = fixture('seafarer', { closeAtTransaction: true })
  await expectError(await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' })), 404, 'not_found')
})
for (const payload of [{ jobId: 'a-open', seafarerId: 'profile-b' }, { jobId: 'a-open', status: 'HIRED' }]) {
  test(`application rejects identity/status injection: ${Object.keys(payload)[1]}`, async () => {
    const f = fixture()
    const response = await f.applicationsRoute.POST(request('applications', payload))
    assert.equal(response.status, 400)
    assert.equal((await response.json()).error, 'validation_error')
    assert.equal(f.calls.some((call) => call.operation === 'create'), false)
  })
}
for (const [code, status, error] of [['P2003', 404, 'not_found'], ['P2034', 409, 'request_conflict'], ['P2025', 404, 'not_found'], ['unexpected', 500, 'server_error']]) {
  test(`application safely handles ${code}`, async () => {
    const f = fixture('seafarer', { failAt: 'application.create', failure: code === 'unexpected' ? new Error('sensitive database detail') : databaseError(code) })
    await expectError(await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' })), status, error)
    assert.equal(f.applications.length, 2)
  })
}

test('closing a job preserves history in both own application response paths without recruiter contacts', async () => {
  const f = fixture()
  const created = await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' }))
  assert.equal(created.status, 200)
  f.jobs.find((j) => j.id === 'a-open').status = 'CLOSED'
  await expectError(await f.applicationsRoute.POST(request('applications', { jobId: 'a-open' })), 404, 'not_found')
  const history = await f.applicationsRoute.GET(request('applications', null, 'GET'))
  const profile = await f.profileRoute.GET()
  assert.equal(history.status, 200)
  assert.equal(profile.status, 200)
  const profileBody = await profile.json()
  assert.equal(profileBody.profile.user.email, 'candidate-a@example.invalid', 'Owner keeps their own contact data')
  for (const rows of [(await history.json()).applications, profileBody.profile.applications]) {
    assert.equal(rows.length, 2)
    assert.ok(rows.every((a) => a.job.status === 'CLOSED'))
    assert.ok(rows.every((a) => a.seafarerId === 'profile-a'))
    assert.ok(rows.every((a) => !('email' in a.job.recruiter) && !('phone' in a.job.recruiter)))
  }
})
test('another seafarer cannot retrieve historical application through jobId filter', async () => {
  const response = await fixture('otherSeafarer').applicationsRoute.GET(request('applications?jobId=a-closed', null, 'GET'))
  assert.deepEqual(await response.json(), { applications: [] })
})

for (const [identity, status] of [['anonymous', 401], ['seafarer', 403], ['admin', 403]]) {
  test(`${identity} cannot create an interview`, async () => {
    const f = fixture(identity)
    await expectError(await f.interviewsRoute.POST(request('interviews', { seafarerId: 'profile-a', scheduledAt: future() })), status, 'unauthorized')
    assert.equal(f.calls.length, 0)
  })
}
for (const [identity, jobId, status] of [
  ['recruiterA', 'a-open', 200], ['recruiterA', 'a-closed', 200],
  ['recruiterA', 'b-open', 404], ['recruiterA', 'b-closed', 404],
  ['recruiterA', 'unknown', 404], ['recruiterB', 'b-open', 200], ['recruiterB', 'a-open', 404],
  ['recruiterA', null, 200], ['recruiterA', undefined, 200],
]) {
  test(`${identity}: interview linked to ${jobId} returns ${status}`, async () => {
    const f = fixture(identity)
    const response = await f.interviewsRoute.POST(request('interviews', { seafarerId: 'profile-a', jobId, scheduledAt: future(), notes: 'Private follow-up' }))
    if (status === 404) {
      await expectError(response, 404, 'not_found')
      assert.equal(f.interviews.length, 2)
    } else {
      assert.equal(response.status, 200)
      const { interview } = await response.json()
      assert.equal(interview.jobId, jobId ?? null)
      assert.equal(interview.recruiterId, identities[identity].id)
      assert.equal(interview.notes, 'Private follow-up')
      assert.ok(f.calls.filter((call) => call.model === 'job' || call.operation === 'create').every((call) => call.inTransaction))
    }
  })
}
test('interview rejects missing candidate safely', async () => {
  await expectError(await fixture('recruiterA').interviewsRoute.POST(request('interviews', { seafarerId: 'unknown', jobId: 'a-open', scheduledAt: future() })), 404, 'not_found')
})
for (const scheduledAt of ['2020-01-01T00:00:00Z', 'not-a-date']) {
  test(`interview retains date validation: ${scheduledAt}`, async () => {
    const f = fixture('recruiterA')
    const response = await f.interviewsRoute.POST(request('interviews', { seafarerId: 'profile-a', scheduledAt }))
    assert.equal(response.status, 400)
    const body = await response.json()
    assert.equal(body.error, 'validation_error')
    assert.ok(['invalid_date', 'date_must_be_future'].includes(body.fields.scheduledAt))
    assert.equal(f.calls.length, 0)
  })
}
test('interview rejects forged recruiter identity', async () => {
  const response = await fixture('recruiterA').interviewsRoute.POST(request('interviews', { seafarerId: 'profile-a', scheduledAt: future(), recruiterId: 'recruiter-b' }))
  assert.equal(response.status, 400)
})
for (const [code, status, error] of [['P2003', 404, 'not_found'], ['P2025', 404, 'not_found'], ['P2034', 409, 'request_conflict'], ['unexpected', 500, 'server_error']]) {
  test(`interview safely handles ${code}`, async () => {
    const f = fixture('recruiterA', { failAt: 'interview.create', failure: code === 'unexpected' ? new Error('sensitive database detail') : databaseError(code) })
    await expectError(await f.interviewsRoute.POST(request('interviews', { seafarerId: 'profile-a', scheduledAt: future() })), status, error)
    assert.equal(f.interviews.length, 2)
  })
}
test('candidate interview list hides private notes and recruiter contacts', async () => {
  const response = await fixture().interviewsRoute.GET()
  const { interviews } = await response.json()
  assert.equal(interviews.length, 1)
  assert.equal(interviews[0].notes, null)
  assert.equal(interviews[0].recruiter.id, 'recruiter-a')
  assert.ok(!('email' in interviews[0].recruiter) && !('phone' in interviews[0].recruiter))
  assert.ok(!JSON.stringify(interviews).includes('PRIVATE RECRUITER'))
})
test('recruiter interview list retains only their own notes', async () => {
  const response = await fixture('recruiterA').interviewsRoute.GET()
  const { interviews } = await response.json()
  assert.equal(interviews.length, 1)
  assert.equal(interviews[0].notes, 'PRIVATE RECRUITER A NOTES')
  assert.ok(!JSON.stringify(interviews).includes('PRIVATE RECRUITER B NOTES'))
})
for (const identity of ['seafarer', 'recruiterA']) {
  test(`${identity}: legacy foreign-linked interview does not expose another recruiter's job`, async () => {
    const f = fixture(identity)
    f.interviews.find((row) => row.id === 'interview-a').jobId = 'b-closed'
    const response = await f.interviewsRoute.GET()
    const { interviews } = await response.json()
    assert.equal(interviews.length, 1)
    assert.equal(interviews[0].job, null)
    assert.equal(JSON.stringify(interviews).includes('Closed B'), false)
    assert.equal(f.interviews[0].jobId, 'b-closed', 'Do not alter legacy records')
  })
}

for (const endpoint of ['applications', 'interviews']) {
  test(`${endpoint}: malformed JSON has safe validation response`, async () => {
    const f = fixture(endpoint === 'applications' ? 'seafarer' : 'recruiterA')
    const route = endpoint === 'applications' ? f.applicationsRoute : f.interviewsRoute
    const response = await route.POST(request(endpoint, '{'))
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'validation_error', fields: { _root: 'invalid_json' } })
  })
  for (const [identity, id, expected] of [
    ['recruiterA', endpoint === 'applications' ? 'application-history' : 'interview-a', 200],
    ['recruiterA', endpoint === 'applications' ? 'application-other' : 'interview-b', 404],
    ['recruiterA', 'unknown', 404],
    ['seafarer', endpoint === 'applications' ? 'application-history' : 'interview-a', 403],
    ['admin', endpoint === 'applications' ? 'application-history' : 'interview-a', 403],
    ['anonymous', endpoint === 'applications' ? 'application-history' : 'interview-a', 403],
  ]) {
    test(`${endpoint} update: ${identity}/${id} returns ${expected}`, async () => {
      const f = fixture(identity)
      const update = endpoint === 'applications' ? f.applicationUpdate : f.interviewUpdate
      const response = await update(request(endpoint, { status: endpoint === 'applications' ? 'SHORTLISTED' : 'COMPLETED' }, 'PUT'), context(id))
      assert.equal(response.status, expected)
      if (expected === 404) assert.deepEqual(await response.json(), { error: 'not_found' })
      if (expected === 200) {
        const body = await response.json()
        assert.equal((body.application ?? body.interview).status, endpoint === 'applications' ? 'SHORTLISTED' : 'COMPLETED')
      }
    })
  }
  for (const field of ['jobId', 'recruiterId', 'seafarerId']) {
    test(`${endpoint} update cannot change ${field}`, async () => {
      const f = fixture('recruiterA')
      const update = endpoint === 'applications' ? f.applicationUpdate : f.interviewUpdate
      const response = await update(request(endpoint, { status: endpoint === 'applications' ? 'HIRED' : 'COMPLETED', [field]: 'foreign' }, 'PUT'), context(endpoint === 'applications' ? 'application-history' : 'interview-a'))
      assert.equal(response.status, 400)
      assert.equal(f.calls.some((call) => call.operation === 'update'), false)
    })
  }
}
test('interview rescheduling retains future-date rule', async () => {
  const f = fixture('recruiterA')
  const rejected = await f.interviewUpdate(request('interviews', { scheduledAt: '2020-01-01' }, 'PUT'), context('interview-a'))
  assert.equal(rejected.status, 400)
  const next = future()
  const updated = await f.interviewUpdate(request('interviews', { scheduledAt: next }, 'PUT'), context('interview-a'))
  assert.equal(updated.status, 200)
  assert.equal((await updated.json()).interview.scheduledAt, next)
})
