export default {
  general: {
    authz: {
      resource: 'Demandes générales',
      submit: 'Soumettre sa propre demande générale',
      delegate: 'Soumettre une demande générale pour un employé',
      view: 'Lire les demandes générales',
    },
    navigation: 'Demandes générales',
    new: 'Nouvelle demande générale',
    edit: 'Modifier la demande générale',
    title: 'Titre',
    body: 'Détails de la demande',
    extraApprovers: 'Approbateurs supplémentaires',
    extraStage: 'Examen supplémentaire',
    extraHint:
      'Choisissez une à trois personnes. Elles examinent la demande dans cet ordre après votre responsable.',
    addApprover: 'Ajouter un approbateur',
    removeApprover: 'Retirer l’approbateur {{number}}',
    approver: 'Approbateur supplémentaire {{number}}',
    formDescription:
      'Décrivez un sujet non couvert par un autre type de demande.',
    approversInvalid:
      'Choisissez une à trois personnes actives distinctes, autres que le demandeur.',
    invalid:
      'Saisissez un titre et les détails de la demande en respectant la longueur autorisée.',
    inactive: 'Le demandeur doit être un employé actif.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    uncertainCreate:
      'Le résultat de l’enregistrement est incertain. Fermez et consultez Mes demandes avant de créer un autre brouillon.',
    attachmentInvalid:
      'Certaines pièces jointes n’appartiennent pas à cette demande.',
    attachmentDenied: 'Vous ne pouvez pas accéder à ces pièces jointes.',
    attachmentType:
      'Utilisez un fichier PDF, JPEG, PNG ou WebP dont le format correspond.',
    attachmentSize:
      'Les pièces jointes doivent être non vides et faire au maximum 5 Mo.',
  },
};
