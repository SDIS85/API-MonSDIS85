import fs from "node:fs";

import { Client, InvalidCredentialsError, type Entry } from "ldapts";

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

// Construit le filtre LDAP à partir du template défini dans le .env.
function buildUserFilter(username: string): string {
  const escapedUsername = escapeLdapFilterValue(username);

  return env.ldap.userFilter.replace("{{username}}", escapedUsername);
}

 // Normalise un attribut LDAP censé contenir une chaîne.
function normalizeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

// Certains attributs LDAP peuvent être retournés comme une chaîne unique
// ou comme un tableau selon le nombre de valeurs.
function normalizeStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

// Transforme une Entry LDAP brute en objet utilisable par notre application.
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


// Recherche un utilisateur dans Active Directory.
async function findUserWithClient(
  client: Client,
  username: string,
): Promise<LdapUser | null> {
  const filter = buildUserFilter(username);


  // Effectuer une recherche dans env.ldap.baseDn.
  const { searchEntries } = await client.search(env.ldap.baseDn, {
    scope: "sub",
    filter,
    attributes: [
      "distinguishedName",
      "sAMAccountName",
      "displayName",
      "givenName",
      "sn",
      "mail",
      "employeeID",
      "initials",
    ],
  });

  const [entry] = searchEntries;
  if (!entry) {
    console.log("Aucun utilisateur trouvé");
    return null;
  }

  // La recherche permet de déterminer :
  // - le DN utilisateur ;
  // - son login ;
  // - son matricule ;
  // - son identité.

  // - récupérer ses groupes avec getTransitiveGroups()
  const groups = await getTransitiveGroups(client, entry.dn);
  // - utiliser mapLdapEntry()
  const user = mapLdapEntry(entry, groups);

  // un utilisateur sans matricule ne doit pas pouvoir
  // être considéré comme un utilisateur Mon SDIS85 valide.
  if (!user.registrationNumber) {
    console.log("Utilisateur trouvé mais sans matricule");
    return null;
  };

  return user;

}

// Vérifie que l'utilisateur appartient à l'un des groupes LDAP autorisés.
function isAllowedUser(user: LdapUser): boolean {
  if (env.ldap.allowedGroups.length === 0) {
    return false;
  }

  // comparer user.memberOf avec env.ldap.allowedGroups
  const allowedGroups = env.ldap.allowedGroups.map((group) => group.toLowerCase());

  // retourner true si au moins un groupe correspond
  return user.memberOf.some((group) => allowedGroups.includes(group.toLowerCase()));
}

// Récupère tous les groupes Active Directory auxquels appartient l'utilisateur
async function getTransitiveGroups(
  client: Client,
  userDn: string,
): Promise<string[]> {

  // - échapper userDn avec escapeLdapFilterValue()
  const escapedDn = escapeLdapFilterValue(userDn);

  //   permettant de retrouver les appartenances transitives
  // - retourner un tableau de DN de groupes
  // Le filtre devra rechercher les groupes dont l'utilisateur est membre directement ou indirectement.
  const LDAP_MATCHING_RULE = "1.2.840.113556.1.4.1941";
  const filter = `(&(objectClass=group)(member:${LDAP_MATCHING_RULE}:=${escapedDn}))`;

  const { searchEntries } = await client.search(env.ldap.baseDn, {
    scope: "sub",
    filter,
    attributes: [
      "distinguishedName",
    ],
  });

  return searchEntries.map((entry) => String(entry.distinguishedName ?? "")).filter(Boolean);

}

// Tente d'authentifier l'utilisateur sur un serveur LDAP précis.
async function authenticateOnServer(
  url: string,
  username: string,
  password: string,
): Promise<LdapUser> {

  const serviceClient = createLdapClient(url);

  try {

    // créer un PREMIER client LDAP
    await serviceClient.bind(env.ldap.bindDn, env.ldap.bindPassword);

    // rechercher l'utilisateur avec findUserWithClient()
    const user = await findUserWithClient(serviceClient, username);
  
    // si l'utilisateur n'existe pas :
    if (!user) {
      console.log("L'utilisateur n'existe pas");
      throw new LdapAuthenticationError();
    }

    // vérifier ses groupes avec isAllowedUser()
    if (!isAllowedUser(user)) {
      console.log("L'utilisateur n'est pas dans un groupe autorisé")
      throw new LdapAuthorizationError();
    }

    // créer un SECOND client LDAP
    const userClient = createLdapClient(url);

    // effectuer un bind avec : le DN réel de l'utilisateur, le mot de passe fourni
    try {
      await userClient.bind(user.dn, password);
      //    lancer LdapAuthenticationError
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        console.log("Mot de passe refusé par l'AD");
        throw new LdapAuthenticationError();
      }
      throw error;
    } finally {
      await userClient.unbind().catch(() => undefined);
    }
    // retourner le LdapUser
    return user;
  } finally {
    await serviceClient.unbind();
  }
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
  // - vérifier que username et password ne sont pas vides
  if (!username || !password) {
    throw new LdapAuthenticationError("Identifiant et mot de passe requis.");
  }

  // - parcourir env.ldap.urls dans l'ordre
  for (const url of env.ldap.urls) {
    // - tenter le serveur suivant uniquement lorsqu'il s'agit
    //   d'une erreur technique / serveur indisponible
    try {
      // - appeler authenticateOnServer() pour chaque serveur
      return await authenticateOnServer(url, username, password)

    } catch (error) {
      if (error instanceof LdapAuthenticationError || error instanceof LdapAuthorizationError) {
        throw error;
      }
      console.log(`Serveur LDAP indisponible : ${url}`);
    }
  }

  // - si aucun serveur ne fonctionne :
  throw new LdapUnavailableError();
}

export const ldapService = {
  authenticate,
};
