import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Attendance AI System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENV: str = os.getenv("ENV", "development")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    
    # Firebase Settings
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "smart-attendance-ai")
    
    # AI Biometric Thresholds
    FACE_MATCH_THRESHOLD: float = float(os.getenv("FACE_MATCH_THRESHOLD", "0.65"))
    MIN_MATCH_MARGIN: float = float(os.getenv("MIN_MATCH_MARGIN", "0.08"))
    REQUIRED_CONSECUTIVE_MATCHES: int = int(os.getenv("REQUIRED_CONSECUTIVE_MATCHES", "2"))
    LIVENESS_EAR_THRESHOLD: float = float(os.getenv("LIVENESS_EAR_THRESHOLD", "0.20"))
    LIVENESS_CONSECUTIVE_FRAMES: int = int(os.getenv("LIVENESS_CONSECUTIVE_FRAMES", "2"))
    MIN_FACE_SIZE: int = int(os.getenv("MIN_FACE_SIZE", "40"))

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
