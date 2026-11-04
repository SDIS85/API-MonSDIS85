import { ldapService, type LdapUser } from "./ldap.service.js";

export interface AuthenticatedUser {
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface LoginResult {
  user: AuthenticatedUser;

  /**
   * Sera ajouté lors de l'implémentation de la gestion
   * des tokens dans API-016.
   */
  accessToken?: string;
}

/**
 * Transforme un utilisateur LDAP en utilisateur exposable
 * par l'API.
 *
 * On évite ainsi de renvoyer directement l'objet LDAP brut
 * au client Flutter.
 */
function mapLdapUserToAuthenticatedUser(ldapUser: LdapUser): AuthenticatedUser {
  // TODO :
  // Ajouter / retirer des champs selon ce qu'on souhaite recevoir dans l'appli

  return {
    username: ldapUser.username,
    displayName: ldapUser.displayName,
    firstName: ldapUser.firstName,
    lastName: ldapUser.lastName,
    email: ldapUser.email,
  };
}

/**
 * Service principal d'authentification.
 *
 * Ce fichier orchestre l'authentification mais ne doit pas
 * manipuler directement le client LDAP.
 */
async function login(username: string, password: string): Promise<LoginResult> {
  // TODO:
  // 1. appeler ldapService.authenticate(username, password)
  //
  // 2. récupérer l'utilisateur LDAP authentifié
  //
  // 3. plus tard :
  //    rechercher l'Agent correspondant dans MariaDB
  //
  // 4. vérifier que l'Agent est bien autorisé à utiliser l'application
  //
  // 5. mapper les données LDAP / Agent vers un objet propre à l'API
  //
  // 6. plus tard :
  //    générer un access token
  //
  // 7. retourner un LoginResult
  //
  // Attention :
  // - ne jamais retourner le mot de passe
  // - ne jamais exposer bindDn / bindPassword
  // - ne pas retourner l'objet LDAP brut

  void username;
  void password;

  throw new Error("TODO: implémenter le service d'authentification");
}

export const authService = {
  login,
};
