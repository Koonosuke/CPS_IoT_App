/**
 * デバイス関連の型定義
 */

export interface Device {
  deviceId: string;
  deviceType: string;
  agriculturalSite: string;
  fieldName: string;
  physicalLocation?: string;
  lat?: number;
  lon?: number;
  description?: string;
  firmwareVersion?: string;
  isActive: boolean;
  ownershipType: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStats {
  userId: string;
  deviceId: string;
  deviceType: string;
  agriculturalSite: string;
  fieldName: string;
  physicalLocation?: string;
  lat?: number;
  lon?: number;
  latestDistance?: number;
  lastUpdate?: string;
  ownershipType: string;
  assignedAt: string;
}

export interface DeviceDetail {
  deviceId: string;
  deviceType: string;
  agriculturalSite: string;
  fieldName: string;
  physicalLocation?: string;
  lat?: number;
  lon?: number;
  description?: string;
  firmwareVersion?: string;
  isActive: boolean;
  ownershipType: string;
  assignedAt: string;
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

