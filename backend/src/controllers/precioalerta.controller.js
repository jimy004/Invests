import * as PrecioAlerta from "../models/precioalerta.model.js";

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await PrecioAlerta.getByUsuario(Number(req.params.usuario_id));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { usuario_id, activo_id, tipo, precio_objetivo } = req.body;
    if (!activo_id || !tipo || !precio_objetivo) {
      return res.status(400).json({ message: "activo_id, tipo y precio_objetivo son requeridos" });
    }
    if (!["mayor", "menor"].includes(tipo)) {
      return res.status(400).json({ message: "tipo debe ser 'mayor' o 'menor'" });
    }
    const [result] = await PrecioAlerta.create({
      usuario_id: Number(usuario_id),
      activo_id: Number(activo_id),
      tipo,
      precio_objetivo: Number(precio_objetivo)
    });
    res.status(201).json({ id: result.insertId, message: "Alerta creada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await PrecioAlerta.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "Alerta no encontrada" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });

    const { tipo, precio_objetivo, activa } = req.body;
    await PrecioAlerta.update(id, {
      tipo,
      precio_objetivo: Number(precio_objetivo),
      activa: activa ? 1 : 0
    });
    res.json({ message: "Alerta actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ownerUserId = await PrecioAlerta.getOwnerUserId(id);
    if (!ownerUserId) return res.status(404).json({ message: "Alerta no encontrada" });
    if (ownerUserId !== req.authUserId) return res.status(403).json({ message: "No autorizado" });

    await PrecioAlerta.remove(id);
    res.json({ message: "Alerta eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
