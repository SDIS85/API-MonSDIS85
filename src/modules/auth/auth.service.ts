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
  // Sera ajouté lors de l'implémentation de la gestion des tokens dans API-016.
  accessToken?: string;
}

// Transforme un utilisateur LDAP en utilisateur exposable par l'API.
function mapLdapUserToAuthenticatedUser(ldapUser: LdapUser): AuthenticatedUser {

  // TODO :
  // Ajouter / retirer des champs selon ce qu'on souhaite recevoir dans l'appli
  // Token du téléphone pour notif phoneKey : string[]

  return {
    username: ldapUser.username,
    displayName: ldapUser.displayName,
    firstName: ldapUser.firstName,
    lastName: ldapUser.lastName,
    email: ldapUser.email,
  };
}

// Ce fichier orchestre l'authentification
async function login(username: string, password: string): Promise<LoginResult> {

  const ldapUser = await ldapService.authenticate(username, password);
  const user = mapLdapUserToAuthenticatedUser(ldapUser);

  // TODO : 
  // rechercher l'Agent correspondant dans MariaDB
  // vérifier que l'Agent est bien autorisé à utiliser l'application
  // mapper les données LDAP / Agent vers un objet propre à l'API
  // générer un access token

  return { user };
}

export const authService = {
  login,
};
