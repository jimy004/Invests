import { Router } from "express";
import * as controller from "../controllers/resumen.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/usuario/:usuario_id", controller.getByUsuario);
router.get("/usuario/:usuario_id/agregado", controller.getAgregadoUsuario);
router.get("/usuario/:usuario_id/categoria/:categoria_id", controller.getByUsuarioCategoria);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.patch("/:id/peso", controller.updatePeso);
router.patch("/:id/inversion", controller.updateInversion);
router.delete("/:id", controller.remove);

export default router;