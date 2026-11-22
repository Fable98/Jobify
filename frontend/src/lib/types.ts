export type Role = 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type CompanyMemberRole = 'OWNER' | 'RECRUITER';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
export type ExperienceLevel = 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REMOVED';
export type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'WITHDRAWN';

export interface User {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  profile?: JobSeekerProfile;
  companyMemberships?: Array<{
    id: string;
    role: CompanyMemberRole;
    company: Company;
  }>;
}

export interface JobSeekerProfile {
  id: string;
  userId: string;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  location?: string | null;
  defaultResumeFileId?: string | null;
  defaultResume?: StoredFile | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  verified: boolean;
  createdAt?: string;
  _count?: {
    jobs?: number;
  };
}

export interface Job {
  id: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    verified: boolean;
    location?: string | null;
    website?: string | null;
    industry?: string | null;
    description?: string | null;
  };
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  salaryCurrency: string;
  status: JobStatus;
  publishedAt?: string | null;
  applicationDeadline?: string | null;
  createdAt: string;
  _count?: {
    applications?: number;
  };
  isSaved?: boolean;
}

export interface StoredFile {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  job: Job;
  applicantId: string;
  applicant?: User;
  resumeFileId: string;
  resumeFile?: StoredFile;
  coverLetter?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
