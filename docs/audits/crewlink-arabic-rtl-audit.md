# CrewLink Arabic and RTL audit

Audit date: 2026-10-29. Baseline: `0a87c90`, `design/premium-polish`. This report is based on source inspection and read-only in-memory analysis. No app, translation, database or user preference was modified. Related: [product audit](crewlink-product-audit.md), [roadmap](crewlink-improvement-roadmap.md).

## Assessment

Dictionary coverage is strong; a native Arabic product experience is not complete. Most Arabic labels are understandable Modern Standard Arabic, and ordinary navigation/action labels are generally serviceable. Maritime terminology, grammatical counts, some literal translations, English domain values, privacy copy and RTL control behavior need focused revision. This is an editorial assessment, not maritime-authority certification or usability testing with Arabic-speaking seafarers.

| Dimension | Evidence-based assessment |
| --- | --- |
| Dictionary parity | 580 English keys and 580 Arabic keys; no missing/extra keys or interpolation-placeholder mismatches. Only `brand.name` has an identical EN/AR value, appropriately. |
| Literal key usage | No missing dictionary key among literal `t('...')` calls across 163 source modules (162 TS/TSX + one MJS). This does not validate every computed key or future database enum. |
| UI completeness | Partial: rank, vessel and nationality choices, years/service durations, brand tagline, several examples, metadata and accessible names remain English. |
| Arabic writing | Understandable but inconsistent and sometimes mechanically phrased; counts use a single form; register/tanween, terminology and entity gender vary. |
| RTL structure | Logical spacing and root direction are present. Physical dialog/select/table/menu styling remains. Radix direction/keyboard semantics are not explicitly connected. |
| Formatting | Browser locale, selected app locale and timezone are conflated. No Arabic number/plural contract. |
| Persistence | Locale saved to localStorage; refresh behavior is intended but SSR/client mismatch and blocked storage are untested. No auth-screen language switch. |
| Mobile | Responsive structure exists, but narrow Arabic labels, dialogs, mixed identifiers, bottom navigation and keyboards were not rendered/tested. |

## Implementation trace

`src/lib/i18n.tsx:11` and `:631` define flat EN/AR dictionaries as `Record<string,string>`. `t` selects active dictionary → English → literal key (`:1292`). Variables use string replacement, not ICU messages or plural rules. Keys are not compiler-checked. A missing Arabic entry can silently display English; an unknown validation code can display an internal key/message. Add a development diagnostic and typed key parity without changing server error codes.

`I18nProvider` initializes English on server, reads `maritimenet.locale` from localStorage in the browser (`:1263`), and changes document `lang`/`dir` in an effect (`:1276`). The root layout always emits `<html lang="en">`; the signed-in shell also sets `dir`, but public auth depends on the document effect. Client AR first render can differ from server English markup; suppressHydrationWarning on html does not prove the child content is safe. This is a source-supported hydration risk requiring refresh testing, not an observed hydration failure.

Storage access is not wrapped for unavailable storage, there is no cross-tab synchronization, and neither browser-language detection nor account locale exists. These are separate choices: server-readable preference and robust storage access are higher priority than account synchronization or automatic detection. The legacy storage key is an internal compatibility detail, not itself a user-facing bug; preserve existing preferences if renaming it later.

AppHeader contains the language toggle; AuthScreen does not. A first-time Arabic user has no language selection before registration/login. `brand-logo.tsx` uses `brand.tagline` from `src/lib/brand.ts`, bypassing the already translated `brand.tagline` key. Root metadata is English-only. Keep CrewLink's proper name unchanged, localize its descriptor and accessible description.

## Findings and recommendations

