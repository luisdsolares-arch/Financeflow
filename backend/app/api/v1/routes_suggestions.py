from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.bank_account import BankAccount
from app.models.transaction import Transaction
from app.models.user import User
from app.services.advice_engine import aggregate_expenses_by_category, build_financial_advice


router = APIRouter()


@router.get("")
def get_suggestions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    month_prefix = datetime.utcnow().strftime("%Y-%m")
    txs = (
        db.query(Transaction)
        .join(BankAccount, BankAccount.id == Transaction.account_id)
        .filter(BankAccount.user_id == current_user.id)
        .all()
    )
    monthly = [t for t in txs if t.date.strftime("%Y-%m") == month_prefix]

    total_income = sum(t.amount for t in monthly if t.type == "income")
    total_expenses = sum(abs(t.amount) for t in monthly if t.type == "expense")
    categorized = aggregate_expenses_by_category(monthly)

    return {
        "month": month_prefix,
        "income": total_income,
        "expenses": total_expenses,
        "advice": build_financial_advice(total_income, total_expenses, categorized),
    }
