from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_db_url(url: str) -> str:
    """Render provides postgres:// which psycopg3 needs as postgresql+psycopg://."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+" not in url.split("://")[0]:
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite:///./finance_app.db"
    auto_create_tables: bool = True

    security_headers_enabled: bool = True
    trusted_hosts: list[str] = ["*"]
    jwt_secret: str = "change_me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    technical_access_pin: str = "0812"
    technical_access_max_attempts: int = 3
    technical_access_block_seconds: int = 30

    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_env: str = "sandbox"
    plaid_redirect_uri: str = ""

    belvo_secret_id: str = ""
    belvo_secret_password: str = ""
    belvo_base_url: str = "https://sandbox.belvo.com"
    open_banking_provider: str = "plaid"

    encryption_key: str = "change_me_32_characters_minimum"
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost", "capacitor://localhost"]

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        object.__setattr__(self, "database_url", _normalize_db_url(self.database_url))


settings = Settings()
