/**
 * 認証コンテキスト
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AuthState, User, LoginRequest, SignUpRequest, ConfirmSignUpRequest } from '@/types/auth';
import { authApi, AuthApiError } from '@/lib/auth-api';

// アクション型定義
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthState['tokens'] } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_COMPLETE' };

// 初期状態
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  tokens: null,
};

// リデューサー
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_COMPLETE':
      return {
        ...state,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}

// コンテキスト型定義
interface AuthContextType extends AuthState {
  login: (request: LoginRequest) => Promise<void>;
  signUp: (request: SignUpRequest) => Promise<void>;
  confirmSignUp: (request: ConfirmSignUpRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getAccessToken: () => string | null;
}

// コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// プロバイダーコンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // JWTトークンの有効期限をチェックする関数
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000); // 修正: 10000 → 1000
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  // 認証状態を初期化（HttpOnly Cookieを使用）
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // HttpOnly Cookieから認証状態を確認
        const user = await authApi.getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            tokens: null, // HttpOnly Cookieを使用するため、フロントエンドではトークンを保持しない
          },
        });
      } catch (error) {
        // 認証されていない場合
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
      }
    };

    initializeAuth();
  }, []);

  // ログイン
  const login = async (request: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // HttpOnly Cookieを使用してログイン
      await authApi.login(request);
      
      // ユーザー情報を取得
      const user = await authApi.getMe();
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { 
          user, 
          tokens: null // HttpOnly Cookieを使用するため、フロントエンドではトークンを保持しない
        },
      });
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'ログインに失敗しました';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  // ユーザー登録
  const signUp = async (request: SignUpRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      await authApi.signUp(request);
      dispatch({ type: 'AUTH_COMPLETE' });
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : '登録に失敗しました';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  // 登録確認
  const confirmSignUp = async (request: ConfirmSignUpRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      await authApi.confirmSignUp(request);
      dispatch({ type: 'AUTH_COMPLETE' });
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : '確認に失敗しました';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      // サーバー側でCookieを削除
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // エラークリア
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // アクセストークン取得（HttpOnly Cookieを使用するため、常にnullを返す）
  const getAccessToken = (): string | null => {
    // HttpOnly Cookieを使用するため、フロントエンドではトークンにアクセスできない
    return null;
  };

  const value: AuthContextType = {
    ...state,
    login,
    signUp,
    confirmSignUp,
    logout,
    clearError,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// フック
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
