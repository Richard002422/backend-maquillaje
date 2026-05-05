"""Motor de recomendación (reglas + puntuación).

Sustituir o combinar con embeddings, modelos de ranking o LLM acotado en producción.
"""

LOOK_WEIGHTS = {
    "natural": {"luminosidad": 3, "hidratación": 2, "fresco": 2, "cobertura media": 1},
    "minimal": {"fresco": 3, "difuminable": 2, "vegano": 1},
    "fiesta": {"pigmento": 3, "waterproof": 2, "mate": 1},
    "editorial": {"editorial": 4, "brillo": 2, "precisión": 1},
    "soft-glam": {"larga duración": 2, "mate": 2, "brillo": 1},
}

CATALOG = [
    {
        "id": "serum-brillo",
        "category": "Skincare",
        "tags": ["luminosidad", "hidratación", "vegano"],
        "discount": 15,
        "has_pitch": True,
    },
    {
        "id": "base-hd",
        "category": "Rostro",
        "tags": ["cobertura media", "larga duración"],
        "discount": 20,
        "has_pitch": True,
    },
    {
        "id": "paleta-atardecer",
        "category": "Ojos",
        "tags": ["sombras", "fiesta", "pigmento"],
        "discount": None,
        "has_pitch": True,
    },
    {
        "id": "labial-velvet",
        "category": "Labios",
        "tags": ["mate", "cómodo"],
        "discount": None,
        "has_pitch": True,
    },
    {
        "id": "iluminador",
        "category": "Rostro",
        "tags": ["brillo", "editorial"],
        "discount": None,
        "has_pitch": True,
    },
    {
        "id": "delineador",
        "category": "Ojos",
        "tags": ["precisión", "waterproof"],
        "discount": None,
        "has_pitch": False,
    },
    {
        "id": "mascara",
        "category": "Ojos",
        "tags": ["pestañas", "lifting"],
        "discount": 10,
        "has_pitch": False,
    },
    {
        "id": "rubor-crema",
        "category": "Rostro",
        "tags": ["fresco", "difuminable"],
        "discount": None,
        "has_pitch": True,
    },
]


def score_product(p: dict, look: str | None, cart: set[str]) -> int:
    s = 0
    tags = [t.lower() for t in p["tags"]]
    if p.get("has_pitch"):
        s += 2
    if look == "natural" and any("lumin" in t for t in tags):
        s += 3
    if look == "minimal" and any("natural" in t or "fresco" in t for t in tags):
        s += 2
    if look == "fiesta" and p["category"] == "Ojos":
        s += 3
    if look == "editorial" and "editorial" in tags:
        s += 3
    if look in LOOK_WEIGHTS:
        for tag, weight in LOOK_WEIGHTS[look].items():
            if any(tag in t for t in tags):
                s += weight
    if p["id"] in cart:
        s -= 5
    if p.get("discount"):
        s += 1
    return s


def recommend(look: str | None, cart_product_ids: list[str], limit: int) -> list[str]:
    cart = set(cart_product_ids)
    ranked = sorted(CATALOG, key=lambda p: score_product(p, look, cart), reverse=True)
    return [p["id"] for p in ranked[:limit]]
