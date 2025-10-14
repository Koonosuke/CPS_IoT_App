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

  private async getCsrfToken(): Promise<string> {
    const response = await fetch(this.getUrl('/auth/csrf-token'), {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new AuthApiError('CSRFトークンの取得に失敗しました', response.status);
    }
    
    const data = await response.json();
    return data.csrf_token;
  }

  private async request<T>(method: string, path: string, data?: any, requireCsrf: boolean = true): Promise<T> {
    const url = this.getUrl(path);
    
    let csrfToken: string | undefined;
    if (requireCsrf && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      csrfToken = await this.getCsrfToken();
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      },
      credentials: 'include', // HttpOnly Cookieを含める
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
    return this.request<LoginResponse>('POST', '/auth/login', request, false); // ログイン時はCSRF不要
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
  changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/change-password', request);
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
  getMe(): Promise<User> {
    return this.request<User>('GET', '/auth/me', undefined, false);
  }

  // ログアウト
  logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/logout', undefined);
  }
}

export const authApi = new AuthApiClient();
