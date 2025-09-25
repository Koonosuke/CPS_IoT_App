#!/usr/bin/env python3
"""
UserRegistryテーブルの接続テスト
"""

import boto3
import json
from datetime import datetime

# AWS設定
AWS_REGION = "us-east-1"
USER_TABLE = "UserRegistry"

def test_user_table():
    """UserRegistryテーブルの接続テスト"""
    try:
        # DynamoDBリソース作成
        dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        user_table = dynamodb.Table(USER_TABLE)
        
        print(f"🔍 UserRegistryテーブル ({USER_TABLE}) の接続テスト開始...")
        
        # テーブル情報取得
        table_info = user_table.table_status
        print(f"✅ テーブル状態: {table_info}")
        
        # テストデータ作成
        test_user = {
            "userId": "test-user-001",
            "email": "test@example.com",
            "username": "testuser",
            "firstName": "テスト",
            "lastName": "ユーザー",
            "organization": "テスト組織",
            "role": "user",
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "updatedAt": datetime.utcnow().isoformat() + "Z",
            "isActive": True
        }
        
        # データ挿入テスト
        print("📝 テストデータ挿入中...")
        user_table.put_item(Item=test_user)
        print("✅ データ挿入成功")
        
        # データ取得テスト
        print("🔍 データ取得テスト中...")
        response = user_table.get_item(Key={"userId": "test-user-001"})
        if "Item" in response:
            print("✅ データ取得成功")
            print(f"取得データ: {json.dumps(response['Item'], indent=2, ensure_ascii=False)}")
        else:
            print("❌ データ取得失敗")
        
        # データ削除（クリーンアップ）
        print("🗑️ テストデータ削除中...")
        user_table.delete_item(Key={"userId": "test-user-001"})
        print("✅ テストデータ削除完了")
        
        print("🎉 UserRegistryテーブルの接続テスト完了！")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    test_user_table()
