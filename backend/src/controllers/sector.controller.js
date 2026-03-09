import * as Sector from "../models/sector.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Sector.getAllSectores();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Sector.getSectorById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
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
    
    const [result] = await Sector.createSector({ 
      nombre, 
      icono, 
      descripcion 
    });
    
    res.status(201).json({
      id: result.insertId,
      nombre,
      icono,
      descripcion,
      message: "Sector creado exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Sector.updateSector(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Sector actualizado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Sector.deleteSector(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Sector eliminado" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar el sector porque está siendo usado en DetallesFondo o DetallesAccion" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};