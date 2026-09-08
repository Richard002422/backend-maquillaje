from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    internal_ai_token: str
    default_preview_base: str = "https://picsum.photos/seed"
    media_dir: str = "./media"
    media_base_url: str = "/media"

    # Gemini (coloración de cabello con IA generativa)
    gemini_api_key: str = ""
    gemini_image_model: str = "gemini-3.1-flash-image"


@lru_cache
def get_settings() -> Settings:
    return Settings()
