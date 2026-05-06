import * as Dividendo from "../models/dividendo.model.js";
import pool from "../db.js";

async function getPosicionOwnerUserId(posicionId) {
  const [rows] = await pool.query(
    `SELECT po.usuario_id FROM Posicion p INNER JOIN Portafolio po ON p.portafolio_id = po.id WHERE p.id=?`,
    [posicionId]
  );
  return rows.length ? Number(rows[0].usuario_id) : null;
}

export const getByPortafolio = async (req, res) => {
  try {
    const [rows] = await Dividendo.getByPortafolio(Number(req.params.portafolio_id));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Dividendo.getByUsuario(Number(req.params.usuario_id));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { posicion_id, fecha, importe, moneda_id, observacion } = req.body;
    if (!posicion_id || !fecha || !importe) {
      return res.status(400).json({ message: "posicion_id, fecha e importe son requeridos" });
    }
    const ownerUserId = await getPosicionOwnerUserId(Number(posicion_id));
    if (!ownerUserId) return res.status(404).json({ message: "Posicion no encontrada" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });

    const [result] = await Dividendo.create({ posicion_id, fecha, importe, moneda_id, observacion });
    res.status(201).json({ id: result.insertId, message: "Dividendo registrado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await Dividendo.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "Dividendo no encontrado" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });
    const { fecha, importe, moneda_id, observacion } = req.body;
    await Dividendo.update(id, { fecha, importe, moneda_id, observacion });
    res.json({ message: "Dividendo actualizado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await Dividendo.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "Dividendo no encontrado" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });
    await Dividendo.remove(id);
    res.json({ message: "Dividendo eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
