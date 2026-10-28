import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import nodemailer, { type Transporter } from 'nodemailer';
import { randomUUID } from 'node:crypto';
import type { Env } from '../config/env.js';
import { renderEnquiryNotification, renderInvitation, renderPasswordReset, type EnquiryNotification } from './templates.js';

export interface MailJob {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const QUEUE_NAME = 'mail';

/**
 * Outbound email goes through a BullMQ queue (SRS Module 10): retried with backoff,
 * idempotent per job id, and never blocks the business transaction that triggered it.
 */
@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly connection: Redis;
  private readonly queue: Queue<MailJob>;
  private worker?: Worker<MailJob>;
  private transporter?: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.connection = new Redis(config.get('REDIS_URL', { infer: true }), { maxRetriesPerRequest: null, lazyConnect: true });
    this.queue = new Queue<MailJob>(QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500, removeOnFail: 1000 },
    });
    this.from = config.get('MAIL_FROM', { infer: true });
  }

  async onModuleInit() {
    const host = this.config.get('SMTP_HOST', { infer: true });
    if (host) {
      const user = this.config.get('SMTP_USER', { infer: true });
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get('SMTP_PORT', { infer: true }),
        secure: this.config.get('SMTP_SECURE', { infer: true }),
        ...(user ? { auth: { user, pass: this.config.get('SMTP_PASSWORD', { infer: true }) } } : {}),
      });
    } else {
      this.logger.warn('SMTP_HOST not set; emails will be logged instead of sent');
    }
    this.worker = new Worker<MailJob>(QUEUE_NAME, (job) => this.deliver(job), { connection: this.connection.duplicate(), concurrency: 2 });
    this.worker.on('failed', (job, err) => this.logger.error({ msg: 'mail delivery failed', jobId: job?.id, attempts: job?.attemptsMade, err: err.message }));
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
    this.connection.disconnect();
  }

  /** Verifies the SMTP connection; used by the integrations health check. */
  async verify(): Promise<void> {
    if (!this.transporter) throw new Error('SMTP is not configured');
    await this.transporter.verify();
  }

  async enqueue(job: MailJob, idempotencyKey: string = randomUUID()) {
    await this.queue.add('send', job, { jobId: idempotencyKey });
  }

  private async deliver(job: Job<MailJob>) {
    const { to, subject, text, html } = job.data;
    if (!this.transporter) {
      this.logger.log({ msg: 'email (not sent, SMTP disabled)', to, subject });
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text, html });
    this.logger.log({ msg: 'email sent', to, subject, jobId: job.id });
  }

  sendInvitation(p: { to: string; name: string; invitedBy: string; link: string; expiresInHours: number }) {
    const { subject, text, html } = renderInvitation(p);
    return this.enqueue({ to: p.to, subject, text, html });
  }

  sendPasswordReset(p: { to: string; name: string; link: string; expiresInMinutes: number }) {
    const { subject, text, html } = renderPasswordReset(p);
    return this.enqueue({ to: p.to, subject, text, html });
  }

  sendEnquiryNotification(p: { to: string; enquiry: EnquiryNotification }, idempotencyKey?: string) {
    const { subject, text, html } = renderEnquiryNotification(p.enquiry);
    return this.enqueue({ to: p.to, subject, text, html }, idempotencyKey);
  }
}
