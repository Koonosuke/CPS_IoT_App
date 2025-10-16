.PHONY: help install dev test lint format clean setup-device-master

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## 依存関係をインストール
	pip install -r requirements.txt

dev: ## 開発サーバーを起動
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

test: ## テストを実行
	pytest

lint: ## コードの品質チェック
	flake8 .
	mypy .

format: ## コードをフォーマット
	black .

clean: ## キャッシュファイルを削除
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +

check: format lint test ## フォーマット、リント、テストを実行

docker-build: ## Dockerイメージをビルド
	docker build -t iot-waterlevel-api .

docker-run: ## Dockerコンテナを実行
	docker run -p 8000:8000 iot-waterlevel-api

setup-device-master: ## DeviceMasterテーブルを作成し、初期データを投入
	python setup_device_master.py
