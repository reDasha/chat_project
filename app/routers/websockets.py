import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

router = APIRouter()

connections: Dict[int, WebSocket] = {}


async def notify_user(user_id: int, message: dict):
    if user_id in connections:
        websocket = connections[user_id]
        await websocket.send_json(message)


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    connections[user_id] = websocket

    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        connections.pop(user_id, None)
