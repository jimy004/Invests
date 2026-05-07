import { Router } from "express";
import * as controller from "../controllers/usuario.controller.js";
import {
  ensureUsuarioParamMatchesAuth,
  requireAuthUser
} from "../middlewares/ownership.middleware.js";

const router = Router();

router.post("/login", controller.login);
router.post("/refresh", controller.refreshToken);
router.post("/logout", controller.logout);
router.post("/", controller.create);
router.get("/me", requireAuthUser, controller.getMe);
router.get("/", requireAuthUser, controller.getAll);
router.get("/:id", requireAuthUser, ensureUsuarioParamMatchesAuth("id"), controller.getOne);
router.put("/:id", requireAuthUser, ensureUsuarioParamMatchesAuth("id"), controller.update);
router.put("/:id/password", requireAuthUser, ensureUsuarioParamMatchesAuth("id"), controller.changePassword);
router.delete("/:id", requireAuthUser, ensureUsuarioParamMatchesAuth("id"), controller.remove);

export default router;
