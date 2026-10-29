# Job visibility and ownership policy

Implemented for `GET /api/jobs` and `GET /api/jobs/[id]`. The audit roadmap calls this R01/Phase 0A; the implementation request calls it Phase 1A. This change follows the request's job-visibility scope, not R05's application-mutation scope.

The current schema has only OPEN and CLOSED job statuses and no separate public/private flag. OPEN jobs are treated as intentionally published public vacancies. No schema or data changes are made.

| Caller | Normal job list | `mine=1` list | OPEN detail | CLOSED detail |
| --- | --- | --- | --- | --- |
| Anonymous | OPEN only | 401 | Allowed | 404 |
| Seafarer | OPEN only, own application status attached | 403 | Allowed | 404, including applicants |
| Recruiter | OPEN jobs across recruiters | Own OPEN and CLOSED jobs only | Allowed | Own jobs only; otherwise 404 |
| Administrator | OPEN discovery list | 403: this is recruiter-only owner mode | Allowed | Allowed for either recruiter |

Unknown and inaccessible detail IDs return the same `404 {"error":"not_found"}` payload. Visibility and ID constraints are applied together in the Prisma query, before any job is returned. Rank, vessel-type and text filters can only narrow the authorized list. Query parameters cannot choose a caller's identity, ownership or private statuses.

Administrator detail access to both existing statuses is explicit. The default list remains an OPEN discovery list for every role; `mine=1` never becomes an administrator all-jobs mode. The existing admin statistics endpoint is unchanged. If administrators need a comprehensive job-management list later, define a separate explicit administrative mode rather than overloading recruiter ownership.

## Closed-job history for seafarers

Seafarers retain historical job information through the existing owner-scoped application views (`GET /api/applications` and `GET /api/seafarers/me`), which already embed related jobs. Those endpoints and their UI remain unchanged. They return the current related job record, not an immutable snapshot of the vacancy when the candidate applied.

Direct CLOSED-job detail access is deliberately denied even when an application exists. Before Phase 1B, `POST /api/applications` could create an application to a known CLOSED job ID. Consequently a legacy application relation alone cannot securely distinguish a genuine pre-closure applicant from someone who acquired access after closure. The schema also has no authoritative closure timestamp with which to enforce that distinction. Phase 1B now enforces OPEN eligibility for new applications, without attempting to infer historical closure time from the general-purpose `updatedAt` timestamp.

Product follow-up: decide whether direct detail should also accept genuine existing applicants, independent of application outcome, and how to treat legacy application records. The stricter direct-read rule remains unchanged. Historical application endpoints continue to show existing owner-scoped records; Phase 1B prevents acquiring new CLOSED-job access through application creation.

## Data minimization and unchanged writes

Both job GET endpoints use an explicit shared field selection. Recruiter identity contains only `id`, `name` and `company`; email, phone, password hash and other user fields are excluded for every caller. Job fields, applicant count, response envelopes, newest-first list order, discovery filters and seafarer application-status decoration remain available. Future private job columns will not automatically enter these responses.

Allowing anonymous OPEN detail is consistent with public discovery: it returns the same approved vacancy fields already available from the public list, without additional personal data. There are no UI callers dependent on recruiter email/phone from these GETs. Other APIs may still embed recruiter contact data and require a separate policy review.

Job POST/PUT/DELETE and existing recruiter ownership checks are unchanged. Administrator read permission does not grant write permission. Phase 1A did not change session, authentication, interview or application mutation behavior. Phase 1B changes application/interview authorization as documented below. Neither phase changes schema, migrations, existing database data, Docker or visual design.

## Focused verification

Run `node --test tests/job-visibility.test.mjs`. Tests execute the actual route and helper source with real Next request/response objects and synthetic authentication/database boundaries. They cover public discovery, encoded/repeated owner-mode parameters, both recruiter identities, admin reads, private/unknown details, existing application versus CLOSED detail, caller-specific application status, intersecting filters and response-field minimization.

The tests never import the actual database or authentication modules and do not start a server or read/write an SQLite database. They validate handler decisions, query predicates and response contracts; they do not replace real Prisma/SQLite integration or signed-cookie deployment testing.

## Phase 1B: application and interview authorization

### Application creation and history

- Only a session-authenticated SEAFARER with their own profile can apply. No request-supplied profile, status or recruiter identity is accepted.
- `POST /api/applications` checks the referenced job is OPEN and creates the application in the same SQLite transaction. CLOSED and unknown jobs return the same `404 {"error":"not_found"}` without job details. A closure committed before the transaction is rejected; eligibility and insert cannot be separated by a committed closure within that transaction.
- The existing unique `(jobId, seafarerId)` constraint remains. A duplicate OPEN-job request returns `409 {"error":"already_applied"}`, including a database uniqueness conflict that races the pre-check. The duplicate response does not return the existing application. CLOSED eligibility is checked first, so reapplying to a CLOSED job returns 404 even if historical application data exists.
- Closing a job does not delete or hide existing applications. Both owner history paths (`GET /api/applications`, `GET /api/seafarers/me`) remain available, with recruiter `id`, `name` and `company` only. The seafarer's own account contact fields remain available in their CV response.

### Interview creation, updates and privacy

- Only a session-authenticated RECRUITER can create interviews. A supplied `jobId` must exist and belong to that recruiter; unknown and foreign jobs return identical 404 errors. Ownership lookup and insertion share a transaction.
- An owner's OPEN or CLOSED job may be linked, preserving recruitment follow-up after a vacancy closes. No application relationship is required. Omitted/null `jobId` remains supported and creates an unlinked interview. Candidate existence is checked before insertion.
- Existing future-date validation is unchanged. Recruiter application/interview PUT handlers retain their role and ownership checks, strict schemas and explicit update fields. They do not accept `jobId`, `recruiterId` or `seafarerId`, so updates cannot reassign associations. Valid status changes and rescheduling remain supported; no new status-transition policy is introduced.
- Recruiters keep their own interview notes. Seafarer interview responses still return `notes: null` and now omit recruiter email (phone was already excluded). If an old interview links to another recruiter's job, both participant list responses return `job: null` instead of exposing that foreign job; the stored record is not changed.

### Safe errors and verification limits

Creation returns 401 for no session, 403 for the wrong role, existing 400 validation errors for malformed/invalid input, 404 for unavailable/unauthorized resources, 409 for duplicate applications or a retryable transaction conflict (`request_conflict`), and generic `500 {"error":"server_error"}` for unexpected failures. Foreign-key/record-disappearance errors become 404; raw database messages, stack traces, private notes and contact details are never included in these creation error payloads. Existing update-handler error conventions remain unchanged.

Run `node --test tests/*.test.mjs` for both phases. Phase 1B tests execute real route/validation/serialization code against synthetic authentication and an in-memory database stand-in. They cover eligibility/ownership, duplicate/transaction failures, historical reads through both paths, malformed JSON, role and relation-field injection, update ownership, dates, private notes, contact suppression and legacy foreign links. No actual database is read or modified. Transaction locking under real concurrent Prisma/SQLite requests, signed sessions and browser workflows still require isolated integration/manual testing.

Existing legacy applications or invalid associations are neither inspected nor repaired. Other recruitment endpoints, such as messaging, are outside this patch and may need a separate contact-data review. Direct CLOSED-job visibility remains the Phase 1A policy; changing it requires an explicit product decision.
