# 開発ツール解説

このドキュメントでは、IoT Water Level Device Registry API のバックエンドで使用している開発ツールについて詳しく解説します。

## 目次

1. [Makefile - 開発コマンドの統一管理](#makefile---開発コマンドの統一管理)
2. [テストツール - pytest, pytest-asyncio](#テストツール---pytest-pytest-asyncio)
3. [コード品質ツール - black, flake8, mypy](#コード品質ツール---black-flake8-mypy)
4. [設定ファイル - pyproject.toml, .flake8](#設定ファイル---pyprojecttoml-flake8)
5. [使用方法とベストプラクティス](#使用方法とベストプラクティス)

---

## Makefile - 開発コマンドの統一管理

### 概要
Makefileは、複雑なコマンドを簡単な名前で実行できるようにするツールです。開発者が覚えやすいコマンド名で、一貫した開発環境を提供します。

### 利用可能なコマンド

```bash
# ヘルプの表示
make help

# 依存関係のインストール
make install

# 開発サーバーの起動
make dev

# テストの実行
make test

# コードの品質チェック
make lint

# コードのフォーマット
make format

# キャッシュファイルの削除
make clean

# フォーマット、リント、テストを一括実行
make check

# Dockerイメージのビルド
make docker-build

# Dockerコンテナの実行
make docker-run
```

### メリット

1. **統一性**: チーム全員が同じコマンドを使用
2. **簡潔性**: 長いコマンドを短縮
3. **ドキュメント化**: コマンドの目的が明確
4. **自動化**: 複数のコマンドを組み合わせて実行

### 使用例

```bash
# 開発を始める前の準備
make install
make dev

# コードを書いた後の品質チェック
make check

# リリース前の最終チェック
make clean
make check
make docker-build
```

---

## テストツール - pytest, pytest-asyncio

### pytest

#### 概要
pytestは、Pythonの最も人気のあるテストフレームワークです。シンプルで拡張性が高く、豊富な機能を提供します。

#### 主な特徴

1. **シンプルな構文**: `assert`文だけでテストが書ける
2. **豊富なフィクスチャ**: テストデータの準備が簡単
3. **詳細なエラー表示**: 失敗時の情報が分かりやすい
4. **プラグインシステム**: 機能を拡張可能

#### 基本的なテスト例

```python
# tests/test_main.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_devices():
    """デバイス一覧の取得テスト"""
    response = client.get("/devices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_claim_device():
    """デバイス登録のテスト"""
    test_data = {
        "deviceId": "test-device-001",
        "lat": 35.6762,
        "lon": 139.6503
    }
    response = client.post("/devices/claim", json=test_data)
    # 実際のテストでは、モックを使用することを推奨
    assert response.status_code in [200, 404, 409]
```

#### フィクスチャの使用例

```python
# tests/conftest.py
import pytest
from unittest.mock import Mock

@pytest.fixture
def mock_dynamodb():
    """DynamoDBのモック"""
    mock_table = Mock()
    mock_table.get_item.return_value = {"Item": None}
    return mock_table

@pytest.fixture
def test_client():
    """テスト用のクライアント"""
    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)
```

### pytest-asyncio

#### 概要
pytest-asyncioは、pytestで非同期テストを実行するためのプラグインです。FastAPIの非同期エンドポイントをテストする際に必要です。

#### 非同期テストの例

```python
# tests/test_async.py
import pytest
import asyncio
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_async_endpoint():
    """非同期エンドポイントのテスト"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/devices")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_concurrent_requests():
    """並行リクエストのテスト"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        tasks = [
            ac.get("/devices"),
            ac.get("/devices/stats"),
        ]
        responses = await asyncio.gather(*tasks)
        for response in responses:
            assert response.status_code == 200
```

#### 設定

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
```

---

## コード品質ツール - black, flake8, mypy

### black

#### 概要
blackは、Pythonのコードを自動的にフォーマットするツールです。「意見のある」フォーマッターで、一貫したコードスタイルを強制します。

#### 主な特徴

1. **一貫性**: チーム全体で同じスタイル
2. **自動化**: 手動でのフォーマットが不要
3. **設定の最小化**: ほとんど設定不要
4. **高速**: 大規模なプロジェクトでも高速

#### 使用例

```bash
# ファイルをフォーマット
black main.py

# ディレクトリ全体をフォーマット
black .

# フォーマットの確認（変更しない）
black --check .

# 差分を表示
black --diff .
```

#### 設定例

```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py310']
include = '\.pyi?$'
extend-exclude = '''
/(
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''
```

### flake8

#### 概要
flake8は、Pythonのコードスタイルとエラーをチェックするツールです。PEP 8スタイルガイドに基づいてコードを分析します。

#### 主な機能

1. **スタイルチェック**: PEP 8準拠の確認
2. **エラー検出**: 構文エラーや論理エラーの発見
3. **複雑度チェック**: コードの複雑度を測定
4. **カスタマイズ**: ルールの有効/無効化

#### 使用例

```bash
# ファイルをチェック
flake8 main.py

# ディレクトリ全体をチェック
flake8 .

# 特定のエラーを無視
flake8 --ignore=E203,W503 .

# 最大行長を指定
flake8 --max-line-length=88 .
```

#### 設定例

```ini
# .flake8
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = 
    .git,
    __pycache__,
    .venv,
    venv,
    .mypy_cache,
    .pytest_cache,
    build,
    dist
per-file-ignores =
    __init__.py:F401
```

#### よくあるエラーと対処法

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| E501 | 行が長すぎる | 行を分割する |
| E302 | 関数の前に空行が不足 | 空行を追加 |
| F401 | 未使用のインポート | インポートを削除 |
| E203 | コロンの前の空白 | blackと競合する場合は無視 |

### mypy

#### 概要
mypyは、Pythonの静的型チェッカーです。型ヒントを使用してコードの型安全性をチェックし、実行時エラーを事前に発見します。

#### 主な特徴

1. **型安全性**: 型エラーを事前に発見
2. **IDE統合**: エディタでの型チェック
3. **段階的導入**: 既存コードに徐々に適用可能
4. **豊富な型システム**: 複雑な型もサポート

#### 型ヒントの例

```python
from typing import List, Optional, Dict, Any
from decimal import Decimal

def get_device(device_id: str) -> Optional[Dict[str, Any]]:
    """デバイス情報を取得"""
    # 実装
    pass

def update_device_position(
    device_id: str, 
    lat: float, 
    lon: float
) -> Dict[str, Any]:
    """デバイスの位置を更新"""
    # 実装
    pass

def get_device_history(
    device_id: str, 
    hours: int = 24
) -> List[Dict[str, Any]]:
    """デバイスの履歴を取得"""
    # 実装
    pass
```

#### 使用例

```bash
# ファイルをチェック
mypy main.py

# ディレクトリ全体をチェック
mypy .

# 厳密モードでチェック
mypy --strict .

# 特定のモジュールを無視
mypy --ignore-missing-imports .
```

#### 設定例

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true
```

---

## 設定ファイル - pyproject.toml, .flake8

### pyproject.toml

#### 概要
pyproject.tomlは、Pythonプロジェクトの設定を一元管理するファイルです。PEP 518で標準化された形式です。

#### 主な用途

1. **ビルド設定**: パッケージのビルド方法
2. **ツール設定**: 各種ツールの設定
3. **依存関係**: プロジェクトの依存関係
4. **メタデータ**: プロジェクト情報

#### 設定例

```toml
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "iot-waterlevel-api"
version = "1.0.0"
description = "IoT Water Level Device Registry API"
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
dependencies = [
    "fastapi>=0.112.2",
    "uvicorn[standard]>=0.30.6",
    "boto3>=1.34.162",
    "pydantic>=2.8.2",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.3",
    "pytest-asyncio>=0.21.1",
    "black>=23.9.1",
    "flake8>=6.1.0",
    "mypy>=1.6.1",
]

[tool.black]
line-length = 88
target-version = ['py310']

[tool.mypy]
python_version = "3.10"
warn_return_any = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --tb=short"
```

### .flake8

#### 概要
.flake8は、flake8の設定ファイルです。プロジェクト固有のルールを定義します。

#### 設定項目

```ini
[flake8]
# 最大行長
max-line-length = 88

# 無視するエラーコード
extend-ignore = E203, W503

# 除外するディレクトリ
exclude = 
    .git,
    __pycache__,
    .venv,
    venv,
    .mypy_cache,
    .pytest_cache,
    build,
    dist

# ファイル別の無視ルール
per-file-ignores =
    __init__.py:F401
    tests/*:S101
```

---

## 使用方法とベストプラクティス

### 開発フロー

1. **コードを書く**
   ```bash
   # 開発サーバーを起動
   make dev
   ```

2. **コードをフォーマット**
   ```bash
   make format
   ```

3. **品質チェック**
   ```bash
   make lint
   ```

4. **テストを実行**
   ```bash
   make test
   ```

5. **全てのチェック**
   ```bash
   make check
   ```

### ベストプラクティス

#### 1. 型ヒントの活用
```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class DeviceItem(BaseModel):
    device_id: str
    label: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

def get_devices() -> List[DeviceItem]:
    """型ヒントで戻り値の型を明確化"""
    pass
```

#### 2. テストの書き方
```python
import pytest
from unittest.mock import Mock, patch

@pytest.fixture
def mock_dynamodb():
    """テスト用のモックを作成"""
    return Mock()

def test_get_device_success(mock_dynamodb):
    """成功ケースのテスト"""
    # Arrange
    mock_dynamodb.get_item.return_value = {
        "Item": {"deviceId": "test-001", "claimStatus": "unclaimed"}
    }
    
    # Act
    result = get_device("test-001")
    
    # Assert
    assert result is not None
    assert result["deviceId"] == "test-001"
```

#### 3. エラーハンドリング
```python
from fastapi import HTTPException

def get_device(device_id: str) -> Dict[str, Any]:
    """適切なエラーハンドリング"""
    try:
        response = ddb_tbl.get_item(Key={"deviceId": device_id})
        item = response.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="Device not found")
        return item
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
```

#### 4. 設定の管理
```python
import os
from typing import List
from pydantic import BaseSettings

class Settings(BaseSettings):
    """環境変数から設定を読み込み"""
    aws_region: str = "us-east-1"
    registry_table: str = "DeviceRegistry"
    cors_origins: List[str] = ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### トラブルシューティング

#### よくある問題

1. **blackとflake8の競合**
   ```ini
   # .flake8でE203, W503を無視
   extend-ignore = E203, W503
   ```

2. **mypyの型エラー**
   ```python
   # 型を明示的に指定
   from typing import Any
   result: Any = some_function()
   ```

3. **テストの実行エラー**
   ```bash
   # 非同期テストの場合
   pytest -m asyncio
   ```

### 継続的インテグレーション（CI）

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.10
    - name: Install dependencies
      run: make install
    - name: Run tests
      run: make check
```

---

## まとめ

これらの開発ツールを適切に使用することで、以下のメリットが得られます：

1. **コード品質の向上**: 一貫したスタイルと型安全性
2. **バグの早期発見**: テストと静的解析による品質保証
3. **開発効率の向上**: 自動化されたツールによる作業の簡素化
4. **チーム開発の円滑化**: 統一された開発環境

定期的にこれらのツールを実行し、コードの品質を維持することが重要です。
