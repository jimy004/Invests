import { Router } from "express";
import { requireAuthUser, ensureUsuarioParamMatchesAuth } from "../middlewares/ownership.middleware.js";
import * as ctrl from "../controllers/precioalerta.controller.js";

const router = Router();
router.use(requireAuthUser);

router.get("/usuario/:usuario_id", ensureUsuarioParamMatchesAuth("usuario_id"), ctrl.getByUsuario);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
