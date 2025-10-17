/**
 * APIクライアント
 */

import type { Device, DeviceDetail, DeviceHistory, DashboardData, LatestMetric } from '@/types';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
const API_PREFIX: string = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

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

// CSRFトークンを取得する関数
async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new ApiError('CSRFトークンの取得に失敗しました', response.status);
  }
  
  const data = await response.json();
  return data.csrf_token;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // POST/PUT/DELETEリクエストの場合はCSRFトークンを取得
  let csrfToken: string | undefined;
  if (options?.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    try {
      csrfToken = await getCsrfToken();
    } catch (error) {
      console.warn('CSRFトークンの取得に失敗しました:', error);
    }
  }
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...options?.headers,
    },
    credentials: 'include', // HttpOnly Cookieを含める
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
  // ユーザーのデバイス一覧取得
  getDevices: (): Promise<Device[]> => 
    fetchApi<Device[]>('/devices'),

  // 利用可能なデバイス一覧取得
  getAvailableDevices: (): Promise<Array<{
    deviceId: string;
    deviceType: string;
    agriculturalSite: string;
    fieldName: string;
    physicalLocation?: string;
    description: string;
  }>> => 
    fetchApi<Array<{
      deviceId: string;
      deviceType: string;
      agriculturalSite: string;
      fieldName: string;
      physicalLocation?: string;
      description: string;
    }>>('/devices/available'),

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
