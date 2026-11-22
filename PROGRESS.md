# Jobify Implementation Progress

## Phases & Status

- [x] **Phase 1: Scaffold + Docker + env validation**
- [x] **Phase 2: Prisma schema, migration, seed**
- [x] **Phase 3: Auth + sessions + RBAC middleware**
- [x] **Phase 4: Companies + members**
- [x] **Phase 5: Jobs + search**
- [x] **Phase 6: Files**
- [x] **Phase 7: Applications + saved jobs**
- [x] **Phase 8: Stats + admin APIs**
- [x] **Phase 9: Frontend foundation, public pages**
- [x] **Phase 10: Seeker dashboard**
- [ ] **Phase 11: Employer dashboard**
- [ ] **Phase 5: Jobs + search**
- [ ] **Phase 6: Files**
- [ ] **Phase 7: Applications + saved jobs**
- [ ] **Phase 8: Stats + admin APIs**
- [ ] **Phase 9: Frontend foundation, public pages**
- [ ] **Phase 10: Seeker dashboard**
- [ ] **Phase 11: Employer dashboard**
- [ ] **Phase 12: Admin dashboard**
- [ ] **Phase 13: Backend tests complete**
- [ ] **Phase 14: Playwright E2E**
- [ ] **Phase 15: README, final audit**

---

## Architectural & Implementation Decisions

1. **Monorepo Layout**: Root npm workspaces (`frontend`, `backend`) sharing root orchestrations (`npm run build`, `npm run lint`, `npm test`, `npm run typecheck`).
2. **Database Port**: Configured to port `5435` in `docker-compose.yml` (configurable via `POSTGRES_PORT`) to prevent conflict with other active postgres containers on developer host machine.
3. **Session Store & CSRF**:
   - DB-backed sessions with cryptographically random 256-bit opaque tokens sent via `HttpOnly`, `SameSite=Lax`, `Path=/` cookies.
   - The session token is SHA-256 hashed before storage in PostgreSQL for fast indexed lookup and protection against database leaks.
   - CSRF protection: `SameSite=Lax` cookies combined with custom request header enforcement (`X-Requested-With`) on all state-changing endpoints (POST, PUT, PATCH, DELETE).
4. **Error Envelope**: Centralized error handler returning consistent format:
   - Success: `{ data: T, meta?: Record<string, unknown> }`
   - Error: `{ error: { code: string, message: string, details?: unknown } }`
   - In production (`NODE_ENV === 'production'`), error stacks are suppressed.
5. **Storage Provider**: Clean interface `StorageProvider` (`save`, `stream`, `delete`) with `LocalStorageProvider` implementation saving to `backend/uploads/` outside public web root, using randomized UUID file keys and validating `%PDF` magic bytes.

---

## Phase Logs & Exact Command Results

### Phase 1: Scaffold + Docker + env validation
- Status: **COMPLETED**
- Scaffolded monorepo with `frontend` (Next.js 15, React 19, Tailwind CSS, TanStack Query) and `backend` (Express, TypeScript, Helmet, CORS, Cookie-parser, Zod) npm workspaces.
- Configured `docker-compose.yml` on port 5435 with PostgreSQL 16 Alpine, healthchecks, named volumes, and automated initialization of both `jobify` and `jobify_test` databases.
- Implemented Zod-validated environment configurations on both backend and frontend.
- Implemented test database safety guard in `backend/tests/setup.ts` ensuring tests strictly execute against test databases.
- Command validation:
  - `npm run typecheck`: Passed (both backend and frontend clean `tsc --noEmit`)
  - `npm run lint`: Passed (backend ESLint 0 warnings/errors, frontend Next lint 0 warnings/errors)
  - `npm test`: Passed (`Health API > GET /api/v1/health returns status ok` in Vitest)

