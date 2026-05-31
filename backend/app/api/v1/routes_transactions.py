from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.bank_account import BankAccount
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.finance import TransactionCreate


router = APIRouter()


@router.get("/")
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


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.get(BankAccount, payload.account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")

    tx = Transaction(**payload.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
