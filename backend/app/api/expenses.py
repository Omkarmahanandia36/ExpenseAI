from datetime import date, datetime, timezone, time as datetime_time
from decimal import Decimal
import time
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import (
    User,
    Expense,
    Category,
    Subcategory,
    Account,
    Tag,
    ExpenseRawMessage,
    CreatedVia,
    AIStatus,
    PaymentMethod,
)
from app.schemas import ExpenseResponse, ExpenseParseRequest, ExpenseCreate, ExpenseUpdate
from app.services.ai import AIParserService

router = APIRouter(prefix="/expenses", tags=["expenses"])


def match_or_create_category(db: Session, user_id: uuid.UUID, category_name: Optional[str]) -> uuid.UUID:
    """
    Looks for a case-insensitive match for category_name.
    If not found, creates a new custom category for the user.
    """
    if not category_name:
        category_name = "Other"
        
    # Look for case-insensitive match in user's categories or default categories (where user_id is None)
    category = db.query(Category).filter(
        func.lower(Category.name) == category_name.lower(),
        (Category.user_id == user_id) | (Category.user_id.is_(None))
    ).first()
    
    if category:
        return category.id
        
    # If not found, create a new custom category for the user
    new_category = Category(
        user_id=user_id,
        name=category_name,
        is_default=False
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category.id


def create_expense_instance(db: Session, user: User, parsed_data: dict, source: CreatedVia) -> Expense:
    amount = parsed_data.get("amount")
    if amount is None or amount <= 0:
        raise ValueError("Amount must be a positive number")
        
    currency = parsed_data.get("currency", "INR").upper()
    merchant = parsed_data.get("merchant")
    category_name = parsed_data.get("category")
    payment_method_str = parsed_data.get("payment_method", "cash").lower()
    
    # Resolve PaymentMethod Enum
    try:
        payment_method = PaymentMethod(payment_method_str)
    except ValueError:
        payment_method = PaymentMethod.OTHER
        
    # Parse date
    date_str = parsed_data.get("date")
    expense_date = date.today()
    if date_str:
        try:
            expense_date = date.fromisoformat(date_str)
        except ValueError:
            pass
            
    # Resolve category
    category_id = match_or_create_category(db, user.id, category_name)
    
    # Resolve subcategory
    subcategory_id = None
    subcategory_name = parsed_data.get("subcategory")
    if subcategory_name:
        subcat = db.query(Subcategory).filter(
            Subcategory.category_id == category_id,
            func.lower(Subcategory.name) == subcategory_name.lower()
        ).first()
        if not subcat:
            subcat = Subcategory(category_id=category_id, name=subcategory_name)
            db.add(subcat)
            db.flush()
        subcategory_id = subcat.id
        
    # Resolve account
    account_id = None
    account_name = parsed_data.get("account")
    if account_name:
        acc = db.query(Account).filter(
            Account.user_id == user.id,
            func.lower(Account.name) == account_name.lower()
        ).first()
        if not acc:
            acc = Account(user_id=user.id, name=account_name, type="savings", balance=0.0)
            db.add(acc)
            db.flush()
        account_id = acc.id
        acc.balance -= Decimal(str(amount))
        
    # Resolve transaction time
    time_str = parsed_data.get("transaction_time")
    parsed_time = None
    if time_str:
        if isinstance(time_str, str):
            try:
                # support HH:MM:SS or HH:MM formats
                parsed_time = datetime_time.fromisoformat(time_str)
            except ValueError:
                pass
        elif isinstance(time_str, datetime_time):
            parsed_time = time_str
            
    # Resolve tags
    tags_list = parsed_data.get("tags", [])
    if isinstance(tags_list, str):
        tags_list = [t.strip() for t in tags_list.split(",") if t.strip()]
    expense_tags_to_add = []
    for tag_name in tags_list:
        tag = db.query(Tag).filter(
            Tag.user_id == user.id,
            func.lower(Tag.name) == tag_name.lower()
        ).first()
        if not tag:
            tag = Tag(user_id=user.id, name=tag_name)
            db.add(tag)
            db.flush()
        expense_tags_to_add.append(tag)
        
    is_recurring = parsed_data.get("is_recurring", False)
    if isinstance(is_recurring, str):
        is_recurring = is_recurring.lower() in ("yes", "true", "1")
        
    expense = Expense(
        user_id=user.id,
        category_id=category_id,
        subcategory_id=subcategory_id,
        account_id=account_id,
        amount=amount,
        currency=currency,
        merchant=merchant,
        description=parsed_data.get("description"),
        payment_method=payment_method,
        location=parsed_data.get("location"),
        is_recurring=is_recurring,
        transaction_time=parsed_time,
        receipt_url=parsed_data.get("receipt_url"),
        expense_date=expense_date,
        created_via=source,
        ai_confidence=parsed_data.get("confidence", 0.0),
        tags=expense_tags_to_add
    )
    db.add(expense)
    db.flush()
    return expense


@router.post("/parse", response_model=ExpenseResponse)
async def parse_and_create_expense(
    payload: ExpenseParseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses a raw natural language message using AI, maps/creates the category,
    saves the expense, and logs the raw message request.
    """
    start_time = time.time()
    
    try:
        parsed_data = await AIParserService.parse_with_ai(payload.raw_message)
    except Exception as exc:
        # Save failed raw message log
        raw_msg_log = ExpenseRawMessage(
            user_id=current_user.id,
            source=payload.source,
            raw_message=payload.raw_message,
            status=AIStatus.FAILED,
            processing_time=int((time.time() - start_time) * 1000)
        )
        db.add(raw_msg_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse expense message: {str(exc)}"
        )
        
    try:
        # Create Expense using the helper
        expense = create_expense_instance(db, current_user, parsed_data, payload.source)
        
        # Save parsed raw message log
        raw_msg_log = ExpenseRawMessage(
            user_id=current_user.id,
            source=payload.source,
            raw_message=payload.raw_message,
            parsed_json=parsed_data,
            status=AIStatus.PARSED,
            processing_time=int((time.time() - start_time) * 1000)
        )
        db.add(raw_msg_log)
        
        db.commit()
        db.refresh(expense)
        return expense
        
    except Exception as exc:
        db.rollback()
        # Save failed raw message log
        raw_msg_log = ExpenseRawMessage(
            user_id=current_user.id,
            source=payload.source,
            raw_message=payload.raw_message,
            status=AIStatus.FAILED,
            processing_time=int((time.time() - start_time) * 1000)
        )
        db.add(raw_msg_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error saving parsed expense: {str(exc)}"
        )


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually creates an expense transaction.
    """
    # Check category
    category = db.query(Category).filter(
        Category.id == payload.category_id,
        (Category.user_id == current_user.id) | (Category.user_id.is_(None))
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check subcategory
    if payload.subcategory_id:
        subcat = db.query(Subcategory).filter(
            Subcategory.id == payload.subcategory_id,
            Subcategory.category_id == payload.category_id
        ).first()
        if not subcat:
            raise HTTPException(status_code=404, detail="Subcategory not found")
            
    # Check account
    if payload.account_id:
        acc = db.query(Account).filter(
            Account.id == payload.account_id,
            Account.user_id == current_user.id
        ).first()
        if not acc:
            raise HTTPException(status_code=404, detail="Account not found")
        acc.balance -= Decimal(str(payload.amount))
        
    expense = Expense(
        user_id=current_user.id,
        category_id=payload.category_id,
        subcategory_id=payload.subcategory_id,
        account_id=payload.account_id,
        amount=payload.amount,
        currency=payload.currency,
        merchant=payload.merchant,
        description=payload.description,
        payment_method=payload.payment_method,
        location=payload.location,
        is_recurring=payload.is_recurring,
        transaction_time=payload.transaction_time,
        receipt_url=payload.receipt_url,
        expense_date=payload.expense_date,
        created_via=payload.created_via
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=List[ExpenseResponse])
def get_user_expenses(
    category_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of active expenses for the user with optional filters.
    """
    query = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None)
    )
    
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
        
    query = query.order_by(Expense.expense_date.desc(), Expense.created_at.desc())
    return query.all()


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft deletes an expense transaction. Reverts account balance.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None)
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found or already deleted"
        )
        
    # Revert account balance adjustment
    if expense.account_id:
        acc = db.query(Account).filter(
            Account.id == expense.account_id,
            Account.user_id == current_user.id
        ).first()
        if acc:
            acc.balance += Decimal(str(expense.amount))
            
    expense.deleted_at = func.now()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
