from __future__ import annotations

import base64
import io
import time
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


@dataclass
class TryOnArtifacts:
    preview_url: str
    mask_urls: dict[str, str]
    latency_ms: int
    note: str


@dataclass
class RealtimeFrameResult:
    frame_base64: str
    latency_ms: int
    fps_hint: float


def run_try_on_pipeline(
    image_bytes: bytes,
    look_id: str,
    user_id: str,
    media_dir: str,
    media_base_url: str,
) -> TryOnArtifacts:
    t0 = time.perf_counter()
    base = _load_image(image_bytes)

    # Demo pipeline: suavizado + ajuste de color para simular look.
    processed = _apply_look_filter(base, look_id)
    lips_mask, eyes_mask = _create_demo_masks(base.size)

    session_id = f"{_slug(user_id)}-{_slug(look_id)}-{uuid4().hex[:8]}"
    out_dir = Path(media_dir).resolve() / "tryon" / session_id
    out_dir.mkdir(parents=True, exist_ok=True)

    preview_path = out_dir / "preview.jpg"
    lips_mask_path = out_dir / "mask-lips.png"
    eyes_mask_path = out_dir / "mask-eyes.png"

    processed.save(preview_path, format="JPEG", quality=92, optimize=True)
    lips_mask.save(lips_mask_path, format="PNG", optimize=True)
    eyes_mask.save(eyes_mask_path, format="PNG", optimize=True)

    latency_ms = max(1, int((time.perf_counter() - t0) * 1000))
    base_url = media_base_url.rstrip("/")
    return TryOnArtifacts(
        preview_url=f"{base_url}/tryon/{session_id}/preview.jpg",
        mask_urls={
            "lips": f"{base_url}/tryon/{session_id}/mask-lips.png",
            "eyes": f"{base_url}/tryon/{session_id}/mask-eyes.png",
        },
        latency_ms=latency_ms,
        note="Pipeline CV demo aplicado (filtro + mascaras sinteticas).",
    )


def process_realtime_frame(frame_base64: str, look_id: str) -> RealtimeFrameResult:
    t0 = time.perf_counter()
    image_bytes = _decode_base64_image(frame_base64)
    img = _load_image(image_bytes)
    processed = _apply_look_filter(img, look_id)
    output_b64 = _encode_base64_jpeg(processed)
    latency_ms = max(1, int((time.perf_counter() - t0) * 1000))
    fps_hint = round(1000.0 / latency_ms, 2)
    return RealtimeFrameResult(frame_base64=output_b64, latency_ms=latency_ms, fps_hint=fps_hint)


def _load_image(image_bytes: bytes) -> Image.Image:
    with Image.open(io.BytesIO(image_bytes)) as img:
        return ImageOps.exif_transpose(img.convert("RGB"))


def _apply_look_filter(img: Image.Image, look_id: str) -> Image.Image:
    look = look_id.strip().lower()
    out = img.copy()

    if look in {"clean-girl", "natural"}:
        out = ImageEnhance.Brightness(out).enhance(1.06)
        out = ImageEnhance.Color(out).enhance(1.08)
    elif look in {"soft-glam", "glam"}:
        out = ImageEnhance.Contrast(out).enhance(1.15)
        out = ImageEnhance.Color(out).enhance(1.2)
        out = out.filter(ImageFilter.GaussianBlur(radius=0.35))
    elif look in {"editorial"}:
        out = ImageEnhance.Contrast(out).enhance(1.22)
        out = ImageEnhance.Sharpness(out).enhance(1.15)
    elif look in {"fiesta"}:
        out = ImageEnhance.Color(out).enhance(1.28)
        out = ImageEnhance.Contrast(out).enhance(1.1)
    else:
        out = ImageEnhance.Color(out).enhance(1.04)

    return out


def _create_demo_masks(size: tuple[int, int]) -> tuple[Image.Image, Image.Image]:
    w, h = size
    lips = Image.new("RGBA", size, (0, 0, 0, 0))
    eyes = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_lips = ImageDraw.Draw(lips)
    draw_eyes = ImageDraw.Draw(eyes)

    lips_box = [int(w * 0.36), int(h * 0.66), int(w * 0.64), int(h * 0.74)]
    left_eye = [int(w * 0.27), int(h * 0.39), int(w * 0.43), int(h * 0.47)]
    right_eye = [int(w * 0.57), int(h * 0.39), int(w * 0.73), int(h * 0.47)]

    draw_lips.ellipse(lips_box, fill=(230, 60, 95, 120))
    draw_eyes.ellipse(left_eye, fill=(90, 40, 180, 110))
    draw_eyes.ellipse(right_eye, fill=(90, 40, 180, 110))
    return lips, eyes


def _decode_base64_image(payload: str) -> bytes:
    raw = payload.split(",", 1)[-1]
    return base64.b64decode(raw.encode("utf-8"))


def _encode_base64_jpeg(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82, optimize=True)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def _slug(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum() or ch in {"-", "_"}).strip("-_") or "user"
