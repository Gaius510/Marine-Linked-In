# CrewLink improvement roadmap

Date: 2026-10-29. Based on commit `0a87c90` and the [product audit](crewlink-product-audit.md) and [Arabic/RTL audit](crewlink-arabic-rtl-audit.md). This is an implementation proposal; no changes below have been implemented by this audit.

## Delivery rules

Use small changes with explicit contracts and acceptance tests. Preserve the current maritime image, navy/teal identity and role-specific structure. Resolve behavior and localization before screen composition. Each numbered item is an independently reviewable implementation slice; a phase is a sequencing group, not one mandatory large pull request.

- Existing databases/volumes must remain untouched by development tests. Use disposable, isolated SQLite fixtures for future mutation, concurrency and migration tests. This audit did not create them.
- Preserve `docs/privacy/data-access-matrix.md`: recruiter/general admin summaries never gain raw contact, DOB, identity numbers, travel notes or reference contacts as a shortcut. Keep recruiter interview notes author-only.
- Every slice must pass relevant targeted tests plus lint/type checking. Run build and browser integration during implementation in an appropriate isolated environment; build was deliberately skipped in this documentation audit.
- UI slices require English/Arabic × light/dark × mobile/desktop evidence. Keyboard/focus and error cases are part of acceptance, not a final optional cleanup.
- Any schema expansion or disclosure-policy change gets a separate design/data review and migration plan. Do not combine it with cosmetic work.
- Priorities: **Critical** = validated release-blocking compromise or data-loss emergency; **High** = privacy/authorization risks, broken core behavior or Arabic usability blockers; **Medium** = workflow quality/consistency; **Low** = optional expansion. No Critical exploit was validated in this audit; do not invent one to inflate urgency. Historical scan inventory remains unverified until reconciled.

## Recommended first implementation phase

Start with **Phase 0A: job visibility contract and regression tests**, followed by 0B/0C before public release. Its scope is one API boundary and its tests: unauthorized `mine=1` must never return all jobs, and closed-job reads must follow a documented owner/application visibility policy. Keep public open-vacancy discovery if intended and do not redesign any screen. This provides an immediately testable safety improvement with little UI churn.

In parallel as a planning activity, locate the canonical prior security scan and reconcile every finding. This does not require changing the application, credentials or data. Do not declare public-deployment readiness until that inventory and phases 0A–0C are signed off.

## Phase 0 — deployment and trust boundaries

### 0A / R01 — job visibility and caller scope

- **Priority / affected role:** High; anonymous visitor, seafarer, recruiter, administrator.
- **Current issue:** P01/S01: `mine=1` with a non-recruiter caller removes both owner and OPEN filters; detail endpoint has broad closed-job/contact visibility.
- **Proposed change:** Define public job summary and owner/detail DTOs; reject owner mode for unauthorized callers; explicitly define closed-job access for owner and existing applicants; apply field allowlists.
- **Files likely affected:** `src/app/api/jobs/route.ts`, `src/app/api/jobs/[id]/route.ts`, `src/lib/types.ts`, new route-contract tests.
- **Complexity:** Medium.
- **Expected user benefit:** Predictable access, reduced unintended recruiter-contact disclosure, reliable job lists.
- **Dependencies:** Agree public vacancy/contact policy; synthetic caller/job fixtures. Preserve existing candidate privacy rules.
- **Acceptance criteria:** Anonymous/seafarer `mine=1` rejected; recruiter A only receives A's jobs in owner mode; recruiter B cannot read A's private closed job; public list exposes only approved OPEN fields; existing-applicant access follows the agreed policy; mutation owner checks unchanged. Test all roles and absent session.

### 0B / R02 — spreadsheet export safety

- **Priority / affected role:** High; administrator CSV export.
- **Current issue:** P02/S02: CSV helper quotes delimiters but leaves formula-like user values active.
- **Proposed change:** Extract an export-cell serializer that neutralizes untrusted formula prefixes/control characters while preserving CSV quoting, UTF-8 BOM and the current non-sensitive column allowlist.
- **Files likely affected:** `src/components/admin/admin-master-list.tsx`, new `src/lib` CSV utility and unit tests.
- **Complexity:** Small.
- **Expected user benefit:** Safer spreadsheet review of candidate exports.
- **Dependencies:** Agreed supported spreadsheet clients; no dependency on layout changes.
- **Acceptance criteria:** Synthetic `=`, `+`, `-`, `@`, leading whitespace/tab/CR cases treated as literal text in supported clients; quotes/commas/newlines round-trip; Arabic stays readable; no extra PII exported. Tests use synthetic values only.

