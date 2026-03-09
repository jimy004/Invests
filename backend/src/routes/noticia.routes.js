import { Router } from "express";
import * as controller from "../controllers/noticia.controller.js";
import { requireAuthUser } from "../middlewares/ownership.middleware.js";

const router = Router();

router.get("/yahoo", requireAuthUser, controller.getYahooDigest);

export default router;
