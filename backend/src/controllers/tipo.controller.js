import * as Tipo from "../models/tipo.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Tipo.getAllTipos();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Tipo.getTipoById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFondos = async (req, res) => {
  try {
    const [rows] = await Tipo.getFondosByTipo(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { tipo } = req.body;
    
    if (!tipo) {
      return res.status(400).json({ 
        message: "El tipo es requerido" 
      });
    }
    
    const [result] = await Tipo.createTipo({ tipo });
    
    res.status(201).json({
      id: result.insertId,
      tipo,
      message: "Tipo creado exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Tipo.updateTipo(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Tipo actualizado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Tipo.deleteTipo(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Tipo eliminado" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar el tipo porque tiene fondos asociados" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};