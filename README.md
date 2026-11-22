# Jobify: Production-Grade Full-Stack Recruitment Platform

Jobify is a production-grade, multi-tenant recruitment and job application platform engineered with a strict security model, role-based access control (RBAC), database-backed server-side sessions, and a finite-state machine governing candidate application workflows. Built for job seekers, verified employers, and platform administrators.

---

## 1. Table of Contents
- [Architecture & Tech Stack](#2-architecture--tech-stack)
- [Key Features](#3-key-features)
- [Entity-Relationship Diagram](#4-entity-relationship-diagram)
- [Authentication & Security Architecture](#5-authentication--security-architecture)
- [Roles & Permissions Matrix](#6-roles--permissions-matrix)
- [Finite State Machine & Lifecycle Transitions](#7-finite-state-machine--lifecycle-transitions)
- [API Reference](#8-api-reference)
- [Storage Architecture & S3 Extensibility](#9-storage-architecture--s3-extensibility)
- [Environment Variables](#10-environment-variables)
- [Installation, Migration & Seeding](#11-installation-migration--seeding)
- [Seeded Demo Accounts](#12-seeded-demo-accounts)
- [Testing Suite (Vitest & Playwright E2E)](#13-testing-suite-vitest--playwright-e2e)
- [Production Build & Deployment](#14-production-build--deployment)
- [Known Limitations & Architecture Decisions](#15-known-limitations--architecture-decisions)

---

## 2. Architecture & Tech Stack

Jobify is organized as an `npm` workspace monorepo separating the Express API and Next.js frontend while sharing TypeScript configurations and end-to-end test fixtures:

```
jobify/
├── backend/                  # Node.js + Express + Prisma REST API
│   ├── prisma/               # Schema, migrations, and realistic seed data
│   ├── src/
│   │   ├── config/           # Zod-validated environment configurations
│   │   ├── middleware/       # Auth session guard, RBAC, CSRF, rate limiters
│   │   ├── modules/          # auth, users, companies, jobs, applications, saved-jobs, files, admin, stats
│   │   ├── utils/            # Prisma singleton, Argon2id hasher, errors, token hashing
│   │   ├── app.ts            # Express application setup, security middleware, and centralized error handler
│   │   └── server.ts         # Server bootstrap
│   ├── tests/                # Vitest & Supertest unit/integration test suites
│   └── uploads/              # Isolated local storage directory for uploaded resumes
├── frontend/                 # Next.js 15 (App Router) + React 19 + Tailwind CSS
│   ├── src/
│   │   ├── app/              # App router (public, seeker /dashboard, employer /employer, admin /admin)
│   │   ├── components/       # UI components (Navbar, Footer, JobCard, JobFilters, Providers)
│   │   ├── context/          # Client state contexts (TanStack Query, AuthContext)
│   │   ├── lib/              # API fetch client (auto-CSRF header & cookie proxying)
│   │   └── types/            # TypeScript contracts
├── tests/e2e/                # Playwright end-to-end browser test journeys
│   ├── fixtures/             # Authentic PDF fixtures with magic bytes (%PDF)
│   ├── seeker-journey.spec.ts
│   └── employer-admin-journey.spec.ts
├── docker-compose.yml        # Multi-database PostgreSQL 16 container (dev & isolated test DB)
├── playwright.config.ts      # Multi-server Playwright test configuration
└── PROGRESS.md               # Phased development audit log with exact test outputs
```

### Exact Pinned Dependencies
- **Frontend**: Next.js `15.1.7` (App Router), React `19.0.0`, Tailwind CSS `3.4.17`, TanStack Query `5.66.9`, React Hook Form `7.54.2`, Zod `3.24.2`, Lucide React `0.475.0`.
- **Backend**: Express `4.21.2`, Prisma ORM `6.4.1`, Argon2 `0.41.1`, Multer `1.4.5-lts.1`, Helmet `8.0.0`, CORS `2.8.5`, express-rate-limit `7.5.0`, cookie-parser `1.4.7`.
- **Database**: PostgreSQL `16-alpine` running on port `5435` with dedicated development (`jobify`) and test (`jobify_test`) databases.
- **Testing**: Vitest `3.0.7`, Supertest `7.0.0`, Playwright `1.50.1`.

---

## 3. Key Features

### Job Seekers (Candidates)
- **Role Registration & Auth**: Register securely with instant server-side session cookie issuance (`jobify_session`).
- **Discovery Engine**: Case-insensitive search across job titles, company names, and locations; filter by employment type, experience level, and continuous salary range overlap; sort by publication date or salary.
- **Job Details & Application Flow**: View comprehensive role responsibilities and requirements; apply with an uploaded PDF resume and optional custom cover note; duplicate applications prevented at database level.
- **Candidate Portal (`/dashboard`)**:
  - Live metric telemetry: Total applied, active in-review pipeline, shortlists, accepted offers, saved positions.
  - Interactive Applications tracker with real-time employer stage badges and seeker-initiated withdrawal for non-terminal applications.
  - Bookmarked positions manager with instant optimistic unsave.
  - Candidate profile management with interactive technical skills tag manager, headline, and bio.

### Employers & Hiring Teams
- **Organization Setup & Verification**: Register new organizations or manage existing company profiles (name, description, industry, location, website, logo URL).
- **Team Governance**: Role separation between `OWNER` and `RECRUITER` with last-owner protection (prevents deletion or demotion of an organization's sole owner).
- **Job Publishing Gated by Verification**: Unverified organizations can author and edit `DRAFT` listings; only verified companies can transition jobs to `PUBLISHED`. Deleting a job with active candidate submissions is blocked.
- **Interactive Kanban Pipeline (`/employer/applications`)**: Visual columns tracking `New Applications` (`PENDING`), `Under Review` (`REVIEWING`), `Shortlisted` (`SHORTLISTED`), `Accepted / Hired` (`ACCEPTED`), and `Declined` (`REJECTED`) with one-click finite-state stage transitions and direct PDF resume inspection.
- **Employer Telemetry (`/employer/dashboard`)**: Active postings count, total applicant volume, pending reviews, and shortlisted totals.

### System Administrators (`SUPERUSER`)
- **System Telemetry (`/admin/dashboard`)**: Platform-wide metrics, user role distribution, job status distribution, application status pipeline, PostgreSQL round-trip latency, and a live read-only application audit stream.
- **User Governance (`/admin/users`)**: Search, filter by role and status, and execute instant account suspensions (`PATCH /api/v1/admin/users/:id/status`) that instantly invalidate all active database sessions for compromised accounts.
- **Organization Verification (`/admin/companies`)**: Review organization profiles, inspect member rosters, and grant/revoke official verified standing (`PATCH /api/v1/admin/companies/:id/verify`).
- **Content Moderation (`/admin/jobs`)**: Moderate and remove non-compliant, fraudulent, or spam job postings (`PATCH /api/v1/admin/jobs/:id/moderate`), instantly hiding them from public search results.

---

## 4. Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : "has many"
    User ||--o| JobSeekerProfile : "has one"
    User ||--o{ CompanyMember : "belongs to"
    User ||--o{ Application : "submits"
    User ||--o{ SavedJob : "saves"
    User ||--o{ StoredFile : "owns"

    Company ||--o{ CompanyMember : "has members"
    Company ||--o{ Job : "posts"
    Company ||--o| StoredFile : "logo file"

    Job ||--o{ Application : "receives"
    Job ||--o{ SavedJob : "bookmarked by"

    StoredFile ||--o{ Application : "resume attachment"
    StoredFile ||--o| JobSeekerProfile : "default resume"

    User {
        uuid id PK
        string email UK
        string passwordHash
        Role role "ADMIN | EMPLOYER | JOB_SEEKER"
        UserStatus status "ACTIVE | SUSPENDED"
        datetime createdAt
        datetime updatedAt
    }

    Session {
        uuid id PK
        string sessionTokenHash UK
        uuid userId FK
        datetime expiresAt
        datetime lastActiveAt
        datetime createdAt
    }

    JobSeekerProfile {
        uuid id PK
        uuid userId FK, UK
        string headline
        string bio
        string[] skills
        string location
        uuid defaultResumeFileId FK
        datetime createdAt
        datetime updatedAt
    }

    Company {
        uuid id PK
        string name
        string slug UK
        string description
        string website
        string industry
        string location
        string logoUrl
        uuid logoFileId FK
        boolean verified
        datetime createdAt
        datetime updatedAt
    }

    CompanyMember {
        uuid id PK
        uuid userId FK
        uuid companyId FK
        CompanyMemberRole role "OWNER | RECRUITER"
        datetime createdAt
        datetime updatedAt
    }

    Job {
        uuid id PK
        uuid companyId FK
        string title
        string description
        string requirements
        string responsibilities
        string location
        EmploymentType employmentType
        ExperienceLevel experienceLevel
        decimal salaryMin
        decimal salaryMax
        string salaryCurrency
        JobStatus status "DRAFT | PUBLISHED | CLOSED | REMOVED"
        datetime publishedAt
        datetime applicationDeadline
        datetime createdAt
        datetime updatedAt
    }

    Application {
        uuid id PK
        uuid jobId FK
        uuid applicantId FK
        uuid resumeFileId FK
        string coverLetter
        ApplicationStatus status "PENDING | REVIEWING | SHORTLISTED | REJECTED | ACCEPTED | WITHDRAWN"
        datetime createdAt
        datetime updatedAt
    }

    SavedJob {
        uuid id PK
        uuid userId FK
        uuid jobId FK
        datetime createdAt
    }

    StoredFile {
        uuid id PK
        uuid ownerId FK
        string storageKey UK
        string originalName
        string mimeType
        int sizeBytes
        FilePurpose purpose "RESUME | COMPANY_LOGO | OTHER"
        datetime createdAt
    }
```

---

## 5. Authentication & Security Architecture

Jobify enforces defense-in-depth security at both network, middleware, and database boundaries:

1. **Database-Backed Opaque Sessions**:
   - Authentication does NOT use stateless JWTs. Instead, login issues an opaque, cryptographically random 256-bit token delivered via an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie named `jobify_session`.
   - The database stores only a one-way `SHA-256` hash of this token (`sessionTokenHash`).
   - Sessions carry an absolute expiration (`7 days`) and an idle timeout (`24 hours`). Each authenticated interaction refreshes `lastActiveAt`.
   - Logging in rotates the session ID to prevent session fixation.
   - Logging out deletes the session record from PostgreSQL.
   - Suspending an account or changing passwords deletes all active sessions for that user.

2. **Constant-Time Password Verification**:
   - Passwords are hashed using **Argon2id** (`argon2.hash(password, { type: argon2.argon2id })`).
   - To mitigate user enumeration and timing attacks, login uses a constant-time path: if an email is not found, the server computes a dummy Argon2id hash against a pre-computed hash before returning a generic `401 Invalid email or password`.

3. **CSRF Protection via Custom Request Headers**:
   - `SameSite=Lax` cookies provide primary protection against cross-site request forgery.
   - For all state-changing HTTP requests (`POST`, `PUT`, `PATCH`, `DELETE`), backend middleware (`csrfProtection`) requires the custom header `X-Requested-With: XMLHttpRequest`.
   - Because cross-origin HTML `<form>` submissions cannot attach custom headers without CORS preflight approval, CSRF attacks are blocked.

4. **Same-Site Proxying via Next.js Rewrites**:
   - `frontend/next.config.ts` proxies `/api/:path*` to `http://localhost:5001/api/:path*`.
   - The browser communicates with the frontend host on port 3000, treating all session cookies as first-party and avoiding cross-origin cookie restrictions in modern browsers.

5. **Rate Limiting**:
   - `express-rate-limit` enforces strict IP-based windows on sensitive endpoints:
     - Login: 10 attempts per 15 minutes.
     - Registration: 5 registrations per hour.
     - Applications: 30 applies per hour.
     - File Uploads: 20 uploads per hour.

6. **IDOR & Ownership Verification**:
   - Authorization checks are not left to URL parameters. Every service method verifies that the authenticated user owns the resource or has explicit company membership (`OWNER` or `RECRUITER`) before mutating jobs, companies, applications, or streaming files.

---

## 6. Roles & Permissions Matrix

| Capability | Anonymous | Job Seeker | Recruiter | Company Owner | System Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| Browse & Search Published Jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Company Public Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register Account | ✅ | ✅ (Candidate) | ✅ (Employer) | ✅ (Employer) | ❌ (Seed Only) |
| Apply to Published Job | ❌ | ✅ | ❌ | ❌ | ❌ |
| Withdraw Application | ❌ | ✅ (Own, non-terminal) | ❌ | ❌ | ❌ |
| Bookmark / Save Jobs | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage Seeker Profile & Resume | ❌ | ✅ | ❌ | ❌ | ❌ |
| Upload Resume (PDF <= 5MB) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Download Candidate Resume | ❌ | ✅ (Own) | ✅ (Applied to org) | ✅ (Applied to org) | ✅ |
| Create / Edit Draft Jobs | ❌ | ❌ | ✅ | ✅ | ✅ |
| Publish Jobs (Verified Org Only) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete Job (Zero applications only)| ❌ | ❌ | ✅ | ✅ | ✅ |
| Advance Applicant Status (Kanban) | ❌ | ❌ | ✅ | ✅ | ❌ (Read-only monitor) |
| Invite Recruiter / Owner to Org | ❌ | ❌ | ❌ | ✅ | ✅ |
| Remove Member (Last-Owner Guard)| ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Company Settings & Logo | ❌ | ❌ | ❌ | ✅ | ✅ |
| Verify / Unverify Organization | ❌ | ❌ | ❌ | ❌ | ✅ |
| Suspend / Reactivate User | ❌ | ❌ | ❌ | ❌ | ✅ |
| Moderate / Remove Job Listing | ❌ | ❌ | ❌ | ❌ | ✅ |
| Access Platform Telemetry / Stats | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 7. Finite State Machine & Lifecycle Transitions

### Application Lifecycle State Machine

Candidate applications follow a strict directed acyclic graph. Arbitrary status skipping is blocked by the backend service:

```mermaid
stateDiagram-v2
    [*] --> PENDING : Seeker Applies
    
    PENDING --> REVIEWING : Employer Reviews
    PENDING --> REJECTED : Employer Declines
    PENDING --> WITHDRAWN : Seeker Withdraws
    
    REVIEWING --> SHORTLISTED : Employer Shortlists
    REVIEWING --> REJECTED : Employer Declines
    REVIEWING --> WITHDRAWN : Seeker Withdraws
    
    SHORTLISTED --> ACCEPTED : Employer Extends Offer
    SHORTLISTED --> REJECTED : Employer Declines
    SHORTLISTED --> WITHDRAWN : Seeker Withdraws
    
    ACCEPTED --> [*] : Terminal State
    REJECTED --> [*] : Terminal State
    WITHDRAWN --> [*] : Terminal State
```

**State Transition Rules**:
- Employers cannot set `WITHDRAWN`.
- Applicants may only withdraw from non-terminal states (`PENDING`, `REVIEWING`, `SHORTLISTED`).
- Terminal states (`ACCEPTED`, `REJECTED`, `WITHDRAWN`) cannot be altered by either party.

### Job Listing Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employer Creates
    DRAFT --> PUBLISHED : Verified Employer Publishes
    PUBLISHED --> CLOSED : Employer Closes
    CLOSED --> PUBLISHED : Employer Reopens
    
    DRAFT --> [*] : Hard Delete (0 Apps Only)
    PUBLISHED --> REMOVED : Admin Moderates
    REMOVED --> PUBLISHED : Admin Restores
    CLOSED --> [*] : Retained for Historical Records
```

- Unverified organizations cannot publish (`403 UNVERIFIED_COMPANY`).
- Deleting a job with existing applications is prohibited (`400 CANNOT_DELETE_JOB_WITH_APPLICATIONS`); employers must set status to `CLOSED` instead.
- Unpublished jobs return `404 Not Found` to public anonymous visitors and non-member seekers, preventing existence leaks.

---

## 8. API Reference

All API routes are prefixed with `/api/v1` and return uniform envelopes:
- **Success**: `{ "data": T, "meta"?: { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }`
- **Error**: `{ "error": { "code": "ERROR_CODE", "message": "Human readable description", "details"?: [] } }`

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| **POST** | `/auth/register` | Public | Register seeker or employer account |
| **POST** | `/auth/login` | Public | Authenticate and issue session cookie |
| **POST** | `/auth/logout` | Authenticated | Invalidate active session and clear cookie |
| **GET** | `/auth/me` | Authenticated | Fetch active user, profile, and company memberships |
| **POST** | `/auth/change-password` | Authenticated | Change password; invalidates all other active sessions |
| **GET** | `/users/me` | Authenticated | Fetch user profile and resume details |
| **PATCH** | `/users/me` | Authenticated | Update candidate headline, bio, skills, location |
| **POST** | `/files/resume` | Seeker | Upload PDF resume (validated with magic bytes) |
| **GET** | `/files/:id` | Authorized | Stream file (owner, applicant's employer, or admin) |
| **POST** | `/companies` | Employer / Admin | Register new organization |
| **GET** | `/companies` | Public | List verified companies with search & filters |
| **GET** | `/companies/:id` | Public | Get company profile and public jobs |
| **PATCH** | `/companies/:id` | Company Owner | Update company profile details |
| **GET** | `/companies/:id/members` | Company Member | List organization members |
| **POST** | `/companies/:id/members` | Company Owner | Invite recruiter or owner to organization |
| **DELETE** | `/companies/:id/members/:memberId` | Company Owner | Remove member (guarded by last-owner rule) |
| **GET** | `/jobs` | Public | Search published jobs (keyword, salary overlap, level) |
| **GET** | `/jobs/:id` | Public / Member | Get job details (404 leak protection for drafts) |
| **POST** | `/jobs` | Company Member | Create job (DRAFT or PUBLISHED if verified) |
| **PATCH** | `/jobs/:id` | Company Member | Update job details or status (PUBLISHED, CLOSED) |
| **DELETE** | `/jobs/:id` | Company Member | Delete draft job (blocked if applications exist) |
| **GET** | `/employer/jobs` | Company Member | List all company jobs (drafts, published, counts) |
| **POST** | `/jobs/:jobId/apply` | Seeker | Submit application with PDF resume & cover letter |
| **GET** | `/applications/my` | Seeker | List authenticated seeker's applications |
| **GET** | `/applications/:id` | Authorized | View application details (applicant, employer, admin) |
| **PATCH** | `/applications/:id/withdraw` | Seeker | Withdraw application (PENDING, REVIEWING, SHORTLISTED) |
| **GET** | `/employer/applications` | Employer | Kanban query: list applicants grouped by status |
| **PATCH** | `/employer/applications/:id/status` | Employer | Transition candidate status in pipeline |
| **POST** | `/saved-jobs` | Seeker | Bookmark a published job |
| **GET** | `/saved-jobs` | Seeker | List bookmarked jobs |
| **DELETE** | `/saved-jobs/:jobId` | Seeker | Unbookmark job |
| **GET** | `/stats/job-seeker` | Seeker | Seeker metrics (applied, active, shortlist, offers) |
| **GET** | `/stats/employer` | Employer | Employer metrics (jobs, applicants, pending reviews) |
| **GET** | `/admin/stats` | Admin | Platform telemetry & database round-trip latency |
| **GET** | `/admin/users` | Admin | List accounts with role/status filters & search |
| **PATCH** | `/admin/users/:id/status` | Admin | Suspend or reactivate user (kills active sessions) |
| **GET** | `/admin/companies` | Admin | List organizations with verification filters |
| **PATCH** | `/admin/companies/:id/verify` | Admin | Grant or revoke official company verification |
| **GET** | `/admin/jobs` | Admin | Global job list across all organizations |
| **PATCH** | `/admin/jobs/:id/moderate` | Admin | Moderate job (status REMOVED or restored) |
| **GET** | `/admin/applications` | Admin | Read-only superuser application audit stream |

---

## 9. Storage Architecture & S3 Extensibility

File uploads are abstracted through the `StorageProvider` interface (`backend/src/modules/files/storage/storage.interface.ts`):

```typescript
export interface StorageProvider {
  saveFile(file: Express.Multer.File, storageKey: string): Promise<string>;
  getFileStream(storageKey: string): Promise<NodeJS.ReadableStream>;
  deleteFile(storageKey: string): Promise<void>;
}
```

### Security Validations on Upload
1. **Magic Bytes Validation**: The file stream header is inspected for `%PDF` (`0x25 0x50 0x44 0x46`). Spoofed extensions (e.g. `payload.exe` renamed to `resume.pdf`) are rejected with `422 INVALID_FILE_TYPE`.
2. **File Size Limit**: Multer strictly rejects buffers exceeding 5MB (`5,242,880 bytes`).
3. **Storage Isolation**: Stored files reside outside the public HTTP root in `backend/uploads/` with randomly generated UUID keys (`${uuidv4()}.pdf`), preventing path traversal and direct URL execution.
4. **Authorized Streaming**: Files are served exclusively through `GET /api/v1/files/:id` with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`. Only the file owner, an employer reviewing an application that references that file, or a platform administrator can stream the file.

### Adding an S3-Compatible Storage Provider
To switch from `LocalStorageProvider` to AWS S3, Cloudflare R2, or Google Cloud Storage:
1. Implement `StorageProvider` using `@aws-sdk/client-s3`:
   - `saveFile`: Send `PutObjectCommand` with server-side encryption.
   - `getFileStream`: Send `GetObjectCommand` and return the response body stream.
   - `deleteFile`: Send `DeleteObjectCommand`.
2. Set `STORAGE_DRIVER=s3` in `backend/.env`.
3. In `backend/src/modules/files/files.service.ts`, instantiate `S3StorageProvider` when `env.STORAGE_DRIVER === 's3'`.

---

## 10. Environment Variables

### Root Configuration (`.env`)
```bash
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://jobify:jobify_secret@localhost:5435/jobify?schema=public
TEST_DATABASE_URL=postgresql://jobify:jobify_secret@localhost:5435/jobify_test?schema=public
CLIENT_ORIGIN=http://localhost:3000
SESSION_SECRET=jobify_super_secret_session_key_32chars_min!
CSRF_HEADER_NAME=X-Requested-With
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_BYTES=5242880
POSTGRES_USER=jobify
POSTGRES_PASSWORD=jobify_secret
POSTGRES_DB=jobify
POSTGRES_PORT=5435
```

### Frontend Configuration (`frontend/.env.local`)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_INTERNAL_URL=http://localhost:5001
```

---

## 11. Installation, Migration & Seeding

### Prerequisites
- Node.js `20.x` LTS or later
- Docker & Docker Compose

### 1. Clone & Scaffold
```bash
git clone https://github.com/shresthkumar/jobify.git
cd jobify
npm install
```

### 2. Start PostgreSQL via Docker Compose
```bash
# Starts PostgreSQL 16 on port 5435 with both dev (jobify) and test (jobify_test) databases
npm run db:up
```

### 3. Run Prisma Migrations & Seed Data
```bash
# Apply schema migrations to development database
npm run db:migrate

# Seed development database with administrators, companies, jobs, and applicants
npm run db:seed

# Also seed test database for isolated Vitest runs
DATABASE_URL="postgresql://jobify:jobify_secret@localhost:5435/jobify_test?schema=public" npm run prisma:seed --workspace=backend
```

### 4. Run Both Applications in Development
```bash
npm run dev
# Backend starts on http://localhost:5001
# Frontend starts on http://localhost:3000
```

---

## 12. Seeded Demo Accounts

All seeded passwords are set up with authentic Argon2id hashes:

| Role | Email | Password | Context |
|:---|:---|:---|:---|
| **System Admin** | `admin@jobify.dev` | `AdminPass123!` | Platform Superuser (Access to `/admin`) |
| **Employer (Owner)** | `sarah.owner@techflow.example.com` | `EmployerPass123!` | TechFlow Solutions (`verified: true`) |
| **Employer (Recruiter)** | `dave.recruiter@techflow.example.com` | `EmployerPass123!` | TechFlow Solutions (Recruiter permissions) |
| **Employer (Owner)** | `elena.owner@acmecloud.example.com` | `EmployerPass123!` | Acme Cloud Systems (`verified: true`) |
| **Employer (Unverified)**| `marcus.owner@stealthai.example.com` | `EmployerPass123!` | StealthAI Corp (`verified: false` - Drafts only) |
| **Job Seeker** | `alex.dev@jobify.dev` | `SeekerPass123!` | Senior Staff Candidate with active applications |
| **Job Seeker** | `maya.designer@jobify.dev` | `SeekerPass123!` | Product Designer candidate with saved jobs |
| **Job Seeker** | `jordan.cloud@jobify.dev` | `SeekerPass123!` | Cloud Architect candidate |
| **Job Seeker** | `claire.junior@jobify.dev` | `SeekerPass123!` | Junior Developer candidate |
| **Suspended Seeker** | `sam.suspended@jobify.dev` | `SeekerPass123!` | Suspended user (Login blocked with 403) |

---

## 13. Testing Suite (Vitest & Playwright E2E)

### Backend Tests (Vitest & Supertest)
Backend integration tests run against the isolated `jobify_test` database. Tests strictly refuse to execute if `DATABASE_URL` does not point to a database containing `test` in its name.

```bash
# Run all 80 backend integration tests
npm test
```

**Coverage Breakdown**:
- `tests/health.test.ts`: Service availability and database ping (1 test).
- `tests/auth.test.ts`: CSRF check, registration restrictions, session issuance, constant-time failure masking, suspended account rejection, logout invalidation (13 tests).
- `tests/companies.test.ts`: Organization creation, member roles (`OWNER`/`RECRUITER`), unverified company isolation, last-owner protection (12 tests).
- `tests/jobs.test.ts`: Keyword search, salary range overlap, level filters, unverified company publishing block, 404 leak protection, draft deletion vs blocked deletion when applications exist (15 tests).
- `tests/files.test.ts`: PDF magic bytes validation, oversize rejection, authorized streaming permissions (8 tests).
- `tests/applications.test.ts`: State machine transitions, terminal state immutability, duplicate apply prevention, applicant withdrawal, saved jobs bookmarking (16 tests).
- `tests/admin.test.ts`: Platform stats, company verification, job moderation, user suspension killing active sessions, read-only monitor (8 tests).
- `tests/users.test.ts`: Profile management (`GET/PATCH /users/me`), technical skills persistence, privilege escalation prevention (7 tests).

### End-to-End Tests (Playwright)
Playwright spins up both the backend API and Next.js frontend production servers automatically and drives Chromium through complete multi-role user journeys:

```bash
# Run Playwright E2E suite
npm run test:e2e
```

1. **Journey 1 (`tests/e2e/seeker-journey.spec.ts`)**:
   - Seeker registers as `JOB_SEEKER`.
   - Navigates to `/jobs`, searches by keyword, views job details.
   - Uploads PDF resume (`sample_resume.pdf`), submits application with custom cover note.
   - Verifies instant status transition to `Applied (PENDING)`.
   - Verifies the application is tracked under `/dashboard/applications`.

2. **Journey 2 (`tests/e2e/employer-admin-journey.spec.ts`)**:
   - Employer registers and creates a new company profile at `/employer/company`.
   - Company is initially marked `Verification Pending`.
   - Administrator logs in at `/login`, visits `/admin/companies`, and grants verification.
   - Employer reloads, observes `Verified Employer` badge, and publishes a new job at `/employer/jobs/new`.
   - Candidate discovers the job and applies.
   - Employer navigates to `/employer/applications` (Kanban board) and transitions candidate:
     `PENDING -> REVIEWING -> SHORTLISTED -> ACCEPTED`.
   - Candidate visits `/dashboard/applications` and confirms updated `ACCEPTED` offer status.

---

## 14. Production Build & Deployment

### Production Verification Gate
```bash
# Verify TypeScript compilation across all workspaces
npm run typecheck

# Verify ESLint code standards
npm run lint

# Execute all backend tests
npm test

# Execute all Playwright E2E tests
npm run test:e2e

# Compile production bundles
npm run build
```

### Production Execution
```bash
# Start backend production server
npm run start --workspace=backend

# Start Next.js production server
npm run start --workspace=frontend
```

### Reverse Proxy & Deployment Strategy
In production environments (e.g. AWS ECS, Google Cloud Run, or Kubernetes):
1. **Frontend**: Deploy Next.js as a container or edge deployment on Vercel / Cloudflare Pages.
2. **Backend**: Run Express behind an Nginx reverse proxy or Application Load Balancer (ALB) terminating TLS.
3. **Database**: Managed PostgreSQL (AWS RDS or Google Cloud SQL) with connection pooling enabled.
4. **Storage**: Configure `STORAGE_DRIVER=s3` pointing to AWS S3 or Cloudflare R2 bucket.
5. **Cookie Security**: Set `NODE_ENV=production` so the session cookie automatically receives the `Secure` attribute.

---

## 15. Known Limitations & Architecture Decisions

1. **Database-Backed Sessions vs Redis**:
   - *Decision*: Storing hashed session tokens in PostgreSQL satisfies the requirement for zero external state store dependencies while allowing atomic cascading deletes when users or companies are removed.
   - *Tradeoff*: High concurrency (millions of active sessions) would benefit from Redis session caching; however, indexed PostgreSQL lookups on `sessionTokenHash` execute in `<1ms` for standard platform scale.

2. **Full-Text Search**:
   - *Decision*: Case-insensitive `contains` matching via Prisma ORM ensures broad compatibility across SQLite, PostgreSQL, and mock test harnesses without requiring PostgreSQL-specific extensions during testing.
   - *Extensibility*: In high-volume production deployments, enable `pg_trgm` (trigram indexes) or integrate Elasticsearch / Algolia via an event hook on `Job` creation and update.

3. **In-App Notifications**:
   - *Current State*: Candidates view real-time application status updates when visiting `/dashboard/applications`.
   - *Next Steps*: Integrate transactional email services (Resend or SendGrid) to notify candidates automatically when their application advances to `SHORTLISTED` or `ACCEPTED`.
