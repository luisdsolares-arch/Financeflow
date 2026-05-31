from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.bank_account import BankAccount
from app.models.transaction import Transaction
from app.models.user import User


router = APIRouter()


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
    }
