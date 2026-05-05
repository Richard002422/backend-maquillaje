from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    user_id: str | None = None
    look: str | None = None
    cart_product_ids: list[str] = Field(default_factory=list)
    limit: int = Field(default=8, ge=1, le=24)


class RecommendationResponse(BaseModel):
    product_ids: list[str]


class TryOnResponse(BaseModel):
    preview_url: str
    mask_urls: dict[str, str]
    latency_ms: int
    note: str | None = None


class RealtimeFrameRequest(BaseModel):
    frame_base64: str = Field(min_length=20)
    look_id: str = Field(default="natural", min_length=1, max_length=64)


class RealtimeFrameResponse(BaseModel):
    frame_base64: str
    latency_ms: int
    fps_hint: float