### 0C / R03 — linked interview ownership

- **Priority / affected role:** High; recruiter interview creation and seafarer interview visibility.
- **Current issue:** S03: provided `jobId` is not checked against the creating recruiter.
- **Proposed change:** Authorize optional linked job before creation; validate candidate existence and any intended application relationship; return stable not-found/validation responses.
- **Files likely affected:** `src/app/api/interviews/route.ts`, `src/lib/validation/interviews.ts`, new ownership tests.
- **Complexity:** Small.
- **Expected user benefit:** Correct job/interview associations and protection between recruiter accounts.
- **Dependencies:** Define whether interview creation requires an application; R01 policy alignment.
- **Acceptance criteria:** Recruiter A cannot associate an interview with B's job; own-job and intentionally jobless interviews succeed; invalid candidate/unknown job yields controlled error; seafarer GET still omits private notes.

### 0D / R04 — deployment security reconciliation and abuse controls

- **Priority / affected role:** High; all roles, public authentication.
- **Current issue:** Historical scan status unknown; no app-level throttling located; demo accounts remain in UI/seed; deployed origin/header controls unknown.
- **Proposed change:** Obtain prior scan findings and evidence of remediation; verify runtime TLS/cookie/origin controls and infrastructure abuse limits; implement missing bounded-input/rate controls and gate demo UI in separate small changes as needed. Do not manipulate existing demo accounts as part of a UI patch.
- **Files likely affected:** Deployment review documentation; conditionally `src/app/api/auth/{login,register}/route.ts`, `src/lib/validation/auth.ts`, `src/lib/password.ts`, `src/components/auth/auth-screen.tsx`, deployment configuration and tests. Session redesign is not assumed necessary.
- **Complexity:** Medium, split by confirmed gap.
- **Expected user benefit:** Safer public access and clear release readiness.
- **Dependencies:** Canonical scan ID/report; deployed configuration; demo-data environment policy; R01–R03.
- **Acceptance criteria:** Every prior finding mapped to verified fixed/open/accepted with rationale; no unresolved release-blocking finding; bounded auth inputs; effective tested abuse limits; public production has no enabled demo utility/accounts; secure cookies work on intended HTTPS deployment; CSRF/origin/header tests document actual behavior. Never report absence of code as proof of exploit.

## Phase 1 — repair core correctness

### 1A / R05 — application eligibility and race handling

- **Priority / affected role:** High; seafarer applications, recruiter job management.
- **Current issue:** P04: closed jobs accept direct application requests; duplicate check can race with create.
- **Proposed change:** Enforce OPEN-job eligibility and handle unique conflicts atomically/with controlled errors; translate closed/missing/already-applied outcomes in UI.
- **Files likely affected:** `src/app/api/applications/route.ts`, `src/lib/validation/applications.ts`, `src/components/seafarer/{apply-dialog,job-detail-dialog}.tsx`, `src/lib/i18n.tsx`.
- **Complexity:** Medium.
- **Expected user benefit:** Trustworthy application submission and actionable stale-job feedback.
- **Dependencies:** R01, isolated concurrency fixtures; decision on closure-versus-submit race semantics.
- **Acceptance criteria:** Closed/missing job rejected; simultaneous duplicate attempts produce one record and a stable conflict response; stale dialog refreshes job state; normal open-job application/status listing remains correct.

### 1B / R06 — salary and currency validation

- **Priority / affected role:** High; recruiter publishing, all job/salary displays.
- **Current issue:** Invalid currency can throw during rendering; salary maximum can be lower than minimum.
- **Proposed change:** Validate supported currencies/range ordering on create and merged update; defensive formatter fallback for legacy/unknown data.
- **Files likely affected:** `src/lib/validation/jobs.ts`, `src/lib/format.ts`, `src/app/api/jobs/[id]/route.ts`, `src/components/recruiter/post-job-view.tsx`, `src/lib/i18n.tsx`.
- **Complexity:** Small.
- **Expected user benefit:** No salary-driven page crash; meaningful job comparisons.
- **Dependencies:** Supported-currency policy; formatting interface compatible with R12.
- **Acceptance criteria:** `INVALID` rejected, reversed range rejected with field error, min-only/max-only/zero supported deliberately; legacy bad currency displays fallback without throwing; server/client constraints agree.

### 1C / R07 — travel edit semantics and invariants

