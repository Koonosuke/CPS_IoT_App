'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import Link from 'next/link';

interface WorkSuggestion {
  id: string;
  fieldId: string;
  fieldName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'irrigation' | 'fertilization' | 'pest_control' | 'maintenance' | 'harvest';
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  weatherDependency: boolean;
  equipment: string[];
  steps: string[];
  expectedOutcome: string;
  createdAt: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// ダミーデータ
const mockSuggestions: WorkSuggestion[] = [
  {
    id: '1',
    fieldId: 'field-a',
    fieldName: '圃場A',
    priority: 'urgent',
    category: 'irrigation',
    title: '緊急灌水の実施',
    description: '水位センサーが危険レベル（5cm）を検知しました。緊急灌水が必要です。',
    estimatedDuration: '2-3時間',
    difficulty: 'easy',
    weatherDependency: false,
    equipment: ['灌水ホース', '水量計', '土壌水分計'],
    steps: [
      '灌水バルブを手動で開く',
      '水量を確認しながら灌水開始',
      '土壌の浸透状況を監視',
      '適切な水位まで達したら停止',
      'システムの自動復旧を確認'
    ],
    expectedOutcome: '水位を安全レベル（15cm以上）まで回復',
    createdAt: '2024-01-15T14:30:00Z',
    dueDate: '2024-01-15T18:00:00Z',
    status: 'pending'
  },
  {
    id: '2',
    fieldId: 'field-b',
    fieldName: '圃場B',
    priority: 'high',
    category: 'fertilization',
    title: '有機肥料の追加',
    description: '土壌分析の結果、窒素分が不足しています。有機肥料の追加を推奨します。',
    estimatedDuration: '4-5時間',
    difficulty: 'medium',
    weatherDependency: true,
    equipment: ['有機肥料', '散布機', '土壌混和機'],
    steps: [
      '天気予報を確認（雨の前日が最適）',
      '肥料の量を計算（圃場面積に応じて）',
      '散布機に肥料を投入',
      '均一に散布',
      '土壌に軽く混和',
      '灌水で肥料を土壌に浸透'
    ],
    expectedOutcome: '土壌の窒素分を適正レベルまで向上',
    createdAt: '2024-01-15T10:00:00Z',
    dueDate: '2024-01-17T17:00:00Z',
    status: 'pending'
  },
  {
    id: '3',
    fieldId: 'field-c',
    fieldName: '圃場C',
    priority: 'medium',
    category: 'pest_control',
    title: '病害虫予防散布',
    description: '気温上昇により病害虫の発生リスクが高まっています。予防散布を実施してください。',
    estimatedDuration: '3-4時間',
    difficulty: 'medium',
    weatherDependency: true,
    equipment: ['防除剤', '散布機', '防護服', 'マスク'],
    steps: [
      '風速を確認（3m/s以下が理想）',
      '防護具を着用',
      '防除剤を希釈',
      '散布機に投入',
      '葉の表裏に均一散布',
      '散布後の洗浄と保管'
    ],
    expectedOutcome: '病害虫の発生を予防し、作物の健康を維持',
    createdAt: '2024-01-15T08:00:00Z',
    dueDate: '2024-01-20T16:00:00Z',
    status: 'pending'
  },
  {
    id: '4',
    fieldId: 'field-a',
    fieldName: '圃場A',
    priority: 'low',
    category: 'maintenance',
    title: 'センサーメンテナンス',
    description: '水位センサーの定期メンテナンス時期です。清掃とキャリブレーションを実施してください。',
    estimatedDuration: '1-2時間',
    difficulty: 'easy',
    weatherDependency: false,
    equipment: ['清掃用具', 'キャリブレーション液', 'マルチメーター'],
    steps: [
      'センサーを安全に取り外し',
      '汚れを清掃',
      'キャリブレーション液で校正',
      '動作テストを実施',
      '元の位置に取り付け',
      'データ送信を確認'
    ],
    expectedOutcome: 'センサーの精度向上と信頼性確保',
    createdAt: '2024-01-14T16:00:00Z',
    dueDate: '2024-01-22T17:00:00Z',
    status: 'pending'
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'irrigation':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 'fertilization':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'pest_control':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'maintenance':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'harvest':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    default:
      return null;
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'irrigation':
      return '灌水';
    case 'fertilization':
      return '施肥';
    case 'pest_control':
      return '病害虫防除';
    case 'maintenance':
      return 'メンテナンス';
    case 'harvest':
      return '収穫';
    default:
      return category;
  }
};

export default function WorkSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<WorkSuggestion[]>(mockSuggestions);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'high' | 'pending'>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<WorkSuggestion | null>(null);

