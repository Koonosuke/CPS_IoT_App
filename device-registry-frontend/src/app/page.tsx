'use client';

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  return (
    <AuthGuard requireAuth={true} redirectTo="/auth/login">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[calc(100vh-4rem)] p-8 pb-20 gap-16 sm:p-20">
          <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
            <h1 className="text-4xl font-bold text-gray-900">IoT Water Level Device Registry</h1>
            <p className="text-lg text-gray-600">水位センサーデバイスの登録と管理を行います</p>
            
            {loading ? (
              <div className="flex gap-4">
                <div className="bg-gray-300 text-white px-6 py-3 rounded-lg">
                  読み込み中...
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link href="/devices" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
                  デバイス一覧へ
                </Link>
                <Link href="/dashboard" className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
                  ダッシュボード
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

