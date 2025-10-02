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
      const currentTime = Math.floor(Date.now() / 10000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  // ローカルストレージからトークンを復元
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = localStorage.getItem('auth_tokens');
      
        if (tokens) {
          const parsedTokens = JSON.parse(tokens);
    
          if (parsedTokens.idToken && !isTokenExpired(parsedTokens.idToken)) {
            // IDトークンからユーザー情報をデコード（バックエンドの検証をスキップ）
          
            try {
              const payload = JSON.parse(atob(parsedTokens.idToken.split('.')[1]));
              const user = {
                sub: payload.sub,
                email: payload.email,
                given_name: payload.given_name ? String(payload.given_name) : undefined,
                family_name: payload.family_name ? String(payload.family_name) : undefined,
                username: payload['cognito:username'],
                groups: payload['cognito:groups'] || [],
                token_use: payload.token_use,
                client_id: payload.aud,
              };
            
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                  user,
                  tokens: parsedTokens,
                },
              });
   
            } catch (decodeError) {
          
              localStorage.removeItem('auth_tokens');
              dispatch({ type: 'AUTH_FAILURE', payload: 'トークンの解析に失敗しました' });
            }
          } else {
            // トークンが無効または期限切れ
            console.log('DEBUG: Token is invalid or expired, removing from localStorage');
            localStorage.removeItem('auth_tokens');
            dispatch({ type: 'AUTH_FAILURE', payload: 'トークンの有効期限が切れています' });
          }
        } else {
          // トークンが存在しない場合
          console.log('DEBUG: No tokens found, user is not authenticated');
          dispatch({ type: 'AUTH_FAILURE', payload: '' });
        }
      } catch (error) {
        console.error('DEBUG: Failed to initialize auth:', error);
        localStorage.removeItem('auth_tokens');
        dispatch({ type: 'AUTH_FAILURE', payload: '認証の初期化に失敗しました' });
      }
    };

    initializeAuth();
  }, []);

  // ログイン
  const login = async (request: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authApi.login(request);
      
      // トークンをローカルストレージに保存
      const tokens = {
        accessToken: response.access_token,
        idToken: response.id_token,
        refreshToken: response.refresh_token,
      };
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      // ユーザー情報を取得
      const user = await authApi.getMe(response.access_token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, tokens },
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
  const logout = () => {
    localStorage.removeItem('auth_tokens');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  // エラークリア
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // アクセストークン取得
  const getAccessToken = (): string | null => {
    return state.tokens?.accessToken || null;
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
