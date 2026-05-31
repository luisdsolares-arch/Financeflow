from threading import Lock
from time import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, TechnicalAccessStatusResponse, TechnicalAccessVerifyRequest


router = APIRouter()

_technical_access_state: dict[str, dict[str, float | int]] = {}
_technical_access_lock = Lock()


def _max_attempts() -> int:
    return max(1, int(settings.technical_access_max_attempts))


def _block_seconds() -> int:
    return max(1, int(settings.technical_access_block_seconds))


def _remaining_block_seconds(blocked_until: float, now: float) -> int:
    seconds = int(blocked_until - now)
    return seconds if seconds > 0 else 0


def _client_fingerprint(request: Request) -> str:
    host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    return f"{host}|{user_agent[:120]}"


def _cleanup_stale_states(now: float) -> None:
    ttl = _block_seconds() * 20
    stale = [key for key, value in _technical_access_state.items() if now - float(value.get("updated_at", now)) > ttl]
    for key in stale:
        _technical_access_state.pop(key, None)


def _get_status_for_client(client_key: str) -> TechnicalAccessStatusResponse:
    now = time()
    with _technical_access_lock:
        _cleanup_stale_states(now)
        state = _technical_access_state.get(client_key, {"failed_attempts": 0, "blocked_until": 0.0, "updated_at": now})
        failed_attempts = int(state.get("failed_attempts", 0))
        blocked_until = float(state.get("blocked_until", 0.0))
        is_blocked = blocked_until > now
        blocked_left = _remaining_block_seconds(blocked_until, now) if is_blocked else 0
        if not is_blocked and blocked_until > 0:
            state["blocked_until"] = 0.0
            _technical_access_state[client_key] = state
        remaining_attempts = 0 if is_blocked else max(0, _max_attempts() - failed_attempts)

    return TechnicalAccessStatusResponse(
        ok=not is_blocked,
        is_blocked=is_blocked,
        blocked_seconds_left=blocked_left,
        remaining_attempts=remaining_attempts,
        message="",
    )


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya esta registrado")

    user = User(name=payload.name, email=payload.email, password_hash=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

    return AuthResponse(access_token=create_access_token(str(user.id)))


@router.get("/technical-access/status", response_model=TechnicalAccessStatusResponse)
def technical_access_status(request: Request) -> TechnicalAccessStatusResponse:
    return _get_status_for_client(_client_fingerprint(request))


@router.post("/technical-access/verify", response_model=TechnicalAccessStatusResponse)
def verify_technical_access(payload: TechnicalAccessVerifyRequest, request: Request) -> TechnicalAccessStatusResponse:
    client_key = _client_fingerprint(request)
    status_payload = _get_status_for_client(client_key)
    if status_payload.is_blocked:
        status_payload.ok = False
        status_payload.message = f"Demasiados intentos. Espera {status_payload.blocked_seconds_left}s."
        return status_payload

    normalized_pin = payload.pin.strip()
    if normalized_pin == settings.technical_access_pin:
        now = time()
        with _technical_access_lock:
            _technical_access_state[client_key] = {"failed_attempts": 0, "blocked_until": 0.0, "updated_at": now}
        return TechnicalAccessStatusResponse(
            ok=True,
            is_blocked=False,
            blocked_seconds_left=0,
            remaining_attempts=_max_attempts(),
            message="Acceso concedido.",
        )

    now = time()
    with _technical_access_lock:
        state = _technical_access_state.get(client_key, {"failed_attempts": 0, "blocked_until": 0.0, "updated_at": now})
        failed_attempts = min(_max_attempts(), int(state.get("failed_attempts", 0)) + 1)
        blocked_until = 0.0
        is_blocked = False
        if failed_attempts >= _max_attempts():
            blocked_until = now + _block_seconds()
            is_blocked = True
        _technical_access_state[client_key] = {
            "failed_attempts": failed_attempts,
            "blocked_until": blocked_until,
            "updated_at": now,
        }

    remaining_attempts = 0 if is_blocked else max(0, _max_attempts() - failed_attempts)
    blocked_seconds_left = _remaining_block_seconds(blocked_until, now) if is_blocked else 0
    message = f"Demasiados intentos. Espera {blocked_seconds_left}s." if is_blocked else f"PIN incorrecto. Intentos restantes: {remaining_attempts}."
    return TechnicalAccessStatusResponse(
        ok=False,
        is_blocked=is_blocked,
        blocked_seconds_left=blocked_seconds_left,
        remaining_attempts=remaining_attempts,
        message=message,
    )
