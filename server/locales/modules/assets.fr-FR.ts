export default {
  authz: {
    returnHeld: 'Confirmer le retour physique des biens détenus hérités',
    resource: 'Registre des biens',
    view: 'Lire le registre des biens et les valeurs d’origine',
    viewHeld: 'Lire les biens que je détiens',
    manage: 'Enregistrer et corriger les descriptions des biens',
    heldScope: 'Biens que je détiens',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'Un administrateur de biens actif doit confirmer le retour physique.',
    ASSET_REQUEST_REUSED:
      'Cette clé de demande de retour identifie déjà une autre réception.',
    ASSET_RETURN_INELIGIBLE:
      'Confirmez l’article réellement détenu, l’employé et le numéro de série.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Traitez ce bien via sa demande effective avant de confirmer son retour.',

    ASSET_ACCESS_DENIED:
      'Vous n’avez pas l’autorisation d’effectuer cette opération sur le bien.',
    ASSET_NOT_FOUND: 'Bien introuvable.',
    ASSET_INVALID_INPUT:
      'Saisissez un code de bien, un nom et une valeur exacte positive ou nulle en centimes.',
    ASSET_CATEGORY_INACTIVE: 'Choisissez une catégorie de biens active.',
    ASSET_INVALID_COMMAND: 'Un acteur et un motif de correction sont requis.',
    ASSET_INVALID_VERSION: 'Saisissez la version actuelle du bien.',
    ASSET_VERSION_CONFLICT: 'Ce bien a changé. Chargez sa dernière version.',
    ASSET_CODE_EXISTS: 'Ce code de bien existe déjà.',
    ASSET_INVALID_STORED_AMOUNT:
      'La valeur enregistrée du bien dépasse la plage exacte prise en charge.',
    ASSET_WRITE_UNCONFIRMED:
      'L’enregistrement du bien n’a pas pu être confirmé.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Les biens attribués, empruntés ou réservés doivent être retournés avant la clôture du départ.',
  },
};
