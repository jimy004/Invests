import { Router } from "express";
import * as controller from "../controllers/notificacion.controller.js";
import {
  ensureUsuarioParamMatchesAuth,
  requireAuthUser
} from "../middlewares/ownership.middleware.js";

const router = Router();

router.get(
  "/usuario/:usuario_id",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth("usuario_id"),
  controller.getByUsuario
);
router.get(
  "/usuario/:usuario_id/unread-count",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth("usuario_id"),
  controller.getUnreadCountByUsuario
);
router.put(
  "/usuario/:usuario_id/mark-all-read",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth("usuario_id"),
  controller.markAllReadByUsuario
);
router.delete(
  "/usuario/:usuario_id",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth("usuario_id"),
  controller.deleteAllByUsuario
);
router.put("/:id/read", requireAuthUser, controller.markRead);

export default router;
