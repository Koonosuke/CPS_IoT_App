# 認証システム完全ガイド

## 目次
1. [システム概要](#システム概要)
2. [基礎知識](#基礎知識)
3. [アーキテクチャ](#アーキテクチャ)
4. [バックエンド実装](#バックエンド実装)
5. [フロントエンド実装](#フロントエンド実装)
6. [セキュリティ機能](#セキュリティ機能)
7. [認証フロー詳細](#認証フロー詳細)
8. [使用箇所一覧](#使用箇所一覧)
9. [トラブルシューティング](#トラブルシューティング)
10. [ベストプラクティス](#ベストプラクティス)

---

## システム概要

### 認証方式
本システムは**JWT（JSON Web Token）ベースの認証**を採用し、AWS Cognito User Poolを認証プロバイダーとして使用しています。

### 技術スタック
- **認証プロバイダー**: AWS Cognito User Pool
- **トークン形式**: JWT (JSON Web Token)
- **トークン保存**: HttpOnly Cookie（セキュリティ強化済み）
- **フロントエンド**: Next.js + React Context
- **バックエンド**: FastAPI + Python
- **セキュリティ**: CSRF保護、XSS対策、セキュリティヘッダー

### セキュリティレベル
- **エンタープライズレベル**: 本番環境での使用に適したセキュリティ実装
- **OWASP準拠**: 主要なセキュリティ脆弱性に対応

---

## 基礎知識

### 1. JWT（JSON Web Token）とは

JWTは、JSON形式で情報を安全に伝送するためのオープンスタンダード（RFC 7519）です。

#### JWTの構造
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgH58ERTq8y0Vf3_6Lt8Fc49-F8DpEFsgSQ2_R5FoET92ZqhKkddrq3yBh8YNgw2ZIvzhu3jVU
```

**3つの部分に分かれています：**
1. **Header（ヘッダー）**: アルゴリズムとトークンタイプ
2. **Payload（ペイロード）**: クレーム（情報）
3. **Signature（署名）**: 検証用の署名

#### JWTの特徴
- **自己完結型**: トークン内に必要な情報が含まれる
- **ステートレス**: サーバー側でセッション管理が不要
- **スケーラブル**: 複数のサーバー間で共有可能
- **標準化**: 業界標準の形式

### 2. AWS Cognitoとは

AWS Cognitoは、ユーザー認証、認可、ユーザー管理を提供するマネージドサービスです。

#### 主要コンポーネント
- **User Pool**: ユーザーディレクトリと認証機能
- **Identity Pool**: AWSリソースへのアクセス認可
- **App Client**: アプリケーション固有の設定

#### Cognitoの利点
- **マネージドサービス**: インフラ管理が不要
- **スケーラビリティ**: 自動スケーリング
- **セキュリティ**: AWSのセキュリティ機能を活用
- **標準準拠**: OAuth 2.0、OpenID Connect対応

### 3. HttpOnly Cookieとは

HttpOnly Cookieは、JavaScriptからアクセスできないCookieです。

#### 特徴
- **XSS攻撃対策**: JavaScriptからアクセス不可
- **セキュリティ向上**: トークン漏洩リスクの軽減
- **自動送信**: ブラウザが自動的に送信

#### 設定例
```python
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,      # JavaScriptからアクセス不可
    secure=True,        # HTTPS環境でのみ送信
    samesite="strict",  # CSRF保護
    max_age=3600,       # 有効期限（秒）
    path="/"            # 適用パス
)
```

### 4. CSRF（Cross-Site Request Forgery）とは

CSRFは、ユーザーが意図しないリクエストを送信させられる攻撃です。

#### 対策
- **CSRFトークン**: リクエストごとに一意のトークンを生成
- **SameSite Cookie**: クロスサイトリクエストを制限
- **Origin/Referer チェック**: リクエスト元を検証

---

## アーキテクチャ

### システム構成図

```mermaid
graph TB
    subgraph "フロントエンド (Next.js)"
        A[React Context] --> B[Auth API Client]
        B --> C[HttpOnly Cookies]
        D[AuthGuard] --> A
        E[Login Page] --> A
        F[Protected Pages] --> D
    end
    
    subgraph "バックエンド (FastAPI)"
        G[Auth Endpoints] --> H[Cognito Client]
        I[JWT Validator] --> J[JWKS Cache]
        K[CSRF Middleware] --> L[Security Headers]
        M[Auth Dependencies] --> I
    end
    
    subgraph "AWS Cognito"
        N[User Pool] --> O[JWKS Endpoint]
        P[Authentication] --> Q[JWT Tokens]
    end
    
    A --> G
    B --> G
    H --> N
    I --> O
    G --> M
    K --> G
    L --> G
```

### データフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant C as Cognito
    participant A as API

    U->>F: ログイン情報入力
    F->>B: POST /auth/login
    B->>C: 認証リクエスト
    C-->>B: JWTトークン
    B->>B: HttpOnly Cookie設定
    B-->>F: ログイン成功
    F->>A: API呼び出し (Cookie自動送信)
    A->>B: トークン検証
    B-->>A: 認証結果
    A-->>F: レスポンス
```

---

## バックエンド実装

### 1. 認証設定 (`app/auth/config.py`)

```python
class CognitoConfig(BaseSettings):
    """Cognito設定"""
    
    # Cognito User Pool設定
    user_pool_id: str = Field(default="", alias="COGNITO_USER_POOL_ID")
    client_id: str = Field(default="", alias="COGNITO_CLIENT_ID")
    region: str = Field(default="us-east-1", alias="COGNITO_REGION")
    domain: str = Field(default="", alias="COGNITO_DOMAIN")
    
    # JWT設定
    jwks_url: Optional[str] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.user_pool_id:
            self.jwks_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
```

**重要なポイント：**
- **環境変数**: 設定情報を環境変数で管理
- **JWKS URL**: JWT検証用の公開鍵エンドポイント
- **Pydantic**: 型安全性とバリデーション

### 2. JWT検証 (`app/auth/jwt_handler.py`)

```python
class CognitoJWTValidator:
    """Cognito JWT検証クラス"""
    
    def __init__(self):
        self.jwks_cache = {}           # JWKSキャッシュ
        self.jwks_cache_time = 0       # キャッシュ時刻
        self.cache_duration = 3600     # キャッシュ有効期限（1時間）
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """JWTトークンを検証してペイロードを返す"""
        try:
            # 1. 公開鍵を取得
            public_key = self._get_public_key(token)
            
            # 2. JWTを検証
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=cognito_config.client_id,
                issuer=f"https://cognito-idp.{cognito_config.region}.amazonaws.com/{cognito_config.user_pool_id}"
            )
            
            # 3. 有効期限チェック
            current_time = time.time()
            if payload.get('exp', 0) < current_time:
                raise CognitoJWTError("トークンの有効期限が切れています")
            
            return payload
            
        except JWTError as e:
            raise CognitoJWTError(f"JWT検証エラー: {str(e)}")
```

**重要なポイント：**
- **JWKSキャッシュ**: 公開鍵の取得を最適化
- **署名検証**: RS256アルゴリズムで署名を検証
- **有効期限チェック**: トークンの有効期限を確認
- **Audience/Issuer検証**: トークンの発行者と対象者を検証

### 3. 認証エンドポイント (`app/auth/endpoints.py`)

#### ログインエンドポイント
```python
@router.post("/login", summary="ユーザーログイン")
async def login(request: LoginRequest, response: Response):
    """ユーザーログイン"""
    try:
        # 1. Cognitoで認証
        cognito_response = cognito_client.initiate_auth(
            ClientId=cognito_config.client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': request.email,
                'PASSWORD': request.password
            }
        )
        
        auth_result = cognito_response['AuthenticationResult']
        
        # 2. HttpOnly Cookieにトークンを設定
        response.set_cookie(
            key="access_token",
            value=auth_result['AccessToken'],
            httponly=True,
            secure=True,        # HTTPS環境でのみ送信
            samesite="strict",  # CSRF保護
            max_age=auth_result['ExpiresIn'],
            path="/"
        )
        
        # 3. レスポンス返却
        return {
            "message": "ログイン成功",
            "user": {
                "email": request.email,
                "access_token": "HttpOnly Cookieに設定済み"
            }
        }
        
    except ClientError as e:
        raise HTTPException(status_code=401, detail="認証に失敗しました")
```

**重要なポイント：**
- **HttpOnly Cookie**: トークンを安全に保存
- **Secure Flag**: HTTPS環境でのみ送信
- **SameSite**: CSRF攻撃を防止
- **有効期限**: Cognitoの設定に従う

#### ログアウトエンドポイント
```python
@router.post("/logout", summary="ログアウト")
async def logout(response: Response):
    """ユーザーログアウト（Cookieを削除）"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="id_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="csrf_token", path="/")
    return {"message": "ログアウトしました"}
```

#### CSRFトークンエンドポイント
```python
@router.get("/csrf-token", summary="CSRFトークン取得")
async def get_csrf_token(response: Response):
    """CSRFトークンを生成してCookieに設定"""
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=3600,  # 1時間
        path="/"
    )
    return {"csrf_token": csrf_token}
```

### 4. 認証依存関係 (`app/auth/dependencies.py`)

```python
async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Dict[str, Any]:
    """現在のユーザーを取得"""
    token = None
    
    # 1. HttpOnly Cookieからトークンを取得
    access_token = request.cookies.get('access_token')
    if access_token:
        token = access_token
    # 2. Bearer Tokenから取得（フォールバック）
    elif credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンがありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # 3. JWTトークンを検証
        payload = jwt_validator.verify_token(token)
        user_info = jwt_validator.get_user_info(token)
        
        return user_info
        
    except CognitoJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"認証に失敗しました: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

**重要なポイント：**
- **Cookie優先**: HttpOnly Cookieを優先的に使用
- **Bearer Token対応**: フォールバック機能
- **JWT検証**: トークンの有効性を確認
- **エラーハンドリング**: 適切なHTTPステータスコード

### 5. セキュリティミドルウェア (`main.py`)

#### セキュリティヘッダー
```python
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # セキュリティヘッダーを設定
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # HTTPS環境でのみHSTSヘッダーを設定
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response
```

#### CSRF保護
```python
@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    # GET/HEAD/OPTIONSリクエストは除外
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return await call_next(request)
    
    # ログインエンドポイントは除外
    if request.url.path.startswith("/api/v1/auth/login"):
        return await call_next(request)
    
    # CSRFトークンをチェック
    csrf_token_header = request.headers.get("X-CSRF-Token")
    csrf_token_cookie = request.cookies.get("csrf_token")
    
    if not csrf_token_header or not csrf_token_cookie:
        return Response(
            content='{"detail": "CSRF token missing"}',
            status_code=403,
            media_type="application/json"
        )
    
    if csrf_token_header != csrf_token_cookie:
        return Response(
            content='{"detail": "CSRF token mismatch"}',
            status_code=403,
            media_type="application/json"
        )
    
    return await call_next(request)
```

---

## フロントエンド実装

### 1. 認証コンテキスト (`contexts/AuthContext.tsx`)

#### 状態管理
```typescript
// 認証状態の型定義
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  tokens: null; // HttpOnly Cookieを使用するため、フロントエンドではトークンを保持しない
}

// アクション型定義
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: null } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' };
```

#### リデューサー
```typescript
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: null, // HttpOnly Cookieを使用
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}
```

#### 認証初期化
```typescript
useEffect(() => {
  const initializeAuth = async () => {
    try {
      // HttpOnly Cookieから認証状態を確認
      const user = await authApi.getMe();
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          tokens: null, // HttpOnly Cookieを使用するため、フロントエンドではトークンを保持しない
        },
      });
    } catch (error) {
      // 認証されていない場合
      dispatch({ type: 'AUTH_FAILURE', payload: '' });
    }
  };

  initializeAuth();
}, []);
```

#### ログイン機能
```typescript
const login = async (request: LoginRequest) => {
  try {
    dispatch({ type: 'AUTH_START' });
    
    // HttpOnly Cookieを使用してログイン
    await authApi.login(request);
    
    // ユーザー情報を取得
    const user = await authApi.getMe();
    
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { 
        user, 
        tokens: null // HttpOnly Cookieを使用するため、フロントエンドではトークンを保持しない
      },
    });
  } catch (error) {
    const message = error instanceof AuthApiError ? error.message : 'ログインに失敗しました';
    dispatch({ type: 'AUTH_FAILURE', payload: message });
    throw error;
  }
};
```

### 2. 認証APIクライアント (`lib/auth-api.ts`)

#### CSRFトークン管理
```typescript
class AuthApiClient {
  private async getCsrfToken(): Promise<string> {
    const response = await fetch(this.getUrl('/auth/csrf-token'), {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new AuthApiError('CSRFトークンの取得に失敗しました', response.status);
    }
    
    const data = await response.json();
    return data.csrf_token;
  }

  private async request<T>(method: string, path: string, data?: any, requireCsrf: boolean = true): Promise<T> {
    const url = this.getUrl(path);
    
    let csrfToken: string | undefined;
    if (requireCsrf && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      csrfToken = await this.getCsrfToken();
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      },
      credentials: 'include', // HttpOnly Cookieを含める
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(
        errorData.detail || response.statusText,
        response.status,
        errorData.detail
      );
    }

    return response.json();
  }
}
```

**重要なポイント：**
- **自動CSRFトークン取得**: POST/PUT/DELETEリクエストで自動取得
- **credentials: 'include'**: HttpOnly Cookieを自動送信
- **エラーハンドリング**: 適切なエラーメッセージ

### 3. 認証ガード (`components/AuthGuard.tsx`)

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-700">
            ログインページに移動
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 4. 一般APIクライアント (`lib/api.ts`)

```typescript
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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
```

---

## セキュリティ機能

### 1. XSS（Cross-Site Scripting）対策

#### HttpOnly Cookie
```python
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,  # JavaScriptからアクセス不可
    secure=True,    # HTTPS環境でのみ送信
    samesite="strict"  # クロスサイトリクエストを制限
)
```

#### セキュリティヘッダー
```python
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-XSS-Protection"] = "1; mode=block"
```

### 2. CSRF（Cross-Site Request Forgery）対策

#### CSRFトークン
```python
# サーバー側
csrf_token = secrets.token_urlsafe(32)
response.set_cookie(
    key="csrf_token",
    value=csrf_token,
    httponly=True,
    secure=True,
    samesite="strict"
)

