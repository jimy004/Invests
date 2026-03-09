import { Router } from "express";
import * as controller from "../controllers/detallesaccion.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/search", controller.search);
router.get("/activo/:activo_id", controller.getByActivo);
router.get("/sector/:sector_id", controller.getBySector);
router.get("/resumen-sector", controller.getResumenBySector);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.post("/get-or-create", controller.getOrCreate);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.delete("/activo/:activo_id", controller.removeByActivo);

export default router;