### Phase 2: Prisma schema, migration, seed
- Status: **COMPLETED**
- Designed production Prisma schema with UUID primary keys, role enums (Role, UserStatus, CompanyMemberRole, EmploymentType, ExperienceLevel, JobStatus, ApplicationStatus, FilePurpose), explicit foreign keys, cascading rules, and strategic database indexes.
- Created and executed initial database migration `20261122130736_init` against PostgreSQL.
- Synchronized schema to separate test database `jobify_test`.
- Authored and ran realistic database seed (`prisma/seed.ts`):
  - 1 System Admin (`admin@jobify.dev`)
  - 2 Verified Companies (TechFlow Solutions, Acme Cloud Labs) with owners and recruiters
  - 1 Unverified Company (StealthAI Corp) for verification gating tests
  - 17 realistic jobs across varied employment types, experience levels, and statuses (PUBLISHED, DRAFT, CLOSED, REMOVED)
  - 4 Active Job Seekers with rich profiles, skills, and sample PDF resumes, plus 1 SUSPENDED seeker
  - Multiple applications demonstrating varied lifecycle statuses (PENDING, REVIEWING, SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN)
  - Saved jobs relations
- Command validation:
  - `cd backend && npx prisma migrate dev --name init`: Migration applied, Prisma Client generated
  - `npm run prisma:seed`: Finished successfully with 0 errors
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed
  - `npm test`: Passed

### Phase 3: Auth + sessions + RBAC middleware
- Status: **COMPLETED**
- Implemented DB-backed server-side sessions with SHA-256 hashed session tokens, HttpOnly/SameSite=Lax/Secure cookies, session rotation on login, idle timeouts (24h), and absolute expiration (7d).
- Implemented CSRF protection requiring custom header `X-Requested-With` on all state-changing endpoints (POST/PUT/PATCH/DELETE).
- Argon2id password hashing with constant-time dummy verification failure paths preventing email enumeration attacks.
- Enforced role isolation: registration restricted to `JOB_SEEKER` and `EMPLOYER` (ADMIN role attempts rejected with 422).
- Automatic suspension check rejecting suspended users with 403 Forbidden and invalidating their active sessions.
- Added endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `PATCH /api/v1/auth/password`
- Middleware implemented: `requireAuth`, `optionalAuth`, `requireRole`, `csrfProtection`, `authRateLimiter`, and `apiRateLimiter`.
- Command validation:
  - `npm run typecheck`: Passed (both frontend and backend clean)
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 14 tests passed across 2 test suites (health and auth)

### Phase 4: Companies + members
- Status: **COMPLETED**
- Implemented Companies module and Users/profile management.
- Enforced company-level RBAC:
  - Only EMPLOYER or ADMIN users can register companies; creators are automatically made `OWNER`.
  - OWNER can manage company settings, invite members, change roles, and remove members.
  - RECRUITER can view company members and manage jobs, but cannot edit company settings or manage memberships (403 Forbidden).
  - Last-owner protection rule: a company must always retain at least one OWNER; demoting or removing the final owner is blocked with 400 (`LAST_OWNER_PROTECTION`).
- Enforced privacy for unverified companies: unverified company profiles return 404 to non-members/anonymous users to avoid existence leaks.
- Endpoints implemented:
  - `POST /api/v1/companies`: create company
  - `GET /api/v1/companies`: public list of verified companies with search/filters & pagination
  - `GET /api/v1/companies/:id`: view company details (with unverified privacy protection)
  - `PATCH /api/v1/companies/:id`: update company details (OWNER/ADMIN only)
  - `GET /api/v1/companies/:id/jobs`: list company jobs
  - `GET /api/v1/companies/:id/members`: list members
  - `POST /api/v1/companies/:id/members`: invite/add member (EMPLOYER role required)
  - `PATCH /api/v1/companies/:id/members/:memberId`: update member role (with last-owner protection)
  - `DELETE /api/v1/companies/:id/members/:memberId`: remove member (with last-owner protection)
  - `GET /api/v1/users/me` & `PATCH /api/v1/users/me`: get and update job seeker profiles
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed
  - `npm test`: 26 tests passed across 3 test suites (health, auth, companies)

