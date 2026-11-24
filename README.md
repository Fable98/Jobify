# Jobify: Production-Grade Full-Stack Recruitment Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1_App_Router-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Alpine-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7.0_Cache_Aside-DC382D.svg)](https://redis.io/)
[![Vitest](https://img.shields.io/badge/Vitest-84_Tests_Passing-6E9F18.svg)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-2EAD33.svg)](https://playwright.dev/)

**Jobify** is a production-grade, multi-tenant recruitment and career application platform engineered with a strict security model, role-based access control (RBAC), database-backed server-side sessions with distributed Redis cache-aside, cloud object storage (S3/R2/Local), transactional lifecycle notifications, and a finite-state machine governing candidate application workflows. Built for job seekers, verified employers, and platform administrators.

---

## 1. Table of Contents
- [Architecture & Tech Stack](#2-architecture--tech-stack)
- [Design System & Frontend UX](#3-design-system--frontend-ux)
- [Key Features](#4-key-features)
- [Entity-Relationship Diagram](#5-entity-relationship-diagram)
- [Authentication & Security Architecture](#6-authentication--security-architecture)
- [Roles & Permissions Matrix](#7-roles--permissions-matrix)
- [Finite State Machine & Lifecycle Transitions](#8-finite-state-machine--lifecycle-transitions)
- [API Reference](#9-api-reference)
- [Storage Architecture & S3/R2 Object Storage](#10-storage-architecture--s3r2-object-storage)
- [Distributed Caching, Logging & Notifications](#11-distributed-caching-logging--notifications)
- [Environment Variables](#12-environment-variables)
- [Installation, Migration & Seeding](#13-installation-migration--seeding)
- [Seeded Demo Accounts](#14-seeded-demo-accounts)
- [Testing Suite (Vitest & Playwright E2E)](#15-testing-suite-vitest--playwright-e2e)
- [Production Build & Deployment](#16-production-build--deployment)
- [Architectural Suggestions & Future Roadmap](#17-architectural-suggestions--future-roadmap)

---

## 2. Architecture & Tech Stack

Jobify is organized as an `npm` workspace monorepo separating the Express REST API and Next.js frontend while sharing TypeScript configurations and end-to-end test fixtures:

```
jobify/
├── backend/                  # Node.js + Express + Prisma REST API
│   ├── prisma/               # Schema, migrations, and realistic seed data
│   ├── src/
│   │   ├── config/           # Zod-validated environment configurations (env.ts)
│   │   ├── middleware/       # Auth session guard, RBAC, CSRF, rate limiters, error handler
│   │   ├── modules/          # auth, users, companies, jobs, applications, saved-jobs, files, admin, stats, email
│   │   ├── utils/            # Prisma singleton, Argon2id hasher, errors, token hashing, logger (Pino), redis
│   │   ├── app.ts            # Express app, security middleware, request tracing, and error handler
│   │   └── server.ts         # Server bootstrap
│   ├── tests/                # Vitest & Supertest unit/integration test suites (84 tests)
│   └── uploads/              # Local storage fallback directory for uploaded PDF resumes
├── frontend/                 # Next.js 15 (App Router) + React 19 + Tailwind CSS
│   ├── src/
│   │   ├── app/              # App router (public, seeker /dashboard, employer /employer, admin /admin)
│   │   ├── components/       # Soft-UI tactile components (Navbar, Footer, JobCard, JobFilters, Modals)
│   │   ├── context/          # Client state contexts (TanStack Query, AuthContext)
│   │   ├── lib/              # API fetch client (auto-CSRF header & cookie proxying)
│   │   └── types/            # TypeScript data contracts
│   └── tailwind.config.ts    # Soft clay palette, mint accents, multi-level elevations
├── Docs/
│   └── suggestion.md         # Production readiness audit, architectural blueprints, feature roadmap
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
- **Backend**: Express `4.21.2`, Prisma ORM `6.4.1`, Argon2 `0.41.1`, Multer `1.4.5-lts.1`, Helmet `8.0.0`, CORS `2.8.5`, express-rate-limit `7.5.0`, cookie-parser `1.4.7`, `@aws-sdk/client-s3` `^3.1175.0`, `@aws-sdk/s3-request-presigner` `^3.1175.0`, `ioredis` `^6.1.0`, `pino` `^10.4.0`, `pino-http` `^11.0.0`.
- **Database**: PostgreSQL `16-alpine` running on port `5435` with dedicated development (`jobify`) and test (`jobify_test`) databases.
- **Testing**: Vitest `3.0.7`, Supertest `7.0.0`, Playwright `1.50.1`.

---

## 3. Design System & Frontend UX

Jobify features a soft porcelain clay/neumorphic design system inspired by modern tactile product UI styleguides:

- **Palette Tokens**:
  - **Surfaces**: Ultra-clean porcelain canvas (`#F7F8FA`) paired with pure white cards (`#FFFFFF`).
  - **Brand Accent**: Tactile Pastel Mint (`#9FE3C8`) with deep emerald text/interactive states (`#289E73`).
  - **Neutral Contours**: Subtle border dividers (`#E2E8F0` / `#EDF2F7`).
- **Multi-Level Tactile Elevations**:
  - `clay-1` through `clay-5`: Layered soft dropshadows providing tangible optical depth without harsh dark outlines.
  - `clay-inset`: Concave inner-shadowed input wells and recessed search pills.
  - `clay-btn`: Raised pill buttons with spring-physics active pressed depressions (`translate-y-[1px]`).
- **Components**:
  - **Floating Navbar**: Floating rounded-full porcelain capsule with mint logo mark and pill navigation tabs.
  - **Interactive Search Pill**: Recessed search bar with real-time multi-term keyword and location matching.
  - **Filter Chips**: Tactile toggle pills with checkmark indicators for instant role and seniority filtering.
  - **Kanban Board**: Drag-and-stage visual columns for hiring managers to advance candidates through the hiring pipeline.
  - **Accessibility**: WCAG AA contrast compliance, keyboard focus rings (`ring-2 ring-[#9FE3C8]`), and smooth transitions adhering to `prefers-reduced-motion`.

---

## 4. Key Features

### Job Seekers (Candidates)
- **Registration & Auth**: Instant session cookie issuance (`jobify_session`) with welcome email dispatch.
- **Discovery Engine**: Multi-term tokenized search across job titles, company names, locations, requirements, and responsibilities; continuous salary range overlap; filter by employment type and experience level; sort by publication date or salary.
- **Application Workflow**: View comprehensive role specs; apply with an uploaded PDF resume and custom cover note; duplicate submissions blocked at the database constraint level.
- **Candidate Portal (`/dashboard`)**:
  - Real-time telemetry: Applied count, active reviews, shortlists, offers, and bookmarked roles.
  - Applications tracker with live stage badges and candidate-initiated withdrawal for non-terminal applications.
  - Saved jobs manager with instant optimistic bookmark toggling.
  - Profile manager with technical skills tag manager, headline, bio, and default resume selection.
- **GDPR Compliance**: Instant self-service data export (`GET /api/v1/users/me/export`) bundling profile data, applications, and saved jobs in compliance with GDPR Article 20.

### Employers & Hiring Teams
- **Organization Setup & Verification**: Register company profiles (name, description, industry, location, website, logo).
- **Team Governance**: Role separation between `OWNER` and `RECRUITER` with last-owner protection (prevents deletion or demotion of an organization's sole owner).
- **Verification-Gated Publishing**: Unverified organizations can author `DRAFT` listings; only verified companies can transition jobs to `PUBLISHED`. Deleting a job with active candidate submissions is blocked.
- **Interactive Kanban Pipeline (`/employer/applications`)**: Visual columns tracking `New Applications` (`PENDING`), `Under Review` (`REVIEWING`), `Shortlisted` (`SHORTLISTED`), `Accepted / Hired` (`ACCEPTED`), and `Declined` (`REJECTED`) with one-click finite-state stage transitions and direct PDF resume inspection.
- **Instant Candidate Alerts**: Automatic transactional email alerts dispatched to recruiters whenever a candidate submits an application.

### System Administrators (`SUPERUSER`)
- **System Telemetry (`/admin/dashboard`)**: Platform-wide metrics, user role distribution, job status breakdown, application status pipeline, PostgreSQL latency ping, and a live read-only application audit stream.
- **User Governance (`/admin/users`)**: Search, filter by role/status, and execute instant account suspensions (`PATCH /api/v1/admin/users/:id/status`) that immediately invalidate all active database and Redis sessions.
- **Organization Verification (`/admin/companies`)**: Review organization profiles, inspect member rosters, and grant/revoke official verified standing (`PATCH /api/v1/admin/companies/:id/verify`).
- **Content Moderation (`/admin/jobs`)**: Moderate and remove non-compliant, fraudulent, or spam listings (`PATCH /api/v1/admin/jobs/:id/moderate`), instantly hiding them from public search results.

---

## 5. Entity-Relationship Diagram

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

## 6. Authentication & Security Architecture

Jobify enforces defense-in-depth security at both network, middleware, caching, and database boundaries:

1. **Database-Backed Sessions with Distributed Redis Cache-Aside**:
   - Authentication does NOT rely on stateless JWTs. Login issues an opaque, cryptographically random 256-bit token delivered via an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie named `jobify_session`.
   - The database stores a `SHA-256` hash of this token (`sessionTokenHash`).
   - **Redis Cache-Aside**: Active sessions are cached in Redis under `jobify:session:<hash>` with a 7-day TTL matching session expiration. Subsequent authenticated requests verify session state in `<1ms` without querying PostgreSQL.
   - Sessions carry an absolute expiration (`7 days`) and an idle timeout (`24 hours`).
   - Logging in rotates the session ID to prevent session fixation.
   - Logging out, changing passwords, or account suspension instantly evicts the session from both Redis and PostgreSQL.
   - If Redis is unconfigured or temporarily offline, the service automatically falls back to PostgreSQL without interrupting user traffic.

2. **Constant-Time Password Verification**:
   - Passwords are hashed using **Argon2id** (`argon2.hash(password, { type: argon2.argon2id })`).
   - To mitigate user enumeration and timing attacks, login uses a constant-time failure path: if an email is not found, the server computes a dummy Argon2id verification before returning a generic `401 Invalid email or password`.

3. **CSRF Protection via Custom Request Headers**:
   - `SameSite=Lax` cookies provide primary protection against cross-site request forgery.
   - For all state-changing HTTP requests (`POST`, `PUT`, `PATCH`, `DELETE`), backend middleware (`csrfProtection`) requires the custom header `X-Requested-With: XMLHttpRequest`.
   - Because cross-origin HTML `<form>` submissions cannot attach custom headers without CORS preflight approval, CSRF attacks are blocked.

4. **Same-Site Proxying via Next.js Rewrites**:
   - `frontend/next.config.ts` proxies `/api/:path*` to `http://localhost:5001/api/:path*`.
   - The browser communicates with the frontend host on port 3000, treating all session cookies as first-party and avoiding third-party cookie blocking.

5. **Rate Limiting**:
   - `express-rate-limit` enforces strict IP-based windows on sensitive endpoints:
     - Login: 10 attempts per 15 minutes.
     - Registration: 5 registrations per hour.
     - Applications: 30 applies per hour.
     - File Uploads: 20 uploads per hour.

6. **IDOR & Ownership Verification**:
   - Authorization checks are strictly enforced in the service layer. Every service method verifies that the authenticated user owns the resource or has explicit company membership (`OWNER` or `RECRUITER`) before mutating jobs, companies, applications, or downloading resumes.

---

## 7. Roles & Permissions Matrix

| Capability | Anonymous | Job Seeker | Recruiter | Company Owner | System Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| Browse & Search Published Jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Company Public Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register Account | ✅ | ✅ (Candidate) | ✅ (Employer) | ✅ (Employer) | ❌ (Seed Only) |
| Apply to Published Job | ❌ | ✅ | ❌ | ❌ | ❌ |
| Withdraw Application | ❌ | ✅ (Own, non-terminal) | ❌ | ❌ | ❌ |
| Bookmark / Save Jobs | ❌ | ✅ | ❌ | ❌ | ❌ |
| Export Personal Data (GDPR) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Upload Resume (PDF <= 5MB) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Download Candidate Resume / Presigned URL | ❌ | ✅ (Own) | ✅ (Applied to org) | ✅ (Applied to org) | ✅ |
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

## 8. Finite State Machine & Lifecycle Transitions

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

## 9. API Reference

All API routes are prefixed with `/api/v1` and return uniform envelopes:
- **Success**: `{ "data": T, "meta"?: { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }`
- **Error**: `{ "error": { "code": "ERROR_CODE", "message": "Human readable description", "details"?: [] } }`

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| **POST** | `/auth/register` | Public | Register seeker or employer account (triggers welcome email) |
| **POST** | `/auth/login` | Public | Authenticate, issue session cookie, and cache in Redis |
| **POST** | `/auth/logout` | Authenticated | Invalidate active session in DB & Redis, clear cookie |
| **GET** | `/auth/me` | Authenticated | Fetch active user, profile, and company memberships |
| **POST** | `/auth/change-password` | Authenticated | Change password; invalidates all other active sessions |
| **GET** | `/users/me` | Authenticated | Fetch user profile and resume details |
| **PATCH** | `/users/me` | Authenticated | Update candidate headline, bio, skills, location |
| **GET** | `/users/me/export` | Authenticated | **GDPR Article 20**: Export full user profile, applications & files |
| **POST** | `/files/resume` | Seeker | Upload PDF resume (validated with magic bytes) |
| **GET** | `/files/:id` | Authorized | Stream file (owner, applicant's employer, or admin) |
| **GET** | `/files/:id/url` | Authorized | Get 15-minute authorized presigned URL (S3/R2 direct download) |
| **DELETE** | `/files/:id` | Authorized | Delete uploaded file from storage and database |
| **POST** | `/companies` | Employer / Admin | Register new organization |
| **GET** | `/companies` | Public | List verified companies with search & filters |
| **GET** | `/companies/:id` | Public | Get company profile and public jobs |
| **PATCH** | `/companies/:id` | Company Owner | Update company profile details |
| **GET** | `/companies/:id/members` | Company Member | List organization members |
| **POST** | `/companies/:id/members` | Company Owner | Invite recruiter or owner to organization |
| **DELETE** | `/companies/:id/members/:memberId` | Company Owner | Remove member (guarded by last-owner rule) |
| **GET** | `/jobs` | Public | Multi-term tokenized search, continuous salary filter, level |
| **GET** | `/jobs/:id` | Public / Member | Get job details (404 leak protection for drafts) |
| **POST** | `/jobs` | Company Member | Create job (DRAFT or PUBLISHED if verified) |
| **PATCH** | `/jobs/:id` | Company Member | Update job details or status (PUBLISHED, CLOSED) |
| **DELETE** | `/jobs/:id` | Company Member | Delete draft job (blocked if applications exist) |
| **GET** | `/employer/jobs` | Company Member | List all company jobs (drafts, published, counts) |
| **POST** | `/jobs/:jobId/apply` | Seeker | Submit application; dispatches seeker receipt & employer alert |
| **GET** | `/applications/my` | Seeker | List authenticated seeker's applications |
| **GET** | `/applications/:id` | Authorized | View application details (applicant, employer, admin) |
| **PATCH** | `/applications/:id/withdraw` | Seeker | Withdraw application (PENDING, REVIEWING, SHORTLISTED) |
| **GET** | `/employer/applications` | Employer | Kanban query: list applicants grouped by status |
| **PATCH** | `/employer/applications/:id/status` | Employer | Transition candidate status; dispatches status update email |
| **POST** | `/saved-jobs` | Seeker | Bookmark a published job |
| **GET** | `/saved-jobs` | Seeker | List bookmarked jobs |
| **DELETE** | `/saved-jobs/:jobId` | Seeker | Unbookmark job |
| **GET** | `/stats/job-seeker` | Seeker | Seeker metrics (applied, active, shortlist, offers) |
| **GET** | `/stats/employer` | Employer | Employer metrics (jobs, applicants, pending reviews) |
| **GET** | `/admin/stats` | Admin | Platform telemetry & database round-trip latency |
| **GET** | `/admin/users` | Admin | List accounts with role/status filters & search |
| **PATCH** | `/admin/users/:id/status` | Admin | Suspend or reactivate user (kills active sessions in DB & Redis) |
| **GET** | `/admin/companies` | Admin | List organizations with verification filters |
| **PATCH** | `/admin/companies/:id/verify` | Admin | Grant or revoke official company verification |
| **GET** | `/admin/jobs` | Admin | Global job list across all organizations |
| **PATCH** | `/admin/jobs/:id/moderate` | Admin | Moderate job (status REMOVED or restored) |
| **GET** | `/admin/applications` | Admin | Read-only superuser application audit stream |

---

## 10. Storage Architecture & S3/R2 Object Storage

File storage is abstracted through the `StorageProvider` interface (`backend/src/modules/files/storage.ts`):

```typescript
export interface StorageProvider {
  save(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  stream(key: string): Promise<{ stream: NodeJS.ReadableStream; sizeBytes: number; mimeType: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>;
}
```

### Supported Storage Drivers
1. **`LocalStorageProvider`** (Default for local development):
   - Stores files outside the web root in `backend/uploads/` using randomized UUID keys (`${uuidv4()}.pdf`).
   - Streams files through authorized Express endpoints.
2. **`S3StorageProvider`** (Production ready for AWS S3, Cloudflare R2, MinIO, or Google Cloud Storage):
   - Implemented using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
   - Supports direct S3 streaming and short-lived presigned URLs (`GET /api/v1/files/:id/url`, 15-minute expiry).
   - Activated automatically by setting `STORAGE_DRIVER=s3` and configuring S3 credentials.

### Security Validations on Upload
1. **Magic Bytes Validation**: File buffers are checked for `%PDF` (`0x25 0x50 0x44 0x46`). Renamed binaries or disguised executables are rejected with `400 INVALID_FILE_SIGNATURE`.
2. **File Size Enforcement**: Uploads are restricted to 5MB (`5,242,880 bytes`).
3. **Authorized Download Checks**: Resumes can only be accessed by the candidate owner, a hiring manager reviewing an application linked to that resume, or a system admin.

---

## 11. Distributed Caching, Logging & Notifications

### 1. Distributed Redis Session Caching (Cache-Aside)
- High-traffic session queries (`SELECT * FROM "Session"`) are offloaded to Redis using a cache-aside pattern.
- Key format: `jobify:session:<tokenHash>` with automatic TTL expiration.
- Invalidation hooks: On logout, password reset, or account suspension, keys are immediately evicted from Redis.
- Failover: If Redis is offline or disabled via `ENABLE_REDIS=false`, queries automatically fall back to PostgreSQL.

### 2. Structured JSON Logging with Pino
- Production logs are rendered in high-performance structured JSON format with ISO timestamps and log levels.
- Development mode uses `pino-pretty` with colorized timestamps.
- **Request Tracing**: `X-Request-Id` headers are generated or propagated across all HTTP requests. Unhandled exceptions are logged through `logger.error` with error stacks and correlation IDs.

### 3. Transactional Email Service (Resend)
- Integrated `EmailService` supporting the **Resend API** with local development formatted log fallback.
- Dispatches transactional emails for:
  - **Account Welcome**: Sent upon candidate or employer registration.
  - **Application Confirmation**: Receipt sent to candidate upon submitting an application.
  - **Employer New Applicant Alert**: Alerts company recruiters when a candidate applies.
  - **Application Status Changes**: Updates candidates in real-time when moved to `REVIEWING`, `SHORTLISTED`, `ACCEPTED`, or `REJECTED`.

---

## 12. Environment Variables

### Root Configuration (`.env` / `backend/.env`)
```bash
# Database (PostgreSQL 16)
DATABASE_URL=postgresql://jobify:jobify_secret@localhost:5435/jobify?schema=public
TEST_DATABASE_URL=postgresql://jobify:jobify_secret@localhost:5435/jobify_test?schema=public
POSTGRES_USER=jobify
POSTGRES_PASSWORD=jobify_secret
POSTGRES_DB=jobify
POSTGRES_PORT=5435

# Backend Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# Security & Sessions
SESSION_SECRET=dev_session_secret_change_in_production_min32chars
CSRF_HEADER_NAME=X-Requested-With

# Storage Configuration (local or s3)
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_BYTES=5242880

# Cloud Object Storage (Required when STORAGE_DRIVER=s3)
# S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
# S3_REGION=us-east-1
# S3_BUCKET=jobify-resumes
# S3_ACCESS_KEY_ID=your-access-key-id
# S3_SECRET_ACCESS_KEY=your-secret-access-key
# S3_FORCE_PATH_STYLE=false

# Redis Distributed Cache & Sessions
REDIS_URL=redis://localhost:6379
ENABLE_REDIS=false

# Transactional Email (Resend)
# RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Jobify <notifications@jobify.dev>
```

### Frontend Configuration (`frontend/.env.local`)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_INTERNAL_URL=http://localhost:5001
```

---

## 13. Installation, Migration & Seeding

### Prerequisites
- Node.js `20.x` LTS or later
- Docker & Docker Compose

### 1. Clone & Scaffold
```bash
git clone https://github.com/Fable98/Jobify.git
cd Jobify
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

# Seed isolated test database for Vitest integration tests
DATABASE_URL="postgresql://jobify:jobify_secret@localhost:5435/jobify_test?schema=public" npm run prisma:seed --workspace=backend
```

### 4. Run Development Servers
```bash
npm run dev
# Backend API: http://localhost:5001
# Frontend UI: http://localhost:3000
```

---

## 14. Seeded Demo Accounts

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

## 15. Testing Suite (Vitest & Playwright E2E)

### Backend Tests (Vitest & Supertest)
Backend integration tests run against the isolated `jobify_test` database. Tests strictly refuse to execute if `DATABASE_URL` does not point to a database containing `test` in its name.

```bash
# Run all 84 backend integration tests across 8 test suites
npm test
```

**Coverage Breakdown (84 Passing Tests)**:
- `tests/health.test.ts`: Service availability and database ping (1 test).
- `tests/auth.test.ts`: CSRF check, registration restrictions, session issuance, constant-time failure masking, suspended account rejection, logout invalidation (13 tests).
- `tests/companies.test.ts`: Organization creation, member roles (`OWNER`/`RECRUITER`), unverified company isolation, last-owner protection (12 tests).
- `tests/jobs.test.ts`: Multi-term search, salary range overlap, level filters, unverified company publishing block, 404 leak protection, draft deletion vs blocked deletion when applications exist (15 tests).
- `tests/files.test.ts`: PDF magic bytes validation, oversize rejection, authorized streaming permissions, presigned download URL generation (10 tests).
- `tests/applications.test.ts`: State machine transitions, terminal state immutability, duplicate apply prevention, applicant withdrawal, saved jobs bookmarking (16 tests).
- `tests/admin.test.ts`: Platform stats, company verification, job moderation, user suspension killing active sessions, read-only monitor (8 tests).
- `tests/users.test.ts`: Profile management (`GET/PATCH /users/me`), technical skills persistence, privilege escalation prevention, GDPR Article 20 data export (9 tests).

### End-to-End Tests (Playwright)
Playwright spins up both backend and frontend servers and drives Chromium through complete multi-role user journeys:

```bash
# Run Playwright E2E suite
npm run test:e2e
```

1. **Journey 1 (`tests/e2e/seeker-journey.spec.ts`)**:
   - Candidate registers as `JOB_SEEKER`.
   - Searches jobs, selects role, uploads PDF resume, and submits application.
   - Verifies instant status transition to `Applied (PENDING)` in `/dashboard/applications`.

2. **Journey 2 (`tests/e2e/employer-admin-journey.spec.ts`)**:
   - Employer registers and creates company profile.
   - Admin grants verification standing via `/admin/companies`.
   - Employer publishes a job listing.
   - Candidate applies; employer reviews candidate in Kanban board (`/employer/applications`).
   - Employer advances candidate: `PENDING -> REVIEWING -> SHORTLISTED -> ACCEPTED`.
   - Candidate logs in and confirms updated `ACCEPTED` offer status.

---

## 16. Production Build & Deployment

### Production Verification Gate
```bash
# Verify TypeScript compilation across all workspaces (0 errors)
npm run typecheck

# Verify ESLint code standards (0 warnings, 0 errors)
npm run lint

# Execute all backend tests (84 passing)
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

---

## 17. Architectural Suggestions & Future Roadmap

For an in-depth architectural evaluation, production readiness scorecard, and multi-phase evolution blueprints, refer to:

👉 **[Docs/suggestion.md](Docs/suggestion.md)**

### Key Roadmap Highlights
- **AI Resume Parser & Vector Search**: Automatic skill extraction from candidate resumes and semantic matching using PostgreSQL `pgvector`.
- **Real-Time WebSockets Messaging**: Candidate ↔ recruiter messaging channel activated upon candidate shortlisting.
- **Native Calendar & Interview Scheduling**: Direct integration with Google Calendar and Cal.com for interview booking.
- **Candidate Evaluation Scorecards**: Multi-member collaborative rubrics and structured interviewer scoring.
- **Enterprise SSO & SAML 2.0**: Okta / Azure AD enterprise single sign-on.
