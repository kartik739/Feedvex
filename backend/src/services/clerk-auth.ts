import { createClerkClient } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Clerk user extracted from JWT token
 */
export interface ClerkUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * ClerkAuthMiddleware - verifies Clerk JWT tokens on API requests.
 *
 * Why Clerk over custom auth? Clerk handles OAuth, social login, MFA,
 * password reset, and JWT management. We get all of that for free
 * instead of building and maintaining it ourselves.
 */
export class ClerkAuthMiddleware {
  private clerk: ReturnType<typeof createClerkClient> | null = null;

  constructor(secretKey?: string) {
    if (secretKey) {
      this.clerk = createClerkClient({ secretKey });
    }
  }

  /**
   * Verifies a Clerk JWT token and returns the user.
   * Returns null if Clerk is not configured (dev mode fallback).
   */
  async verifyToken(token: string): Promise<ClerkUser | null> {
    if (!this.clerk) {
      logger.warn('Clerk not configured - auth disabled in dev mode');
      return null;
    }

    try {
      const payload = await this.clerk.verifyToken(token);
      return {
        id: payload.sub,
        email: (payload as any).email ?? '',
        username: (payload as any).username,
        firstName: (payload as any).first_name,
        lastName: (payload as any).last_name,
      };
    } catch (error) {
      logger.debug('Clerk token verification failed', { error });
      return null;
    }
  }

  /**
   * Express middleware that requires a valid Clerk JWT.
   * Returns 401 if token is missing or invalid.
   */
  requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const user = await this.verifyToken(token);

    if (!user) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    (req as any).clerkUser = user;
    next();
  };

  /**
   * Optional auth - attaches user if token present, but doesn't block.
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await this.verifyToken(token);
      if (user) {
        (req as any).clerkUser = user;
      }
    }

    next();
  };
}
