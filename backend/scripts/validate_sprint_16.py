import httpx
import sys

BASE_URL = "http://localhost:8001"

def get_admin_token():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@localiot.com",
        "password": "Password@123"
    })
    if resp.status_code != 200:
        print(f"Failed to get admin token: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

def run_tests():
    print("=" * 50)
    print("Sprint 16 E2E Integration Validation")
    print("=" * 50)
    
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n[1] Testing General Settings")
    # Update settings
    resp = httpx.put(f"{BASE_URL}/settings/general", json={
        "settings": {
            "companyName": "Test Company",
            "timezone": "UTC"
        }
    }, headers=headers)
    assert resp.status_code == 200, f"Failed to update general settings: {resp.text}"
    
    # Get settings
    resp = httpx.get(f"{BASE_URL}/settings/general", headers=headers)
    assert resp.status_code == 200, f"Failed to get general settings: {resp.text}"
    data = resp.json()
    assert data["companyName"] == "Test Company", "Settings mismatch"
    print("[OK] General Settings API works")
    
    print("\n[2] Testing Health Dashboard")
    resp = httpx.get(f"{BASE_URL}/settings/health", headers=headers)
    assert resp.status_code == 200, f"Failed to get health status: {resp.text}"
    health = resp.json()
    assert health["overall_status"] == "healthy", "Health status not healthy"
    assert "cpu_percent" in health["system"], "Missing CPU metrics"
    print("[OK] Health Dashboard API works")
    
    print("\n[3] Testing Audit Logs")
    resp = httpx.get(f"{BASE_URL}/settings/audit", headers=headers)
    assert resp.status_code == 200, f"Failed to get audit logs: {resp.text}"
    audit = resp.json()
    assert audit["total"] >= 1, "Audit log should have recorded the general settings update"
    print("[OK] Audit Logs API works")
    
    print("\n[DONE] Phase 16 Validation Complete!")

if __name__ == "__main__":
    run_tests()
