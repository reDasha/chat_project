import asyncio
from aiogram import Bot, Dispatcher, types, Router
from aiogram.filters import Command
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import TELEGRAM_TOKEN
from app.database import get_db
from app.models.models import User

TOKEN = TELEGRAM_TOKEN
bot = Bot(token=TOKEN)
dp = Dispatcher()

router = Router()

dp.include_router(router)


@router.message(Command("start"))
async def start_command_handler(message: types.Message):
    args = message.text.split(maxsplit=1)[1:]
    if not args:
        await message.reply("Пожалуйста, используйте персональную ссылку для регистрации.")
        return
    user_chat_id = message.chat.id
    async for db in get_db():
        if args:
            user_id = int(args[0])
            await update_user_chat_id(user_id, user_chat_id, db)
            await message.reply("Ваш Telegram успешно подключен к уведомлениям!")
        else:
            await message.reply("Для получения уведомлений используйте персональную ссылку на бота.")


async def update_user_chat_id(user_id: int, user_chat_id: int, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.chat_id = user_chat_id
        await db.commit()
        return True
    return False


async def send_notification(chat_id: int, message: str):
    try:
        await asyncio.wait_for(bot.send_message(chat_id=chat_id, text=message), timeout=10)
    except asyncio.TimeoutError:
        print("Timeout: Не удалось отправить сообщение")


async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
