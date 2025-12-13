import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserPublic, toPublicUser } from '../models/user';
import { logger } from '../utils/logger';

/**
 * Authentication service for user management
 */
export class AuthService {
  private pool: Pool;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(pool: Pool, jwtSecret: string, jwtExpiresIn: string = '7d') {
    this.pool = pool;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  /**
   * Register a new user
   */
  async register(email: string, username: string, password: string): Promise<{ user: UserPublic; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert user
      const result = await this.pool.query(
        `INSERT INTO users (email, username, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, email, username, created_at, updated_at`,
        [email, username, passwordHash]
      );

      const user: User = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        username: result.rows[0].username,
        passwordHash,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      };

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info('User registered', { userId: user.id, email: user.email });

      return {
        user: toPublicUser(user),
        token,
      };
    } catch (error) {
      logger.error('Registration error', { error, email });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: UserPublic; token: string }> {
    try {
      // Find user by email
      const result = await this.pool.query(
        'SELECT id, email, username, password_hash, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user: User = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        username: result.rows[0].username,
        passwordHash: result.rows[0].password_hash,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      };

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info('User logged in', { userId: user.id, email: user.email });

      return {
        user: toPublicUser(user),
        token,
      };
    } catch (error) {
      logger.error('Login error', { error, email });
      throw error;
    }
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token: string): Promise<UserPublic | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      
      const result = await this.pool.query(
        'SELECT id, email, username, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        username: result.rows[0].username,
        createdAt: result.rows[0].created_at.toISOString(),
      };
    } catch (error) {
      logger.warn('Token verification failed', { error });
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as jwt.SignOptions);
  }
}
