import enum
from datetime import date, datetime, time
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    BIGINT,
    Boolean,
    Date as SQLDate,
    DateTime,
    Time,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Table,
    Column,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# ==========================================
# Declarative Base
# ==========================================

class Base(DeclarativeBase):
    pass

# ==========================================
# Enums
# ==========================================

class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"

class Theme(str, enum.Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    DEBIT_CARD = "debit_card"
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    UPI = "upi"
    NET_BANKING = "net_banking"
    WALLET = "wallet"
    CHEQUE = "cheque"
    PAYPAL = "paypal"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    OTHER = "other"

class CreatedVia(str, enum.Enum):
    TELEGRAM = "telegram"
    WEBSITE = "website"
    RECEIPT = "receipt"
    VOICE = "voice"
    API = "api"

class AIStatus(str, enum.Enum):
    PENDING = "pending"
    PARSED = "parsed"
    FAILED = "failed"
    MANUAL_REVIEW = "manual_review"

# ==========================================
# Database Models
# ==========================================

# 1️⃣ User Model
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    profile_picture: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    account_status: Mapped[AccountStatus] = mapped_column(
        SQLEnum(AccountStatus, name="account_status_type"),
        default=AccountStatus.ACTIVE,
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    telegram_account: Mapped[Optional["TelegramAccount"]] = relationship(
        "TelegramAccount",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    discord_account: Mapped[Optional["DiscordAccount"]] = relationship(
        "DiscordAccount",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    slack_account: Mapped[Optional["SlackAccount"]] = relationship(
        "SlackAccount",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    link_tokens: Mapped[List["LinkToken"]] = relationship(
        "LinkToken", back_populates="user", cascade="all, delete-orphan"
    )
    settings: Mapped["UserSettings"] = relationship(
        "UserSettings",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    categories: Mapped[List["Category"]] = relationship(
        "Category", back_populates="user", cascade="all, delete-orphan"
    )
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="user", cascade="all, delete-orphan"
    )
    accounts: Mapped[List["Account"]] = relationship(
        "Account", back_populates="user", cascade="all, delete-orphan"
    )
    incomes: Mapped[List["Income"]] = relationship(
        "Income", back_populates="user", cascade="all, delete-orphan"
    )
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", back_populates="user", cascade="all, delete-orphan"
    )
    budgets: Mapped[List["Budget"]] = relationship(
        "Budget", back_populates="user", cascade="all, delete-orphan"
    )
    chat_history: Mapped[List["AIChatHistory"]] = relationship(
        "AIChatHistory", back_populates="user", cascade="all, delete-orphan"
    )
    raw_messages: Mapped[List["ExpenseRawMessage"]] = relationship(
        "ExpenseRawMessage", back_populates="user", cascade="all, delete-orphan"
    )


# 2️⃣ TelegramAccount Model
class TelegramAccount(Base):
    __tablename__ = "telegram_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    telegram_user_id: Mapped[int] = mapped_column(
        BIGINT, unique=True, nullable=False, index=True
    )
    telegram_username: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    telegram_first_name: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    telegram_last_name: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    chat_id: Mapped[int] = mapped_column(BIGINT, nullable=False, index=True)
    bot_started: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="telegram_account")


# 3️⃣ UserSession Model
class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    device_name: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    refresh_token_hash: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")


# 4️⃣ UserSettings Model
class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(String(5), default="USD", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)
    theme: Mapped[Theme] = mapped_column(
        SQLEnum(Theme, name="theme_type"), default=Theme.SYSTEM, nullable=False
    )
    weekly_report: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    monthly_report: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    budget_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="settings")


# 5️⃣ Category Model
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="categories")
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="category"
    )
    subcategories: Mapped[List["Subcategory"]] = relationship(
        "Subcategory", back_populates="category", cascade="all, delete-orphan"
    )
    budgets: Mapped[List["Budget"]] = relationship("Budget", back_populates="category")