| ID / priority | Evidence | Recommendation and validation |
| --- | --- | --- |
| A01 / High | `src/lib/types.ts`: 15 English ranks, 14 vessel types, 12 nationality options; rendered verbatim in CV, job publishing/search, recruiter/admin filters, cards and details. | Map current stable values to EN/AR label keys without changing persisted strings or API filter values. Support unknown/legacy values with a readable fallback. Add a wider, intentional nationality policy; don't make twelve options the only possible real-world identities. |
| A02 / High | `src/lib/format.ts:54` hardcodes year(s); `formatDurationBetween` hardcodes month(s)/year(s). `Intl.DateTimeFormat(undefined)` and `Intl.NumberFormat(undefined)` use environment locale. | Pass app locale explicitly; centralize number, percentage, money, calendar-date and datetime formatting. Specify Gregorian date-only semantics separately from interview instants/timezones. |
| A03 / High | Counts such as `'{count} طلبات مقدمة'`, `'{count} مقابلات'`, `'{count} مرشحين محددين'`, `'{count} شهادة'` share one grammatical form. Many result counts are number + noun concatenation. | Add Arabic zero/one/two/few/many/other handling with `Intl.PluralRules` or equivalent; format digits deliberately. Test 0, 1, 2, 3, 10, 11, 99, 100, 102 and decimal experience values. |
| A04 / High | `ui/dialog.tsx:76,92`: `right-3`, `pr-8`; `ui/select.tsx:110,115`: `pr-8 pl-2`, `right-2`; `ui/table.tsx:73`: `text-left`; `ui/dropdown-menu.tsx` uses left/right insets and submenu arrow. | Prefer end/start, pe/ps, text-start; make directional arrows intentional. Integrate application direction into active Radix roots/provider and test keyboard navigation. CSS inheritance is not enough evidence of correct primitive direction. |
| A05 / High | No `<bdi>`, direction-specific identifier fields, `dir="auto"` message text or explicit bidi isolation found in app source. Mixed CrewLink/STCW/COC/IMO, names, email, `+` phone and dates share RTL context. | Isolate proper names/unknown user text with `bdi` or `dir=auto`; keep emails/phone/document codes LTR with logical alignment. Never reverse stored strings or apply universal LTR to Arabic prose. Test selection/copy/paste and punctuation. |
| A06 / High | Public auth lacks locale toggle; localStorage/server locale divergence described above. | Expose a bilingual language control on auth and establish deterministic first render; test AR hard refresh, deep link, logout, navigation and blocked storage. |
| A07 / Medium | Hardcoded examples and ARIA strings listed below; default message subject stored by server as English. | Localize system-authored display strings; keep user-authored text intact. Use a neutral missing-subject representation or translatable system-message metadata rather than freezing English into new data. |
| A08 / Medium | `globals.css` has Latin/system font stack and many small text sizes. `tracking-tight`/`tracking-wide` remains in headings/detail labels. | Test Arabic shaping, baseline and weight at actual supplied fonts. Use suitable Arabic line-height; avoid tracking intended for Latin capitals; avoid clipping marks/ascenders. |
| A09 / Medium | Search promises rank/vessel/email not searched by APIs; ranking options mix “Master”, “Chief Officer” and “Chief Mate” examples. | Correct copy to implemented behavior; agree glossary and distinguish rank, certificate endorsement and job title. Do not solve this by changing existing canonical filter values. |
| A10 / Medium | CSV headers translated but availability is raw `AVAILABLE` etc.; date helper has no locale; unbounded records and no pagination. | Specify bilingual export representation and locale-independent machine columns where needed. Add accessible localized pagination when implemented, keeping formula protection and privacy allowlist. |
| A11 / Medium | “Recruiters use supervisor contacts” conflicts with server-private references; “secure/sanitized summaries” exposes implementation jargon. | Explain who can see what in natural Arabic; describe verification as an actual process only when supported. Admin should see “hidden for privacy,” not “not provided,” where appropriate. |

### Hardcoded and mixed-language inventory

Active product examples found by AST scanning and targeted inspection:

