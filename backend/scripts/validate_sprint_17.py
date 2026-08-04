import httpx
import time
from sqlalchemy import create_engine

BASE_URL = "http://localhost:8001"

def run_tests():
    print("=" * 50)
    print("Sprint 17 E2E Integration Validation")
    print("=" * 50)

    # 1. Login
    login_data = {
        "email": "admin@localiot.com",
        "password": "Password@123"
    }
    resp = httpx.post(f"{BASE_URL}/auth/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get notification preferences
    print("\n[1] Testing Notification Preferences...")
    resp = httpx.get(f"{BASE_URL}/notifications/preferences", headers=headers)
    assert resp.status_code == 200, f"Failed to get preferences: {resp.text}"
    prefs = resp.json()
    assert len(prefs) > 0, "No preferences returned"
    print("[OK] Notification Preferences API works")

    # 3. Update preference
    print("\n[2] Updating Preferences...")
    update_data = {
        "channel": "EMAIL",
        "is_enabled": False
    }
    resp = httpx.put(f"{BASE_URL}/notifications/preferences", json=update_data, headers=headers)
    assert resp.status_code == 200, f"Failed to update preference: {resp.text}"
    assert resp.json()["is_enabled"] is False, "Preference not updated"
    
    # Revert it back to True
    update_data["is_enabled"] = True
    httpx.put(f"{BASE_URL}/notifications/preferences", json=update_data, headers=headers)
    print("[OK] Update Preferences API works")

    # 4. Get notification history
    print("\n[3] Testing Notification History...")
    resp = httpx.get(f"{BASE_URL}/notifications/history", headers=headers)
    assert resp.status_code == 200, f"Failed to get history: {resp.text}"
    history = resp.json()
    assert "total" in history and "items" in history, "Invalid history format"
    print("[OK] Notification History API works")
    
    print("\n[DONE] Phase 17 Validation Complete!")

if __name__ == "__main__":
    run_tests()