### Phase 5: Jobs + search
- Status: **COMPLETED**
- Implemented production Jobs module with full search, filtering, salary range overlap, pagination, and RBAC:
  - Public search endpoint `GET /api/v1/jobs` with case-insensitive search across title, description, company name, and location.
  - Multi-criteria filtering: employment types, experience levels, salary range overlap (`job.salaryMax >= minSalary AND job.salaryMin <= maxSalary`), and company filters.
  - Enforced company verification gate: unverified companies cannot publish jobs (`UNVERIFIED_COMPANY`, 403 Forbidden); only DRAFT status allowed until verified.
  - Unpublished job existence protection: draft, closed, or removed jobs return 404 to public/non-members (no existence leak); company members can view their own company's drafts.
  - Job deletion rules: deleting a job with applications is strictly rejected (`CANNOT_DELETE_JOB_WITH_APPLICATIONS`, 400 Bad Request); jobs without applications can be hard-deleted.
  - Employer endpoint `GET /api/v1/employer/jobs` (and `/api/v1/jobs/employer/all`) returning all jobs across statuses with applicant counts.
- Endpoints implemented:
  - `POST /api/v1/jobs`: create job (draft or published with verification check)
  - `GET /api/v1/jobs`: public listing with search/filter/sort/pagination
  - `GET /api/v1/jobs/:id`: retrieve single job with visibility controls
  - `PATCH /api/v1/jobs/:id`: edit job details, publish, or close
  - `DELETE /api/v1/jobs/:id`: delete job with application protection
  - `GET /api/v1/employer/jobs`: employer job dashboard listing
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 41 tests passed across 4 test suites (health, auth, companies, jobs)

### Phase 6: Files
- Status: **COMPLETED**
- Implemented StorageProvider interface (`save`, `stream`, `delete`) and `LocalStorageProvider` keeping files strictly outside the public web root (`backend/uploads/`).
- Documented S3-compatible cloud storage integration in `backend/src/modules/files/storage.ts`.
- Implemented strict PDF validation:
  - File extension check (`.pdf`).
  - True file signature inspection using magic bytes (`%PDF` at byte offset 0), rejecting spoofed MIME types.
  - Size limitation capped strictly at 5 MB (`FILE_TOO_LARGE`, 400).
  - Secure random UUID storage keys preventing file path traversal or predictable naming.
- Implemented strictly authorized streaming endpoint `GET /api/v1/files/:id`:
  - Requester must be file owner, company recruiter/owner with an application using that file, or platform admin.
  - Sends security headers `X-Content-Type-Options: nosniff`, `Content-Type: application/pdf`, and sanitized `Content-Disposition`.
- Endpoints implemented:
  - `POST /api/v1/files/resume`: PDF resume upload with optional default setting
  - `GET /api/v1/files/:id`: authorized secure file stream
  - `DELETE /api/v1/files/:id`: delete file (blocked if linked to active applications)
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 49 tests passed across 5 test suites (health, auth, companies, jobs, files)

### Phase 8: Stats + admin APIs
- Status: **COMPLETED**
- Implemented comprehensive Stats module delivering live analytics for all user roles:
  - `GET /api/v1/stats/job-seeker`: candidate appliedCount, activeApplications, shortlistedCount, acceptedCount, savedJobsCount, applicationsByStatus breakdown, and recent applications.
  - `GET /api/v1/stats/employer`: activeJobsCount, draftJobsCount, totalJobsCount, totalApplicantsCount, pendingReviewCount, shortlistedCount, hiresCount, applicantsByJob, and recent candidate submissions.
  - `GET /api/v1/admin/stats`: totalUsers, usersByRole, suspendedUsersCount, totalCompanies, verifiedCompaniesCount, pendingVerificationCount, totalJobs, activeJobs, totalApplications, and live database latency check.
- Implemented full administrative control suite with strict `Role.ADMIN` gating:
  - `GET /api/v1/admin/users`: paginated user auditing with role and status filters.
  - `PATCH /api/v1/admin/users/:id/status`: user suspension/reactivation with immediate session revocation.
  - `GET /api/v1/admin/companies`: company audit with verification filtering.
  - `PATCH /api/v1/admin/companies/:id/verify`: verify/unverify companies.
  - `GET /api/v1/admin/jobs`: global job monitoring.
  - `PATCH /api/v1/admin/jobs/:id/moderate`: moderate jobs (mark REMOVED, immediately taking them off the public site, or restore).
  - `GET /api/v1/admin/applications`: system-wide application monitor.
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 73 tests passed across 7 test suites (health, auth, companies, jobs, files, applications, admin) in 2.88s