| File | Current text | Treatment |
| --- | --- | --- |
| `shared/brand-logo.tsx` / `lib/brand.ts` | Maritime recruitment workspace | Use `brand.tagline` translation; preserve CrewLink as brand. |
| `auth/auth-screen.tsx:230` | `you@example.com`; demo `Deck Officer • Manila`, `Recruiter • Copenhagen` | Email example can remain Latin with LTR isolation; localize demo role/location descriptors and keep utility development-only. |
| `recruiter/post-job-view.tsx:134` | `e.g. Chief Officer for LNG Carrier` | `مثال: كبير الضباط على ناقلة غاز طبيعي مسال` (subject to glossary sign-off). |
| `recruiter/schedule-interview-dialog.tsx:147` | `Rotterdam / Zoom / Phone` | `مثال: روتردام، أو عبر Zoom، أو هاتفيًا` with isolated brand. |
| `seafarer/certificate-dialog.tsx:145` | `e.g. STCW II/2 Chief Mate` | Arabic example with STCW and II/2 isolated; distinguish certificate designation from job rank. |
| `seafarer/cv/maritime-details-section.tsx:151` | `e.g. II/2 Chief Mate` | Explain CoC grade/endorsement in Arabic, retaining the exact regulatory code. |
| `seafarer/cv/travel-authorization-dialog.tsx:220` | `GB` | Valid technical example; keep LTR and explain two-letter country code in help. |
| `shell/app-header.tsx:50` | `Go to dashboard` | `الانتقال إلى لوحة التحكم` using a dictionary key. |
| `shell/app-sidebar.tsx:56,79` | `Primary navigation` | `التنقل الرئيسي` using a dictionary key. |
| `ui/dialog.tsx:79` | Screen-reader `Close` | `إغلاق`; verify every active modal exposes localized accessible name. |
| `lib/validation/messages.ts` | Default subject `Message from a recruiter` | System-generated English persists even for Arabic users; model/display it deliberately. |
| Recruiter/admin vessel details | `GT {value}` | Keep GT abbreviation with Arabic gross-tonnage label/tooltip and number formatting; GT is not deadweight tonnes. |

The component-library scan also found English breadcrumb “More,” carousel previous/next, sheet close, pagination previous/next/more and sidebar labels in `ui/{breadcrumb,carousel,sheet,pagination,sidebar}.tsx`. These are latent reuse issues; do not present unused primitives as visible bugs on today's screens. Calendar uses browser/default locale and directional range classes; localize and test before introducing it into date workflows. Current date fields mostly use native inputs whose picker language is browser-dependent.

### Arabic editorial examples

These are recommended product phrasings, not changes applied to dictionaries. Adopt Modern Standard Arabic consistently and have an Arabic-speaking maritime practitioner review rank/certificate terms in the intended hiring markets.

| Key | Current Arabic | Recommended Arabic / reason |
| --- | --- | --- |
| `auth.welcomeTitle` | التوظيف البحري، بشكل منظم. | التوظيف البحري في مكان واحد — more natural product headline; avoid unimplemented promises. |
| `auth.feature.1.title` | ملفات بحرية منظمة | ملفات مهنية منظّمة للبحّارة — identifies whose files. |
| `role.admin` | مدير | مسؤول النظام — distinguish system administration from ship/company management. |
| `nav.masterList` | قاعدة البيانات الرئيسية | سجل البحّارة — reflects the implemented screen; use سجل المستخدمين only when user management exists. |
| `seafarer.greeting` | مرحبًا بك على متن السفينة، {name} | مرحبًا، {name} — user is in a recruitment product, not necessarily aboard a vessel. |
| `cv.maritimeInfoHint` | رتبتك وتوفرك ومؤهلاتك | رتبتك البحرية، وموعد جاهزيتك للعمل، ومؤهلاتك — clearer availability context. |
| `cv.vesselExperience` / `cv.vesselService` | خبرة على السفن / الخدمة على السفن | الخدمة البحرية — consistent section term; individual row: فترة خدمة بحرية. |
| `cv.signOnDate` | تاريخ الالتحاق | تاريخ الالتحاق بالسفينة — distinguish from account joining date. |
| `cv.signOffDate` | تاريخ المغادرة | تاريخ انتهاء الخدمة على السفينة — distinguish travel departure from service end. |
| `cv.captainContact` | تواصل الربان | بيانات الاتصال بالربان — professional field label. |
| `cv.chiefEngContact` | تواصل كبير المهندسين | بيانات الاتصال بكبير المهندسين. |
| `cv.supervisorHint` / `cv.experienceHint` | Promises recruiter verification using contacts | تُحفظ بيانات المراجع المهنية ضمن ملفك الخاص، ولا تظهر لمسؤولي التوظيف. — matches current policy, not future consent features. |
| `cv.travelAuthDialogDesc` | يرى مسؤولو التوظيف ملخصًا آمنًا فقط | تظهر لمسؤولي التوظيف معلومات الجاهزية فقط، دون أرقام المستندات أو ملاحظاتك الخاصة. — explains visibility concretely. |
| `travelAuth.type.UK_TRANSIT_OR_SEAFARER` | عبور / بحّار بريطانيا | تأشيرة عبور أو تأشيرة بحّار للمملكة المتحدة. |
| `travelAuth.type.AU_MARITIME_CREW` | طاقم بحري أستراليا | تأشيرة الطاقم البحري الأسترالية. |
| `jobs.compensationLocationSection` | التعويض والموقع | الراتب وموقع العمل — more natural for this salary form. |
| `jobs.applicationStatus.SHORTLISTED` | قائمة مختصرة | ضمن القائمة المختصرة — state rather than noun. |
| `interview.markComplete` | وضع كمكتملة | تحديد المقابلة كمكتملة. |
| `saved.subtitle` | المرشحون في قائمتك المختصرة | الملفات التي حفظتها للمتابعة — saving a profile is different from shortlisting an application. |
| `validation.invalid_availability` | اختر توفرًا صالحًا | اختر حالة جاهزية صالحة. |

