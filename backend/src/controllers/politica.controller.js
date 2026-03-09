import * as Politica from "../models/politica.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Politica.getAllPoliticas();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Politica.getPoliticaById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFondos = async (req, res) => {
  try {
    const [rows] = await Politica.getFondosByPolitica(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { politica } = req.body;
    
    if (!politica) {
      return res.status(400).json({ 
        message: "La política es requerida" 
      });
    }
    
    const [result] = await Politica.createPolitica({ politica });
    
    res.status(201).json({
      id: result.insertId,
      politica,
      message: "Política creada exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Politica.updatePolitica(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Política actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Politica.deletePolitica(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Política eliminada" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar la política porque tiene fondos asociados" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};