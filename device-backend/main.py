import os, time
from decimal import Decimal
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
from typing import List

# 認証モジュールのインポート
from app.auth.endpoints import router as auth_router
from app.auth.dependencies import get_current_user_id


# ---------- 環境 ----------
AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")
REGISTRY_TBL = os.getenv("REGISTRY_TABLE", "DeviceRegistryV2")
USER_TBL     = os.getenv("USER_TABLE", "UserRegistry")
DEVICE_MASTER_TBL = os.getenv("DEVICE_MASTER_TABLE", "DeviceMaster")
TS_DB        = os.getenv("TS_DB", "iot_waterlevel_db")
TS_TABLE     = os.getenv("TS_TABLE", "distance_table")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
ddb_tbl  = dynamodb.Table(REGISTRY_TBL)
user_tbl = dynamodb.Table(USER_TBL)
device_master_tbl = dynamodb.Table(DEVICE_MASTER_TBL)
ts_query = boto3.client("timestream-query", region_name=AWS_REGION)

# ---------- スキーマ ----------
class ClaimRequest(BaseModel):
    deviceId: str
    lat: float
    lon: float

class DeviceItem(BaseModel):
    userId: str
    deviceId: str
    label: Optional[str] = None
    fieldId: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    claimStatus: str
    createdAt: str
    updatedAt: str

class LatestMetric(BaseModel):
    deviceId: str
    time: Optional[str] = None
    distance: Optional[float] = None

# ---------- アプリ ----------
app = FastAPI(
    title="IoT Water Level Device Registry API",
    description="""
    ## 水位センサーデバイス管理API
    
    このAPIは、IoT水位センサーデバイスの登録、位置管理、データ取得を行うためのRESTful APIです。
    
    ### 主な機能
    - デバイス一覧の取得
    - デバイスの位置登録
    - 最新の水位データ取得
    - デバイスの履歴データ取得
    - 全デバイスの統計情報取得
    
    ### データソース
    - **DynamoDB**: デバイス情報の管理
    - **AWS Timestream**: 時系列データ（水位測定値）の管理
    """,
    version="1.0.0",
    contact={
        "name": "IoT Water Level System",
        "email": "admin@example.com",
    },
    license_info={
        "name": "MIT",
    },
)

# セキュリティヘッダーミドルウェア
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # セキュリティヘッダーを追加
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # HTTPS環境でのみ追加
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# CSRF保護ミドルウェア
@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    # GET、HEAD、OPTIONSリクエストは除外
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return await call_next(request)
    
    # 認証エンドポイントは除外（ログイン時はCSRFトークンがまだない）
    if request.url.path.startswith("/api/v1/auth/login"):
        return await call_next(request)
    
    
    # CSRFトークンをチェック
    csrf_token_header = request.headers.get("X-CSRF-Token")
    csrf_token_cookie = request.cookies.get("csrf_token")
    
    if not csrf_token_header or not csrf_token_cookie:
        return Response(
            content='{"detail": "CSRF token missing"}',
            status_code=403,
            media_type="application/json"
        )
    
    if csrf_token_header != csrf_token_cookie:
        return Response(
            content='{"detail": "CSRF token mismatch"}',
            status_code=403,
            media_type="application/json"
        )
    
    return await call_next(request)

