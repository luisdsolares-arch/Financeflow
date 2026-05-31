from datetime import date

from app.models.auto_payment import AutoPayment
from tests.conftest import TestingSessionLocal


def _token(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Pay Bot", "email": "paybot@example.com", "password": "Password123"},
    )
    return response.json()["access_token"]


def test_create_and_execute_auto_payment(client):
    token = _token(client)
    headers = {"Authorization": f"Bearer {token}"}

    bank = client.post(
        "/api/v1/bank/authenticate",
        headers=headers,
        json={
            "public_token": "public-payments-test",
            "institution_name": "Banco Pay",
            "account_type": "checking",
            "last_four": "2233",
        },
    )
    account_id = bank.json()["account_id"]

    today = date.today().day
    create_rule = client.post(
        "/api/v1/payments/rules",
        headers=headers,
        json={
            "account_id": account_id,
            "name": "Renta automatica",
            "amount": 1500,
            "max_amount": 2000,
            "category": "Vivienda",
            "day_of_month": today if today <= 28 else 28,
            "reminder_days_before": 3,
            "description_template": "Pago automatico de renta",
        },
    )
    assert create_rule.status_code == 201

    rule_id = create_rule.json()["id"]
    db = TestingSessionLocal()
    rule = db.get(AutoPayment, rule_id)
    rule.next_run_date = date.today()
    db.commit()
    db.close()

    executed = client.post("/api/v1/payments/execute-due", headers=headers)
    assert executed.status_code == 200
    assert executed.json()["executed"] >= 1

    txs = client.get("/api/v1/transactions/", headers=headers)
    assert txs.status_code == 200
    assert any(row["is_automated"] for row in txs.json())


def test_blocked_payment_and_notifications(client):
    token = _token(client)
    headers = {"Authorization": f"Bearer {token}"}

    bank = client.post(
        "/api/v1/bank/authenticate",
        headers=headers,
        json={
            "public_token": "public-payments-test-2",
            "institution_name": "Banco Pay 2",
            "account_type": "checking",
            "last_four": "8899",
        },
    )
    account_id = bank.json()["account_id"]

    rule = client.post(
        "/api/v1/payments/rules",
        headers=headers,
        json={
            "account_id": account_id,
            "name": "Seguro medico",
            "amount": 900,
            "max_amount": 500,
            "category": "Servicios",
            "day_of_month": date.today().day if date.today().day <= 28 else 28,
            "reminder_days_before": 5,
            "description_template": "Pago automatico seguro",
        },
    )
    assert rule.status_code == 201

    run_now = client.post(f"/api/v1/payments/rules/{rule.json()['id']}/run-now", headers=headers)
    assert run_now.status_code == 200
    assert run_now.json()["blocked"] == 1

    refresh = client.post("/api/v1/payments/notifications/refresh", headers=headers)
    assert refresh.status_code == 200

    notifications = client.get("/api/v1/payments/notifications", headers=headers)
    assert notifications.status_code == 200
    rows = notifications.json()
    assert any(n["kind"] == "blocked" for n in rows)
