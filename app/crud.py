from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas
from passlib.hash import bcrypt
from app.models import models


async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = bcrypt.hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    return result.scalar_one_or_none()


async def create_message(db: AsyncSession, message: schemas.MessageCreate, sender_id: int):
    db_message = models.Message(
        content=message.content,
        sender_id=sender_id,
        receiver_id=message.receiver_id,
        timestamp=datetime.utcnow()
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def get_messages(db: AsyncSession, sender_id: int, receiver_id: int):
    result = await db.execute(
        select(models.Message)
        .filter(
            ((models.Message.sender_id == sender_id) & (models.Message.receiver_id == receiver_id)) |
            ((models.Message.sender_id == receiver_id) & (models.Message.receiver_id == sender_id))
        )
        .order_by(models.Message.timestamp)
    )
    messages = result.scalars().all()
    return messages
