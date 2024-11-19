from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app import database
from app.config import APP_HOST, APP_PORT
from app.routers import login, messages, users, websockets
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from app.routes import pages
from app.utils.security import SECRET_KEY

app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login.router, tags=["auth"])
app.include_router(messages.router, tags=["messages"])
app.include_router(users.router, tags=["users"])
app.include_router(websockets.router, tags=["websocket"])
app.include_router(pages.router, tags=["pages"])


@app.on_event("startup")
async def startup():
    async with database.engine.begin() as conn:
        await conn.run_sync(database.Base.metadata.create_all)


if __name__ == "__main__":
    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
