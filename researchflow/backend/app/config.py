from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ResearchFlow API"

    # --- Database ---
    database_url: str = "mongodb://127.0.0.1:27017/researchflow"

    # --- Auth ---
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_expire_minutes: int = 60 * 24
    otp_length: int = 6
    otp_ttl_minutes: int = 5
    otp_max_attempts: int = 3

    # --- Default admin ---
    admin_email: str = "santhosh070306@gmail.com"
    admin_password: str = "admin123"

    # --- CORS ---
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Frontend (used to build links in outgoing emails) ---
    app_url: str = "http://localhost:5173"

    # --- Email (SMTP) ---
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "ResearchFlow <no-reply@researchflow.app>"
    # When true (development), OTP codes are also returned in the API response
    # and logged to the console. Disable in production.
    otp_debug: bool = True

    # --- Google OAuth ---
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect: str = "http://localhost:8000/api/auth/google/callback"

    # --- AI ---
    ai_provider: str = "ollama"  # ollama | openai | anthropic | google | xai
    ollama_base_url: str = "http://localhost:11434"
    ai_model: str = "qwen3:4b"
    ai_timeout: float = 90.0
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    anthropic_api_key: str = ""
    google_api_key: str = ""
    xai_api_key: str = ""

    # --- Storage ---
    storage_backend: str = "local"  # local | s3
    storage_dir: str = "./storage"
    storage_total_gb: float = 50.0  # quota shown in admin settings / analytics
    s3_endpoint: str = ""
    s3_bucket: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    public_base_url: str = "http://localhost:8000"

    # --- Push (VAPID) ---
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_claims_email: str = "mailto:admin@researchflow.app"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