- **Priority / affected role:** High; seafarer travel authorizations.
- **Current issue:** P08: cleared edit values omitted; merged issue/expiry/custom-type state can bypass validation.
- **Proposed change:** Explicit null clears, omitted preserves; normalize and validate merged record, including OTHER/customType transitions, before persistence.
- **Files likely affected:** `src/components/seafarer/cv/travel-authorization-dialog.tsx`, `src/lib/validation/travel-authorizations.ts`, `src/app/api/seafarers/me/travel-authorizations/[id]/route.ts`.
- **Complexity:** Medium.
- **Expected user benefit:** Editing actually saves intended removals and valid document dates.
- **Dependencies:** Existing privacy contract; no migration required for nullable fields.
- **Acceptance criteria:** Clear/reload each optional field; preserve omitted fields on direct partial update; reject expiry before existing issue date; switching to OTHER requires label; switching away clears label; owner cannot set verificationStatus; cross-owner access denied.

### 1D / R08 — transaction boundaries and controlled API failures

- **Priority / affected role:** High; registration, CV updates and mutations.
- **Current issue:** User/profile operations can partially succeed; query casts and inconsistent exception handling hide causes.
- **Proposed change:** Transactional user/profile writes; bounded validation/error mapping, conflict handling and redacted logging. Start with registration, then profile updates as separate changes.
- **Files likely affected:** `src/app/api/auth/register/route.ts`, `src/app/api/seafarers/me/route.ts`, `src/lib/validation/server.ts`, affected mutation routes.
- **Complexity:** Medium.
- **Expected user benefit:** No half-created account/profile; recoverable errors with no private implementation leakage.
- **Dependencies:** Isolated failure/concurrency tests; R04 input/error policy.
- **Acceptance criteria:** Injected profile-write failure rolls back new user; injected user-field failure rolls back profile update; duplicate registration returns stable conflict; error response/log fixtures exclude secrets and sensitive input.

### 1E / R09 — query/session state honesty

- **Priority / affected role:** High; recruiter browse/saved/jobs/overview/detail and all session restore.
- **Current issue:** P07: failed requests look empty or load forever; session lookup failure looks logged out.
- **Proposed change:** Shared state contract for initial load, success-empty, error/retry, forbidden/not-found and partial dashboard failure; distinguish session unknown/service failure from unauthenticated. First repair recruiter queries, then session restore separately.
- **Files likely affected:** `src/components/recruiter/{browse-view,saved-view,my-jobs-view,overview-view,seafarer-detail-dialog}.tsx`, `src/components/shared/error-state.tsx`, `src/lib/api.ts`, `src/stores/auth-store.ts`, `src/components/shell/app-shell.tsx`.
- **Complexity:** Medium.
- **Expected user benefit:** Users can recover from failures without mistaking outages for missing candidates or lost sessions.
- **Dependencies:** Stable API status/error contract; shared localized state labels.
- **Acceptance criteria:** Each query forced to fail produces visible retry/error, never false empty/skeleton forever; one failed overview query leaves successful sections usable; expired session and network outage differ; logout failure does not falsely toast success.

### 1F / R10 — protect CV drafts

- **Priority / affected role:** High; seafarer personal/maritime/documents sections.
- **Current issue:** P09: profile refetch or view unmount can erase unsaved edits.
- **Proposed change:** Track section dirtiness, reconcile only clean values, and warn before discarding local edits on view change; do not persist passport/reference drafts to browser storage by default.
- **Files likely affected:** `src/components/seafarer/cv/{personal-information-section,maritime-details-section,documents-section}.tsx`, `src/components/seafarer/seafarer-cv.tsx`, `src/components/shell/app-shell.tsx`, navigation integration, `src/lib/i18n.tsx`.
- **Complexity:** Medium.
- **Expected user benefit:** No silent data-entry loss in long CV sessions.
- **Dependencies:** R08/R09 stable save/refetch behavior.
- **Acceptance criteria:** Unsaved personal text survives maritime save and refetch; dirty navigation offers stay/discard; successful section save clears only its dirty state; logout/discard clears drafts; no sensitive browser persistence introduced.

## Phase 2 — Arabic language foundation

### 2A / R11 — locale initialization and translation contracts

- **Priority / affected role:** High; public auth and every role.
- **Current issue:** A06: auth has no language switch; server EN and stored client AR may differ; fallback is silent and keys untyped.
- **Proposed change:** Accessible auth language switch, deterministic initial locale strategy, resilient persistence, dictionary key/placeholder checks and development missing-key diagnostics; keep current translation runtime unless a separate migration is justified.
- **Files likely affected:** `src/lib/i18n.tsx`, `src/app/layout.tsx`, `src/components/providers.tsx`, `src/components/auth/auth-screen.tsx`, `src/components/shell/app-header.tsx`, translation-check tests.
- **Complexity:** Medium.
- **Expected user benefit:** Arabic available before sign-in and stable across refresh/navigation.
- **Dependencies:** R09; preference-storage strategy (server-readable cookie or deterministic client initialization), preserving legacy localStorage preferences.
- **Acceptance criteria:** First-time auth toggle works; AR hard refresh/deep link/logout preserve intended locale with no hydration error; denied storage does not crash; EN/AR key and interpolation parity tested; missing key has controlled fallback.

