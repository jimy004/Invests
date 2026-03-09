# Invests

Aplicacion de gestion de portafolios con:

- `frontend`: React + Vite
- `backend`: Node.js + Express
- `db`: MySQL 8

## Requisitos

- Docker Desktop
- Docker Compose v2
- Node.js 20+ (para ejecutar sin Docker)
- npm 10+

## Configuracion

1. Crear archivo de variables de Compose:

```bash
cp .env.example .env
```

2. Crear archivo de variables del backend:

```bash
cp backend/.env.example backend/.env
```

3. Editar `backend/.env` y cambiar los secretos obligatorios:

- `JWT_SECRET`: string largo y aleatorio (recomendado 32+ caracteres)
- `JWT_REFRESH_SECRET`: distinto al anterior y tambien largo/aleatorio

Ejemplo rapido para generarlos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Revisar si quieres cambiar valores por defecto:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: solo si tu MySQL no usa esos datos.
- `CORS_ORIGIN`: origen permitido para el frontend. Por defecto `http://localhost:5173`.
- `VITE_API_URL` en `.env`: URL base del backend para frontend. Por defecto `http://localhost:3000`.

Si usas Docker con la configuracion por defecto, no hace falta cambiar nada mas aparte de los JWT.

## Ejecutar con Docker

1. Levantar base de datos y backend:

```bash
docker compose up -d db backend
```

2. Levantar frontend:

```bash
docker compose --profile frontend up -d frontend
```

Comandos usados en servicios (que hace cada uno):

- `docker compose up -d db backend`: crea/inicia los servicios `db` y `backend` en segundo plano.
- `docker compose --profile frontend up -d frontend`: crea/inicia `frontend` (esta en el profile `frontend`).
- `docker compose down`: para y elimina contenedores/red.
- `docker compose down -v`: lo anterior y ademas borra volumenes (incluida la data de MySQL).

## Ejecutar sin Docker

1. Instalar dependencias:

```bash
npm --prefix backend install
npm --prefix frontend install
```

2. Levantar una base de datos MySQL local y crear esquema con:

- Script SQL: `backend/mysql/init.sql`

3. Ajustar `backend/.env` para apuntar a tu MySQL local:

- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=...`
- `DB_PASSWORD=...`
- `DB_NAME=invests`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`

4. Ejecutar backend:

```bash
npm --prefix backend start
```

5. Ejecutar frontend:

```bash
npm --prefix frontend run dev
```

## URLs

- Frontend: `http://localhost:5173`
- API backend: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/health`

## Parar servicios

```bash
docker compose down
```

Para eliminar tambien el volumen de MySQL:

```bash
docker compose down -v
```

## Seguridad minima incluida

- Sin secretos JWT por defecto en codigo: ahora son obligatorios por entorno.
- CORS restringido por `CORS_ORIGIN` (lista separada por comas).
- `.env` ignorados por git.
