'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  deviceId?: string;
  deviceName?: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
}

// ダミーデータ
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: '水位異常検知',
    message: 'デバイス「水位センサー1」で水位が危険レベル（5cm）を下回りました。緊急対応が必要です。',
    deviceId: '440525060026078',
    deviceName: '水位センサー1',
    timestamp: '2024-01-15T14:30:00Z',
    isRead: false,
    priority: 'high',
    actionRequired: true
  },
  {
    id: '2',
    type: 'warning',
    title: '土壌湿度低下',
    message: '圃場Aの土壌湿度が30%を下回りました。灌水を検討してください。',
    deviceId: '440525060026079',
    deviceName: '土壌センサーA',
    timestamp: '2024-01-15T12:15:00Z',
    isRead: false,
    priority: 'medium',
    actionRequired: true
  },
  {
    id: '3',
    type: 'info',
    title: '定期メンテナンス推奨',
    message: 'デバイス「水位センサー2」の定期メンテナンス時期が近づいています。',
    deviceId: '440525060026080',
    deviceName: '水位センサー2',
    timestamp: '2024-01-15T10:00:00Z',
    isRead: true,
    priority: 'low',
    actionRequired: false
  },
  {
    id: '4',
    type: 'success',
    title: '灌水完了',
    message: '圃場Bの自動灌水が正常に完了しました。',
    deviceId: '440525060026081',
    deviceName: '灌水システムB',
    timestamp: '2024-01-15T08:45:00Z',
    isRead: true,
    priority: 'low',
    actionRequired: false
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'alert':
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
      );
    case 'warning':
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      );
    case 'info':
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      );
    case 'success':
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      );
    default:
      return null;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-red-500';
    case 'medium':
      return 'border-l-yellow-500';
    case 'low':
      return 'border-l-gray-300';
    default:
      return 'border-l-gray-300';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'high':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">通知</h1>
              <p className="text-gray-600 mt-1">デバイスからのアラートとシステム通知</p>
            </div>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  すべて既読にする
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">未読通知</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">高優先度</p>
                <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">総通知数</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未読 ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'high'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              高優先度 ({highPriorityCount})
            </button>
          </div>
        </div>

        {/* 通知リスト */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
              </svg>
              <p className="text-gray-500">通知がありません</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border-l-4 ${getPriorityColor(notification.priority)} border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    
                    {notification.deviceName && (
                      <div className="mt-2">
                        <Link
                          href={`/devices/${notification.deviceId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {notification.deviceName} の詳細を見る →
                        </Link>
                      </div>
                    )}
                    
                    {notification.actionRequired && (
                      <div className="mt-3 flex space-x-2">
                        <button className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700">
                          緊急対応
                        </button>
                        <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200">
                          作業提案を見る
                        </button>
                      </div>
                    )}
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

