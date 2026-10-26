export default {
  certificates: {
    authz: {
      readable: 'Demandes personnelles et auxquelles je participe',
      requests: 'Demandes de certificat',
      view: 'Consulter',
      create: 'Créer',
      edit: 'Modifier',
      operate: 'Exécuter',
      issue: 'Délivrer',
      income: 'Revenu',
      owned: 'Possédé',
    },
    savedRecord: 'Demande de certificat de « {{name}} » enregistrée',
    issuedRecord: 'Certificat de « {{name}} » délivré',
    submittedRecord: 'Demande de certificat de « {{name}} » soumise',

    businessErrors: {
      CERTIFICATE_ACCESS_DENIED:
        'Opération sur le certificat refusée : accès refusé',
      CERTIFICATE_APPROVAL_REFUSED:
        'Opération sur le certificat refusée : approbation refusée',
      CERTIFICATE_ARTIFACT_MISSING:
        'Opération sur le certificat refusée : artefact manquant',
      CERTIFICATE_CLAIM_REQUIRED:
        'Opération sur le certificat refusée : prise en charge requise',
      CERTIFICATE_COMMAND_CONFLICT:
        'Opération sur le certificat refusée : conflit de commande',
      CERTIFICATE_COMMAND_INVALID:
        'Opération sur le certificat refusée : commande invalide',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Opération sur le certificat refusée : service requis',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Opération sur le certificat refusée : employé requis',
      CERTIFICATE_HEAD_REQUIRED:
        'Opération sur le certificat refusée : chef de service requis',
      CERTIFICATE_HR_REQUIRED:
        'Opération sur le certificat refusée : RH requis',
      CERTIFICATE_INCOME_DENIED:
        'Opération sur le certificat refusée : revenu non autorisé',
      CERTIFICATE_INCOME_INVALID:
        'Opération sur le certificat refusée : revenu invalide',
      CERTIFICATE_INVALID:
        'Opération sur le certificat refusée : données invalides',
      CERTIFICATE_PREPARATION_INVALID:
        'Opération sur le certificat refusée : préparation invalide',
      CERTIFICATE_PREPARATION_MISSING:
        'Opération sur le certificat refusée : préparation manquante',
      CERTIFICATE_PREPARATION_STALE:
        'Opération sur le certificat refusée : préparation obsolète',
      CERTIFICATE_SOURCE_STALE:
        'Opération sur le certificat refusée : source obsolète',
      CERTIFICATE_TARGET_MISMATCH:
        'Opération sur le certificat refusée : cible incohérente',
      CERTIFICATE_TEMPLATE_DENIED:
        'Opération sur le certificat refusée : modèle non autorisé',
    },

    title: 'Certificats',
    description: 'Demandez et délivrez des certificats aux employés',
    new: 'Nouvelle demande de certificat',
    edit: 'Modifier la demande de certificat',
    detail: 'Détails du certificat',
    issue: 'Délivrer le certificat',
    refresh: 'Actualiser',
    clear: 'Effacer les filtres',
    search: 'Rechercher par objet',
    all: 'Tous les statuts',
    name: 'Certificat',
    recordName: 'Certificat · {{name}}',
    type: 'Type',
    purpose: 'Objet',
    copies: 'Exemplaires',
    delivery: 'Mode de remise',
    applicant: 'Demandeur',
    createdAt: 'Date de demande',
    status: 'Statut',
    number: 'Numéro du certificat',
    issueDate: 'Date de délivrance',
    oldest: 'Du plus ancien au plus récent',
    newest: 'Du plus récent au plus ancien',
    empty: 'Aucune demande de certificat',
    noMatch: 'Aucune demande correspondante',
    failed: 'Impossible de terminer cette opération',
    unavailable: 'Cet enregistrement ou cette action n’est plus disponible',
    retry: 'Réessayer',
    cancel: 'Annuler',
    save: 'Enregistrer le brouillon',
    saved: 'Enregistré',
    loading: 'Chargement des détails du certificat',
    moreActions: 'Autres actions',
    backToList: 'Retour à la liste des certificats',
    consequences: {
      withdraw:
        'Retirer cette demande ; elle quittera la file d’examen active.',
      terminate: 'Clôturer cette demande ; le traitement normal s’arrêtera.',
      forceComplete:
        'Clore exceptionnellement cette demande ; aucun certificat ne sera délivré.',
      reject: 'Rejeter cette demande ; elle ne passera pas à la délivrance.',
      return: 'Renvoyer cette demande au demandeur pour modification.',
      unable:
        'Indiquer que les RH ne peuvent pas délivrer ce certificat ; la demande nécessitera une résolution.',
    },
    invalidInput:
      'Vérifiez les champs indiqués et saisissez des valeurs valides.',
    invalidCopies: 'Saisissez un entier compris entre 1 et 100.',
    invalidPurpose: 'L’objet doit comporter au maximum 2 000 caractères.',
    required: 'Obligatoire',
    confirm: 'Confirmer',
    discard: 'Abandonner les modifications',
    discardDescription: 'Vos modifications non enregistrées seront perdues.',
    confirmDescription:
      'Appliquer cette action au certificat demandé par {{name}} ? Cela modifie la demande actuelle.',
    history: 'Historique des approbations',
    mode: 'Position de l’examinateur',
    modes: {
      before: 'Avant ma décision',
      alongside: 'En parallèle de ma décision',
    },
    recipient: 'Destinataire',
    reason: 'Motif ou commentaire',
    download: 'Télécharger le DOCX',
    income: 'Revenu mensuel (CNY)',
    template: 'Modèle',
    selectTemplate: 'Choisir un modèle',
    revision: 'Révision figée',
    previous: 'Précédent',
    next: 'Suivant',
    prepare: 'Préparer la délivrance',
    generate: 'Générer le document',
    confirmIssue: 'Confirmer la délivrance',
    issued: 'Certificat délivré',
    issueDescription:
      'Préparez une révision figée du modèle, générez le document effectif, puis confirmez sa délivrance et archivez-le.',
    invalidIssue:
      'Choisissez une date de délivrance et saisissez un revenu valide avec au maximum deux décimales.',
    generateDescription:
      'La génération peut prendre un moment. En cas d’échec, réessayez cette préparation ; aucun certificat n’a encore été délivré.',
    confirmIssueDescription:
      'Le document généré sera délivré et enregistré définitivement dans le dossier de l’employé.',
    types: { employment: 'Emploi', income: 'Revenu', other: 'Autre' },
    deliveries: {
      pickup: 'Retrait sur place',
      mail: 'Courrier',
      digital: 'Numérique',
    },
    states: {
      draft: 'Brouillon',
      revision: 'Correction requise',
      head: 'Examen du responsable',
      issuing: 'Traitement RH',
      issued: 'Remis',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
      issueException: 'Exception de délivrance',
      administrativelyClosed: 'Clôturé administrativement',
    },
    actions: {
      edit: 'Modifier',
      submit: 'Soumettre',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      forceComplete: 'Clôture administrative',
      retry: 'Réessayer le traitement',
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer pour correction',
      claim: 'Prendre en charge',
      release: 'Libérer',
      assign: 'Attribuer',
      transfer: 'Transférer',
      appoint: 'Désigner',
      reassign: 'Réattribuer',
      comment: 'Commenter',
      read: 'Marquer comme lu',
      cc: 'Mettre en copie',
      addSigner: 'Ajouter un examinateur',
      addSign: 'Ajouter un examinateur',
      urge: 'Relancer',
      complete: 'Confirmer la délivrance',
      unable: 'Impossible à délivrer',
      delegate: 'Délégué',
      recall: 'Rappeler',
    },
  },
};
