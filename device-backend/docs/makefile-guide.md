# Makefile 詳細ガイド

このドキュメントでは、IoT Water Level Device Registry API のバックエンドで使用しているMakefileについて詳しく解説します。

## 目次

1. [Makefileとは](#makefileとは)
2. [コマンド一覧と詳細](#コマンド一覧と詳細)
3. [実際の使用例](#実際の使用例)
4. [カスタマイズ方法](#カスタマイズ方法)
5. [トラブルシューティング](#トラブルシューティング)

---

## Makefileとは

### 概要
Makefileは、複雑なコマンドや一連の処理を簡単な名前で実行できるようにするツールです。特に開発環境では、長いコマンドを覚える必要がなくなり、チーム全体で統一された開発フローを提供できます。

### 基本的な構文

```makefile
ターゲット: 依存関係
	コマンド1
	コマンド2
```

### 重要なポイント

1. **インデント**: コマンドは必ずタブ文字でインデント
2. **依存関係**: ターゲットが依存する他のターゲットを指定
3. **PHONY**: ファイル名ではないターゲットを明示

---

## コマンド一覧と詳細

### 基本コマンド

#### `make help`
```makefile
help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
```

**説明**: 利用可能なすべてのコマンドとその説明を表示します。

**使用例**:
```bash
$ make help
help                このヘルプを表示
install             依存関係をインストール
dev                 開発サーバーを起動
test                テストを実行
lint                コードの品質チェック
format              コードをフォーマット
clean               キャッシュファイルを削除
check               フォーマット、リント、テストを実行
```

#### `make install`
```makefile
install: ## 依存関係をインストール
	pip install -r requirements.txt
```

**説明**: `requirements.txt`に記載されたPythonパッケージをインストールします。

**使用例**:
```bash
# 初回セットアップ時
make install

# 依存関係を更新した後
make install
```

#### `make dev`
```makefile
dev: ## 開発サーバーを起動
	uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**説明**: FastAPIの開発サーバーを起動します。`--reload`オプションにより、ファイルの変更を自動検知してサーバーを再起動します。

**使用例**:
```bash
# 開発サーバーを起動
make dev

# 出力例:
# INFO:     Will watch for changes in these directories: ['/path/to/project']
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
# INFO:     Started reloader process [12345] using WatchFiles
# INFO:     Started server process [12346]
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

### テスト関連コマンド

#### `make test`
```makefile
test: ## テストを実行
	pytest
```

**説明**: pytestを使用してテストを実行します。

**使用例**:
```bash
# 全テストを実行
make test

# 出力例:
# ============================= test session starts ==============================
# platform linux -- Python 3.10.0, pytest-7.4.3, pluggy-1.3.0
# rootdir: /path/to/project
# plugins: asyncio-0.21.1
# collected 5 items
# 
# tests/test_main.py .....                                                [100%]
# 
# ============================== 5 passed in 0.12s ===============================
```

### コード品質関連コマンド

#### `make lint`
```makefile
lint: ## コードの品質チェック
	flake8 .
	mypy .
```

**説明**: flake8とmypyを使用してコードの品質をチェックします。

**使用例**:
```bash
# コード品質をチェック
make lint

# 出力例:
# ./main.py:45:1: E302 expected 2 blank lines, found 1
# ./main.py:67:80: E501 line too long (89 > 88 characters)
# ./main.py:89: error: Function is missing a type annotation for one or more arguments
```

#### `make format`
```makefile
format: ## コードをフォーマット
	black .
```

**説明**: blackを使用してコードを自動フォーマットします。

**使用例**:
```bash
# コードをフォーマット
make format

# 出力例:
# reformatted main.py
# All done! ✨ 🍰 ✨
# 1 file reformatted.
```

### メンテナンス関連コマンド

#### `make clean`
```makefile
clean: ## キャッシュファイルを削除
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
```

**説明**: Pythonのキャッシュファイルやビルドファイルを削除します。

**使用例**:
```bash
# キャッシュファイルを削除
make clean

# 出力例:
# (何も表示されない - 正常に削除された)
```

#### `make check`
```makefile
check: format lint test ## フォーマット、リント、テストを実行
```

**説明**: フォーマット、リント、テストを順番に実行します。リリース前の最終チェックに使用します。

**使用例**:
```bash
# 全チェックを実行
make check

# 出力例:
# reformatted main.py
# All done! ✨ 🍰 ✨
# 1 file reformatted.
# 
# (flake8とmypyの出力)
# 
# ============================= test session starts ==============================
# (pytestの出力)
```

### Docker関連コマンド

#### `make docker-build`
```makefile
docker-build: ## Dockerイメージをビルド
	docker build -t iot-waterlevel-api .
```

**説明**: Dockerイメージをビルドします。

**使用例**:
```bash
# Dockerイメージをビルド
make docker-build

# 出力例:
# Sending build context to Docker daemon  2.048kB
# Step 1/7 : FROM python:3.10-slim
# ---> 1234567890ab
# Step 2/7 : WORKDIR /app
# ---> Running in abcdef123456
# ...
# Successfully built 1234567890ab
# Successfully tagged iot-waterlevel-api:latest
```

#### `make docker-run`
```makefile
docker-run: ## Dockerコンテナを実行
	docker run -p 8000:8000 iot-waterlevel-api
```

**説明**: ビルドしたDockerイメージを実行します。

**使用例**:
```bash
# Dockerコンテナを実行
make docker-run

# 出力例:
# INFO:     Started server process [1]
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## 実際の使用例

### 開発開始時の流れ

```bash
# 1. プロジェクトをクローン
git clone <repository-url>
cd device-backend

# 2. 依存関係をインストール
make install

# 3. 開発サーバーを起動
make dev
```

### コードを書いた後の流れ

```bash
# 1. コードをフォーマット
make format

# 2. 品質チェック
make lint

# 3. テストを実行
make test

# 4. 全てのチェック（推奨）
make check
```

### リリース前の流れ

```bash
# 1. キャッシュをクリア
make clean

# 2. 全チェックを実行
make check

# 3. Dockerイメージをビルド
make docker-build

# 4. Dockerでテスト実行
make docker-run
```

### トラブルシューティング時の流れ

```bash
# 1. キャッシュをクリア
make clean

# 2. 依存関係を再インストール
make install

# 3. 開発サーバーを起動
make dev
```

---

## カスタマイズ方法

### 新しいコマンドを追加

```makefile
# 新しいコマンドを追加
.PHONY: new-command

new-command: ## 新しいコマンドの説明
	@echo "新しいコマンドを実行中..."
	# ここにコマンドを記述
```

### 既存のコマンドを変更

```makefile
# 既存のコマンドを変更
test: ## テストを実行（カスタマイズ版）
	pytest -v --cov=. --cov-report=html
```

### 環境変数を使用

```makefile
# 環境変数を使用
dev: ## 開発サーバーを起動
	uvicorn main:app --reload --host $(HOST) --port $(PORT)

# デフォルト値を設定
HOST ?= 0.0.0.0
PORT ?= 8000
```

### 条件分岐を使用

```makefile
# 条件分岐を使用
test: ## テストを実行
ifeq ($(ENV), production)
	@echo "本番環境ではテストをスキップします"
else
	pytest
endif
```

### 複数のターゲットを組み合わせ

```makefile
# 複数のターゲットを組み合わせ
setup: install format lint ## 開発環境のセットアップ
	@echo "開発環境のセットアップが完了しました"

deploy: check docker-build ## デプロイ
	@echo "デプロイが完了しました"
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. "make: command not found" エラー

**問題**: Makeがインストールされていない

**解決方法**:
```bash
# Ubuntu/Debian
sudo apt-get install make

# macOS
xcode-select --install

# Windows (WSL)
sudo apt-get install make
```

#### 2. "make: *** No rule to make target" エラー

**問題**: ターゲットが存在しない

**解決方法**:
```bash
# 利用可能なコマンドを確認
make help

# 正しいコマンド名を使用
make dev  # 正しい
make run  # 間違い（存在しない）
```

#### 3. "make: *** [target] Error 1" エラー

**問題**: コマンドの実行に失敗

**解決方法**:
```bash
# 詳細なエラー情報を確認
make -d target

# 個別にコマンドを実行してエラーを特定
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 4. インデントエラー

**問題**: タブとスペースの混在

**解決方法**:
```makefile
# 正しい（タブを使用）
target:
	command

# 間違い（スペースを使用）
target:
    command
```

#### 5. 依存関係の問題

**問題**: 依存関係が正しくインストールされていない

**解決方法**:
```bash
# キャッシュをクリア
make clean

# 依存関係を再インストール
make install

# 仮想環境を使用
python -m venv venv
source venv/bin/activate  # Linux/macOS
# または
venv\Scripts\activate     # Windows
make install
```

### デバッグ方法

#### 1. 詳細モードで実行

```bash
# 詳細な出力を表示
make -d target

# コマンドを実行せずに表示
make -n target
```

#### 2. 特定のコマンドをテスト

```bash
# 個別にコマンドを実行
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pytest
flake8 .
mypy .
black .
```

#### 3. 環境変数を確認

```bash
# 環境変数を表示
env | grep -E "(PATH|PYTHON|VIRTUAL)"

# Pythonのパスを確認
which python
python --version
```

---

## まとめ

Makefileを使用することで、以下のメリットが得られます：

1. **統一性**: チーム全体で同じコマンドを使用
2. **効率性**: 長いコマンドを短縮
3. **ドキュメント化**: コマンドの目的が明確
4. **自動化**: 複数のコマンドを組み合わせて実行
5. **保守性**: コマンドの変更が一箇所で済む

定期的に`make help`を実行して、利用可能なコマンドを確認し、適切に活用することが重要です。
