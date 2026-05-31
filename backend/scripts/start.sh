#!/usr/bin/env sh
# Ejecuta migraciones y arranca el servidor.
# Render llama a este script como startCommand.
set -e
echo "==> Ejecutando migraciones Alembic..."
alembic upgrade head
echo "==> Migraciones completadas. Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
