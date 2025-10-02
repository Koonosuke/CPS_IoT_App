/**
 * 認証APIクライアント
 */

import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  ConfirmSignUpRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
  User
} from '@/types/auth';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
const API_PREFIX: string = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

export class AuthApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.detail = detail;
  }
}

class AuthApiClient {
  private getUrl(path: string): string {
    return `${API_BASE_URL}${API_PREFIX}${path}`;
  }

  private async request<T>(method: string, path: string, data?: any, token?: string): Promise<T> {
    const url = this.getUrl(path);
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(
        errorData.detail || response.statusText,
        response.status,
        errorData.detail
      );
    }

    return response.json();
  }

  // ログイン
  login(request: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('POST', '/auth/login', request);
  }

  // ユーザー登録
  signUp(request: SignUpRequest): Promise<SignUpResponse> {
    return this.request<SignUpResponse>('POST', '/auth/signup', request);
  }

  // 登録確認
  confirmSignUp(request: ConfirmSignUpRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/confirm-signup', request);
  }

  // トークンリフレッシュ
  refreshToken(request: RefreshTokenRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('POST', '/auth/refresh', request);
  }

  // パスワード変更
  changePassword(request: ChangePasswordRequest, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/change-password', request, token);
  }

  // パスワードリセット
  forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/forgot-password', request);
  }

  // パスワードリセット確認
  confirmForgotPassword(request: ConfirmForgotPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/confirm-forgot-password', request);
  }

  // 現在のユーザー情報取得
  getMe(token: string): Promise<User> {
    return this.request<User>('GET', '/auth/me', undefined, token);
  }
}

export const authApi = new AuthApiClient();
