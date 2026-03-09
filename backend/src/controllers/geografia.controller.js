import * as Geografia from "../models/geografia.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Geografia.getAllGeografias();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Geografia.getGeografiaById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFondos = async (req, res) => {
  try {
    const [rows] = await Geografia.getFondosByGeografia(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { geografia } = req.body;
    
    if (!geografia) {
      return res.status(400).json({ 
        message: "La geografía es requerida" 
      });
    }
    
    const [result] = await Geografia.createGeografia({ geografia });
    
    res.status(201).json({
      id: result.insertId,
      geografia,
      message: "Geografía creada exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Geografia.updateGeografia(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Geografía actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Geografia.deleteGeografia(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Geografía eliminada" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar la geografía porque tiene fondos asociados" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};