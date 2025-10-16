#!/usr/bin/env python3
"""
DeviceMasterテーブルの作成と初期データ投入スクリプト
"""

import boto3
import os
import time
from decimal import Decimal

def now_utc_iso():
    """現在のUTC時刻をISO形式で返す"""
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def create_device_master_table():
    """DeviceMasterテーブルを作成"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    table_name = 'DeviceMaster'
    
    try:
        # テーブルが既に存在するかチェック
        existing_table = dynamodb.Table(table_name)
        existing_table.load()
        print(f"✅ テーブル '{table_name}' は既に存在します")
        return existing_table
    except Exception:
        pass
    
    try:
        # テーブルを作成
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'deviceId',
                    'KeyType': 'HASH'  # パーティションキー
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'deviceId',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST'  # オンデマンド課金
        )
        
        # テーブルの作成完了を待つ
        print(f"⏳ テーブル '{table_name}' の作成中...")
        table.wait_until_exists()
        print(f"✅ テーブル '{table_name}' が作成されました")
        
        return table
        
    except Exception as e:
        print(f"❌ テーブル作成エラー: {str(e)}")
        raise

def insert_initial_devices():
    """初期デバイスデータを投入"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table('DeviceMaster')
    
    # 複数のデバイスデータ
    devices = [
        {
            "deviceId": "440525060026078",
            "label": "水位センサー #1",
            "description": "メインの水位監視センサー（Timestream連携済み）",
            "location": "貯水池A",
            "status": "available",
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso()
        },
        {
            "deviceId": "440525060026079",
            "label": "水位センサー #2", 
            "description": "予備の水位監視センサー",
            "location": "貯水池B",
            "status": "available",
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso()
        },
        {
            "deviceId": "440525060026080",
            "label": "水位センサー #3",
            "description": "緊急用の水位監視センサー",
            "location": "貯水池C", 
            "status": "available",
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso()
        },
        {
            "deviceId": "440525060026081",
            "label": "水位センサー #4",
            "description": "監視用の水位センサー",
            "location": "貯水池D",
            "status": "available", 
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso()
        },
        {
            "deviceId": "440525060026082",
            "label": "水位センサー #5",
            "description": "バックアップ用の水位センサー",
            "location": "貯水池E",
            "status": "available",
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso()
        }
    ]
    
    print(f"📝 {len(devices)}個のデバイスデータを投入中...")
    
    for device in devices:
        try:
            table.put_item(Item=device)
            print(f"✅ デバイス {device['deviceId']} を投入しました")
        except Exception as e:
            print(f"❌ デバイス {device['deviceId']} の投入に失敗: {str(e)}")
    
    print(f"🎉 デバイスデータの投入が完了しました")

def verify_data():
    """投入されたデータを確認"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table('DeviceMaster')
    
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        print(f"\n📊 DeviceMasterテーブルの内容:")
        print(f"総デバイス数: {len(items)}")
        
        available_count = len([item for item in items if item.get('status') == 'available'])
        print(f"利用可能デバイス数: {available_count}")
        
        print(f"\n📋 デバイス一覧:")
        for item in items:
            print(f"  - {item['deviceId']}: {item['label']} ({item['location']}) - {item['status']}")
            
    except Exception as e:
        print(f"❌ データ確認エラー: {str(e)}")

def main():
    """メイン処理"""
    print("🚀 DeviceMasterテーブルのセットアップを開始します")
    
    try:
        # 1. テーブル作成
        table = create_device_master_table()
        
        # 2. 初期データ投入
        insert_initial_devices()
        
        # 3. データ確認
        verify_data()
        
        print("\n✅ DeviceMasterテーブルのセットアップが完了しました！")
        
    except Exception as e:
        print(f"\n❌ セットアップエラー: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())

