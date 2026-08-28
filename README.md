# 🛡️ BreachWatcher

**BreachWatcher** est une extension Firefox (WebExtension Manifest V3) **100% autonome** qui avertit l'utilisateur si le site web visité a fait l'objet de piratages, de fuites de données ou de compromissions de sécurité.

L'extension fonctionne **sans aucun serveur externe ni proxy** : elle interroge directement l'API publique Have I Been Pwned, les flux d'actualités récents et une base de données de sécurité embarquée, avec un **cache local de 7 jours** dans votre navigateur.

---

## 🏗️ Structure du projet

```
BreachWatcher/
├── .gitignore                     # Fichiers ignorés par git
├── README.md                      # Documentation du projet
│
└── extension/                     # Extension Firefox (Manifest V3)
    ├── manifest.json              # Déclaration et permissions de l'extension
    ├── background/
    │   └── background.js          # Analyse de navigation, HIBP, cache local 7 jours, badge
    ├── data/
    │   └── known-breaches.js      # Base embarquée des compromissions majeures (Cdiscount, Free, etc.)
    ├── popup/
    │   ├── popup.html             # Interface popup au clic sur l'icône
    │   ├── popup.js               # Affichage détaillé des brèches & articles
    │   └── popup.css              # Styles soignés et responsives
    ├── options/
    │   ├── options.html           # Page de réglages (durée du cache, vidage du cache)
    │   ├── options.js             # Gestion du stockage browser.storage.sync/local
    │   └── options.css
    ├── utils/
    │   ├── domain.js              # Normalisation des domaines et gestion des TLD composés
    │   └── news-parser.js         # Extraction d'articles de presse via flux RSS publics
    └── icons/                     # Icônes de l'extension (16x16, 48x48, 128x128)
```

---

## 🚀 Installation & Utilisation dans Firefox

1. Ouvrez **Firefox** et accédez à : `about:debugging#/runtime/this-firefox`
2. Cliquez sur **« Charger un module temporaire... »**
3. Sélectionnez le fichier `extension/manifest.json`.
4. L'icône BreachWatcher 🛡️ s'affiche dans votre barre d'outils !

---

## 🔒 Fonctionnalités & Confidentialité

- **100% Autonome** : Aucun serveur ou clé d'API payante requise.
- **Cache local intelligent (7 jours)** : Les résultats sont stockés dans votre navigateur (`browser.storage.local`) pour une navigation fluide et sans requêtes répétées.
- **Détection complète** :
  - **Piratages historiques vérifiés** : Interrogation directe de l'API Have I Been Pwned et de la base de référence intégrée (ex: Cdiscount 2021, Free 2024, Deezer...).
  - **Actualités récentes** : Flux RSS d'actualités cyber sans traçage.
- **Badge visuel instantané** : L'icône affiche le nombre d'incidents signalés en rouge.
