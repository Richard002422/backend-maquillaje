from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    internal_ai_token: str
    default_preview_base: str = "https://picsum.photos/seed"
    media_dir: str = "./media"
    media_base_url: str = "/media"


@lru_cache
def get_settings() -> Settings:
    return Settings()
