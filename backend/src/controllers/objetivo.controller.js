import * as Objetivo from "../models/objetivo.model.js";

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Objetivo.getByUsuario(Number(req.params.usuario_id));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { usuario_id, nombre, monto_objetivo, fecha_objetivo, monto_inicial, nota, portafolio_ids } = req.body;
    if (!nombre || !monto_objetivo || !fecha_objetivo) {
      return res.status(400).json({ message: "nombre, monto_objetivo y fecha_objetivo son requeridos" });
    }
    const [result] = await Objetivo.create({
      usuario_id: Number(usuario_id),
      nombre,
      monto_objetivo: Number(monto_objetivo),
      fecha_objetivo,
      monto_inicial: Number(monto_inicial || 0),
      nota,
      portafolio_ids: portafolio_ids || null
    });
    res.status(201).json({ id: result.insertId, message: "Objetivo creado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await Objetivo.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "Objetivo no encontrado" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });
    const { nombre, monto_objetivo, fecha_objetivo, monto_inicial, nota, portafolio_ids } = req.body;
    await Objetivo.update(id, { nombre, monto_objetivo, fecha_objetivo, monto_inicial, nota, portafolio_ids: portafolio_ids || null });
    res.json({ message: "Objetivo actualizado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await Objetivo.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "Objetivo no encontrado" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });
    await Objetivo.remove(id);
    res.json({ message: "Objetivo eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
