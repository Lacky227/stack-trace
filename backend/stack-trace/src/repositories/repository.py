from sqlalchemy import select, update, delete, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from schemas.models import Device, Metric, Alert, User, SeverityEnum
from schemas.schemas import DeviceCreate, MetricCreate, UserCreate


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_username(self, username: str):
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_all(self):
        result = await self.db.execute(select(User))
        return result.scalars().all()

    async def create(self, user_data: UserCreate, hashed_password: str):
        new_user = User(
            username=user_data.username,
            hashed_password=hashed_password,
            role=user_data.role,
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user


class DeviceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, search: str | None = None, device_type: str | None = None):
        query = (
            select(Device)
            .options(selectinload(Device.metrics))
            .order_by(Device.id.desc())
        )

        if search:
            query = query.filter(
                or_(
                    Device.name.ilike(f"%{search}%"),
                    Device.ip_address.ilike(f"%{search}%"),
                )
            )

        if device_type:
            query = query.filter(Device.type.ilike(device_type))

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(self, device_id: int):
        result = await self.db.execute(select(Device).where(Device.id == device_id))
        return result.scalar_one_or_none()

    async def create(self, device_data: DeviceCreate):
        new_device = Device(**device_data.model_dump())
        self.db.add(new_device)
        await self.db.commit()
        await self.db.refresh(new_device)
        return new_device

    async def update(self, device_id: int, update_data: dict):
        clean_data = {k: v for k, v in update_data.items() if v is not None}
        if not clean_data:
            return await self.get_by_id(device_id)

        await self.db.execute(
            update(Device).where(Device.id == device_id).values(**clean_data)
        )
        await self.db.commit()
        return await self.get_by_id(device_id)

    async def delete(self, device_id: int):
        await self.db.execute(delete(Device).where(Device.id == device_id))
        await self.db.commit()

    async def update_last_seen(self, device_id: int):
        await self.db.execute(
            update(Device)
            .where(Device.id == device_id)
            .values(last_seen=datetime.now(timezone.utc))
        )
        await self.db.commit()

    async def get_device_with_details(self, device_id: int):
        query = (
            select(Device)
            .where(Device.id == device_id)
            .options(selectinload(Device.metrics), selectinload(Device.alerts))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class MetricRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, metric_data: MetricCreate):
        new_metric = Metric(**metric_data.model_dump())
        self.db.add(new_metric)
        await self.db.commit()
        await self.db.refresh(new_metric)
        return new_metric


class AlertRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_auto_alert(
        self, device_id: int, message: str, severity: SeverityEnum
    ):
        new_alert = Alert(device_id=device_id, message=message, severity=severity)
        self.db.add(new_alert)
        await self.db.commit()
        await self.db.refresh(new_alert)
        return new_alert

    async def get_all(self):
        result = await self.db.execute(
            select(Alert)
            .options(selectinload(Alert.device))
            .order_by(Alert.created_at.desc())
        )
        return result.scalars().all()
