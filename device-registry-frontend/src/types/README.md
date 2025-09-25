# 型定義ファイル

このディレクトリには、アプリケーション全体で使用される型定義が含まれています。

## ファイル構成

### `device.ts`
デバイス関連の型定義
- `Device`: デバイス基本情報
- `DeviceStats`: ダッシュボード用デバイス統計情報
- `DeviceDetail`: デバイス詳細情報
- `LatestMetric`: 最新測定データ
- `HistoryData`: 履歴データ
- `DeviceHistory`: デバイス履歴レスポンス
- `DashboardData`: ダッシュボードデータ

### `auth.ts`
認証関連の型定義
- `User`: ユーザー情報
- `LoginRequest`: ログインリクエスト
- `RegisterRequest`: 登録リクエスト
- `AuthResponse`: 認証レスポンス
- `AuthState`: 認証状態

### `api.ts`
API関連の型定義
- `ApiResponse`: APIレスポンス
- `ApiError`: APIエラー
- `PaginationParams`: ページネーションパラメータ
- `PaginatedResponse`: ページネーション付きレスポンス

### `index.ts`
型定義のエクスポートファイル

## 使用方法

```typescript
import { Device, DeviceStats, User } from '@/types';
```

## ベストプラクティス

1. **型の再利用**: 共通の型は適切に抽象化する
2. **命名規則**: インターフェースは大文字で始める
3. **オプショナル**: 必須でないプロパティは `?` を使用
4. **ドキュメント**: 複雑な型にはJSDocコメントを追加
5. **バージョニング**: API変更時は型定義も更新する
