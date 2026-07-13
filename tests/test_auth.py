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
    assert token_json["token_type"] == "bearer"
    token = token_json["access_token"]
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

if __name__ == "__main__":
    try:
        test_auth_flow()
        print("\n🎉 ALL AUTHENTICATION FLOW TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        import traceback
        print("\n❌ Test execution failed:")
        traceback.print_exc()
        sys.exit(1)
