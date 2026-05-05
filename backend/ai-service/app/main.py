from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .routers import internal
from .config import get_settings

app = FastAPI(title="GlowLab AI Service", version="1.0.0")
settings = get_settings()
Path(settings.media_dir).mkdir(parents=True, exist_ok=True)

app.include_router(internal.router)
app.mount(settings.media_base_url, StaticFiles(directory=settings.media_dir), name="media")


@app.get("/health")
def health():
    return {"status": "ok", "service": "glowlab-ai"}
