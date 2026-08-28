/**
 * Base de référence locale des fuites de données et piratages majeurs.
 * Permet un fonctionnement instantané et hors-ligne pour les sites les plus ciblés.
 */

export const KNOWN_BREACHES = {
  'cdiscount.com': {
    title: 'Piratage et exfiltration de comptes clients Cdiscount',
    breachDate: '2021-01-29',
    pwnCount: 4200,
    source: 'Have I Been Pwned / Presse',
    dataClasses: ['Coordonnées bancaires', 'Mots de passe', 'Adresses emails', 'Numéros de téléphone', 'Adresses postales'],
    summary: 'En janvier 2021, une exfiltration de comptes clients a touché Cdiscount via un accès interne compromis, incluant des identifiants et des données d’achats.',
    articles: [
      {
        title: 'Cdiscount : vol de données bancaires et personnelles de clients',
        source: 'Le Figaro Tech',
        url: 'https://www.lefigaro.fr/secteur/high-tech/cdiscount-vol-de-donnees-bancaires-de-clients-20210203',
        publishedAt: '2021-02-03'
      },
      {
        title: 'Cdiscount victime d’un vol de données touchant des milliers de comptes',
        source: '01net',
        url: 'https://www.01net.com/actualites/cdiscount-victime-d-un-vol-de-donnees-2037920.html',
        publishedAt: '2021-02-03'
      }
    ]
  },
  'free.fr': {
    title: 'Cyberattaque et fuite massive de données Free',
    breachDate: '2024-10-26',
    pwnCount: 19000000,
    source: 'Presse / Déclaration CNIL',
    dataClasses: ['IBAN', 'Noms', 'Prénoms', 'Adresses postales', 'Numéros de téléphone', 'Adresses emails'],
    summary: 'En octobre 2024, Free a subi une attaque majeure ayant entraîné la fuite de données de 19 millions d’abonnés dont 5,1 millions d’IBAN bancaires.',
    articles: [
      {
        title: 'Free victime d’une cyberattaque d’ampleur : 19 millions de clients concernés',
        source: 'Le Monde',
        url: 'https://www.lemonde.fr/pixels/article/2024/10/26/free-victime-d-un-piratage-de-donnees-bancaires_6360416_4408996.html',
        publishedAt: '2024-10-26'
      }
    ]
  },
  'deezer.com': {
    title: 'Fuite de données Deezer (2019 / révélée en 2022)',
    breachDate: '2019-04-10',
    pwnCount: 229000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms', 'Dates de naissance', 'Adresses IP', 'Localisations'],
    summary: 'Une sauvegarde de 2019 chez un prestataire tiers a été exposée en ligne contenant les données de plus de 220 millions d’utilisateurs.',
    articles: [
      {
        title: 'Deezer : les données de plus de 200 millions d’utilisateurs piratées',
        source: 'ZDNet',
        url: 'https://www.zdnet.fr/actualites/deezer-les-donnees-de-plus-de-200-millions-d-utilisateurs-piratees-39951804.htm',
        publishedAt: '2023-01-03'
      }
    ]
  },
  'francetravail.fr': {
    title: 'Piratage massif de France Travail (ex-Pôle Emploi)',
    breachDate: '2024-03-08',
    pwnCount: 43000000,
    source: 'Presse / CNIL',
    dataClasses: ['Numéros de Sécurité sociale', 'Noms', 'Prénoms', 'Adresses emails', 'Téléphones'],
    summary: 'Une intrusion sur les systèmes de France Travail et Cap Emploi a exposé les données personnelles de 43 millions de bénéficiaires.',
    articles: [
      {
        title: 'France Travail victime d’une cyberattaque : 43 millions de personnes potentielles concernées',
        source: 'Franceinfo',
        url: 'https://www.francetvinfo.fr/economie/emploi/recherche-d-emploi/pole-emploi/cyberattaque-visant-france-travail-43-millions-de-personnes-potentielles-concernees_6419732.html',
        publishedAt: '2024-03-13'
      }
    ]
  },
  'linkedin.com': {
    title: 'Scraping et fuite de données massives LinkedIn',
    breachDate: '2021-04-08',
    pwnCount: 700000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms complets', 'Numéros de téléphone', 'Profils professionnels'],
    summary: 'En 2021, une base de données contenant les informations de 700 millions de profils LinkedIn a été mise en vente sur le darknet.',
    articles: [
      {
        title: 'LinkedIn : une base de données de 700 millions d’utilisateurs mise en vente',
        source: 'Les Numériques',
        url: 'https://www.lesnumeriques.com/vie-du-net/linkedin-une-base-de-donnees-de-700-millions-d-utilisateurs-mise-en-vente-n165487.html',
        publishedAt: '2021-06-30'
      }
    ]
  },
  'adobe.com': {
    title: 'Piratage massif des comptes clients Adobe',
    breachDate: '2013-10-04',
    pwnCount: 153000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Mots de passe chiffrés', 'Indices de mot de passe', 'Noms d’utilisateurs'],
    summary: 'En octobre 2013, Adobe a subi l’une des plus grandes cyberattaques de l’époque, exposant 153 millions de comptes.',
    articles: []
  },
  'canva.com': {
    title: 'Fuite de données utilisateurs Canva',
    breachDate: '2019-05-24',
    pwnCount: 137000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms', 'Mots de passe hachés', 'Villes'],
    summary: 'En mai 2019, la plateforme graphique Canva a été piratée par le groupe Gnosticplayers touchant 137 millions d’utilisateurs.',
    articles: []
  }
};

