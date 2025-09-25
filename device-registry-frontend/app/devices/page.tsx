"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Device = { 
  deviceId: string;
  claimStatus?: string;
  label?: string;
};

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/devices")
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("デバイス一覧の取得に失敗しました:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">デバイス一覧</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">デバイス一覧</h1>
          <p className="text-gray-600">登録したいデバイスを選択してください</p>
        </div>
        <Link 
          href="/dashboard" 
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          ダッシュボード
        </Link>
      </div>
      
      <div className="mb-6">
        <label htmlFor="device-select" className="block text-sm font-medium text-gray-700 mb-2">
          デバイスを選択
        </label>
        <select 
          id="device-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">デバイスを選択してください</option>
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.deviceId} {d.label && `(${d.label})`} {d.claimStatus === 'claimed' && '(登録済み)'}
            </option>
          ))}
        </select>
      </div>
      
      <button
        disabled={!selectedId}
        onClick={() => {
          window.location.href = `/devices/claim?deviceId=${selectedId}`;
        }}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        位置を登録する
      </button>
      
      {devices.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">デバイスが見つかりません。バックエンドが起動していることを確認してください。</p>
        </div>
      )}
    </div>
  );
}
