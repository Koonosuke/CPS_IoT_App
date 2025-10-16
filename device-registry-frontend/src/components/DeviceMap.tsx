'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';

// react-leaflet を SSR 無効で読み込む
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface Device {
  deviceId: string;
  label?: string;
  lat?: number;
  lon?: number;
  latestDistance?: number;
  lastUpdate?: string;
  claimStatus?: string;
}

interface DeviceMapProps {
  devices: Device[];
}

// 水位に基づくアイコンの色を決定
const getMarkerColor = (distance?: number) => {
  if (distance === null || distance === undefined) return 'blue';
  if (distance < 10) return 'red';    // 危険
  if (distance < 20) return 'orange'; // 注意
  return 'green';                     // 正常
};

// カスタムアイコンを作成（CSSベース）
const createCustomIcon = (color: string) => {
  const colorMap = {
    red: '#dc2626',      // red-600
    orange: '#ea580c',   // orange-600
    green: '#16a34a',    // green-600
    blue: '#2563eb'      // blue-600
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${colorMap[color as keyof typeof colorMap] || colorMap.blue}; border-radius:50%; width:16px; height:16px; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export function DeviceMap({ devices }: DeviceMapProps) {
  // 位置情報があるデバイスのみをフィルタリング
  const devicesWithLocation = devices.filter(device => 
    device.lat !== null && 
    device.lat !== undefined && 
    device.lon !== null && 
    device.lon !== undefined
  );

  // デバイスがない場合の表示
  if (devicesWithLocation.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">デバイス位置マップ</h2>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500">位置情報が登録されたデバイスがありません</p>
          </div>
        </div>
      </div>
    );
  }

  // 地図の中心点を計算（全デバイスの平均位置）
  const centerLat = devicesWithLocation.reduce((sum, device) => sum + (device.lat || 0), 0) / devicesWithLocation.length;
  const centerLon = devicesWithLocation.reduce((sum, device) => sum + (device.lon || 0), 0) / devicesWithLocation.length;
  const center: LatLngTuple = [centerLat, centerLon];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">デバイス位置マップ</h2>
      <div className="h-96 rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {devicesWithLocation.map((device) => {
            const color = getMarkerColor(device.latestDistance);
            const icon = createCustomIcon(color);
            const position: LatLngTuple = [device.lat!, device.lon!];
            
            return (
              <Marker
                key={device.deviceId}
                position={position}
                icon={icon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {device.label || `デバイス ${device.deviceId.slice(-3)}`}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>ID:</strong> {device.deviceId}</p>
                      <p><strong>位置:</strong> {device.lat?.toFixed(4)}, {device.lon?.toFixed(4)}</p>
                      {device.latestDistance !== null && device.latestDistance !== undefined && (
                        <p><strong>水位:</strong> {device.latestDistance.toFixed(2)} cm</p>
                      )}
                      {device.lastUpdate && (
                        <p><strong>最終更新:</strong> {new Date(device.lastUpdate).toLocaleString('ja-JP')}</p>
                      )}
                      <p><strong>状態:</strong> 
                        <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                          color === 'red' ? 'bg-red-100 text-red-800' :
                          color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          color === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {color === 'red' ? '危険' : color === 'orange' ? '注意' : color === 'green' ? '正常' : 'データなし'}
                        </span>
                      </p>
                    </div>
                    <div className="mt-3">
                      <Link 
                        href={`/devices/${device.deviceId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        詳細を見る →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* 凡例 */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>危険 (水位 &lt; 10cm)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          <span>注意 (水位 10-20cm)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>正常 (水位 &gt; 20cm)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span>データなし</span>
        </div>
      </div>
    </div>
  );
}