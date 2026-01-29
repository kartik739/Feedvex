import helmet from 'helmet';
import { RequestHandler } from 'express';

/**
 * Security headers using Helmet.js with Clerk domain allowlist.
 *
 * Why Helmet? It sets HTTP security headers that protect against common
 * attacks (XSS, clickjacking, MIME sniffing). We customize the CSP to
 * allow Clerk domains since Clerk loads scripts and makes API calls.
 *
 * This is a real-world scenario: you need security headers, but you also
 * need to allow third-party services you depend on.
 */
export function createSecurityHeaders(isDev: boolean = false): RequestHandler {
  if (isDev) {
    // Relaxed CSP in development for easier debugging
    return helmet({
      contentSecurityPolicy: false,
    });
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", 'https://clerk.com', 'https://*.clerk.accounts.dev'],
        imgSrc: ["'self'", 'data:', 'https:', 'https://img.clerk.com'],
        connectSrc: [
          "'self'",
          process.env.VITE_API_URL || '',
          'https://api.clerk.com',
          'https://*.clerk.accounts.dev',
        ].filter(Boolean),
        fontSrc: ["'self'", 'https:'],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31_536_000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  });
}
