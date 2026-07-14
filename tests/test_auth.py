import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.pool import StaticPool

# Register SQLite fallback compilation rules for Postgres-specific types
@compiles(INET, "sqlite")
def compile_inet_sqlite(element, compiler, **kw):
    return "TEXT"

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(element, compiler, **kw):
    return "TEXT"

# Setup path to import backend modules
backend_path = r"d:\ExpenseAI\backend"
sys.path.append(backend_path)

from app.main import app
from app.core.database import get_db
from app.models import Base

# Setup in-memory SQLite database with StaticPool to persist connection
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in mock database
Base.metadata.create_all(bind=engine)

# DB dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_auth_flow():
    # 1. Register User
    print("Testing User Registration...")
    user_data = {
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "secretpassword"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201, f"Registration failed: {response.text}"
    user_json = response.json()
    assert user_json["email"] == "test@example.com"
    assert "id" in user_json
    print("✅ User Registration test passed!")

    # 2. Login User (JSON)
    print("Testing User Login...")
    login_data = {
        "email": "test@example.com",
        "password": "secretpassword"
    }
    response = client.post("/api/v1/auth/login/json", json=login_data)
    assert response.status_code == 200, f"Login failed: {response.text}"
    token_json = response.json()
    assert "access_token" in token_json
    assert "refresh_token" in token_json
    assert token_json["token_type"] == "bearer"
    token = token_json["access_token"]
    refresh_token = token_json["refresh_token"]
    print("✅ User Login test passed!")

    # 3. Read Current User Profile
    print("Testing Read User Profile...")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200, f"Me retrieval failed: {response.text}"
    me_json = response.json()
    assert me_json["email"] == "test@example.com"
    assert me_json["full_name"] == "Test User"
    print("✅ Read Profile test passed!")

    # 4. Attempt login with wrong password
    print("Testing Wrong Password Rejection...")
    login_data_wrong = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login/json", json=login_data_wrong)
    assert response.status_code == 400, f"Expected 400, got: {response.status_code}"
    print("✅ Wrong Password rejection test passed!")

    # 5. Refresh token rotation
    print("Testing Token Refresh & Rotation...")
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200, f"Token refresh failed: {response.text}"
    refresh_json = response.json()
    assert "access_token" in refresh_json
    assert "refresh_token" in refresh_json
    new_token = refresh_json["access_token"]
    new_refresh_token = refresh_json["refresh_token"]
    assert new_refresh_token != refresh_token
    print("✅ Token Refresh test passed!")

    # 6. Linking flow: Generate Token
    print("Testing Linking Token Generation...")
    headers = {"Authorization": f"Bearer {new_token}"}
    response = client.post("/api/v1/auth/link/token", json={"platform": "telegram"}, headers=headers)
    assert response.status_code == 200, f"Link token generation failed: {response.text}"
    link_json = response.json()
    assert "token" in link_json
    assert link_json["platform"] == "telegram"
    link_code = link_json["token"]
    print("✅ Linking Token Generation test passed!")

    # 7. Linking flow: Redeem Token for Telegram
    print("Testing Linking Token Redemption (Telegram)...")
    redeem_data = {
        "token": link_code,
        "platform": "telegram",
        "platform_user_id": "123456789",
        "username": "testtelegram"
    }
    response = client.post("/api/v1/auth/link/redeem", json=redeem_data)
    assert response.status_code == 200, f"Link token redemption failed: {response.text}"
    redeem_json = response.json()
    assert redeem_json["status"] == "success"
    print("✅ Linking Token Redemption (Telegram) test passed!")

    # 8. Linking flow: Verify linked account is listed
    print("Testing Listing Connected Accounts...")
    response = client.get("/api/v1/auth/link/accounts", headers=headers)
    assert response.status_code == 200, f"Get connected accounts failed: {response.text}"
    accounts_json = response.json()
    assert len(accounts_json) == 1
    assert accounts_json[0]["platform"] == "telegram"
    assert accounts_json[0]["platform_user_id"] == "123456789"
    assert accounts_json[0]["username"] == "testtelegram"
    print("✅ Listing Connected Accounts test passed!")

    # 9. Linking flow: Discord link redemption (requires new token generation)
    print("Testing Linking Token Generation & Redemption (Discord)...")
    response = client.post("/api/v1/auth/link/token", json={"platform": "discord"}, headers=headers)
    link_code_discord = response.json()["token"]
    redeem_data_discord = {
        "token": link_code_discord,
        "platform": "discord",
        "platform_user_id": "9876543210123",
        "username": "testdiscord"
    }
    response = client.post("/api/v1/auth/link/redeem", json=redeem_data_discord)
    assert response.status_code == 200, f"Discord linking failed: {response.text}"
    
    # Verify both listed
    response = client.get("/api/v1/auth/link/accounts", headers=headers)
    assert len(response.json()) == 2
    print("✅ Linking Token Redemption (Discord) test passed!")

    # 10. Linking flow: Unlink platform
    print("Testing Unlinking Connected Account...")
    response = client.post("/api/v1/auth/link/unlink", json={"platform": "discord"}, headers=headers)
    assert response.status_code == 200, f"Unlinking failed: {response.text}"
    
    # Verify only Telegram remains
    response = client.get("/api/v1/auth/link/accounts", headers=headers)
    assert len(response.json()) == 1
    assert response.json()[0]["platform"] == "telegram"
    print("✅ Unlinking Connected Account test passed!")

    # 11. Logout
    print("Testing User Logout...")
    response = client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh_token})
    assert response.status_code == 204
    
    # Verify token refresh fails after logout
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh_token})
    assert response.status_code == 401
    print("✅ User Logout test passed!")

if __name__ == "__main__":
    try:
        test_auth_flow()
        print("\n🎉 ALL AUTHENTICATION & MULTI-CHANNEL LINKING FLOW TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        import traceback
        print("\n❌ Test execution failed:")
        traceback.print_exc()
        sys.exit(1)
