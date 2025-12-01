from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres.ftroakglntgkyyaunuln:pQFDoHLfzgnheGsk@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres")
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    upload_dir: str = "uploads/"
    EMAIL_HOST: Optional[str] = os.getenv("EMAIL_HOST")
    EMAIL_PORT: Optional[int] = int(os.getenv("EMAIL_PORT", "587")) if os.getenv("EMAIL_PORT") else None
    EMAIL_USER: Optional[str] = os.getenv("EMAIL_USER")
    EMAIL_PASS: Optional[str] = os.getenv("EMAIL_PASS")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()