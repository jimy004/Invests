import * as PortfolioSnapshot from "../models/portfoliosnapshot.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getAllPortfolioSnapshots();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getPortfolioSnapshotById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPortafolio = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getSnapshotsByPortafolio(req.params.portafolio_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getSnapshotsByUsuario(req.params.usuario_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPortafolioPeriodo = async (req, res) => {
  try {
    const { portafolio_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        message: "fecha_inicio y fecha_fin son requeridos" 
      });
    }
    
    const [rows] = await PortfolioSnapshot.getSnapshotsByPortafolioPeriodo(
      portafolio_id, 
      fecha_inicio, 
      fecha_fin
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuarioPeriodo = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        message: "fecha_inicio y fecha_fin son requeridos" 
      });
    }
    
    const [rows] = await PortfolioSnapshot.getSnapshotsByUsuarioPeriodo(
      usuario_id, 
      fecha_inicio, 
      fecha_fin
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUltimoByPortafolio = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getUltimoSnapshotByPortafolio(req.params.portafolio_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron snapshots para este portafolio" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUltimoByUsuario = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getUltimoSnapshotByUsuario(req.params.usuario_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron snapshots para este usuario" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    
    if (!fecha) {
      return res.status(400).json({ 
        message: "La fecha es requerida" 
      });
    }
    
    const [rows] = await PortfolioSnapshot.getSnapshotsByFecha(fecha);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEstadisticasByPortafolio = async (req, res) => {
  try {
    const [rows] = await PortfolioSnapshot.getEstadisticasPortafolio(req.params.portafolio_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron estadísticas para este portafolio" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { portafolio_id, fecha, valor } = req.body;
    
    // Validaciones
    if (!portafolio_id || valor === undefined) {
      return res.status(400).json({ 
        message: "portafolio_id y valor son requeridos" 
      });
    }
    
    if (valor < 0) {
      return res.status(400).json({ 
        message: "El valor no puede ser negativo" 
      });
    }
    
    const [result] = await PortfolioSnapshot.createPortfolioSnapshot({ 
      portafolio_id, 
      fecha, 
      valor 
    });
    
    // Obtener el snapshot creado
    const [snapshotCreado] = await PortfolioSnapshot.getPortfolioSnapshotById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...snapshotCreado[0],
      message: "Snapshot de portafolio creado exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El portafolio especificado no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const createMultiple = async (req, res) => {
  try {
    const { snapshots } = req.body;
    
    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return res.status(400).json({ 
        message: "Se requiere un array de snapshots" 
      });
    }
    
    // Validar cada snapshot
    for (const snapshot of snapshots) {
      if (!snapshot.portafolio_id || snapshot.valor === undefined) {
        return res.status(400).json({ 
          message: "Cada snapshot debe tener portafolio_id y valor" 
        });
      }
      if (snapshot.valor < 0) {
        return res.status(400).json({ 
          message: "El valor no puede ser negativo" 
        });
      }
    }
    
    const [result] = await PortfolioSnapshot.createMultiplePortfolioSnapshots(snapshots);
    
    res.status(201).json({
      affectedRows: result.affectedRows,
      message: `${result.affectedRows} snapshots creados exitosamente`
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "Uno o más portafolios especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const generarSnapshot = async (req, res) => {
  try {
    const { portafolio_id } = req.params;
    const { fecha } = req.query;
    
    const snapshot = await PortfolioSnapshot.generarSnapshotPortafolio(portafolio_id, fecha);
    
    res.status(201).json({
      ...snapshot,
      message: "Snapshot generado exitosamente"
    });
  } catch (err) {
    if (String(err?.message || "").toLowerCase().includes("portafolio no encontrado")) {
      return res.status(404).json({ message: "Portafolio no encontrado" });
    }
    res.status(500).json({ error: err.message });
  }
};

export const generarSnapshotsTodos = async (req, res) => {
  try {
    const { fecha } = req.query;
    
    const snapshots = await PortfolioSnapshot.generarSnapshotsTodosPortafolios(fecha);
    
    res.status(201).json({
      total_snapshots: snapshots.length,
      snapshots,
      message: `${snapshots.length} snapshots generados exitosamente`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await PortfolioSnapshot.updatePortfolioSnapshot(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el snapshot actualizado
    const [snapshotActualizado] = await PortfolioSnapshot.getPortfolioSnapshotById(req.params.id);
    
    res.json({
      ...snapshotActualizado[0],
      message: "Snapshot de portafolio actualizado"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El portafolio especificado no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await PortfolioSnapshot.deletePortfolioSnapshot(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Snapshot de portafolio eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeByPortafolio = async (req, res) => {
  try {
    const [result] = await PortfolioSnapshot.deleteSnapshotsByPortafolio(req.params.portafolio_id);
    res.json({ 
      message: `${result.affectedRows} snapshots eliminados para el portafolio`,
      affectedRows: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
