from datetime import date, timedelta


def _auth_headers(client, email: str = "planned@example.com"):
    register = client.post(
        "/api/v1/auth/register",
        json={"name": "Planned User", "email": email, "password": "Password123"},
    )
    assert register.status_code == 200
    token = register.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_planned_expenses(client):
    headers = _auth_headers(client)
    due_date = (date.today() + timedelta(days=45)).isoformat()

    create = client.post(
        "/api/v1/transactions/planned",
        headers=headers,
        json={
            "description": "Seguro del coche",
            "category": "Transporte",
            "amount": 600,
            "due_date": due_date,
            "recurrence_type": "monthly",
            "planning_mode": "weekly",
            "reminder_days_before": 10,
        },
    )
    assert create.status_code == 201
    body = create.json()
    assert body["recurrence_type"] == "monthly"
    assert body["planning_mode"] == "weekly"
    assert body["recommended_weekly_saving"] > 0

    listing = client.get("/api/v1/transactions/planned", headers=headers)
    assert listing.status_code == 200
    items = listing.json()
    assert len(items) == 1
    assert items[0]["description"] == "Seguro del coche"
    assert items[0]["recommended_monthly_saving"] > 0