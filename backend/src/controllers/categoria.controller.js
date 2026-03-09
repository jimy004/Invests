import * as Categoria from "../models/categoria.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Categoria.getAllCategorias();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Categoria.getCategoriaById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { categoria, icono } = req.body;
    
    if (!categoria) {
      return res.status(400).json({ message: "La categoría es requerida" });
    }
    
    const [result] = await Categoria.createCategoria({ categoria, icono });
    res.status(201).json({ 
      id: result.insertId, 
      categoria, 
      icono,
      message: "Categoría creada exitosamente" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Categoria.updateCategoria(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Categoría actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Categoria.deleteCategoria(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};