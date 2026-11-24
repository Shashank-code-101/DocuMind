"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe, validated configuration.
"""
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE_PATH = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    
    # Database (PostgreSQL default, supports SQLite for local dev/testing without local DB server)
    DATABASE_URL: str = "sqlite:///./documind.db"
    
    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production-documind-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Gemini (Configurable via .env, default gemini-3.5-flash-lite)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    
    # Storage paths
    UPLOAD_DIR: str = "storage/uploads"
    CHROMA_DB_DIR: str = "storage/chroma_db"
    
    # File upload limits
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = "pdf"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"
    
    @property
    def resolved_upload_dir(self) -> str:
        p = Path(self.UPLOAD_DIR)
        if not p.is_absolute():
            return str((_BACKEND_DIR / p).resolve())
        return str(p.resolve())

    @property
    def resolved_chroma_dir(self) -> str:
        p = Path(self.CHROMA_DB_DIR)
        if not p.is_absolute():
            return str((_BACKEND_DIR / p).resolve())
        return str(p.resolve())

    @property
    def cors_origins_list(self) -> List[str]:
        return [
         origin.strip().rstrip("/")
          for origin in self.CORS_ORIGINS.split(",")
          if origin.strip()
    ]
    
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE_PATH) if _ENV_FILE_PATH.exists() else ".env",
        extra="ignore",
    )


# Singleton instance used throughout the app
settings = Settings()
