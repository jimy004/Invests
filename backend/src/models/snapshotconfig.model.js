import pool from "../db.js";

export const getSnapshotConfigByUsuario = (usuario_id) =>
  pool.query(
    `SELECT sc.*, u.nombre AS usuario_nombre
     FROM SnapshotConfig sc
     LEFT JOIN Usuario u ON sc.usuario_id = u.id
     WHERE sc.usuario_id=?`,
    [usuario_id]
  );

export const getOrCreateSnapshotConfigByUsuario = async (usuario_id) => {
  await pool.query("INSERT IGNORE INTO SnapshotConfig(usuario_id) VALUES(?)", [usuario_id]);
  return getSnapshotConfigByUsuario(usuario_id);
};

export const upsertSnapshotConfigByUsuario = (
  usuario_id,
  { enabled, interval_portafolio_minutes, interval_posicion_minutes }
) =>
  pool.query(
    `INSERT INTO SnapshotConfig(usuario_id, enabled, interval_portafolio_minutes, interval_posicion_minutes)
     VALUES(?,?,?,?)
     ON DUPLICATE KEY UPDATE
       enabled=VALUES(enabled),
       interval_portafolio_minutes=VALUES(interval_portafolio_minutes),
       interval_posicion_minutes=VALUES(interval_posicion_minutes),
       updated_at=CURRENT_TIMESTAMP`,
    [usuario_id, enabled, interval_portafolio_minutes, interval_posicion_minutes]
  );

export const getEnabledSnapshotConfigs = () =>
  pool.query(
    `SELECT *
     FROM SnapshotConfig
     WHERE enabled=1`
  );

export const updateLastRunPortafolio = (usuario_id) =>
  pool.query(
    "UPDATE SnapshotConfig SET last_run_portafolio=CURRENT_TIMESTAMP WHERE usuario_id=?",
    [usuario_id]
  );

export const updateLastRunPosicion = (usuario_id) =>
  pool.query(
    "UPDATE SnapshotConfig SET last_run_posicion=CURRENT_TIMESTAMP WHERE usuario_id=?",
    [usuario_id]
  );

