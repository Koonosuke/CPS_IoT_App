"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type DeviceDetail = {
  deviceId: string;
  label?: string;
  fieldId?: string;
  lat?: number;
  lon?: number;
  claimStatus: string;
  updatedAt: string;
};

type LatestMetric = {
  deviceId: string;
  time?: string;
  distance?: number;
};

type HistoryData = {
  time: string;
  distance: number;
};

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.deviceId as string;
  
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [latestMetric, setLatestMetric] = useState<LatestMetric | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const fetchDeviceData = async () => {
      try {
        setLoading(true);
        
        // デバイス基本情報を取得
        const deviceRes = await fetch(`http://localhost:8000/devices/${deviceId}`);
        if (deviceRes.ok) {
          const deviceData = await deviceRes.json();
          setDevice(deviceData);
        }

        // 最新データを取得
        const latestRes = await fetch(`http://localhost:8000/devices/${deviceId}/latest`);
        if (latestRes.ok) {
          const latestData = await latestRes.json();
          setLatestMetric(latestData);
        }

        // 履歴データを取得（過去24時間）
        const historyRes = await fetch(`http://localhost:8000/devices/${deviceId}/history?hours=24`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history || []);
        }

      } catch (err) {
        setError("データの取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
  }, [deviceId]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-800 mb-2">エラー</h1>
          <p className="text-red-600 mb-4">{error || "デバイスが見つかりません"}</p>
          <Link href="/devices" className="text-blue-500 hover:text-blue-700">
            ← デバイス一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "データなし";
    return new Date(timeStr).toLocaleString("ja-JP");
  };

  const formatDistance = (distance?: number) => {
    if (distance === null || distance === undefined) return "データなし";
    return `${distance.toFixed(2)} cm`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/devices" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
          ← デバイス一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold mb-2">デバイス詳細: {device.deviceId}</h1>
        {device.label && <p className="text-gray-600">{device.label}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* デバイス情報 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">デバイス情報</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">デバイスID</label>
                <p className="text-lg">{device.deviceId}</p>
              </div>
              {device.label && (
                <div>
                  <label className="text-sm font-medium text-gray-500">ラベル</label>
                  <p className="text-lg">{device.label}</p>
                </div>
              )}
              {device.fieldId && (
                <div>
                  <label className="text-sm font-medium text-gray-500">圃場ID</label>
                  <p className="text-lg">{device.fieldId}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">登録状態</label>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  device.claimStatus === 'claimed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {device.claimStatus === 'claimed' ? '登録済み' : '未登録'}
                </span>
              </div>
              {device.lat && device.lon && (
                <div>
                  <label className="text-sm font-medium text-gray-500">位置</label>
                  <p className="text-sm">
                    緯度: {device.lat.toFixed(6)}<br />
                    経度: {device.lon.toFixed(6)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">最終更新</label>
                <p className="text-sm">{formatTime(device.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 最新データ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">最新データ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-600 mb-2">現在の水位</h3>
                <p className="text-3xl font-bold text-blue-800">
                  {formatDistance(latestMetric?.distance)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-600 mb-2">最終測定時刻</h3>
                <p className="text-lg font-semibold text-green-800">
                  {formatTime(latestMetric?.time)}
                </p>
              </div>
            </div>
          </div>

          {/* 履歴データ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">過去24時間の履歴</h2>
            {history.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.slice(0, 20).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">{formatTime(item.time)}</span>
                    <span className="font-medium">{formatDistance(item.distance)}</span>
                  </div>
                ))}
                {history.length > 20 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    他 {history.length - 20} 件のデータがあります
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">履歴データがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
