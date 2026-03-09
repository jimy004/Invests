import * as SnapshotConfig from "../models/snapshotconfig.model.js";

export const getByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const [rows] = await SnapshotConfig.getOrCreateSnapshotConfigByUsuario(usuarioId);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const upsertByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const enabled = req.body.enabled ? 1 : 0;
    const intervalPortafolio = Number(req.body.interval_portafolio_minutes);
    const intervalPosicion = Number(req.body.interval_posicion_minutes);

    if (!Number.isInteger(intervalPortafolio) || intervalPortafolio < 5) {
      return res.status(400).json({
        message: "interval_portafolio_minutes debe ser un entero mayor o igual a 5"
      });
    }

    if (!Number.isInteger(intervalPosicion) || intervalPosicion < 5) {
      return res.status(400).json({
        message: "interval_posicion_minutes debe ser un entero mayor o igual a 5"
      });
    }

    await SnapshotConfig.upsertSnapshotConfigByUsuario(usuarioId, {
      enabled,
      interval_portafolio_minutes: intervalPortafolio,
      interval_posicion_minutes: intervalPosicion
    });

    const [rows] = await SnapshotConfig.getSnapshotConfigByUsuario(usuarioId);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });

    res.json({
      ...rows[0],
      message: "Configuracion de snapshots actualizada"
    });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "El usuario especificado no existe" });
    }
    res.status(500).json({ error: err.message });
  }
};

