import sys
import os
import httpx
import time

BASE_URL = "http://localhost:8001"

def run_tests():
    print("==================================================")
    print("Sprint 14.5 Authentication Validation")
    print("==================================================")

    # 1. Login with valid credentials
    print("\n[1] Testing valid login...")
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@localiot.com",
        "password": "Password@123"
    })
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    token = data["access_token"]
    print("[PASS] POST /auth/login with valid credentials -> 200 + JWT")

    # 2. Wrong password
    print("\n[2] Testing wrong password...")
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@localiot.com",
        "password": "WrongPassword"
    })
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("[PASS] Wrong password -> 401")

    # 3. Unknown email
    print("\n[3] Testing unknown email...")
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "doesnotexist@localiot.com",
        "password": "Password@123"
    })
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("[PASS] Unknown email -> 401")

    # 4. Disabled user
    print("\n[4] Testing disabled user...")
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "disabled@localiot.com",
        "password": "Password@123"
    })
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    print("[PASS] Disabled user -> 403")

    # 5. Protected APIs - Without token
    print("\n[5] Testing protected APIs (No Token)...")
    resp = httpx.get(f"{BASE_URL}/organizations/")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("[PASS] GET /organizations without token -> 401")

    # 6. Protected APIs - With token
    print("\n[6] Testing protected APIs (With Token)...")
    resp = httpx.get(f"{BASE_URL}/organizations/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    print("[PASS] GET /organizations with valid token -> 200")


    # 8. Permissions - Admin trying to delete
    print("\n[8] Testing permissions (Admin DELETE)...")
    resp = httpx.delete(f"{BASE_URL}/organizations/fake-id", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code in [204, 404], f"Expected 204 or 404 (if not found), got {resp.status_code}"
    print("[PASS] DELETE /organizations/{id} as Admin -> passed RBAC check")

    print("\n==================================================")
    print("All backend validation scenarios passed successfully!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
