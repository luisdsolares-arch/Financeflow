from datetime import date, timedelta


def _auth_headers(client, email: str = "goals@example.com"):
    register = client.post(
        "/api/v1/auth/register",
        json={"name": "Goals User", "email": email, "password": "Password123"},
    )
    assert register.status_code == 200
    token = register.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_goals_and_notifications(client):
    headers = _auth_headers(client)

    goal = client.post(
        "/api/v1/goals",
        headers=headers,
        json={
            "title": "Viaje a Madrid",
            "target_amount": 2000,
            "current_amount": 400,
            "target_date": (date.today() + timedelta(days=120)).isoformat(),
            "priority": "medium",
        },
    )
    assert goal.status_code == 201
    assert goal.json()["monthly_required"] > 0

    planned = client.post(
        "/api/v1/transactions/planned",
        headers=headers,
        json={
            "description": "Seguro hogar",
            "category": "Vivienda",
            "amount": 300,
            "due_date": (date.today() + timedelta(days=5)).isoformat(),
            "recurrence_type": "one_time",
            "planning_mode": "monthly",
            "reminder_days_before": 7,
        },
    )
    assert planned.status_code == 201

    notifications = client.get("/api/v1/notifications", headers=headers)
    assert notifications.status_code == 200
    body = notifications.json()
    assert body["unread_count"] >= 1
    assert any(item["source"] == "planned_expense" for item in body["items"])