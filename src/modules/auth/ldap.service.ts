import fs from "node:fs";

import { Client, type Entry } from "ldapts";

import { env } from "../../config/env.js";

export interface LdapUser {
  dn: string;
  username: string;
  registrationNumber: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  memberOf: string[];
}

export class LdapAuthenticationError extends Error {
  constructor(message = "Identifiants incorrects") {
    super(message);
    this.name = "LdapAuthenticationError";
  }
}

export class LdapAuthorizationError extends Error {
  constructor(message = "Utilisateur non autorisé") {
    super(message);
    this.name = "LdapAuthorizationError";
  }
}

export class LdapUnavailableError extends Error {
  constructor(message = "Service LDAP indisponible") {
    super(message);
    this.name = "LdapUnavailableError";
  }
}

/**
 * Crée un client LDAP configuré pour un serveur donné.
 */
function createLdapClient(url: string): Client {
  const ca = env.ldap.caCertPath
    ? [fs.readFileSync(env.ldap.caCertPath)]
    : undefined;

  return new Client({
    url,
    connectTimeout: env.ldap.connectTimeout,
    timeout: env.ldap.timeout,

    tlsOptions: env.ldap.requireTls
      ? {
          minVersion: "TLSv1.2",
          ca,
          rejectUnauthorized: true,
        }
      : undefined,
  });
}

/**
 * Échappe les caractères spéciaux autorisés dans une valeur de filtre LDAP.
 *
 * Permet notamment d'éviter qu'un username fourni par l'utilisateur
 * modifie la structure du filtre LDAP.
 */
function escapeLdapFilterValue(value: string): string {
  return value
    .replace(/\\/g, "\\5c")
    .replace(/\*/g, "\\2a")
    .replace(/\(/g, "\\28")
    .replace(/\)/g, "\\29")
    .replace(/\0/g, "\\00");
}

/**
 * Construit le filtre LDAP à partir du template défini dans le .env.
 *
 * Exemple :
 * LDAP_USER_FILTER=(sAMAccountName={{username}})
 */
function buildUserFilter(username: string): string {
  const escapedUsername = escapeLdapFilterValue(username);

  return env.ldap.userFilter.replace("{{username}}", escapedUsername);
}

/**
 * Normalise un attribut LDAP censé contenir une chaîne.
 */
function normalizeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

/**
 * Certains attributs LDAP peuvent être retournés comme une chaîne unique
 * ou comme un tableau selon le nombre de valeurs.
 */
function normalizeStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

/**
 * Transforme une Entry LDAP brute en objet utilisable par notre application.
 */
function mapLdapEntry(entry: Entry, memberOf: string[] = []): LdapUser {
  const employeeId = normalizeString(entry.employeeID)?.trim();
  const initials = normalizeString(entry.initials)?.trim();

  return {
    dn: entry.dn,

    username:
      normalizeString(entry.sAMAccountName) ?? normalizeString(entry.uid) ?? "",

    registrationNumber: employeeId || initials || "",

    displayName: normalizeString(entry.displayName),
    firstName: normalizeString(entry.givenName),
    lastName: normalizeString(entry.sn),
    email: normalizeString(entry.mail),

    memberOf,
  };
}

/**
 * Recherche un utilisateur dans Active Directory.
 */
async function findUserWithClient(
  client: Client,
  username: string,
): Promise<LdapUser | null> {
  const filter = buildUserFilter(username);

  // TODO:
  //
  // Effectuer une recherche dans env.ldap.baseDn.
  //
  // Paramètres attendus :
  // - scope : "sub"
  // - filter : celui construit ci-dessus
  //
  // Attributs utiles :
  // - distinguishedName
  // - sAMAccountName
  // - displayName
  // - givenName
  // - sn
  // - mail
  // - employeeID
  // - initials
  //
  // La recherche doit permettre de déterminer :
  // - le DN utilisateur ;
  // - son login ;
  // - son matricule ;
  // - son identité.
  //
  // Une fois l'utilisateur trouvé :
  // - récupérer ses groupes avec getTransitiveGroups()
  // - utiliser mapLdapEntry()
  //
  // Attention :
  // un utilisateur sans matricule ne doit pas pouvoir
  // être considéré comme un utilisateur Mon SDIS85 valide.

  throw new Error(
    `TODO: rechercher l'utilisateur LDAP avec le filtre ${filter}`,
  );
}

