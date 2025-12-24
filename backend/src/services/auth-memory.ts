import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { User, UserPublic, toPublicUser } from '../models/user';
import { logger } from '../utils/logger';

import { IAuthService } from './auth-interface';

/**
 * In-memory authentication service for development
 * Does not require a database connection
 */
export class AuthServiceMemory implements IAuthService {
  private users: Map<string, User> = new Map();
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(jwtSecret: string, jwtExpiresIn: string = '7d') {
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    username: string,
    password: string
  ): Promise<{ user: UserPublic; token: string }> {
    try {
      // Check if user already exists
      for (const user of this.users.values()) {
        if (user.email === email || user.username === username) {
          throw new Error('User with this email or username already exists');
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user: User = {
        id: randomUUID(),
        email,
        username,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store user
      this.users.set(user.id, user);

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
      let foundUser: User | undefined;
      for (const user of this.users.values()) {
        if (user.email === email) {
          foundUser = user;
          break;
        }
      }

      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, foundUser.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(foundUser.id);

      logger.info('User logged in', { userId: foundUser.id, email: foundUser.email });

      return {
        user: toPublicUser(foundUser),
        token,
      };
    } catch (error) {
      logger.error('Login error', { error, email });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserPublic | null> {
    const user = this.users.get(userId);
    return user ? toPublicUser(user) : null;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<UserPublic | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      return await this.getUserById(decoded.userId);
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