### 2B / R12 — domain labels, pluralization and formatting

- **Priority / affected role:** High; all lists/forms/cards/metrics.
- **Current issue:** A01–A03: English canonical values and durations; browser-locale dates/currencies; incorrect Arabic counts.
- **Proposed change:** Stable value → localized label maps; locale-aware number/plural/date/money helpers; distinguish date-only records from timezone-bearing interview instants. Split labels and formatter migration into separate changes.
- **Files likely affected:** `src/lib/{types,format,i18n}.tsx` or `.ts` as applicable, all callers in `src/components/{seafarer,recruiter,admin,shared}`, date tests.
- **Complexity:** Medium per slice.
- **Expected user benefit:** Natural Arabic choices, counts and dates without breaking stored filter values.
- **Dependencies:** R06, R11; Arabic glossary; Gregorian/digit/timezone product policy.
- **Acceptance criteria:** Rank/vessel/nationality labels switch languages without API-value changes; unknown values readable; no English year/month strings in Arabic system UI; Arabic plural-category fixtures correct; timezone-boundary/date-only fixtures stable; currency failure safe.

### 2C / R13 — editorial and system text cleanup

- **Priority / affected role:** High; all roles, especially CV/auth/recruiter communication.
- **Current issue:** Literal Arabic, inconsistent terminology, hardcoded examples/ARIA/brand tagline and inaccurate privacy/search/matching claims.
- **Proposed change:** Apply reviewed glossary/editorial examples; localize active placeholders/accessibility labels/tagline; distinguish saved versus shortlisted and hidden versus missing. Correct claims before implementing extra functionality.
- **Files likely affected:** `src/lib/{i18n.tsx,brand.ts,validation/messages.ts}`, `src/components/{auth,shell,seafarer,recruiter,admin,shared}` affected strings only.
- **Complexity:** Medium.
- **Expected user benefit:** Clear, professionally written and truthful Arabic/English guidance.
- **Dependencies:** R11/R12; Arabic-speaking maritime editorial review; privacy policy. System-authored message subject representation needs an explicit backward-compatible decision.
- **Acceptance criteria:** Active system UI has no unintended English; technical codes/proper names intentionally isolated; reference visibility copy matches policy; “matching” and search placeholders match actual API behavior; glossary sign-off recorded; user-authored text unchanged.

## Phase 3 — RTL, accessibility and design consistency

### 3A / R14 — shared RTL controls and bidirectional content

- **Priority / affected role:** High; all Arabic views/dialogs/menus/tables.
- **Current issue:** A04/A05: physical direction classes, unconnected primitive direction and mixed-content ordering.
- **Proposed change:** Direction-aware Radix integration, logical positioning/alignment, localized primitive accessible names, explicit identifier/user-text isolation. Repair active controls before unused library primitives.
- **Files likely affected:** `src/components/providers.tsx`, `src/components/ui/{dialog,select,dropdown-menu,table,tabs,radio-group}.tsx`, affected fields/detail/message components, `src/lib/i18n.tsx`.
- **Complexity:** Medium.
- **Expected user benefit:** Native directional interaction and readable identifiers in Arabic.
- **Dependencies:** R11; R13 accessible strings.
- **Acceptance criteria:** Close/checkmark/header alignment mirrors; menus/tabs/selects pass AR keyboard navigation; nested dialogs trap/restore focus; mixed Arabic/Latin email/phone/code copy/paste remains correct; English unchanged.

### 3B / R15 — accessible forms and feedback

- **Priority / affected role:** High; auth, CV and job/interview/message forms.
- **Current issue:** Missing associations/group names/helper IDs, document generic errors, landmark and busy/error announcement gaps.
- **Proposed change:** Consolidate field contract incrementally, fix labels/legend/autocomplete/input types, root-error fallback, skip link, one main landmark, one page h1, localized menu labels and status announcements.
- **Files likely affected:** `src/components/shared/{field-error,error-state}.tsx`, `src/components/seafarer/cv/{cv-form-field,documents-section,maritime-details-section}.tsx`, `src/components/recruiter/post-job-view.tsx`, `src/components/auth/auth-screen.tsx`, `src/components/shell/{app-shell,app-header}.tsx`.
- **Complexity:** Medium, split forms from shell semantics.
- **Expected user benefit:** Reliable keyboard, screen-reader and form-error recovery.
- **Dependencies:** R11/R14; preserve server validation.
- **Acceptance criteria:** Every active input/select/group has accessible name; helpers/errors announced and linked; invalid submit focuses correct field; no raw validation key visible; one main/page heading; skip link reaches content; busy/retry/session errors announced.

