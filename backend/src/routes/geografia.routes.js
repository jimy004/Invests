import { Router } from "express";
import * as controller from "../controllers/geografia.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/:id/fondos", controller.getFondos);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;