# クライアント側
headers: {
    'X-CSRF-Token': csrfToken
}
```

#### SameSite Cookie
```python
response.set_cookie(
    key="access_token",
    value=token,
    samesite="strict"  # 同一サイトからのリクエストのみ許可
)
```

### 3. セッション管理

#### トークン有効期限
```python
# Cognitoの設定に従う
max_age=auth_result['ExpiresIn']  # 通常1時間
```

#### 自動ログアウト
```typescript
// フロントエンドでの有効期限チェック
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};
```

### 4. 入力検証

#### バックエンド（Pydantic）
```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
```

#### フロントエンド（React Hook Form）
```typescript
const schema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});
```

---

## 認証フロー詳細

### 1. ユーザー登録フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant C as Cognito

    U->>F: 登録情報入力
    F->>B: POST /api/v1/auth/signup
    B->>C: cognito.sign_up()
    C-->>B: 登録完了
    B-->>F: 確認コード送信
    F-->>U: 確認コード入力画面
    U->>F: 確認コード入力
    F->>B: POST /api/v1/auth/confirm-signup
    B->>C: cognito.confirm_sign_up()
    C-->>B: 確認完了
    B-->>F: 登録完了
    F-->>U: ログインページへリダイレクト
```

### 2. ログインフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant C as Cognito

    U->>F: ログイン情報入力
    F->>B: POST /api/v1/auth/login
    B->>C: cognito.initiate_auth()
    C-->>B: JWTトークン
    B->>B: HttpOnly Cookie設定
    B-->>F: ログイン成功
    F->>F: 認証状態更新
    F-->>U: ダッシュボード表示
