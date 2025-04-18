export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  totpSecret?: string;
  isAdmin?: boolean;
  registeredAt: number;
}

export interface AuthenticationAttempt {
  timestamp: number;
  success: boolean;
  method: 'password' | 'totp';
  userId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  attempts: AuthenticationAttempt[];
}