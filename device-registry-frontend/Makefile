.PHONY: help install dev build test lint format clean

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## 依存関係をインストール
	npm install

dev: ## 開発サーバーを起動
	npm run dev

build: ## プロダクションビルド
	npm run build

start: ## プロダクションサーバーを起動
	npm run start

test: ## テストを実行
	npm run test

test:watch: ## テストをウォッチモードで実行
	npm run test:watch

test:coverage: ## テストカバレッジを表示
	npm run test:coverage

lint: ## リントを実行
	npm run lint

lint:fix: ## リントエラーを自動修正
	npm run lint:fix

type-check: ## TypeScriptの型チェック
	npm run type-check

format: ## コードをフォーマット
	npm run format

format:check: ## フォーマットチェック
	npm run format:check

clean: ## キャッシュファイルを削除
	rm -rf .next
	rm -rf node_modules/.cache
	rm -rf coverage

check: format lint type-check test ## フォーマット、リント、型チェック、テストを実行

docker-build: ## Dockerイメージをビルド
	docker build -t iot-waterlevel-frontend .

docker-run: ## Dockerコンテナを実行
	docker run -p 3000:3000 iot-waterlevel-frontend
