'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  suggestions?: string[];
}

// ダミーのAI応答データ
const getAIResponse = (userMessage: string): ChatMessage => {
  const responses = [
    {
      message: "水位が低い状況ですね。緊急対応として、以下の手順をお勧めします：\n\n1. 手動での緊急灌水\n2. 灌水システムの点検\n3. 土壌の状態確認\n\n詳細な作業手順を表示しますか？",
      suggestions: ["緊急灌水の手順", "灌水システムの点検方法", "土壌状態の確認方法"]
    },
    {
      message: "土壌湿度が30%を下回っている場合、以下の対策が効果的です：\n\n• 早朝または夕方の灌水\n• マルチングの実施\n• 灌水頻度の調整\n\n圃場の詳細データを確認して、最適な灌水計画を立てましょう。",
      suggestions: ["灌水計画の作成", "マルチングの方法", "圃場データの確認"]
    },
    {
      message: "デバイスのメンテナンス時期ですね。定期メンテナンスのチェックリストをご案内します：\n\n• センサーの清掃\n• バッテリー状態の確認\n• 通信テスト\n• キャリブレーション\n\nメンテナンス手順を詳しく説明しますか？",
      suggestions: ["メンテナンス手順", "センサー清掃方法", "バッテリー交換手順"]
    },
    {
      message: "圃場の状態を総合的に分析した結果、以下の作業が推奨されます：\n\n• 土壌pHの調整（現在6.2 → 推奨6.5-7.0）\n• 有機肥料の追加\n• 雑草除去\n• 病害虫の予防散布\n\n各作業の詳細な手順をお伝えします。",
      suggestions: ["土壌pH調整方法", "有機肥料の選び方", "病害虫予防対策"]
    }
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    id: Date.now().toString(),
    type: 'ai',
    message: randomResponse.message,
    timestamp: new Date().toISOString(),
    suggestions: randomResponse.suggestions
  };
};

// ダミーのチャット履歴
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'user',
    message: '水位が危険レベルまで下がっています。どうすればいいですか？',
    timestamp: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    type: 'ai',
    message: '水位が低い状況ですね。緊急対応として、以下の手順をお勧めします：\n\n1. 手動での緊急灌水\n2. 灌水システムの点検\n3. 土壌の状態確認\n\n詳細な作業手順を表示しますか？',
    timestamp: '2024-01-15T14:30:15Z',
    suggestions: ['緊急灌水の手順', '灌水システムの点検方法', '土壌状態の確認方法']
  },
  {
    id: '3',
    type: 'user',
    message: '緊急灌水の手順を教えてください',
    timestamp: '2024-01-15T14:32:00Z'
  },
  {
    id: '4',
    type: 'ai',
    message: '緊急灌水の手順をご説明します：\n\n【緊急灌水手順】\n1. 灌水バルブを手動で開く\n2. 水量を確認しながら灌水開始\n3. 土壌の浸透状況を監視\n4. 適切な水位まで達したら停止\n5. システムの自動復旧を確認\n\n注意：過度な灌水は根腐れの原因となるため、適量を心がけてください。',
    timestamp: '2024-01-15T14:32:20Z'
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // ダミーのAI応答をシミュレート
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI農業アシスタント</h1>
          <p className="text-gray-600 mt-1">自然言語で農業に関する質問や相談ができます</p>
        </div>

        {/* チャットエリア */}
        <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex flex-col">
          {/* メッセージリスト */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.message}</div>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleString('ja-JP')}
                  </div>
                  
                  {/* AI応答の提案ボタン */}
                  {message.type === 'ai' && message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600">関連する質問：</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-2 py-1 bg-white text-gray-700 rounded-full border border-gray-300 hover:bg-gray-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* ローディング表示 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="農業に関する質問や相談を入力してください..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            {/* クイック質問ボタン */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">よくある質問：</p>
              <div className="flex flex-wrap gap-2">
                {[
                  '水位が低い時の対処法',
                  '土壌湿度の最適値',
                  '灌水のタイミング',
                  'デバイスのメンテナンス方法'
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 機能説明 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="ml-3 font-medium text-gray-900">自然言語対応</h3>
            </div>
            <p className="text-sm text-gray-600">日本語で自然な会話のように農業の相談ができます</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="ml-3 font-medium text-gray-900">リアルタイム提案</h3>
            </div>
            <p className="text-sm text-gray-600">圃場の状況に応じた具体的な作業提案を提供します</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="ml-3 font-medium text-gray-900">学習機能</h3>
            </div>
            <p className="text-sm text-gray-600">過去のデータから最適な農業手法を学習し提案します</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

