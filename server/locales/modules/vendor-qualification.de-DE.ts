export default {
  vendorQualifications: {
    authz: {
      resource: 'Lieferantenqualifizierung',
      view: 'Lieferantenqualifizierungen anzeigen',
      submit: 'Anträge zur Lieferantenqualifizierung erstellen und bearbeiten',
      paymentAccount: 'Geschützte Lieferantenbankkonten lesen',
      updatePaymentAccount:
        'Lieferantenbankkonto im eigenen Entwurf aktualisieren',
      manage: 'Ausschuss zur Lieferantenqualifizierung einrichten',
    },
    schedule: {
      expiryReminder:
        'Die Qualifizierung des Lieferanten {{supplierName}} läuft am {{expiry}} ab. Veranlassen Sie bitte die Verlängerung.',
      title: 'Erinnerungen an ablaufende Lieferantenqualifizierungen',
      description:
        'Den Einkauf 30 Tage im Unternehmenskalender vor Ablauf der Qualifizierung erinnern.',
    },
  },
};