### 3C / R16 — typography, visual rhythm and theme QA

- **Priority / affected role:** Medium; all screens.
- **Current issue:** Heading scales, density, status tones and repeated decoration diverge; Arabic fallback fonts/small text and composed contrast unverified.
- **Proposed change:** Document page/section/row typography and spacing; test Arabic font pairing; centralize status-tone maps; simplify repeated progress, admin fact icons and radio-card chrome. Preserve palette/image and existing compact controls.
- **Files likely affected:** `src/app/globals.css`, shared page/section/metric/status components, CV header/guidance, admin/recruiter detail views, status-map callers.
- **Complexity:** Medium.
- **Expected user benefit:** Coherent enterprise UI with clearer task hierarchy.
- **Dependencies:** R12–R15; baseline screenshots before changing tokens.
- **Acceptance criteria:** Consistent heading/spacing samples across roles; Arabic glyphs never clipped; critical text readable at zoom; measured composed contrast in both themes; status meaning consistent and textual; no new decorative gradients/glows/floating cards or image replacement.

### 3D / R17 — mobile navigation and content reflow

- **Priority / affected role:** Medium; recruiter navigation, seafarer CV, admin lists.
- **Current issue:** Seven scrolling mobile destinations, truncated Arabic labels, CV guidance below long forms; table/dialog reflow unverified.
- **Proposed change:** Primary mobile destinations plus accessible More navigation; compact guidance above CV sections; test scroll containers, safe areas, long text and open keyboard. Keep desktop role navigation stable.
- **Files likely affected:** `src/components/shell/{app-sidebar,app-shell,app-footer}.tsx`, `src/components/seafarer/seafarer-cv.tsx`, admin list and relevant dialog layouts.
- **Complexity:** Medium.
- **Expected user benefit:** Important tasks discoverable and usable on phones.
- **Dependencies:** R14–R16; if R18 adds seafarer destinations, include them in navigation design.
- **Acceptance criteria:** All destinations reachable at 320/390px without unexplained truncation; active destination obvious; keyboard does not hide submit/close controls; no page-level horizontal overflow; table overflow intentional; 200% zoom and AR/EN tested.

## Phase 4 — complete seafarer workflows

### 4A / R18 — receiving inbox and interview agenda

- **Priority / affected role:** High; seafarer, recruiter outreach.
- **Current issue:** P03: received messages and interviews inaccessible in product UI despite GET APIs.
- **Proposed change:** Add read-only seafarer inbox and agenda/details with visible recruiter/company, time/zone and location. A later slice adds minimal owner-scoped read acknowledgement; no conversation redesign required for initial receiving UI.
- **Files likely affected:** `src/lib/navigation.ts`, `src/components/shell/app-sidebar.tsx`, `src/components/seafarer/seafarer-portal.tsx`, new seafarer receiving views, `src/app/api/messages` for acknowledgement, `src/lib/{types.ts,i18n.tsx}`.
- **Complexity:** Medium per receiving/acknowledgement slice.
- **Expected user benefit:** Candidates can act on private outreach without exposing direct contacts.
- **Dependencies:** R03/R09/R11–R15, timezone policy; R17 mobile destination strategy.
- **Acceptance criteria:** Only own received records displayed; private interview notes absent in network and UI; loading/error/empty states; message bodies readable in both directions; zone explicit; candidate A cannot acknowledge B's message; recruiter read state updates after legitimate acknowledgement only.

### 4B / R19 — honest CV completeness and document readiness

- **Priority / affected role:** Medium; seafarer and admin candidate views.
- **Current issue:** P10: score differs by disclosure context; sections and weighted score conflict; expired documents can count complete; service duration coarse.
- **Proposed change:** Define separate recorded completeness versus current readiness; compute approved aggregate without returning hidden fields; unify section guidance and document-specific expiry/date rules; label estimated service duration honestly or calculate precise intervals.
- **Files likely affected:** `src/components/seafarer/{profile-completeness.ts,seafarer-cv.tsx,cv/cv-status.ts}`, `src/lib/{format.ts,privacy.ts,travel-authorizations.ts}`, admin list and relevant API DTOs.
- **Complexity:** Medium.
- **Expected user benefit:** Trustworthy progress and readiness feedback without privacy regression.
- **Dependencies:** R07/R12, approved metric contract and expiry thresholds.
- **Acceptance criteria:** Same approved metric agrees across owner/admin; all-complete and percentage statements reconcile; expired and unverified are distinct; optional visas don't become universal requirements; one-day/ongoing/leap-year sea-service fixtures correct; no extra PII returned.

