# FinanceFlow - Personal Finance SaaS

Aplicacion Full-Stack para gestion de finanzas personales automatizada con enfoque SaaS premium.

## Stack
- Frontend: React + Tailwind CSS + Recharts
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Integracion Open Banking: flujo compatible con Plaid/Belvo (token exchange servidor)

## Arquitectura
- `frontend/`: UX/UI, dashboard, autenticacion y modulos de operacion.
- `backend/`: API REST, autenticacion JWT, motor analitico, webhook y categorizacion automatica.
- `docker-compose.yml`: PostgreSQL local.

## Flujo de Usuario
1. Registro/Login con validaciones y feedback visual.
2. Acceso al dashboard: KPIs, grafico de balance, dona por categorias y tabla de transacciones.
3. Conexion de cuenta bancaria con boton dedicado que inicia widget seguro de Open Banking.
4. Intercambio de `public_token` por `access_token` en backend y almacenamiento encriptado.
5. Recepcion webhook `TRANSACTIONS_AVAILABLE`, normalizacion de descripcion y categorizacion automatica.
6. Motor de sugerencias: regla de riesgo (>70% gastos), diagnostico 50/30/20 y flashes de inversion por superavit >25%.

## Seguridad Open Banking
- Las credenciales bancarias del usuario no pasan por nuestros servidores.
- Solo se gestionan tokens de acceso de lectura regulados bajo PSD2/Open Banking.
- El token persistente se almacena cifrado en base de datos.

## Endpoints Principales
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`
- `GET /api/v1/suggestions`
- `POST /api/v1/bank/authenticate`
- `POST /api/v1/bank/webhook`
- `GET /api/v1/payments/accounts`
- `GET /api/v1/payments/rules`
- `POST /api/v1/payments/rules`
- `PATCH /api/v1/payments/rules/{rule_id}`
- `POST /api/v1/payments/execute-due`
- `POST /api/v1/payments/rules/{rule_id}/run-now`
- `POST /api/v1/payments/notifications/refresh`
- `GET /api/v1/payments/notifications`
- `PATCH /api/v1/payments/notifications/{notification_id}`
- `GET /api/v1/payments/assistant/suggestions`

## Ejecucion Rapida
### 1) Base de datos (opcional)
Por defecto el backend usa SQLite local (`DATABASE_URL=sqlite:///./finance_app.db`), por lo que no necesitas Docker para iniciar.

Si prefieres PostgreSQL:
```bash
docker compose up -d
```

### 2) Backend
```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Backend con scripts (PowerShell)
```powershell
cd backend
./scripts/start_backend_sqlite.ps1
```

### PostgreSQL + Alembic
1. Configura `DATABASE_URL` en `backend/.env` (ejemplo: `postgresql+psycopg://postgres:postgres@localhost:5432/finance_app`).
2. Define `AUTO_CREATE_TABLES=false`.
3. Ejecuta:

```powershell
cd backend
./scripts/start_backend_postgres.ps1
```

Comandos directos Alembic:
```bash
cd backend
.venv\\Scripts\\python.exe -m alembic upgrade head
.venv\\Scripts\\python.exe -m alembic revision --autogenerate -m "mensaje"
```

Si tu base ya fue creada por `create_all` y quieres empezar a versionarla sin recrearla:
```bash
cd backend
.venv\\Scripts\\python.exe -m alembic stamp head
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4) Android APK (Capacitor)
Configuracion base ya incluida para generar app Android desde el frontend React.

1. Construir y sincronizar proyecto nativo:

```bash
cd frontend
npm run mobile:sync
```

2. Abrir Android Studio:

```bash
npm run mobile:open
```

3. En Android Studio, genera APK desde:
  - Build > Build Bundle(s) / APK(s) > Build APK(s)

Notas de red para backend local:
- Emulador Android usa `http://10.0.2.2:8000` para apuntar al host.
- Para dispositivo fisico, usa la IP LAN de tu PC en `frontend/.env`:

```bash
VITE_API_BASE_URL=http://TU_IP_LAN:8000/api/v1
```

Archivo de ejemplo incluido: `frontend/.env.android.example`.

### 5) APK firmado (Release)
Para generar APK/AAB firmados, configura un keystore local en Android.

1. Crear keystore (una sola vez):

```bash
cd frontend
npm run mobile:keystore:create
```

2. Crear archivo de firma desde plantilla:

```bash
cd frontend/android
copy keystore.properties.example keystore.properties
```

3. Editar `frontend/android/keystore.properties` con tus credenciales reales.

4. Compilar release firmado:

```bash
cd frontend
npm run mobile:apk:release
```

5. (Opcional) Generar Android App Bundle para Play Store:

```bash
cd frontend
npm run mobile:aab:release
```

Salidas esperadas:
- APK: `frontend/android/app/build/outputs/apk/release/`
- AAB: `frontend/android/app/build/outputs/bundle/release/`

Seguridad:
- `frontend/android/keystore.properties` y archivos `.jks/.keystore` quedan ignorados por git.

## Pruebas
### Backend
```bash
cd backend
.venv\\Scripts\\python.exe -m pytest -q
```

o bien:

```powershell
cd backend
./scripts/run_tests.ps1
```

### Frontend
```bash
cd frontend
npm run test
```

Incluye pruebas E2E de API en `backend/tests/test_e2e_finance_flow.py`.
Incluye pruebas del gestor de pagos en `backend/tests/test_payments_assistant.py`.

## Despliegue Produccion (Docker)
1. Copia `.env.prod.example` a `.env.prod` y reemplaza secretos (`POSTGRES_PASSWORD`, `JWT_SECRET`, llaves Open Banking).
2. Levanta stack:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

3. Endpoints esperados:
- Frontend: `http://localhost`
- Backend: `http://localhost:8000`

Servicios incluidos:
- `postgres` (persistencia)
- `backend` (migraciones Alembic al arranque + API + headers de seguridad)
- `frontend` (build React servido por Nginx + headers de seguridad)

Incluye healthchecks de aplicacion:
- `backend`: `GET /health/ready`
- `frontend`: `GET /healthz`

Notas de hardening aplicadas:
- Secretos fuera del compose, inyectados por `.env.prod`.
- `TrustedHostMiddleware` en backend.
- Cabeceras de seguridad en backend y Nginx.
- `restart: unless-stopped` en servicios principales.

## Estructura de Directorios
```text
personal-finance-saas/
  backend/
    app/
      api/v1/
      core/
      db/
      models/
      schemas/
      services/
      utils/
    requirements.txt
    .env.example
  frontend/
    src/
      components/
      layouts/
      pages/
      services/
      data/
    package.json
  docker-compose.yml
  README.md
```

## Open Banking real (Plaid/Belvo)
1. Configura proveedor en `backend/.env` con `OPEN_BANKING_PROVIDER=plaid` o `OPEN_BANKING_PROVIDER=belvo`.
2. Para Plaid define `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` y opcionalmente `PLAID_REDIRECT_URI`.
3. Para Belvo define `BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD` y `BELVO_BASE_URL`.
4. El frontend envia `public_token` a `POST /api/v1/bank/authenticate` y backend lo intercambia por `access_token`.
5. Para sincronizacion automatica, publica webhook a `POST /api/v1/bank/webhook` con `event_type=TRANSACTIONS_AVAILABLE`.
