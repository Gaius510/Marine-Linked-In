# CrewLink product audit

Audit date: 2026-10-29 (Europe/Berlin). Repository: `/Users/alireda/Downloads/Maritime-Linked`. Baseline: `design/premium-polish`, commit `0a87c90`. Working tree was clean at the start of this audit.

## Decision

Improve correctness, Arabic support, and workflow continuity before another visual redesign. CrewLink has a useful foundation: role-specific navigation, owner-scoped writes in many APIs, reusable UI primitives, structured CV editing, and deliberate candidate-data minimization. The largest product gap is that private recruiter outreach has no usable seafarer receiving experience. The largest localization gap is outside the dictionary: domain values, formatting, direction-sensitive controls, and first-load locale handling.

This is a static product and implementation audit with in-memory checks, not a completed browser, penetration, deployment, or database audit. “Apparently complete” below means that UI, client request, validation, server operation, and persistence model were traced; it does not mean the workflow was exercised successfully.

Related reports: [Arabic and RTL audit](crewlink-arabic-rtl-audit.md), [implementation roadmap](crewlink-improvement-roadmap.md). Proposed changes in those reports are recommendations only.

## Scope and evidence

- Indexed and parsed 163 source modules (162 TypeScript/TSX files and one MJS helper), including all component files, for translation calls, literal UI strings, accessibility labels, and structural patterns.
- Traced the authentication screen, shell, all four seafarer views, all seven recruiter views, both admin views, their dialogs and CV sections, and all 24 API route modules. The source inventory includes 104 component TSX files. Reviewed Prisma relations, validation, session/password helpers, privacy serialization, formatting, and query/store behavior.
- Reviewed all shared product components and the UI primitive inventory. Examined active dialog, select, dropdown, table, tabs, form-control, alert, and notification patterns; unused library components were structurally scanned, not rendered or behaviorally certified.
- Read the existing personal-data access policy in `docs/privacy/data-access-matrix.md`. Read Docker configuration and startup scripts only to understand constraints; did not run them.
- No HTTP requests, authenticated sessions, application server, database reads/writes, containers, migrations, seeds, or dependency installation were used. In particular, `GET /api/auth/me` can create a missing seafarer profile, so even normal application startup cannot be assumed read-only.

### Screen and component coverage

Paths in this table are under `src/components/` unless otherwise stated. All recommendations need subsequent rendered validation.

