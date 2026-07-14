import uuid
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, Budget, Expense, Category
from app.schemas import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify category exists
    cat = db.query(Category).filter(
        Category.id == payload.category_id,
        (Category.user_id == current_user.id) | (Category.user_id.is_(None))
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Calculate current spent amount for this category in the specified month/year
    spent = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.category_id == payload.category_id,
        Expense.deleted_at.is_(None),
        extract('month', Expense.expense_date) == payload.month,
        extract('year', Expense.expense_date) == payload.year
    ).scalar() or 0.0
    
    # Check if budget already exists for this category/month/year
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == payload.category_id,
        Budget.month == payload.month,
        Budget.year == payload.year
    ).first()
    
    if budget:
        budget.budget_amount = payload.budget_amount
        budget.spent_amount = float(spent)
    else:
        budget = Budget(
            user_id=current_user.id,
            category_id=payload.category_id,
            month=payload.month,
            year=payload.year,
            budget_amount=payload.budget_amount,
            spent_amount=float(spent)
        )
        db.add(budget)
        
    db.commit()
    db.refresh(budget)
    return budget

@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Recalculate spent amounts for all user budgets of the current month/year to keep them fresh
    today = date.today()
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    for b in budgets:
        spent = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            Expense.category_id == b.category_id,
            Expense.deleted_at.is_(None),
            extract('month', Expense.expense_date) == b.month,
            extract('year', Expense.expense_date) == b.year
        ).scalar() or 0.0
        b.spent_amount = float(spent)
    db.commit()
    return budgets

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(Budget).filter(
        Budget.id == id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
        
    db.delete(budget)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
