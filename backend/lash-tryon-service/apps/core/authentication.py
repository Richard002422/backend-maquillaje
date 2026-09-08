"""
Autenticación DRF que valida el access token que emite Express — este
servicio no emite, renueva ni almacena tokens, solo los verifica.

Debe permanecer en sincronía exacta con `backend/api/src/lib/jwt.ts`:
  - Algoritmo: HS256 (jsonwebtoken usa esto por defecto con secreto string).
  - Claims: {sub: str, email: str, typ: 'access'}.
  - issuer: 'glowlab-api', audience: 'glowlab-clients' (ver settings.JWT_ISSUER/JWT_AUDIENCE).
  - Secreto: JWT_ACCESS_SECRET, IDÉNTICO al de backend/api/.env.

Si alguien cambia el contrato de un lado sin el otro, todo empieza a
responder 401 en silencio — no hay forma de que Django lo detecte solo.
"""

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions


class ExpressUser:
    """
    Representa al usuario autenticado vía el JWT de Express dentro de una
    request de DRF (`request.user`). NO es una fila de `auth.User` — Django
    no posee la tabla de usuarios de la app, Express sí (ver README.md). Solo
    envuelve los claims del token para que el resto del código (`request.user.id`,
    permisos por owner en la Fase 4+) tenga algo consistente contra qué comparar.
    """

    # DRF/Django comprueban este atributo en varios puntos (p. ej. middlewares
    # de admin) — con is_authenticated=True evitamos que algo lo confunda con
    # AnonymousUser cuando sí hay un token válido.
    is_authenticated = True

    def __init__(self, user_id: str, email: str):
        self.id = user_id
        self.user_id = user_id
        self.email = email

    def __str__(self) -> str:
        return self.email

    def __eq__(self, other: object) -> bool:
        return isinstance(other, ExpressUser) and self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)


def _extract_bearer_token(request) -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header[len("Bearer ") :].strip()
    return token or None


def _decode_payload(token: str) -> dict:
    """Lanza jwt.PyJWTError si el token es inválido/expirado/mal firmado."""
    return jwt.decode(
        token,
        settings.JWT_ACCESS_SECRET,
        algorithms=["HS256"],
        issuer=settings.JWT_ISSUER,
        audience=settings.JWT_AUDIENCE,
    )


def _user_from_payload(payload: dict) -> ExpressUser | None:
    sub = payload.get("sub")
    email = payload.get("email")
    if payload.get("typ") != "access" or not isinstance(sub, str) or not isinstance(email, str):
        return None
    return ExpressUser(user_id=sub, email=email)


class ExpressJWTAuthentication(authentication.BaseAuthentication):
    """
    Estricta: sin header -> anónimo (None, DRF decide con permission_classes);
    CON header pero inválido/expirado -> 401 explícito. Úsala en vistas que
    de verdad requieren sesión (p. ej. fotos, Fase 4).
    """

    keyword = "Bearer"

    def authenticate(self, request):
        token = _extract_bearer_token(request)
        if token is None:
            return None

        try:
            payload = _decode_payload(token)
        except jwt.PyJWTError as exc:
            raise exceptions.AuthenticationFailed("Token de acceso inválido o expirado") from exc

        user = _user_from_payload(payload)
        if user is None:
            raise exceptions.AuthenticationFailed("Token de acceso inválido o expirado")
        return (user, token)

    def authenticate_header(self, request) -> str:
        # Sin esto, DRF devuelve 403 en vez de 401 cuando falta el header
        # Authorization — 401 es lo correcto semánticamente (falta credencial,
        # no que se tenga y no alcance).
        return self.keyword


class OptionalExpressJWTAuthentication(authentication.BaseAuthentication):
    """
    Igual que ExpressJWTAuthentication pero NUNCA lanza 401 — un token
    ausente, inválido o expirado se trata como anónimo (equivalente a
    `optionalAuth()` en backend/api/src/middleware/authenticate.ts).

    Úsala en endpoints donde loguearse es opcional (p. ej. sesiones del
    probador, Fase 3): un access token vencido a mitad de sesión (TTL de
    15 min) no debe tumbar la petición, solo perder la asociación al
    usuario para esa llamada puntual.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        token = _extract_bearer_token(request)
        if token is None:
            return None
        try:
            payload = _decode_payload(token)
        except jwt.PyJWTError:
            return None  # token presente pero inválido: sigue como anónimo, no 401

        user = _user_from_payload(payload)
        if user is None:
            return None
        return (user, token)
