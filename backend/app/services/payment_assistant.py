from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models.auto_payment import AutoPayment
from app.models.bank_account import BankAccount
from app.models.payment_notification import PaymentNotification
from app.models.transaction import Transaction


def _next_run_for_day(day_of_month: int, today: date) -> date:
    if today.day <= day_of_month:
        return today.replace(day=day_of_month)
    year = today.year + (1 if today.month == 12 else 0)
    month = 1 if today.month == 12 else today.month + 1
    return date(year, month, day_of_month)


def create_auto_payment_rule(db: Session, user_id: int, payload) -> AutoPayment:
    today = date.today()
    rule = AutoPayment(
        user_id=user_id,
        account_id=payload.account_id,
        name=payload.name,
        amount=payload.amount,
        max_amount=payload.max_amount,
        category=payload.category,
        day_of_month=payload.day_of_month,
        reminder_days_before=payload.reminder_days_before,
        description_template=payload.description_template,
        is_active=True,
        next_run_date=_next_run_for_day(payload.day_of_month, today),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def execute_due_payments(db: Session, user_id: int) -> dict:
    today = date.today()
    due_rules = (
        db.query(AutoPayment)
        .filter(AutoPayment.user_id == user_id, AutoPayment.is_active.is_(True), AutoPayment.next_run_date <= today)
        .all()
    )

    executed = 0
    blocked = 0
    for rule in due_rules:
        if rule.amount > rule.max_amount:
            _create_notification(
                db,
                user_id=user_id,
                rule=rule,
                kind="blocked",
                message=f"Pago bloqueado para '{rule.name}': monto {rule.amount} supera limite {rule.max_amount}.",
            )
            blocked += 1
            continue

        tx = Transaction(
            account_id=rule.account_id,
            amount=rule.amount,
            date=today,
            description=rule.description_template,
            category=rule.category,
            type="expense",
            is_automated=True,
        )
        db.add(tx)

        rule.last_run_at = datetime.now(timezone.utc)
        rule.next_run_date = _next_run_for_day(rule.day_of_month, today.replace(day=1) if today.day == rule.day_of_month else today)
        if rule.next_run_date <= today:
            year = today.year + (1 if today.month == 12 else 0)
            month = 1 if today.month == 12 else today.month + 1
            rule.next_run_date = date(year, month, rule.day_of_month)
        executed += 1

    db.commit()
    return {"executed": executed, "blocked": blocked}


def execute_rule_now(db: Session, rule: AutoPayment) -> dict:
    if rule.amount > rule.max_amount:
        _create_notification(
            db,
            user_id=rule.user_id,
            rule=rule,
            kind="blocked",
            message=f"Pago bloqueado para '{rule.name}': monto {rule.amount} supera limite {rule.max_amount}.",
        )
        db.commit()
        return {"executed": 0, "rule_id": rule.id, "blocked": 1}

    today = date.today()
    tx = Transaction(
        account_id=rule.account_id,
        amount=rule.amount,
        date=today,
        description=rule.description_template,
        category=rule.category,
        type="expense",
        is_automated=True,
    )
    db.add(tx)
    rule.last_run_at = datetime.now(timezone.utc)
    year = today.year + (1 if today.month == 12 else 0)
    month = 1 if today.month == 12 else today.month + 1
    rule.next_run_date = date(year, month, rule.day_of_month)
    db.commit()
    return {"executed": 1, "rule_id": rule.id, "blocked": 0}


def refresh_reminders(db: Session, user_id: int) -> dict:
    today = date.today()
    created = 0
    rules = db.query(AutoPayment).filter(AutoPayment.user_id == user_id, AutoPayment.is_active.is_(True)).all()
    for rule in rules:
        days_left = (rule.next_run_date - today).days
        if days_left < 0:
            continue
        if days_left <= rule.reminder_days_before and rule.last_reminder_date != today:
            _create_notification(
                db,
                user_id=user_id,
                rule=rule,
                kind="reminder",
                message=f"Recordatorio: '{rule.name}' se ejecuta en {days_left} dia(s).",
            )
            rule.last_reminder_date = today
            created += 1
    db.commit()
    return {"created": created}


def list_notifications(db: Session, user_id: int) -> list[PaymentNotification]:
    return (
        db.query(PaymentNotification)
        .filter(PaymentNotification.user_id == user_id)
        .order_by(PaymentNotification.created_at.desc())
        .limit(30)
        .all()
    )


def suggest_auto_payments(db: Session, user_id: int) -> list[dict]:
    txs = (
        db.query(Transaction)
        .join(BankAccount, BankAccount.id == Transaction.account_id)
        .filter(BankAccount.user_id == user_id, Transaction.type == "expense")
        .all()
    )

    grouped: dict[str, list[Transaction]] = {}
    for tx in txs:
        key = tx.description.strip().lower()
        grouped.setdefault(key, []).append(tx)

    suggestions: list[dict] = []
    for _, items in grouped.items():
        if len(items) < 2:
            continue
        amounts = [round(i.amount, 2) for i in items]
        if max(amounts) - min(amounts) > 5:
            continue
        sample = items[0]
        suggestions.append(
            {
                "description": sample.description,
                "category": sample.category,
                "recommended_amount": round(sum(amounts) / len(amounts), 2),
                "frequency_hint": "mensual",
                "reason": "Se detectaron gastos repetidos con monto similar.",
            }
        )

    return suggestions[:5]


def _create_notification(db: Session, user_id: int, rule: AutoPayment, kind: str, message: str) -> None:
    db.add(
        PaymentNotification(
            user_id=user_id,
            rule_id=rule.id,
            kind=kind,
            message=message,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
    )
