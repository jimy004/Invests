import { Router } from "express";
import * as controller from "../controllers/activo.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/categoria/:categoria_id", controller.getByCategoria);
router.post("/recategorizar", controller.recategorizar);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.post("/import-yahoo", controller.importFromYahoo);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
