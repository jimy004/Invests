import * as Watchlist from "../models/watchlist.model.js";
import { fetchYahooQuoteBySymbol } from "../services/yahoo.service.js";

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Watchlist.getByUsuario(Number(req.params.usuario_id));
    const withMarket = await Promise.all(
      rows.map(async (row) => {
        try {
          const quote = await fetchYahooQuoteBySymbol(row.ticker);
          return { ...row, precio_actual: quote.precio, variacion_porcentual: quote.variacion_porcentual };
        } catch {
          return { ...row, precio_actual: null, variacion_porcentual: null };
        }
      })
    );
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
    if (String(err.message).includes("Duplicate")) {
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
