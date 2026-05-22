from schemas.enums import SeverityEnum, RoleEnum
from datetime import datetime, timezone
from sqlalchemy import String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.USER)


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    ip_address: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(50))
    location: Mapped[str] = mapped_column(String(100))
    # last_seen буде оновлюватись при кожному пуші метрик
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    metrics: Mapped[list["Metric"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )


class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"))
    cpu_usage: Mapped[float] = mapped_column(Float)
    ram_usage: Mapped[float] = mapped_column(Float)
    disk_usage: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    device: Mapped["Device"] = relationship(back_populates="metrics")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"))
    message: Mapped[str] = mapped_column(String(255))
    severity: Mapped[SeverityEnum] = mapped_column(
        Enum(SeverityEnum), default=SeverityEnum.WARNING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    device: Mapped["Device"] = relationship(back_populates="alerts")

    @property
    def device_name(self) -> str | None:
        return self.device.name if self.device else None
