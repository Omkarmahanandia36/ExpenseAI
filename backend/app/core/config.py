import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "ExpenseAI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "super-secret-jwt-key-replace-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for MVP ease of use
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/expenseai"
    
    # External APIs
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
