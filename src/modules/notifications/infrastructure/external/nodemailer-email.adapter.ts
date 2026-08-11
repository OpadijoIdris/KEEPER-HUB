import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailPort } from '../../domain/ports/email.port';
import type { AppConfig } from '../../../../config/configuration';

/**
 * SMTP via Nodemailer — the only place in the platform that knows email
 * delivery is backed by SMTP specifically (see docs/ARCHITECTURE.md §5.0).
 * Without EMAIL_HOST/USER/PASS configured, send() logs and no-ops instead
 * of throwing — notifications shouldn't require email to be set up.
 */
@Injectable()
export class NodemailerEmailAdapter implements EmailPort {
  private readonly logger = new Logger(NodemailerEmailAdapter.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        `EMAIL_HOST/EMAIL_USER/EMAIL_PASS not configured — skipping email to ${to}.`,
      );
      return;
    }

    const from =
      this.configService.get('email.from', { infer: true }) ??
      this.configService.get('email.user', { infer: true });
    await transporter.sendMail({ from, to, subject, text: body });
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.configService.get('email.host', { infer: true });
    const port = this.configService.get('email.port', { infer: true });
    const user = this.configService.get('email.user', { infer: true });
    const pass = this.configService.get('email.pass', { infer: true });
    if (!host || !user || !pass) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }
}
