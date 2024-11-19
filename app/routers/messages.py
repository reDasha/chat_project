from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas
from app.crud import create_message, get_user
from app.database import get_db
from typing import List

from app.models.models import User
from app.routers.websockets import notify_user
from app.schemas import MessageCreate
from app.utils.security import get_current_user
from app.celery_config import notify_user_about_message

router = APIRouter()


@router.get("/messages/{receiver_id}", response_model=List[schemas.Message])
async def get_message_history(
    receiver_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = await crud.get_messages(db, sender_id=current_user.id, receiver_id=receiver_id)
    return messages


@router.post("/messages/send", response_model=schemas.Message, status_code=status.HTTP_201_CREATED)
async def send_message(
        message_data: MessageCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    new_message = await create_message(db, message_data, current_user.id)

    await notify_user(message_data.receiver_id, new_message)
    await notify_user(current_user.id, new_message)

    receiver = await get_user(db, message_data.receiver_id)
    if not receiver.is_active and receiver.chat_id is not None:
        receiver_chat_id = receiver.chat_id
        notify_user_about_message.delay(message_data.content, current_user.username, receiver_chat_id)

    return schemas.Message.from_orm(new_message)