### Phase 9: Frontend foundation, public pages
- Status: **COMPLETED**
- Scaffolded Next.js 15 App Router architecture with TanStack React Query, React Hook Form, and Zod validation:
  - Custom design system based on Plus Jakarta Sans (headings) + Inter (body/UI) with Electric Indigo brand accent (`#4f46e5`).
  - AuthContext and hook providing reactive session monitoring, role badges, and automatic cookie cleanup.
  - Reusable `apiClient` with automatic CSRF `X-Requested-With` header injection and credentials handling.
- Implemented public view routes:
  - `/`: Hero landing page with feature cards, search shortcuts, and verified employer guarantee.
  - `/jobs`: Comprehensive job discovery engine with multi-criteria sidebar (live keyword search, location, multi-select employment type, experience level, salary range overlap inputs, sort dropdown, pagination, loading skeletons, and empty states).
  - `/jobs/[id]`: Detailed role specs with compensation tags, verified employer profile, responsive "Apply Now" modal with PDF resume picker/uploader, and optimistic save/unsave toggling.
  - `/companies`: Directory of verified tech employers with location & industry tags.
  - `/companies/[id]`: Full company profile with direct open positions listings.
  - `/login`: Clean authenticated portal with validation and role-based redirecting (`JOB_SEEKER` -> `/dashboard`, `EMPLOYER` -> `/employer/dashboard`, `ADMIN` -> `/admin/dashboard`).
  - `/register`: Interactive candidate/employer tab toggle registration.
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 73 tests passed
  - `npm run build:frontend`: Production build generated cleanly

### Phase 10: Seeker dashboard
- Status: **COMPLETED**
- Implemented full candidate portal experience under `/dashboard`:
  - `/dashboard`: Candidate stats overview consuming `GET /api/v1/stats/job-seeker` (Total Applied, Active Pipeline, Shortlisted, Accepted Offers, Saved Count, status pill distribution, and recent applications).
  - `/dashboard/applications`: Live applicant tracker showing employer review status, linked PDF resume stream, and interactive withdrawal action for non-terminal applications (`PATCH /api/v1/applications/:id/withdraw`).
  - `/dashboard/saved-jobs`: Bookmarked positions dashboard with instant unsave toggle.
  - `/dashboard/profile`: Candidate profile editor with interactive technical skills tag manager, professional headline, bio, location, and dedicated PDF resume uploader.
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 73 tests passed across 7 test suites




