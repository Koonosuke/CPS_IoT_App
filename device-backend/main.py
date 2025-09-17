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
REGISTRY_TBL = os.getenv("REGISTRY_TABLE", "DeviceRegistry")
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
    deviceId: str
    label: Optional[str] = None
    fieldId: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    claimStatus: str
    updatedAt: str

class LatestMetric(BaseModel):
    deviceId: str
    time: Optional[str] = None
    distance: Optional[float] = None

# ---------- アプリ ----------
app = FastAPI(title="Waterlevel Registry API", version="0.1.0")

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

@app.post("/devices/claim", response_model=DeviceItem)
def claim_device(body: ClaimRequest):
    r = ddb_tbl.get_item(Key={"deviceId": body.deviceId})
    it = r.get("Item")
    if not it:
        raise HTTPException(404, "device not found")
    if it.get("claimStatus") == "claimed":
        raise HTTPException(409, "already claimed")

    ddb_tbl.update_item(
        Key={"deviceId": body.deviceId},
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
        deviceId=body.deviceId,
        label=it.get("label"),
        fieldId=it.get("fieldId"),
        lat=body.lat,
        lon=body.lon,
        claimStatus="claimed",
        updatedAt=now_utc_iso(),
    )

@app.get("/devices/{deviceId}/latest", response_model=LatestMetric)
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

@app.get("/devices", response_model=List[DeviceItem])
def list_devices():
    resp = ddb_tbl.scan()
    items = resp.get("Items", [])
    out = []
    for it in items:
        out.append(DeviceItem(
            deviceId=it["deviceId"],
            label=it.get("label"),
            fieldId=it.get("fieldId"),
            # ここで None の場合は float に変換せず、そのまま None を返す
            lat=float(it["lat"]) if it.get("lat") is not None else None,
            lon=float(it["lon"]) if it.get("lon") is not None else None,
            claimStatus=it.get("claimStatus","unclaimed"),
            updatedAt=it.get("updatedAt", now_utc_iso()),
        ))
    return out


@app.get("/devices/{deviceId}", response_model=DeviceItem)
def get_device(deviceId: str):
    r = ddb_tbl.get_item(Key={"deviceId": deviceId})
    it = r.get("Item")
    if not it:
        raise HTTPException(404, "device not found")

    return DeviceItem(
        deviceId=it["deviceId"],
        label=it.get("label"),
        fieldId=it.get("fieldId"),
        lat=float(it["lat"]) if it.get("lat") is not None else None,
        lon=float(it["lon"]) if it.get("lon") is not None else None,
        claimStatus=it.get("claimStatus", "unclaimed"),
        updatedAt=it.get("updatedAt", now_utc_iso()),
    )