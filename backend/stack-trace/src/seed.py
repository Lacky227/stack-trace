import asyncio
from sqlalchemy import select
from schemas.models import User, RoleEnum
from security.auth import get_password_hash
from depends import AsyncSessionLocal


async def seed_data():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        if result.scalars().first():
            print("DB already exists users. Skipping seed.")
            return

        print("Creating test users...")

        admin = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role=RoleEnum.ADMIN,
        )

        user = User(
            username="user",
            hashed_password=get_password_hash("user123"),
            role=RoleEnum.USER,
        )

        session.add_all([admin, user])
        await session.commit()
        print("Seccess! \nAdmin: admin / admin123 \nUser: user / user123")


if __name__ == "__main__":
    asyncio.run(seed_data())
