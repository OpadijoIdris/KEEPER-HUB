export const EMAIL_PORT = Symbol('EMAIL_PORT');

/**
 * External-capability port (see docs/ARCHITECTURE.md §5.0) — only the
 * infrastructure adapter behind this knows it's backed by Nodemailer/SMTP.
 */
export interface EmailPort {
  send(to: string, subject: string, body: string): Promise<void>;
}
