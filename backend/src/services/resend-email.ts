import { Resend } from 'resend';
import { logger } from '../utils/logger';

export class ResendEmailService {
  private client: Resend | null = null;
  private readonly fromEmail = 'FeedVex <noreply@feedvex.dev>';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Resend(apiKey);
      logger.info('Resend email service initialized');
    } else {
      logger.warn('RESEND_API_KEY not set - email sending disabled');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<string | null> {
    if (!this.client) return null;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.client.emails.send({
          from: this.fromEmail,
          to: email,
          subject: 'Welcome to FeedVex!',
          html: this.welcomeTemplate(name),
        });

        if (error) throw new Error(error.message);

        logger.info('Welcome email sent', { email, messageId: data?.id, attempt });
        return data?.id ?? null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('Email send failed, retrying', {
          attempt,
          maxRetries,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    logger.error('Failed to send welcome email after all retries', { email });
    return null;
  }

  private welcomeTemplate(name: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to FeedVex, ${name}!</h1>
        <p>You can now search across Reddit with lightning-fast results.</p>
        <h3>Getting started:</h3>
        <ul>
          <li>Search for any topic to find relevant Reddit posts</li>
          <li>Use filters to narrow results by subreddit or date</li>
          <li>Check your profile to see your search history</li>
        </ul>
        <p>Questions? Reply to this email anytime.</p>
        <p>— The FeedVex Team</p>
      </div>
    `;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
