export default {
  vendorQualifications: {
    authz: {
      resource: 'Qualification fournisseur',
      view: 'Consulter les qualifications fournisseurs',
      submit: 'Créer et modifier les demandes de qualification fournisseur',
      paymentAccount: 'Lire les comptes bancaires protégés des fournisseurs',
      updatePaymentAccount:
        'Mettre à jour le compte bancaire de son propre brouillon fournisseur',
      manage: 'Configurer le comité de qualification fournisseur',
    },
    schedule: {
      expiryReminder:
        'La qualification du fournisseur {{supplierName}} expire le {{expiry}}. Veuillez organiser son renouvellement.',
      title: 'Rappels d’expiration des qualifications fournisseurs',
      description:
        'Relancer les achats 30 jours calendaires de l’entreprise avant l’expiration de la qualification.',
    },
  },
};