### 4C / R20 — application detail and lifecycle clarity

- **Priority / affected role:** Medium; seafarer applications.
- **Current issue:** Status cards have no change history, withdrawal or full-detail path; clamped text can hide content.
- **Proposed change:** First add accessible application detail with full submitted message and explicit status explanation. Define withdrawal and history events as separate contract/schema work only if needed.
- **Files likely affected:** `src/components/seafarer/seafarer-applications.tsx`, new application detail UI, `src/lib/i18n.tsx`; later application routes/schema only after lifecycle approval.
- **Complexity:** Small for detail; Medium for lifecycle/history.
- **Expected user benefit:** Candidates understand what they sent and what happens next.
- **Dependencies:** R05, R12/R15; explicit allowed-status/withdrawal policy for later slice.
- **Acceptance criteria:** Full message/details accessible without losing list position; all statuses explained accurately; no implied real-time notifications. If withdrawal/history is added, owner-only, idempotent and audited transitions tested; migration plan separately approved.

## Phase 5 — recruiter workflow depth

### 5A / R21 — job editing and retention-aware management

- **Priority / affected role:** Medium; recruiter jobs/applicants.
- **Current issue:** Edit UI missing; deleting a job cascades applications and nulls interview relation, while copy emphasizes only posting removal.
- **Proposed change:** Reuse validated publishing fields for edit; prefer closing over deletion and explain current deletion consequences; invalidate related queries. Any archival/history model is a separate proposal.
- **Files likely affected:** `src/components/recruiter/{post-job-view,my-jobs-view}.tsx`, job form extraction, `src/app/api/jobs/[id]/route.ts`, `src/lib/i18n.tsx`.
- **Complexity:** Medium.
- **Expected user benefit:** Correct vacancies without reposting or accidental hiring-history loss.
- **Dependencies:** R01/R06/R08; retention policy and owner checks.
- **Acceptance criteria:** Edit persists for owner only; invalid salary/currency rejected; close retains applications; delete confirmation explicitly describes application/history effects; cancellation makes no changes; application/interview caches refresh after delete.

### 5B / R22 — applicants and interviews in context

- **Priority / affected role:** Medium; recruiter applicants/interviews.
- **Current issue:** Candidate bio replaces submitted message; schedule has no job context and no reschedule UI; upcoming metric includes past scheduled interviews.
- **Proposed change:** Show bio and application message separately, provide authorized job context in scheduling, add reschedule with timezone label, and fix metric definition. Deliver each independently.
- **Files likely affected:** `src/components/recruiter/{applicants-dialog,schedule-interview-dialog,interviews-view,overview-view}.tsx`, interview endpoints/validation as needed, `src/lib/i18n.tsx`.
- **Complexity:** Medium.
- **Expected user benefit:** Recruiters review candidates' actual submissions and maintain accurate schedules.
- **Dependencies:** R03/R12/R18; approved scheduling/status rules.
- **Acceptance criteria:** Message visible even with bio; schedule-from-application sets permitted job/candidate; reschedule only own interview and updates candidate agenda; explicit zone; “upcoming” excludes past/completed/cancelled; private notes remain private.

### 5C / R23 — bounded search, bulk scope and server pagination

- **Priority / affected role:** Medium; recruiter browse, seafarer jobs, admin lists.
- **Current issue:** Unbounded arrays, relation-heavy summaries, per-keystroke requests, post-fetch numeric filter and selection across invisible results; bulk arrays unbounded.
- **Proposed change:** Introduce stable bounded paging/count contracts per endpoint, minimal list DTOs, debounced search and persistent URL filters. Review exact selected recipient set before bulk send; bound bulk payloads server-side. Start with candidate browsing, then jobs/admin separately.
- **Files likely affected:** `src/app/api/{seafarers,jobs,admin/stats}/route.ts`, `src/lib/validation/messages.ts`, `src/components/recruiter/browse-view.tsx`, seafarer jobs/admin list, shared pagination/query helpers.
- **Complexity:** Medium per endpoint; Large if combined, so do not combine.
- **Expected user benefit:** Faster, predictable search and fewer accidental bulk recipients.
- **Dependencies:** R09/R12/R14; ordering/pagination contract; avoid numeric-data migration in initial slice.
- **Acceptance criteria:** Bounded payloads and stable page order; total reflects same filters; stale request cannot overwrite current results; page/filter/locale changes preserve defined selection behavior; exact bulk recipient review; oversized bulk request rejected; pagination labels and arrows correct in AR/EN.

