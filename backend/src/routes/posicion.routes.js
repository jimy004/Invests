import { Router } from "express";
import * as controller from "../controllers/posicion.controller.js";
import {
  ensurePortafolioBodyOwned,
  ensurePortafolioParamOwned,
  ensurePosicionParamOwned,
  ensureUsuarioParamMatchesAuth,
  requireAuthUser
} from "../middlewares/ownership.middleware.js";

const router = Router();

router.get("/", requireAuthUser, controller.getAll);
router.get("/portafolio/:portafolio_id", requireAuthUser, ensurePortafolioParamOwned(), controller.getByPortafolio);
router.get("/usuario/:usuario_id", requireAuthUser, ensureUsuarioParamMatchesAuth(), controller.getByUsuario);
router.get("/activo/:activo_id", requireAuthUser, controller.getByActivo);
router.get("/portafolio/:portafolio_id/resumen", requireAuthUser, ensurePortafolioParamOwned(), controller.getResumenByPortafolio);
router.get("/usuario/:usuario_id/resumen", requireAuthUser, ensureUsuarioParamMatchesAuth(), controller.getResumenByUsuario);
router.get("/:id", requireAuthUser, ensurePosicionParamOwned(), controller.getOne);
router.post("/", requireAuthUser, ensurePortafolioBodyOwned(), controller.create);
router.put("/:id", requireAuthUser, ensurePosicionParamOwned(), ensurePortafolioBodyOwned(), controller.update);
router.patch("/:id/cantidad", requireAuthUser, ensurePosicionParamOwned(), controller.updateCantidad);
router.patch("/:id/precio", requireAuthUser, ensurePosicionParamOwned(), controller.updatePrecio);
router.patch("/:id/incrementar", requireAuthUser, ensurePosicionParamOwned(), controller.incrementar);
router.patch("/:id/decrementar", requireAuthUser, ensurePosicionParamOwned(), controller.decrementar);
router.delete("/:id", requireAuthUser, ensurePosicionParamOwned(), controller.remove);

export default router;
