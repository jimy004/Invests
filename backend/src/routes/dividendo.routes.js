import { Router } from "express";
import { requireAuthUser, ensureUsuarioParamMatchesAuth, ensurePortafolioParamOwned } from "../middlewares/ownership.middleware.js";
import * as ctrl from "../controllers/dividendo.controller.js";

const router = Router();
router.use(requireAuthUser);

router.get("/portafolio/:portafolio_id", ensurePortafolioParamOwned("portafolio_id"), ctrl.getByPortafolio);
router.get("/usuario/:usuario_id", ensureUsuarioParamMatchesAuth("usuario_id"), ctrl.getByUsuario);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