| Surface | Files inspected | Assessment |
| --- | --- | --- |
| Authentication | `auth/auth-screen.tsx`, `shared/brand-logo.tsx` | Restrained image treatment, text-only proof points, unframed logo, wider centered login, compact demos already exist. No public language/theme switch. No recovery flow. Demo utilities remain unconditional. |
| Shared shell | `shell/app-shell.tsx`, `app-header.tsx`, `app-sidebar.tsx`, `app-footer.tsx`, `use-url-view-sync.ts` | Role-scoped views and URL synchronization exist. Desktop sidebar uses logical border direction. Mobile recruiter navigation has seven horizontally scrolling destinations with small truncated labels. No skip-to-content control. |
| Seafarer overview | `seafarer/seafarer-overview.tsx` | Loading/error/empty states present. “Matching” jobs are actually all open jobs. Completion and greeting are visually repeated. |
| CV composition | `seafarer/seafarer-cv.tsx`, `use-seafarer-profile.ts`, `profile-completeness.ts` | Separate sections and mutations are useful; draft resets and inconsistent completion rules create trust risks. |
| CV header/guidance | `seafarer/cv/cv-profile-header.tsx`, `cv-completion-panel.tsx`, `cv-form-field.tsx`, `cv-status.ts`, `types.ts` | Repeated score/progress; page and profile both render `h1`. Guidance moves below the entire form on mobile. Helper text is not consistently programmatically associated. |
| CV personal/maritime/documents | `seafarer/cv/personal-information-section.tsx`, `maritime-details-section.tsx`, `documents-section.tsx` | Read-only name/email; no account-edit alternative. Document errors lack field-specific feedback. English domain choices and inconsistent radio container styling. |
| Vessel service | `seafarer/experience-dialog.tsx`, `cv/vessel-experience-section.tsx` | Create/edit/delete and date-order validation exist. Duration calculation is coarse; references copy contradicts privacy rules. No verified sea-service evidence. |
| Certificates | `seafarer/certificate-dialog.tsx`, `cv/certificates-section.tsx` | CRUD and expiry labels exist; metadata only, no upload/verification. Acronym-heavy English example remains in Arabic. |
| Travel authorizations | `seafarer/cv/travel-authorization-dialog.tsx`, `travel-authorizations-section.tsx`, `shared/travel-authorization-summary-list.tsx` | Owner CRUD and sanitized summaries exist. Clearing optional edit fields and merged date validation need repair. Verification is modeled/displayed but no verification workflow exists. |
| Seafarer jobs/applications | `seafarer/seafarer-jobs.tsx`, `job-detail-dialog.tsx`, `apply-dialog.tsx`, `seafarer-applications.tsx` | Search and applications wired; application message duplicated “optional” text, closed-job server guard missing, history has no timeline/withdrawal/detail action. |
| Recruiter overview | `recruiter/overview-view.tsx` | Four queries feed summary panels; errors can remain indistinguishable from loading. Upcoming metric counts all scheduled interviews, including past ones. |
| Candidate browse | `recruiter/browse-view.tsx` | Filters, selection, bulk save/message, detail, interview actions exist. Query failures become empty results. Search placeholder promises fields the API does not search. Selection can outlive current filters. |
| Candidate details | `recruiter/seafarer-detail-dialog.tsx` | Useful qualifications and sanitized travel readiness. Failed/missing profile can stay skeleton forever. Nested outreach/interview dialogs need keyboard testing. |
| Saved profiles | `recruiter/saved-view.tsx` | Save/unsave, profile, message, schedule connected. Query error becomes empty state; stored note field has no editing UI. |
| Job publishing/management | `recruiter/post-job-view.tsx`, `my-jobs-view.tsx` | Publishing, open/close/delete exist. No edit UI despite update API. Management query errors look empty. Select labels not consistently associated. |
| Applicants | `recruiter/applicants-dialog.tsx` | Owning-recruiter status update exists. Candidate bio hides the submitted application message whenever bio is present. Status changes have no transition history. |
| Interviews | `recruiter/schedule-interview-dialog.tsx`, `interviews-view.tsx` | Future-time validation, creation and status updates exist. No job picker/reschedule UI, explicit timezone, candidate response or reminders. |
| Messages | `recruiter/message-dialog.tsx`, `messages-view.tsx` | One-way send and sent list, expansion and statuses. No seafarer inbox/reply or read update endpoint; “read” status cannot progress through current UI. |
| Admin overview/list | `admin/admin-portal.tsx`, `admin-overview.tsx`, `admin-master-list.tsx`, `rank-breakdown.tsx` | Aggregate statistics, candidate filtering, table/cards, CSV exist. No user-management surface despite `allUsers` payload. Completeness miscomputed from sanitized data. |
| Admin details | `admin/seafarer-detail-dialog.tsx` | Privacy respected, but permanently hidden DOB rendered as “not specified”; admin advice to use messaging has no admin messaging workflow. Excess repeated icons/metadata rows. |
| Shared product UI | `shared/{page-header,page-toolbar,section-card,metric-card,stat-card,status-pill,availability-badge,job-card,seafarer-card,empty-state,error-state,field-error,brand-logo,travel-authorization-summary-list}.tsx` | Reuse is strong; heading, status-tone, data-formatting and error semantics still diverge. `StatCard` delegates to `MetricCard`, so it is not an independent competing implementation. |
| UI library | All files in `ui/` | Compact controls and focus styles provide a baseline. Physical alignment and hardcoded English persist. Pagination/calendar/sidebar library presence does not mean those workflows are active. |

## Top ten issues

Evidence labels: **Source** = direct branch/handler inspection; **Probe** = read-only synthetic execution; **Manual** = requires rendered/authenticated verification. Priorities reflect product impact, not a formal security severity score.

