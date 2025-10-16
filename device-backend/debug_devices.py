#!/usr/bin/env python3
"""
DeviceMasterテーブルのデバッグ用スクリプト
"""

import boto3
import os

def debug_device_master():
    """DeviceMasterテーブルの内容をデバッグ"""
    try:
        # DynamoDBに接続
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('DeviceMaster')
        
        print("🔍 DeviceMasterテーブルのデバッグ開始")
        print("=" * 50)
        
        # 1. テーブルの基本情報を取得
        try:
            table.load()
            print(f"✅ テーブル名: {table.table_name}")
            print(f"✅ テーブル状態: {table.table_status}")
            print(f"✅ アイテム数: {table.item_count}")
        except Exception as e:
            print(f"❌ テーブル情報取得エラー: {str(e)}")
            return
        
        # 2. 全アイテムをスキャン
        print("\n📋 全アイテムのスキャン:")
        try:
            response = table.scan()
            items = response.get('Items', [])
            print(f"総アイテム数: {len(items)}")
            
            for i, item in enumerate(items, 1):
                print(f"\n--- アイテム {i} ---")
                for key, value in item.items():
                    print(f"  {key}: {value}")
        except Exception as e:
            print(f"❌ スキャンエラー: {str(e)}")
        
        # 3. status="available"のアイテムをフィルタリング
        print("\n🔍 status='available'のアイテム:")
        try:
            response = table.scan(
                FilterExpression="#status = :status",
                ExpressionAttributeNames={
                    "#status": "status"
                },
                ExpressionAttributeValues={
                    ":status": "available"
                }
            )
            available_items = response.get('Items', [])
            print(f"利用可能アイテム数: {len(available_items)}")
            
            for i, item in enumerate(available_items, 1):
                print(f"\n--- 利用可能アイテム {i} ---")
                for key, value in item.items():
                    print(f"  {key}: {value}")
        except Exception as e:
            print(f"❌ フィルタリングエラー: {str(e)}")
        
        # 4. 特定のデバイスIDで取得
        print("\n🎯 特定デバイスID (440525060026078) の取得:")
        try:
            response = table.get_item(
                Key={"deviceId": "440525060026078"}
            )
            if response.get('Item'):
                print("✅ デバイスが見つかりました:")
                for key, value in response['Item'].items():
                    print(f"  {key}: {value}")
            else:
                print("❌ デバイスが見つかりませんでした")
        except Exception as e:
            print(f"❌ 特定デバイス取得エラー: {str(e)}")
        
        print("\n" + "=" * 50)
        print("🔍 デバッグ完了")
        
    except Exception as e:
        print(f"❌ デバッグエラー: {str(e)}")

if __name__ == "__main__":
    debug_device_master()
