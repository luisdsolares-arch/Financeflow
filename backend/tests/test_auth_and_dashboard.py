from datetime import date

from app.models.transaction import Transaction
from tests.conftest import TestingSessionLocal


def _register_and_get_token(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Tester", "email": "tester@example.com", "password": "Password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_register_and_login(client):
    token = _register_and_get_token(client)
    assert token

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "tester@example.com", "password": "Password123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_dashboard_summary(client):
    token = _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    bank_resp = client.post(
        "/api/v1/bank/authenticate",
        json={
            "public_token": "public-sandbox-12345",
            "institution_name": "Banco Demo",
            "account_type": "checking",
            "last_four": "1234",
        },
        headers=headers,
    )
    assert bank_resp.status_code == 201
    account_id = bank_resp.json()["account_id"]

    db = TestingSessionLocal()
    db.add(
        Transaction(
            account_id=account_id,
            amount=3000,
            date=date.today(),
            description="Nomina",
            category="Salario",
            type="income",
            is_automated=False,
        )
    )
    db.add(
        Transaction(
            account_id=account_id,
            amount=1200,
            date=date.today(),
            description="Renta",
            category="Vivienda",
            type="expense",
            is_automated=False,
        )
    )
    db.commit()
    db.close()

    summary = client.get("/api/v1/dashboard/summary", headers=headers)
    assert summary.status_code == 200
    payload = summary.json()
    assert payload["monthly_income"] == 3000
    assert payload["monthly_expenses"] == 1200
    assert payload["saving_capacity_pct"] == 60.0


def test_bank_webhook_categorizes_transaction(client):
    token = _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    bank_resp = client.post(
        "/api/v1/bank/authenticate",
        json={
            "public_token": "public-sandbox-12345",
            "institution_name": "Banco Demo",
            "account_type": "checking",
            "last_four": "1234",
        },
        headers=headers,
    )
    account_id = bank_resp.json()["account_id"]

    webhook = client.post(
        "/api/v1/bank/webhook",
        json={
            "event_type": "TRANSACTIONS_AVAILABLE",
            "user_id": 1,
            "account_id": account_id,
            "provider_payload": {
                "transactions": [
                    {"description": "STARBUCKS COFFEE CA", "amount": -8.9, "date": date.today().isoformat()}
                ]
            },
        },
    )

    assert webhook.status_code == 200
    assert webhook.json()["inserted"] == 1
