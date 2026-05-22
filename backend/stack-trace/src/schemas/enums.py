import enum


class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class SeverityEnum(str, enum.Enum):
    HIGH = "HIGH"
    WARNING = "WARNING"
