# IoT Water Level Device Registry

水位センサーデバイスの登録と管理を行うWebアプリケーションです。

## 構成

- **バックエンド**: FastAPI (Python)
- **フロントエンド**: Next.js (React + TypeScript)
- **地図**: Leaflet + OpenStreetMap

## 起動方法

### 1. バックエンドの起動

```bash
# バックエンドディレクトリに移動
cd device-backend

# 依存関係をインストール
pip install -r requirements.txt

# サーバーを起動
uvicorn main:app --reload --host 0.0.0.0 --port 8003
```

バックエンドが起動すると、以下のURLでアクセスできます：
- API: http://localhost:8000
- API仕様書: http://localhost:8000/docs

### 2. フロントエンドの起動

新しいターミナルを開いて：

```bash
# フロントエンドディレクトリに移動
cd device-registry-frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

フロントエンドが起動すると、以下のURLでアクセスできます：
- アプリケーション: http://localhost:3000

## 使用方法

1. **ホームページ**: http://localhost:3000
   - アプリケーションの概要を表示
   - デバイス一覧とダッシュボードへのリンク

2. **デバイス一覧**: http://localhost:3000/devices
   - 登録可能なデバイス一覧を表示
   - デバイスを選択して位置登録ページへ移動

3. **位置登録**: http://localhost:3000/devices/claim?deviceId=DEVICE_ID
   - 地図をクリックしてデバイスの位置を選択
   - 選択した位置でデバイスを登録

4. **デバイス詳細**: http://localhost:3000/devices/{deviceId}
   - 個別デバイスの詳細情報を表示
   - 最新の水位データと履歴データを確認

5. **圃場監視ダッシュボード**: http://localhost:3000/dashboard
   - 全デバイスの水位状況を一覧表示
   - リアルタイムでの監視とアラート

## API エンドポイント

### デバイス関連

- `GET /devices` - デバイス一覧を取得
- `GET /devices/{deviceId}` - 特定のデバイス情報を取得
- `POST /devices/claim` - デバイスの位置を登録
- `GET /devices/{deviceId}/latest` - デバイスの最新メトリクスを取得
- `GET /devices/{deviceId}/history` - デバイスの履歴データを取得
- `GET /devices/stats` - 全デバイスの統計情報を取得

### API仕様書

- `GET /docs` - Swagger UI（詳細なAPI仕様書）
- `GET /redoc` - ReDoc（代替API仕様書）

## 必要な環境

- Python 3.10+
- Node.js 18+
- npm または yarn

## 依存関係

### バックエンド
- FastAPI 0.112.2
- Uvicorn 0.30.6
- Boto3 1.34.162
- Pydantic 2.8.2
- マルチユーザー対応（DeviceRegistryV2テーブル使用）

### フロントエンド
- Next.js 14.2.30
- React 18
- Leaflet 1.9.4
- React-Leaflet 4.2.1
- Tailwind CSS 3.4.1

## トラブルシューティング

### バックエンドが起動しない場合

1. 正しいディレクトリにいることを確認
   ```bash
   cd device-backend
   ```

2. 依存関係が正しくインストールされているか確認
   ```bash
   pip install -r requirements.txt
   ```

3. ポート8000が使用されていないか確認

### フロントエンドが起動しない場合

1. 正しいディレクトリにいることを確認
   ```bash
   cd device-registry-frontend
   ```

2. 依存関係が正しくインストールされているか確認
   ```bash
   npm install
   ```

3. ポート3000が使用されていないか確認

### 地図が表示されない場合

1. ブラウザのコンソールでエラーを確認
2. ネットワーク接続を確認（OpenStreetMapタイルの読み込み）
3. バックエンドが起動していることを確認

## 開発

### バックエンドの開発

- ファイルを編集すると自動的にリロードされます
- API仕様書は http://localhost:8000/docs で確認できます
- 開発ツール: `make help` で利用可能なコマンドを確認

```bash
# 開発サーバー起動
make dev

# テスト実行
make test

# コードフォーマット
make format

# リント実行
make lint

# 全てのチェック実行
make check
```

### フロントエンドの開発

- ファイルを編集すると自動的にリロードされます
- TypeScriptの型チェックが有効です
- Tailwind CSSでスタイリングされています
- 開発ツール: `make help` で利用可能なコマンドを確認

```bash
# 開発サーバー起動
make dev

# テスト実行
make test

# コードフォーマット
make format

# リント実行
make lint

# 型チェック
make type-check

# 全てのチェック実行
make check
```

### Docker開発環境

```bash
# バックエンド
cd device-backend
docker-compose up

# フロントエンド
cd device-registry-frontend
docker build -t iot-waterlevel-frontend .
docker run -p 3000:3000 iot-waterlevel-frontend
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
