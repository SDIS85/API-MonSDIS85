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

// Se connecte à l'un des contrôleurs LDAP configurés.
export async function connectLdap(): Promise<LdapConnection> {
  let lastError: unknown = null;

  // - parcourir env.ldap.urls
  // - créer un Client ldapts pour chaque URL
  for (const url of env.ldap.urls) {
    const client = new Client({
      url,
      timeout: 5000,
      connectTimeout: 5000,
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
