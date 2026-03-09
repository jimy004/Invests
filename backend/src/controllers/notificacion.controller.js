import * as Notificacion from "../models/notificacion.model.js";

export const getByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const onlyUnread =
      String(req.query.only_unread || req.query.solo_no_leidas || "0").toLowerCase() === "1" ||
      String(req.query.only_unread || req.query.solo_no_leidas || "").toLowerCase() === "true";
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);

    const [rows] = await Notificacion.getNotificacionesByUsuario(usuarioId, onlyUnread, limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadCountByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const [rows] = await Notificacion.countUnreadByUsuario(usuarioId);
    res.json(rows[0] || { unread_count: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllReadByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const [result] = await Notificacion.markAllReadByUsuario(usuarioId);
    res.json({
      message: "Notificaciones marcadas como leidas",
      affectedRows: result.affectedRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const usuarioId = req.authUserId;
    const [result] = await Notificacion.markReadById(notificationId, usuarioId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notificacion no encontrada" });
    }
    res.json({ message: "Notificacion marcada como leida" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const [result] = await Notificacion.deleteAllByUsuario(usuarioId);
    res.json({
      message: "Notificaciones eliminadas",
      affectedRows: result.affectedRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
