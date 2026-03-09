import * as DetallesAccion from "../models/detallesaccion.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await DetallesAccion.getAllDetallesAcciones();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await DetallesAccion.getDetallesAccionById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByActivo = async (req, res) => {
  try {
    const [rows] = await DetallesAccion.getDetallesAccionByActivo(req.params.activo_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBySector = async (req, res) => {
  try {
    const [rows] = await DetallesAccion.getDetallesAccionBySector(req.params.sector_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const search = async (req, res) => {
  try {
    const filters = {
      activo_id: req.query.activo_id,
      sector_id: req.query.sector_id,
      search: req.query.search
    };
    
    const [rows] = await DetallesAccion.searchDetallesAcciones(filters);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenBySector = async (req, res) => {
  try {
    const [rows] = await DetallesAccion.getAccionesBySectorResumen();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrCreate = async (req, res) => {
  try {
    const { activo_id, sector_id } = req.body;
    
    if (!activo_id) {
      return res.status(400).json({ 
        message: "El activo_id es requerido" 
      });
    }
    
    const result = await DetallesAccion.getOrCreateDetallesAccion(activo_id, sector_id);
    
    // Obtener los detalles completos
    const [detallesCompletos] = await DetallesAccion.getDetallesAccionById(result.id);
    
    const mensaje = result.creado 
      ? "Detalles de acción creados exitosamente"
      : result.actualizado
      ? "Detalles de acción actualizados exitosamente"
      : "Detalles de acción encontrados";
    
    res.status(result.creado ? 201 : 200).json({
      ...detallesCompletos[0],
      accion: result.creado ? 'creado' : result.actualizado ? 'actualizado' : 'encontrado',
      message: mensaje
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El activo o sector especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { activo_id, sector_id } = req.body;
    
    // Validaciones
    if (!activo_id || !sector_id) {
      return res.status(400).json({ 
        message: "activo_id y sector_id son requeridos" 
      });
    }
    
    // Verificar si ya existen detalles para este activo
    const [existentes] = await DetallesAccion.getDetallesAccionByActivo(activo_id);
    if (existentes.length > 0) {
      return res.status(400).json({ 
        message: "Ya existen detalles de acción para este activo",
        detalles_existentes: existentes[0]
      });
    }
    
    const [result] = await DetallesAccion.createDetallesAccion({ 
      activo_id, 
      sector_id 
    });
    
    // Obtener los detalles creados
    const [detallesCreados] = await DetallesAccion.getDetallesAccionById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...detallesCreados[0],
      message: "Detalles de acción creados exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El activo o sector especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await DetallesAccion.updateDetallesAccion(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener los detalles actualizados
    const [detallesActualizados] = await DetallesAccion.getDetallesAccionById(req.params.id);
    
    res.json({
      ...detallesActualizados[0],
      message: "Detalles de acción actualizados"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El activo o sector especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await DetallesAccion.deleteDetallesAccion(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Detalles de acción eliminados" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeByActivo = async (req, res) => {
  try {
    const [result] = await DetallesAccion.deleteDetallesAccionByActivo(req.params.activo_id);
    res.json({ 
      message: `${result.affectedRows} detalles de acción eliminados para el activo`,
      affectedRows: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};