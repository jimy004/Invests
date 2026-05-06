import { Router } from "express";
import { requireAuthUser } from "../middlewares/ownership.middleware.js";
import * as ctrl from "../controllers/benchmark.controller.js";

const router = Router();
router.use(requireAuthUser);

router.get("/historico", ctrl.getHistorico);
router.get("/lista", ctrl.getBenchmarks);

export default router;
