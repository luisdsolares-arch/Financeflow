from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.auto_payment import AutoPayment
from app.models.bank_account import BankAccount
from app.models.payment_notification import PaymentNotification
from app.models.user import User
from app.schemas.finance import AutoPaymentCreate, AutoPaymentToggle, NotificationRead
from app.services.payment_assistant import create_auto_payment_rule, execute_due_payments, execute_rule_now, list_notifications, refresh_reminders, suggest_auto_payments


router = APIRouter()


@router.get("/accounts")
def list_user_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = db.query(BankAccount).filter(BankAccount.user_id == current_user.id).all()
    return [{"id": a.id, "bank_name": a.bank_name, "last_four": a.last_four, "account_type": a.account_type} for a in accounts]


@router.get("/rules")
def list_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AutoPayment).filter(AutoPayment.user_id == current_user.id).order_by(AutoPayment.id.desc()).all()


@router.post("/rules", status_code=status.HTTP_201_CREATED)
def create_rule(payload: AutoPaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.get(BankAccount, payload.account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cuenta bancaria no encontrada")
    return create_auto_payment_rule(db, current_user.id, payload)


@router.patch("/rules/{rule_id}")
def toggle_rule(rule_id: int, payload: AutoPaymentToggle, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.get(AutoPayment, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    rule.is_active = payload.is_active
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/execute-due")
def execute_due(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return execute_due_payments(db, current_user.id)


@router.post("/rules/{rule_id}/run-now")
def run_rule_now(rule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.get(AutoPayment, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    if not rule.is_active:
        raise HTTPException(status_code=400, detail="La regla esta inactiva")
    return execute_rule_now(db, rule)


@router.get("/assistant/suggestions")
def assistant_suggestions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"suggestions": suggest_auto_payments(db, current_user.id)}


@router.post("/notifications/refresh")
def refresh_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return refresh_reminders(db, current_user.id)


@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_notifications(db, current_user.id)


@router.patch("/notifications/{notification_id}")
def mark_notification_read(notification_id: int, payload: NotificationRead, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.get(PaymentNotification, notification_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    row.is_read = payload.is_read
    db.commit()
    db.refresh(row)
    return row
