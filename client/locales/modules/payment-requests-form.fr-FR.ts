export default {
  paymentRequestsForm: {
    new: 'Nouvelle demande de paiement',
    edit: 'Modifier la demande de paiement',
    description:
      'Soumettez la demande complétée ou enregistrez un brouillon. Les données métier requises sont vérifiées à nouveau lors de la soumission.',
    save: 'Enregistrer le brouillon',
    saved: 'Brouillon de paiement enregistré',
    draft: 'Brouillon',
    maxFiles: 'Sélectionnez au maximum 10 fichiers justificatifs.',
    limit: 'Ce texte dépasse la longueur maximale.',
    required: 'Ce champ est obligatoire.',
    amountInvalid:
      'Saisissez un montant positif ou nul avec au maximum deux décimales, dans la plage de centimes exacts prise en charge.',
    invalid: 'Vérifiez ce champ.',
    notEditable: 'Cet enregistrement ne peut plus être modifié.',
    inactive: 'Indisponible — choisissez une option admissible',
    select: 'Choisissez une option',
    unknown:
      'Le résultat n’est pas confirmé. Conservez votre saisie et réessayez exactement la même requête.',
    replay: 'Vérifier la requête d’origine',
    latest:
      'Dernière version chargée. Votre saisie est conservée ; comparez-la aux dernières options de la source avant d’enregistrer à nouveau.',
    leaveReady:
      'Cliquez à nouveau sur votre destination initiale pour quitter. Toute nouvelle modification annule cette confirmation.',
    applicantId: 'Demandeur',
    reason: 'Motif du paiement',
    sourceMode: 'Source d’approbation préalable',
    contract: 'Contrat',
    contractVersion: 'Version du contrat',
    contractId: 'Contrat',
    counterparty: 'Cocontractant',
    customerAccountHint:
      'Les contrats clients ne possèdent pas de compte bancaire fournisseur. Si nécessaire, le compte protégé peut être corrigé après signalement d’une exception par le caissier.',
    purchase: 'Commande d’achat approuvée',
    none: 'Sans approbation préalable',
    purchaseOrderId: 'Commande d’achat',
    noPriorApprovalReason: 'Explication du paiement sans approbation préalable',
    vendorId: 'Bénéficiaire',
    amount: 'Montant (yuans)',
    invoiceNumber: 'Numéro de facture',
    paymentMethod: 'Mode de paiement',
    orderStatus: 'Statut de la commande',
    approved: 'Montant approuvé',
    paid: 'Déjà payé',
    pending: 'Paiements en attente',
    available: 'Montant disponible',
    cents: 'centimes',
    overApproval:
      'Les montants dépassant le plafond cumulé approuvé, paiements en attente compris, nécessitent une approbation complète. Les demandes de dépassement de paiement sont autorisées.',
    frozenHint:
      'La source, le bénéficiaire, le montant et la facture sont figés à la soumission.',
    voucherAttachments: 'Justificatif de paiement',
    attachments: 'Justificatif de facture',
    uploadHint:
      'PDF, JPEG, PNG ou WebP ; 5 Mo maximum. Retirer une sélection conserve le justificatif enregistré.',
    fileSize: 'Choisissez un fichier non vide de 5 Mo maximum.',
    fileType:
      'Choisissez un fichier PDF, JPEG, PNG ou WebP avec l’extension correspondante.',
    selectEvidence:
      'Sélectionner un justificatif enregistré / vérifier le téléversement',
    uploading: 'Téléversement ou lecture du justificatif…',
    uploadUnknown:
      'Le résultat du téléversement n’est pas confirmé. Consultez le justificatif enregistré et vérifiez-le avant de téléverser à nouveau. Aucune nouvelle tentative automatique n’est effectuée.',
    emptyEvidence: 'Aucun justificatif enregistré.',
    evidenceMissing:
      'Certains justificatifs ne sont plus accessibles. Actualisez ou vérifiez vos autorisations.',
    removeEvidence: 'Retirer {{name}} de cette sélection',
    bank: {
      title: 'Compte privé du bénéficiaire',
      denied: 'Vous n’avez pas accès à ce compte de paiement.',
      missing: 'Aucun compte de paiement n’a été enregistré.',
      correct: 'Corriger le compte de paiement',
      unavailable:
        'La correction du compte est disponible uniquement au demandeur ou créateur pendant le traitement d’une exception.',
      bankName: 'Banque',
      bankAccount: 'Numéro de compte',
      bankAccountName: 'Titulaire du compte',
      reason: 'Motif de correction',
      saved: 'Compte de paiement corrigé',
      unknown:
        'Le résultat de l’écriture n’est pas confirmé. Lisez le dernier compte et comparez-le avant de soumettre explicitement à nouveau.',
      conflict:
        'La version du compte ou du paiement a changé. Chargez les dernières données ; vos modifications sont conservées.',
      reconciled:
        'Dernières données chargées. Comparez votre saisie conservée et confirmez explicitement toute nouvelle écriture.',
    },
  },
};
