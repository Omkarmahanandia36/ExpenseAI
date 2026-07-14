from datetime import datetime, timedelta, timezone
from typing import List
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
    verify_refresh_token,
)
from app.api.deps import get_current_user
from app.models import (
    User,
    UserSettings,
    UserSession,
    TelegramAccount,
    DiscordAccount,
    SlackAccount,
    LinkToken,
)
from app.schemas import (
    UserCreate,
    UserResponse,
    Token,
    LoginRequest,
    RefreshTokenRequest,
    LogoutRequest,
    LinkTokenCreate,
    LinkTokenResponse,
    LinkRedeemRequest,
    ConnectedAccountInfo,
    UnlinkAccountRequest,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


def create_session_for_user(
    db: Session,
    user_id: uuid.UUID,
    request: Request
) -> dict:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(subject=user_id)
    refresh_token_hash = hash_token(refresh_token)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    # Extract request client info
    ip_address = request.client.host if request.client else None
    device_name = request.headers.get("user-agent", "Unknown")
    
    session = UserSession(
        user_id=user_id,
        device_name=device_name[:100],  # Truncate to match DB column size
        ip_address=ip_address,
        refresh_token_hash=refresh_token_hash,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_in.password)
    user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        password_hash=hashed_password,
        email_verified=False
    )
    
    db.add(user)
    db.flush()  # Generate user ID for FK referencing
    
    # Create default settings for user
    default_settings = UserSettings(
        user_id=user.id,
        currency="USD",
        timezone="UTC",
        language="en"
    )
    db.add(default_settings)
    
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Retrieve user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
    
    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended."
        )
    
    return create_session_for_user(db=db, user_id=user.id, request=request)


@router.post("/login/json", response_model=Token)
def login_json_access_token(
    request: Request,
    login_in: LoginRequest,
    db: Session = Depends(get_db)
):
    # Retrieve user by email
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
    
    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended."
        )
    
    return create_session_for_user(db=db, user_id=user.id, request=request)


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_in: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = verify_refresh_token(refresh_in.refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    token_hash = hash_token(refresh_in.refresh_token)
    session = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found or already invalidated"
        )
        
    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
        
    # Generate new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    
    # Rotate refresh token
    new_refresh_token = create_refresh_token(subject=user_id)
    new_token_hash = hash_token(new_refresh_token)
    
    # Update existing session
    session.refresh_token_hash = new_token_hash
    session.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    session.last_seen_at = func.now()
    session.ip_address = request.client.host if request.client else None
    session.device_name = request.headers.get("user-agent", "Unknown")[:100]
    
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    logout_in: LogoutRequest,
    db: Session = Depends(get_db)
):
    token_hash = hash_token(logout_in.refresh_token)
    session = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).first()
    if session:
        db.delete(session)
        db.commit()
    return


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/link/token", response_model=LinkTokenResponse)
def generate_link_token(
    token_in: LinkTokenCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    platform = token_in.platform.lower()
    if platform not in ["telegram", "discord", "slack"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported platform. Choose telegram, discord, or slack."
        )
        
    while True:
        token = secrets.token_hex(3).upper()  # 6-character uppercase token
        existing = db.query(LinkToken).filter(LinkToken.token == token).first()
        if not existing:
            break
            
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    link_token = LinkToken(
        token=token,
        user_id=current_user.id,
        platform=platform,
        expires_at=expires_at
    )
    db.add(link_token)
    db.commit()
    db.refresh(link_token)
    return link_token


@router.post("/link/redeem")
def redeem_link_token(
    redeem_in: LinkRedeemRequest,
    db: Session = Depends(get_db)
):
    link_token = db.query(LinkToken).filter(LinkToken.token == redeem_in.token.upper()).first()
    if not link_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linking code not found or invalid"
        )
        
    if link_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.delete(link_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Linking code has expired"
        )
        
    if link_token.platform != redeem_in.platform.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Linking code platform mismatch"
        )
        
    user_id = link_token.user_id
    platform = link_token.platform
    
    if platform == "telegram":
        try:
            tg_user_id = int(redeem_in.platform_user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telegram user ID must be numeric"
            )
            
        existing_link = db.query(TelegramAccount).filter(TelegramAccount.telegram_user_id == tg_user_id).first()
        if existing_link:
            db.delete(existing_link)
            db.flush()
            
        telegram_account = TelegramAccount(
            user_id=user_id,
            telegram_user_id=tg_user_id,
            telegram_username=redeem_in.username,
            telegram_first_name=redeem_in.display_name or redeem_in.username,
            chat_id=tg_user_id,
            bot_started=True
        )
        db.add(telegram_account)
        
    elif platform == "discord":
        existing_link = db.query(DiscordAccount).filter(DiscordAccount.discord_user_id == redeem_in.platform_user_id).first()
        if existing_link:
            db.delete(existing_link)
            db.flush()
            
        discord_account = DiscordAccount(
            user_id=user_id,
            discord_user_id=redeem_in.platform_user_id,
            discord_username=redeem_in.username
        )
        db.add(discord_account)
        
    elif platform == "slack":
        if not redeem_in.team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="team_id is required for Slack linking"
            )
            
        existing_link = db.query(SlackAccount).filter(
            SlackAccount.slack_user_id == redeem_in.platform_user_id
        ).first()
        if existing_link:
            db.delete(existing_link)
            db.flush()
            
        slack_account = SlackAccount(
            user_id=user_id,
            slack_user_id=redeem_in.platform_user_id,
            slack_team_id=redeem_in.team_id,
            slack_username=redeem_in.username
        )
        db.add(slack_account)
        
    db.delete(link_token)
    db.commit()
    
    return {"status": "success", "message": f"Successfully linked {platform} account"}


@router.get("/link/accounts", response_model=List[ConnectedAccountInfo])
def get_connected_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = []
    
    if current_user.telegram_account:
        accounts.append({
            "platform": "telegram",
            "platform_user_id": str(current_user.telegram_account.telegram_user_id),
            "username": current_user.telegram_account.telegram_username,
            "linked_at": current_user.telegram_account.linked_at,
            "is_active": current_user.telegram_account.is_active
        })
        
    if current_user.discord_account:
        accounts.append({
            "platform": "discord",
            "platform_user_id": current_user.discord_account.discord_user_id,
            "username": current_user.discord_account.discord_username,
            "linked_at": current_user.discord_account.linked_at,
            "is_active": current_user.discord_account.is_active
        })
        
    if current_user.slack_account:
        accounts.append({
            "platform": "slack",
            "platform_user_id": current_user.slack_account.slack_user_id,
            "username": current_user.slack_account.slack_username,
            "linked_at": current_user.slack_account.linked_at,
            "is_active": current_user.slack_account.is_active
        })
        
    return accounts


@router.post("/link/unlink")
def unlink_account(
    unlink_in: UnlinkAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    platform = unlink_in.platform.lower()
    
    if platform == "telegram":
        if current_user.telegram_account:
            db.delete(current_user.telegram_account)
        else:
            raise HTTPException(status_code=404, detail="Telegram account not linked")
            
    elif platform == "discord":
        if current_user.discord_account:
            db.delete(current_user.discord_account)
        else:
            raise HTTPException(status_code=404, detail="Discord account not linked")
            
    elif platform == "slack":
        if current_user.slack_account:
            db.delete(current_user.slack_account)
        else:
            raise HTTPException(status_code=404, detail="Slack account not linked")
            
    else:
        raise HTTPException(status_code=400, detail="Invalid platform")
        
    db.commit()
    return {"status": "success", "message": f"Successfully unlinked {platform} account"}
