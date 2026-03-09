import * as PosicionSnapshot from "../models/posicionsnapshot.model.js";

export const getAll = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getAllPosicionSnapshots();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getPosicionSnapshotById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPosicion = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getSnapshotsByPosicion(req.params.posicion_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPortafolio = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getSnapshotsByPortafolio(req.params.portafolio_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getSnapshotsByUsuario(req.params.usuario_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByActivo = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getSnapshotsByActivo(req.params.activo_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPosicionPeriodo = async (req, res) => {
  try {
    const { posicion_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        message: "fecha_inicio y fecha_fin son requeridos" 
      });
    }
    
    const [rows] = await PosicionSnapshot.getSnapshotsByPosicionPeriodo(
      posicion_id, 
      fecha_inicio, 
      fecha_fin
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPortafolioFecha = async (req, res) => {
  try {
    const { portafolio_id, fecha } = req.params;
    
    if (!fecha) {
      return res.status(400).json({ 
        message: "La fecha es requerida" 
      });
    }
    
    const [rows] = await PosicionSnapshot.getSnapshotsByPortafolioFecha(portafolio_id, fecha);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUltimoByPosicion = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getUltimoSnapshotByPosicion(req.params.posicion_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron snapshots para esta posición" });
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
    
    const [rows] = await PosicionSnapshot.getSnapshotsByFecha(fecha);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEstadisticasByPosicion = async (req, res) => {
  try {
    const [rows] = await PosicionSnapshot.getEstadisticasPosicion(req.params.posicion_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron estadísticas para esta posición" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenPortafolioFecha = async (req, res) => {
  try {
    const { portafolio_id, fecha } = req.params;
    
    if (!fecha) {
      return res.status(400).json({ 
        message: "La fecha es requerida" 
      });
    }
    
    const [rows] = await PosicionSnapshot.getResumenPortafolioFecha(portafolio_id, fecha);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron snapshots para este portafolio en la fecha especificada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { posicion_id, fecha, valor, cantidad } = req.body;
    
    // Validaciones
    if (!posicion_id || valor === undefined || cantidad === undefined) {
      return res.status(400).json({ 
        message: "posicion_id, valor y cantidad son requeridos" 
      });
    }
    
    if (valor < 0 || cantidad < 0) {
      return res.status(400).json({ 
        message: "El valor y la cantidad no pueden ser negativos" 
      });
    }
    
    const [result] = await PosicionSnapshot.createPosicionSnapshot({ 
      posicion_id, 
      fecha, 
      valor, 
      cantidad 
    });
    
    // Obtener el snapshot creado
    const [snapshotCreado] = await PosicionSnapshot.getPosicionSnapshotById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...snapshotCreado[0],
      message: "Snapshot de posición creado exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "La posición especificada no existe" 
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
      if (!snapshot.posicion_id || snapshot.valor === undefined || snapshot.cantidad === undefined) {
        return res.status(400).json({ 
          message: "Cada snapshot debe tener posicion_id, valor y cantidad" 
        });
      }
      if (snapshot.valor < 0 || snapshot.cantidad < 0) {
        return res.status(400).json({ 
          message: "El valor y la cantidad no pueden ser negativos" 
        });
      }
    }
    
    const [result] = await PosicionSnapshot.createMultiplePosicionSnapshots(snapshots);
    
    res.status(201).json({
      affectedRows: result.affectedRows,
      message: `${result.affectedRows} snapshots creados exitosamente`
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "Una o más posiciones especificadas no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const generarSnapshot = async (req, res) => {
  try {
    const { posicion_id } = req.params;
    const { fecha } = req.query;
    
    const snapshot = await PosicionSnapshot.generarSnapshotPosicion(posicion_id, fecha);
    
    res.status(201).json({
      ...snapshot,
      message: snapshot.actualizado 
        ? "Snapshot actualizado exitosamente" 
        : "Snapshot generado exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const generarSnapshotsPortafolio = async (req, res) => {
  try {
    const { portafolio_id } = req.params;
    const { fecha } = req.query;
    
    const snapshots = await PosicionSnapshot.generarSnapshotsTodasPosicionesPortafolio(portafolio_id, fecha);
    
    const actualizados = snapshots.filter(s => s.actualizado).length;
    const nuevos = snapshots.length - actualizados;
    
    res.status(201).json({
      total_snapshots: snapshots.length,
      actualizados,
      nuevos,
      snapshots,
      message: `${snapshots.length} snapshots procesados (${nuevos} nuevos, ${actualizados} actualizados)`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await PosicionSnapshot.updatePosicionSnapshot(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el snapshot actualizado
    const [snapshotActualizado] = await PosicionSnapshot.getPosicionSnapshotById(req.params.id);
    
    res.json({
      ...snapshotActualizado[0],
      message: "Snapshot de posición actualizado"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "La posición especificada no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await PosicionSnapshot.deletePosicionSnapshot(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Snapshot de posición eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeByPosicion = async (req, res) => {
  try {
    const [result] = await PosicionSnapshot.deleteSnapshotsByPosicion(req.params.posicion_id);
    res.json({ 
      message: `${result.affectedRows} snapshots eliminados para la posición`,
      affectedRows: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};