import * as DetallesFondo from "../models/detallesfondo.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await DetallesFondo.getAllDetallesFondo();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await DetallesFondo.getDetallesFondoById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByActivo = async (req, res) => {
  try {
    const [rows] = await DetallesFondo.getDetallesFondoByActivo(req.params.activo_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const search = async (req, res) => {
  try {
    const filters = {
      activo_id: req.query.activo_id,
      gestora_id: req.query.gestora_id,
      politica_id: req.query.politica_id,
      tipo_id: req.query.tipo_id,
      geografia_id: req.query.geografia_id,
      sector_id: req.query.sector_id,
      search: req.query.search
    };
    
    const [rows] = await DetallesFondo.searchDetallesFondo(filters);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { 
      activo_id, 
      gestora_id, 
      politica_id, 
      tipo_id, 
      geografia_id, 
      sector_id 
    } = req.body;
    
    // Validación básica - al menos el activo debería ser requerido
    if (!activo_id) {
      return res.status(400).json({ 
        message: "El activo es requerido" 
      });
    }
    
    const [result] = await DetallesFondo.createDetallesFondo({ 
      activo_id, 
      gestora_id, 
      politica_id, 
      tipo_id, 
      geografia_id, 
      sector_id 
    });
    
    // Obtener el detalle creado con todas las relaciones
    const [detalleCreado] = await DetallesFondo.getDetallesFondoById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...detalleCreado[0],
      message: "Detalles de fondo creados exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "Uno o más IDs referenciados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await DetallesFondo.updateDetallesFondo(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el detalle actualizado
    const [detalleActualizado] = await DetallesFondo.getDetallesFondoById(req.params.id);
    
    res.json({
      ...detalleActualizado[0],
      message: "Detalles de fondo actualizados"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "Uno o más IDs referenciados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await DetallesFondo.deleteDetallesFondo(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Detalles de fondo eliminados" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};