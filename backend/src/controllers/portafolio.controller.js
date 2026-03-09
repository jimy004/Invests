import * as Portafolio from "../models/portafolio.model.js";
import * as Resumen from "../models/resumen.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await Portafolio.getPortafoliosByUsuario(req.authUserId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Portafolio.getPortafolioById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Portafolio.getPortafoliosByUsuario(req.params.usuario_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { usuario_id, nombre, moneda_id, categoria_id } = req.body;
    
    if (!usuario_id || !nombre) {
      return res.status(400).json({ 
        message: "usuario_id y nombre son requeridos" 
      });
    }
    
    const [result] = await Portafolio.createPortafolio({ 
      usuario_id, 
      nombre, 
      moneda_id, 
      categoria_id 
    });

    if (categoria_id) {
      await Resumen.ensureResumenByUsuarioCategoria(usuario_id, categoria_id);
    }
    
    // Obtener el portafolio creado con sus relaciones
    const [portafolioCreado] = await Portafolio.getPortafolioById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...portafolioCreado[0],
      message: "Portafolio creado exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El usuario, moneda o categoría especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Portafolio.updatePortafolio(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el portafolio actualizado
    const [portafolioActualizado] = await Portafolio.getPortafolioById(req.params.id);
    
    res.json({
      ...portafolioActualizado[0],
      message: "Portafolio actualizado"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El usuario, moneda o categoría especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Portafolio.deletePortafolioCascade(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Portafolio eliminado" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar el portafolio porque tiene posiciones u otros registros asociados" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};
