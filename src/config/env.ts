const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }

  return value;
};

const numberEnv = (name: string, fallback: number): number => {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`La variable d'environnement ${name} doit être un nombre`);
  }

  return parsed;
};

const booleanEnv = (name: string, fallback = false): boolean => {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

const listEnv = (name: string): string[] => {
  return requiredEnv(name)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: numberEnv("PORT", 3000),

  ldap: {
    urls: listEnv("LDAP_URLS"),
    baseDn: requiredEnv("LDAP_BASE_DN"),

    bindDn: requiredEnv("LDAP_BIND_DN"),
    bindPassword: requiredEnv("LDAP_BIND_PASSWORD"),

    userFilter: requiredEnv("LDAP_USER_FILTER"),

    allowedGroups: listEnv("LDAP_ALLOWED_GROUPS"),

    requireTls: booleanEnv("LDAP_REQUIRE_TLS", true),

    caCertPath: process.env.LDAP_CA_CERT_PATH,

    connectTimeout: numberEnv("LDAP_CONNECT_TIMEOUT", 5000),
    timeout: numberEnv("LDAP_TIMEOUT", 5000),
  },
};
