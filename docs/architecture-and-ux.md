# Arquitectura y UX/UI - FinanceFlow

## Vision del Sistema
Plataforma SaaS de finanzas personales automatizadas con cuatro capas:
1. Presentacion (React + Tailwind): experiencia premium, modular y responsive.
2. Aplicacion (FastAPI): autenticacion, logica financiera y orquestacion de Open Banking.
3. Datos (PostgreSQL): almacenamiento relacional de usuarios, cuentas, transacciones y presupuestos.
4. Integraciones externas (Plaid/Belvo): conectividad bancaria bajo tokenizacion regulada.

## Arquitectura Logica
- Frontend consume API REST bajo `/api/v1`.
- Backend aplica JWT para sesiones y autorizacion por usuario.
- Token de Open Banking se intercambia solo en backend y se guarda cifrado.
- Webhook de transacciones gatilla categorizacion automatica y enriquecimiento de datos.

## Flujo UX/UI
### 1) Autenticacion
- Pantalla central limpia con formulario de correo y contrasena.
- Opcion mostrar/ocultar contrasena.
- Feedback visual de errores y CTA de registro/login.

### 2) Navegacion
- Sidebar fija con accesos: Dashboard, Transacciones, Presupuestos, Consejos, Configuracion.
- Header con buscador global, notificaciones y perfil con plan de suscripcion.

### 3) Dashboard
- KPIs principales: balance neto, ingresos, gastos y capacidad de ahorro.
- Visualizacion temporal de balance con grafico de area.
- Distribucion por categorias con grafico de dona.
- Tabla de ultimas transacciones para lectura operacional.

### 4) Motor Inteligente
- Regla de riesgo si gastos >70% ingresos.
- Diagnostico 50/30/20 con texto accionable.
- Flashes de inversion cuando superavit >25%.

### 5) Open Banking
- Boton conectar cuenta bancaria y callback de exito con token publico.
- Endpoint `/api/v1/bank/authenticate` para intercambio de token.
- Endpoint `/api/v1/bank/webhook` para eventos de nuevas transacciones.
- Credenciales bancarias nunca se almacenan ni transitan por la app.

## Escalabilidad Recomendada
- Migrar a migraciones Alembic completas para versionado de esquema.
- Incorporar cola de eventos para webhooks (ej. Redis + RQ/Celery).
- Agregar observabilidad (OpenTelemetry + dashboard de errores).
- Añadir pruebas E2E y contract tests para integraciones Open Banking.
