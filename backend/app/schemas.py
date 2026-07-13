from datetime import date, datetime
from typing import Any, Dict, Optional, List
import uuid
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import AccountStatus, Theme, PaymentMethod, CreatedVia, AIStatus

# ==========================================
# Base Configuration
# ==========================================

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# User & Authentication Schemas
# ==========================================

class UserCreate(BaseSchema):
    full_name: str = Field(..., max_length=100, min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseSchema):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    email_verified: bool
    account_status: AccountStatus
    profile_picture: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class LoginRequest(BaseSchema):
    email: EmailStr
    password: str

class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseSchema):
    sub: Optional[str] = None
    exp: Optional[int] = None

# ==========================================
# User Settings Schemas
# ==========================================

class UserSettingsResponse(BaseSchema):
    currency: str
    timezone: str
    language: str
    theme: Theme
    weekly_report: bool
    monthly_report: bool
    budget_alerts: bool

class UserSettingsUpdate(BaseSchema):
    currency: Optional[str] = Field(None, max_length=5)
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=20)
    theme: Optional[Theme] = None
    weekly_report: Optional[bool] = None
    monthly_report: Optional[bool] = None
    budget_alerts: Optional[bool] = None

# ==========================================
# Category Schemas
# ==========================================

class CategoryCreate(BaseSchema):
    name: str = Field(..., max_length=100)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=10)

class CategoryResponse(BaseSchema):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_default: bool
    created_at: datetime

# ==========================================
# Expense Schemas
# ==========================================

class ExpenseCreate(BaseSchema):
    category_id: uuid.UUID
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=5)
    merchant: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    expense_date: date = Field(default_factory=date.today)
    created_via: CreatedVia = CreatedVia.WEBSITE

class ExpenseUpdate(BaseSchema):
    category_id: Optional[uuid.UUID] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=5)
    merchant: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    expense_date: Optional[date] = None

class ExpenseResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    category: Optional[CategoryResponse] = None
    amount: float
    currency: str
    merchant: Optional[str] = None
    description: Optional[str] = None
    payment_method: PaymentMethod
    expense_date: date
    created_via: CreatedVia
    ai_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

# ==========================================
# Budget Schemas
# ==========================================

class BudgetCreate(BaseSchema):
    category_id: uuid.UUID
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    budget_amount: float = Field(..., gt=0)

class BudgetUpdate(BaseSchema):
    budget_amount: Optional[float] = Field(None, gt=0)

class BudgetResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    category: Optional[CategoryResponse] = None
    month: int
    year: int
    budget_amount: float
    spent_amount: float
    created_at: datetime
    updated_at: datetime
