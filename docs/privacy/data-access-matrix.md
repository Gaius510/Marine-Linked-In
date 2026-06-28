# CrewLink Personal-Data Access Matrix

Phase 9A containment rule: non-owner recruiter and general admin views receive only the data needed for candidate discovery and recruiting workflow. Identity-document values, third-party reference contacts, and private notes stay owner-only unless a future verification permission is introduced.

## Visibility Matrix

| Field | Seafarer owner | Recruiter discovery | Recruiter after application | General admin | Future verification role | CSV export | Logs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Name | Visible | Visible | Visible | Visible | Visible | Visible | Do not log in request bodies |
| Email | Visible | Hidden; use in-app message | Hidden; use in-app message | Hidden | Product/legal decision | Hidden | Do not log |
| Phone | Visible | Hidden | Hidden | Hidden | Product/legal decision | Hidden | Do not log |
| Street address | Not currently modeled | Not available | Not available | Not available | Product/legal decision | Hidden | Do not log |
| City/country | Visible | Visible for suitability | Visible | Visible | Visible | Visible | Avoid request-body logs |
| Date of birth | Visible | Hidden | Hidden | Hidden | Verification-only candidate | Hidden | Do not log |
| Nationality | Visible | Visible | Visible | Visible | Visible | Visible | Avoid request-body logs |
| Passport number | Visible to owner only | Hidden | Hidden | Hidden | Verification-only candidate | Hidden | Never log |
| Passport expiry | Visible | Visible as readiness summary | Visible as readiness summary | Visible as readiness summary | Visible | Hidden for now | Do not log |
| Seaman-book number | Not currently modeled | Hidden by default | Hidden by default | Hidden by default | Verification-only candidate | Hidden | Never log |
| Certificate number | Visible to owner only | Hidden | Hidden | Hidden | Verification-only candidate | Hidden | Never log |
| Visa/travel document number | Visible to owner only | Hidden | Hidden | Hidden | Verification-only candidate | Hidden | Never log |
| Travel authorization notes | Visible to owner only | Hidden | Hidden | Hidden | Verification-only candidate | Hidden | Never log |
| Public travel readiness summary | Visible | Visible | Visible | Visible | Visible | Hidden for now | Avoid request-body logs |
| Professional history | Visible | Visible without reference contacts | Visible without reference contacts | Visible without reference contacts | Visible | Visible, limited columns | Avoid request-body logs |
| Supervisor/reference names | Visible to owner only | Hidden; boolean summary only | Hidden; boolean summary only | Hidden; boolean summary only | Verification-only candidate | Hidden | Never log |
| Supervisor/reference phone | Visible to owner only | Hidden; boolean summary only | Hidden; boolean summary only | Hidden; boolean summary only | Verification-only candidate | Hidden | Never log |
| Recruiter interview notes | Recruiter author only | Recruiter author only | Recruiter author only | Hidden from general admin list | Product/legal decision | Hidden | Do not log |
| Application message/cover letter | Owner and owning recruiter | Owning recruiter after application | Owning recruiter | Hidden from broad admin stats | Product/legal decision | Hidden | Do not log |

## Current Server Enforcement

- Recruiter/admin candidate payloads are serialized through `src/lib/privacy.ts`.
- Safe candidate user payloads exclude `email` and `phone`.
- Safe candidate profile payloads exclude `passportNo`, raw legacy visa fields, and `dateOfBirth`.
- Safe certificate payloads exclude certificate `number`.
- Safe vessel experience payloads exclude captain/chief engineer names and contact values, replacing them with `referenceContactAvailable`.
- Travel authorizations use public summaries only: `id`, `type`, `customType`, `countryCode`, `expiresAt`, and `verificationStatus`.
- Legacy `usVisa` and `schengenVisa` values are converted server-side into public readiness summaries when no normalized authorization exists, without returning the raw legacy values.

## Staged Disclosure Recommendation

1. Candidate discovery: name, rank, nationality, city/country, availability, experience, certificates without numbers, and sanitized travel readiness.
2. Saved profile: same as discovery. Saving alone should not reveal email, phone, document numbers, or references.
3. Application submitted: same candidate profile plus application message/cover letter to the owning recruiter.
4. Candidate consent/contact accepted: consider revealing email/phone only after an explicit consent record exists.
5. Verification phase: create a separate verification permission or role before exposing identity documents, certificate numbers, travel document numbers, private notes, date of birth, or reference contacts.

## Security Smoke Checks

There is no dedicated test runner in this repository yet. Until one is added, verify with authenticated API calls against local seeded/demo accounts:

1. Recruiter `GET /api/seafarers` response does not contain `passportNo`, `documentNumber`, `notes`, `captainContact`, `chiefEngContact`, candidate `email`, or candidate `phone`.
2. Recruiter `GET /api/seafarers/:id` response contains `passportRecorded` and `passportExpiry`, but no passport number.
3. Recruiter `GET /api/saved`, `GET /api/applications`, `GET /api/interviews`, and `GET /api/messages` nested `seafarer` objects follow the same safe shape.
4. Admin `GET /api/admin/stats` response excludes passport numbers, certificate numbers, travel document numbers, travel notes, supervisor contacts, email, and phone.
5. Admin CSV export includes name, rank, nationality, availability, vessel experience, years, city/country, and registration date only.
6. Seafarer owner `GET /api/seafarers/me` still includes the owner’s passport number, certificate numbers, travel document numbers, notes, and reference contacts.
7. A recruiter changing another recruiter’s application/interview/job ID receives `404`.
8. A recruiter calling `/api/admin/stats` receives `403`.
9. A seafarer changing another seafarer’s certificate, experience, or travel authorization ID receives `404`.
10. Ordinary users cannot set `verificationStatus`; owner travel authorization create/update schemas do not accept it.
11. Client-visible errors stay generic and do not include Prisma errors, stack traces, request bodies, or secrets.
