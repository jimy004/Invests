import pool from "../db.js";

export const createNotificacion = ({ usuario_id, tipo, mensaje }) =>
  pool.query(
    "INSERT INTO Notificacion(usuario_id, tipo, mensaje) VALUES(?,?,?)",
    [usuario_id, tipo, mensaje]
  );

export const getNotificacionesByUsuario = (usuario_id, onlyUnread = false, limit = 50) =>
  pool.query(
    `SELECT *
     FROM Notificacion
     WHERE usuario_id=? ${onlyUnread ? "AND leida=0" : ""}
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [usuario_id, Number(limit)]
  );

export const countUnreadByUsuario = (usuario_id) =>
  pool.query(
    `SELECT COUNT(*) AS unread_count
     FROM Notificacion
     WHERE usuario_id=? AND leida=0`,
    [usuario_id]
  );

export const markAllReadByUsuario = (usuario_id) =>
  pool.query(
    `UPDATE Notificacion
     SET leida=1, read_at=CURRENT_TIMESTAMP
     WHERE usuario_id=? AND leida=0`,
    [usuario_id]
  );

export const markReadById = (id, usuario_id) =>
  pool.query(
    `UPDATE Notificacion
     SET leida=1, read_at=CURRENT_TIMESTAMP
     WHERE id=? AND usuario_id=?`,
    [id, usuario_id]
  );

export const deleteAllByUsuario = (usuario_id) =>
  pool.query(
    `DELETE FROM Notificacion
     WHERE usuario_id=?`,
    [usuario_id]
  );
