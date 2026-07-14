from datetime import date, datetime, time
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
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseSchema):
    refresh_token: str

class LogoutRequest(BaseSchema):
    refresh_token: str


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
# Subcategory & Tag Schemas
# ==========================================

class SubcategoryResponse(BaseSchema):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str

class TagResponse(BaseSchema):
    id: uuid.UUID
    name: str

# ==========================================
# Account Schemas
# ==========================================

class AccountCreate(BaseSchema):
    name: str = Field(..., max_length=100)
    type: str = Field("savings", max_length=50)
    balance: float = 0.0

class AccountUpdate(BaseSchema):
    name: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, max_length=50)
    balance: Optional[float] = None

class AccountResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    type: str
    balance: float
    created_at: datetime
    updated_at: datetime

# ==========================================
# Expense Schemas
# ==========================================

class ExpenseCreate(BaseSchema):
    category_id: uuid.UUID
    subcategory_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=5)
    merchant: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    location: Optional[str] = Field(None, max_length=255)
    is_recurring: bool = False
    transaction_time: Optional[time] = None
    receipt_url: Optional[str] = Field(None, max_length=512)
    expense_date: date = Field(default_factory=date.today)
    created_via: CreatedVia = CreatedVia.WEBSITE

class ExpenseUpdate(BaseSchema):
    category_id: Optional[uuid.UUID] = None
    subcategory_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=5)
    merchant: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    location: Optional[str] = None
    is_recurring: Optional[bool] = None
    transaction_time: Optional[time] = None
    receipt_url: Optional[str] = None
    expense_date: Optional[date] = None

class ExpenseResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    category: Optional[CategoryResponse] = None
    subcategory_id: Optional[uuid.UUID] = None
    subcategory: Optional[SubcategoryResponse] = None
    account_id: Optional[uuid.UUID] = None
    account: Optional[AccountResponse] = None
    amount: float
    currency: str
    merchant: Optional[str] = None
    description: Optional[str] = None
    payment_method: PaymentMethod
    location: Optional[str] = None
    is_recurring: bool
    transaction_time: Optional[time] = None
    receipt_url: Optional[str] = None
    tags: List[TagResponse] = []
    expense_date: date
    created_via: CreatedVia
    ai_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

# ==========================================
# Income Schemas
# ==========================================

class IncomeCreate(BaseSchema):
    amount: float = Field(..., gt=0)
    currency: str = Field("INR", max_length=5)
    category: str = Field(..., max_length=100)
    account_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    income_date: date = Field(default_factory=date.today)

class IncomeUpdate(BaseSchema):
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=5)
    category: Optional[str] = Field(None, max_length=100)
    account_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    income_date: Optional[date] = None

class IncomeResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: float
    currency: str
    category: str
    account_id: Optional[uuid.UUID] = None
    account: Optional[AccountResponse] = None
    description: Optional[str] = None
    income_date: date
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


# ==========================================
# Session & Linking Schemas
# ==========================================

class LinkTokenCreate(BaseSchema):
    platform: str = Field(..., max_length=50)


class LinkTokenResponse(BaseSchema):
    token: str
    platform: str
    expires_at: datetime


class LinkRedeemRequest(BaseSchema):
    token: str
    platform: str
    platform_user_id: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    team_id: Optional[str] = None


class ConnectedAccountInfo(BaseSchema):
    platform: str
    platform_user_id: str
    username: Optional[str] = None
    linked_at: datetime
    is_active: bool


class UnlinkAccountRequest(BaseSchema):
    platform: str


# ==========================================
# Expense Parsing Schemas
# ==========================================

class ExpenseParseRequest(BaseSchema):
    raw_message: str
    source: CreatedVia = CreatedVia.WEBSITE
