from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.finance import UserSettingsPayload, UserSettingsResponse


router = APIRouter()


def _to_response(row: UserSettings) -> UserSettingsResponse:
    return UserSettingsResponse(
        user_id=row.user_id,
        profile_name=row.profile_name,
        profile_email=row.profile_email,
        currency=row.currency,
        monthly_savings_goal=row.monthly_savings_goal,
        weekly_budget_alert_threshold=row.weekly_budget_alert_threshold,
        require_2fa_for_sensitive_actions=row.require_2fa_for_sensitive_actions,
        notify_email=row.notify_email,
        notify_push=row.notify_push,
        notify_payment_reminders=row.notify_payment_reminders,
        auto_sync_bank_daily=row.auto_sync_bank_daily,
        payment_assistant_enabled=row.payment_assistant_enabled,
        default_payment_limit=row.default_payment_limit,
        dark_mode=row.dark_mode,
    )


def _ensure_user_settings(db: Session, current_user: User) -> UserSettings:
    row = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if row:
        return row

    row = UserSettings(
        user_id=current_user.id,
        profile_name=current_user.name,
        profile_email=current_user.email,
        currency="EUR",
        monthly_savings_goal=20,
        weekly_budget_alert_threshold=80,
        require_2fa_for_sensitive_actions=False,
        notify_email=True,
        notify_push=True,
        notify_payment_reminders=True,
        auto_sync_bank_daily=True,
        payment_assistant_enabled=True,
        default_payment_limit=1200,
        dark_mode=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=UserSettingsResponse)
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _to_response(_ensure_user_settings(db, current_user))


@router.put("", response_model=UserSettingsResponse)
def update_settings(
    payload: UserSettingsPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = _ensure_user_settings(db, current_user)
    row.profile_name = payload.profile_name
    row.profile_email = payload.profile_email
    row.currency = payload.currency
    row.monthly_savings_goal = payload.monthly_savings_goal
    row.weekly_budget_alert_threshold = payload.weekly_budget_alert_threshold
    row.require_2fa_for_sensitive_actions = payload.require_2fa_for_sensitive_actions
    row.notify_email = payload.notify_email
    row.notify_push = payload.notify_push
    row.notify_payment_reminders = payload.notify_payment_reminders
    row.auto_sync_bank_daily = payload.auto_sync_bank_daily
    row.payment_assistant_enabled = payload.payment_assistant_enabled
    row.default_payment_limit = payload.default_payment_limit
    row.dark_mode = payload.dark_mode

    db.commit()
    db.refresh(row)
    return _to_response(row)
