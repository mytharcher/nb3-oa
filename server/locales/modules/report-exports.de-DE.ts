import type { ReportExportsResource } from './report-exports.en-US.js';

const deDE: ReportExportsResource = {
  reportExports: {
    sheet: 'Bericht',
    leaveMonthly: {
      fields: {
        year: 'Jahr',
        month: 'Startmonat',
        leaveType: 'Urlaubsart',
        approvedRequestCount: 'Anzahl genehmigter Anträge',
        approvedRequestedDays: 'Genehmigte beantragte Tage (vor Stornierung)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Abteilung',
        year: 'Jahr',
        subject: 'Budgetposition',
        allocatedCents: 'Zugeteilt in Cent',
        heldCents: 'Reserviert in Cent',
        usedCents: 'Verbraucht in Cent',
        availableCents: 'Verfügbar in Cent',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Abteilung',
        positionName: 'Position',
        year: 'Jahr',
        limit: 'Grenze',
        initialized: 'Initialisiert',
        used: 'Belegt',
        pending: 'Ausstehend',
        allocated: 'Zugeteilt',
        replacementPending: 'Ersatz ausstehend',
        replacementAllocated: 'Ersatz zugeteilt',
        replacementBlocked: 'Ersatz blockiert',
        available: 'Verfügbar',
        capacityState: 'Kapazitätsstatus',
      },
    },
    contractLedger: {
      fields: {
        number: 'Nummer',
        departmentName: 'Abteilung',
        status: 'Status',
        amountCents: 'Betrag in Cent',
        heldCents: 'Reserviert in Cent',
        paidCents: 'Bezahlt in Cent',
        availableCents: 'Verfügbar in Cent',
        startsOn: 'Beginnt am',
        endsOn: 'Endet am',
        asOf: 'Stand',
        expiryState: 'Ablaufstatus',
        paymentState: 'Zahlungsstatus',
        paidBasisPoints: 'Bezahlt in Basispunkten',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Jahr',
        month: 'Ausgabenmonat',
        category: 'Kategoriecode',
        settledRequestCount: 'Anzahl abgerechneter Anträge',
        settledExpenseCents:
          'Abgerechnete Bruttoausgaben in Cent (keine Barauszahlung)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Stufe',
        completedTaskCount: 'Anzahl abgeschlossener Entscheidungsaufgaben',
        totalElapsedMs:
          'Gesamte tatsächliche Dauer in ms (einschließlich Wartezeit)',
        averageElapsedMs:
          'Mittlere tatsächliche Dauer in ms (einschließlich Wartezeit)',
      },
      sheet: 'Erledigte Urlaubsaufgaben',
      stages: {
        manager: 'Führungskraft',
        head: 'Abteilungsleitung',
        hr: 'Personalabteilung',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Aktuelles Startjahr',
        month: 'Aktueller Startmonat',
        submittedRunCount: 'Eingereichte Läufe (einschließlich offener)',
        returnedRunCount: 'Läufe mit Rückgabe',
        returnDecisionCount: 'Anzahl der Rückgabeentscheidungen',
        returnRateBasisPoints: 'Rückgabequote in Basispunkten',
      },
      sheet: 'Urlaubsrückgabequote',
    },
  },
};

export default deDE;
