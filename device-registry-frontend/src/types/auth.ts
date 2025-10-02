/**
 * 認証関連の型定義
 */

export interface User {
  sub: string;  // Cognito User ID
  email: string;
  given_name?: string;
  family_name?: string;
  username?: string;
  groups: string[];
  token_use?: string;
  client_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  given_name: string;
  family_name: string;
}

export interface LoginResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SignUpResponse {
  user_id: string;
  email: string;
  confirmation_required: boolean;
}

export interface ConfirmSignUpRequest {
  email: string;
  confirmation_code: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  confirmation_code: string;
  new_password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  tokens: {
    accessToken: string | null;
    idToken: string | null;
    refreshToken: string | null;
  } | null;
}

