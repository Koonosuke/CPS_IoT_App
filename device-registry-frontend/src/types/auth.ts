/**
 * 認証関連の型定義
 */

export interface User {
  userId: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  cognitoSub?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}