# expense_tags junction table
expense_tags = Table(
    "expense_tags",
    Base.metadata,
    Column("expense_id", UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)


# 6️⃣ Expense Model
class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    subcategory_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subcategories.id", ondelete="SET NULL"), nullable=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(5), default="USD", nullable=False)
    merchant: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLEnum(PaymentMethod, name="payment_method_type"),
        default=PaymentMethod.CASH,
        nullable=False,
    )
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    transaction_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    expense_date: Mapped[date] = mapped_column(
        SQLDate, default=date.today, nullable=False
    )
    created_via: Mapped[CreatedVia] = mapped_column(
        SQLEnum(CreatedVia, name="created_via_type"),
        default=CreatedVia.WEBSITE,
        nullable=False,
    )
    ai_confidence: Mapped[Optional[float]] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="expenses")
    category: Mapped["Category"] = relationship("Category", back_populates="expenses")
    subcategory: Mapped[Optional["Subcategory"]] = relationship("Subcategory", back_populates="expenses")
    account: Mapped[Optional["Account"]] = relationship("Account", back_populates="expenses")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=expense_tags, back_populates="expenses")

    # Composite Indexes
    __table_args__ = (
        Index("idx_expenses_user_id", "user_id", postgresql_where="deleted_at IS NULL"),
        Index(
            "idx_expenses_expense_date",
            "expense_date",
            postgresql_where="deleted_at IS NULL",
        ),
        Index(
            "idx_expenses_category_id",
            "category_id",
            postgresql_where="deleted_at IS NULL",
        ),
        Index(
            "idx_expenses_merchant",
            "merchant",
            postgresql_where="deleted_at IS NULL",
        ),
        Index(
            "idx_expenses_created_at",
            "created_at",
            postgresql_where="deleted_at IS NULL",
        ),
    )


# 7️⃣ Budget Model
class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    spent_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0.00, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="budgets")
    category: Mapped["Category"] = relationship("Category", back_populates="budgets")

    # Table Constraints & Indexes
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "category_id",
            "month",
            "year",
            name="uq_budgets_user_category_month_year",
        ),
        Index("idx_budgets_user_year_month", "user_id", "year", "month"),
    )


# 8️⃣ AIChatHistory Model
class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_history")


# 9️⃣ ExpenseRawMessage Model
class ExpenseRawMessage(Base):
    __tablename__ = "expense_raw_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    source: Mapped[CreatedVia] = mapped_column(
        SQLEnum(CreatedVia, name="created_via_type"),
        default=CreatedVia.TELEGRAM,
        nullable=False,
    )
    raw_message: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    status: Mapped[AIStatus] = mapped_column(
        SQLEnum(AIStatus, name="ai_status_type"),
        default=AIStatus.PENDING,
        nullable=False,
    )
    processing_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="raw_messages")

    # Table Constraints & Indexes
    __table_args__ = (
        Index("idx_expense_raw_messages_user_id_status", "user_id", "status"),
    )


# ==========================================
# 10️⃣ DiscordAccount Model
# ==========================================
class DiscordAccount(Base):
    __tablename__ = "discord_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    discord_user_id: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    discord_username: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="discord_account")


# ==========================================
# 11️⃣ SlackAccount Model
# ==========================================
class SlackAccount(Base):
    __tablename__ = "slack_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    slack_user_id: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    slack_team_id: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    slack_username: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="slack_account")


# ==========================================
# 12️⃣ LinkToken Model
# ==========================================
class LinkToken(Base):
    __tablename__ = "link_tokens"

    token: Mapped[str] = mapped_column(String(100), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="link_tokens")


# ==========================================
# 13️⃣ Account Model
# ==========================================
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="savings", nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="accounts")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="account")
    incomes: Mapped[List["Income"]] = relationship("Income", back_populates="account")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_accounts_user_name"),
    )


# ==========================================
# 14️⃣ Subcategory Model
# ==========================================
class Subcategory(Base):
    __tablename__ = "subcategories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="subcategories")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="subcategory")

    __table_args__ = (
        UniqueConstraint("category_id", "name", name="uq_subcategories_category_name"),
    )


# ==========================================
# 15️⃣ Tag Model
# ==========================================
class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tags")
    expenses: Mapped[List["Expense"]] = relationship("Expense", secondary=expense_tags, back_populates="tags")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_tags_user_name"),
    )


# ==========================================
# 16️⃣ Income Model
# ==========================================
class Income(Base):
    __tablename__ = "incomes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(5), default="INR", nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    income_date: Mapped[date] = mapped_column(SQLDate, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="incomes")
    account: Mapped[Optional["Account"]] = relationship("Account", back_populates="incomes")
