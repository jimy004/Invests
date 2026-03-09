import { Router } from "express";
import * as controller from "../controllers/portfoliosnapshot.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/portafolio/:portafolio_id", controller.getByPortafolio);
router.get("/usuario/:usuario_id", controller.getByUsuario);
router.get("/portafolio/:portafolio_id/periodo", controller.getByPortafolioPeriodo);
router.get("/usuario/:usuario_id/periodo", controller.getByUsuarioPeriodo);
router.get("/portafolio/:portafolio_id/ultimo", controller.getUltimoByPortafolio);
router.get("/usuario/:usuario_id/ultimo", controller.getUltimoByUsuario);
router.get("/fecha/:fecha", controller.getByFecha);
router.get("/portafolio/:portafolio_id/estadisticas", controller.getEstadisticasByPortafolio);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.post("/multiple", controller.createMultiple);
router.post("/generar/:portafolio_id", controller.generarSnapshot);
router.post("/generar-todos", controller.generarSnapshotsTodos);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.delete("/portafolio/:portafolio_id", controller.removeByPortafolio);

export default router;