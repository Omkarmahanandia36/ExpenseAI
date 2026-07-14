import sys
import os
os.environ["GROQ_API_KEY"] = "mock_groq_api_key_for_testing"
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
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
from app.models import Base, User, Category, Expense, CreatedVia, AIStatus
from app.services.ai import AIParserService

# Setup in-memory SQLite database
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

# Helper to register and login user to get token
def get_auth_token():
    user_data = {
        "full_name": "Expense Tester",
        "email": "tester@example.com",
        "password": "testpassword"
    }
    # Try logging in first in case already registered
    login_response = client.post("/api/v1/auth/login/json", json={"email": "tester@example.com", "password": "testpassword"})
    if login_response.status_code == 200:
        return login_response.json()["access_token"]
        
    register_response = client.post("/api/v1/auth/register", json=user_data)
    assert register_response.status_code == 201
    
    login_response = client.post("/api/v1/auth/login/json", json={"email": "tester@example.com", "password": "testpassword"})
    assert login_response.status_code == 200
    return login_response.json()["access_token"]

def test_rule_based_parsing():
    print("Testing Rule-Based Parsing...")
    res = AIParserService.parse_rule_based("Spent $18.50 at Starbucks")
    assert res is not None
    assert res["amount"] == 18.50
    assert res["merchant"] == "Starbucks"
    assert res["currency"] == "USD"
    assert res["confidence"] == 0.90
    print("✅ Rule-Based Parsing passed!")

@patch("httpx.AsyncClient.post")
def test_expense_parsing_and_crud(mock_post):
    print("Testing AI Parsing and CRUD Endpoints...")
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Mock Groq API response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"amount": 42.00, "currency": "EUR", "merchant": "Trainline", "category": "Transportation", "payment_method": "credit_card", "date": "2026-07-14", "description": "train ticket"}'
                }
            }
        ]
    }
    mock_post.return_value = mock_response
    
    # 2. Call parsing endpoint
    # Send a message that won't match regex to force AI parsing mock
    parse_data = {
        "raw_message": "Paid 42 EUR for train ticket yesterday",
        "source": "telegram"
    }
    response = client.post("/api/v1/expenses/parse", json=parse_data, headers=headers)
    assert response.status_code == 200, f"Parse failed: {response.text}"
    expense_json = response.json()
    
    assert expense_json["amount"] == 42.00
    assert expense_json["currency"] == "EUR"
    assert expense_json["merchant"] == "Trainline"
    assert expense_json["payment_method"] == "credit_card"
    assert expense_json["created_via"] == "telegram"
    
    # Verify that category was automatically created
    category_id = expense_json["category_id"]
    assert category_id is not None
    print("✅ Expense parsed and created!")

    # 3. Retrieve user expenses
    response = client.get("/api/v1/expenses", headers=headers)
    assert response.status_code == 200
    expenses_list = response.json()
    assert len(expenses_list) >= 1
    # Check that our expense is in the list
    found = False
    for exp in expenses_list:
        if exp["id"] == expense_json["id"]:
            found = True
            assert exp["amount"] == 42.00
            assert exp["merchant"] == "Trainline"
    assert found
    print("✅ User expenses listed!")

    # 4. Soft-delete expense
    expense_id = expense_json["id"]
    response = client.delete(f"/api/v1/expenses/{expense_id}", headers=headers)
    assert response.status_code == 204
    print("✅ Expense deleted!")

    # 5. Verify deleted expense is not listed
    response = client.get("/api/v1/expenses", headers=headers)
    assert response.status_code == 200
    expenses_list_after = response.json()
    for exp in expenses_list_after:
        assert exp["id"] != expense_id
    print("✅ Deleted expense omitted from list!")

if __name__ == "__main__":
    try:
        test_rule_based_parsing()
        test_expense_parsing_and_crud()
        print("\n🎉 ALL EXPENSES ENGINE & CRUD FLOW TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        import traceback
        print("\n❌ Test execution failed:")
        traceback.print_exc()
        sys.exit(1)
