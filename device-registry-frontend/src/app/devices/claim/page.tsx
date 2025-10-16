"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import { deviceApi } from "@/lib/api";
import DeviceClaimForm from "../../components/DeviceClaimForm";

// react-leaflet を SSR 無効で読み込む
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

interface AvailableDevice {
  deviceId: string;
  label: string;
  description: string;
  location: string;
}

export default function ClaimPage() {
  const router = useRouter();
  const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [center, setCenter] = useState<LatLngTuple>([35.68, 139.76]); // 東京
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // カスタムアイコン (画像なし、DivIconでCSSベースの円マーカー)
  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background:#007bff; border-radius:50%; width:16px; height:16px; border:2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // 利用可能なデバイス一覧を取得
  useEffect(() => {
    const fetchAvailableDevices = async () => {
      try {
        const devices = await deviceApi.getAvailableDevices();
        setAvailableDevices(devices);
      } catch (error) {
        console.error("利用可能なデバイスの取得に失敗しました:", error);
        setError("利用可能なデバイスの取得に失敗しました");
      }
    };

    fetchAvailableDevices();
  }, []);

  // 初回だけ現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const handleRegister = async () => {
    if (!position || !selectedDeviceId) return;
    
    setIsLoading(true);
    setError("");

    try {
      await deviceApi.claimDevice(selectedDeviceId, position[0], position[1]);
      alert("デバイスの登録が完了しました！");
      router.push("/devices");
    } catch (error: any) {
      console.error("デバイス登録エラー:", error);
      if (error.status === 409) {
        setError("このデバイスはすでに他のユーザーによって登録されています");
      } else if (error.status === 400) {
        setError("選択されたデバイスは利用できません");
      } else {
        setError("デバイスの登録に失敗しました。もう一度お試しください");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDevice = availableDevices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">デバイスを登録</h1>
      <p className="text-gray-600 mb-6">利用可能なデバイスを選択し、地図上で位置を指定してください</p>
      
      {/* デバイス選択 */}
      <div className="mb-6">
        <label htmlFor="device-select" className="block text-sm font-medium text-gray-700 mb-2">
          デバイスを選択
        </label>
        <select
          id="device-select"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">デバイスを選択してください</option>
          {availableDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label} - {device.description} ({device.location})
            </option>
          ))}
        </select>
        
        {selectedDevice && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">{selectedDevice.label}</h3>
            <p className="text-sm text-blue-700">{selectedDevice.description}</p>
            <p className="text-sm text-blue-600">設置場所: {selectedDevice.location}</p>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {/* 地図 */}
      {selectedDeviceId && (
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">デバイスの位置を指定</h2>
          <p className="text-gray-600 mb-4">地図をクリックしてデバイスの位置を選択してください</p>
          
          <div className="map-wrapper mb-4">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <DeviceClaimForm setPos={setPosition} />
              {position && <Marker position={position} icon={customIcon} />}
            </MapContainer>
          </div>
          
          {position && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                選択された位置: 緯度 {position[0].toFixed(6)}, 経度 {position[1].toFixed(6)}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* 登録ボタン */}
      <div className="flex gap-4">
        <button 
          disabled={!position || !selectedDeviceId || isLoading} 
          onClick={handleRegister}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "登録中..." : "この位置で登録"}
        </button>
        
        <button 
          onClick={() => router.push("/devices")}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
