from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, Response, UploadFile, WebSocket, WebSocketDisconnect

from ..deps import verify_internal_token
from ..logic.recommendations import recommend
from ..schemas import (
    RecommendationRequest,
    RecommendationResponse,
    RealtimeFrameRequest,
    RealtimeFrameResponse,
    TryOnResponse,
)
from ..config import get_settings
from ..services.vision import process_realtime_frame, run_try_on_pipeline

router = APIRouter(prefix="/internal/v1", dependencies=[Depends(verify_internal_token)])


@router.post("/recommendations", response_model=RecommendationResponse)
def recommendations(
    body: RecommendationRequest,
    response: Response,
    x_request_id: Annotated[str | None, Header(alias="X-Request-Id")] = None,
):
    if x_request_id:
        response.headers["X-Request-Id"] = x_request_id
    ids = recommend(body.look, body.cart_product_ids, body.limit)
    return RecommendationResponse(product_ids=ids)


@router.post("/try-on", response_model=TryOnResponse)
async def try_on(
    response: Response,
    look_id: Annotated[str, Form()],
    user_id: Annotated[str, Form()],
    image: UploadFile = File(...),
    x_request_id: Annotated[str | None, Header(alias="X-Request-Id")] = None,
):
    if x_request_id:
        response.headers["X-Request-Id"] = x_request_id
    image_bytes = await image.read()
    settings = get_settings()
    artifacts = run_try_on_pipeline(
        image_bytes=image_bytes,
        look_id=look_id,
        user_id=user_id,
        media_dir=settings.media_dir,
        media_base_url=settings.media_base_url,
    )
    return TryOnResponse(
        preview_url=artifacts.preview_url,
        mask_urls=artifacts.mask_urls,
        latency_ms=artifacts.latency_ms,
        note=artifacts.note,
    )


@router.post("/realtime/process-frame", response_model=RealtimeFrameResponse)
def process_frame(
    body: RealtimeFrameRequest,
    response: Response,
    x_request_id: Annotated[str | None, Header(alias="X-Request-Id")] = None,
):
    if x_request_id:
        response.headers["X-Request-Id"] = x_request_id
    result = process_realtime_frame(body.frame_base64, body.look_id)
    return RealtimeFrameResponse(
        frame_base64=result.frame_base64,
        latency_ms=result.latency_ms,
        fps_hint=result.fps_hint,
    )


@router.websocket("/realtime/ws")
async def realtime_ws(websocket: WebSocket):
    token = websocket.headers.get("x-internal-token")
    settings = get_settings()
    if token != settings.internal_ai_token:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            frame_payload = RealtimeFrameRequest.model_validate(payload)
            result = process_realtime_frame(frame_payload.frame_base64, frame_payload.look_id)
            await websocket.send_json(
                {
                    "frame_base64": result.frame_base64,
                    "latency_ms": result.latency_ms,
                    "fps_hint": result.fps_hint,
                }
            )
    except WebSocketDisconnect:
        return
