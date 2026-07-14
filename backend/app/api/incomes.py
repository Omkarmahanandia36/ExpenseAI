import uuid
from typing import List
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, Income, Account
from app.schemas import IncomeCreate, IncomeResponse, IncomeUpdate

router = APIRouter(prefix="/incomes", tags=["incomes"])

@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    payload: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account if provided
    if payload.account_id:
        account = db.query(Account).filter(
            Account.id == payload.account_id,
            Account.user_id == current_user.id
        ).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        # Update account balance: add income amount
        account.balance += Decimal(str(payload.amount))
        
    income = Income(
        user_id=current_user.id,
        amount=payload.amount,
        currency=payload.currency,
        category=payload.category,
        account_id=payload.account_id,
        description=payload.description,
        income_date=payload.income_date
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income

@router.get("", response_model=List[IncomeResponse])
def list_incomes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Income).filter(Income.user_id == current_user.id).order_by(Income.income_date.desc()).all()

@router.put("/{id}", response_model=IncomeResponse)
def update_income(
    id: uuid.UUID,
    payload: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(Income).filter(
        Income.id == id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income log not found"
        )
        
    # Revert account balance adjustment from old amount if account changes or amount changes
    old_account_id = income.account_id
    old_amount = income.amount
    
    if payload.amount is not None:
        income.amount = payload.amount
    if payload.currency is not None:
        income.currency = payload.currency
    if payload.category is not None:
        income.category = payload.category
    if payload.description is not None:
        income.description = payload.description
    if payload.income_date is not None:
        income.income_date = payload.income_date
        
    # Account adjustment logic
    if payload.account_id is not None or payload.amount is not None:
        new_account_id = payload.account_id if payload.account_id is not None else old_account_id
        new_amount = payload.amount if payload.amount is not None else old_amount
        
        # Revert old account balance
        if old_account_id:
            old_acc = db.query(Account).filter(Account.id == old_account_id, Account.user_id == current_user.id).first()
            if old_acc:
                old_acc.balance -= Decimal(str(old_amount))
                
        # Apply new account balance
        if new_account_id:
            new_acc = db.query(Account).filter(Account.id == new_account_id, Account.user_id == current_user.id).first()
            if not new_acc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="New account not found"
                )
            new_acc.balance += Decimal(str(new_amount))
            
        income.account_id = new_account_id

    db.commit()
    db.refresh(income)
    return income

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(Income).filter(
        Income.id == id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income log not found"
        )
        
    # Revert account balance adjustment
    if income.account_id:
        acc = db.query(Account).filter(Account.id == income.account_id, Account.user_id == current_user.id).first()
        if acc:
            acc.balance -= Decimal(str(income.amount))
            
    db.delete(income)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
