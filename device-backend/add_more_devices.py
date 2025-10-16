#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DeviceMasterテーブルに追加のデバイスを投入するスクリプト
"""

import boto3
import os
from datetime import datetime, timezone

def add_more_devices():
    """DeviceMasterテーブルに追加のデバイスを投入"""
    
    # DynamoDBリソースを初期化
    dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')
    
    # テーブル名を取得
    table_name = os.getenv('DEVICE_MASTER_TABLE', 'DeviceMaster')
    table = dynamodb.Table(table_name)
    
    print(f"DeviceMasterテーブルに追加デバイスを投入中...")
    print(f"テーブル名: {table_name}")
    
    # 追加するデバイスデータ
    additional_devices = [
        {
            "deviceId": "440525060026079",
            "label": "水位センサー2",
            "description": "main",
            "location": "TestB",
            "status": "available",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "deviceId": "440525060026080",
            "label": "水位センサー3",
            "description": "main",
            "location": "TestC",
            "status": "available",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "deviceId": "440525060026081",
            "label": "水位センサー4",
            "description": "main",
            "location": "TestD",
            "status": "available",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "deviceId": "440525060026082",
            "label": "水位センサー5",
            "description": "main",
            "location": "TestE",
            "status": "available",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # デバイスを追加
    for device in additional_devices:
        try:
            table.put_item(Item=device)
            print(f"✅ デバイス {device['deviceId']} を追加しました")
        except Exception as e:
            print(f"❌ デバイス {device['deviceId']} の追加に失敗: {str(e)}")
    
    # 現在の利用可能デバイス数を確認
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
        available_count = len(response.get('Items', []))
        print(f"\n現在の利用可能デバイス数: {available_count}")
        
        # 利用可能デバイス一覧を表示
        print("\n利用可能デバイス一覧:")
        for device in response.get('Items', []):
            print(f"  - {device['deviceId']}: {device['label']} ({device['location']})")
            
    except Exception as e:
        print(f"❌ 利用可能デバイスの確認に失敗: {str(e)}")

if __name__ == "__main__":
    add_more_devices()

