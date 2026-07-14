import sys
import os
from unittest.mock import patch
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

# Add backend to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.main import app
from app.core.database import get_db
from app.models import Base, User, Account, Income, Budget, Category

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

# Seed top-level category in test SQLite DB
db_session = TestingSessionLocal()
test_cat = Category(
    name="Food & Dining",
    color="#FF5733",
    icon="🍔"
)
db_session.add(test_cat)
db_session.commit()
db_session.refresh(test_cat)
TEST_CATEGORY_ID = str(test_cat.id)
db_session.close()

# DB dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Test user credentials
TEST_EMAIL = "finance_test@example.com"
TEST_PASSWORD = "password123"
TEST_FULL_NAME = "Finance Tester"

def get_auth_headers():
    # 1. Register test user
    client.post("/api/v1/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "full_name": TEST_FULL_NAME
    })
    
    # 2. Login
    login_response = client.post("/api/v1/auth/login/json", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_financial_features():
    print("Obtaining authorization headers...")
    headers = get_auth_headers()
    
    # 1. Create a bank account
    print("Testing Bank Account Creation...")
    account_res = client.post("/api/v1/accounts", json={
        "name": "SBI Savings",
        "type": "savings",
        "balance": 1000.0
    }, headers=headers)
    if account_res.status_code not in (200, 201):
        print(f"FAILED account creation: status={account_res.status_code}, response={account_res.text}")
    assert account_res.status_code in (200, 201)
    account_data = account_res.json()
    assert account_data["name"] == "SBI Savings"
    assert account_data["balance"] == 1000.0
    account_id = account_data["id"]
    print("✅ Bank Account created successfully!")

    # 2. Log Income and verify account balance update
    print("Testing Income Logging & Balance Update...")
    income_res = client.post("/api/v1/incomes", json={
        "amount": 5000.0,
        "currency": "INR",
        "category": "Salary",
        "account_id": account_id,
        "description": "Monthly Paycheck",
        "income_date": "2026-07-14"
    }, headers=headers)
    if income_res.status_code not in (200, 201):
        print(f"FAILED income logging: status={income_res.status_code}, response={income_res.text}")
    assert income_res.status_code in (200, 201)
    income_data = income_res.json()
    assert income_data["amount"] == 5000.0
    assert income_data["category"] == "Salary"
    income_id = income_data["id"]

    # Verify that SBI Savings account balance was updated: 1000.0 + 5000.0 = 6000.0
    accounts_res = client.get("/api/v1/accounts", headers=headers)
    sbi_acc = next((a for a in accounts_res.json() if a["id"] == account_id), None)
    assert sbi_acc is not None
    assert sbi_acc["balance"] == 6000.0
    print("✅ Income logged and account balance updated successfully!")

    # 3. Create category budget limit
    print("Testing Budget Setup...")
    budget_res = client.post("/api/v1/budgets", json={
        "category_id": TEST_CATEGORY_ID,
        "budget_amount": 500.0,
        "month": 7,
        "year": 2026
    }, headers=headers)
    if budget_res.status_code not in (200, 201):
        print(f"FAILED budget creation: status={budget_res.status_code}, response={budget_res.text}")
    assert budget_res.status_code in (200, 201)
    budget_data = budget_res.json()
    assert budget_data["category_id"] == TEST_CATEGORY_ID
    assert budget_data["budget_amount"] == 500.0
    budget_id = budget_data["id"]
    print("✅ Budget limit configured successfully!")

    # 4. Fetch Dashboard Reports and verify metrics
    print("Testing Dashboard Reports Endpoint...")
    reports_res = client.get("/api/v1/reports/dashboard", headers=headers)
    assert reports_res.status_code == 200
    reports_data = reports_res.json()
    
    # Assert cash flow structure
    cash_flow = reports_data["cash_flow"]
    assert cash_flow["total_income"] == 5000.0
    assert cash_flow["total_expense"] == 0.0
    assert cash_flow["net_savings"] == 5000.0
    assert cash_flow["savings_rate"] == 100.0
    
    # Assert budgets list contains our category
    daily_trend = reports_data["daily_trend"]
    assert isinstance(daily_trend, list)
    print("✅ Reports generated and verified successfully!")

    # 5. Clean up entities
    print("Cleaning up database entries...")
    del_budget_res = client.delete(f"/api/v1/budgets/{budget_id}", headers=headers)
    assert del_budget_res.status_code == 204
    
    del_income_res = client.delete(f"/api/v1/incomes/{income_id}", headers=headers)
    assert del_income_res.status_code == 204
    
    del_account_res = client.delete(f"/api/v1/accounts/{account_id}", headers=headers)
    assert del_account_res.status_code == 204
    print("✅ Cleanup completed!")

if __name__ == "__main__":
    try:
        test_financial_features()
        print("\n🎉 ALL PERSONAL FINANCE EXPANDED SYSTEM TESTS PASSED SUCCESSFULLY!\n")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("\n❌ Financial features test execution failed!\n")
        sys.exit(1)
