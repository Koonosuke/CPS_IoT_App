/**
 * 認証ガードコンポーネント
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('DEBUG: AuthGuard - loading:', loading, 'isAuthenticated:', isAuthenticated, 'requireAuth:', requireAuth);
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        console.log('DEBUG: AuthGuard - Redirecting to:', redirectTo);
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        console.log('DEBUG: AuthGuard - Redirecting to dashboard');
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router]);

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 認証が必要で未認証の場合
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // 認証が不要で認証済みの場合
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
