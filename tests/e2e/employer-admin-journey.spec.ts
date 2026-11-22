import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Employer, Admin & Candidate Lifecycle Journey', () => {
  const timestamp = Date.now();
  const employerEmail = `founder.apex.${timestamp}@example.com`;
  const employerPassword = 'EmployerPassword123!';
  const companyName = `Apex Dynamics ${timestamp}`;
  const jobTitle = `Lead Systems Architect ${timestamp}`;

  test('employer registers -> creates company -> admin verifies -> publishes job -> candidate applies -> employer reviews & advances in kanban -> seeker sees new status', async ({
    browser,
  }) => {
    test.setTimeout(90000);
    // Context 1: Employer Context
    const employerContext = await browser.newContext();
    const employerPage = await employerContext.newPage();

    // 1. Employer registers
    await employerPage.goto('/register');
    await employerPage.getByRole('button', { name: /Employer/i }).click();
    await employerPage.getByPlaceholder(/Alex Rivera/i).fill('Elena Vance');
    await employerPage.getByPlaceholder(/name@domain.com/i).fill(employerEmail);
    await employerPage.getByPlaceholder(/Minimum 8 characters/i).fill(employerPassword);
    await employerPage.getByRole('button', { name: /Complete Registration/i }).click();

    // Redirection to employer dashboard
    await expect(employerPage).toHaveURL(/\/employer\/dashboard/, { timeout: 15000 });

    // 2. Employer visits Company Settings to create organization
    await employerPage.goto('/employer/company');
    await expect(employerPage.getByRole('heading', { name: /Register Your Organization/i })).toBeVisible({
      timeout: 10000,
    });

    await employerPage.getByPlaceholder(/Acme Innovations Inc/i).fill(companyName);
    await employerPage.getByPlaceholder(/Enterprise Cloud Software/i).fill('Autonomous Infrastructure');
    await employerPage.getByPlaceholder(/San Francisco, CA/i).fill('Seattle, WA');
    await employerPage.getByPlaceholder(/https:\/\/acme.example.com/i).fill('https://apexdynamics.example.com');
    await employerPage
      .getByPlaceholder(/Tell candidates about your company/i)
      .fill('Building high-throughput scalable distributed infrastructure systems.');

    await employerPage.getByRole('button', { name: /Register Company/i }).click();

    // Verify company settings panel is now active
    await expect(employerPage.getByText(/Company Settings & Team/i)).toBeVisible({ timeout: 10000 });
    await expect(employerPage.getByText(/Verification Pending/i).first()).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Context 2: Admin verifies the company
    // -------------------------------------------------------------
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/login');
    await adminPage.locator('input[type="email"]').fill('admin@jobify.dev');
    await adminPage.locator('input[type="password"]').fill('AdminPass123!');
    await adminPage.getByRole('button', { name: /Sign In/i }).click();
    await expect(adminPage).toHaveURL(/\/admin/, { timeout: 15000 });

    // Admin goes to Company Verification Portal
    await adminPage.goto('/admin/companies');
    await expect(adminPage.getByRole('heading', { name: /Company Verification & Trust/i })).toBeVisible({
      timeout: 10000,
    });

    // Search for the newly created company
    const adminSearchInput = adminPage.getByPlaceholder(/Search company name/i);
    await adminSearchInput.fill(companyName);

    // Click "Grant Verification"
    const grantVerifyBtn = adminPage.getByRole('button', { name: /Grant Verification/i }).first();
    await expect(grantVerifyBtn).toBeVisible({ timeout: 10000 });
    // Listen for confirm dialog
    adminPage.on('dialog', (dialog) => dialog.accept());
    await grantVerifyBtn.click();

    // Verify company gets Verified badge
    await expect(adminPage.getByText(/Company successfully verified/i)).toBeVisible({ timeout: 10000 });
    await adminContext.close();

    // -------------------------------------------------------------
    // 3. Employer Publishes a New Job Listing
    // -------------------------------------------------------------
    // Reload employer company page to fetch updated verified status
    await employerPage.reload();
    await expect(employerPage.getByText(/Verified Employer/i).first()).toBeVisible({ timeout: 10000 });

    // Navigate to post new job
    await employerPage.goto('/employer/jobs/new');
    await expect(employerPage.getByRole('heading', { name: /Post a New Position/i })).toBeVisible({
      timeout: 10000,
    });

    await employerPage.getByPlaceholder(/e.g. Senior Full-Stack Engineer/i).fill(jobTitle);
    await employerPage.getByPlaceholder(/San Francisco, CA or Remote/i).fill('Seattle, WA');
    await employerPage.locator('input[name="salaryMin"]').fill('180000');
    await employerPage.locator('input[name="salaryMax"]').fill('240000');
    await employerPage
      .locator('textarea[name="description"]')
      .fill('Architect our next-generation distributed transaction systems.');
    await employerPage
      .locator('textarea[name="responsibilities"]')
      .fill('Design low-latency database queries, maintain distributed state machines.');
    await employerPage
      .locator('textarea[name="requirements"]')
      .fill('8+ years backend systems experience, PostgreSQL, TypeScript, Docker.');

    // Ensure Published status is selected
    await employerPage.locator('input[value="PUBLISHED"]').check();

    // Submit Job
    await employerPage.getByRole('button', { name: /Create Position/i }).click();

    // Verify redirected to jobs listings
    await expect(employerPage).toHaveURL(/\/employer\/jobs/, { timeout: 15000 });
    await expect(employerPage.getByText(jobTitle)).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Context 3: Candidate Discovers and Applies to the Job
    // -------------------------------------------------------------
    const seekerContext = await browser.newContext();
    const seekerPage = await seekerContext.newPage();

    // Login as Alex (Seeker)
    await seekerPage.goto('/login');
    await seekerPage.locator('input[type="email"]').fill('alex.dev@jobify.dev');
    await seekerPage.locator('input[type="password"]').fill('SeekerPass123!');
    await seekerPage.getByRole('button', { name: /Sign In/i }).click();
    await expect(seekerPage).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Go to public jobs page and find the job
    await seekerPage.goto('/jobs');
    await seekerPage.getByPlaceholder(/e.g. Full-Stack/i).fill(jobTitle);
    const publishedJobCard = seekerPage.getByRole('heading', { name: jobTitle }).first();
    await expect(publishedJobCard).toBeVisible({ timeout: 10000 });
    await publishedJobCard.click();

    // Apply modal
    const applyBtn = seekerPage.getByRole('button', { name: /Apply for this role/i });
    await expect(applyBtn).toBeVisible({ timeout: 10000 });
    await applyBtn.click();

    // Attach resume
    const fixturePath = path.resolve(__dirname, 'fixtures/sample_resume.pdf');
    await seekerPage.locator('input[type="file"]').setInputFiles(fixturePath);
    await seekerPage.getByPlaceholder(/Introduce yourself/i).fill('High scale distributed systems engineer with extensive experience.');
    await seekerPage.getByRole('button', { name: /Submit Application/i }).click();

    // Verify submission: button updates to Applied (PENDING)
    await expect(seekerPage.getByText(/Applied \(PENDING\)/i)).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // 4. Employer Reviews & Updates Status in Kanban Pipeline
    // -------------------------------------------------------------
    await employerPage.goto('/employer/applications');
    await expect(employerPage.getByRole('heading', { name: /Applicant Pipeline/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify candidate appears in PENDING column ("New Applications")
    await expect(employerPage.getByText('alex.dev@jobify.dev')).toBeVisible({ timeout: 10000 });

    // Transition 1: PENDING -> REVIEWING (Click "Review ->")
    const reviewBtn = employerPage.getByRole('button', { name: /Review →/i }).first();
    await reviewBtn.click();

    // Transition 2: REVIEWING -> SHORTLISTED (Click "Shortlist ->")
    const shortlistBtn = employerPage.getByRole('button', { name: /Shortlist →/i }).first();
    await expect(shortlistBtn).toBeVisible({ timeout: 10000 });
    await shortlistBtn.click();

    // Transition 3: SHORTLISTED -> ACCEPTED (Click "Accept / Hire ->")
    const acceptBtn = employerPage.getByRole('button', { name: /Accept \/ Hire →/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 10000 });
    await acceptBtn.click();

    // Verify candidate is now in the Accepted / Hired column
    await expect(employerPage.locator('text=alex.dev@jobify.dev')).toBeVisible();

    // -------------------------------------------------------------
    // 5. Seeker verifies the updated status on candidate dashboard
    // -------------------------------------------------------------
    await seekerPage.goto('/dashboard/applications');
    await expect(seekerPage.getByRole('heading', { name: /My Applications/i })).toBeVisible({ timeout: 10000 });
    // Look for the accepted status badge on Alex's application
    await expect(seekerPage.getByText(/ACCEPTED/i).first()).toBeVisible({ timeout: 10000 });

    // Clean up
    await employerContext.close();
    await seekerContext.close();
  });
});
