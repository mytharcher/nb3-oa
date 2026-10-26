export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'Un justificatif d’apposition effective et terminée du sceau est requis.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'Ce justificatif de sceau appartient à des données de contrat différentes.',
      CONTRACT_ACCESS_DENIED:
        'Ce contrat se trouve hors de vos droits d’accès.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Cette action est indisponible pour le contrat.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'Le montant du contrat ne peut pas être inférieur au total des paiements effectués et réservés.',
      CONTRACT_ATTACHMENT_DENIED:
        'Le champ de pièce jointe ou l’enregistrement du contrat se trouve hors de vos droits d’accès.',
      CONTRACT_ATTACHMENT_INVALID:
        'Choisissez des pièces jointes valides appartenant à cette demande de contrat.',
      CONTRACT_CANDIDATE_REMOVED:
        'Cette proposition de contrat non publiée a été supprimée. Créez une nouvelle demande.',
      CONTRACT_CATEGORY_INACTIVE: 'Choisissez un type de contrat actif.',
      CONTRACT_CORRUPT_BALANCE:
        'Les totaux de paiement du contrat sont incohérents. Contactez un administrateur.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Un employé actif disposant d’un service principal est requis.',
      CONTRACT_FIELDS_RESTRICTED:
        'Les champs requis du contrat se trouvent hors de vos droits d’accès.',
      CONTRACT_FILE_SIZE:
        'Choisissez un fichier de contrat non vide de 5 Mio maximum.',
      CONTRACT_FILE_TYPE:
        'Le texte du contrat doit être au format PDF ; les justificatifs peuvent être des PDF, JPEG, PNG ou WebP dont le contenu correspond au format.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Cette clé de requête a déjà été utilisée avec des détails différents. Actualisez avant de soumettre à nouveau.',
      CONTRACT_INACTIVE_SOURCE:
        'Choisissez une source de contrat approuvé en vigueur.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Complétez le motif du contrat, les conditions de paiement et la version immuable du texte.',
      CONTRACT_INPUT_INVALID:
        'Vérifiez les champs de saisie déclarés du contrat.',
      CONTRACT_INVALID_AMOUNT:
        'Saisissez un montant positif ou nul en centimes entiers exacts, dans la plage prise en charge.',
      CONTRACT_INVALID_ID: 'Une identité valide de taille limitée est requise.',
      CONTRACT_INVALID_TIME: 'L’horodatage du contrat est invalide.',
      CONTRACT_LIMIT_EXCEEDED:
        'Les montants en attente et payés dépassent le plafond du contrat.',
      CONTRACT_NOT_CANDIDATE:
        'Seule la proposition de contrat non publiée de cette demande peut être supprimée.',
      CONTRACT_NOT_FOUND: 'La source du contrat est introuvable.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Libérez les paiements en attente avant de résilier le contrat.',
      CONTRACT_REASON_REQUIRED:
        'Saisissez un motif respectant la longueur prise en charge.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Seul le demandeur peut actualiser explicitement la version de base d’une modification renvoyée.',
      CONTRACT_REQUEST_KEY_REQUIRED: 'Une clé de requête stable est requise.',
      CONTRACT_RESERVATION_CLOSED:
        'La réservation de paiement a déjà été clôturée.',
      CONTRACT_RULE_INVALID:
        'La politique d’approbation du contrat est absente ou invalide. Contactez un administrateur.',
      CONTRACT_SLA_UNSUPPORTED:
        'L’adaptateur d’approbation installé prend uniquement en charge les délais configurés de 24/48 heures.',
      CONTRACT_SOURCE_CONFLICT:
        'Cette référence appartient à une autre source de contrat.',
      CONTRACT_STORED_ID_INVALID:
        'Une identité de contrat enregistrée est invalide. Contactez un administrateur.',
      CONTRACT_SUPPLIER_INVALID:
        'Le fournisseur doit être actif et sa qualification approuvée. Actualisez sa qualification avant l’approbation.',
      CONTRACT_TARGET_MISMATCH:
        'La cible d’approbation appartient à une autre demande de contrat.',
      CONTRACT_TEXT_INVALID:
        'Choisissez une version immuable du texte PDF appartenant à cette demande.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Des versions du texte du contrat ne peuvent être ajoutées qu’à un brouillon personnel ou une révision renvoyée.',
      CONTRACT_TEXT_REQUIRED:
        'Sélectionnez une version immuable valide du texte du contrat.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Utilisez l’opération de contrat dédiée et protégée.',
      CONTRACT_VERSION_CONFLICT:
        'Le contrat approuvé a changé. Renvoyez la demande, actualisez explicitement sa version de base et soumettez-la à nouveau pour examen.',
    },
    authz: {
      resource: 'Contrats et modifications',
      view: 'Consulter les demandes de contrat',
      submit: 'Créer et modifier ses propres demandes de contrat',
      ledger:
        'Lire le registre des contrats approuvés et leurs versions immuables',
      historicalEntry:
        'Enregistrer un contrat historique avec un dossier juridique audité',
    },
  },
};
