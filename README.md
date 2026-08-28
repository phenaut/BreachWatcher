# 🛡️ BreachWatcher

**BreachWatcher** est une extension Firefox (WebExtension Manifest V3) qui avertit l'utilisateur si le site web actuellement visité a fait l'objet de signalements de piratages, de fuites de données ou de compromissions de sécurité dans la presse.

Pour préserver la confidentialité et ne pas exposer de clé d'API, l'extension communique avec un **proxy Cloudflare Worker** muni d'un cache KV de 7 jours.

---

## 🏗️ Architecture du projet

```
BreachWatcher/
├── .gitignore                     # Fichiers et dossiers ignorés par git
├── README.md                      # Documentation du projet
│
├── extension/                     # Extension Firefox (Manifest V3)
│   ├── manifest.json              # Déclaration de l'extension et permissions
│   ├── background/
│   │   └── background.js          # Écoute de navigation & gestion du badge/alertes
│   ├── popup/
│   │   ├── popup.html             # Interface popup
│   │   ├── popup.js               # Logique d'affichage des articles et statut
│   │   └── popup.css              # Styles de l'interface
│   ├── options/
│   │   ├── options.html           # Page de réglages (URL du proxy)
│   │   ├── options.js             # Enregistrement et test de connexion
│   │   └── options.css            # Styles de la page de réglages
│   ├── utils/
│   │   └── domain.js              # Fonctions de normalisation et validation de domaines
│   └── icons/                     # Icônes de l'extension (16x16, 48x48, 128x128)
│
└── worker/                        # Proxy Cloudflare Worker & Cache KV
    ├── wrangler.toml              # Configuration Cloudflare (KV bindings, variables)
    ├── package.json               # Dépendances et scripts de développement
    ├── .dev.vars.example          # Modèle de variables secrètes locales
    └── src/
        ├── index.js               # Routeur HTTP, CORS, validation des requêtes
        ├── cache.js               # Gestion du cache Cloudflare KV (TTL 7 jours)
        └── news-client.js         # Client d'interrogation de l'API de presse
```

---

## 🚀 Démarrage rapide

### 1. Lancer le Cloudflare Worker (Local)

1. Rendez-vous dans le dossier `worker/` :
   ```bash
   cd worker
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Créez un fichier `.dev.vars` à partir de `.dev.vars.example` :
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Renseignez votre clé API de presse (`NEWS_API_KEY`) si vous en possédez une (sinon, un mode démonstration est activé pour tester des domaines comme `testbreach.com`).
4. Lancez le serveur localement :
   ```bash
   npm run dev
   ```
   Le serveur démarre par défaut sur `http://127.0.0.1:8787`.

---

### 2. Charger l'extension dans Firefox

1. Ouvrez **Firefox** et accédez à l'URL : `about:debugging#/runtime/this-firefox`
2. Cliquez sur le bouton **« Charger un module temporaire... »**
3. Sélectionnez le fichier `extension/manifest.json`.
4. L'icône BreachWatcher 🛡️ apparaît dans la barre d'outils de Firefox !

---

## ⚙️ Déploiement du Worker sur Cloudflare

1. Authentifiez-vous auprès de Cloudflare :
   ```bash
   npx wrangler login
   ```
2. Créez le namespace KV de production et de preview :
   ```bash
   npx wrangler kv:namespace create BREACH_CACHE
   npx wrangler kv:namespace create BREACH_CACHE --preview
   ```
3. Reportez les IDs retournés dans votre fichier `worker/wrangler.toml`.
4. Définissez votre clé API secrète en production :
   ```bash
   npx wrangler secret put NEWS_API_KEY
   ```
5. Déployez le worker :
   ```bash
   npm run deploy
   ```
6. Dans les options de l'extension Firefox, renseignez l'URL de production de votre Worker (ex: `https://breachwatcher-proxy.votre-compte.workers.dev`).

---

## 🔒 Confidentialité & Performance

- **Aucune clé API dans l'extension** : La clé est protégée côté serveur Cloudflare.
- **Cache KV de 7 jours** : Réduit drastiquement le nombre d'appels à l'API de presse payante ou limitée en quota.
- **Cache mémoire local (30 min)** : Évite les requêtes réseau répétées lors de la navigation interne sur un même site.
