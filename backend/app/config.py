from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Smart Expense Tracker API"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "expense_tracker"

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # CORS (comma-separated list, or "*" to allow all origins)
    CORS_ORIGINS: str = "http://localhost:5173"

    # Google OAuth
    GOOGLE_CLIENT_ID: str | None = None

    # Email - SMTP (legacy)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_FROM_NAME: str = "Expense Tracker"
    
    # Email - Brevo
    BREVO_API_KEY: str | None = None
    BREVO_FROM_EMAIL: str | None = None
    BREVO_FROM_NAME: str = "Expense Tracker"


settings = Settings()
