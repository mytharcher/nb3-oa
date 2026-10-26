import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Fermer',
  nav: { users: 'Gestion des utilisateurs' },
  assignment: {
    saved: 'Autorisations de « {{name}} » mises à jour',
    inspect: 'Vérifier les autorisations effectives',
    keepEditing: 'Continuer la modification',
    discardChanges: 'Abandonner les modifications',
    showMore: 'Afficher plus',
    title: 'Attributions d’autorisations',
    description:
      'Gérez les autorisations directement attribuées à cet utilisateur. Les modifications s’appliquent après enregistrement.',
    search: 'Rechercher des noms ou des descriptions',
    selectedOnly: 'Sélection uniquement',
    selected: '{{count}} sélectionnés',
    changes: '{{added}} ajoutés, {{removed}} retirés',
    noChanges: 'Aucune modification',
    empty: 'Aucune option correspondante',
    protected:
      'Cette attribution est protégée et ne peut pas être modifiée ici',
    failed: 'Impossible d’enregistrer. Veuillez réessayer.',
    discard: 'Abandonner les modifications non enregistrées ?',
  },
  sessions: {
    title: 'Révoquer les sessions de « {{name}} » ?',
    description: 'L’utilisateur devra se reconnecter sur tous ses appareils.',
    confirm: 'Révoquer',
    success: 'Sessions de « {{name}} » révoquées',
  },
  page: {
    noMatches: 'Aucun utilisateur ne correspond à vos filtres.',
    clearFilters: 'Effacer les filtres',
    emptyDescription:
      'Créez des utilisateurs ici ou demandez à un administrateur d’ajouter un compte.',
    retry: 'Réessayer',
    loading: 'Chargement',
    title: 'Utilisateurs',
    description:
      'Gérez les comptes, les attributions d’autorisations et les sessions actives.',
    add: 'Ajouter un utilisateur',
    search: 'Rechercher par nom, identifiant ou adresse e-mail',
    allStatuses: 'Tous les statuts',
    allRoles: 'Tous les ensembles d’autorisations',
    enabled: 'Active',
    disabled: 'Gelé',
    noUsers: 'Aucun utilisateur trouvé.',
    total: '{{count}} utilisateurs',
    previous: 'Précédent',
    next: 'Suivant',
    selectRole: 'Sélectionner un ensemble d’autorisations',
    roles: 'Ensembles d’autorisations',
    systemAdministrator: 'Administrateur système',
    noDirectRoles: 'Non attribué directement',
    protectedRole: 'Attribution protégée',
    authenticatedDefaultAccess:
      'Seules les attributions directes sont affichées ici. Les autorisations reçues via l’ensemble des utilisateurs connectés, les équipes ou d’autres sujets ne sont pas répertoriées.',
    columns: { user: 'Utilisateur', status: 'Statut', actions: 'Actions' },
    actions: {
      menuFor: 'Actions pour {{name}}',
      edit: 'Modifier',
      resetPassword: 'Réinitialiser le mot de passe',
      revokeSessions: 'Révoquer les sessions',
      enable: 'Activer le compte',
      delete: 'Supprimer',
      disable: 'Geler le compte',
    },
  },
  form: {
    roleRequired: 'Choisissez une valeur pour {{name}}.',
    nameRequired: 'Saisissez un nom.',
    emailInvalid: 'Saisissez une adresse e-mail valide.',
    passwordRequired: 'Saisissez un mot de passe.',
    saved: 'Utilisateur « {{name}} » enregistré',
    addTitle: 'Ajouter un utilisateur',
    editTitle: 'Modifier l’utilisateur',
    addDescription: 'Créez un compte et attribuez des autorisations.',
    editDescription: 'Mettez à jour le profil du compte.',
    name: 'Nom',
    username: 'Nom d’utilisateur',
    email: 'E-mail',
    password: 'Mot de passe',
    cancel: 'Annuler',
    save: 'Enregistrer',
    create: 'Créer',
  },
  password: {
    saved: 'Réinitialiser le mot de passe de « {{name}} »',
    title: 'Réinitialiser le mot de passe',
    description:
      'Définissez un nouveau mot de passe pour {{name}}. Toutes les sessions seront révoquées.',
    newPassword: 'Nouveau mot de passe',
    submit: 'Réinitialiser le mot de passe',
  },
  state: {
    enabled: 'Compte « {{name}} » activé',
    disabled: 'Compte « {{name}} » gelé',
    enableTitle: 'Activer le compte « {{name}} » ?',
    disableTitle: 'Geler le compte « {{name}} » ?',
    enableDescription:
      'Le blocage de connexion de {{name}} sera levé. Les règles d’accès existantes restent applicables.',
    disableDescription:
      '{{name}} ne pourra plus se connecter et sera déconnecté de tous ses appareils. La configuration des autorisations est conservée ; geler un compte ne signifie pas un départ.',
    enable: 'Activer le compte',
    disable: 'Geler le compte',
  },
  deletion: {
    title: 'Supprimer l’utilisateur « {{name}} » ?',
    description:
      'Toutes les sessions et clés API de {{name}} seront révoquées. L’historique d’activité sera conservé. Cette action est irréversible.',
    success: 'Utilisateur « {{name}} » supprimé',
  },
  invite: {
    open: 'Inviter des utilisateurs',
    title: 'Inviter des utilisateurs',
    description:
      'Chaque adresse sans compte recevra un e-mail contenant un lien pour en créer un.',
    emails: 'Adresses e-mail',
    emailsHint:
      'Une par ligne, ou séparées par des virgules ou des espaces. Jusqu’à 50 à la fois.',
    emailsRequired: 'Saisissez au moins une adresse e-mail.',
    emailsInvalid: 'Adresses e-mail invalides : {{emails}}',
    emailsTooMany: 'Invitez au maximum 50 adresses à la fois.',
    roles: 'Autorisations après inscription',
    send: 'Envoyer les invitations',
    sent: 'Invitations envoyées.',
    done: 'Terminé',
    link: 'Lien d’invitation',
    copy: 'Copier le lien',
    copied: 'Copié',
    copyFailed: 'Impossible de copier le lien.',
    outcome: {
      sent: 'E-mail envoyé',
      notSent: 'E-mail non envoyé : copiez le lien ci-dessous',
      existingUser: 'Possède déjà un compte',
    },
  },
  invitations: {
    title: 'Invitations en attente',
    empty: 'Aucune invitation en attente.',
    email: 'E-mail',
    invitedBy: 'Invité par',
    expires: 'Expiration',
    status: 'Statut',
    pending: 'En attente',
    expired: 'Expirée',
    notSent: 'Non envoyé',
    resend: 'Renvoyer',
    revoke: 'Révoquer',
    actionsFor: 'Actions pour l’invitation à {{email}}',
    resent: 'Invitation renvoyée.',
    revoked: 'Invitation révoquée.',
    revokeTitle: 'Révoquer l’invitation de « {{email}} » ?',
    revokeDescription: 'Le lien envoyé à {{email}} cessera de fonctionner.',
  },
  accept: {
    title: 'Accepter l’invitation',
    description: '{{inviter}} vous a invité.',
    summary: 'Vous rejoindrez également : {{items}}',
    loading: 'Chargement de l’invitation…',
    email: 'E-mail',
    name: 'Nom',
    password: 'Mot de passe',
    nameRequired: 'Saisissez votre nom.',
    passwordTooShort:
      'Le mot de passe doit comporter au moins {{min}} caractères.',
    submit: 'Créer le compte et rejoindre',
    submitting: 'Inscription…',
    signedIn:
      'Vous êtes connecté en tant que {{name}}. Déconnectez-vous pour accepter cette invitation avec un nouveau compte.',
    signOut: 'Se déconnecter',
    signOutFailed: 'Impossible de se déconnecter.',
    existingAccount:
      'Cette adresse possède déjà un compte. Connectez-vous avec celui-ci pour continuer.',
    goToLogin: 'Aller à la connexion',
    errors: {
      notFound: 'Ce lien d’invitation est invalide.',
      expired: 'Cette invitation a expiré. Demandez-en une nouvelle.',
      accepted: 'Cette invitation a déjà été acceptée.',
      revoked: 'Cette invitation a été révoquée.',
      password: 'Le mot de passe ne respecte pas les exigences.',
      accountConflict: 'Impossible de créer un compte avec cette adresse.',
      failed: 'Un problème est survenu. Veuillez réessayer.',
    },
  },
  errors: {
    loadFailed: 'Impossible de charger les utilisateurs. Veuillez réessayer.',
    loadForbidden:
      'Vous ne pouvez plus consulter les utilisateurs. Contactez un administrateur.',
    loadNotFound:
      'La gestion des utilisateurs est indisponible. Revenez à votre espace de travail.',
    SELF_DELETE_NOT_ALLOWED:
      'Vous ne pouvez pas supprimer votre propre compte.',
    LAST_ASSIGNMENT:
      'Cet utilisateur est le dernier bénéficiaire d’un ensemble d’autorisations qui doit rester attribué.',
    USER_HAS_APPS:
      'Transférez ou supprimez les demandes de cet utilisateur avant de le supprimer.',
    HUB_ADMIN_REQUIRED:
      'Seul un administrateur de la plateforme peut supprimer des utilisateurs.',
    PROTECTED_ROLE_ASSIGNMENT:
      'Ce rôle ne peut pas être attribué ou retiré depuis la gestion des utilisateurs.',
    USER_NOT_FOUND: 'L’utilisateur n’existe plus.',
    USER_DELETION_NOT_CONFIGURED:
      'La suppression d’utilisateurs n’est pas configurée pour cette application.',
    USER_EMAIL_CONFLICT: 'Un utilisateur possède déjà cette adresse e-mail.',
    USER_USERNAME_CONFLICT: 'Un utilisateur possède déjà ce nom d’utilisateur.',
    USER_IDENTITY_CONFLICT:
      'Un utilisateur possède déjà cette adresse e-mail ou ce nom d’utilisateur.',
    PASSWORD_TOO_SHORT: 'Le mot de passe est trop court.',
    PASSWORD_TOO_LONG: 'Le mot de passe est trop long.',
    operationFailed: 'L’opération sur l’utilisateur a échoué.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
