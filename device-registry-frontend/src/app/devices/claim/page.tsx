"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import DeviceClaimForm from "../../components/DeviceClaimForm";

// react-leaflet を SSR 無効で読み込む
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

export default function ClaimPage() {
  const params = useSearchParams();
  const deviceId = params.get("deviceId");
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [center, setCenter] = useState<LatLngTuple>([35.68, 139.76]); // 東京

  // カスタムアイコン (画像なし、DivIconでCSSベースの円マーカー)
  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background:#007bff; border-radius:50%; width:16px; height:16px; border:2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // 初回だけ現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  // デバイスが既に登録されていれば初期位置を取得
  useEffect(() => {
    if (!deviceId) return;
    fetch(`http://localhost:8003/devices/${deviceId}`)
      .then((res) => (res.status === 404 ? null : res.json()))
      .then((data) => {
        if (data?.lat && data?.lon) {
          setPosition([data.lat, data.lon]);
          setCenter([data.lat, data.lon]);
        }
      });
  }, [deviceId]);

  const handleRegister = async () => {
    if (!position) return;
    const res = await fetch("http://localhost:8003/devices/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        lat: position[0],
        lon: position[1],
      }),
    });

    if (res.status === 409) {
      alert("このデバイスはすでに登録済みです。更新が必要ならAPI側を修正してください。");
      return;
    }
    alert("登録しました！");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">デバイス {deviceId} の位置を指定</h1>
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
      
      <button 
        disabled={!position} 
        onClick={handleRegister}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        この位置で登録
      </button>
    </div>
  );
}
