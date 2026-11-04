import { Router } from "express";

import { authController } from "./auth.controller.js";

const router = Router();

/**
 * POST /api/auth/login
 *
 * Authentifie un utilisateur via LDAPS.
 */
router.post(
  "/login",
  // TODO:
  // - ajouter ici la validation du body quand elle sera mise en place
  // - ajouter éventuellement un rate limiter spécifique au login
  authController.login,
);

export default router;
