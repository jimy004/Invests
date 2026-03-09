import { Router } from "express";
import * as controller from "../controllers/posicionsnapshot.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/posicion/:posicion_id", controller.getByPosicion);
router.get("/portafolio/:portafolio_id", controller.getByPortafolio);
router.get("/usuario/:usuario_id", controller.getByUsuario);
router.get("/activo/:activo_id", controller.getByActivo);
router.get("/posicion/:posicion_id/periodo", controller.getByPosicionPeriodo);
router.get("/portafolio/:portafolio_id/fecha/:fecha", controller.getByPortafolioFecha);
router.get("/portafolio/:portafolio_id/fecha/:fecha/resumen", controller.getResumenPortafolioFecha);
router.get("/posicion/:posicion_id/ultimo", controller.getUltimoByPosicion);
router.get("/fecha/:fecha", controller.getByFecha);
router.get("/posicion/:posicion_id/estadisticas", controller.getEstadisticasByPosicion);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.post("/multiple", controller.createMultiple);
router.post("/generar/:posicion_id", controller.generarSnapshot);
router.post("/generar-portafolio/:portafolio_id", controller.generarSnapshotsPortafolio);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.delete("/posicion/:posicion_id", controller.removeByPosicion);

export default router;