from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
import csv
import io
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.bank_account import BankAccount
from app.models.planned_expense import PlannedExpense
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.finance import PlannedExpenseCreate, PlannedExpenseResponse, TransactionCreate


router = APIRouter()


def _serialize_planned_expense(row: PlannedExpense) -> PlannedExpenseResponse:
    days_until_due = max((row.due_date - date.today()).days, 0)
    weekly_periods = max(ceil(max(days_until_due, 1) / 7), 1)
    monthly_periods = max(ceil(max(days_until_due, 1) / 30), 1)
    return PlannedExpenseResponse(
        id=row.id,
        description=row.description,
        category=row.category,
        amount=row.amount,
        due_date=row.due_date,
        recurrence_type=row.recurrence_type,
        planning_mode=row.planning_mode,
        reminder_days_before=row.reminder_days_before,
        is_active=row.is_active,
        days_until_due=days_until_due,
        recommended_weekly_saving=round(row.amount / weekly_periods, 2),
        recommended_monthly_saving=round(row.amount / monthly_periods, 2),
    )


def _next_due_date(current_due_date: date, recurrence_type: str) -> date:
    if recurrence_type == "weekly":
        return current_due_date + timedelta(days=7)
    if recurrence_type == "monthly":
        target_month = current_due_date.month + 1
        target_year = current_due_date.year
        if target_month > 12:
            target_month = 1
            target_year += 1
        last_day = monthrange(target_year, target_month)[1]
        return date(target_year, target_month, min(current_due_date.day, last_day))
    return current_due_date


@router.get("")
def list_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(Transaction)
        .join(BankAccount, BankAccount.id == Transaction.account_id)
        .filter(BankAccount.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .limit(50)
        .all()
    )
    return rows


@router.get("/export")
def export_transactions_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(Transaction)
        .join(BankAccount, BankAccount.id == Transaction.account_id)
        .filter(BankAccount.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["fecha", "descripcion", "categoria", "tipo", "monto", "automatica"])
    for row in rows:
        writer.writerow([row.date.isoformat(), row.description, row.category, row.type, row.amount, row.is_automated])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transacciones.csv"},
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.get(BankAccount, payload.account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")

    tx = Transaction(**payload.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/planned", response_model=list[PlannedExpenseResponse])
def list_planned_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(PlannedExpense)
        .filter(PlannedExpense.user_id == current_user.id, PlannedExpense.is_active.is_(True))
        .order_by(PlannedExpense.due_date.asc(), PlannedExpense.id.desc())
        .all()
    )
    return [_serialize_planned_expense(row) for row in rows]


@router.post("/planned", response_model=PlannedExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_planned_expense(payload: PlannedExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.due_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La fecha objetivo no puede estar en el pasado")

    row = PlannedExpense(
        user_id=current_user.id,
        description=payload.description,
        category=payload.category,
        amount=payload.amount,
        due_date=payload.due_date,
        recurrence_type=payload.recurrence_type,
        planning_mode=payload.planning_mode,
        reminder_days_before=payload.reminder_days_before,
        is_active=True,
        reminder_read_due_date=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_planned_expense(row)


@router.patch("/planned/{planned_expense_id}/mark-paid")
def mark_planned_expense_paid(planned_expense_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.get(PlannedExpense, planned_expense_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto planificado no encontrado")

    if not row.is_active:
        return {
            "message": "Este gasto planificado ya estaba cerrado",
            "planned_expense": _serialize_planned_expense(row).model_dump(),
        }

    if row.recurrence_type == "one_time":
        row.is_active = False
        db.commit()
        db.refresh(row)
        return {
            "message": "Gasto puntual marcado como pagado",
            "planned_expense": _serialize_planned_expense(row).model_dump(),
        }

    base_date = row.due_date if row.due_date >= date.today() else date.today()
    row.due_date = _next_due_date(base_date, row.recurrence_type)
    row.reminder_read_due_date = None
    db.commit()
    db.refresh(row)
    return {
        "message": "Gasto recurrente actualizado al próximo vencimiento",
        "planned_expense": _serialize_planned_expense(row).model_dump(),
    }
