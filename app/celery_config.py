from celery import Celery

from app.config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND
from telegram_bot import send_notification
import asyncio

celery_app = Celery(
    "tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_ignore_result=True
)


def run_in_event_loop(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    if loop.is_running():
        return asyncio.run_coroutine_threadsafe(coro, loop).result()
    else:
        return loop.run_until_complete(coro)


@celery_app.task
def notify_user_about_message(message: str, sender_name: str, receiver_chat_id: int):
    tg_message = f"Получено новое сообщение от {sender_name} в чате: '{message}'"
    run_in_event_loop(send_notification(receiver_chat_id, tg_message))
