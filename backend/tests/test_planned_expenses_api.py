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


def test_mark_planned_expense_paid_flow(client):
    headers = _auth_headers(client, email="planned-mark@example.com")
    due_date = (date.today() + timedelta(days=20)).isoformat()

    one_time = client.post(
        "/api/v1/transactions/planned",
        headers=headers,
        json={
            "description": "ITV",
            "category": "Transporte",
            "amount": 50,
            "due_date": due_date,
            "recurrence_type": "one_time",
            "planning_mode": "monthly",
            "reminder_days_before": 7,
        },
    )
    assert one_time.status_code == 201
    one_time_id = one_time.json()["id"]

    mark_one_time = client.patch(f"/api/v1/transactions/planned/{one_time_id}/mark-paid", headers=headers)
    assert mark_one_time.status_code == 200
    assert "puntual" in mark_one_time.json()["message"].lower()

    recurring = client.post(
        "/api/v1/transactions/planned",
        headers=headers,
        json={
            "description": "Alquiler trastero",
            "category": "Vivienda",
            "amount": 90,
            "due_date": due_date,
            "recurrence_type": "monthly",
            "planning_mode": "monthly",
            "reminder_days_before": 10,
        },
    )
    assert recurring.status_code == 201
    recurring_id = recurring.json()["id"]
    first_due_date = recurring.json()["due_date"]

    mark_recurring = client.patch(f"/api/v1/transactions/planned/{recurring_id}/mark-paid", headers=headers)
    assert mark_recurring.status_code == 200
    assert "recurrente" in mark_recurring.json()["message"].lower()
    assert mark_recurring.json()["planned_expense"]["due_date"] != first_due_date


def test_update_and_delete_planned_expense(client):
    headers = _auth_headers(client, email="planned-edit@example.com")
    due_date = (date.today() + timedelta(days=25)).isoformat()

    created = client.post(
        "/api/v1/transactions/planned",
        headers=headers,
        json={
            "description": "Internet",
            "category": "Servicios",
            "amount": 45,
            "due_date": due_date,
            "recurrence_type": "monthly",
            "planning_mode": "monthly",
            "reminder_days_before": 7,
        },
    )
    assert created.status_code == 201
    planned_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/transactions/planned/{planned_id}",
        headers=headers,
        json={
            "description": "Internet Fibra",
            "category": "Servicios",
            "amount": 49,
            "due_date": due_date,
            "recurrence_type": "monthly",
            "planning_mode": "weekly",
            "reminder_days_before": 5,
            "is_active": True,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Internet Fibra"
    assert updated.json()["planning_mode"] == "weekly"

    deleted = client.delete(f"/api/v1/transactions/planned/{planned_id}", headers=headers)
    assert deleted.status_code == 200

    listing = client.get("/api/v1/transactions/planned", headers=headers)
    assert listing.status_code == 200
    assert all(item["id"] != planned_id for item in listing.json())