# コード品質ガイド

このドキュメントでは、IoT Water Level Device Registry API のバックエンドで使用しているコード品質ツール（black, flake8, mypy）について詳しく解説します。

## 目次

1. [コード品質の重要性](#コード品質の重要性)
2. [black - コードフォーマッター](#black---コードフォーマッター)
3. [flake8 - リンター](#flake8---リンター)
4. [mypy - 型チェッカー](#mypy---型チェッカー)
5. [設定ファイルの詳細](#設定ファイルの詳細)
6. [統合的な使用方法](#統合的な使用方法)
7. [ベストプラクティス](#ベストプラクティス)

---

## コード品質の重要性

### なぜコード品質が重要なのか

1. **可読性**: 他の開発者が理解しやすいコード
2. **保守性**: 長期間にわたって保守しやすいコード
3. **バグの削減**: 潜在的な問題を早期発見
4. **チーム開発**: 一貫したコーディングスタイル
5. **生産性**: 開発効率の向上

### コード品質ツールの役割

| ツール | 役割 | 対象 |
|--------|------|------|
| black | フォーマット | コードスタイル |
| flake8 | リンター | コード品質・スタイル |
| mypy | 型チェッカー | 型安全性 |

---

## black - コードフォーマッター

### 概要
blackは、Pythonのコードを自動的にフォーマットするツールです。「意見のある」フォーマッターで、一貫したコードスタイルを強制します。

### 主な特徴

1. **一貫性**: チーム全体で同じスタイル
2. **自動化**: 手動でのフォーマットが不要
3. **設定の最小化**: ほとんど設定不要
4. **高速**: 大規模なプロジェクトでも高速
5. **PEP 8準拠**: Pythonの標準スタイルガイドに準拠

### 基本的な使用方法

```bash
# ファイルをフォーマット
black main.py

# ディレクトリ全体をフォーマット
black .

# フォーマットの確認（変更しない）
black --check .

# 差分を表示
black --diff .

# 特定のファイルを除外
black --exclude="migrations|tests" .
```

### フォーマット例

#### フォーマット前
```python
def get_device(device_id,lat,lon):
    if device_id is None or device_id=="":
        raise ValueError("Device ID cannot be empty")
    return {"deviceId":device_id,"lat":lat,"lon":lon}
```

#### フォーマット後
```python
def get_device(device_id, lat, lon):
    if device_id is None or device_id == "":
        raise ValueError("Device ID cannot be empty")
    return {"deviceId": device_id, "lat": lat, "lon": lon}
```

### 設定オプション

```toml
# pyproject.toml
[tool.black]
line-length = 88                    # 行の最大長
target-version = ['py310']          # 対象Pythonバージョン
include = '\.pyi?$'                 # 対象ファイルのパターン
extend-exclude = '''                # 除外するディレクトリ
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

### よくあるフォーマット例

#### 1. インポート文の整理
```python
# フォーマット前
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
import os,time
from decimal import Decimal

# フォーマット後
import os
import time
from decimal import Decimal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
```

#### 2. 長い行の分割
```python
# フォーマット前
response = client.post("http://localhost:8000/devices/claim", json={"deviceId": "test-001", "lat": 35.6762, "lon": 139.6503})

# フォーマット後
response = client.post(
    "http://localhost:8000/devices/claim",
    json={
        "deviceId": "test-001",
        "lat": 35.6762,
        "lon": 139.6503,
    },
)
```

#### 3. 辞書のフォーマット
```python
# フォーマット前
device_data = {"deviceId": "test-001", "label": "Test Device", "fieldId": "field-001", "claimStatus": "unclaimed"}

# フォーマット後
device_data = {
    "deviceId": "test-001",
    "label": "Test Device",
    "fieldId": "field-001",
    "claimStatus": "unclaimed",
}
```

---

## flake8 - リンター

### 概要
flake8は、Pythonのコードスタイルとエラーをチェックするツールです。PEP 8スタイルガイドに基づいてコードを分析します。

### 主な機能

1. **スタイルチェック**: PEP 8準拠の確認
2. **エラー検出**: 構文エラーや論理エラーの発見
3. **複雑度チェック**: コードの複雑度を測定
4. **カスタマイズ**: ルールの有効/無効化
5. **プラグイン対応**: 機能の拡張

### 基本的な使用方法

```bash
# ファイルをチェック
flake8 main.py

# ディレクトリ全体をチェック
flake8 .

# 特定のエラーを無視
flake8 --ignore=E203,W503 .

# 最大行長を指定
flake8 --max-line-length=88 .

# 統計情報を表示
flake8 --statistics .

# カウントを表示
flake8 --count .
```

### エラーコードの種類

#### E (Error) - エラー
- **E501**: 行が長すぎる
- **E302**: 関数の前に空行が不足
- **E303**: 空行が多すぎる
- **E305**: クラスや関数の後に空行が不足

#### W (Warning) - 警告
- **W291**: 行末に不要な空白
- **W292**: 行末に改行がない
- **W293**: 空行に空白がある

#### F (Fatal) - 致命的エラー
- **F401**: 未使用のインポート
- **F811**: 重複した定義
- **F821**: 未定義の変数

### よくあるエラーと対処法

#### 1. E501 - 行が長すぎる
```python
# エラー例
very_long_variable_name = some_function_with_very_long_name(parameter1, parameter2, parameter3, parameter4)

# 対処法
very_long_variable_name = some_function_with_very_long_name(
    parameter1, parameter2, parameter3, parameter4
)
```

#### 2. E302 - 関数の前に空行が不足
```python
# エラー例
def function1():
    pass
def function2():
    pass

# 対処法
def function1():
    pass


def function2():
    pass
```

#### 3. F401 - 未使用のインポート
```python
# エラー例
import os
import time
from decimal import Decimal

def get_device():
    return {"deviceId": "test"}

# 対処法（未使用のインポートを削除）
def get_device():
    return {"deviceId": "test"}
```

### 設定ファイル

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
    tests/*:S101
```

### プラグインの使用

```bash
# 複雑度チェック
pip install flake8-complexity
flake8 --max-complexity=10 .

# 型チェック
pip install flake8-annotations
flake8 --enable-annotations .

# ドキュメント文字列チェック
pip install flake8-docstrings
flake8 --enable-docstrings .
```

---

## mypy - 型チェッカー

### 概要
mypyは、Pythonの静的型チェッカーです。型ヒントを使用してコードの型安全性をチェックし、実行時エラーを事前に発見します。

### 主な特徴

1. **型安全性**: 型エラーを事前に発見
2. **IDE統合**: エディタでの型チェック
3. **段階的導入**: 既存コードに徐々に適用可能
4. **豊富な型システム**: 複雑な型もサポート
5. **パフォーマンス**: 高速な型チェック

### 基本的な使用方法

```bash
# ファイルをチェック
mypy main.py

# ディレクトリ全体をチェック
mypy .

# 厳密モードでチェック
mypy --strict .

# 特定のモジュールを無視
mypy --ignore-missing-imports .

# エラーを詳細表示
mypy --show-error-codes .

# 型チェック結果をHTMLで出力
mypy --html-report report .
```

### 型ヒントの基本

#### 1. 基本的な型
```python
from typing import List, Dict, Optional, Union

# 基本的な型
name: str = "John"
age: int = 30
height: float = 175.5
is_active: bool = True

# リスト
numbers: List[int] = [1, 2, 3, 4, 5]
names: List[str] = ["Alice", "Bob", "Charlie"]

# 辞書
device_info: Dict[str, str] = {
    "deviceId": "device-001",
    "status": "active"
}

# オプショナル（Noneの可能性がある）
optional_name: Optional[str] = None
optional_age: Optional[int] = None

# ユニオン型（複数の型の可能性）
id_value: Union[str, int] = "device-001"
id_value = 123  # これも有効
```

#### 2. 関数の型ヒント
```python
from typing import List, Optional, Dict, Any

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

#### 3. クラスの型ヒント
```python
from typing import List, Optional
from pydantic import BaseModel

class DeviceItem(BaseModel):
    device_id: str
    label: Optional[str] = None
    field_id: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    claim_status: str
    updated_at: str

class DeviceManager:
    def __init__(self) -> None:
        self.devices: List[DeviceItem] = []
    
    def add_device(self, device: DeviceItem) -> None:
        """デバイスを追加"""
        self.devices.append(device)
    
    def get_device(self, device_id: str) -> Optional[DeviceItem]:
        """デバイスを取得"""
        for device in self.devices:
            if device.device_id == device_id:
                return device
        return None
```

### よくある型エラーと対処法

#### 1. 型の不一致
```python
# エラー例
def add_numbers(a: int, b: int) -> int:
    return a + b

result = add_numbers("1", "2")  # 型エラー

# 対処法
result = add_numbers(1, 2)  # 正しい型
```

#### 2. Noneの可能性
```python
# エラー例
def get_device_name(device_id: str) -> str:
    device = get_device(device_id)
    return device["name"]  # deviceがNoneの可能性

# 対処法
def get_device_name(device_id: str) -> Optional[str]:
    device = get_device(device_id)
    if device is None:
        return None
    return device["name"]
```

#### 3. 型の推論
```python
# エラー例
def process_data(data):
    return data.upper()  # dataの型が不明

# 対処法
def process_data(data: str) -> str:
    return data.upper()
```

### 設定ファイル

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

# 特定のモジュールの設定
[[tool.mypy.overrides]]
module = "boto3.*"
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

---

## 設定ファイルの詳細

### pyproject.toml

#### 概要
pyproject.tomlは、Pythonプロジェクトの設定を一元管理するファイルです。PEP 518で標準化された形式です。

#### 完全な設定例

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

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
```

### .flake8

#### 完全な設定例

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

# 複雑度の上限
max-complexity = 10

# 統計情報を表示
statistics = True

# カウントを表示
count = True
```

---

## 統合的な使用方法

### Makefileでの統合

```makefile
# コード品質チェック
lint: ## コードの品質チェック
	flake8 .
	mypy .

# コードフォーマット
format: ## コードをフォーマット
	black .

# 全チェック
check: format lint test ## フォーマット、リント、テストを実行
```

### 実行順序

1. **フォーマット**: blackでコードスタイルを統一
2. **リンター**: flake8でコード品質をチェック
3. **型チェック**: mypyで型安全性をチェック
4. **テスト**: pytestで動作を確認

### 継続的インテグレーション

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.10
    - name: Install dependencies
      run: make install
    - name: Format check
      run: black --check .
    - name: Lint
      run: flake8 .
    - name: Type check
      run: mypy .
    - name: Test
      run: pytest
```

---

## ベストプラクティス

### 1. 開発フロー

```bash
# 1. コードを書く
# 2. フォーマット
make format

# 3. 品質チェック
make lint

# 4. テスト
make test

# 5. 全チェック
make check
```

### 2. 型ヒントの活用

```python
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel

# 良い例
def process_devices(devices: List[DeviceItem]) -> Dict[str, Any]:
    """型ヒントで戻り値の型を明確化"""
    result = {
        "total": len(devices),
        "active": sum(1 for d in devices if d.claim_status == "claimed")
    }
    return result

# 悪い例
def process_devices(devices):
    """型ヒントがない"""
    result = {
        "total": len(devices),
        "active": sum(1 for d in devices if d.claim_status == "claimed")
    }
    return result
```

### 3. エラーハンドリング

```python
from fastapi import HTTPException
from typing import Optional

def get_device(device_id: str) -> Optional[Dict[str, Any]]:
    """適切なエラーハンドリング"""
    try:
        response = ddb_tbl.get_item(Key={"deviceId": device_id})
        item = response.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="Device not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
```

### 4. 設定の管理

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

### 5. ドキュメント文字列

```python
def get_device(device_id: str) -> Optional[Dict[str, Any]]:
    """
    デバイス情報を取得する
    
    Args:
        device_id: デバイスID
        
    Returns:
        デバイス情報の辞書、見つからない場合はNone
        
    Raises:
        HTTPException: デバイスが見つからない場合
    """
    # 実装
    pass
```

---

## まとめ

コード品質ツールを適切に使用することで、以下のメリットが得られます：

1. **一貫性**: チーム全体で統一されたコードスタイル
2. **品質**: 高品質で保守しやすいコード
3. **効率性**: 自動化による開発効率の向上
4. **安全性**: 型チェックによる実行時エラーの削減
5. **保守性**: 長期間にわたって保守しやすいコード

定期的にこれらのツールを実行し、コードの品質を維持することが重要です。
