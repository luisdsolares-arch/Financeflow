from datetime import date, datetime
from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.bank_account import BankAccount
from app.models.planned_expense import PlannedExpense
from app.models.transaction import Transaction
from app.models.user import User


router = APIRouter()


def _planned_savings_metrics(amount: float, due_date: date) -> tuple[float, float, int]:
    days_until_due = max((due_date - date.today()).days, 0)
    weekly_periods = max(ceil(max(days_until_due, 1) / 7), 1)
    monthly_periods = max(ceil(max(days_until_due, 1) / 30), 1)
    return round(amount / weekly_periods, 2), round(amount / monthly_periods, 2), days_until_due


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    month_prefix = datetime.utcnow().strftime("%Y-%m")
    txs = (
        db.query(Transaction)
        .join(BankAccount, BankAccount.id == Transaction.account_id)
        .filter(BankAccount.user_id == current_user.id)
        .all()
    )

    monthly = [t for t in txs if t.date.strftime("%Y-%m") == month_prefix]
    income = sum(t.amount for t in monthly if t.type == "income")
    expenses = sum(abs(t.amount) for t in monthly if t.type == "expense")
    net_balance = sum(t.amount if t.type == "income" else -abs(t.amount) for t in txs)
    saving_capacity = ((income - expenses) / income * 100) if income > 0 else 0

    by_category: dict[str, float] = {}
    for tx in monthly:
        if tx.type == "expense":
            by_category[tx.category] = by_category.get(tx.category, 0) + abs(tx.amount)

    planned_rows = (
        db.query(PlannedExpense)
        .filter(PlannedExpense.user_id == current_user.id, PlannedExpense.is_active.is_(True))
        .order_by(PlannedExpense.due_date.asc())
        .all()
    )

    upcoming_planned_expenses = []
    projected_monthly_reserve = 0.0
    for row in planned_rows:
        weekly_saving, monthly_saving, days_until_due = _planned_savings_metrics(row.amount, row.due_date)
        projected_monthly_reserve += monthly_saving
        if days_until_due <= max(row.reminder_days_before, 14):
            upcoming_planned_expenses.append(
                {
                    "id": row.id,
                    "description": row.description,
                    "category": row.category,
                    "amount": row.amount,
                    "due_date": row.due_date.isoformat(),
                    "days_until_due": days_until_due,
                    "recurrence_type": row.recurrence_type,
                    "recommended_weekly_saving": weekly_saving,
                    "recommended_monthly_saving": monthly_saving,
                }
            )

    return {
        "net_balance": round(net_balance, 2),
        "monthly_income": round(income, 2),
        "monthly_expenses": round(expenses, 2),
        "saving_capacity_pct": round(saving_capacity, 2),
        "expenses_by_category": by_category,
        "recent_transactions": [
            {
                "date": t.date.isoformat(),
                "concept": t.description,
                "category": t.category,
                "type": t.type,
                "amount": t.amount,
            }
            for t in sorted(monthly, key=lambda x: x.date, reverse=True)[:10]
        ],
        "projected_monthly_reserve": round(projected_monthly_reserve, 2),
        "upcoming_planned_expenses": upcoming_planned_expenses[:5],
    }


@router.get("/calendar")
def get_dashboard_calendar(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_month = month or datetime.utcnow().strftime("%Y-%m")

    txs = (
        db.query(Transaction)
        .join(BankAccount, BankAccount.id == Transaction.account_id)
        .filter(BankAccount.user_id == current_user.id)
        .all()
    )
    planned_rows = (
        db.query(PlannedExpense)
        .filter(PlannedExpense.user_id == current_user.id, PlannedExpense.is_active.is_(True))
        .all()
    )

    events = []
    for tx in txs:
        if tx.date.strftime("%Y-%m") != target_month:
            continue
        events.append(
            {
                "date": tx.date.isoformat(),
                "source": "transaction",
                "kind": tx.type,
                "title": tx.description,
                "category": tx.category,
                "amount": tx.amount,
            }
        )

    for row in planned_rows:
        if row.due_date.strftime("%Y-%m") != target_month:
            continue
        events.append(
            {
                "date": row.due_date.isoformat(),
                "source": "planned_expense",
                "kind": "due",
                "title": row.description,
                "category": row.category,
                "amount": row.amount,
            }
        )

    events.sort(key=lambda item: item["date"])
    return {"month": target_month, "events": events}
