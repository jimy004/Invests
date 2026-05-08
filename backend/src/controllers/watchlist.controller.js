import * as Watchlist from "../models/watchlist.model.js";
import { fetchYahooQuoteBySymbol } from "../services/yahoo.service.js";

const QUOTE_CONCURRENCY = 5;

async function enrichWithQuotes(rows) {
  const results = [];
  for (let i = 0; i < rows.length; i += QUOTE_CONCURRENCY) {
    const batch = rows.slice(i, i + QUOTE_CONCURRENCY);
    const enriched = await Promise.all(
      batch.map(async (row) => {
        try {
          const quote = await fetchYahooQuoteBySymbol(row.ticker);
          return { ...row, precio_actual: quote.precio, variacion_porcentual: quote.variacion_porcentual };
        } catch (err) {
          console.error(`[watchlist] Error obteniendo precio para ${row.ticker}:`, err.message);
          return { ...row, precio_actual: null, variacion_porcentual: null };
        }
      })
    );
    results.push(...enriched);
  }
  return results;
}

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Watchlist.getByUsuario(Number(req.params.usuario_id));
    const withMarket = await enrichWithQuotes(rows);
    res.json(withMarket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { usuario_id, activo_id, nota } = req.body;
    if (!activo_id) return res.status(400).json({ message: "activo_id es requerido" });
    const [result] = await Watchlist.create({
      usuario_id: Number(usuario_id),
      activo_id: Number(activo_id),
      nota
    });
    res.status(201).json({ id: result.insertId, message: "Añadido a watchlist" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "El activo ya esta en la watchlist" });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateNota = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await Watchlist.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "No encontrado" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });
    await Watchlist.updateNota(id, req.body.nota);
    res.json({ message: "Nota actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await Watchlist.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "No encontrado" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });
    await Watchlist.remove(id);
    res.json({ message: "Eliminado de watchlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
