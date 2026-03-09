import { Router } from "express";
import * as controller from "../controllers/orden.controller.js";
import {
  ensureOrdenParamOwned,
  ensurePortafolioParamOwned,
  ensurePosicionBodyOwned,
  ensurePosicionParamOwned,
  ensureUsuarioParamMatchesAuth,
  requireAuthUser
} from "../middlewares/ownership.middleware.js";

const router = Router();

router.get("/", requireAuthUser, controller.getAll);
router.get(
  "/posicion/:posicion_id",
  requireAuthUser,
  ensurePosicionParamOwned("posicion_id"),
  controller.getByPosicion
);
router.get(
  "/portafolio/:portafolio_id",
  requireAuthUser,
  ensurePortafolioParamOwned(),
  controller.getByPortafolio
);
router.get(
  "/usuario/:usuario_id",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth(),
  controller.getByUsuario
);
router.get("/activo/:activo_id", requireAuthUser, controller.getByActivo);
router.get("/tipo/:tipo", requireAuthUser, controller.getByTipo);
router.get("/periodo", requireAuthUser, controller.getByPeriodo);
router.get(
  "/portafolio/:portafolio_id/resumen",
  requireAuthUser,
  ensurePortafolioParamOwned(),
  controller.getResumenByPortafolio
);
router.get(
  "/usuario/:usuario_id/resumen",
  requireAuthUser,
  ensureUsuarioParamMatchesAuth(),
  controller.getResumenByUsuario
);
router.get("/ultimo-numero", requireAuthUser, controller.getUltimoNumero);
router.get("/:id", requireAuthUser, ensureOrdenParamOwned(), controller.getOne);
router.post("/", requireAuthUser, ensurePosicionBodyOwned(), controller.create);
router.post("/ejecutar-compra", requireAuthUser, ensurePosicionBodyOwned(), controller.ejecutarCompra);
router.post("/ejecutar-venta", requireAuthUser, ensurePosicionBodyOwned(), controller.ejecutarVenta);
router.put("/:id", requireAuthUser, ensureOrdenParamOwned(), controller.update);
router.delete("/:id", requireAuthUser, ensureOrdenParamOwned(), controller.remove);

export default router;
