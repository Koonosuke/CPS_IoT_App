/**
 * デバイス関連の型定義
 */

export interface Device {
  userId: string;
  deviceId: string;
  claimStatus?: string;
  label?: string;
  fieldId?: string;
  lat?: number;
  lon?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStats {
  userId: string;
  deviceId: string;
  label?: string;
  fieldId?: string;
  lat?: number;
  lon?: number;
  latestDistance?: number;
  lastUpdate?: string;
  claimStatus: string;
}

export interface DeviceDetail {
  userId: string;
  deviceId: string;
  label?: string;
  fieldId?: string;
  lat?: number;
  lon?: number;
  claimStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface LatestMetric {
  deviceId: string;
  time?: string;
  distance?: number;
}

export interface HistoryData {
  time: string;
  distance: number;
}

export interface DeviceHistory {
  deviceId: string;
  history: HistoryData[];
  count: number;
}

export interface DashboardData {
  userId: string;
  totalDevices: number;
  claimedDevices: number;
  devices: DeviceStats[];
}