```

### 3. API呼び出しフロー

```mermaid
sequenceDiagram
    participant F as フロントエンド
    participant B as バックエンド
    participant C as Cognito

    F->>B: API呼び出し (Cookie自動送信)
    B->>B: Cookieからトークン取得
    B->>C: JWKS取得
    C-->>B: 公開鍵
    B->>B: JWT検証
    B->>B: 認証成功
    B-->>F: APIレスポンス
```

### 4. ログアウトフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド

    U->>F: ログアウトボタンクリック
    F->>B: POST /api/v1/auth/logout
    B->>B: Cookie削除
    B-->>F: ログアウト完了
    F->>F: 認証状態クリア
    F-->>U: ログインページ表示
```

---

## 使用箇所一覧

### バックエンド

#### 1. 認証モジュール (`app/auth/`)
- **`__init__.py`**: モジュールの公開API
- **`config.py`**: Cognito設定管理
- **`models.py`**: Pydanticモデル定義
- **`endpoints.py`**: 認証エンドポイント
- **`dependencies.py`**: 認証依存関係
- **`jwt_handler.py`**: JWT検証ロジック

#### 2. メインアプリケーション (`main.py`)
- **セキュリティヘッダーミドルウェア**: XSS対策
- **CSRF保護ミドルウェア**: CSRF対策
- **CORS設定**: クロスオリジンリクエスト対応

#### 3. 環境変数 (`.env`)
```bash
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
COGNITO_DOMAIN=your-domain
```

### フロントエンド

#### 1. 認証コンテキスト (`contexts/AuthContext.tsx`)
- **状態管理**: 認証状態の管理
- **アクション**: ログイン、ログアウト、エラー処理
- **初期化**: アプリケーション起動時の認証確認

#### 2. 認証APIクライアント (`lib/auth-api.ts`)
- **CSRFトークン管理**: 自動取得・送信
- **HttpOnly Cookie**: 自動送信
- **エラーハンドリング**: 適切なエラーメッセージ

#### 3. 一般APIクライアント (`lib/api.ts`)
- **認証対応**: HttpOnly Cookie自動送信
- **エラーハンドリング**: 統一されたエラー処理

#### 4. 認証ガード (`components/AuthGuard.tsx`)
- **ルート保護**: 認証が必要なページの保護
- **リダイレクト**: 未認証時のログインページへの誘導

#### 5. 認証ページ
- **`app/auth/login/page.tsx`**: ログインページ
- **`app/auth/signup/page.tsx`**: 登録ページ
- **`app/auth/confirm/page.tsx`**: 登録確認ページ

#### 6. 保護されたページ
- **`app/dashboard/page.tsx`**: ダッシュボード
- **`app/devices/page.tsx`**: デバイス一覧
- **`app/devices/[deviceId]/page.tsx`**: デバイス詳細

