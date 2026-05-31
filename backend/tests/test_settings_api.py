def _auth_headers(client, email: str = "settings@example.com"):
    register = client.post(
        "/api/v1/auth/register",
        json={"name": "Settings User", "email": email, "password": "Password123"},
    )
    assert register.status_code == 200
    token = register.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_settings_default_created_and_persisted(client):
    headers = _auth_headers(client)

    get_default = client.get("/api/v1/settings", headers=headers)
    assert get_default.status_code == 200
    default_body = get_default.json()
    assert default_body["currency"] == "USD"
    assert default_body["profile_name"] == "Settings User"
    assert default_body["profile_email"] == "settings@example.com"

    update_payload = {
        "profile_name": "Usuario Configurado",
        "profile_email": "usuario.config@example.com",
        "currency": "DOP",
        "monthly_savings_goal": 35,
        "weekly_budget_alert_threshold": 70,
        "require_2fa_for_sensitive_actions": True,
        "notify_email": False,
        "notify_push": True,
        "notify_payment_reminders": False,
        "auto_sync_bank_daily": False,
        "payment_assistant_enabled": True,
        "default_payment_limit": 2500,
        "dark_mode": True,
    }

    updated = client.put("/api/v1/settings", headers=headers, json=update_payload)
    assert updated.status_code == 200
    updated_body = updated.json()
    assert updated_body["currency"] == "DOP"
    assert updated_body["monthly_savings_goal"] == 35
    assert updated_body["require_2fa_for_sensitive_actions"] is True
    assert updated_body["dark_mode"] is True

    get_after_update = client.get("/api/v1/settings", headers=headers)
    assert get_after_update.status_code == 200
    assert get_after_update.json()["default_payment_limit"] == 2500
    assert get_after_update.json()["notify_email"] is False
    assert get_after_update.json()["dark_mode"] is True
