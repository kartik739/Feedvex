import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { ResendEmailService } from './resend-email';
import { logger } from '../utils/logger';

export class ClerkWebhookHandler {
  constructor(
    private emailService: ResendEmailService,
    private webhookSecret?: string
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    if (this.webhookSecret) {
      const wh = new Webhook(this.webhookSecret);
      try {
        wh.verify(JSON.stringify(req.body), {
          'svix-id': req.headers['svix-id'] as string,
          'svix-timestamp': req.headers['svix-timestamp'] as string,
          'svix-signature': req.headers['svix-signature'] as string,
        });
      } catch (error) {
        logger.warn('Clerk webhook signature verification failed', { error });
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    const { type, data } = req.body;

    if (type === 'user.created') {
      const email = data?.email_addresses?.[0]?.email_address;
      const firstName = data?.first_name || 'there';

      if (email) {
        this.emailService.sendWelcomeEmail(email, firstName).catch((err) => {
          logger.error('Background welcome email failed', { err });
        });
      }
    }

    logger.info('Clerk webhook processed', { type });
    res.json({ received: true });
  }
}
