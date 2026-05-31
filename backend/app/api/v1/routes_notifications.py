from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.payment_notification import PaymentNotification
from app.models.planned_expense import PlannedExpense
from app.models.user import User


router = APIRouter()


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

    today = date.today()
    planned_notifications = []
    for row in planned_rows:
        days_remaining = (row.due_date - today).days
        if days_remaining <= row.reminder_days_before:
            planned_notifications.append(
                {
                    "id": f"planned-{row.id}",
                    "source": "planned_expense",
                    "kind": "reminder",
                    "message": f"'{row.description}' vence en {max(days_remaining, 0)} día(s).",
                    "is_read": False,
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