| ID / priority | Issue and evidence | Recommendation |
| --- | --- | --- |
| P01 / High | **Source:** `src/app/api/jobs/route.ts:11` sets no ownership or OPEN filter when `mine=1` and caller is not a recruiter, including anonymous callers. Results include recruiter email. `src/app/api/jobs/[id]/route.ts` allows any signed-in role to retrieve any job, including closed jobs and recruiter phone. | Define public versus owner job payloads and reject unauthorized `mine=1`; scope closed-job access. Preserve intentional public vacancy discovery. |
| P02 / High | **Probe:** `admin/admin-master-list.tsx:121` leaves synthetic `=1+1` unchanged in CSV. User-controlled name/city/company-derived values can become spreadsheet formulas. Quoting CSV delimiters does not neutralize formulas. | Introduce and test export cell neutralization, including leading control/whitespace cases, without widening exported fields. Actual spreadsheet execution was not tested. |
| P03 / High | **Source:** `seafarer-portal.tsx` and `src/lib/navigation.ts` have only overview/CV/jobs/applications; message and interview GET APIs have seafarer branches. No receiving UI or reply/read mutation exists. | Deliver a seafarer inbox and interview agenda first, then a separately permissioned reply/read workflow. Do not expose private recruiter interview notes. |
| P04 / High | **Source:** `api/applications/route.ts:81` checks duplicate application but not whether the job exists and is open. Interview POST accepts `jobId` without checking recruiter ownership. Concurrent duplicate create relies on a DB unique constraint without a handled race. | Enforce workflow eligibility and linked-resource ownership server-side, return stable localized error codes, handle uniqueness races. |
| P05 / High | **Source + Probe:** dictionaries are complete but choices in `src/lib/types.ts` are English; `src/lib/format.ts:54` returns “2 years”; dates/currencies use browser locale rather than selected locale. | Localized labels over stable stored values; locale-aware formatting and Arabic plural rules. See companion report. |
| P06 / High | **Source + Manual:** `ui/dialog.tsx:76` anchors close right; `ui/select.tsx:110` anchors indicators right; `ui/table.tsx:73` aligns headers left. No explicit Radix direction integration. Arabic preference is client-only, auth has no language control. | Repair shared RTL primitives and locale initialization before per-screen visual work; test keyboard behavior independently of CSS inheritance. |
| P07 / High | **Source:** browse/saved/my-jobs ignore query errors; recruiter overview defines loading as absence of any of four query results (`overview-view.tsx:81`); detail treats any missing profile as loading. | Standardize loading/error/empty/forbidden/not-found states and retry, including partial dashboard failures. |
| P08 / High | **Source + Probe:** travel edit converts cleared fields to `undefined`, which disappears in JSON (`travel-authorization-dialog.tsx:121`); update route only changes present fields. Partial expiry alone validates without comparison to stored issue date. | Define absent=preserve versus null=clear; validate the merged persisted record before write. Test all optional fields and type transitions. |
| P09 / High | **Source + Manual:** personal/maritime/documents forms reset draft state whenever profile object changes. Saving another section invalidates shared profile data; unsaved edits elsewhere can be replaced. `AppShell` also keys content by view, discarding local drafts on navigation. | Dirty-state-aware reconciliation and explicit leave/discard handling; keep section saves independent. |
| P10 / Medium | **Probe:** identical synthetic profile scores 100% for owner, 82% after privacy serialization, because admin recomputes using hidden DOB/phone/passport/reference fields. Section completion can also say all complete while weighted score remains below 100%. | One documented completeness contract; expose only an approved aggregate or non-sensitive public readiness metric. Never return private fields to fix a score. |

## Interface, design, and accessibility

### Preserve the current strengths

The navy/teal/fog palette, compact controls, modest radii, removed surface shadows, and quiet authentication image treatment already support an enterprise maritime identity. `SectionCard` is now a section with a top border, not a floating card; another blanket “remove cards” pass would misdiagnose the implementation. Logical spacing (`ms`, `pe`, `start`, `border-e`) is widely used. Skeletons, retry states, native forms, `aria-invalid`, focus rings, confirmation dialogs and textual status labels are already present in many flows.

### Specific adjustments

