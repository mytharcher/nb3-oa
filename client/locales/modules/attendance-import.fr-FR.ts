export default {
  attendanceImport: {
    title: 'Importer des justificatifs de présence',
    description:
      'Prévisualisez et importez des justificatifs bruts immuables. Cette opération n’évalue pas la présence et ne calcule pas la paie.',
    template: 'Télécharger le modèle Excel',
    downloadStarted: 'Le téléchargement du modèle Excel a commencé.',
    downloadFailed: 'Impossible de télécharger le modèle Excel. Réessayez.',
    file: 'Fichier Excel de justificatifs',
    empty: 'Choisissez un fichier .xlsx pour lancer l’aperçu.',
    help: 'Utilisez le modèle avec une seule feuille et des cellules de texte. Colonnes requises : userId, date, punchKind, source, sourceKey et sourceData (objet JSON). punchedAt peut être vide ou contenir un texte ISO UTC comme 2035-01-02T01:00:00Z. date est la date locale de l’entreprise. userId est l’identifiant stable d’un employé réel, jamais un nom. Maximum 4 Mio et 1 000 lignes. Les formules et dates numériques sont refusées. Les clés des objets JSON doivent être uniques ; les nombres doivent conserver leur valeur décimale lors de la sérialisation et les entiers doivent être sûrs. Représentez les grands identifiants ou décimaux exacts sous forme de chaînes.',
    parsing: 'Analyse du fichier Excel',
    preview: 'Aperçu : {{count}} lignes',
    confirm:
      'J’ai vérifié ces justificatifs et je confirme l’importation du lot complet',
    submit: 'Confirmer l’importation du lot',
    submitting: 'Importation',
    success: '{{count}} lignes de justificatifs importées.',
    evidence: 'Développer le justificatif d’origine',
    denied:
      'Vous n’avez pas l’autorisation d’importer des justificatifs de présence.',
    failed: 'Le lot n’a pas pu être importé. Vérifiez le fichier et réessayez.',
    invalid:
      'Le serveur a refusé ces justificatifs. Vérifiez les identifiants des employés, les dates de l’entreprise et les données sources.',
    conflict:
      'Une clé source possède déjà un justificatif différent. Aucune ligne de ce lot n’a été importée.',
    retry: 'Réessayer l’importation',
    discard: 'Abandonner l’aperçu des justificatifs non soumis ?',
    continue: 'Continuer la vérification',
    discardConfirm: 'Abandonner l’aperçu',
    discardHelp:
      'Après avoir abandonné l’aperçu, cliquez à nouveau sur votre destination pour poursuivre la navigation.',
    columns: {
      userId: 'Identifiant utilisateur',
      date: 'Date de l’entreprise',
      punchKind: 'Type de pointage',
      punchedAt: 'Instant UTC',
      source: 'Source',
      sourceKey: 'Clé source',
      sourceData: 'Justificatif d’origine',
    },
    errors: {
      file: 'Choisissez un fichier .xlsx de 4 Mio maximum.',
      archive:
        'L’archive Excel est invalide ou dépasse les limites d’extraction sûre.',
      template:
        'Utilisez exactement les en-têtes du modèle téléchargé et une seule feuille.',
      cell: 'Ligne {{row}} : utilisez des cellules de texte sans formule et uniquement les sept colonnes du modèle.',
      rows: 'Utilisez de 1 à 1 000 lignes consécutives de justificatifs après l’en-tête.',
      identity:
        'Ligne {{row}} : fournissez un identifiant utilisateur stable, une source et une clé source valides.',
      date: 'Ligne {{row}} : fournissez une date réelle de l’entreprise, un type in/out et un instant UTC ISO explicite ou une valeur vide.',
      evidence:
        'Ligne {{row}} : fournissez un objet JSON de taille limitée avec des clés uniques, des nombres préservés lors des conversions et une clé source unique.',
    },
  },
};