Use entity-specific gender where relevant: جواز السفر صالح/منتهي الصلاحية versus الشهادة صالحة/منتهية الصلاحية. Prefer انتهاء الصلاحية over ambiguous الانتهاء. Do not imply that a valid expiry date means a document has been verified by CrewLink.

### Bilingual maritime glossary proposal

This is a consistent product vocabulary proposal. Existing API/database values remain unchanged. Preserve international acronyms/codes as isolated Latin text alongside Arabic explanations. Certificate/rank wording needs specialist sign-off; no new visa eligibility or legal claims are being made.

The international expansion of STCW was cross-checked against the [IMO STCW convention overview](https://www.imo.org/en/ourwork/humanelement/pages/stcw-conv-link.aspx). The distinction between GT and a mass in tonnes follows the volume-based definition in the [IMO tonnage convention overview](https://www.imo.org/en/about/conventions/pages/international-convention-on-tonnage-measurement-of-ships.aspx). Other Arabic entries below are editorial proposals requiring practitioner review, not claims of officially standardized Arabic labels.

| English | Preferred Arabic | Usage note |
| --- | --- | --- |
| Seafarer | بحّار | Plural البحّارة; broad occupation category. |
| Crew | طاقم السفينة | Use طواقم السفن in plural context. |
| Recruiter | مسؤول التوظيف | Distinguish from employer/company. |
| Administrator | مسؤول النظام | General admin does not imply verification permission. |
| Rank / position | الرتبة البحرية / المنصب | Keep job title separate: المسمى الوظيفي. |
| Master / Captain | ربّان السفينة | Rank value may remain Master internally. |
| Chief Officer / Chief Mate | كبير الضباط | Use one display term; retain exact certificate designation where needed. |
| Second / Third Officer | الضابط الثاني / الضابط الثالث | Avoid inconsistent numeral spelling in labels. |
| Chief Engineer | كبير المهندسين | Distinguish from company engineering manager. |
| Second / Third / Fourth Engineer | المهندس الثاني / الثالث / الرابع | Consistent rank sequence. |
| Electro-Technical Officer (ETO) | الضابط الكهروتقني (ETO) | Confirm employer/market terminology. |
| Bosun | رئيس البحّارة | Avoid conflating with Master. |
| Able Seafarer / AB | بحّار مؤهّل (AB) | Preserve exact endorsement wording where required. |
| Oiler | عامل تزييت | Confirm target rank taxonomy. |
| Deck / Engine Cadet | متدرّب قسم السطح / متدرّب قسم المحركات | Clear department distinction. |
| Sea service | الخدمة البحرية | A recorded period: فترة خدمة بحرية. |
| Sign-on / Sign-off | الالتحاق بالسفينة / انتهاء الخدمة على السفينة | Not registration/logout. |
| Joining port / date | ميناء الالتحاق بالسفينة / تاريخ الالتحاق بالسفينة | Add vessel context when ambiguous. |
| Availability | الجاهزية للعمل | Status: متاح للعمل، على متن سفينة، غير متاح حاليًا. |
| Certificate of Competency (CoC) | شهادة الكفاءة البحرية (CoC) | Grade: درجة شهادة الكفاءة. |
| STCW | معايير التدريب والإجازة والخفارة للملاحين (STCW) | Expand once; preserve regulatory codes. |
| Certificate / issuing authority | شهادة / جهة الإصدار | Do not call a self-entered record verified. |
| Expiry date | تاريخ انتهاء الصلاحية | Use consistently for all documents. |
| Unverified / verified | لم يُتحقق منه / تم التحقق منه | Match entity gender, and actual supported verification process. |
| IMO number | رقم تعريف السفينة لدى المنظمة البحرية الدولية (IMO) | Short field label: رقم IMO للسفينة. |
| Gross tonnage (GT) | الحمولة الإجمالية (GT) | Do not label as deadweight or a mass in tonnes. |
| Deadweight tonnage (DWT) | الحمولة الساكنة (DWT) | Glossary only; not currently a modeled field. |
| Container ship | سفينة حاويات | Stable underlying English value retained. |
| Oil / chemical tanker | ناقلة نفط / ناقلة مواد كيميائية | Separate vessel types. |
| Bulk carrier | ناقلة بضائع صبّ | Distinguish from general cargo. |
| LNG / LPG carrier | ناقلة غاز طبيعي مسال / ناقلة غاز بترولي مسال | Retain LNG/LPG alongside label when useful. |
| General cargo / Ro-Ro | سفينة بضائع عامة / سفينة دحرجة (Ro-Ro) | Do not translate acronyms mechanically. |
| Offshore supply vessel | سفينة إمداد للعمليات البحرية | Confirm regional industry terminology. |
| Trade area | منطقة الملاحة | Distinguish from company sales territory. |
| Travel authorization / transit visa | تصريح سفر / تأشيرة عبور | Readiness record, not visa eligibility advice. |
| Vacancy / application / applicant | وظيفة شاغرة / طلب توظيف / متقدّم | Use consistently across role views. |
| Saved profile / shortlisted application | ملف محفوظ / طلب ضمن القائمة المختصرة | Separate discovery list from hiring-stage decision. |
| Professional reference | مرجع مهني | Contact information stays private under current policy. |

## Verification matrix for the next implementation

Run on isolated synthetic fixtures after implementation, not against existing user data:

1. First visit, AR switch on auth, registration form, failed login, reload, logout and role-specific deep link; verify document lang/dir, no key flash or hydration errors, retained preference and blocked-storage fallback.
2. English/Arabic × light/dark × 320/390/768/1440px, 200% zoom, long Arabic names, long company names, native keyboard and narrow landscape. Verify seven recruiter destinations remain discoverable.
3. Keyboard-open select/dropdown, nested dialog, confirm dialog and menus: arrow direction, checkmark edge, Escape, focus restoration, translated accessible names and no clipping.
4. Dates: Gregorian date-only values near timezone boundaries, leap day, expiry day, 90/180-day thresholds; interview instant viewed in two timezones with explicit zone. App language, browser language and timezone must be independently controlled.
5. Counts for Arabic plural categories, decimal experience, salary range and percentages; invalid currency must never crash a view. Decide whether Arabic-Indic or Latin display digits are the product default; preserve technical codes unchanged.
6. Bidi fixtures: `محمد Ali`, CrewLink, `STCW II/2`, `US C-1/D`, phone `+20`, email and document identifiers alongside Arabic punctuation. Check copy/paste order and screen-reader pronunciation.
7. Filter values: switch languages after choosing rank/vessel/nationality; selection and API values stay identical while labels change. Existing free-text/unknown values remain readable.
8. Exports: Arabic headers/BOM, correct enum labels or explicitly documented machine values, formula protection and unchanged PII allowlist.

No claim of native-quality sign-off, mobile RTL correctness or accessibility conformance should be made until this matrix and an Arabic maritime editorial review are completed.
