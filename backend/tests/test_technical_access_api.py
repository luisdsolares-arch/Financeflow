import time

from app.core.config import settings


def test_technical_access_lockout_flow(client):
    original_pin = settings.technical_access_pin
    original_max_attempts = settings.technical_access_max_attempts
    original_block_seconds = settings.technical_access_block_seconds

    settings.technical_access_pin = "0812"
    settings.technical_access_max_attempts = 3
    settings.technical_access_block_seconds = 1

    try:
        status = client.get("/api/v1/auth/technical-access/status")
        assert status.status_code == 200
        assert status.json()["is_blocked"] is False
        assert status.json()["remaining_attempts"] == 3

        for expected_remaining in [2, 1]:
            failed = client.post("/api/v1/auth/technical-access/verify", json={"pin": "9999"})
            assert failed.status_code == 200
            assert failed.json()["ok"] is False
            assert failed.json()["is_blocked"] is False
            assert failed.json()["remaining_attempts"] == expected_remaining

        blocked = client.post("/api/v1/auth/technical-access/verify", json={"pin": "9999"})
        assert blocked.status_code == 200
        assert blocked.json()["ok"] is False
        assert blocked.json()["is_blocked"] is True
        assert blocked.json()["remaining_attempts"] == 0

        blocked_with_valid_pin = client.post("/api/v1/auth/technical-access/verify", json={"pin": "0812"})
        assert blocked_with_valid_pin.status_code == 200
        assert blocked_with_valid_pin.json()["ok"] is False
        assert blocked_with_valid_pin.json()["is_blocked"] is True

        time.sleep(1.1)

        unlocked = client.post("/api/v1/auth/technical-access/verify", json={"pin": "0812"})
        assert unlocked.status_code == 200
        assert unlocked.json()["ok"] is True
        assert unlocked.json()["is_blocked"] is False
        assert unlocked.json()["remaining_attempts"] == 3
    finally:
        settings.technical_access_pin = original_pin
        settings.technical_access_max_attempts = original_max_attempts
        settings.technical_access_block_seconds = original_block_seconds
