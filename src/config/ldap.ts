import fs from "node:fs";
import path from "node:path";

import { Client } from "ldapts";

import { env } from "./env.js";

type LdapConnection = {
  client: Client;
  url: string;
}

const caCertificate = env.ldap.caCertPath
  ? fs.readFileSync(path.resolve(env.ldap.caCertPath))
  : undefined;

export function createLdapClient(url: string): Client {
  
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

// Se connecte à l'un des contrôleurs LDAP configurés.
export async function connectLdap(): Promise<LdapConnection> {
  let lastError: unknown = null;

  // - parcourir env.ldap.urls
  // - créer un Client ldapts pour chaque URL
  for (const url of env.ldap.urls) {
    const client = new Client({
      url,
      timeout: env.ldap.timeout,
      connectTimeout: env.ldap.connectTimeout,
      tlsOptions: {
        rejectUnauthorized: env.ldap.requireTls,
        ca: caCertificate,
      }
    });
    // - effectuer un bind avec le compte technique :
    try {
      await client.bind(env.ldap.bindDn, env.ldap.bindPassword);

      return {
        client,
        url,
      };
    } catch (error) {
      lastError = error;

      try {
        await client.unbind();
      } catch {
        // ignore
      }
    }
  }

  throw new Error(
    `Impossible de se connecter à un contrôleur LDAP. ${lastError instanceof Error ? lastError.message : ""
    }`,
  );

}


