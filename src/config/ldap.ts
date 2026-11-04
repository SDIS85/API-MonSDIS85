import fs from "node:fs";
import path from "node:path";

import { Client } from "ldapts";

import { env } from "./env.js";

export interface LdapConnection {
  client: Client;
  url: string;
}

const caCertificate = env.ldap.caCertPath
  ? fs.readFileSync(path.resolve(env.ldap.caCertPath))
  : undefined;

/**
 * Se connecte à l'un des contrôleurs LDAP configurés.
 *
 * Les serveurs doivent être testés dans l'ordre défini
 * dans LDAP_URLS.
 */
export async function connectLdap(): Promise<LdapConnection> {
  // TODO:
  //
  // - parcourir env.ldap.urls
  //
  // - créer un Client ldapts pour chaque URL
  //
  // - utiliser :
  //      env.ldap.timeout
  //      env.ldap.connectTimeout
  //
  // - configurer TLS avec :
  //      rejectUnauthorized
  //      caCertificate
  //
  // - effectuer un bind avec le compte technique :
  //      env.ldap.bindDn
  //      env.ldap.bindPassword
  //
  // - si le serveur fonctionne :
  //      retourner { client, url }
  //
  // - sinon :
  //      unbind proprement
  //      essayer le serveur suivant
  //
  // - si aucun serveur n'est accessible :
  //      lancer une erreur
  //
  // Attention :
  // ne jamais logger bindPassword.

  throw new Error("TODO: implémenter la connexion LDAP avec failover");
}