# CORS
origins = [
    "http://localhost:3000",  # Next.js開発サーバー
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# 環境変数で追加のオリジンを指定可能
env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins:
    origins.extend([o.strip() for o in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 認証ルーターを追加
app.include_router(auth_router, prefix="/api/v1")

def now_utc_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

# ---------- エンドポイント ----------

@app.post("/devices/claim", response_model=DeviceItem,
          summary="デバイスをクレーム",
          description="利用可能なデバイスを選択してクレームし、位置情報を登録します。")
def claim_device(body: ClaimRequest, user_id: str = Depends(get_current_user_id)):
    try:
        # 1. DeviceMasterテーブルから指定されたデバイスが利用可能かチェック
        device_master_response = device_master_tbl.get_item(
            Key={"deviceId": body.deviceId}
        )
        
        if not device_master_response.get("Item"):
            raise HTTPException(400, f"Device {body.deviceId} not found in DeviceMaster")
        
        device_master = device_master_response["Item"]
        
        if device_master.get("status") != "available":
            raise HTTPException(400, f"Device {body.deviceId} is not available for claiming")
        
        # 2. 既にクレームされているかチェック
        existing_device = ddb_tbl.get_item(Key={"userId": user_id, "deviceId": body.deviceId})
        if existing_device.get("Item"):
            raise HTTPException(409, f"Device {body.deviceId} is already claimed by this user")
        
        # 3. 他のユーザーがクレームしていないかチェック
        scan_response = ddb_tbl.scan(
            FilterExpression="deviceId = :device_id AND claimStatus = :status",
            ExpressionAttributeValues={
                ":device_id": body.deviceId,
                ":status": "claimed"
            }
        )
        if scan_response.get("Items"):
            raise HTTPException(409, f"Device {body.deviceId} is already claimed by another user")
        
        # 4. デバイスをクレーム
        device_item = {
            "userId": user_id,
            "deviceId": body.deviceId,
            "label": device_master.get("label", f"デバイス {body.deviceId[-3:]}"),
            "fieldId": f"field-{body.deviceId[-3:]}",
            "lat": Decimal(str(body.lat)),
            "lon": Decimal(str(body.lon)),
            "claimStatus": "claimed",
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso()
        }
        
        # 5. DeviceRegistryV2にユーザーのデバイスとして登録
        ddb_tbl.put_item(Item=device_item)
        
        # 6. DeviceMasterテーブルのステータスを更新
        device_master_tbl.update_item(
            Key={"deviceId": body.deviceId},
            UpdateExpression="SET #status = :status, updatedAt = :updated_at",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "claimed",
                ":updated_at": now_utc_iso()
            }
        )
        
        print(f"DEBUG: Device {body.deviceId} claimed by user {user_id}")
        
        return DeviceItem(
            userId=user_id,
            deviceId=body.deviceId,
            label=device_item["label"],
            fieldId=device_item["fieldId"],
            lat=body.lat,
            lon=body.lon,
            claimStatus="claimed",
            createdAt=device_item["createdAt"],
            updatedAt=device_item["updatedAt"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Failed to claim device: {str(e)}")
        raise HTTPException(500, f"Failed to claim device: {str(e)}")

@app.get("/devices/{deviceId}/latest", response_model=LatestMetric,
         summary="デバイスの最新データを取得",
         description="指定されたデバイスIDの最新の水位測定データを取得します。")
def latest_metric(deviceId: str, user_id: str = Depends(get_current_user_id)):
    # ユーザーがこのデバイスを所有しているかチェック
    device_check = ddb_tbl.get_item(Key={"userId": user_id, "deviceId": deviceId})
    if not device_check.get("Item"):
        raise HTTPException(404, f"Device {deviceId} not found or not owned by user")
    
    q = f"""
    SELECT time, measure_value::double AS distance
    FROM "{TS_DB}"."{TS_TABLE}"
    WHERE measure_name='distance' AND deviceId = '{deviceId}'
    ORDER BY time DESC
    LIMIT 1
    """
    res = ts_query.query(QueryString=q)
    rows = res.get("Rows", [])
    if not rows:
        return LatestMetric(deviceId=deviceId, time=None, distance=None)
    data = rows[0]["Data"]
    return LatestMetric(
        deviceId=deviceId,
        time=data[0]["ScalarValue"],
        distance=float(data[1]["ScalarValue"])
    )

@app.get("/devices/{deviceId}/history",
         summary="デバイスの履歴データを取得",
         description="指定されたデバイスIDの過去の水位測定データを取得します。")
def device_history(deviceId: str, hours: int = 24, limit: int = 100, user_id: str = Depends(get_current_user_id)):
    """デバイスの履歴データを取得"""
    # ユーザーがこのデバイスを所有しているかチェック
    device_check = ddb_tbl.get_item(Key={"userId": user_id, "deviceId": deviceId})
    if not device_check.get("Item"):
        raise HTTPException(404, f"Device {deviceId} not found or not owned by user")
    
    q = f"""
    SELECT time, measure_value::double AS distance
    FROM "{TS_DB}"."{TS_TABLE}"
    WHERE measure_name='distance' 
    AND deviceId = '{deviceId}'
    AND time > ago({hours}h)
    ORDER BY time DESC
    LIMIT {limit}
    """
    res = ts_query.query(QueryString=q)
    rows = res.get("Rows", [])
    
    history = []
    for row in rows:
        data = row["Data"]
        history.append({
            "time": data[0]["ScalarValue"],
            "distance": float(data[1]["ScalarValue"])
        })
    
    return {
        "deviceId": deviceId,
        "history": history,
        "count": len(history)
    }

@app.get("/devices/stats",
         summary="全デバイスの統計情報を取得",
         description="登録済みデバイスの統計情報と最新データを一括取得します。")
def devices_stats(user_id: str = Depends(get_current_user_id)):
    """全デバイスの統計情報を取得"""
    
    # ユーザー固有のデバイス一覧を取得
    resp = ddb_tbl.query(
        KeyConditionExpression="userId = :user_id",
        ExpressionAttributeValues={":user_id": user_id}
    )
    items = resp.get("Items", [])
    
    claimed_devices = [item for item in items if item.get("claimStatus") == "claimed"]
    
    # 各デバイスの最新データを取得
    device_stats = []
    for device in claimed_devices:
        device_id = device["deviceId"]
        try:
            # Timestreamから最新データを直接取得
            q = f"""
            SELECT time, measure_value::double AS distance
            FROM "{TS_DB}"."{TS_TABLE}"
            WHERE measure_name='distance' AND deviceId = '{device_id}'
            ORDER BY time DESC
            LIMIT 1
            """
            
            result = ts_query.query(QueryString=q)
            records = result.get('Rows', [])
            
            if records:
                # 最新のレコードを取得
                latest_record = records[0]
                time_value = latest_record['Data'][0].get('ScalarValue')
                distance_value = latest_record['Data'][1].get('ScalarValue')
                
                device_stats.append({
                    "userId": device["userId"],
                    "deviceId": device_id,
                    "label": device.get("label"),
                    "fieldId": device.get("fieldId"),
                    "lat": float(device["lat"]) if device.get("lat") else None,
                    "lon": float(device["lon"]) if device.get("lon") else None,
                    "latestDistance": float(distance_value) if distance_value else None,
                    "lastUpdate": time_value,
                    "claimStatus": device.get("claimStatus", "unclaimed")
                })
            else:
                # データがない場合
                device_stats.append({
                    "userId": device["userId"],
                    "deviceId": device_id,
                    "label": device.get("label"),
                    "fieldId": device.get("fieldId"),
                    "lat": float(device["lat"]) if device.get("lat") else None,
                    "lon": float(device["lon"]) if device.get("lon") else None,
                    "latestDistance": None,
                    "lastUpdate": None,
                    "claimStatus": device.get("claimStatus", "unclaimed")
                })
        except Exception as e:
            print(f"ERROR: Failed to get latest data for device {device_id}: {str(e)}")
            # データが取得できない場合はデフォルト値で追加
            device_stats.append({
                "userId": device["userId"],
                "deviceId": device_id,
                "label": device.get("label"),
                "fieldId": device.get("fieldId"),
                "lat": float(device["lat"]) if device.get("lat") else None,
                "lon": float(device["lon"]) if device.get("lon") else None,
                "latestDistance": None,
                "lastUpdate": None,
                "claimStatus": device.get("claimStatus", "unclaimed")
            })
    
    return {
        "userId": user_id,
        "totalDevices": len(items),
        "claimedDevices": len(claimed_devices),
        "devices": device_stats
    }

@app.get("/devices/available", response_model=List[dict],
         summary="利用可能なデバイス一覧を取得",
         description="クレーム可能なデバイスの一覧を取得します。")
def get_available_devices():
    """利用可能なデバイス一覧を取得（クレーム可能なデバイス）"""
    try:
        print(f"DEBUG: Starting get_available_devices")
        print(f"DEBUG: Using table: {device_master_tbl.table_name}")
        
        # DeviceMasterテーブルから利用可能なデバイスを取得
        # statusは予約語なので、ExpressionAttributeNamesを使用
        response = device_master_tbl.scan(
            FilterExpression="#status = :status",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "available"
            }
        )
        
        print(f"DEBUG: Raw response from DynamoDB: {response}")
        
        available_devices = []
        for item in response.get("Items", []):
            device_data = {
                "deviceId": item["deviceId"],
                "label": item.get("label", f"デバイス {item['deviceId'][-3:]}"),
                "description": item.get("description", "水位監視センサー"),
                "location": item.get("location", "未設定")
            }
            available_devices.append(device_data)
            print(f"DEBUG: Added device: {device_data}")
        
        print(f"DEBUG: Found {len(available_devices)} available devices from DeviceMaster table")
        print(f"DEBUG: Returning devices: {available_devices}")
        return available_devices
        
    except Exception as e:
        print(f"ERROR: Failed to get available devices from DeviceMaster: {str(e)}")
        import traceback
        print(f"ERROR: Traceback: {traceback.format_exc()}")
        # エラー時は空のリストを返す
        return []

@app.get("/debug/devices", summary="デバッグ用: デバイス情報を取得")
def debug_devices():
    """デバッグ用: DeviceMasterテーブルの内容を確認"""
    try:
        # 全アイテムをスキャン
        response = device_master_tbl.scan()
        all_items = response.get("Items", [])
        
        # availableなアイテムをフィルタリング
        available_response = device_master_tbl.scan(
            FilterExpression="#status = :status",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "available"
            }
        )
        available_items = available_response.get("Items", [])
        
        return {
            "table_name": device_master_tbl.table_name,
            "total_items": len(all_items),
            "available_items": len(available_items),
            "all_items": all_items,
            "available_items": available_items
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "table_name": device_master_tbl.table_name if 'device_master_tbl' in locals() else "Unknown"
        }

@app.get("/devices", response_model=List[DeviceItem],
         summary="ユーザーのデバイス一覧を取得",
         description="ログインユーザーがクレームしたデバイスの一覧を取得します。")
def list_devices(user_id: str = Depends(get_current_user_id)):
    # Cognito認証からユーザーIDを取得
    print(f"DEBUG: Current user_id: {user_id}")
    
    resp = ddb_tbl.query(
        KeyConditionExpression="userId = :user_id",
        ExpressionAttributeValues={":user_id": user_id}
    )
    items = resp.get("Items", [])
    print(f"DEBUG: Found {len(items)} devices for user {user_id}")
    
    # デバイスが存在しない場合は空のリストを返す（自動テストデバイス作成を停止）
    if not items:
        print(f"DEBUG: No devices found for user {user_id}, returning empty list")
    
    out = []
    for it in items:
        out.append(DeviceItem(
            userId=it["userId"],
            deviceId=it["deviceId"],
            label=it.get("label"),
            fieldId=it.get("fieldId"),
            # ここで None の場合は float に変換せず、そのまま None を返す
            lat=float(it["lat"]) if it.get("lat") is not None else None,
            lon=float(it["lon"]) if it.get("lon") is not None else None,
            claimStatus=it.get("claimStatus","unclaimed"),
            createdAt=it.get("createdAt", now_utc_iso()),
            updatedAt=it.get("updatedAt", now_utc_iso()),
        ))
    return out


@app.get("/devices/{deviceId}", response_model=DeviceItem,
         summary="デバイス詳細を取得",
         description="指定されたデバイスIDの詳細情報を取得します。")
def get_device(deviceId: str, user_id: str = Depends(get_current_user_id)):
    # Cognito認証からユーザーIDを取得
    print(f"DEBUG: Looking for deviceId={deviceId}, userId={user_id}")
    
    r = ddb_tbl.get_item(Key={"userId": user_id, "deviceId": deviceId})
    it = r.get("Item")
    print(f"DEBUG: DynamoDB response: {r}")
    
    if not it:
        # デバッグ用: ユーザーの全デバイスを確認
        resp = ddb_tbl.query(
            KeyConditionExpression="userId = :user_id",
            ExpressionAttributeValues={":user_id": user_id}
        )
        user_devices = resp.get("Items", [])
        print(f"DEBUG: User has {len(user_devices)} devices: {[d['deviceId'] for d in user_devices]}")
        raise HTTPException(404, f"device not found for userId={user_id}, deviceId={deviceId}")

    return DeviceItem(
        userId=it["userId"],
        deviceId=it["deviceId"],
        label=it.get("label"),
        fieldId=it.get("fieldId"),
        lat=float(it["lat"]) if it.get("lat") is not None else None,
        lon=float(it["lon"]) if it.get("lon") is not None else None,
        claimStatus=it.get("claimStatus", "unclaimed"),
        createdAt=it.get("createdAt", now_utc_iso()),
        updatedAt=it.get("updatedAt", now_utc_iso()),
    )