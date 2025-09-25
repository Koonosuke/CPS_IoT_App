import os, time
from decimal import Decimal
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
from typing import List


# ---------- 環境 ----------
AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")
REGISTRY_TBL = os.getenv("REGISTRY_TABLE", "DeviceRegistryV2")
TS_DB        = os.getenv("TS_DB", "iot_waterlevel_db")
TS_TABLE     = os.getenv("TS_TABLE", "distance_table")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
ddb_tbl  = dynamodb.Table(REGISTRY_TBL)
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

# CORS
origins = [o.strip() for o in os.getenv("CORS_ORIGINS","*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def now_utc_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

# ---------- エンドポイント ----------

@app.post("/devices/claim", response_model=DeviceItem, 
          summary="デバイスの位置を登録",
          description="指定されたデバイスIDの位置情報（緯度・経度）を登録します。")
def claim_device(body: ClaimRequest):
    # 仮のユーザーID（後でCognito認証に置き換え）
    user_id = "user-001"
    
    r = ddb_tbl.get_item(Key={"userId": user_id, "deviceId": body.deviceId})
    it = r.get("Item")
    if not it:
        raise HTTPException(404, "device not found")
    if it.get("claimStatus") == "claimed":
        raise HTTPException(409, "already claimed")

    ddb_tbl.update_item(
        Key={"userId": user_id, "deviceId": body.deviceId},
        UpdateExpression="SET lat=:lat, lon=:lon, claimStatus=:c, updatedAt=:u",
        ExpressionAttributeValues={
            ":lat": Decimal(str(body.lat)),
            ":lon": Decimal(str(body.lon)),
            ":c": "claimed",
            ":u": now_utc_iso(),
            ":expected": "unclaimed"
        },
        ConditionExpression="claimStatus = :expected"
    )

    return DeviceItem(
        userId=user_id,
        deviceId=body.deviceId,
        label=it.get("label"),
        fieldId=it.get("fieldId"),
        lat=body.lat,
        lon=body.lon,
        claimStatus="claimed",
        createdAt=it.get("createdAt", now_utc_iso()),
        updatedAt=now_utc_iso(),
    )

@app.get("/devices/{deviceId}/latest", response_model=LatestMetric,
         summary="デバイスの最新データを取得",
         description="指定されたデバイスIDの最新の水位測定データを取得します。")
def latest_metric(deviceId: str):
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
def device_history(deviceId: str, hours: int = 24, limit: int = 100):
    """デバイスの履歴データを取得"""
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
def devices_stats():
    """全デバイスの統計情報を取得"""
    # 仮のユーザーID（後でCognito認証に置き換え）
    user_id = "user-001"
    
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
            latest = latest_metric(device_id)
            device_stats.append({
                "userId": device["userId"],
                "deviceId": device_id,
                "label": device.get("label"),
                "fieldId": device.get("fieldId"),
                "lat": float(device["lat"]) if device.get("lat") else None,
                "lon": float(device["lon"]) if device.get("lon") else None,
                "latestDistance": latest.distance,
                "lastUpdate": latest.time,
                "claimStatus": device.get("claimStatus", "unclaimed")
            })
        except Exception as e:
            # データが取得できない場合はスキップ
            continue
    
    return {
        "userId": user_id,
        "totalDevices": len(items),
        "claimedDevices": len(claimed_devices),
        "devices": device_stats
    }

@app.get("/devices", response_model=List[DeviceItem],
         summary="デバイス一覧を取得",
         description="登録されている全デバイスの一覧を取得します。")
def list_devices():
    # 仮のユーザーID（後でCognito認証に置き換え）
    user_id = "user-001"
    
    resp = ddb_tbl.query(
        KeyConditionExpression="userId = :user_id",
        ExpressionAttributeValues={":user_id": user_id}
    )
    items = resp.get("Items", [])
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
def get_device(deviceId: str):
    # 仮のユーザーID（後でCognito認証に置き換え）
    user_id = "user-001"
    
    r = ddb_tbl.get_item(Key={"userId": user_id, "deviceId": deviceId})
    it = r.get("Item")
    if not it:
        raise HTTPException(404, "device not found")

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