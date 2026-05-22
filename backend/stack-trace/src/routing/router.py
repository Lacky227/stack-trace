from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect,
    Query,
)
from websocket import manager
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import timedelta

from depends import get_db
from schemas import schemas
from services.service import DeviceService, MetricService, AuthService, UserService
from repositories.repository import AlertRepository
from security.auth import (
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_admin,
    get_current_user,
)
from fastapi_cache.decorator import cache

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/auth/login", response_model=schemas.Token, tags=["Auth"])
async def login(login_data: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        login_data.username, login_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users", response_model=List[schemas.UserResponse], tags=["Users"])
async def get_users(
    db: AsyncSession = Depends(get_db), admin: dict = Depends(get_current_admin)
):
    user_service = UserService(db)
    return await user_service.get_all_users()


@router.post("/users", response_model=schemas.UserResponse, tags=["Users"])
async def create_user(
    user_data: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    user_service = UserService(db)
    return await user_service.create_user(user_data)


@router.get("/devices", response_model=List[schemas.DeviceResponse], tags=["Devices"])
@cache(expire=3)
async def get_devices(
    search: Optional[str] = Query(None, description="Search by name or ip address"),
    status: Optional[str] = Query(
        None, description="Filter by status: online or offline"
    ),
    device_type: Optional[str] = Query(
        None, description="Filter by type (Server, Router, etc)"
    ),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    device_service = DeviceService(db)
    return await device_service.get_all_devices(
        search=search, status=status, device_type=device_type
    )


@router.get(
    "/devices/{device_id}",
    response_model=schemas.DeviceDetailResponse,
    tags=["Devices"],
)
async def get_device_details(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    device_service = DeviceService(db)
    device = await device_service.get_device_details(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/devices", response_model=schemas.DeviceBase, tags=["Devices"])
async def create_device(
    device_data: schemas.DeviceCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    device_service = DeviceService(db)
    return await device_service.create_device(device_data)


@router.put("/devices/{device_id}", response_model=schemas.DeviceBase, tags=["Devices"])
async def update_device(
    device_id: int,
    device_data: schemas.DeviceUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    device_service = DeviceService(db)
    updated = await device_service.update_device(device_id, device_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Device not found")
    return updated


@router.delete(
    "/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Devices"]
)
async def delete_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    device_service = DeviceService(db)
    await device_service.delete_device(device_id)


@router.post("/metrics", response_model=schemas.MetricResponse, tags=["Metrics"])
async def push_metrics(
    metric_data: schemas.MetricCreate, db: AsyncSession = Depends(get_db)
):
    metric_service = MetricService(db)
    try:
        new_metric = await metric_service.process_new_metric(metric_data)
        return new_metric
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=List[schemas.AlertResponse], tags=["Alerts"])
@cache(expire=3)
async def get_alerts(db: AsyncSession = Depends(get_db)):
    alert_repo = AlertRepository(db)
    return await alert_repo.get_all()
