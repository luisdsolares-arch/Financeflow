from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.notification_read_state import NotificationReadState
from app.models.payment_notification import PaymentNotification
from app.models.planned_expense import PlannedExpense
from app.models.user import User
from app.schemas.finance import NotificationRead


router = APIRouter()


def _planned_notification_id(row: PlannedExpense) -> str:
    return f"planned-{row.id}-{row.due_date.isoformat()}"


@router.get("")
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment_rows = (
        db.query(PaymentNotification)
        .filter(PaymentNotification.user_id == current_user.id)
        .order_by(PaymentNotification.created_at.desc())
        .limit(30)
        .all()
    )

    planned_rows = (
        db.query(PlannedExpense)
        .filter(PlannedExpense.user_id == current_user.id, PlannedExpense.is_active.is_(True))
        .order_by(PlannedExpense.due_date.asc())
        .all()
    )

    read_state_rows = db.query(NotificationReadState).filter(NotificationReadState.user_id == current_user.id).all()
    read_state_ids = {row.notification_id for row in read_state_rows}

    today = date.today()
    planned_notifications = []
    for row in planned_rows:
        days_remaining = (row.due_date - today).days
        if days_remaining <= row.reminder_days_before:
            notification_id = _planned_notification_id(row)
            planned_notifications.append(
                {
                    "id": notification_id,
                    "source": "planned_expense",
                    "kind": "reminder",
                    "message": f"'{row.description}' vence en {max(days_remaining, 0)} día(s).",
                    "is_read": notification_id in read_state_ids,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
            )

    payment_notifications = [
        {
            "id": f"payment-{row.id}",
            "source": "payment",
            "kind": row.kind,
            "message": row.message,
            "is_read": row.is_read,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in payment_rows
    ]

    items = payment_notifications + planned_notifications
    items.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    unread_count = sum(1 for item in items if not item.get("is_read"))
    return {"items": items[:40], "unread_count": unread_count}


@router.patch("/{notification_id}")
def mark_notification_read(notification_id: str, payload: NotificationRead, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if notification_id.startswith("payment-"):
        raw_id = notification_id.replace("payment-", "", 1)
        if not raw_id.isdigit():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identificador de notificación inválido")
        row = db.get(PaymentNotification, int(raw_id))
        if not row or row.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada")
        row.is_read = payload.is_read
        db.commit()
        db.refresh(row)
        return {
            "id": notification_id,
            "is_read": row.is_read,
        }

    if notification_id.startswith("planned-"):
        existing = (
            db.query(NotificationReadState)
            .filter(
                NotificationReadState.user_id == current_user.id,
                NotificationReadState.notification_id == notification_id,
            )
            .first()
        )
        if payload.is_read:
            if not existing:
                db.add(
                    NotificationReadState(
                        user_id=current_user.id,
                        notification_id=notification_id,
                        read_at=datetime.now(timezone.utc),
                    )
                )
        else:
            if existing:
                db.delete(existing)
        db.commit()
        return {
            "id": notification_id,
            "is_read": payload.is_read,
        }

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fuente de notificación no soportada")