/**
 * Vérifie que l'utilisateur appartient à l'un des groupes LDAP autorisés.
 */
function isAllowedUser(user: LdapUser): boolean {
  // TODO:
  // - si aucun groupe n'est configuré, décider du comportement souhaité
  // - comparer user.memberOf avec env.ldap.allowedGroups
  // - effectuer la comparaison sans tenir compte de la casse
  // - retourner true si au moins un groupe correspond

  void user;

  throw new Error(
    "TODO: vérifier l'appartenance de l'utilisateur aux groupes autorisés",
  );
}

/**
 * Récupère tous les groupes Active Directory auxquels appartient
 * l'utilisateur, y compris via des groupes imbriqués.
 */
async function getTransitiveGroups(
  client: Client,
  userDn: string,
): Promise<string[]> {
  // TODO:
  // - échapper userDn avec escapeLdapFilterValue()
  //
  // - rechercher les objets de type "group"
  //
  // - utiliser la règle de correspondance Active Directory
  //   permettant de retrouver les appartenances transitives
  //
  // - récupérer uniquement "distinguishedName"
  //
  // - retourner un tableau de DN de groupes
  //
  // Indice :
  // l'ancien projet utilisait la matching rule AD :
  //
  // 1.2.840.113556.1.4.1941
  //
  // Le filtre devra rechercher les groupes dont l'utilisateur
  // est membre directement ou indirectement.

  void client;
  void userDn;

  throw new Error("TODO: récupérer les groupes LDAP transitifs");
}

/**
 * Tente d'authentifier l'utilisateur sur un serveur LDAP précis.
 */
async function authenticateOnServer(
  url: string,
  username: string,
  password: string,
): Promise<LdapUser> {
  // TODO:
  // 1. créer un client LDAP avec createLdapClient(url)
  //
  // 2. effectuer un bind avec :
  //    - env.ldap.bindDn
  //    - env.ldap.bindPassword
  //
  // 3. rechercher l'utilisateur avec findUserWithClient()
  //
  // 4. si l'utilisateur n'existe pas :
  //    lancer LdapAuthenticationError
  //
  // 5. vérifier ses groupes avec isAllowedUser()
  //
  // 6. créer un SECOND client LDAP
  //
  // 7. effectuer un bind avec :
  //    - le DN réel de l'utilisateur
  //    - le mot de passe fourni
  //
  // 8. en cas d'échec :
  //    lancer LdapAuthenticationError
  //
  // 9. effectuer systématiquement les unbind()
  //    même lorsqu'une erreur survient
  //
  // 10. retourner le LdapUser

  void url;
  void username;
  void password;

  throw new Error("TODO: implémenter l'authentification sur un serveur LDAP");
}

/**
 * Point d'entrée public du service LDAP.
 *
 * Gère notamment le failover entre les différents serveurs LDAP
 * configurés dans LDAP_URLS.
 */
async function authenticate(
  username: string,
  password: string,
): Promise<LdapUser> {
  // TODO:
  // - vérifier que username et password ne sont pas vides
  //
  // - parcourir env.ldap.urls dans l'ordre
  //
  // - appeler authenticateOnServer() pour chaque serveur
  //
  // - ne PAS essayer un autre serveur lorsqu'on obtient :
  //      LdapAuthenticationError
  //      LdapAuthorizationError
  //
  // - tenter le serveur suivant uniquement lorsqu'il s'agit
  //   d'une erreur technique / serveur indisponible
  //
  // - si aucun serveur ne fonctionne :
  //   lancer LdapUnavailableError
  //
  // Attention :
  // ne jamais logger le mot de passe fourni.

  void username;
  void password;

  throw new Error("TODO: implémenter l'authentification LDAP avec failover");
}

export const ldapService = {
  authenticate,
};
