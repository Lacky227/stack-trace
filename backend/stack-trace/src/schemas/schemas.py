from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from schemas.enums import RoleEnum, SeverityEnum


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: RoleEnum = RoleEnum.USER


class UserResponse(BaseModel):
    id: int
    username: str
    role: RoleEnum

    model_config = ConfigDict(from_attributes=True)


class MetricCreate(BaseModel):
    device_id: int
    cpu_usage: float
    ram_usage: float
    disk_usage: float


class MetricResponse(BaseModel):
    cpu_usage: float
    ram_usage: float
    disk_usage: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertResponse(BaseModel):
    id: int
    device_id: int
    device_name: Optional[str] = None
    message: str
    severity: SeverityEnum
    created_at: datetime
    is_resolved: bool

    model_config = ConfigDict(from_attributes=True)


class DeviceBase(BaseModel):
    name: str
    ip_address: str
    type: str
    location: str


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None


class DeviceResponse(DeviceBase):
    id: int
    last_seen: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


class DeviceDetailResponse(DeviceResponse):
    metrics: List[MetricResponse] = []
    alerts: List[AlertResponse] = []
