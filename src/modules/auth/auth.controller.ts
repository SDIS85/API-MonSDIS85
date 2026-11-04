import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service.js";

interface LoginRequestBody {
  username?: string;
  password?: string;
}

/**
 * Contrôleur d'authentification.
 *
 * Il ne doit contenir aucune logique LDAP directe.
 * Toute la logique métier doit être déléguée à auth.service.ts.
 */
async function login(
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { username, password } = req.body;

    // TODO:
    // - vérifier que username et password sont présents
    // - nettoyer / normaliser le username si nécessaire
    // - appeler authService.login()
    // - retourner une réponse JSON adaptée
    //
    // Exemple de réponse future :
    //
    // {
    //   "user": {
    //     "username": "...",
    //     "displayName": "...",
    //     ...
    //   },
    //   "accessToken": "..."
    // }
    //
    // Pour l'instant, la génération du token pourra rester
    // hors scope si API-016 n'est pas encore réalisée.

    void username;
    void password;

    throw new Error("TODO: implémenter le contrôleur de connexion");
  } catch (error) {
    next(error);
  }
}

export const authController = {
  login,
};
