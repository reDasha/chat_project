from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


@router.get("/")
async def redirect_to_login_or_chat(request: Request):
    if 'user_id' in request.session:
        return RedirectResponse(url="/chat")
    return RedirectResponse(url="/login")


@router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/chat")
async def chat_page(request: Request):
    if 'user_id' not in request.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return templates.TemplateResponse("chat.html", {"request": request})