| Area | Evidence/problem | Proposed treatment |
| --- | --- | --- |
| Layout/hierarchy | `PageHeader` uses medium 20px headings; overviews and CV profile header use semibold responsive 24px headings; CV includes multiple `h1`s. Dashboard eyebrow/greeting/intro and repeated progress compete. | One page heading; consistent page/section/row scale. Keep one completion summary and actionable section guidance. |
| Density/decoration | `admin/seafarer-detail-dialog.tsx` repeats icons on almost every fact. Several overview headers still use uppercase eyebrows; CV availability uses rounded bordered choice cards while global controls are flatter. | Prefer definition-list facts, one section icon when useful, semantic radio grouping with consistent control styling. Preserve status text. |
| Color/contrast | Calculated source-token contrast: teal `#167d86` on white 4.87:1; muted `#5f727b` on fog 4.71:1, on white 5.02:1. These opaque pairs have reasonable normal-text contrast. Numerous opacity-reduced variants and image text are not covered by those values. | Measure rendered light/dark states, focus boundaries, placeholder text and image text. Do not claim WCAG conformance from token ratios. |
| Typography | `globals.css:9` names Inter/SF/Segoe/system fonts without an explicit supplied Arabic font strategy. Dense 10–11px metadata and truncated labels are frequent. Arabic can fall back with different metrics. | Choose a tested Arabic/Latin family pairing, verify actual font availability, increase Arabic line-height and critical metadata size; remove Latin tracking on Arabic. |
| Mobile navigation | `app-sidebar.tsx:79` horizontally scrolls seven recruiter destinations, truncating labels to 60px. CV guidance has `order-2` on small screens. | Keep common tasks visible and put secondary destinations in an accessible More menu; move compact CV guidance before fields. Test 320/390/768px, landscape and keyboard-open layouts. |
| Dialogs | Shared max-height/scroll limits are useful. Nested profile → message/schedule dialogs, close positioning, and mobile focus/scroll require verification. | Explicit direction, one clear title/description, predictable close placement; check Escape, focus trap/return and background scroll. |
| Forms | `post-job-view.tsx:362` SelectField has an unassociated Label; availability RadioGroup has no connected group name. Documents section does not map API field errors. No auth autocomplete hints. | Link labels/control IDs; fieldset/legend or group ARIA; connect helper/error IDs; add correct autocomplete/inputMode and typed inputs; keep API validation authoritative. |
| Accessibility/navigation | `app-shell.tsx` has no skip link; unauthenticated shell and AuthScreen nest `main` landmarks. Initial loader has no text/status announcement. Profile-menu button relies on initials/name; icon-only mobile case needs an explicit label. ErrorState lacks live-region semantics. | One main landmark, skip link and visible page focus on navigation; localized accessible menu labels, busy/status semantics and error announcements. Verify screen-reader output. |
| Status semantics | HIRED is primary-toned in seafarer components and success-toned in recruiter overview; repeated local tone maps diverge. Expiry thresholds differ: CV 180 days, travel 90 days. | Central status presentation and documented, document-specific expiry policies; do not silently equate valid, verified and complete. |
| Content truth | Seafarer “matching your profile” counts all open jobs. Candidate search claims name/rank/vessel but server searches only name. Admin search advertises email although server searches name only. Reference copy promises recruiter use of private contacts. | Correct labels to current behavior first; add search/matching only as separately tested functionality. Update privacy copy without weakening serialization. |

### Theme and responsive limitations

Light/dark tokens and theme switching exist through `next-themes`. Auth has a special dark right-panel background. Browser screenshots, zoom/reflow, actual Arabic fonts, safe-area behavior, screen-reader output, keyboard interaction and contrast on composed surfaces were not tested. Token presence is not proof of a polished theme. The auth image animation respects reduced-motion CSS; CV `scrollIntoView({behavior:'smooth'})` needs separate reduced-motion handling.

## Functional audit

Status vocabulary: **Implemented, apparently complete**; **Implemented, potentially defective**; **Incomplete**; **Missing**. **Requires manual testing** applies to every implemented flow; listed checks describe what remains. No production workflow was executed.

