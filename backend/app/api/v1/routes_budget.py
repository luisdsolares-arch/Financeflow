from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.finance import BudgetCreate


router = APIRouter()


@router.get("")
def list_budgets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = Budget(user_id=current_user.id, category=payload.category, limit_amount=payload.limit_amount, month_year=payload.month_year)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget
