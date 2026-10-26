export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Tâche d’intégration en retard',
      overdueBody:
        'Une tâche d’intégration est en retard. Examinez les tâches qui vous sont actuellement attribuées.',
    },
    authz: {
      resource: 'Intégration',
      readable: 'Participants à l’intégration',
      view: 'Consulter l’intégration',
      create: 'Créer une intégration',
      cancel: 'Annuler l’intégration',
      claim: 'Prendre la tâche en charge',
      reassignMentor: 'Réattribuer le chef de service',
      transfer: 'Transférer',
      release: 'Libérer la tâche',
      complete: 'Terminer la tâche',
      forceComplete: 'Forcer la clôture',
      viewSalary: 'Consulter le salaire à l’intégration',
      viewBank: 'Consulter les coordonnées bancaires à l’intégration',
    },
    errors: {
      employeeSourceConflict:
        'La source d’intégration a déjà été liée à des détails d’employé différents.',
      employeeAccountEnabled:
        'Le compte d’intégration doit rester désactivé pendant la création du dossier de l’employé.',
      forbidden:
        'Vous n’avez pas l’autorisation d’effectuer cette opération d’intégration.',
      sourceInvalid:
        'L’allocation de recrutement ou les données métier de l’intégration ne sont plus valides.',
      idempotencyConflict:
        'Cet identifiant de commande a déjà été utilisé avec des détails différents.',
    },
  },
};