| Role/workflow | Classification | Evidence and remaining manual test |
| --- | --- | --- |
| All: login/logout/session restore | Implemented, potentially defective | UI → auth store → auth endpoints → signed cookie/current-user lookup. Failed `fetchUser` becomes logged-out state, even on transient service failure; logout rejection has no explicit UI recovery. Verify incorrect credentials, expiry, restart, logout network failure and role switching. |
| Seafarer/recruiter registration | Implemented, potentially defective | Public ADMIN is rejected; recruiter company required. User and seafarer profile creation are separate writes, not a transaction. Verify duplicates/concurrency, partial failure, email normalization and correct landing view. |
| Account recovery/settings | Missing | No forgot-password, email-verification, password-change or general account-edit routes/screens. Name/email read-only in CV; recruiter company cannot be maintained through a settings screen. |
| Seafarer maritime CV/personal profile | Implemented, potentially defective | Section updates, profile upsert and user phone/location update exist; separate writes and draft-reset risks. Verify unsaved edits survive another section save/refetch, invalid values and navigation. |
| Vessel experience | Implemented, apparently complete for metadata CRUD | Create/update/delete, ownership checks, date-order validation, confirmation and invalidation traced. Verify add/edit/delete/cancel and cross-owner denial on disposable data. Sea-service duration is approximate, not a verified service calculation. |
| Certificates | Implemented, apparently complete for metadata CRUD | Ownership and merged issue/expiry date validation exist. Verify blank expiry, expired record, edit/delete and field-error focus. Uploads/authority verification missing by design. |
| Travel authorizations | Implemented, potentially defective | Structured CRUD, owner-only sensitive fields, public summaries; clear/partial-update defects described above. Verify cleared values, date boundaries, OTHER transitions and legacy readiness fallback. |
| Job search/filtering | Implemented, potentially defective | Search/rank/vessel filters → GET jobs; no matching algorithm, pagination or salary filter. Verify locale labels, no results, failures, applied status and filter retention. |
| Apply/status tracking | Implemented, potentially defective | Unique job+candidate, applicant POST and status PUT, owner application listing. Closed-job rule absent; status history/withdrawal missing. Verify concurrent duplicate application, stale job closure, messages and status refresh. |
| Seafarer messages | Incomplete | Receive API exists; inbox missing. Reply, mark-read and threading absent in routes/model. Verify current contract before adding receiving UI. |
| Seafarer interviews | Incomplete | Own-list API strips private notes; no agenda/details UI, acceptance/decline, timezone explanation or reschedule request. |
| Recruiter dashboard | Implemented, potentially defective | Jobs/applications/saved/interviews queried, links routed. Errors can produce permanent loading; scheduled count includes past interviews. Test independent query failures and metric meaning. |
| Candidate browse/filter | Implemented, potentially defective | Rank/vessel/nationality/availability/min-years/name filters and selection. Error-as-empty, no pagination/debounce, hidden selection and narrow nationality choices. Verify search semantics and bulk recipient scope. |
| Candidate detail | Implemented, potentially defective | Detail fetch and save/message/schedule wired; missing/error profile indefinitely skeleton. Verify not-found, denied, nested-dialog focus and privacy in network payloads. |
| Saved profiles | Implemented, apparently complete for save/unsave | Owner-scoped list/upsert/delete traced. List error rendering defective; notes feature incomplete. Verify idempotent save and multi-view cache refresh. |
| Job posting | Implemented, potentially defective | Title required, other fields optional; weak currency/range constraints can produce bad data/render failure. Verify salary order, supported currencies, future/flexible joining date and clear publishing feedback. |
| Job management | Incomplete | Open/close/delete and confirmation exist. Editing missing despite PUT support. Job deletion cascades applications and nulls interview job relation (`prisma/schema.prisma`); confirm copy does not fully describe history loss. |
| Applicants | Implemented, potentially defective | Status updates scoped to job recruiter; bio displaces application message. Verify full message visibility, error recovery and intended status transitions. No interview-from-application context linking. |
| Recruiter interviews | Incomplete | Schedule/complete/cancel exist. No job selection/reschedule UI or candidate-visible timezone contract. POST linked job ownership unchecked. Test future-time edges, cross-owner link denial and private notes. |
| Recruiter messaging | Incomplete | Bulk/single sends and sent-list exist, with transactions and deduplication. No two-way conversation or read update. Verify failed recipient handling, duplicate send prevention and explicit bulk confirmation/recipient review. |
| Admin dashboard | Implemented, apparently complete for aggregate read | Counts, rank distribution and recent candidates use admin-only API. Verify totals on controlled fixtures, zero-state and network failure. Full candidate payload fetched for a summary is inefficient. |
| Admin candidate filtering/details | Implemented, potentially defective | Filtering/list/cards/detail connected, data sanitized. Search promise, completeness and hidden-versus-missing display are wrong. Test keyboard/table/mobile navigation and filtered results. |
| Admin user management | Missing | API returns safe `allUsers` but no recruiter/user list, suspend/reactivate, role administration or audit trail UI/endpoints. Do not call this a management console yet. |
| Admin export | Implemented, potentially defective | CSV with UTF-8 BOM and limited columns exists. Formula neutralization absent; raw enum values remain; placeholderData allows exporting previous results while new filters fetch. Verify spreadsheet compatibility and exact filtered-result snapshot. |

## Security and privacy awareness

### Existing boundaries to preserve

