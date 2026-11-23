import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  /**
   * Dispatches an email via Resend API if configured, otherwise logs nicely to the development logger.
   */
  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string }> {
    if (env.NODE_ENV === 'test') {
      return { success: true, id: 'test-email-id' };
    }

    if (env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: [payload.to],
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          logger.error({ status: response.status, body: errBody }, '[Email] Failed to send email via Resend API');
          return { success: false };
        }

        const data = (await response.json()) as { id?: string };
        logger.info({ id: data.id, to: payload.to, subject: payload.subject }, '[Email] Successfully sent via Resend');
        return { success: true, id: data.id };
      } catch (err: any) {
        logger.error({ err: err.message }, '[Email] Exception while sending email via Resend API');
        return { success: false };
      }
    }

    // Development fallback: Log formatted transactional email
    logger.info(
      {
        to: payload.to,
        from: env.EMAIL_FROM,
        subject: payload.subject,
      },
      `[Email Mock] ✉️ Transactional Email Dispatched to ${payload.to}`
    );
    return { success: true, id: 'mock-local-id' };
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = 'Welcome to Jobify! Your career journey starts here';
    const text = `Hi ${name},\n\nWelcome to Jobify. Your account has been created successfully. Browse thousands of verified roles and connect directly with high-growth teams.\n\nBest,\nThe Jobify Team`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Welcome to Jobify!</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Hi ${name},</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Welcome to the future of hiring. Your Jobify account is ready. Discover verified engineering, design, and product opportunities with transparent salaries.</p>
        <div style="margin: 32px 0;">
          <a href="${env.CLIENT_ORIGIN}/jobs" style="background-color: #289E73; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">Browse Verified Jobs</a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">© 2026 Jobify Inc. WCAG AA Compliant Engineering Platform.</p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }

  async sendApplicationSubmittedEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    companyName: string
  ): Promise<void> {
    const subject = `Application Received: ${jobTitle} at ${companyName}`;
    const text = `Hi ${candidateName},\n\nWe received your application for "${jobTitle}" at ${companyName}. The hiring team will review your profile shortly.\n\nTrack your application status on your Jobify dashboard.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Application Submitted 🎉</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Hi ${candidateName},</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received by the hiring team.</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #F7F8FA; border-radius: 12px;">
          <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Status:</strong> <span style="background-color: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">PENDING REVIEW</span></p>
        </div>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_ORIGIN}/dashboard/applications" style="background-color: #289E73; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">View Applications</a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">© 2026 Jobify Inc.</p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }

  async sendApplicationStatusUpdateEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    status: string
  ): Promise<void> {
    const subject = `Update on your application for ${jobTitle} at ${companyName}`;
    const text = `Hi ${candidateName},\n\nThe hiring team at ${companyName} has updated your application status to: ${status}.\n\nLog in to your Jobify dashboard to see detailed updates.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Application Status Update</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Hi ${candidateName},</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">There is an update on your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #F7F8FA; border-radius: 12px;">
          <p style="margin: 0; color: #374151; font-size: 14px;"><strong>New Status:</strong> <span style="background-color: #D1FAE5; color: #065F46; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 700;">${status}</span></p>
        </div>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_ORIGIN}/dashboard/applications" style="background-color: #289E73; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">© 2026 Jobify Inc.</p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }

  async sendEmployerNewApplicationAlert(
    to: string,
    employerName: string,
    candidateName: string,
    jobTitle: string
  ): Promise<void> {
    const subject = `New Candidate Applied: ${candidateName} for ${jobTitle}`;
    const text = `Hi ${employerName},\n\nA new candidate (${candidateName}) has just submitted an application for your job posting "${jobTitle}".\n\nLog in to your Employer Portal to review their resume and profile.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">New Candidate Application 🚀</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Hi ${employerName},</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 24px;"><strong>${candidateName}</strong> has applied for your open role: <strong>${jobTitle}</strong>.</p>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_ORIGIN}/employer/applications" style="background-color: #289E73; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">Review Application</a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">© 2026 Jobify Inc.</p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }
}

export const emailService = new EmailService();
