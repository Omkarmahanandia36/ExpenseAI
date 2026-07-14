import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, Account
from app.schemas import AccountCreate, AccountResponse, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if duplicate account name for this user
    existing = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.name == payload.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this name already exists"
        )
        
    account = Account(
        user_id=current_user.id,
        name=payload.name,
        type=payload.type,
        balance=payload.balance
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.get("", response_model=List[AccountResponse])
def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Account).filter(Account.user_id == current_user.id).all()

@router.put("/{id}", response_model=AccountResponse)
def update_account(
    id: uuid.UUID,
    payload: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(Account).filter(
        Account.id == id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
        
    if payload.name is not None:
        # Check uniqueness
        dup = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name == payload.name,
            Account.id != id
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account with this name already exists"
            )
        account.name = payload.name
        
    if payload.type is not None:
        account.type = payload.type
        
    if payload.balance is not None:
        account.balance = payload.balance
        
    db.commit()
    db.refresh(account)
    return account

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(Account).filter(
        Account.id == id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
        
    db.delete(account)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
