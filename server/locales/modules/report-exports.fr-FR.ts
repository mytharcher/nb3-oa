import type { ReportExportsResource } from './report-exports.en-US.js';

const frFR: ReportExportsResource = {
  reportExports: {
    sheet: 'Rapport',
    leaveMonthly: {
      fields: {
        year: 'Année',
        month: 'Mois de début',
        leaveType: 'Type de congé',
        approvedRequestCount: 'Nombre de demandes approuvées',
        approvedRequestedDays: 'Jours demandés approuvés (avant annulation)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Service',
        year: 'Année',
        subject: 'Poste budgétaire',
        allocatedCents: 'Allocation en centimes',
        heldCents: 'Réservation en centimes',
        usedCents: 'Utilisation en centimes',
        availableCents: 'Disponible en centimes',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Service',
        positionName: 'Poste',
        year: 'Année',
        limit: 'Plafond',
        initialized: 'Initialisé',
        used: 'Utilisé',
        pending: 'En attente',
        allocated: 'Alloué',
        replacementPending: 'Remplacement en attente',
        replacementAllocated: 'Remplacement alloué',
        replacementBlocked: 'Remplacement bloqué',
        available: 'Disponible',
        capacityState: 'État de capacité',
      },
    },
    contractLedger: {
      fields: {
        number: 'Numéro',
        departmentName: 'Service',
        status: 'Statut',
        amountCents: 'Montant en centimes',
        heldCents: 'Réservation en centimes',
        paidCents: 'Payé en centimes',
        availableCents: 'Disponible en centimes',
        startsOn: 'Commence le',
        endsOn: 'Se termine le',
        asOf: 'Au',
        expiryState: 'État d’expiration',
        paymentState: 'État du paiement',
        paidBasisPoints: 'Payé en points de base',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Année',
        month: 'Mois de dépense',
        category: 'Code de catégorie',
        settledRequestCount: 'Nombre de demandes réglées',
        settledExpenseCents: 'Frais bruts réglés en centimes (hors espèces)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Étape',
        completedTaskCount: 'Nombre de tâches de décision terminées',
        totalElapsedMs:
          'Temps calendaire total écoulé en ms (attente comprise)',
        averageElapsedMs:
          'Temps calendaire moyen écoulé en ms (attente comprise)',
      },
      sheet: 'Tâches de congé terminées',
      stages: {
        manager: 'Responsable',
        head: 'Chef de service',
        hr: 'RH',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Année de début actuelle',
        month: 'Mois de début actuel',
        submittedRunCount: 'Cycles soumis (ouverts compris)',
        returnedRunCount: 'Cycles avec un retour',
        returnDecisionCount: 'Nombre de décisions de retour',
        returnRateBasisPoints: 'Taux de retour en points de base',
      },
      sheet: 'Taux de retour des congés',
    },
  },
};

export default frFR;
