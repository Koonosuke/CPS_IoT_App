"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DeviceStats = {
  deviceId: string;
  label?: string;
  fieldId?: string;
  lat?: number;
  lon?: number;
  latestDistance?: number;
  lastUpdate?: string;
  claimStatus: string;
};

type DashboardData = {
  totalDevices: number;
  claimedDevices: number;
  devices: DeviceStats[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/devices/stats");
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        } else {
          setError("データの取得に失敗しました");
        }
      } catch (err) {
        setError("データの取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // 30秒ごとにデータを更新
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "データなし";
    return new Date(timeStr).toLocaleString("ja-JP");
  };

  const formatDistance = (distance?: number) => {
    if (distance === null || distance === undefined) return "データなし";
    return `${distance.toFixed(2)} cm`;
  };

  const getStatusColor = (distance?: number) => {
    if (distance === null || distance === undefined) return "bg-gray-100 text-gray-800";
    if (distance < 10) return "bg-red-100 text-red-800"; // 危険水位
    if (distance < 20) return "bg-yellow-100 text-yellow-800"; // 注意水位
    return "bg-green-100 text-green-800"; // 正常水位
  };

  const getStatusText = (distance?: number) => {
    if (distance === null || distance === undefined) return "データなし";
    if (distance < 10) return "危険";
    if (distance < 20) return "注意";
    return "正常";
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-800 mb-2">エラー</h1>
          <p className="text-red-600 mb-4">{error || "データの取得に失敗しました"}</p>
          <Link href="/devices" className="text-blue-500 hover:text-blue-700">
            ← デバイス一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">圃場監視ダッシュボード</h1>
        <p className="text-gray-600">全デバイスの水位状況を監視</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">総デバイス数</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">登録済みデバイス</p>
              <p className="text-2xl font-bold text-gray-900">{data.claimedDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">未登録デバイス</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalDevices - data.claimedDevices}</p>
            </div>
          </div>
        </div>
      </div>

      {/* デバイス一覧 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">デバイス一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  デバイスID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ラベル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  圃場ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  現在の水位
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終更新
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.devices.map((device) => (
                <tr key={device.deviceId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {device.deviceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.label || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.fieldId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDistance(device.latestDistance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.latestDistance)}`}>
                      {getStatusText(device.latestDistance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(device.lastUpdate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      href={`/devices/${device.deviceId}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      詳細を見る
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.devices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">登録済みのデバイスがありません</p>
            <Link href="/devices" className="text-blue-500 hover:text-blue-700 mt-2 inline-block">
              デバイス一覧で登録する
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
