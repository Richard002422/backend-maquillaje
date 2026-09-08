FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod

WORKDIR /app

# psycopg[binary] trae su propio libpq empaquetado en la wheel — no hace
# falta instalar libpq-dev/libpq5 a nivel de sistema.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

# Sin healthcheck acá: docker-compose.yml lo define a nivel de servicio (para
# poder compartir el mismo Dockerfile con el worker de Celery, que no expone
# HTTP y necesita un healthcheck distinto).
#
# Migraciones al arrancar (mismo patrón que backend/api/Dockerfile con
# Prisma) — SOLO este servicio las corre, no el worker de Celery (ver
# docker-compose.yml: lash-tryon-worker depende de que lash-tryon esté
# "healthy", es decir, ya migrado, para evitar dos procesos alterando el
# esquema a la vez en el primer arranque).
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers 3"]
