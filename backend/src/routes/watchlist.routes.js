import { Router } from "express";
import { requireAuthUser, ensureUsuarioParamMatchesAuth } from "../middlewares/ownership.middleware.js";
import * as ctrl from "../controllers/watchlist.controller.js";

const router = Router();
router.use(requireAuthUser);

router.get("/usuario/:usuario_id", ensureUsuarioParamMatchesAuth("usuario_id"), ctrl.getByUsuario);
router.post("/", ctrl.create);
router.patch("/:id/nota", ctrl.updateNota);
router.delete("/:id", ctrl.remove);

export default router;
