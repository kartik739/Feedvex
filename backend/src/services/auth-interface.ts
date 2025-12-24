import { UserPublic } from '../models/user';

/**
 * Common interface for authentication services
 */
export interface IAuthService {
  register(email: string, username: string, password: string): Promise<{ user: UserPublic; token: string }>;
  login(email: string, password: string): Promise<{ user: UserPublic; token: string }>;
  getUserById(userId: string): Promise<UserPublic | null>;
  verifyToken(token: string): Promise<UserPublic | null>;
}
