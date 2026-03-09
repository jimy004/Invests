import express from 'express';
import cors from 'cors';
import pool from './db.js';
import monedaRoutes from "./routes/moneda.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import portafolioRoutes from "./routes/portafolio.routes.js";
import activoRoutes from "./routes/activo.routes.js";
import sectorRoutes from "./routes/sector.routes.js";
import gestoraRoutes from "./routes/gestora.routes.js";
import politicaRoutes from "./routes/politica.routes.js";
import tipoRoutes from "./routes/tipo.routes.js";
import geografiaRoutes from "./routes/geografia.routes.js";
import detallesfondoRoutes from "./routes/detallesfondo.routes.js";
import resumenRoutes from "./routes/resumen.routes.js";
import cashflowRoutes from "./routes/cashflow.routes.js";
import posicionRoutes from "./routes/posicion.routes.js";
import ordenRoutes from "./routes/orden.routes.js";
import portfoliosnapshotRoutes from "./routes/portfoliosnapshot.routes.js";
import posicionsnapshotRoutes from "./routes/posicionsnapshot.routes.js";
import detallesaccionRoutes from "./routes/detallesaccion.routes.js";
import snapshotConfigRoutes from "./routes/snapshotconfig.routes.js";
import notificacionRoutes from "./routes/notificacion.routes.js";
import noticiaRoutes from "./routes/noticia.routes.js";
import { startSnapshotScheduler } from "./services/snapshot-scheduler.service.js";
import { ensureAutomationSchema } from "./services/automation-schema.service.js";

process.on("unhandledRejection", (reason) => {
  console.error("[process] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[process] Uncaught exception:", error);
});


const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

app.use('/monedas', monedaRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/portafolios', portafolioRoutes);
app.use('/activos', activoRoutes);
app.use('/sectores', sectorRoutes);
app.use('/gestoras', gestoraRoutes);
app.use('/politicas', politicaRoutes);
app.use('/tipos', tipoRoutes);
app.use('/geografias', geografiaRoutes);
app.use('/detallesfondo', detallesfondoRoutes);
app.use('/resumenes', resumenRoutes);
app.use('/cashflow', cashflowRoutes);
app.use('/posiciones', posicionRoutes);
app.use('/ordenes', ordenRoutes);
app.use('/portfoliosnapshots', portfoliosnapshotRoutes);
app.use('/posicionsnapshots', posicionsnapshotRoutes);
app.use('/detallesaccion', detallesaccionRoutes);
app.use('/snapshot-config', snapshotConfigRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/noticias', noticiaRoutes);




app.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
});

const PORT = 3000;
const DB_BOOTSTRAP_RETRIES = Number(process.env.DB_BOOTSTRAP_RETRIES || 30);
const DB_BOOTSTRAP_RETRY_DELAY_MS = Number(process.env.DB_BOOTSTRAP_RETRY_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAutomationSchema() {
  let lastError = null;
  for (let attempt = 1; attempt <= DB_BOOTSTRAP_RETRIES; attempt += 1) {
    try {
      await ensureAutomationSchema();
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `[automation-schema] Intento ${attempt}/${DB_BOOTSTRAP_RETRIES} fallido:`,
        err?.message || err
      );
      if (attempt < DB_BOOTSTRAP_RETRIES) {
        await sleep(DB_BOOTSTRAP_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

async function startServer() {
  try {
    await waitForAutomationSchema();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
      startSnapshotScheduler();
    });
  } catch (err) {
    console.error("[automation-schema] Error inicializando tablas:", err?.message || err);
    process.exit(1);
  }
}

startServer();
