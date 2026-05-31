from datetime import date, datetime, timezone
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.financial_goal import FinancialGoal
from app.models.user import User
from app.schemas.finance import FinancialGoalCreate, FinancialGoalEdit, FinancialGoalUpdate


router = APIRouter()


def _serialize_goal(row: FinancialGoal) -> dict:
    target_amount = max(row.target_amount, 0)
    current_amount = max(row.current_amount, 0)
    progress_pct = round((current_amount / target_amount * 100), 2) if target_amount > 0 else 0
    days_remaining = max((row.target_date - date.today()).days, 0)
    monthly_periods = max(ceil(max(days_remaining, 1) / 30), 1)
    monthly_required = round(max(target_amount - current_amount, 0) / monthly_periods, 2)
    return {
        "id": row.id,
        "title": row.title,
        "target_amount": row.target_amount,
        "current_amount": row.current_amount,
        "target_date": row.target_date.isoformat(),
        "priority": row.priority,
        "is_active": row.is_active,
        "progress_pct": progress_pct,
        "days_remaining": days_remaining,
        "monthly_required": monthly_required,
    }


@router.get("")
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(FinancialGoal)
        .filter(FinancialGoal.user_id == current_user.id)
        .order_by(FinancialGoal.is_active.desc(), FinancialGoal.target_date.asc())
        .all()
    )
    return [_serialize_goal(row) for row in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_goal(payload: FinancialGoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.target_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La fecha meta no puede estar en el pasado")

    row = FinancialGoal(
        user_id=current_user.id,
        title=payload.title,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        target_date=payload.target_date,
        priority=payload.priority,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_goal(row)


@router.patch("/{goal_id}")
def update_goal(goal_id: int, payload: FinancialGoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.get(FinancialGoal, goal_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta no encontrada")

    row.current_amount = payload.current_amount
    row.is_active = payload.is_active
    db.commit()
    db.refresh(row)
    return _serialize_goal(row)


@router.put("/{goal_id}")
def edit_goal(goal_id: int, payload: FinancialGoalEdit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.get(FinancialGoal, goal_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta no encontrada")

    if payload.target_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La fecha meta no puede estar en el pasado")

    row.title = payload.title
    row.target_amount = payload.target_amount
    row.current_amount = payload.current_amount
    row.target_date = payload.target_date
    row.priority = payload.priority
    row.is_active = payload.is_active
    db.commit()
    db.refresh(row)
    return _serialize_goal(row)


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.get(FinancialGoal, goal_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta no encontrada")

    db.delete(row)
    db.commit()
    return {"message": "Meta eliminada"}