### 型定義 (`types/auth.ts`)

```typescript
// 認証状態
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  tokens: null;
}

// ユーザー情報
interface User {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  username?: string;
  groups?: string[];
}

// リクエスト/レスポンス
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: User;
}
```

---

## トラブルシューティング

### 1. よくあるエラー

#### CORSエラー
```
Access to fetch at 'http://localhost:8003/api/v1/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解決方法：**
```python
# main.py
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

#### CSRFトークンエラー
```
CSRF token missing
```

**解決方法：**
```typescript
// フロントエンドでCSRFトークンを取得・送信
const csrfToken = await authApi.getCsrfToken();
headers: {
    'X-CSRF-Token': csrfToken
}
```

#### JWT検証エラー
```
JWT検証エラー: Invalid token
```

**解決方法：**
1. トークンの有効期限を確認
2. JWKSエンドポイントのアクセス性を確認
3. Cognitoの設定を確認

### 2. デバッグ方法

#### バックエンド
```python
# ログ出力を追加
import logging
logging.basicConfig(level=logging.DEBUG)

# JWTペイロードを確認
payload = jwt_validator.verify_token(token)
print(f"JWT Payload: {payload}")
```

#### フロントエンド
```typescript
// ネットワークタブでCookieを確認
// Application > Cookies でHttpOnly Cookieを確認
// Console でエラーメッセージを確認
```

