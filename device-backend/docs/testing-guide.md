# テストガイド

このドキュメントでは、IoT Water Level Device Registry API のバックエンドで使用しているテストツール（pytest, pytest-asyncio）について詳しく解説します。

## 目次

1. [テストの基本概念](#テストの基本概念)
2. [pytest の詳細](#pytest-の詳細)
3. [pytest-asyncio の詳細](#pytest-asyncio-の詳細)
4. [FastAPI のテスト](#fastapi-のテスト)
5. [モックとフィクスチャ](#モックとフィクスチャ)
6. [テストのベストプラクティス](#テストのベストプラクティス)
7. [実際のテスト例](#実際のテスト例)

---

## テストの基本概念

### テストの種類

1. **単体テスト（Unit Test）**: 個別の関数やメソッドをテスト
2. **統合テスト（Integration Test）**: 複数のコンポーネントの連携をテスト
3. **エンドツーエンドテスト（E2E Test）**: アプリケーション全体の動作をテスト

### テストの原則

1. **AAA パターン**: Arrange（準備）、Act（実行）、Assert（検証）
2. **独立性**: テストは互いに独立している
3. **再現性**: 同じ結果が得られる
4. **高速性**: 短時間で実行できる

---

## pytest の詳細

### 概要
pytestは、Pythonの最も人気のあるテストフレームワークです。シンプルで拡張性が高く、豊富な機能を提供します。

### 主な特徴

1. **シンプルな構文**: `assert`文だけでテストが書ける
2. **豊富なフィクスチャ**: テストデータの準備が簡単
3. **詳細なエラー表示**: 失敗時の情報が分かりやすい
4. **プラグインシステム**: 機能を拡張可能
5. **自動テスト発見**: テストファイルを自動的に発見

### 基本的なテスト例

```python
# tests/test_basic.py
def test_addition():
    """基本的な加算テスト"""
    assert 2 + 2 == 4

def test_string_concatenation():
    """文字列結合テスト"""
    result = "Hello" + " " + "World"
    assert result == "Hello World"

def test_list_operations():
    """リスト操作テスト"""
    numbers = [1, 2, 3, 4, 5]
    assert len(numbers) == 5
    assert 3 in numbers
    assert numbers[0] == 1
```

### テストの実行

```bash
# 全テストを実行
pytest

# 特定のファイルをテスト
pytest tests/test_basic.py

# 特定のテスト関数を実行
pytest tests/test_basic.py::test_addition

# 詳細な出力で実行
pytest -v

# 失敗時にデバッガーを起動
pytest --pdb
```

### パラメータ化テスト

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    (2, 4),
    (3, 9),
    (4, 16),
    (5, 25),
])
def test_square(input, expected):
    """平方計算のテスト"""
    assert input ** 2 == expected

@pytest.mark.parametrize("device_id,status_code", [
    ("device-001", 200),
    ("device-002", 404),
    ("invalid-id", 400),
])
def test_get_device_status_codes(device_id, status_code):
    """デバイス取得のステータスコードテスト"""
    # テストの実装
    pass
```

### 例外テスト

```python
import pytest

def test_division_by_zero():
    """ゼロ除算の例外テスト"""
    with pytest.raises(ZeroDivisionError):
        1 / 0

def test_invalid_device_id():
    """無効なデバイスIDの例外テスト"""
    with pytest.raises(ValueError, match="Invalid device ID"):
        validate_device_id("")

def test_custom_exception():
    """カスタム例外のテスト"""
    with pytest.raises(HTTPException) as exc_info:
        raise HTTPException(status_code=404, detail="Not found")
    
    assert exc_info.value.status_code == 404
    assert "Not found" in str(exc_info.value.detail)
```

---

## pytest-asyncio の詳細

### 概要
pytest-asyncioは、pytestで非同期テストを実行するためのプラグインです。FastAPIの非同期エンドポイントをテストする際に必要です。

### 基本的な非同期テスト

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_function():
    """基本的な非同期関数のテスト"""
    async def async_add(a, b):
        await asyncio.sleep(0.1)  # 非同期処理をシミュレート
        return a + b
    
    result = await async_add(2, 3)
    assert result == 5

@pytest.mark.asyncio
async def test_async_with_exception():
    """非同期関数の例外テスト"""
    async def async_divide(a, b):
        if b == 0:
            raise ValueError("Division by zero")
        return a / b
    
    with pytest.raises(ValueError, match="Division by zero"):
        await async_divide(10, 0)
```

### 非同期フィクスチャ

```python
import pytest
import asyncio

@pytest.fixture
async def async_fixture():
    """非同期フィクスチャ"""
    # 非同期の初期化処理
    await asyncio.sleep(0.1)
    yield "async_data"
    # 非同期のクリーンアップ処理
    await asyncio.sleep(0.1)

@pytest.mark.asyncio
async def test_with_async_fixture(async_fixture):
    """非同期フィクスチャを使用したテスト"""
    assert async_fixture == "async_data"
```

### 並行テスト

```python
import pytest
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_concurrent_requests():
    """並行リクエストのテスト"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        tasks = [
            ac.get("/devices"),
            ac.get("/devices/stats"),
            ac.get("/devices/device-001"),
        ]
        responses = await asyncio.gather(*tasks)
        
        for response in responses:
            assert response.status_code in [200, 404]
```

---

## FastAPI のテスト

### TestClient を使用したテスト

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_devices():
    """デバイス一覧の取得テスト"""
    response = client.get("/devices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_device_not_found():
    """存在しないデバイスの取得テスト"""
    response = client.get("/devices/non-existent")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_claim_device():
    """デバイス登録のテスト"""
    test_data = {
        "deviceId": "test-device-001",
        "lat": 35.6762,
        "lon": 139.6503
    }
    response = client.post("/devices/claim", json=test_data)
    assert response.status_code in [200, 404, 409]

def test_claim_device_invalid_data():
    """無効なデータでのデバイス登録テスト"""
    test_data = {
        "deviceId": "",  # 無効なデバイスID
        "lat": 35.6762,
        "lon": 139.6503
    }
    response = client.post("/devices/claim", json=test_data)
    assert response.status_code == 422  # Validation Error
```

### 非同期エンドポイントのテスト

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_async_endpoint():
    """非同期エンドポイントのテスト"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/devices")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_async_post_endpoint():
    """非同期POSTエンドポイントのテスト"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        test_data = {
            "deviceId": "test-device-001",
            "lat": 35.6762,
            "lon": 139.6503
        }
        response = await ac.post("/devices/claim", json=test_data)
        assert response.status_code in [200, 404, 409]
```

---

## モックとフィクスチャ

### モックの使用

```python
from unittest.mock import Mock, patch
import pytest

def test_with_mock():
    """モックを使用したテスト"""
    # モックオブジェクトを作成
    mock_dynamodb = Mock()
    mock_dynamodb.get_item.return_value = {
        "Item": {"deviceId": "test-001", "claimStatus": "unclaimed"}
    }
    
    # モックを使用してテスト
    with patch('main.ddb_tbl', mock_dynamodb):
        response = client.get("/devices/test-001")
        assert response.status_code == 200
        assert response.json()["deviceId"] == "test-001"

@patch('main.ddb_tbl')
def test_with_patch_decorator(mock_dynamodb):
    """パッチデコレータを使用したテスト"""
    mock_dynamodb.get_item.return_value = {
        "Item": {"deviceId": "test-001", "claimStatus": "unclaimed"}
    }
    
    response = client.get("/devices/test-001")
    assert response.status_code == 200
```

### フィクスチャの使用

```python
import pytest
from unittest.mock import Mock

@pytest.fixture
def mock_dynamodb():
    """DynamoDBのモックフィクスチャ"""
    mock_table = Mock()
    mock_table.get_item.return_value = {"Item": None}
    mock_table.scan.return_value = {"Items": []}
    return mock_table

@pytest.fixture
def test_client():
    """テスト用のクライアントフィクスチャ"""
    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)

@pytest.fixture
def sample_device_data():
    """サンプルデバイスデータのフィクスチャ"""
    return {
        "deviceId": "test-device-001",
        "label": "Test Device",
        "fieldId": "field-001",
        "lat": 35.6762,
        "lon": 139.6503,
        "claimStatus": "unclaimed",
        "updatedAt": "2024-01-01T00:00:00Z"
    }

def test_with_fixtures(mock_dynamodb, test_client, sample_device_data):
    """フィクスチャを使用したテスト"""
    mock_dynamodb.get_item.return_value = {"Item": sample_device_data}
    
    with patch('main.ddb_tbl', mock_dynamodb):
        response = test_client.get("/devices/test-device-001")
        assert response.status_code == 200
        assert response.json()["deviceId"] == "test-device-001"
```

### スコープ付きフィクスチャ

```python
@pytest.fixture(scope="session")
def database_connection():
    """セッションスコープのデータベース接続"""
    # データベース接続の初期化
    connection = create_database_connection()
    yield connection
    # データベース接続のクリーンアップ
    connection.close()

@pytest.fixture(scope="function")
def clean_database(database_connection):
    """関数スコープのクリーンデータベース"""
    # テスト前にデータベースをクリーンアップ
    database_connection.clear_all_data()
    yield database_connection
    # テスト後にデータベースをクリーンアップ
    database_connection.clear_all_data()
```

---

## テストのベストプラクティス

### 1. テストの命名規則

```python
# 良い例
def test_get_device_returns_device_when_exists():
    """存在するデバイスを取得した場合、デバイス情報を返す"""

def test_get_device_returns_404_when_not_exists():
    """存在しないデバイスを取得した場合、404エラーを返す"""

def test_claim_device_updates_status_to_claimed():
    """デバイス登録時にステータスがclaimedに更新される"""

# 悪い例
def test1():
    """テスト1"""

def test_device():
    """デバイステスト"""
```

### 2. テストの構造

```python
def test_claim_device_success():
    """デバイス登録成功のテスト"""
    # Arrange（準備）
    device_id = "test-device-001"
    lat = 35.6762
    lon = 139.6503
    test_data = {
        "deviceId": device_id,
        "lat": lat,
        "lon": lon
    }
    
    # Act（実行）
    response = client.post("/devices/claim", json=test_data)
    
    # Assert（検証）
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["deviceId"] == device_id
    assert response_data["claimStatus"] == "claimed"
    assert response_data["lat"] == lat
    assert response_data["lon"] == lon
```

### 3. テストデータの管理

```python
# tests/conftest.py
import pytest

@pytest.fixture
def valid_device_data():
    """有効なデバイスデータ"""
    return {
        "deviceId": "test-device-001",
        "lat": 35.6762,
        "lon": 139.6503
    }

@pytest.fixture
def invalid_device_data():
    """無効なデバイスデータ"""
    return {
        "deviceId": "",  # 空のデバイスID
        "lat": 200.0,    # 無効な緯度
        "lon": 200.0     # 無効な経度
    }

@pytest.fixture
def existing_device_data():
    """既存のデバイスデータ"""
    return {
        "deviceId": "existing-device-001",
        "label": "Existing Device",
        "fieldId": "field-001",
        "lat": 35.6762,
        "lon": 139.6503,
        "claimStatus": "claimed",
        "updatedAt": "2024-01-01T00:00:00Z"
    }
```

### 4. エラーハンドリングのテスト

```python
def test_handle_database_error():
    """データベースエラーのハンドリングテスト"""
    with patch('main.ddb_tbl') as mock_table:
        mock_table.get_item.side_effect = Exception("Database error")
        
        response = client.get("/devices/test-device-001")
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]

def test_handle_validation_error():
    """バリデーションエラーのハンドリングテスト"""
    invalid_data = {
        "deviceId": "",  # 空のデバイスID
        "lat": "invalid",  # 無効な緯度
        "lon": "invalid"   # 無効な経度
    }
    
    response = client.post("/devices/claim", json=invalid_data)
    assert response.status_code == 422
    assert "validation error" in response.json()["detail"].lower()
```

---

## 実際のテスト例

### 完全なテストファイル例

```python
# tests/test_main.py
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestDeviceEndpoints:
    """デバイスエンドポイントのテストクラス"""
    
    def test_get_devices_empty_list(self):
        """空のデバイス一覧の取得テスト"""
        with patch('main.ddb_tbl') as mock_table:
            mock_table.scan.return_value = {"Items": []}
            
            response = client.get("/devices")
            assert response.status_code == 200
            assert response.json() == []
    
    def test_get_devices_with_data(self):
        """データ付きデバイス一覧の取得テスト"""
        mock_items = [
            {
                "deviceId": "device-001",
                "label": "Device 1",
                "claimStatus": "unclaimed",
                "updatedAt": "2024-01-01T00:00:00Z"
            },
            {
                "deviceId": "device-002",
                "label": "Device 2",
                "claimStatus": "claimed",
                "lat": 35.6762,
                "lon": 139.6503,
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        ]
        
        with patch('main.ddb_tbl') as mock_table:
            mock_table.scan.return_value = {"Items": mock_items}
            
            response = client.get("/devices")
            assert response.status_code == 200
            devices = response.json()
            assert len(devices) == 2
            assert devices[0]["deviceId"] == "device-001"
            assert devices[1]["deviceId"] == "device-002"
    
    def test_get_device_success(self):
        """デバイス取得成功のテスト"""
        mock_item = {
            "deviceId": "device-001",
            "label": "Test Device",
            "claimStatus": "unclaimed",
            "updatedAt": "2024-01-01T00:00:00Z"
        }
        
        with patch('main.ddb_tbl') as mock_table:
            mock_table.get_item.return_value = {"Item": mock_item}
            
            response = client.get("/devices/device-001")
            assert response.status_code == 200
            device = response.json()
            assert device["deviceId"] == "device-001"
            assert device["label"] == "Test Device"
    
    def test_get_device_not_found(self):
        """デバイス取得失敗のテスト"""
        with patch('main.ddb_tbl') as mock_table:
            mock_table.get_item.return_value = {"Item": None}
            
            response = client.get("/devices/non-existent")
            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()
    
    def test_claim_device_success(self):
        """デバイス登録成功のテスト"""
        mock_item = {
            "deviceId": "device-001",
            "label": "Test Device",
            "claimStatus": "unclaimed"
        }
        
        test_data = {
            "deviceId": "device-001",
            "lat": 35.6762,
            "lon": 139.6503
        }
        
        with patch('main.ddb_tbl') as mock_table:
            mock_table.get_item.return_value = {"Item": mock_item}
            mock_table.update_item.return_value = {}
            
            response = client.post("/devices/claim", json=test_data)
            assert response.status_code == 200
            device = response.json()
            assert device["deviceId"] == "device-001"
            assert device["claimStatus"] == "claimed"
            assert device["lat"] == 35.6762
            assert device["lon"] == 139.6503
    
    def test_claim_device_not_found(self):
        """存在しないデバイスの登録テスト"""
        test_data = {
            "deviceId": "non-existent",
            "lat": 35.6762,
            "lon": 139.6503
        }
        
        with patch('main.ddb_tbl') as mock_table:
            mock_table.get_item.return_value = {"Item": None}
            
            response = client.post("/devices/claim", json=test_data)
            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()
    
    def test_claim_device_already_claimed(self):
        """既に登録済みのデバイスの登録テスト"""
        mock_item = {
            "deviceId": "device-001",
            "label": "Test Device",
            "claimStatus": "claimed"
        }
        
        test_data = {
            "deviceId": "device-001",
            "lat": 35.6762,
            "lon": 139.6503
        }
        
        with patch('main.ddb_tbl') as mock_table:
            mock_table.get_item.return_value = {"Item": mock_item}
            
            response = client.post("/devices/claim", json=test_data)
            assert response.status_code == 409
            assert "already claimed" in response.json()["detail"].lower()
    
    def test_claim_device_invalid_data(self):
        """無効なデータでのデバイス登録テスト"""
        invalid_data = {
            "deviceId": "",  # 空のデバイスID
            "lat": 200.0,    # 無効な緯度
            "lon": 200.0     # 無効な経度
        }
        
        response = client.post("/devices/claim", json=invalid_data)
        assert response.status_code == 422  # Validation Error

@pytest.mark.asyncio
class TestAsyncEndpoints:
    """非同期エンドポイントのテストクラス"""
    
    async def test_async_get_devices(self):
        """非同期デバイス一覧取得のテスト"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            with patch('main.ddb_tbl') as mock_table:
                mock_table.scan.return_value = {"Items": []}
                
                response = await ac.get("/devices")
                assert response.status_code == 200
                assert response.json() == []
    
    async def test_concurrent_requests(self):
        """並行リクエストのテスト"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            with patch('main.ddb_tbl') as mock_table:
                mock_table.scan.return_value = {"Items": []}
                
                tasks = [
                    ac.get("/devices"),
                    ac.get("/devices/stats"),
                ]
                responses = await asyncio.gather(*tasks)
                
                for response in responses:
                    assert response.status_code == 200
```

### テストの実行

```bash
# 全テストを実行
pytest

# 特定のテストクラスを実行
pytest tests/test_main.py::TestDeviceEndpoints

# 特定のテストメソッドを実行
pytest tests/test_main.py::TestDeviceEndpoints::test_get_devices_empty_list

# 非同期テストのみを実行
pytest -m asyncio

# カバレッジ付きで実行
pytest --cov=main --cov-report=html

# 並列実行
pytest -n auto
```

---

## まとめ

pytestとpytest-asyncioを使用することで、以下のメリットが得られます：

1. **高品質なテスト**: 包括的なテストカバレッジ
2. **保守性**: 読みやすく保守しやすいテストコード
3. **効率性**: 高速なテスト実行
4. **拡張性**: 豊富なプラグインとカスタマイズ機能
5. **非同期対応**: FastAPIの非同期機能を適切にテスト

定期的にテストを実行し、コードの品質を維持することが重要です。
