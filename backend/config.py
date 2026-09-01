"""환경 설정. 값은 backend/.env 에서 읽는다 (3단계 §5, §7)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./tacticore.db"
    cors_origins: str = "http://localhost:5173"  # 콤마 구분
    app_version: str = "1.0.0"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
