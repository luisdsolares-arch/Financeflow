from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.bank_account import BankAccount
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.finance import BankAuthRequest, WebhookEvent
from app.services.bank_provider import exchange_public_token
from app.services.categorizer import infer_category
from app.utils.encryption import encrypt_value


router = APIRouter()


@router.post("/authenticate", status_code=status.HTTP_201_CREATED)
async def authenticate_bank(payload: BankAuthRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    access_token = await exchange_public_token(payload.public_token)
    encrypted_token = encrypt_value(access_token)

    account = BankAccount(
        user_id=current_user.id,
        bank_name=payload.institution_name,
        account_type=payload.account_type,
        last_four=payload.last_four,
        access_token=encrypted_token,
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    return {
        "message": "Cuenta bancaria conectada en modo solo lectura",
        "account_id": account.id,
    }


@router.post("/webhook")
def process_webhook(payload: WebhookEvent, db: Session = Depends(get_db)):
    if payload.event_type != "TRANSACTIONS_AVAILABLE":
        return {"message": "Evento ignorado"}

    account = db.get(BankAccount, payload.account_id)
    if not account or account.user_id != payload.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")

    incoming = payload.provider_payload.get("transactions", [])
    inserted = 0
    for item in incoming:
        description = item.get("description", "Movimiento importado")
        amount = float(item.get("amount", 0))
        tx_type = "income" if amount >= 0 else "expense"
        tx = Transaction(
            account_id=account.id,
            amount=abs(amount),
            date=datetime.fromisoformat(item.get("date")).date(),
            description=description,
            category=infer_category(description),
            type=tx_type,
            is_automated=True,
        )
        db.add(tx)
        inserted += 1

    db.commit()
    return {"message": "Webhook procesado", "inserted": inserted}
