import * as Gestora from "../models/gestora.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Gestora.getAllGestoras();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Gestora.getGestoraById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFondos = async (req, res) => {
  try {
    const [rows] = await Gestora.getFondosByGestora(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { nombre, icono, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ 
        message: "El nombre es requerido" 
      });
    }
    
    const [result] = await Gestora.createGestora({ 
      nombre, 
      icono, 
      descripcion 
    });
    
    res.status(201).json({
      id: result.insertId,
      nombre,
      icono,
      descripcion,
      message: "Gestora creada exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Gestora.updateGestora(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Gestora actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Gestora.deleteGestora(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Gestora eliminada" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar la gestora porque tiene fondos asociados" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};