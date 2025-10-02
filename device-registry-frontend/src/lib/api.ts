/**
 * APIクライアント
 */

import type { Device, DeviceDetail, DeviceHistory, DashboardData, LatestMetric } from '@/types';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

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

// JWTトークンの有効期限をチェックする関数
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit, token?: string): Promise<T> {
  // トークンが提供されている場合、有効期限をチェック
  if (token && isTokenExpired(token)) {
    // トークンが期限切れの場合、ローカルストレージから削除
    localStorage.removeItem('auth_tokens');
    throw new ApiError('認証トークンの有効期限が切れています。再度ログインしてください。', 401, 'TOKEN_EXPIRED');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // 401エラーの場合、トークンを削除
    if (response.status === 401) {
      localStorage.removeItem('auth_tokens');
    }
    
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
  getDevices: (token: string): Promise<Device[]> => 
    fetchApi<Device[]>('/devices', undefined, token),

  // デバイス詳細取得
  getDevice: (deviceId: string, token: string): Promise<DeviceDetail> => 
    fetchApi<DeviceDetail>(`/devices/${deviceId}`, undefined, token),

  // デバイス登録
  claimDevice: (deviceId: string, lat: number, lon: number, token: string): Promise<DeviceDetail> =>
    fetchApi<DeviceDetail>('/devices/claim', {
      method: 'POST',
      body: JSON.stringify({ deviceId, lat, lon }),
    }, token),

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
