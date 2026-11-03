# Mon SDIS85 — API

API backend de l'application mobile **Mon SDIS85**.

Cette API constitue l'unique point d'accès de l'application Flutter aux données internes nécessaires à son fonctionnement.

## Architecture générale

L'application mobile ne communique pas directement avec les différentes sources de données internes du SDIS.

Le fonctionnement prévu est le suivant :

```text
Sources internes SDIS
        │
        │ Synchronisation périodique
        ▼
Base tampon MariaDB
        │
        ▼
API Mon SDIS85
Node.js / Express / Prisma
        │
        │ HTTPS / JSON
        ▼
Application Flutter
```

La base tampon contient uniquement les données nécessaires à l'application.

L'authentification des utilisateurs sera réalisée via **LDAPS**.

---

# Stack technique

- Node.js
- TypeScript
- Express
- Prisma ORM 7
- MariaDB / MySQL
- LDAPS
- API REST
- JSON

Principales dépendances actuellement utilisées :

- `express`
- `dotenv`
- `cors`
- `helmet`

Outils de développement :

- `typescript`
- `tsx`
- `@types/node`
- `@types/express`
- `@types/cors`

---

# Prérequis

Avant de démarrer le projet, installer :

- Git
- Node.js
- npm

Une instance MariaDB sera également nécessaire lorsque Prisma sera intégré au projet.

---

# Installation

Cloner le dépôt :

```bash
git clone <URL_DU_REPO>
```

Entrer dans le dossier :

```bash
cd mon-sdis85-api
```

Installer les dépendances :

```bash
npm install
```

---

# Configuration

Créer un fichier `.env` à partir de `.env.example`.

Exemple actuel :

```env
PORT=3000
NODE_ENV=development
```

Les variables nécessaires à MariaDB, Prisma, LDAPS, JWT et aux autres services seront ajoutées au fur et à mesure du développement.

Le fichier `.env` ne doit jamais être versionné.

---

# Lancer le projet

## Développement

```bash
npm run dev
```

Le serveur est automatiquement redémarré lors d'une modification du code source.

Par défaut :

```text
http://localhost:3000
```

## Compilation

```bash
npm run build
```

Les fichiers compilés sont générés dans :

```text
dist/
```

## Production

Après compilation :

```bash
npm start
```

---

# Scripts npm

```text
npm run dev
```

Lance l'API en développement avec `tsx watch`.

```text
npm run build
```

Compile le TypeScript vers JavaScript.

```text
npm start
```

Lance la version compilée de l'API.

---

# Structure du projet

```text
mon-sdis85-api/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │
│   ├── lib/
│   │
│   ├── middlewares/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── agents/
│   │   ├── org-units/
│   │   ├── assignments/
│   │   ├── alerts/
│   │   ├── formations/
│   │   └── operations/
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

Tous les dossiers ne sont pas encore présents dans le projet. Ils seront créés progressivement lorsque les fonctionnalités correspondantes seront développées.

---

# Organisation du code

L'API utilise une organisation **par domaine fonctionnel**.

Exemple :

```text
modules/
└── auth/
    ├── auth.controller.ts
    ├── auth.routes.ts
    ├── auth.service.ts
    └── ldap.service.ts
```

Les responsabilités sont séparées :

### Routes

Définissent les endpoints HTTP.

### Controllers

Gèrent les requêtes et réponses HTTP.

Ils ne doivent pas contenir la logique métier.

### Services

Contiennent la logique métier de l'application.

### Services externes

Les interactions avec des systèmes externes, comme Active Directory, sont isolées dans des services dédiés.

Exemple :

```text
ldap.service.ts
```

### Prisma

Prisma assure l'accès à MariaDB.

Les accès à la base ne doivent pas être dispersés directement dans les routes.

---

# API

Tous les endpoints métier seront progressivement regroupés sous :

```text
/api
```

## Health check

Endpoint actuellement disponible :

```http
GET /health
```

Exemple :

```bash
curl http://localhost:3000/health
```

Réponse :

```json
{
  "status": "ok",
  "service": "mon-sdis85-api"
}
```

Cet endpoint permet simplement de vérifier que l'API est démarrée.

---

# Base de données

La base de données utilisée sera :

```text
MariaDB / MySQL
```

L'ORM utilisé sera :

```text
Prisma ORM 7
```

La base sert de **base tampon** entre les systèmes internes du SDIS et l'application mobile.

Elle sera alimentée périodiquement avec les données nécessaires à Mon SDIS85.

Les principales données prévues concernent notamment :

- agents ;
- grades ;
- affectations ;
- unités organisationnelles ;
- fonctions ;
- données opérationnelles ;
- disponibilités ;
- gardes et astreintes ;
- indemnités ;
- formations ;
- qualifications et certifications ;
- équipements ;
- alertes.

Le modèle de données sera documenté précisément lorsqu'il sera implémenté.

---

# Périmètre V1

La V1 concerne principalement l'espace utilisateur sapeur-pompier.

Elle doit notamment permettre d'accéder aux informations nécessaires au :

- profil de l'agent ;
- affectations ;
- activité opérationnelle ;
- disponibilités ;
- gardes et astreintes ;
- indemnités ;
- temps d'activité ;
- formations et manœuvres ;
- qualifications et certifications ;
- échéances métier ;
- équipements individuels ;
- alertes.

Ne font notamment pas partie de la V1 :

- la gamification ;
- le suivi des candidats SPV en cours de recrutement.

---

# Sécurité

Quelques principes doivent être respectés pendant tout le développement :

- aucun secret dans Git ;
- aucun mot de passe dans les logs ;
- aucune donnée sensible inutile dans les réponses API ;
- validation systématique des données entrantes ;
- accès à l'API authentifié pour les données agent ;
- chiffrement des communications ;
- connexion LDAP via LDAPS ;
- contrôle des certificats TLS ;
- limitation des informations exposées par la base tampon.

---

# Git

Les développements doivent être réalisés sur des branches dédiées.

Exemple :

```text
feature/auth-ldap
feature/prisma-setup
feature/agent-profile
fix/auth-error
```

Éviter de développer directement sur la branche principale.

Avant de créer une Pull Request :

```bash
npm run build
```

doit réussir sans erreur.

---

# Maintenance de ce README

Ce README doit être mis à jour lors de toute évolution importante concernant :

- l'installation ;
- les variables d'environnement ;
- les scripts npm ;
- l'architecture ;
- les endpoints ;
- la base de données ;
- l'authentification ;
- le déploiement ;
- les procédures nécessaires à un nouveau développeur.

L'objectif est qu'un développeur récupérant le dépôt puisse installer et lancer le projet sans avoir besoin d'informations externes.
