import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/fr-FR';
import inboxEnUS from '#extensions/nocobase-inbox/locales/fr-FR';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'Messages',
  'inbox.loadFailed': 'Impossible de charger les messages',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Messages',
  'inboxButton.pending': 'Messages, {{count}} en attente',
  'inboxButton.unread': 'Messages, {{count}} non lus',
  'inboxButton.pendingHint':
    '{{count}} éléments vous attendent ; ce nombre diminue après leur traitement.',
  'inboxButton.unreadHint':
    '{{count}} non lus ; ce nombre diminue à mesure de leur lecture.',
  'auth.welcome': 'Bon retour',
  'auth.loginDescription':
    'Connectez-vous avec votre nom d’utilisateur ou e-mail et votre mot de passe.',
  'auth.registerTitle': 'Créer un compte',
  'auth.registerDescription': 'Créez un compte pour commencer.',
  'auth.forgotTitle': 'Mot de passe oublié',
  'auth.forgotDescription':
    'Saisissez votre e-mail et nous enverrons un lien de réinitialisation si le compte existe.',
  'auth.resetDescription':
    'Choisissez un nouveau mot de passe pour votre compte.',
  'auth.resetTitle': 'Réinitialiser le mot de passe',
  'auth.identifier': 'Nom d’utilisateur ou e-mail',
  'auth.password': 'Mot de passe',
  'auth.signIn': 'Se connecter',
  'auth.signingIn': 'Connexion…',
  'auth.hidePassword': 'Masquer le mot de passe',
  'auth.showPassword': 'Afficher le mot de passe',
  'auth.forgotLink': 'Mot de passe oublié ?',
  'auth.noAccount': 'Vous n’avez pas de compte ?',
  'auth.signUp': 'S’inscrire',
  'auth.createAccount': 'Créer le compte',
  'auth.creatingAccount': 'Création du compte…',
  'auth.name': 'Nom',
  'auth.username': 'Nom d’utilisateur',
  'auth.email': 'E-mail',
  'auth.confirmPassword': 'Confirmer le mot de passe',
  'auth.existingAccount': 'Vous avez déjà un compte ?',
  'auth.passwordMismatch': 'Les mots de passe ne correspondent pas.',
  'auth.resetting': 'Réinitialisation…',
  'auth.newPassword': 'Nouveau mot de passe',
  'auth.confirmNewPassword': 'Confirmer le nouveau mot de passe',
  'auth.invalidResetLink':
    'Ce lien de réinitialisation est invalide ou a expiré.',
  'auth.backToSignIn': 'Retour à la connexion',
  'auth.sendResetLink': 'Envoyer le lien de réinitialisation',
  'auth.sending': 'Envoi…',
  'auth.resetSent':
    'Si le compte existe, un lien de réinitialisation a été envoyé.',
  'auth.rememberPassword': 'Vous vous souvenez de votre mot de passe ?',
  'auth.methods': 'Modes de connexion',
  'auth.or': 'Ou continuer avec',
  'auth.continueWith': 'Continuer avec {provider}',
  'auth.about': 'À propos de cette application',
  'auth.platform': 'Plateforme d’applications native pour l’IA',
  'auth.marketingTitleFirst': 'Laissez l’IA créer librement.',
  'auth.marketingTitleSecond': 'NocoBase garantit',
  'auth.marketingTitleThird': 'la fiabilité.',
  'auth.marketingDescription':
    'Offrez à l’IA un cadre d’interface flexible pour façonner chaque expérience, tandis que NocoBase sécurise les données, les autorisations et la gouvernance sous-jacentes.',
  'auth.frontend': 'Interface native pour l’IA',
  'auth.frontendDescription':
    'Composez librement des interfaces sur un cadre flexible.',
  'auth.foundation': 'Socle NocoBase',
  'auth.foundationDescription':
    'Données, contrôle d’accès et gouvernance fiables.',
  'auth.marketingFooter': 'Liberté en surface. Confiance au fondement.',
  'status.loading': 'Chargement',
  'status.loadingPage': 'Chargement de la page',
  'status.denied': 'Accès refusé',
  'status.pageFailed': 'Impossible de charger la page',
  'status.retry': 'Réessayer',
  'navigation.brandHome': 'Accueil NocoBase',
  'navigation.brandApps': 'Applications NocoBase',
  'routeOverlay.close': 'Fermer',
  'status.backHome': 'Retour à l’espace de travail',
  'status.deniedDescription':
    'Vous n’avez pas l’autorisation d’accéder à cette page.',
  'status.routeFailedDescription':
    'Impossible de charger cette page. Veuillez réessayer.',
  shell: {
    buildFreely: 'L’IA crée librement.',
    reliability: '<brand>NocoBase</brand> garantit la fiabilité.',
  },
  home: {
    platform: 'NocoBase · Plateforme d’applications native pour l’IA',
    title: 'Décrivez votre besoin, votre agent le réalise',
    description:
      'Cette application se développe en dialoguant avec votre agent de programmation. Décrivez simplement les besoins métier ; il écrit les pages, modèles de données, API et processus métier de ce projet.',
    steps: {
      describe: {
        title: 'Décrivez le besoin',
        description:
          'Précisez les utilisateurs, les données conservées et le comportement attendu.',
      },
      build: {
        title: 'Laissez l’agent développer',
        description:
          'Il lit ce projet et ses fonctions intégrées, puis écrit le code.',
      },
      review: {
        title: 'Vérifiez et affinez',
        description:
          'Actualisez la page pour essayer, puis demandez les modifications de la même manière.',
      },
    },
    example: {
      title: 'Essayez une demande comme celle-ci',
      text: 'Crée une application de commandes d’achat.\n\nUne commande possède un numéro, un article, un demandeur, un montant et un statut d’approbation. Les demandeurs créent des commandes et ne voient que les leurs ; les examinateurs voient toutes les commandes en attente et les approuvent ou les rejettent.\nAprès une décision, notifie le demandeur dans sa boîte de réception avec un lien vers la commande.',
      hint: 'Collez cette demande dans Claude Code, Codex, Cursor ou un autre agent de programmation ouvert dans ce projet.',
    },
    capabilitiesTitle: 'Fonctions intégrées',
    capabilitiesDescription:
      'Votre agent utilise directement ces fonctions. Ouvrez-en une pour obtenir une consigne modifiable et copiable.',
    viewPrompts: 'Voir les consignes ({{count}})',
    prompt: {
      label: 'Consigne',
      hint: 'Adaptez la consigne à votre activité avant de la copier. Les modifications ne sont pas conservées après fermeture du dialogue.',
      copy: 'Mettre en copie',
      copiedShort: 'Copié',
      copied: 'Consigne copiée',
      copyFailed:
        'Impossible de copier. Sélectionnez le texte et copiez-le manuellement.',
      reset: 'Rétablir la valeur par défaut',
    },
    capabilities: {
      auth: {
        title: 'Authentification',
        description:
          'Connexion, inscription, réinitialisation du mot de passe et authentification unique d’entreprise.',
        prompts: {
          disableSignUp: {
            label: 'Fermer les inscriptions',
            text: 'Cette application est réservée aux employés de l’entreprise. Les administrateurs créent tous les comptes.\nDésactive l’inscription libre et retire le lien d’inscription de la page de connexion.\nLes employés existants doivent toujours pouvoir se connecter avec leur compte et mot de passe.\nConserve le lien de mot de passe oublié.',
          },
          passwordRules: {
            label: 'Règles de mot de passe',
            text: 'Exige au moins 12 caractères lors de l’inscription ou de la réinitialisation d’un mot de passe.\nAffiche cette exigence dans les deux formulaires et utilise des messages de validation cohérents.\nPermets aux comptes existants de se connecter sans imposer un changement immédiat de mot de passe.',
          },
          companySso: {
            label: 'Authentification unique d’entreprise',
            text: 'Permets aux employés de se connecter via notre plateforme d’identité d’entreprise avec OIDC.\n\nConserve la connexion par compte et mot de passe et ajoute un bouton Compte d’entreprise.\nCe bouton ouvre la plateforme d’identité d’entreprise. Après connexion réussie, retourne à l’accueil de l’application.\n\nAutorise la première connexion à créer un compte applicatif, identifié par l’identifiant utilisateur stable de la plateforme.\nNe lie pas automatiquement les comptes par correspondance de nom ou d’e-mail. Les nouveaux comptes utilisent les autorisations par défaut de l’application.\n\nListe les informations à fournir par l’administrateur de la plateforme d’identité et l’URL de rappel à enregistrer.',
          },
        },
      },
      authorization: {
        title: 'Autorisations',
        description:
          'Contrôlez qui peut ouvrir les pages, exécuter les actions et voir les enregistrements.',
        prompts: {
          jobs: {
            label: 'Fonctions professionnelles',
            text: 'Crée les fonctions Demandeur d’achat et Examinateur de commandes dans l’application.\nLes demandeurs d’achat peuvent accéder à la page des commandes et consulter celles qu’ils ont demandées.\nLes examinateurs peuvent accéder à la page des commandes, les consulter et approuver ou rejeter les commandes en attente.\nSeuls les administrateurs de l’application peuvent modifier les autorisations et attributions.\nUtilise les fonctions d’autorisation existantes de l’application afin que les administrateurs puissent ensuite ajuster les autorisations et affecter les personnes.',
          },
          dataScopes: {
            label: 'Périmètres de données',
            text: 'Permets aux demandeurs d’achat de consulter uniquement leurs propres commandes, en déterminant la propriété à partir du champ demandeur.\nLes examinateurs peuvent consulter toutes les commandes et traiter les approbations en attente.\nLes administrateurs peuvent ajuster le périmètre de consultation des commandes de chaque fonction dans son ensemble d’autorisations.',
          },
          sharing: {
            label: 'Partage',
            text: 'Partage la commande PO-2026-004 de Bob avec Alice afin qu’elle puisse l’examiner.\nAlice dispose déjà de l’autorisation de consulter les commandes ; ajoute l’accès en consultation à cette commande.\nConserve ses responsabilités existantes. Les examinateurs de commandes continuent de traiter les approbations.\nPermets aux administrateurs de gérer cette règle de partage.',
          },
        },
      },
      scheduler: {
        title: 'Tâches planifiées',
        description:
          'Exécutez les tâches métier à heures fixes et consultez la prochaine exécution et ses résultats.',
        prompts: {
          reminder: {
            label: 'Rappel quotidien',
            text: 'Ajoute un Rappel des commandes en attente à l’application de commandes existante.\n\nÀ 09:00, heure de Pékin, chaque jour ouvré, trouve les commandes en attente d’approbation, regroupe-les par examinateur et envoie à chacun une notification interne.\nInclus le nombre de commandes en attente et un lien vers leur liste. N’envoie rien s’il n’y en a aucune.\nLes administrateurs peuvent consulter la planification et les enregistrements d’exécution, puis suspendre ou reprendre les rappels.',
          },
          weeklyReport: {
            label: 'Rapport hebdomadaire',
            text: 'À 08:00, heure de Pékin, chaque lundi, génère la synthèse des ventes de la semaine précédente et notifie le responsable commercial.\nInclus le chiffre d’affaires, le nombre de commandes et les totaux par région. Les administrateurs peuvent consulter la tâche et les enregistrements d’exécution.',
          },
        },
      },
      notification: {
        title: 'Notifications',
        description:
          'Envoyez des messages internes, des e-mails ou des messages de robot de groupe lors d’un événement.',
        prompts: {
          inApp: {
            label: 'Message interne',
            text: 'Ajoute l’approbation des commandes à l’application actuelle et notifie les demandeurs des résultats par messages internes.\n\nLes commandes incluent un numéro, un nom, un demandeur, un montant et un statut d’approbation.\nLes demandeurs peuvent consulter leurs commandes. Les examinateurs peuvent consulter les commandes en attente et les approuver ou rejeter. Réutilise les fonctions de commandes et d’approbation existantes si disponibles.\n\nAprès approbation ou rejet, envoie un seul message interne au demandeur de la commande uniquement.\nLe titre indique l’approbation ou le rejet. Le contenu inclut le numéro, le nom de la commande et le résultat.\nCliquer sur le message ouvre les détails de la commande correspondante.\nN’envoie rien pendant l’attente d’approbation. Notifie une seule fois pour un même résultat.\nUn échec de notification n’affecte pas le résultat d’approbation enregistré.',
          },
          email: {
            label: 'E-mail',
            text: 'Ajoute l’e-mail aux notifications existantes d’approbation de commande, en utilisant le canal e-mail configuré de l’application.\n\nAprès approbation ou rejet, envoie le résultat à l’adresse e-mail du compte du demandeur.\nInclus le numéro de commande dans l’objet et le nom de la commande et le résultat dans le contenu.\nConserve les messages internes existants. Si le demandeur n’a pas d’adresse e-mail, envoie uniquement le message interne.\nUn échec d’e-mail ne doit affecter ni le résultat d’approbation ni le message interne.',
          },
        },
      },
      mail: {
        title: 'Courrier',
        description:
          'Connectez des boîtes mail personnelles, puis lisez, répondez et envoyez des e-mails professionnels.',
        prompts: {
          mailCenter: {
            label: 'Centre de courrier',
            text: 'Ajoute un centre de courrier et une entrée de gestion des comptes de messagerie à l’application. Les utilisateurs peuvent connecter leurs boîtes mail, en sélectionner une, synchroniser les messages entrants, lire les messages et pièces jointes et répondre.\n\nLorsqu’un commercial reçoit une demande de devis, il peut répondre depuis le centre de courrier. Conserve l’objet original et le contexte de conversation et adresse la réponse à l’expéditeur d’origine. Chaque utilisateur travaille avec ses propres boîtes mail connectées.',
          },
          correspondence: {
            label: 'E-mails clients',
            text: 'Ajoute une section de correspondance aux détails clients. Affiche les messages dont l’expéditeur ou le destinataire correspond aux adresses e-mail de contact du client actuel. Les commerciaux peuvent lire les messages, consulter les pièces jointes et répondre via leurs propres boîtes mail connectées.',
          },
        },
      },
      file: {
        title: 'Fichiers',
        description:
          'Téléversez des fichiers, joignez-les aux enregistrements et prévisualisez-les ou téléchargez-les.',
        prompts: {
          attachments: {
            label: 'Pièces jointes',
            text: 'Ajoute des pièces jointes d’achat à mon application existante de gestion des commandes.\n\nAjoute une zone de pièces jointes aux détails de commande. Chaque commande peut contenir plusieurs fichiers, dont PDF, images et DOCX.\nAffiche les noms et tailles des fichiers, avec des actions d’aperçu, téléchargement et retrait.\nAprès téléversement, permets d’enregistrer les pièces jointes dans la commande actuelle. Conserve-les à la réouverture de la commande.\nToute personne ayant accès à une commande peut consulter et télécharger ses pièces jointes. Les demandeurs et examinateurs peuvent en ajouter ou retirer.\nRetirer une pièce jointe la délie uniquement de la commande actuelle ; conserve le fichier.',
          },
          avatar: {
            label: 'Avatar',
            text: 'Ajoute un avatar à chaque employé, avec une image par employé.\nPermets le téléversement et le remplacement de l’avatar et affiche-le dans les listes et détails des employés.\nUtilise le nouvel avatar après remplacement et conserve son affichage après actualisation de la page.',
          },
        },
      },
      templatePrint: {
        title: 'Impression par modèle',
        description:
          'Remplissez des modèles Word ou Excel avec les données métier et générez des fichiers.',
        prompts: {
          approvalForm: {
            label: 'Formulaire d’approbation',
            text: 'Ajoute une action « Générer le formulaire d’approbation » aux détails des commandes.\n\nUtilise le modèle Word fourni pour remplir le numéro de la commande actuelle, la demande d’achat, le demandeur, le montant, le résultat d’approbation et l’heure de traitement.\nConserve le titre du modèle, la disposition du tableau et la zone de signature. Nomme le résultat « Achat-approbation-numéro-de-commande » et propose un téléchargement Word.\nToute personne ayant accès à la commande peut générer son formulaire d’approbation. Utilise les données actuelles de la commande lors de la génération.',
          },
          pdf: {
            label: 'Sortie PDF',
            text: 'Ajoute le téléchargement PDF du formulaire d’approbation d’achat, en conservant les polices, tableaux et zone de signature du modèle Word.',
          },
        },
      },
      i18n: {
        title: 'Langues',
        description:
          'Changez la langue de l’interface, ajoutez des langues et définissez la langue par défaut.',
        prompts: {
          addLanguage: {
            label: 'Ajouter une langue',
            text: 'Ajoute l’espagnol à mon application. Traduis l’interface et les messages serveur et ajoute l’espagnol au menu des langues.',
          },
          defaultLanguage: {
            label: 'Langue par défaut',
            text: 'Définis le chinois simplifié comme langue par défaut de l’application pour les personnes qui n’en ont pas choisi. Conserve l’anglais dans le menu des langues.',
          },
        },
      },
      theme: {
        title: 'Thèmes',
        description:
          'Ajustez les couleurs, polices et densité, et basculez entre clair et sombre.',
        prompts: {
          changeTheme: {
            label: 'Modifier un thème',
            text: 'Mets à jour le thème Compact : utilise le bleu comme couleur principale et augmente légèrement l’arrondi des angles. Conserve les polices, tailles de texte et espacements compacts actuels.',
          },
          newTheme: {
            label: 'Nouveau thème',
            text: 'Crée un thème Forêt avec le vert comme couleur principale, des fonds doux, des angles modérément arrondis et des ombres subtiles.',
          },
        },
      },
    },
  },

  appearance: {
    title: 'Apparence',
    mode: 'Mode de couleur',
    preset: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    themes: { default: 'Aéré', compact: 'Compact' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Fermer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    language: 'Langue',
  },
  notices: {
    serverLocaleFallback:
      'Le serveur ne prend pas en charge cette langue ; les messages serveur seront donc en anglais.',
    languageChangeFailed:
      'Impossible de terminer le changement de langue. Veuillez réessayer.',
  },
  account: {
    signOutFailed: 'Impossible de se déconnecter. Veuillez réessayer.',
    openMenu: 'Ouvrir le menu du compte',
    fallback: 'Compte',
    signOut: 'Se déconnecter',
    signingOut: 'Déconnexion…',
  },
  navigation: {
    home: 'Accueil',
    open: 'Ouvrir la navigation',
    close: 'Fermer la navigation',
    expand: 'Développer la navigation',
    collapse: 'Réduire la navigation',
    toggle: 'Développer ou réduire la navigation',
    label: 'Navigation de l’application',
    description: 'Accédez à une page de cette application.',
    breadcrumb: 'Fil d’Ariane',
    breadcrumbMore: 'Afficher les niveaux intermédiaires',
    back: 'Retour',
  },
  dataTable: {
    emptyDescription:
      'Aucun enregistrement disponible dans le périmètre actuel. Essayez un autre périmètre ou vérifiez plus tard.',
    noResults: 'Aucun résultat.',
    sortAscending: 'Croissant',
    sortDescending: 'Décroissant',
    hideColumn: 'Masquer',
    view: 'Consulter',
    toggleColumns: 'Afficher ou masquer les colonnes',
    selectedCount: '{{selected}} ligne(s) sélectionnée(s) sur {{total}}.',
    rowsPerPage: 'Lignes par page',
    pageOf: 'Page {{page}} sur {{pageCount}}',
    firstPage: 'Aller à la première page',
    previousPage: 'Aller à la page précédente',
    nextPage: 'Aller à la page suivante',
    lastPage: 'Aller à la dernière page',
  },
  datePicker: {
    placeholder: 'Choisir une date',
    rangePlaceholder: 'Choisir une période',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