  const updateSuggestionStatus = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === id 
          ? { ...suggestion, status }
          : suggestion
      )
    );
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    switch (filter) {
      case 'urgent':
        return suggestion.priority === 'urgent';
      case 'high':
        return suggestion.priority === 'high' || suggestion.priority === 'urgent';
      case 'pending':
        return suggestion.status === 'pending';
      default:
        return true;
    }
  });

  const urgentCount = suggestions.filter(s => s.priority === 'urgent').length;
  const highPriorityCount = suggestions.filter(s => s.priority === 'high' || s.priority === 'urgent').length;
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">作業提案</h1>
          <p className="text-gray-600 mt-1">圃場の状況に応じた最適な作業ステップを提案します</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">緊急対応</p>
                <p className="text-2xl font-bold text-gray-900">{urgentCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm font-medium text-gray-500">未完了</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">総提案数</p>
                <p className="text-2xl font-bold text-gray-900">{suggestions.length}</p>
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
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'urgent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              緊急 ({urgentCount})
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
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'pending'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未完了 ({pendingCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 提案リスト */}
          <div className="space-y-4">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">該当する作業提案がありません</p>
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority === 'urgent' ? '緊急' : 
                           suggestion.priority === 'high' ? '高' : 
                           suggestion.priority === 'medium' ? '中' : '低'}
                        </span>
                        <div className="flex items-center text-gray-500">
                          {getCategoryIcon(suggestion.category)}
                          <span className="ml-1 text-sm">{getCategoryName(suggestion.category)}</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{suggestion.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>圃場: {suggestion.fieldName}</span>
                        <span>所要時間: {suggestion.estimatedDuration}</span>
                        {suggestion.dueDate && (
                          <span>期限: {new Date(suggestion.dueDate).toLocaleDateString('ja-JP')}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`w-3 h-3 rounded-full ${
                        suggestion.status === 'completed' ? 'bg-green-500' :
                        suggestion.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 詳細パネル */}
          <div className="lg:sticky lg:top-6">
            {selectedSuggestion ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedSuggestion.title}</h2>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedSuggestion.priority)}`}>
                    {selectedSuggestion.priority === 'urgent' ? '緊急' : 
                     selectedSuggestion.priority === 'high' ? '高' : 
                     selectedSuggestion.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">概要</h3>
                    <p className="text-sm text-gray-600">{selectedSuggestion.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">詳細情報</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">圃場:</span>
                        <span className="ml-2 font-medium">{selectedSuggestion.fieldName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">所要時間:</span>
                        <span className="ml-2 font-medium">{selectedSuggestion.estimatedDuration}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">難易度:</span>
                        <span className="ml-2 font-medium">
                          {selectedSuggestion.difficulty === 'easy' ? '簡単' : 
                           selectedSuggestion.difficulty === 'medium' ? '普通' : '難しい'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">天候依存:</span>
                        <span className="ml-2 font-medium">{selectedSuggestion.weatherDependency ? 'あり' : 'なし'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">必要な機材</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSuggestion.equipment.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">作業手順</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      {selectedSuggestion.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">期待される結果</h3>
                    <p className="text-sm text-gray-600">{selectedSuggestion.expectedOutcome}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateSuggestionStatus(selectedSuggestion.id, 'in_progress')}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        作業開始
                      </button>
                      <button
                        onClick={() => updateSuggestionStatus(selectedSuggestion.id, 'completed')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                      >
                        完了
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">作業提案を選択して詳細を確認してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

