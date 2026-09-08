from __future__ import annotations

import base64
import io
import time
from dataclasses import dataclass

from google import genai
from PIL import Image, ImageOps

from ..config import get_settings

# Paleta soportada por la función de coloración de cabello con IA.
# La clave es el id estable usado por API/cliente; "prompt" describe en
# inglés el resultado deseado (los modelos de imagen de Gemini siguen
# instrucciones en inglés de forma más consistente).
HAIR_COLORS: dict[str, dict[str, str]] = {
    "rubio-platino": {"label": "Rubio platino", "prompt": "a bright platinum blonde"},
    "rubio-dorado": {"label": "Rubio dorado", "prompt": "a warm golden blonde"},
    "castano-claro": {"label": "Castaño claro", "prompt": "a light chestnut brown"},
    "castano-chocolate": {"label": "Castaño chocolate", "prompt": "a rich chocolate brown"},
    "negro-azabache": {"label": "Negro azabache", "prompt": "a deep jet black"},
    "pelirrojo-cobrizo": {"label": "Pelirrojo cobrizo", "prompt": "a vivid copper red"},
    "caoba": {"label": "Caoba", "prompt": "a deep mahogany red-brown"},
    "rosa-pastel": {"label": "Rosa pastel", "prompt": "a soft pastel pink (fantasy color)"},
    "azul-noche": {"label": "Azul noche", "prompt": "a deep midnight blue (fantasy color)"},
    "gris-plata": {"label": "Gris plata", "prompt": "a cool silver gray"},
}


class HairColorError(RuntimeError):
    """Fallo al generar la coloración de cabello (config, red o respuesta del modelo)."""


@dataclass
class HairColorArtifact:
    image_data_url: str
    color_id: str
    color_label: str
    latency_ms: int
    note: str


def recolor_hair(image_bytes: bytes, color_id: str) -> HairColorArtifact:
    color = HAIR_COLORS.get(color_id)
    if color is None:
        raise HairColorError(f"color_id desconocido: {color_id}")

    settings = get_settings()
    if not settings.gemini_api_key:
        raise HairColorError("GEMINI_API_KEY no configurada en el servicio de IA")

    t0 = time.perf_counter()
    png_bytes = _to_png_bytes(image_bytes)

    prompt = (
        "Edit this photo of a person: recolor ONLY their hair to "
        f"{color['prompt']}. Keep the same person, face, skin tone, "
        "background, lighting, pose and hairstyle exactly as in the "
        "original photo — change nothing except the hair color. "
        "Make the result photorealistic."
    )

    client = genai.Client(api_key=settings.gemini_api_key)
    try:
        interaction = client.interactions.create(
            model=settings.gemini_image_model,
            input=[
                {"type": "text", "text": prompt},
                {
                    "type": "image",
                    "data": base64.b64encode(png_bytes).decode("utf-8"),
                    "mime_type": "image/png",
                },
            ],
        )
    except Exception as exc:  # errores de red/autenticación/cuota de Gemini
        raise HairColorError(f"Gemini no respondió: {exc}") from exc

    output_image = getattr(interaction, "output_image", None)
    image_b64 = getattr(output_image, "data", None) if output_image else None
    if not image_b64:
        raise HairColorError("Gemini no devolvió una imagen (posible bloqueo de seguridad del modelo)")

    mime_type = getattr(output_image, "mime_type", None) or "image/png"
    latency_ms = max(1, int((time.perf_counter() - t0) * 1000))

    return HairColorArtifact(
        image_data_url=f"data:{mime_type};base64,{image_b64}",
        color_id=color_id,
        color_label=color["label"],
        latency_ms=latency_ms,
        note="Generado con Gemini. La imagen no se almacena en el servidor.",
    )


def _to_png_bytes(image_bytes: bytes) -> bytes:
    """Normaliza a PNG y corrige orientación EXIF antes de enviar a Gemini."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        normalized = ImageOps.exif_transpose(img.convert("RGB"))
        buf = io.BytesIO()
        normalized.save(buf, format="PNG")
        return buf.getvalue()
