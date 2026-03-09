import { Router } from "express";
import * as controller from "../controllers/snapshotconfig.controller.js";
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
router.put(
  "/usuario/:usuario_id",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth("usuario_id"),
  controller.upsertByUsuario
);

export default router;

