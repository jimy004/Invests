import { Router } from "express";
import * as controller from "../controllers/cashflow.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/usuario/:usuario_id", controller.getByUsuario);
router.get("/usuario/:usuario_id/resumen", controller.getResumenUsuario);
router.get("/usuario/:usuario_id/resumen-periodo", controller.getResumenUsuarioPeriodo);
router.get("/usuario/:usuario_id/tipo/:tipo", controller.getByUsuarioTipo);
router.get("/usuario/:usuario_id/periodo", controller.getByUsuarioPeriodo);
router.get("/tipo/:tipo", controller.getByTipo);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;