import sys
import os
import requests

# Set path to import scripts.utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.utils import test_step, assert_eq, wait_for_backend, seed_test_user, BASE_URL

@test_step("1. Setup and Login")
def test_setup():
    wait_for_backend()
    
    # Login as seeded user
    res = requests.post(f"{BASE_URL}/auth/login/", data={
        "username": "admin@localiot.com",
        "password": "password123"
    })
    assert_eq(res.status_code, 200, "Login successful")
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@test_step("2. User Lifecycle (CRUD)")
def test_user_lifecycle(headers):
    # 1. Create a user
    payload = {
        "first_name": "Test",
        "last_name": "Operator",
        "email": "operator@localiot.com",
        "password": "SecurePassword1!",
        "role": "Operator"
    }
    res = requests.post(f"{BASE_URL}/users/", json=payload, headers=headers)
    assert_eq(res.status_code, 201, "Create User")
    user_id = res.json()["id"]

    # 2. List users
    res = requests.get(f"{BASE_URL}/users/", headers=headers)
    assert_eq(res.status_code, 200, "List Users")
    users = res.json()["items"]
    assert_eq(any(u["id"] == user_id for u in users), True, "Created user found in list")

    # 3. Get user details
    res = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)
    assert_eq(res.status_code, 200, "Get User")
    assert_eq(res.json()["first_name"], "Test", "User name matches")

    # 4. Update user
    res = requests.patch(f"{BASE_URL}/users/{user_id}", json={"first_name": "Updated"}, headers=headers)
    assert_eq(res.status_code, 200, "Update User")
    assert_eq(res.json()["first_name"], "Updated", "Name updated")

    # 5. Disable user (delete)
    res = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
    assert_eq(res.status_code, 200, "Disable User")
    
    res = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)
    assert_eq(res.json()["status"], "INACTIVE", "Status is inactive")

    return user_id

@test_step("3. Password Management")
def test_password_management(headers, user_id):
    # Reset Password (Admin)
    res = requests.post(f"{BASE_URL}/users/{user_id}/reset-password", json={
        "auto_generate": True
    }, headers=headers)
    assert_eq(res.status_code, 200, "Reset Password (Auto)")
    assert_eq("temporary_password" in res.json(), True, "Temporary password returned")

    # Change Own Password
    res = requests.post(f"{BASE_URL}/users/change-password", json={
        "current_password": "password123",
        "new_password": "NewPassword123!",
        "confirm_password": "NewPassword123!"
    }, headers=headers)
    assert_eq(res.status_code, 200, "Change Own Password")
    
    # Restore original password for next runs
    requests.post(f"{BASE_URL}/users/change-password", json={
        "current_password": "NewPassword123!",
        "new_password": "password123",
        "confirm_password": "password123"
    }, headers=headers)


if __name__ == "__main__":
    print("==================================================")
    print("Sprint 15 User Management Validation")
    print("==================================================")
    
    seed_test_user()
    
    headers = test_setup()
    if headers:
        user_id = test_user_lifecycle(headers)
        if user_id:
            test_password_management(headers, user_id)

    print("\n✅ All Sprint 15 validations passed!")
