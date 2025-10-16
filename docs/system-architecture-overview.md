# 農業IoT水位監視システム - 全体システム構成

## 📋 概要

本研究プロジェクトは、IoT水位センサーによるリアルタイム監視から、機械学習による異常検知、LLMによる農業アドバイスまでを含む包括的な農業IoTシステムです。

## 🏗️ システム全体アーキテクチャ

### 現在の実装（Phase 1）

```mermaid
graph TB
    subgraph "IoTデバイス層"
        A[M5Stack水位センサー<br/>ID: 440525060026078] --> B[AWS IoT Core]
    end
    
    subgraph "データ収集・ストレージ層"
        B --> C[Timestream<br/>時系列データベース]
        B --> D[DynamoDB<br/>デバイス管理]
        E[UserRegistry<br/>ユーザー管理] --> D
        F[DeviceMaster<br/>デバイスマスター] --> D
        G[DeviceRegistryV2<br/>ユーザー-デバイス関係] --> D
    end
    
    subgraph "認証・セキュリティ層"
        H[AWS Cognito<br/>ユーザープール] --> I[JWT認証]
        I --> J[HttpOnly Cookie<br/>セキュアトークン管理]
    end
    
    subgraph "バックエンドAPI層"
        K[FastAPI<br/>Python 3.10] --> L[認証エンドポイント<br/>/api/v1/auth/*]
        K --> M[デバイスエンドポイント<br/>/api/v1/devices/*]
        K --> N[CSRF保護<br/>セキュリティヘッダー]
        K --> O[CORS設定<br/>クロスオリジン対応]
    end
    
    subgraph "フロントエンド層"
        P[Next.js 14<br/>React 18] --> Q[ダッシュボード<br/>統計・地図表示]
        P --> R[デバイス管理<br/>登録・詳細表示]
        P --> S[認証画面<br/>ログイン・新規登録]
        P --> T[地図表示<br/>Leaflet + React-Leaflet]
    end
    
    subgraph "データフロー"
        C --> U[リアルタイム水位データ]
        D --> V[デバイス状態管理]
        H --> W[ユーザー認証]
        K --> X[RESTful API]
        P --> Y[レスポンシブUI]
    end
    
    %% 接続関係
    A -.->|MQTT| B
    B -.->|データ送信| C
    K -.->|認証| H
    K -.->|データ取得| C
    K -.->|データ取得| D
    P -.->|API呼び出し| K
    P -.->|認証| H
    T -.->|地図表示| U
    Q -.->|統計表示| V
```

### 将来の拡張構成（Phase 2-4）

```mermaid
graph TB
    subgraph "IoTデバイス層（拡張）"
        A1[水位センサー] --> A2[土壌センサー]
        A2 --> A3[気象センサー]
        A3 --> A4[カメラセンサー]
        A4 --> A5[環境センサー]
    end
    
    subgraph "データ収集・ストレージ層（拡張）"
        B1[AWS IoT Core] --> B2[Kinesis Data Streams]
        B2 --> B3[Timestream<br/>時系列データ]
        B3 --> B4[S3<br/>画像・ファイル]
        B4 --> B5[RDS PostgreSQL<br/>圃場・作物情報]
        B5 --> B6[ElastiCache<br/>キャッシュ]
    end
    
    subgraph "機械学習・AI層"
        C1[Lambda Functions<br/>データ前処理] --> C2[SageMaker<br/>ML パイプライン]
        C2 --> C3[Prophet<br/>時系列予測]
        C3 --> C4[異常検知モデル<br/>Isolation Forest/LSTM]
        C4 --> C5[特徴抽出エンジン]
        C5 --> C6[Bedrock Claude<br/>農業アドバイス生成]
    end
    
    subgraph "通知・連携層"
        D1[SNS/SES<br/>通知サービス] --> D2[EventBridge<br/>イベント駆動]
        D2 --> D3[Lambda<br/>アラート処理]
        D3 --> D4[外部システム連携<br/>気象API・農業DB]
    end
    
    subgraph "フロントエンド層（拡張）"
        E1[ダッシュボード<br/>統計・地図] --> E2[圃場管理<br/>圃場別詳細]
        E2 --> E3[異常検知<br/>アラート管理]
        E3 --> E4[AIアドバイス<br/>農業指導]
        E4 --> E5[データ分析<br/>可視化・予測]
        E5 --> E6[設定管理<br/>システム設定]
    end
    
    subgraph "データフロー（拡張）"
        F1[リアルタイムデータ収集] --> F2[ストリーミング処理]
        F2 --> F3[機械学習推論]
        F3 --> F4[異常検知・予測]
        F4 --> F5[LLM処理]
        F5 --> F6[アドバイス生成]
        F6 --> F7[通知配信]
    end
    
    %% 接続関係
    A1 -.->|MQTT/HTTP| B1
    B1 -.->|ストリーミング| B2
    B2 -.->|データ保存| B3
    C1 -.->|データ処理| B3
    C2 -.->|モデル訓練| C3
    C4 -.->|異常検知| D3
    C6 -.->|アドバイス生成| E4
    D1 -.->|通知配信| E3
    E1 -.->|データ表示| F1
```