### 5D / R24 — saved-profile notes and freshness

- **Priority / affected role:** Medium; recruiter saved profiles.
- **Current issue:** Stored note field has no edit workflow; stale data can persist with window-focus refetch disabled.
- **Proposed change:** Small owner-scoped note editor if product confirms need; targeted invalidation/refetch policy for notes, applications, saved state and interview updates.
- **Files likely affected:** `src/components/recruiter/saved-view.tsx`, `src/app/api/saved/[seafarerId]/route.ts`, `src/lib/{types.ts,query-client.ts,i18n.tsx}`.
- **Complexity:** Small.
- **Expected user benefit:** Useful private follow-up context and consistent state across screens.
- **Dependencies:** R09/R15; note ownership policy. Existing schema supports notes; no schema migration assumed.
- **Acceptance criteria:** Only owning recruiter can read/write note; candidate/admin payloads do not gain notes; edits visible after navigation/refetch; blank clearing works; refresh policy does not erase dirty forms or flood requests.

## Phase 6 — admin accuracy and useful management

### 6A / R25 — accurate admin lists, exports and aggregate payloads

- **Priority / affected role:** Medium; admin overview/list/detail/export.
- **Current issue:** Wrong completeness, hidden fields labeled absent, stale filtered export possible, unused allUsers payload and full candidate relations in stats.
- **Proposed change:** Use approved readiness metric; hidden-versus-missing presentation; disable/export explicit settled result snapshot during refetch; localized enum/date export policy; separate summary aggregates from paged candidate lists.
- **Files likely affected:** `src/app/api/admin/stats/route.ts`, `src/components/admin/{admin-overview,admin-master-list,seafarer-detail-dialog,rank-breakdown}.tsx`, `src/lib/i18n.tsx`, admin DTOs.
- **Complexity:** Medium, split export/presentation from endpoint aggregation.
- **Expected user benefit:** Accurate oversight and exports matching visible filters without extra private data.
- **Dependencies:** R02/R12/R19/R23.
- **Acceptance criteria:** Export exactly matches settled filters/count and approved columns; formula-safe Arabic export; hidden DOB/contact not “not provided”; aggregate counts verified against controlled fixtures; bounded data; admin role enforced; no reference/document/contact disclosure.

### 6B / R26 — explicit user administration

- **Priority / affected role:** Medium; admin user/recruiter management.
- **Current issue:** Product has candidate read/export, not user lifecycle management.
- **Proposed change:** First add a least-privilege user directory with explicit allowed fields/search. Define suspension/reactivation and audited role changes as separate authorization/session design work; do not add unsafe delete/role buttons in a UI-only change.
- **Files likely affected:** New admin users UI/API, `src/lib/navigation.ts`, `src/components/admin/admin-portal.tsx`, `src/components/shell/app-sidebar.tsx`, `src/lib/{types.ts,i18n.tsx}`; future schema/auth changes only after policy review.
- **Complexity:** Medium for directory; Large for lifecycle, split later.
- **Expected user benefit:** Administrators can locate actual users and perform accountable support work.
- **Dependencies:** R04/R15/R25; approved admin visibility/permissions. Suspension requires session-revocation semantics and schema plan first.
- **Acceptance criteria:** Directory role/search filters work with bounded data; recruiter/seafarer cannot access it; only approved fields returned. Later lifecycle actions require audit trail, explicit confirmation, last-admin protection and session tests before release.

## Phase 7 — optional features after core acceptance

### 7A / R27 — two-way communication and interview responses

- **Priority / affected role:** Medium; seafarer and recruiter.
- **Current issue:** One-way messaging and no interview acceptance/reschedule request.
- **Proposed change:** Design a participant-scoped conversation/reply model and candidate interview response workflow; keep separate from initial receiving UI. Start with reply without attachments, then interview responses.
- **Files likely affected:** `prisma/schema.prisma` and a separately reviewed migration; message/interview APIs, role-specific communication views, validation/types/i18n.
- **Complexity:** Large overall; split into Medium contracts and UI slices.
- **Expected user benefit:** Complete hiring conversations while preserving private contact boundaries.
- **Dependencies:** R03/R04/R18/R22, retention/abuse/notification policy, migration approval and disposable migration tests.
- **Acceptance criteria:** Only conversation participants access/reply; read markers genuine; interviewer notes never included; explicit timezone; candidate accept/decline/request state shown to recruiter; tested authorization and data-integrity transitions; no assumption messages are emailed.

