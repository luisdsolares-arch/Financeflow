# Despliegue en Render.com — Guía paso a paso

## Qué vas a conseguir
El backend de FinanceFlow corriendo permanentemente en `https://financeflow-api.onrender.com`
con una base de datos PostgreSQL gestionada por Render. La APK ya apunta a esa URL.

---

## Requisitos previos
- Tener el código en un repositorio Git (GitHub, GitLab o Bitbucket).
  Si no tienes uno, hazlo ahora:
  ```
  git init
  git add .
  git commit -m "Initial commit"
  # Crea un repo en github.com, luego:
  git remote add origin https://github.com/TU_USUARIO/personal-finance-saas.git
  git push -u origin main
  ```
- Cuenta gratuita en [render.com](https://render.com) (registro con GitHub recomendado).

---

## Paso 1 — Conectar tu cuenta de Render con GitHub

1. Entra en [dashboard.render.com](https://dashboard.render.com).
2. Haz clic en **New → Blueprint**.
3. Render te pedirá conectar tu cuenta de GitHub/GitLab. Acepta los permisos.

---

## Paso 2 — Desplegar con Blueprint (render.yaml)

1. En **New → Blueprint**, selecciona el repositorio `personal-finance-saas`.
2. Render detecta automáticamente el archivo `render.yaml` en la raíz.
3. Verás dos recursos a crear:
   - **financeflow-api** (Web Service, FastAPI)
   - **financeflow-db** (PostgreSQL, plan Free)
4. Haz clic en **Apply** y espera ~5 minutos.

> La primera vez Render instalará dependencias, creará la base de datos
> y ejecutará las migraciones Alembic (`alembic upgrade head`).

---

## Paso 3 — Variables de entorno que Render genera solo

Render genera automáticamente:
- `JWT_SECRET` — clave aleatoria segura
- `ENCRYPTION_KEY` — clave aleatoria segura
- `DATABASE_URL` — cadena de conexión a tu PostgreSQL de Render

**No necesitas tocar nada.**  
Si quieres revisarlas: Dashboard → financeflow-api → **Environment**.

---

## Paso 4 — Verificar que el servidor funciona

Una vez desplegado, abre en el navegador:
```
https://financeflow-api.onrender.com/health
```
Debe responder:
```json
{"status": "ok"}
```

Y para comprobar la base de datos:
```
https://financeflow-api.onrender.com/health/ready
```
Debe responder:
```json
{"status": "ready"}
```

---

## Paso 5 — Instalar la APK en tu móvil

El APK firmado ya apunta a `https://financeflow-api.onrender.com/api/v1`.

Archivo:
```
frontend/android/app/build/outputs/apk/release/app-release.apk
```

**Método 1 — Cable USB:**
1. Activa "Opciones de desarrollador" y "Depuración USB" en Android.
2. Conecta el cable y ejecuta:
   ```
   adb install frontend/android/app/build/outputs/apk/release/app-release.apk
   ```

**Método 2 — Descarga directa:**
1. Sube el APK a Google Drive / Telegram / email.
2. Abre el enlace desde el móvil y acepta instalar fuente desconocida.

---

## Paso 6 — Registrar tu primer usuario

1. Abre FinanceFlow en el móvil.
2. Toca **Crear cuenta** para ir al formulario de registro.
3. Introduce nombre, correo y contraseña.
4. Ya puedes iniciar sesión y usar la app.

---

## Notas importantes

### Cold start (plan gratuito)
Render apaga el servidor tras 15 minutos de inactividad.
La primera petición del día puede tardar 20-30 segundos en responder.
La APK ya tiene un timeout de 30 segundos para cubrirlo.

### Cambiar la URL si renombras el servicio
Si cambias el nombre del servicio en Render, actualiza esta línea en
`frontend/src/services/api.js`:
```js
? "https://NUEVO_NOMBRE.onrender.com/api/v1"
```
Y recompila:
```
npm run mobile:apk:release
```

### Acceder a ajustes de conexión desde la app
Toca el texto **FinanceFlow** 5 veces seguidas en la pantalla de login
para abrir los ajustes de conexión y cambiar la URL manualmente.

### Actualizar el servidor después de cambios
Basta con hacer `git push`. Render re-despliega automáticamente.

---

## Archivos creados/modificados en este despliegue

| Archivo | Cambio |
|---------|--------|
| `render.yaml` | Blueprint de Render con Web Service + PostgreSQL |
| `backend/scripts/start.sh` | Script de inicio: migra y arranca uvicorn |
| `backend/app/core/config.py` | Normaliza `postgres://` → `postgresql+psycopg://` |
| `frontend/src/services/api.js` | URL por defecto → `financeflow-api.onrender.com` |
