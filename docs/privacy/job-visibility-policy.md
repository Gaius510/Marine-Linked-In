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

Direct CLOSED-job detail access is deliberately denied even when an application exists. Currently `POST /api/applications` can create an application to a known CLOSED job ID. Consequently an application relation alone cannot securely distinguish a genuine pre-closure applicant from someone acquiring access after closure. The schema also has no authoritative closure timestamp with which to enforce that distinction. This patch does not modify application creation or attempt to infer closure time from the general-purpose `updatedAt` timestamp.

Product follow-up: after CLOSED-job application creation is prevented and historical eligibility is reliably defined, decide whether direct detail should also accept genuine existing applicants, independent of application outcome. Until then the stricter direct-read rule avoids creating that bypass. The existing application endpoints' ability to expose a CLOSED job after a new application remains a known, out-of-scope authorization risk; these GET fixes do not claim to solve it.

## Data minimization and unchanged writes

Both job GET endpoints use an explicit shared field selection. Recruiter identity contains only `id`, `name` and `company`; email, phone, password hash and other user fields are excluded for every caller. Job fields, applicant count, response envelopes, newest-first list order, discovery filters and seafarer application-status decoration remain available. Future private job columns will not automatically enter these responses.

Allowing anonymous OPEN detail is consistent with public discovery: it returns the same approved vacancy fields already available from the public list, without additional personal data. There are no UI callers dependent on recruiter email/phone from these GETs. Other APIs may still embed recruiter contact data and require a separate policy review.

Job POST/PUT/DELETE and existing recruiter ownership checks are unchanged. Administrator read permission does not grant write permission. No session, authentication, interview, application mutation, schema, migration, database, Docker or visual-design changes are included.

## Focused verification

Run `node --test tests/job-visibility.test.mjs`. Tests execute the actual route and helper source with real Next request/response objects and synthetic authentication/database boundaries. They cover public discovery, encoded/repeated owner-mode parameters, both recruiter identities, admin reads, private/unknown details, existing application versus CLOSED detail, caller-specific application status, intersecting filters and response-field minimization.

The tests never import the actual database or authentication modules and do not start a server or read/write an SQLite database. They validate handler decisions, query predicates and response contracts; they do not replace real Prisma/SQLite integration or signed-cookie deployment testing.