`src/lib/privacy.ts` explicitly sanitizes recruiter and general-admin candidate responses, including nested saved/applicant/interview/message objects. Candidate email/phone/DOB/passport number are nulled; certificate numbers and reference contacts omitted; passport readiness and reference-availability booleans remain. Travel summaries omit document number, issue date and private notes. Saving or receiving an application does not unlock contact data. General admin is not an identity-verification role. The interview seafarer response explicitly replaces recruiter notes with null.

Mutation endpoints generally enforce role and ownership: job/application/interview update, seafarer child-record update/delete and recruiter saved-profile removal. Registration rejects ADMIN. Session cookie uses HttpOnly, SameSite Lax and production Secure; tokens are HMAC-signed and checked for age. Passwords use salted scrypt. Runtime secret validation rejects missing, short and recognizable placeholder secrets. Query cache is cleared on login/register/logout.

Those are source observations, not proof of complete authorization, cookie, CSRF or runtime configuration correctness. A future UI change must not fix incomplete contact workflows by exposing hidden PII or private notes. Use consent and separate verification permissions if disclosure is later required.

### Public-deployment review queue

| ID / priority | Current evidence | Required follow-up before public deployment |
| --- | --- | --- |
| S01 / High | Jobs `mine=1` scope escape and broadly readable closed-job details (P01). | Define disclosure policy; authenticate owner mode and whitelist payloads; test anonymous, seafarer, recruiter A/B and admin access. |
| S02 / High | CSV formula-like input exported unchanged (P02). | Test neutralization against target spreadsheet clients; protect all untrusted cells and preserve privacy column allowlist. |
| S03 / High | Interview create accepts another recruiter's job ID without fetching/authorizing that job. | Check linked job belongs to caller and selected candidate/context is valid. This is a source-confirmed missing check, not an exercised cross-account exploit. |
| S04 / High | No application-level login/register throttling located; synchronous `scryptSync` runs on request path, and schemas do not cap password length. Edge/proxy controls not available for review. | Verify deployed controls, bound request inputs, and add tested abuse limits/recovery as needed. Do not claim brute-force protection from cookie signing. |
| S05 / High, conditional | Auth displays fixed demo-account selectors; seed contains known recruiter/seafarer passwords. No fixed admin credential remains. Existing DB account contents were not inspected. | Ensure public production data excludes demo accounts and demo utility UI is environment-gated. Do not delete or change current accounts during this audit. |
| S06 / Medium | No explicit Origin/CSRF guard found on mutation routes; same-site Lax cookie exists. No CSP/response-header policy in `next.config.ts`; reverse-proxy behavior unknown. | Validate actual cross-origin request behavior, same-site deployment assumptions, TLS/secure-cookie behavior and response headers before deciding changes. Absence of a token alone is not a validated exploit. |
| S07 / Medium | Registration and profile/user update span separate writes; duplicate pre-check races are unhandled. Travel partial-update invariant is not validated on merged data. | Atomic operations and explicit conflict handling; controlled failure/concurrency tests on an isolated test DB. |
| S08 / Medium | Login/register catch blocks log raw error objects; many routes have no standardized error boundary. | Review logs/error responses for sensitive values; use redacted structured errors. No actual PII leak in deployed logs was observed. |

### Known security-scan findings: provenance limitation

No saved security-scan findings/report artifact, scan ID, or finding handoff was supplied or found in the repository/document inventory. The connected completed-scan reader requires a scan ID; it cannot establish an unknown scan's outstanding findings. Consequently **the historical unresolved scan inventory is unverified, not empty**. S01–S08 are this audit's current review queue and must not be relabeled as scanner-validated findings.

Git history contains `cc406ea` (runtime session-secret requirement), `bfbe957` (fixed demo admin credentials removed), and `d991a31` (candidate privacy hardening). Their relevant protections are visible in current source. These historical problems should not be repeated as known unresolved findings without the original report and fresh verification. Reconcile the canonical prior scan, including remediation status and exceptions, as a deployment gate. No security change was implemented.

## Code quality and maintainability

