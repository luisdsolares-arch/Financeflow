# Open Banking Setup (Plaid/Belvo)

## Objetivo
Configurar intercambio real de `public_token` por `access_token` en backend sin exponer credenciales bancarias del usuario.

## Variables de Entorno
Archivo: `backend/.env`

### Plaid
- OPEN_BANKING_PROVIDER=plaid
- PLAID_CLIENT_ID=...
- PLAID_SECRET=...
- PLAID_ENV=sandbox | development | production
- PLAID_REDIRECT_URI=... (opcional)

### Belvo
- OPEN_BANKING_PROVIDER=belvo
- BELVO_SECRET_ID=...
- BELVO_SECRET_PASSWORD=...
- BELVO_BASE_URL=https://sandbox.belvo.com

## Flujo
1. Frontend obtiene `public_token` en widget seguro.
2. Frontend envia token a `POST /api/v1/bank/authenticate`.
3. Backend llama al proveedor desde servidor y recibe `access_token`.
4. Token persistente se guarda cifrado en `cuentas_bancarias.access_token`.

## Verificacion rapida
1. Registrar usuario y tomar JWT.
2. Enviar:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/bank/authenticate \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"public_token":"public-sandbox-demo","institution_name":"Banco Demo","account_type":"checking","last_four":"1234"}'
```

3. Resultado esperado: `201` con `account_id` y mensaje de conexion en modo solo lectura.

## Seguridad
- Credenciales bancarias nunca pasan por la app.
- Solo se procesan tokens regulados y de lectura.
- Mantener secretos en variables de entorno y no en frontend.