## 🔧 技術スタック詳細

### 現在の技術構成

```mermaid
graph LR
    subgraph "フロントエンド"
        A1[Next.js 14] --> A2[React 18]
        A2 --> A3[TypeScript]
        A3 --> A4[Tailwind CSS]
        A4 --> A5[Leaflet Maps]
    end
    
    subgraph "バックエンド"
        B1[FastAPI] --> B2[Python 3.10]
        B2 --> B3[Pydantic]
        B3 --> B4[Boto3]
        B4 --> B5[python-jose]
    end
    
    subgraph "AWS サービス"
        C1[Cognito] --> C2[Timestream]
        C2 --> C3[DynamoDB]
        C3 --> C4[IoT Core]
    end
    
    subgraph "認証・セキュリティ"
        D1[JWT] --> D2[HttpOnly Cookies]
        D2 --> D3[CSRF Protection]
        D3 --> D4[CORS]
    end
```

### 将来の技術構成

```mermaid
graph LR
    subgraph "機械学習"
        A1[SageMaker] --> A2[Prophet]
        A2 --> A3[scikit-learn]
        A3 --> A4[PyTorch/TensorFlow]
    end
    
    subgraph "AI・LLM"
        B1[Bedrock] --> B2[Claude 3.5]
        B2 --> B3[Text Embeddings]
        B3 --> B4[Knowledge Base]
    end
    
    subgraph "データ処理"
        C1[Lambda] --> C2[Kinesis]
        C2 --> C3[EventBridge]
        C3 --> C4[ECS/Fargate]
    end
    
    subgraph "ストレージ"
        D1[S3] --> D2[RDS]
        D2 --> D3[ElastiCache]
        D3 --> D4[Timestream]
    end
```

## 📊 データフロー図

### 現在のデータフロー

```mermaid
sequenceDiagram
    participant M5 as M5Stackセンサー
    participant IoT as AWS IoT Core
    participant TS as Timestream
    participant DB as DynamoDB
    participant API as FastAPI
    participant FE as Next.js
    participant User as ユーザー
    
    M5->>IoT: 水位データ送信
    IoT->>TS: 時系列データ保存
    User->>FE: ログイン
    FE->>API: 認証リクエスト
    API->>DB: ユーザー情報取得
    DB-->>API: ユーザー情報
    API-->>FE: JWT トークン
    FE->>API: デバイス一覧取得
    API->>DB: デバイス情報取得
    API->>TS: 水位データ取得
    TS-->>API: 時系列データ
    API-->>FE: デバイス・データ
    FE-->>User: ダッシュボード表示
```

### 将来のデータフロー（異常検知・アドバイス）

```mermaid
sequenceDiagram
    participant Sensor as 各種センサー
    participant IoT as IoT Core
    participant Stream as Kinesis
    participant ML as SageMaker
    participant LLM as Bedrock
    participant Alert as SNS
    participant API as FastAPI
    participant FE as Next.js
    participant User as ユーザー
    
    Sensor->>IoT: センサーデータ送信
    IoT->>Stream: ストリーミングデータ
    Stream->>ML: リアルタイム処理
    ML->>ML: 異常検知実行
    
    alt 異常検知
        ML->>Alert: アラート通知
        Alert->>User: 緊急通知
        ML->>LLM: 状況分析依頼
        LLM->>LLM: 農業アドバイス生成
        LLM->>API: アドバイス送信
        API->>FE: アドバイス配信
        FE->>User: 推奨アクション表示
    else 正常
        ML->>API: 定期レポート
        API->>FE: データ更新
        FE->>User: ダッシュボード更新
    end
```

## 🗄️ データベース設計

### 現在のテーブル構成

```mermaid
erDiagram
    UserRegistry {
        string userId PK
        string email
        string firstName
        string lastName
        string username
        string organization
        string role
        datetime createdAt
        datetime updatedAt
        boolean isActive
    }
    
    DeviceMaster {
        string deviceId PK
        string label
        string description
        string location
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    DeviceRegistryV2 {
        string userId PK
        string deviceId PK
        string label
        string fieldId
        decimal lat
        decimal lon
        string claimStatus
        datetime createdAt
        datetime updatedAt
    }
    
    Timestream {
        string deviceId
        datetime time
        double distance
        string measure_name
    }
    
    UserRegistry ||--o{ DeviceRegistryV2 : "owns"
    DeviceMaster ||--o{ DeviceRegistryV2 : "registered_as"
    DeviceRegistryV2 ||--o{ Timestream : "generates"
```

