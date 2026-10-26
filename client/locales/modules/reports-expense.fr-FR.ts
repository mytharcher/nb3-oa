export default {
  reportsExpense: {
    firstPage: 'Aller à la première page',

    pageEmpty: 'Aucun groupe de frais sur cette page',
    pageEmptyHint:
      'La source actuelle comporte moins de groupes. Allez à la première page ou utilisez Précédent pour revenir à une page disponible.',

    exportStarted: 'Le téléchargement Excel a commencé',
    reloading:
      'Actualisation… Le résultat précédent reste visible jusqu’à la fin du chargement des filtres actuels.',
    exportLock:
      'Exportation… Les filtres et la navigation sont verrouillés jusqu’à la fin du téléchargement.',

    title: 'Frais réglés par mois',
    description:
      'Frais bruts réglés par date de dépense d’origine et catégorie ; il ne s’agit pas du net payé en espèces.',
    month: 'Mois de dépense (1–12, facultatif)',
    effectiveYear: 'Année calendaire de l’entreprise : {{year}}',
    sourceNotice:
      'Jusqu’à 10 000 demandes réglées autorisées peuvent être vérifiées. Modifier l’année ou le mois ne réduit pas ce parcours des sources.',
    precondition:
      'Les justificatifs de règlement n’ont pas pu être vérifiés ou une limite de rapport a été dépassée. Demandez à un administrateur de vérifier les justificatifs sources et la taille du rapport.',
    forbidden:
      'Vous n’avez pas accès à la source actuelle des remboursements. Contactez un administrateur pour vérifier les autorisations sur les sources.',
    empty: 'Aucun frais réglé cette année',
    emptyHint:
      'Seules les demandes autorisées avec justificatifs de règlement vérifiés sont incluses. Vérifiez l’année et le mois ou demandez à un administrateur de vérifier l’accès aux sources.',
    fields: {
      year: 'Année',
      month: 'Mois de dépense',
      category: 'Code de catégorie',
      settledRequestCount: 'Demandes réglées',
      settledExpenseCents: 'Frais bruts réglés (CNY, hors espèces)',
    },
  },
};
