import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Seeker End-to-End Journey', () => {
  const timestamp = Date.now();
  const seekerEmail = `seeker.journey.${timestamp}@example.com`;
  const seekerPassword = 'SecurePassword123!';
  const seekerName = 'Jordan Seeker';

  test('seeker registers -> browses jobs -> filters -> applies with resume -> checks dashboard', async ({ page }) => {
    // 1. Visit Register Page
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create an Account/i })).toBeVisible();

    // 2. Ensure Job Seeker role is active (default)
    await page.getByRole('button', { name: /Job Seeker/i }).click();

    // 3. Fill registration form
    await page.getByPlaceholder(/Alex Rivera/i).fill(seekerName);
    await page.getByPlaceholder(/name@domain.com/i).fill(seekerEmail);
    await page.getByPlaceholder(/Minimum 8 characters/i).fill(seekerPassword);

    // 4. Submit Registration
    await page.getByRole('button', { name: /Complete Registration/i }).click();

    // 5. Verify redirection to Seeker Dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/Total Applied/i)).toBeVisible();

    // 6. Navigate to Public Job Catalog
    await page.goto('/jobs');
    await expect(page.getByPlaceholder(/e.g. Full-Stack/i)).toBeVisible();

    // 7. Verify jobs are rendered
    const jobCards = page.locator('article, a[href^="/jobs/"]');
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });

    // 8. Click on first available job
    const firstJobLink = page.locator('a[href^="/jobs/"]').first();
    await firstJobLink.click();

    // 9. Verify on Job Details page
    await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/);
    const applyBtn = page.getByRole('button', { name: /Apply for this role/i });
    await expect(applyBtn).toBeVisible({ timeout: 10000 });

    // 10. Click Apply to open application modal
    await applyBtn.click();
    await expect(page.getByText(/Apply for/i)).toBeVisible();

    // 11. Attach resume PDF and enter cover letter
    const fixturePath = path.resolve(__dirname, 'fixtures/sample_resume.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixturePath);

    const coverLetterArea = page.getByPlaceholder(/Introduce yourself/i);
    await coverLetterArea.fill('I am excited to apply for this position! My distributed systems and full-stack engineering background make me a great fit.');

    // 12. Submit Application
    const submitBtn = page.getByRole('button', { name: /Submit Application/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 13. Verify confirmation: button updates to Applied (PENDING)
    await expect(page.getByText(/Applied \(PENDING\)/i)).toBeVisible({ timeout: 10000 });

    // 14. Navigate to Applications tracker under candidate dashboard
    await page.goto('/dashboard/applications');
    await expect(page.getByRole('heading', { name: /My Applications/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/PENDING/i).first()).toBeVisible({ timeout: 10000 });
  });
});
