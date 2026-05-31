import os

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import bank_account, budget, financial_goal, planned_expense, transaction, user, user_settings  # noqa: F401


app = FastAPI(
    title="Personal Finance Automation API",
    version="1.0.0",
    description="Backend para gestion de finanzas personales automatizada",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^(https?://localhost(:\d+)?|capacitor://localhost|ionic://localhost)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    if settings.security_headers_enabled:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/health/ready", tags=["Health"])
def readiness_check() -> dict:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"database_unavailable: {exc}")
    return {"status": "ready"}


app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup() -> None:
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)


# Serve the compiled frontend for live updates (no APK reinstall needed).
# Built assets are copied to backend/static_web/ during Render's build step.
_static_web = os.path.join(os.path.dirname(__file__), "..", "static_web")
if os.path.isdir(_static_web):
    app.mount("/", StaticFiles(directory=_static_web, html=True), name="spa")
