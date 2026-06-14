import { postJson } from './apiClient';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send an email via the backend (MailHog in dev, real SMTP in prod).
 * Backend endpoint: POST /notifications/email
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  await postJson<void>('/notifications/email', { to, subject, body });
}
