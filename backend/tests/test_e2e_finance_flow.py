from datetime import date


def test_e2e_financial_flow(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"name": "E2E User", "email": "e2e@example.com", "password": "Password123"},
    )
    assert register.status_code == 200
    token = register.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    bank = client.post(
        "/api/v1/bank/authenticate",
        headers=headers,
        json={
            "public_token": "public-sandbox-e2e",
            "institution_name": "Banco E2E",
            "account_type": "savings",
            "last_four": "0099",
        },
    )
    assert bank.status_code == 201
    account_id = bank.json()["account_id"]

    tx_income = client.post(
        "/api/v1/transactions/",
        headers=headers,
        json={
            "account_id": account_id,
            "amount": 5000,
            "date": date.today().isoformat(),
            "description": "Pago mensual",
            "category": "Salario",
            "type": "income",
            "is_automated": False,
        },
    )
    assert tx_income.status_code == 201

    tx_expense = client.post(
        "/api/v1/transactions/",
        headers=headers,
        json={
            "account_id": account_id,
            "amount": 4200,
            "date": date.today().isoformat(),
            "description": "Gasto de renta",
            "category": "Vivienda",
            "type": "expense",
            "is_automated": False,
        },
    )
    assert tx_expense.status_code == 201

    summary = client.get("/api/v1/dashboard/summary", headers=headers)
    assert summary.status_code == 200
    body = summary.json()
    assert body["monthly_income"] == 5000
    assert body["monthly_expenses"] == 4200

    suggestions = client.get("/api/v1/suggestions/", headers=headers)
    assert suggestions.status_code == 200
    advice = suggestions.json()["advice"]
    assert isinstance(advice, list)
    assert any(item["type"] == "risk_alert" for item in advice)
