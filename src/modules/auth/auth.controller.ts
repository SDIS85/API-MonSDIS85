import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service.js";

interface LoginRequestBody {
  username?: string;
  password?: string;
}

// Contrôleur d'authentification.
async function login(
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({
        message: "Identifiant et mot de passe requis.",
      });
      return;
    }
    const cleanUsername = username.trim();
    const result = await authService.login(cleanUsername, password);

    res.status(200).json(result)

  } catch (error) {
    next(error);
  }
}

export const authController = {
  login,

};