### Phase 11: Employer dashboard
- Status: **COMPLETED**
- Implemented full employer recruiting suite under `/employer`:
  - `/employer/dashboard`: Employer metrics overview consuming `GET /api/v1/stats/employer` (active postings, total applicants, shortlisted count, pending reviews), company verification status banner, and quick actions.
  - `/employer/jobs`: Listings management table with live status pills (DRAFT, PUBLISHED, CLOSED), applicant counts, direct publish/close transitions (`PATCH /api/v1/jobs/:id`), and draft deletion (`DELETE /api/v1/jobs/:id`).
  - `/employer/jobs/new`: Comprehensive job creation form using React Hook Form and Zod validation (title, employment type, experience level, location, salary range with currency, application deadline, responsibilities, requirements).
  - `/employer/applications`: Interactive Kanban-style candidate pipeline board grouped by pipeline stage (`PENDING`, `REVIEWING`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`). Features real-time state machine transitions, inline candidate details, resume view links, and stage progression actions.
  - `/employer/company`: Company profile settings (name, description, industry, location, website, logo URL) and member management panel (invite new recruiters/owners via email, remove members with last-owner protection).
- Command validation:
  - `npm run typecheck`: Passed
  - `npm run lint`: Passed (0 warnings, 0 errors)
  - `npm test`: 73 tests passed across 7 test suites
  - `npm run build:frontend`: Production build generated 17 static & dynamic routes cleanly

### Phase 12: Admin dashboard
- Status: **COMPLETED**
- Implemented full platform governance portal under `/admin`:
  - `/admin/layout`: Superuser authentication guard, persistent status banner with active admin identity, and dedicated administrative navigation.
  - `/admin/dashboard`: Real-time system telemetry consuming `GET /api/v1/admin/stats` (total accounts, verified organizations, active job postings, application submissions, database round-trip latency) with breakdown panels by user role, job status, finite-state application pipeline, and a live read-only application audit stream (`GET /api/v1/admin/applications`).
  - `/admin/users`: User governance table with debounced search, role filter (`ADMIN`, `EMPLOYER`, `JOB_SEEKER`), status filter (`ACTIVE`, `SUSPENDED`), and one-click account suspension/reactivation (`PATCH /api/v1/admin/users/:id/status`) that terminates all active sessions for suspended users.
  - `/admin/companies`: Organization verification dashboard with search, verification filter, member/owner inspect, and instant verification toggles (`PATCH /api/v1/admin/companies/:id/verify`) allowing trusted employers to publish public listings.
  - `/admin/jobs`: Platform-wide job moderation table with debounced search, status filter, and moderate/restore actions (`PATCH /api/v1/admin/jobs/:id/moderate`) ensuring non-compliant posts are removed from public discovery.
- Command validation:
  - `npm run typecheck`: Passed cleanly across all workspaces
  - `npm run lint`: Passed with 0 errors and 0 warnings
  - `npm test`: 73 tests passed across 7 test suites (health, auth, companies, jobs, files, applications, admin)
  - `npm run build:frontend`: Production build generated 21 static & dynamic routes cleanly

### Phase 13: Backend tests complete
- Status: **COMPLETED**
- Completed and audited full backend test suite covering all modules and security requirements in Section 9:
  - `health.test.ts`: Service availability and database ping (1 test).
  - `auth.test.ts`: CSRF validation, register with strict role restrictions, duplicate email rejection, session cookie issuance (HttpOnly, SameSite=Lax), constant-time credential verification, login failure path masking, suspended account rejection, session invalidation on logout (13 tests).
  - `companies.test.ts`: Organization creation, member role assignment (OWNER, RECRUITER), last-owner protection rule against deletion and demotion, unverified company isolation, permission checks (12 tests).
  - `jobs.test.ts`: Public search engine, keyword search, experience level filters, salary range overlap matching, pagination meta, unverified company publishing block, 404 leak prevention for unpublished jobs, draft deletion vs blocked deletion when applications exist (15 tests).
  - `files.test.ts`: PDF upload validation, file extension check, magic bytes `%PDF` inspection, 5MB file size limit, authorized streaming permissions (owner, employer of applicant, admin), unauthorized download rejection (8 tests).
  - `applications.test.ts`: Finite state transitions (`PENDING -> REVIEWING -> SHORTLISTED -> ACCEPTED/REJECTED`), terminal state protection, duplicate apply prevention, past deadline rejection, seeker application withdrawal, saved jobs bookmarking and idempotent unsave (16 tests).
  - `admin.test.ts`: Platform stats telemetry, company verification granting job publishing permissions, job moderation hiding/restoring listings, user suspension terminating active sessions, read-only applications monitor (8 tests).
  - `users.test.ts`: Profile management (`GET/PATCH /users/me`), technical skills tag persistence, privilege escalation prevention (ignored role/status injections in request body), role-restricted stats endpoints (`/stats/job-seeker` and `/stats/employer`) (7 tests).
- Command validation:
  - `npm run typecheck`: Passed cleanly across all workspaces
  - `npm run lint`: Passed with 0 errors and 0 warnings
  - `npm test`: 80 tests passed across 8 test suites in ~3.2s

### Phase 14: Playwright E2E
- Status: **COMPLETED**
- Configured Playwright runner (`playwright.config.ts`) with dual webservers running Express API on port 5001 and Next.js production build on port 3000.
- Implemented and verified the two critical user journeys specified in Section 9:
  1. `seeker-journey.spec.ts`: Candidate registers as JOB_SEEKER -> navigates to `/dashboard` -> browses public catalog at `/jobs` -> searches by keyword -> navigates to job details -> submits application attaching PDF resume with valid magic bytes (`%PDF-1.4`) and cover letter -> verifies immediate state transition to `Applied (PENDING)` -> verifies application tracked in candidate dashboard at `/dashboard/applications`. Runs and passes in ~830ms.
  2. `employer-admin-journey.spec.ts`: Employer registers as EMPLOYER -> navigates to `/employer/company` and submits organization setup for an unverified company -> Admin logs in and visits `/admin/companies` -> Admin approves and grants verification -> Employer reloads, observes `Verified Employer` badge, posts a public job at `/employer/jobs/new` -> Candidate discovers and applies to the job -> Employer views `/employer/applications` Kanban pipeline -> Employer transitions application through `PENDING -> REVIEWING -> SHORTLISTED -> ACCEPTED` -> Seeker navigates to `/dashboard/applications` and confirms updated `ACCEPTED` offer status. Runs and passes in ~2.9s.
- Command validation:
  - `npm run test:e2e`: 2 tests passed (6.1s)
  - `npm test`: 80 backend tests passed (3.5s)
  - `npm run typecheck`: Passed cleanly across all workspaces
  - `npm run lint`: Passed with 0 errors and 0 warnings

### Phase 15: README, final audit & production verification
- Status: **COMPLETED**
- Authored production-grade `README.md` covering:
  - Architecture, monorepo layout, and exact pinned dependencies.
  - Complete features by user role (Candidate, Employer, Administrator).
  - Mermaid Entity-Relationship diagram (`erDiagram`) mapping all 8 models, foreign keys, cascades, and constraints.
  - Authentication & security deep dive: DB-backed opaque sessions, SHA-256 session token hashing, constant-time Argon2id failure path masking, CSRF protection via custom headers, SameSite=Lax cookie delivery, IDOR prevention, rate limiting.
  - Roles & permissions matrix covering all platform capabilities.
  - Finite-state machine diagrams for candidate application workflow and job publication lifecycle.
  - Full API endpoint reference table (/api/v1).
  - Storage architecture: `StorageProvider` interface, `%PDF` magic bytes inspection, 5MB limit, and guide for pluggable AWS S3 / Cloudflare R2 integration.
  - Setup, migrations, seed credentials, testing, and production deployment guidance.
  - Documented design decisions, known limitations, and future extensibility avenues.
- Final Gate verification:
  - `npm run typecheck --workspaces`: Passed (0 errors)
  - `npm run lint --workspaces`: Passed (0 errors, 0 warnings)
  - `npm test` (Vitest & Supertest): 80 tests passed across 8 test suites in 3.28s
  - `npm run test:e2e` (Playwright): 2 user journeys passed in 6.1s
  - `npm run build` (tsc backend + Next.js 21 static/dynamic pages): Production build passed cleanly

### Rebranding: Project Name Updated to Jobify
- Status: **COMPLETED**
- Rebranded application from HireHub to Jobify across the entire monorepo:
  - Updated monorepo package definitions: root `jobify`, backend `jobify-backend`, frontend `jobify-frontend`.
  - Updated Docker Compose container name to `jobify_postgres`, database volume to `jobify_pgdata`, and credentials to `jobify`/`jobify_secret`.
  - Re-provisioned PostgreSQL databases `jobify` (dev) and `jobify_test` (test) on port 5435.
  - Updated session cookie identifier to `jobify_session`.
  - Updated seed data, test accounts, and E2E fixtures to `@jobify.dev` domain (`admin@jobify.dev`, `alex.dev@jobify.dev`, etc.).
  - Updated public-facing frontend branding, page titles, footer, and navigation.
  - Rebuilt and verified all test suites and production builds:
    - `npm run typecheck`: Passed (0 errors)
    - `npm run lint`: Passed (0 errors, 0 warnings)
    - `npm test`: 80 backend tests passed (8 suites in 3.37s)
    - `npm run test:e2e`: 2 Playwright journeys passed in 6.1s
    - `npm run build`: Production builds passed cleanly