| Area | Assessment and next step |
| --- | --- |
| Component organization | Clear role folders, extracted CV sections and reusable controls are strengths. Browse, post-job and admin master list remain large and duplicate filter/form wiring. Extract by behavior after contract tests, not solely to shorten files. |
| Types/privacy | Owner and sanitized candidate shapes share broad `SafeUser`/profile interfaces; runtime null/omitted fields do not match expectations well. Explicit OwnerProfile/CandidateSummary/AdminSummary DTOs would prevent score and hidden-field mistakes. |
| State and caching | Zustand keeps auth/navigation, React Query handles server state: sensible split. Session cache clearing is good. Query keys omit user identity; later session transitions need isolation tests. Draft state resets and unmounts need guarding. Filter/search state is not synchronized to URL, only the view is. |
| Form handling | Shared Zod schemas, field errors and focus-first-invalid provide a foundation. Documents use generic toast errors; duplicated Field/CvFormField/SelectField patterns drift. Unknown Zod error codes can leak as `validation.<message>`; add a safe fallback and root-error handling. |
| Workflow invalidation | Deleting a job invalidates jobs but not applications/interviews even though relations change. Cross-browser updates are not polled and window-focus refetch is disabled. Document freshness expectations. |
| Errors | `fetchUser` converts service errors to logged out. Several list/detail views conflate empty/loading with errors. API wrapper trusts successful JSON through TypeScript casts and has no shared session-expired handling. |
| Translation architecture | Flat 580-key dictionaries are easy to inspect, but Record<string,string> cannot enforce key parity/types; missing keys silently fall back. No plural/date/number/domain-label layer. `next-intl` is installed but custom context is the active implementation; adding another runtime is not required to repair these gaps. |
| Performance | Job/candidate/admin endpoints return unbounded arrays and include full relation lists; min-years filters after loading profiles; overview loads full datasets to slice a handful. Browse/job search fires per keystroke; admin has a 300ms debounce. Bulk save/message arrays have no maximum. Add bounded queries and server aggregation/pagination before load grows. |
| Data modeling | Salaries/years/dates are mostly strings; accepting arbitrary domain labels complicates range/sort/locale logic. First repair validation and stable labels without rewriting existing data. Plan any future numeric/date normalization separately with explicit migration review. |
| Build/dependencies | Both npm and Bun lockfiles exist; Docker uses `npm install`. Unused UI/library packages and a generic package name indicate starter residue, not proven runtime defects. Choose one package manager and deterministic installs in a separate maintenance change. |
| Test coverage | No test script or dedicated application unit/integration/E2E suite found. A file named `aspect-ratio.tsx` matched a broad filename search; it is not a test. The privacy matrix has manual smoke instructions, not automated coverage. |

## Checks performed and limitations

| Check | Result |
| --- | --- |
| `npm run lint` | Passed, exit 0. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Passed, exit 0; no compiler output written. |
| AST dictionary/source audit | 163 source modules scanned (162 TS/TSX + one MJS); 580 EN and 580 AR keys; no asymmetric dictionary keys, literal `t('...')` misses or interpolation-variable mismatches. Dynamic keys separately inspected; runtime/unknown data values remain unproven. |
| In-memory schema/format probes | Reversed salary range plus currency `INVALID` accepted; formatting that currency throws RangeError. Partial travel expiry accepted without stored-date context; cleared edit fields disappear from JSON. Past interview creation rejected. English “2 years” and one-day service shown as “1 month” reproduced. |
| Synthetic privacy/completion checks | Passport, DOB, email, phone and certificate-number suppression checked; owner 100% / admin 82% score discrepancy reproduced. No real personal data used. |
| CSV helper probe | Synthetic `=1+1` unchanged; formula neutralization gap reproduced. No spreadsheet opened. |
| `git diff --check` and file-scope check | Passed. New Markdown files separately checked for trailing whitespace, missing final newline and broken local report links; only the three requested reports were added. |

An initial currency probe used `NOT_A_CURRENCY` (14 characters) and failed its assertion because the schema correctly enforces a 12-character maximum. The corrected seven-character `INVALID` probe established the actual format-validation defect. No application code changed to obtain any result.

Not run: `npm run build` (runs Prisma generation and writes build artifacts), browser/viewport screenshots, API integration or mutation tests, credential checks, database inspection, migration/seed/setup, Docker startup, dependency vulnerability scan or load test. Prior-turn builds are not evidence for this audit snapshot. No claim is made about actual users, stored data, deployed safeguards, visual acceptance, security-scan closure or end-to-end success.

Before implementation sign-off, use a disposable isolated test database and synthetic accounts, verify the full role/privacy matrix, and render every phase in English/Arabic × light/dark × mobile/desktop. Current databases must remain untouched.
