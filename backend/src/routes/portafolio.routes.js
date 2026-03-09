import { Router } from "express";
import * as controller from "../controllers/portafolio.controller.js";
import {
  ensurePortafolioIdParamOwned,
  ensureUsuarioBodyMatchesAuth,
  ensureUsuarioParamMatchesAuth,
  requireAuthUser
} from "../middlewares/ownership.middleware.js";

const router = Router();

router.get("/", requireAuthUser, controller.getAll);
router.get("/usuario/:usuario_id", requireAuthUser, ensureUsuarioParamMatchesAuth(), controller.getByUsuario);
router.get("/:id", requireAuthUser, ensurePortafolioIdParamOwned(), controller.getOne);
router.post("/", requireAuthUser, ensureUsuarioBodyMatchesAuth(), controller.create);
router.put("/:id", requireAuthUser, ensurePortafolioIdParamOwned(), ensureUsuarioBodyMatchesAuth(), controller.update);
router.delete("/:id", requireAuthUser, ensurePortafolioIdParamOwned(), controller.remove);

export default router;