### 3. パフォーマンス最適化

#### JWKSキャッシュ
```python
# 1時間キャッシュ
self.cache_duration = 3600
```

#### トークン有効期限
```python
# 適切な有効期限設定
max_age=auth_result['ExpiresIn']  # 通常1時間
```

---

## ベストプラクティス

### 1. セキュリティ

#### パスワードポリシー
```python
# Cognitoで設定
{
    "MinimumLength": 8,
    "RequireUppercase": true,
    "RequireLowercase": true,
    "RequireNumbers": true,
    "RequireSymbols": true
}
```

#### トークン有効期限
```python
# 短い有効期限を設定
{
    "AccessTokenValidity": 3600,  # 1時間
    "IdTokenValidity": 3600,      # 1時間
    "RefreshTokenValidity": 30    # 30日
}
```

### 2. エラーハンドリング

#### 統一されたエラーレスポンス
```python
class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)
```

#### フロントエンドエラーハンドリング
```typescript
try {
  await authApi.login(credentials);
} catch (error) {
  if (error instanceof AuthApiError) {
    setError(error.message);
  } else {
    setError('予期しないエラーが発生しました');
  }
}
```

### 3. テスト

#### バックエンドテスト
```python
def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.cookies
```

#### フロントエンドテスト
```typescript
test('should login successfully', async () => {
  const { result } = renderHook(() => useAuth());
  
  await act(async () => {
    await result.current.login({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  expect(result.current.isAuthenticated).toBe(true);
});
```

### 4. 監視・ログ

#### 認証ログ
```python
import logging

logger = logging.getLogger(__name__)

@router.post("/login")
async def login(request: LoginRequest, response: Response):
    logger.info(f"Login attempt for user: {request.email}")
    try:
        # 認証処理
        logger.info(f"Login successful for user: {request.email}")
    except Exception as e:
        logger.error(f"Login failed for user: {request.email}, error: {str(e)}")
        raise
```

#### セキュリティ監視
```python
# 失敗したログイン試行を監視
failed_attempts = get_failed_attempts(request.email)
if failed_attempts > 5:
    logger.warning(f"Multiple failed login attempts for user: {request.email}")
    # アカウントロックなどの対策
```

---

## まとめ

本認証システムは、以下の特徴を持つエンタープライズレベルのセキュリティを提供します：

### セキュリティ機能
- ✅ **HttpOnly Cookie**: XSS攻撃対策
- ✅ **CSRF保護**: CSRF攻撃対策
- ✅ **セキュリティヘッダー**: 各種攻撃対策
- ✅ **JWT検証**: 署名検証と有効期限チェック
- ✅ **入力検証**: Pydanticによる型安全な検証

### 技術的特徴
- ✅ **スケーラブル**: ステートレスなJWT認証
- ✅ **マネージド**: AWS Cognitoによる認証管理
- ✅ **型安全**: TypeScript + Pydantic
- ✅ **エラーハンドリング**: 統一されたエラー処理

### 運用面
- ✅ **監視**: 認証ログとセキュリティ監視
- ✅ **テスト**: 包括的なテストカバレッジ
- ✅ **ドキュメント**: 詳細な実装ドキュメント
- ✅ **ベストプラクティス**: 業界標準に準拠

この認証システムにより、安全で信頼性の高いユーザー認証を実現できます。
