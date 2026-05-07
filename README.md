# Invests

Aplicacion personal de gestion de portafolios de inversion. Permite registrar posiciones, ordenes, cashflows, dividendos, alertas de precio, watchlist, objetivos financieros y snapshots historicos.

**Stack:** React + Vite · Node.js + Express · MySQL 8 · Docker

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose v2)
- Node.js 20+ y npm 10+ (solo si ejecutas sin Docker)

---

## Configuracion inicial

### 1. Variables de entorno del backend

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` y rellena los campos obligatorios:

| Variable | Descripcion |
|---|---|
| `JWT_SECRET` | String aleatorio largo (minimo 32 caracteres) |
| `JWT_REFRESH_SECRET` | Distinto al anterior, igual de largo |
| `DB_PASSWORD` | Contrasena de MySQL |

Genera secrets rapidamente con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El resto de variables tienen valores por defecto que funcionan con Docker sin cambios.

### 2. Variables de entorno de Compose (opcional)

```bash
cp .env.example .env
```

Solo necesario si quieres cambiar puertos, nombre de la base de datos o la URL del frontend.

---

## Ejecutar con Docker

### Todo de una vez

```bash
docker compose --profile frontend up --build -d
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Healthcheck | http://localhost:3000/health |

### Solo backend + base de datos (sin frontend)

```bash
docker compose up --build -d
```

Util si desarrollas el frontend con `npm run dev` localmente.

### Parar todo

```bash
docker compose --profile frontend down
```

### Parar y borrar datos de MySQL

```bash
docker compose --profile frontend down -v
```

---

## Ejecutar sin Docker

### 1. Instalar dependencias

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2. Base de datos

Levanta una instancia de MySQL 8 local y ejecuta el schema:

```bash
mysql -u root -p < backend/mysql/init.sql
```

### 3. Configurar backend

Edita `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contrasena
DB_NAME=invests
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

### 4. Arrancar backend y frontend

```bash
# Terminal 1
npm --prefix backend start

# Terminal 2
npm --prefix frontend run dev
```

---

## Estructura del proyecto

```
invests/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Logica de cada recurso
│   │   ├── models/        # Queries SQL
│   │   ├── routes/        # Definicion de endpoints
│   │   ├── services/      # Yahoo Finance, snapshots, schema
│   │   └── app.js         # Entry point Express
│   ├── mysql/
│   │   └── init.sql       # Schema inicial
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Aplicacion React
│   │   ├── lib/api.js     # Cliente HTTP
│   │   └── styles.css
│   └── public/
│       ├── icons/         # Logos de activos (SVG)
│       └── buttons/       # Iconos de botones (SVG)
├── docker-compose.yml
└── .env.example
```

---

## Funcionalidades

- **Portafolios** — Crea y gestiona multiples carteras con moneda propia
- **Posiciones** — Registra activos (acciones, ETFs, cripto, fondos) con precio de mercado en tiempo real via Yahoo Finance
- **Ordenes** — Historial de compras y ventas por posicion
- **Cashflow** — Control de entradas y salidas de capital con calendario
- **Dividendos** — Registro de dividendos por posicion
- **Watchlist** — Seguimiento de activos con alertas de precio
- **Objetivos** — Metas financieras con seguimiento de progreso
- **Snapshots** — Historial automatico del valor del portafolio
- **Benchmark** — Comparacion de rentabilidad contra indices (SP500, etc.)
- **Noticias** — Feed de noticias financieras via Yahoo Finance
- **Modo oscuro** — Toggle desde ajustes de usuario

---

## Comandos utiles

```bash
# Ver logs en tiempo real
docker logs invests-backend-1 --follow

# Reiniciar solo el backend
docker compose restart backend

# Rebuild completo (tras cambios en codigo)
docker compose --profile frontend up --build -d
```

---

## Seguridad

- JWT con access token (15min) y refresh token (7 dias)
- Contrasenas hasheadas con bcrypt
- CORS configurable por `CORS_ORIGIN`
- Secretos JWT obligatorios por variable de entorno (no hay defaults en codigo)
- `.env` excluidos de git
