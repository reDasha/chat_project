import os

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
SECRET = os.getenv("SECRET")

APP_HOST = os.getenv("APP_HOST")
APP_PORT = os.getenv("APP_PORT")

REDIS_URL = os.getenv("REDIS_URL")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")


