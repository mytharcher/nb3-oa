import registryLocale from '../../extensions/nocobase-approval-ui/locales/fr-FR.js';
import { approvalLocaleFrFR as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: 'Imprimer / Enregistrer en PDF',
    printFailed: 'L’impression a échoué. Veuillez réessayer.',
    saving: 'Enregistrement…',
    noAvailableAction: 'Aucune action n’est actuellement disponible',
    authz: {
      cancellation: 'Annulation de congé',
      section: 'Approbations bureautiques',
      leave: 'Demandes de congé',
      submit: 'Soumettre sa propre demande',
      delegate: 'Soumettre une demande pour un employé',
      view: 'Lire les demandes',
      delegations: 'Délégations d’approbation',
      read: 'Lire',
      update: 'Gérer',
    },
    permissionSets: {
      delegations: 'Administration des délégations d’approbation',
    },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'Saisissez le motif de cette opération.',
    CLAIM_FIRST:
      'Prenez en charge cette tâche avant d’en enregistrer le résultat.',
    TASK_CLOSED:
      'Cette tâche est terminée. Actualisez la demande et utilisez les actions actuellement disponibles.',
    ALREADY_ANSWERED:
      'Votre réponse à cette tâche est déjà enregistrée. Actualisez pour consulter le résultat.',
    NOT_YOUR_TURN:
      'Une approbation antérieure est encore en attente. Attendez votre tour.',
    STALE:
      'L’approbation a changé. Chargez la dernière version de la demande avant de continuer.',
    CONTENT_CHANGED:
      'Le contenu examiné a changé. Actualisez et vérifiez-le à nouveau avant d’agir.',
    STALE_CONTENT:
      'Le contenu examiné a changé. Actualisez et vérifiez-le à nouveau avant d’agir.',
    INVALID_ANSWER:
      'Cette décision n’est pas disponible à l’étape actuelle. Actualisez et choisissez une action disponible.',
    NOT_ALLOWED:
      'Cette action n’est plus disponible. Actualisez et choisissez une action actuelle.',
    NO_ASSIGNEE:
      'Aucun responsable admissible n’est attribué. Demandez à un administrateur des approbations d’en attribuer un.',
    NO_STAGE:
      'Aucune étape d’approbation active n’est disponible. Actualisez et demandez à un administrateur des approbations de vérifier la demande.',
    ASSIGNMENT_LOOP:
      'Cette réattribution renverrait la tâche à un responsable précédent. Sélectionnez un autre destinataire admissible.',
  },
  businessErrorFields: '{{message}} Vérifiez ces champs : {{fields}}.',
  invalidFields: 'Vérifiez ces champs : {{fields}}.',
  fieldSeparator: ', ',
  businessErrors: {
    LEAVE_MAX_DAYS:
      'La durée demandée dépasse le maximum de ce type de congé. Réduisez la période.',
    LEAVE_NO_WORKDAYS:
      'La période sélectionnée ne contient aucune demi-journée ouvrée. Ajustez les dates.',
    LEAVE_TYPE_UNAVAILABLE:
      'Ce type de congé est indisponible. Sélectionnez un type de congé actif.',
    LEAVE_DELEGATE_REQUIRED:
      'Sélectionnez un autre employé actif pour la demande par délégation.',
  },

  creationUnknown:
    'Le résultat de l’enregistrement est inconnu. Réessayez le même enregistrement ou vérifiez les brouillons existants.',
  resubmit: 'Soumettre à nouveau',
  submitted: '{{name}} soumis',
  draftSavedSubmitFailed:
    'Brouillon enregistré. La soumission n’a pas abouti. Résolvez le problème et réessayez.',
  submissionUnknown:
    'Le résultat de la soumission est inconnu. Réessayez Soumettre avec le même contenu avant toute modification.',
  transfer: 'Transférer',
  addSigner: 'Ajouter un approbateur',
  urge: 'Relancer',
  recipientSearch: 'Rechercher des destinataires admissibles',
  moreRecipients: 'Charger plus de destinataires',
  signerMode: 'Mode de signature',
  signerbefore: 'Avant ma décision',
  signeralongside: 'En parallèle de ma décision',
  emptyTodoTitle: 'Aucune approbation en attente',
  emptyTodoDescription:
    'Les approbations nécessitant votre intervention apparaîtront ici.',
  emptyDoneTitle: 'Aucune approbation terminée',
  emptyDoneDescription:
    'Les approbations sur lesquelles vous êtes intervenu apparaîtront ici.',
  emptyCopiedTitle: 'Aucune approbation en copie',
  emptyCopiedDescription:
    'Les demandes dont vous êtes en copie apparaîtront ici.',
  emptyMineTitle: 'Aucune demande initiée',
  emptyMineDescription:
    'Complétez une demande et soumettez-la, ou enregistrez un brouillon.',
  calendarTimeZone: 'Les dates utilisent le calendrier de travail de {{zone}}.',
  refreshAfterSuccess:
    'L’action a réussi, mais les derniers détails n’ont pas pu être chargés. Actualisez sans répéter l’action.',
  domainInvalid:
    'La demande ne respecte pas les conditions métier. Vérifiez le type de congé, les dates, la personne assurant la relève et les détails de la demande.',
  confirmSubmit:
    'La soumission lance le processus d’approbation. Confirmez les détails de la demande.',
  confirmWithdraw: 'Le retrait met fin au processus d’approbation actuel.',
  confirmReject:
    'Le rejet met fin à cette demande et à son processus d’approbation.',
  confirmReturn:
    'Le retour permet au demandeur de corriger la demande. Une nouvelle soumission repart de la première étape.',
  confirmTerminate:
    'La clôture administrative met fin à ce processus d’approbation.',

  navigation: {
    center: 'Centre de tâches',
    delegations: 'Délégations d’approbation',
  },
  description: 'Traitez les tâches d’approbation et suivez vos demandes.',
  tabs: {
    todo: 'À faire',
    done: 'Terminé',
    copied: 'En copie',
    mine: 'Mes demandes',
  },
  newLeave: 'Nouvelle demande de congé',
  editLeave: 'Modifier la demande de congé',
  draft: 'Brouillon',
  search: 'Rechercher par référence ou demandeur',
  clear: 'Effacer les filtres',
  all: 'Tout',
  noResults: 'Aucun enregistrement correspondant',
  emptyTitle: 'Aucune demande pour le moment',
  emptyDescription:
    'Les nouvelles tâches d’approbation et demandes apparaîtront ici.',
  refresh: 'Actualiser',
  loading: 'Chargement',
  reference: 'Numéro de demande',
  applicant: 'Demandeur',
  type: 'Type de congé',
  days: 'Jours',
  status: 'Statut',
  createdAt: 'Date de demande',
  actions: 'Actions pour « {{name}} »',
  detail: 'Consulter',
  edit: 'Modifier',
  saveDraft: 'Enregistrer le brouillon',
  save: 'Enregistrer',
  cancel: 'Annuler',
  close: 'Fermer',
  submit: 'Soumettre',
  withdraw: 'Retirer',
  terminate: 'Clôturer',
  read: 'Marquer comme lu',
  approve: 'Approuver',
  reject: 'Rejeter',
  return: 'Renvoyer',
  comment: 'Commenter',
  appoint: 'Attribuer',
  reassign: 'Réattribuer',
  reason: 'Motif',
  opinion: 'Commenter',
  person: 'Approbateur',
  place: 'Emplacement non attribué',
  startDate: 'Date de début',
  endDate: 'Date de fin',
  startHalf: 'Demi-journée de début',
  endHalf: 'Demi-journée de fin',
  am: 'Matin',
  pm: 'Après-midi',
  handover: 'Personne assurant la relève',
  delegate: 'Déléguer les approbations pendant le congé',
  attachmentMissing:
    'Certaines pièces jointes sont indisponibles. Rechargez la demande ou contactez son demandeur.',
  attachments: 'Pièces jointes',
  attachmentRequired:
    'Ajoutez les justificatifs requis par le type de congé sélectionné.',
  attachmentUnavailable:
    'Le téléversement de pièces jointes est temporairement indisponible. Réessayez plus tard ou contactez un administrateur.',
  attachmentInvalid:
    'Certaines pièces jointes sélectionnées sont invalides ou n’appartiennent pas à cette demande. Rechargez la demande et sélectionnez-les à nouveau.',
  attachmentLimit:
    'Pièces jointes : PDF, JPEG, PNG ou WebP, jusqu’à 5 Mo par fichier et 10 fichiers. Un brouillon valide est enregistré avant le premier téléversement.',
  attachmentSize: 'Choisissez un fichier non vide de 5 Mo maximum.',
  attachmentType:
    'Choisissez un fichier PDF, JPEG, PNG ou WebP dont le format correspond.',
  attachmentCount: 'Un maximum de 10 pièces jointes est autorisé.',
  attachmentDenied:
    'Vous ne pouvez pas accéder aux pièces jointes de cette demande. Rechargez la demande pour vérifier l’accès.',
  attachmentFailed:
    'Le téléversement a échoué. Vérifiez le formulaire et la connexion, puis choisissez à nouveau le fichier.',
  attachmentUploading: 'Enregistrement du brouillon et téléversement…',
  attachmentRemove: 'Retirer la pièce jointe {{number}}',
  balanceInsufficient:
    'Le solde de congés disponible est insuffisant. Réduisez le nombre de jours ou contactez les RH.',
  balanceLimit:
    'Les congés annuels et de récupération seront disponibles avec les soldes de congés.',
  unavailable:
    'Cette action est indisponible. Examinez les éléments qui la bloquent.',
  formDescription:
    'Complétez la demande et soumettez-la, ou enregistrez un brouillon.',
  preview: 'Aperçu du circuit d’approbation',
  facts: 'Détails de la demande',
  progress: 'Progression de l’approbation',
  timeline: 'Historique des approbations',
  saved: 'Demande de congé « {{name}} » enregistrée',
  completed: '{{action}} : « {{name}} »',
  actionTitle: '{{action}} la demande « {{name}} »',
  returnHint:
    'Renvoyer au demandeur ; une nouvelle soumission repart de la première étape.',
  confirmDescription:
    'Cette action termine la tâche d’approbation actuelle. Confirmez le contenu examiné.',
  discard: 'Abandonner les modifications ?',
  discardDescription: 'Les modifications non enregistrées seront perdues.',
  discardConfirm: 'Abandonner les modifications',
  readOnly: 'Cet enregistrement est en lecture seule.',
  hrPreview:
    'Pour une demande effectuée au nom d’un employé, le circuit est calculé lors de la soumission.',
  dateRange: 'La fin ne doit pas précéder le début.',
  required: 'Saisissez une valeur.',
  limit: 'Utilisez au maximum 10 000 caractères.',
  handoverRequired:
    'Sélectionnez une personne assurant la relève pour activer la délégation.',
  unknownPerson: 'Nom indisponible',
  yes: 'Oui',
  no: 'Non',
  error: {
    invalid:
      'Le contenu ou l’action ne respecte pas les exigences. Vérifiez et ajustez.',
    overlap:
      'Une demande de congé active ou approuvée chevauche déjà cette période. Ajustez les dates.',
    configuration:
      'La configuration actuelle du délai d’approbation n’est pas prise en charge. Contactez un administrateur.',
    inactive:
      'Un employé requis est indisponible. Vérifiez le statut des employés.',

    failed: 'La requête a échoué. Veuillez réessayer.',
    forbidden: 'Accès refusé. Contactez un administrateur.',
    notFound:
      'Cet enregistrement est introuvable ou supprimé. Revenez à la liste.',
    conflict:
      'Cette demande a changé. Chargez le dernier contenu avant d’agir.',
    stale: 'Cette tâche est close ou l’action n’est plus disponible.',
  },
  loadLatest: 'Charger la dernière version',
  retry: 'Réessayer',
  states: {
    draft: 'Brouillon',
    revision: 'Correction requise',
    manager: 'Examen du responsable',
    head: 'Examen du chef de service',
    hr: 'Examen des RH',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    withdrawn: 'Retiré',
    terminated: 'Clôturé',
  },
  stages: {
    manager: 'Responsable direct',
    head: 'Chef de service',
    hr: 'RH',
    revision: 'Correction du demandeur',
  },
  delegations: {
    create: 'Créer',
    description:
      'Permettez à un délégué de traiter les approbations pendant une période définie.',
    new: 'Nouvelle délégation',
    edit: 'Modifier la délégation',
    disable: 'Désactiver',
    principal: 'Mandant',
    delegate: 'Délégué',
    scope: 'Périmètre',
    from: 'Début',
    to: 'Fin',
    source: 'Source',
    active: 'Active',
    inactive: 'Inactif',
    manual: 'Manuel',
    leave: 'Congé',
    search: 'Rechercher par mandant ou délégué',
    sourceLeave: 'Créée à partir d’un congé. Gérez-la via la demande associée.',
    invalid:
      'Sélectionnez des employés actifs distincts et une fin postérieure au début.',
    overlap:
      'Une délégation couvre déjà ce périmètre et cette période. Ajustez la période ou le périmètre.',
    disableTitle:
      'Désactiver la délégation de « {{principal}} » à « {{delegate}} » ?',
    disableDescription:
      'Le délégué ne traitera plus les approbations de ce périmètre.',
    saved: 'Délégation de « {{name}} » enregistrée',
    empty: 'Aucune délégation d’approbation',
    emptyDescription:
      'Créez une délégation pour permettre à quelqu’un de traiter les approbations pendant une période.',
    timeZone: 'Les horaires utilisent {{zone}}. L’instant de fin est exclu.',
  },
  typeUnavailable: 'Type de congé indisponible',
  noPickerPermission:
    'La sélection de personnes nécessite l’autorisation de lecture des utilisateurs. Contactez un administrateur.',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: 'Mes enregistrements',
      readableScope: 'Demandes d’approbation consultables',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'Toutes les approbations',
      leaveScope: 'Approbations de congé',
      fromTime: 'Heure de début (HH:mm)',
      toTime: 'Heure de fin (HH:mm)',
      timeInvalid:
        'Choisissez les dates et saisissez des heures valides au format 24 heures.',
      disabled: 'Délégation d’approbation de « {{name}} » désactivée',
      readOnly: 'Cette délégation est en lecture seule.',
    },
  },
};