### 将来のテーブル構成

```mermaid
erDiagram
    Fields {
        string field_id PK
        string user_id FK
        string field_name
        string crop_type
        string soil_type
        decimal area_hectares
        decimal location_lat
        decimal location_lon
        string climate_zone
        datetime created_at
        datetime updated_at
    }
    
    FieldSensors {
        string sensor_id PK
        string field_id FK
        string sensor_type
        decimal position_lat
        decimal position_lon
        date installation_date
        string status
    }
    
    AnomalyDetections {
        string detection_id PK
        string field_id FK
        string sensor_id FK
        string anomaly_type
        string severity
        decimal confidence_score
        datetime detected_at
        datetime resolved_at
        text description
    }
    
    AgriculturalAdvice {
        string advice_id PK
        string field_id FK
        string user_id FK
        string advice_type
        string priority
        string title
        text description
        json steps
        string timing
        json tools
        text precautions
        text expected_outcome
        datetime generated_at
        datetime implemented_at
        integer feedback_rating
        text feedback_comment
    }
    
    Fields ||--o{ FieldSensors : "has"
    Fields ||--o{ AnomalyDetections : "detects"
    Fields ||--o{ AgriculturalAdvice : "receives"
    FieldSensors ||--o{ AnomalyDetections : "triggers"
```

## 🔐 セキュリティアーキテクチャ

```mermaid
graph TB
    subgraph "認証・認可"
        A1[ユーザー] --> A2[Next.js Frontend]
        A2 --> A3[Cognito User Pool]
        A3 --> A4[JWT Token]
        A4 --> A5[HttpOnly Cookie]
        A5 --> A6[FastAPI Backend]
    end
    
    subgraph "セキュリティ対策"
        B1[CSRF Protection] --> B2[XSS Prevention]
        B2 --> B3[Security Headers]
        B3 --> B4[CORS Configuration]
        B4 --> B5[Input Validation]
    end
    
    subgraph "データ保護"
        C1[Encryption in Transit] --> C2[Encryption at Rest]
        C2 --> C3[IAM Roles]
        C3 --> C4[VPC Security Groups]
        C4 --> C5[Private Subnets]
    end
    
    A6 --> B1
    B5 --> C1
```

## 📈 スケーラビリティ設計

```mermaid
graph TB
    subgraph "水平スケーリング"
        A1[Application Load Balancer] --> A2[FastAPI Instance 1]
        A1 --> A3[FastAPI Instance 2]
        A1 --> A4[FastAPI Instance N]
    end
    
    subgraph "データベーススケーリング"
        B1[DynamoDB] --> B2[Auto Scaling]
        B2 --> B3[Read Replicas]
        B3 --> B4[Global Tables]
    end
    
    subgraph "キャッシュ層"
        C1[ElastiCache Redis] --> C2[Session Store]
        C2 --> C3[API Response Cache]
        C3 --> C4[ML Model Cache]
    end
    
    subgraph "CDN・静的配信"
        D1[CloudFront] --> D2[S3 Static Assets]
        D2 --> D3[Next.js Build Files]
        D3 --> D4[Image Optimization]
    end
    
    A2 --> B1
    A3 --> C1
    A4 --> D1
```

## 🚀 デプロイメント・運用

```mermaid
graph LR
    subgraph "CI/CD Pipeline"
        A1[GitHub] --> A2[GitHub Actions]
        A2 --> A3[Build & Test]
        A3 --> A4[Deploy to AWS]
    end
    
    subgraph "監視・ログ"
        B1[CloudWatch] --> B2[Logs]
        B2 --> B3[Metrics]
        B3 --> B4[Alarms]
    end
    
    subgraph "バックアップ・災害復旧"
        C1[Automated Backups] --> C2[Cross-Region Replication]
        C2 --> C3[Point-in-Time Recovery]
        C3 --> C4[Disaster Recovery Plan]
    end
    
    A4 --> B1
    B4 --> C1
```

## 📊 パフォーマンス指標

### 現在の目標値

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| API応答時間 | < 200ms | CloudWatch |
| ページ読み込み時間 | < 2秒 | Lighthouse |
| システム稼働率 | > 99.9% | CloudWatch |
| 同時接続数 | 1000+ | Load Testing |

### 将来の目標値

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| 異常検知精度 | > 95% | ML Metrics |
| 予測精度 | > 90% | Prophet MAE |
| アドバイス実装率 | > 80% | User Analytics |
| リアルタイム処理遅延 | < 5秒 | End-to-End |

---

このシステム構成図は、現在の実装から将来の拡張までを包括的に示しており、段階的な発展を可能にする設計となっています。
