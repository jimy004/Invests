import { Router } from "express";
import * as controller from "../controllers/detallesfondo.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/search", controller.search);
router.get("/activo/:activo_id", controller.getByActivo);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;