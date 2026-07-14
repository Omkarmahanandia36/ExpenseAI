from datetime import date, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, Expense, Income, Category, Budget

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/dashboard")
def get_dashboard_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Cash Flow (Total Income vs Total Expenses)
    total_income = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id
    ).scalar() or 0.0
    
    total_expense = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None)
    ).scalar() or 0.0
    
    savings = float(total_income) - float(total_expense)
    savings_rate = (savings / float(total_income) * 100) if total_income > 0 else 0.0

    # 2. Spending by Category
    category_spending = db.query(
        Category.name,
        Category.icon,
        Category.color,
        func.sum(Expense.amount).label("total")
    ).join(
        Category, Expense.category_id == Category.id
    ).filter(
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None)
    ).group_by(
        Category.name, Category.icon, Category.color
    ).all()
    
    category_breakdown = [
        {
            "name": row[0],
            "icon": row[1] or "📦",
            "color": row[2] or "#808080",
            "total": float(row[3])
        } for row in category_spending
    ]

    # 3. Spending by Payment Method
    payment_spending = db.query(
        Expense.payment_method,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None)
    ).group_by(
        Expense.payment_method
    ).all()
    
    payment_breakdown = [
        {
            "method": row[0].value,
            "total": float(row[1])
        } for row in payment_spending
    ]

    # 4. Daily Spending Trend (Last 30 days)
    start_date = date.today() - timedelta(days=30)
    daily_spending = db.query(
        Expense.expense_date,
        func.sum(Expense.amount)
    ).filter(
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None),
        Expense.expense_date >= start_date
    ).group_by(
        Expense.expense_date
    ).order_by(
        Expense.expense_date.asc()
    ).all()
    
    # Fill in missing dates to prevent chart gaps
    daily_map = {row[0].strftime("%Y-%m-%d"): float(row[1]) for row in daily_spending}
    daily_trend = []
    for i in range(31):
        day_str = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_trend.append({
            "date": day_str,
            "amount": daily_map.get(day_str, 0.0)
        })

    # 5. Top Merchants
    top_merchants_query = db.query(
        Expense.merchant,
        func.sum(Expense.amount)
    ).filter(
        Expense.user_id == current_user.id,
        Expense.deleted_at.is_(None),
        Expense.merchant.isnot(None)
    ).group_by(
        Expense.merchant
    ).order_by(
        func.sum(Expense.amount).desc()
    ).limit(5).all()
    
    top_merchants = [
        {
            "merchant": row[0],
            "total": float(row[1])
        } for row in top_merchants_query
    ]

    # 6. Budget vs Actual (Current Month)
    today = date.today()
    current_budgets = db.query(
        Category.name,
        Category.icon,
        Budget.budget_amount,
        Budget.spent_amount
    ).join(
        Category, Budget.category_id == Category.id
    ).filter(
        Budget.user_id == current_user.id,
        Budget.month == today.month,
        Budget.year == today.year
    ).all()
    
    budget_vs_actual = [
        {
            "category": row[0],
            "icon": row[1] or "📦",
            "budget": float(row[2]),
            "actual": float(row[3])
        } for row in current_budgets
    ]

    return {
        "cash_flow": {
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "net_savings": savings,
            "savings_rate": savings_rate
        },
        "category_breakdown": category_breakdown,
        "payment_breakdown": payment_breakdown,
        "daily_trend": daily_trend,
        "top_merchants": top_merchants,
        "budget_vs_actual": budget_vs_actual
    }
