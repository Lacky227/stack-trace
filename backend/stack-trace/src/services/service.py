from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from repositories.repository import (
    DeviceRepository,
    MetricRepository,
    AlertRepository,
    UserRepository,
)
from schemas.schemas import (
    DeviceCreate,
    MetricCreate,
    DeviceResponse,
    DeviceDetailResponse,
    DeviceUpdate,
    UserCreate,
)
from schemas.models import SeverityEnum
from security.auth import verify_password
from security.auth import get_password_hash
from websocket import manager


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def authenticate_user(self, username: str, password: str):
        user = await self.user_repo.get_by_username(username)
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user


class UserService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def get_all_users(self):
        return await self.user_repo.get_all()

    async def create_user(self, user_data: UserCreate):
        hashed_pw = get_password_hash(user_data.password)
        return await self.user_repo.create(user_data, hashed_pw)


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.repo = DeviceRepository(db)

    def _calculate_status(self, last_seen: datetime) -> str:
        """Логіка фішки №3: Online/Offline статус"""
        now = datetime.now(timezone.utc)
        # Рахуємо різницю в секундах
        delta = (now - last_seen).total_seconds()
        return "online" if delta < 30 else "offline"

    async def get_all_devices(
        self,
        search: str | None = None,
        status: str | None = None,
        device_type: str | None = None,
    ):
        devices = await self.repo.get_all(search=search, device_type=device_type)

        result = []
        for d in devices:
            calc_status = "offline"
            if d.last_seen:
                time_diff = datetime.now(timezone.utc) - d.last_seen
                if time_diff.total_seconds() < 30:
                    calc_status = "online"

            if status and calc_status != status.lower():
                continue

            result.append(
                {
                    "id": d.id,
                    "name": d.name,
                    "ip_address": d.ip_address,
                    "type": d.type,
                    "location": d.location,
                    "last_seen": d.last_seen,
                    "status": calc_status,
                    "metrics": d.metrics,
                }
            )

        return result

    async def create_device(self, device_data: DeviceCreate):
        return await self.repo.create(device_data)

    async def get_device_details(self, device_id: int) -> DeviceDetailResponse | None:
        device = await self.repo.get_device_with_details(device_id)

        if not device:
            return None

        status = self._calculate_status(device.last_seen)

        sorted_metrics = sorted(device.metrics, key=lambda m: m.timestamp)
        sorted_alerts = sorted(device.alerts, key=lambda a: a.created_at, reverse=True)

        return DeviceDetailResponse(
            id=device.id,
            name=device.name,
            ip_address=device.ip_address,
            type=device.type,
            location=device.location,
            last_seen=device.last_seen,
            status=status,
            metrics=sorted_metrics,
            alerts=sorted_alerts,
        )

    async def update_device(self, device_id: int, update_data: DeviceUpdate):
        return await self.repo.update(device_id, update_data.model_dump())

    async def delete_device(self, device_id: int):
        await self.repo.delete(device_id)


class MetricService:
    def __init__(self, db: AsyncSession):
        self.metric_repo = MetricRepository(db)
        self.device_repo = DeviceRepository(db)
        self.alert_repo = AlertRepository(db)

    async def process_new_metric(self, metric_data: MetricCreate):
        new_metric = await self.metric_repo.create(metric_data)
        await self.device_repo.update_last_seen(metric_data.device_id)

        device = await self.device_repo.get_by_id(metric_data.device_id)
        device_name = device.name if device else None

        await manager.broadcast(
            {
                "event": "NEW_METRIC",
                "data": {
                    "device_id": new_metric.device_id,
                    "cpu_usage": new_metric.cpu_usage,
                    "ram_usage": new_metric.ram_usage,
                    "disk_usage": new_metric.disk_usage,
                    "timestamp": new_metric.timestamp.isoformat(),
                },
            }
        )

        if metric_data.cpu_usage > 90.0:
            new_alert = await self.alert_repo.create_auto_alert(
                device_id=metric_data.device_id,
                message=f"High CPU detected: {metric_data.cpu_usage}%",
                severity=SeverityEnum.HIGH,
            )

            await manager.broadcast(
                {
                    "event": "NEW_ALERT",
                    "data": {
                        "id": new_alert.id,
                        "device_id": new_alert.device_id,
                        "device_name": device_name,
                        "message": new_alert.message,
                        "severity": new_alert.severity.value,
                        "created_at": new_alert.created_at.isoformat(),
                        "is_resolved": new_alert.is_resolved,
                    },
                }
            )

        return new_metric