### 7B / R28 — account maintenance and recovery

- **Priority / affected role:** Medium; all roles.
- **Current issue:** Recovery, verification, password change and profile/account settings absent.
- **Proposed change:** Define secure recovery/verification channels and self-service account fields; implement one capability at a time. Avoid adding forms that merely claim to send recovery emails.
- **Files likely affected:** New settings/recovery screens/APIs; auth helpers and validation; schema/token storage and delivery integration only after design review.
- **Complexity:** Large overall, independent Medium slices.
- **Expected user benefit:** Users maintain identity/company information and recover access.
- **Dependencies:** R04/R08/R11/R15; verified delivery service, token lifecycle and session invalidation policy.
- **Acceptance criteria:** Non-enumerating recovery request, single-use expiring token, explicit failure handling, appropriate session invalidation, authorized account edits, no admin self-promotion, bilingual delivery/content tests. Review and test proposed schema changes separately.

### 7C / R29 — verified documents, CV export, alerts and matching

- **Priority / affected role:** Low; seafarer/recruiter and future verifier role.
- **Current issue:** Document uploads/verification, CV PDF export, meaningful matching, email alerts and consent-based contact sharing absent.
- **Proposed change:** Evaluate these as separate product bets after core workflows, never one bundle. Define permitted data, user consent, evidence provenance, expiry meaning and measurable matching criteria before implementation.
- **Files likely affected:** Feature-specific UI/API; `src/lib/privacy.ts`, types/i18n and schema/storage/worker integrations only where required.
- **Complexity:** Large per capability; scope down to one first.
- **Expected user benefit:** Easier professional presentation and relevant hiring follow-up when supported by real operations.
- **Dependencies:** R04/R18–R28 as relevant; verification permissions, upload limits/storage controls, consent/audit/retention and integration choices.
- **Acceptance criteria:** Each capability has its own tested contract and success metric; PDF does not disclose hidden fields; verifier permissions separate from general admin; no self-verified badge; notifications genuinely delivered; matching claims reflect measured criteria; uploads never introduced without validation/access controls.

### 7D / R30 — maintenance and regression coverage consolidation

- **Priority / affected role:** Low after core contract tests; maintainers/all roles indirectly.
- **Current issue:** Large components, duplicate helpers/status maps, mixed lockfiles, unused starter dependencies, StrictMode disabled and no existing dedicated test suite.
- **Proposed change:** Continue the targeted regression suite begun in Phase 0; extract repeated filter/form logic, explicit role DTOs, choose one package manager/deterministic CI, investigate StrictMode before enabling, remove proven unused packages in isolated changes.
- **Files likely affected:** `package.json`, chosen lockfile, `next.config.ts`, role/shared components, `src/lib/{types,format,query-client}` and new test/CI configuration. Docker dependency installation only in a separately authorized maintenance change.
- **Complexity:** Medium per maintenance slice.
- **Expected user benefit:** Fewer regressions and simpler future changes without another redesign.
- **Dependencies:** Passing workflow contracts, bundle/dependency evidence; no package removal merely from suspected nonuse.
- **Acceptance criteria:** One reproducible install/build path; permission/locale/workflow tests run in CI on isolated data; refactors preserve public API/privacy/UI contracts; no unexpected bundle regressions; source formatting/lint/type checks pass.

## Release evidence and stop conditions

For each slice, record problem fixture, intended behavior, changed files, targeted tests, rendered evidence where applicable, and residual limitations. Keep privacy/authorization tests independent from UI tests: hiding a field is not enforcement, and a rendered button is not proof of a working workflow.

Phase 0 tests should establish anonymous/seafarer/recruiter A/recruiter B/admin identities and owner A/B resource fixtures in a disposable test database. Add synthetic contract tests for candidate PII suppression, interview notes, status writes and CSV before changing the related runtime behavior. New test setup must never run seed/reset/migrate against the repository's current database by default.

Do not declare an overall redesign complete because screenshots look consistent. Stop release if the canonical security report remains unreconciled, access tests fail, edits lose drafts, Arabic refresh breaks, or normal workflow errors appear as empty success. Reassess optional phases after core receiving workflows and Arabic/RTL acceptance; account recovery may become a required release gate depending on the support model.
