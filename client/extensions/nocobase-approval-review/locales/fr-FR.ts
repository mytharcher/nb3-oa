import type { ApprovalReviewLocale } from './en-US.js';
const locale: ApprovalReviewLocale = {
  approvalAi: {
    history: {
      title: 'Historique de génération',
      total: 'Tentatives : {{count}}',
      succeeded: 'Réussie',
      failed: 'Échouée',
      cancelled: 'Annulée',
      generating: 'En cours',
      unavailable: 'Indisponible',
      current: 'Affiché',
      viewing: 'Version de suggestion V{{count}}',
      viewLatest: 'Voir le dernier rapport',
      failedReport:
        'La dernière génération a échoué. V{{count}} reste affiché.',
      cancelledReport:
        'La dernière génération a été annulée. V{{count}} reste affiché.',
      unknownFailure:
        'La génération a échoué ; aucune cause précise n’a été enregistrée.',
      invalidReport: 'Le contenu généré n’a pas passé la validation.',
      outputLimit:
        'La limite de sortie a été atteinte avant la fin du rapport.',
      interrupted:
        'La génération a été interrompue. Réessayez pour lancer une nouvelle tentative.',
      incomplete: 'Le modèle n’a pas terminé le rapport.',
      invalidJson: 'Le modèle n’a pas renvoyé de rapport JSON complet.',
      unverifiedEvidence:
        'Une citation du rapport n’a pas pu être vérifiée dans les documents fournis.',
      started: 'Début : {{time}}',
      deadline: 'Échéance : {{time}}',
      tokens:
        'Jetons : entrée {{input}} · sortie {{output}} · raisonnement {{reasoning}}',
      duration: 'Appel du modèle : {{seconds}} s',
      network: 'La connexion au modèle a échoué.',
      rateLimited: 'La limite de requêtes du service a été atteinte.',
      configuration:
        'La configuration ou les identifiants du service sont invalides.',
      quota: 'Le quota du service du modèle est épuisé.',
      contextLimit: 'Les documents dépassent la limite de contexte du modèle.',
      providerRejected:
        'Le service du modèle a refusé la demande de génération.',
      timeout: 'Le délai de génération a expiré.',
    },
    retry: 'Réessayer la génération',
    readOnly: 'Cette suggestion est en lecture seule.',
    actionFailed: 'Échec. Actualisez le statut avant de réessayer.',
    versionCount: '{{current}} / {{count}}',
    version: 'Version {{count}}',
    latestVersion: '(dernière)',
    latestRunActions: 'Les actions ciblent la génération actuelle.',
    cancelGeneration: 'Annuler la génération',
    cancelling: 'Annulation…',
    expandReport: 'Développer les détails',
    collapseReport: 'Réduire les détails',
    findings: 'Points de contrôle',
    generatedAt: 'Généré le',
    nextStep: 'Prochaine étape suggérée :',
    noFindings: 'Aucun résultat',
    noMaterials: 'Aucun document enregistré. Vérifiez les originaux.',
    coverageCounts:
      'Lus {{read}} · Non pris en charge {{unsupported}} · Manquants {{missing}}',
    reviewPrivacy:
      'Contenu IA indicatif. Vérifiez les preuves avant de décider.',
    historyReadOnly: 'Suggestion d’une tâche terminée, pour consultation.',
    materialKinds: {
      field: 'Champ de demande',
      text: 'Texte',
      attachment: 'Pièce jointe',
      knowledge: 'Base de contrôle',
      record: 'Document métier',
      aggregate: 'Données agrégées',
    },
    materialStatuses: {
      partial_read: 'Lecture partielle',
      read: 'Lu',
      not_supported: 'Non pris en charge',
      missing: 'Manquant ou inaccessible',
    },
    stateHints: {
      cancelled: 'Génération annulée. Vous pouvez recommencer.',
      none: 'Aucune suggestion. Générez-la manuellement ; l’approbation reste possible.',
      queued: 'En attente. Vous pouvez poursuivre l’approbation.',
      running: 'Génération en cours. Vous pouvez poursuivre l’approbation.',
      failed: 'Échec de génération. Vous pouvez réessayer.',
    },
    verdicts: {
      conforms: 'Conforme',
      nonconforming: 'Non conforme',
      needs_verification: 'À vérifier',
      not_covered: 'Non couvert',
    },
    title: 'Assistant IA d’approbation',
    refresh: 'Actualiser',
    submittingGeneration: 'Envoi de la demande…',
    statuses: {
      cancelled: 'Annulée',
      none: 'Non générée',
      queued: 'En attente',
      running: 'Génération',
      succeeded: 'Prête',
      failed: 'Échec',
    },
    generate: 'Générer une suggestion',
    regenerate: 'Générer à nouveau',
    model: 'Modèle',
    coverage: 'Couverture des documents',
    evidence: 'Preuves',
  },
};
export default locale;
