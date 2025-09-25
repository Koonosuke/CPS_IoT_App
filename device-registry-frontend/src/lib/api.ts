/**
 * APIクライアント
/**
 * APIクライアント
 */

import type { Device, DeviceDetail, DeviceHistory, DashboardData, LatestMetric } from '@/types';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || errorData.message || 'API request failed',
      response.status,
      errorData.code
    );
  }

  return response.json();
}

export const deviceApi = {
  // デバイス一覧取得
  getDevices: (): Promise<Device[]> => 
    fetchApi<Device[]>('/devices'),

  // デバイス詳細取得
  getDevice: (deviceId: string): Promise<DeviceDetail> => 
    fetchApi<DeviceDetail>(`/devices/${deviceId}`),

  // デバイス登録
  claimDevice: (deviceId: string, lat: number, lon: number): Promise<DeviceDetail> =>
    fetchApi<DeviceDetail>('/devices/claim', {
      method: 'POST',
      body: JSON.stringify({ deviceId, lat, lon }),
    }),

  // 最新データ取得
  getLatestMetric: (deviceId: string): Promise<LatestMetric> =>
    fetchApi<LatestMetric>(`/devices/${deviceId}/latest`),

  // 履歴データ取得
  getDeviceHistory: (deviceId: string, hours: number = 24, limit: number = 100): Promise<DeviceHistory> =>
    fetchApi<DeviceHistory>(`/devices/${deviceId}/history?hours=${hours}&limit=${limit}`),

  // 統計情報取得
  getStats: (): Promise<DashboardData> =>
    fetchApi<DashboardData>('/devices/stats'),
};

export { ApiError };
