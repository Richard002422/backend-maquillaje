#!/bin/bash
# Se ejecuta automáticamente por la imagen oficial de postgres SOLO la
# primera vez que se crea el volumen postgres_data (docker-entrypoint-initdb.d).
#
# Si el volumen ya existía antes de esta fase, este script NO corre solo —
# crea la base a mano:
#   docker exec -it glowlab-postgres createdb -U glowlab glowlab_lashtryon
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE glowlab_lashtryon;
EOSQL
