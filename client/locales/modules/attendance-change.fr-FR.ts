export default {
  attendanceChange: {
    authz: { resource: 'Corrections de pointage' },
    navigation: 'Corrections de pointage',
    new: 'Nouvelle correction de pointage',
    edit: 'Modifier la correction de pointage',
    emptyMissing:
      'Aucun pointage manquant admissible. Contactez les RH si les justificatifs de présence importés sont incorrects.',
    uploadAfterDraft:
      'Enregistrez le brouillon, puis ouvrez Modifier pour téléverser des justificatifs.',
    formDescription:
      'Vérifiez les justificatifs et soumettez pour examen, ou enregistrez un brouillon.',
    description:
      'Fournissez l’heure de pointage manquante et les justificatifs à examiner par votre responsable.',
    date: 'Date du pointage manquant',
    original: 'Pointage manquant d’origine',
    correctionAt: 'Heure de pointage corrigée',
    proof: 'Déclaration justificative',
    attachments: 'Pièces justificatives',
    punchKinds: { in: 'Pointer l’arrivée', out: 'Pointer le départ' },
    missing: 'Sélectionner un pointage manquant',
    policyHint:
      'Le pointage manquant doit dater de sept jours calendaires maximum. Les demandes en attente et approuvées comptent dans la limite mensuelle.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'Le pointage manquant a changé. Actualisez et sélectionnez-le à nouveau.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Seuls les pointages manquants des sept derniers jours calendaires peuvent être soumis. Contactez les RH pour les enregistrements plus anciens.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'La correction doit avoir lieu à la date du pointage manquant et ne peut pas être future.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'Les corrections en attente et approuvées ont atteint la limite mensuelle.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'Une correction en attente ou approuvée existe déjà pour ce pointage manquant.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Fournissez une déclaration justificative ou téléversez des justificatifs.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'Le demandeur doit être un employé actif. Contactez les RH pour vérifier le dossier.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: 'Indiquez un motif de correction.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Les pièces jointes doivent être non vides et faire au maximum 5 Mo.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Utilisez des fichiers PDF, JPEG, PNG ou WebP dont le contenu correspond au format.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'Vous n’avez pas l’autorisation de consulter ou téléverser ce justificatif.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'Le lien de pièce jointe est invalide. Sélectionnez un justificatif téléversé dans ce brouillon.',
      ATTENDANCE_BASELINE_CHANGED:
        'Le justificatif de présence d’origine a changé. L’approbation a été annulée ; actualisez pour l’examiner.',
    },
  },
};
