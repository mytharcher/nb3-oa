export default {
  flowDiagram: {
    escapeHint: 'Appuyez sur Échap pour quitter',
    controls: 'Commandes du diagramme',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    fitView: 'Ajuster la vue',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    minimap: 'Minicarte',

    empty: 'Aucun état à afficher.',
    loading: 'Disposition du diagramme…',
    failed:
      'Impossible de disposer le diagramme. Consultez les paramètres du processus et les exécutions récentes.',
    nodeHelp: 'État du processus. Déplacez et zoomez pour explorer.',
    edgeHelp: 'Transition du processus',
  },
  processManagement: {
    managementReason: 'Motif',
    normalDescription:
      'Affiche le parcours métier principal ; les conditions déterminent les branches.',
    revealHint:
      'Survolez une étape pour afficher ses retours et autres sorties, puis une sortie pour voir les détails.',
    graphLegend: 'Légende du diagramme',
    otherExits: 'Autres sorties',
    exitNext: 'Ensuite, il peut :',
    exitEnds: 'Le processus se termine ici.',
    nodeTypes: {
      start: 'Début',
      approval: 'Approbation',
      work: 'Étape de travail',
      success: 'Terminé',
      negative: 'Terminé',
      exception: 'Retour ou exception',
    },
    rulesCount_one: '{{count}} règle',
    rulesCount_other: '{{count}} règles',
    notReached: 'Pas encore atteint',
    parameters: {
      title: 'Paramètres du processus',
      description:
        'Seuils lus par ce processus à chaque étape. Chaque valeur est définie une seule fois et s’applique à toutes les étapes indiquées à côté.',
      none: 'Ce processus n’a aucun paramètre ajustable.',
      onNodes:
        'Ce processus est configuré dans ses étapes. Utilisez le bouton de paramètres d’une étape du diagramme.',
      forbidden:
        'Vous n’avez pas l’autorisation de consulter les paramètres de ce processus.',
      readOnly: 'Vous pouvez consulter ces paramètres mais pas les modifier.',
      changed: 'Modifié',
      scheduled: 'Passe à {{value}} le {{date}}.',
      orderViolated:
        'Incohérence avec un paramètre lié : un seuil inférieur ne peut pas dépasser un seuil supérieur. Ajustez-les ici et enregistrez-les ensemble.',
      discard: 'Abandonner les modifications',
      save_zero: 'Enregistrer',
      save_one: 'Enregistrer 1 modification',
      save_other: 'Enregistrer {{count}} modifications',
      saved_one: '1 paramètre enregistré',
      saved_other: '{{count}} paramètres enregistrés',
    },
    nodeSettings: {
      edit: 'Modifier les paramètres',
      editNamed: 'Modifier les paramètres de {{name}}',
      title: 'Modifier les paramètres de {{name}}',
      parameter: 'Paramètre',
      effect:
        'Les modifications ne réécrivent pas les instantanés enregistrés des demandes ni les tâches existantes. Les nouvelles soumissions utilisent la configuration en vigueur ; les nouvelles soumissions après correction suivent les règles du processus propriétaire.',
      shared: 'Paramètre partagé. Affecte également : {{flows}}.',
      unavailable:
        'Cette étape ne comporte aucun paramètre modifiable disponible. Fermez ce dialogue et choisissez une étape configurée.',
      forbidden:
        'Vous n’avez pas l’autorisation de modifier la configuration de cette étape.',
      newCommittee: 'Publier une nouvelle structure de comité',
      seat: 'Version {{version}} · personne du siège {{name}}',
      committeeContext:
        'Étape sélectionnée : version {{selected}}. Active : {{active}}. Dernière enregistrée : {{latest}}.',
    },
    conditionMissing:
      'Cette branche nécessite une description explicite de condition ; consultez les règles métier propriétaires',
    snapshotConditions:
      'Les seuils de montant, de jours et de grade utilisent les règles figées à la soumission. Cette définition explique les critères de décision, pas l’instantané d’une demande historique.',
    branchConditions: {
      travelCancellation_unbooking:
        'Le déplacement d’origine demande une réservation ; l’annulation nécessite donc son annulation',
      travelCancellation_approved:
        'Le déplacement d’origine ne demande pas de réservation ; aucune annulation de réservation n’est requise',
      reimbursement_managerApproved_head:
        'Remboursement total > seuil figé du chef de service et validation de fusion des tâches responsable/chef non réussie',
      reimbursement_managerApproved_finance:
        'Le remboursement total ne dépasse pas le seuil du chef, ou les tâches responsable/chef ont été fusionnées valablement',

      training_managerApproved_head:
        'Montant de formation > 0 et tâches responsable/chef non fusionnées valablement',
      training_managerApproved_finance:
        'Montant de formation > 0 ; responsable et chef identiques et validation de fusion des tâches d’approbation réussie pour ce cycle',
      training_managerApproved_approved: 'Le montant de formation est nul',

      travel_managerApproved_head:
        'Les conditions de fusion responsable/chef ne sont pas remplies',
      travel_managerApproved_finance:
        'Le responsable et le chef de service sont la même personne et la validation de fusion des tâches d’approbation réussit pour ce cycle',
      probation_managerApproved_head:
        'Les conditions de fusion responsable/chef ne sont pas remplies',
      probation_managerApproved_hr:
        'Le responsable et le chef de service sont la même personne et la validation de fusion des tâches d’approbation réussit pour ce cycle',
      departure_managerApproved_head:
        'Les conditions de fusion responsable/chef ne sont pas remplies',
      departure_managerApproved_hr:
        'Le responsable et le chef de service sont la même personne et la validation de fusion des tâches d’approbation réussit pour ce cycle',
      expensePlan_financeApproved_executive:
        'Approbation de la direction requise : montant > seuil de la direction figé à la soumission',
      expensePlan_financeApproved_gm:
        'Aucune approbation de la direction requise ; montant > seuil du directeur général figé à la soumission',
      expensePlan_financeApproved_approved:
        'Aucune condition d’approbation supplémentaire de direction ou de direction générale ne s’applique',
      expensePlan_executiveApproved_gm:
        'Approbation du directeur général requise et validation de fusion des tâches direction/direction générale non réussie',
      expensePlan_executiveApproved_approved:
        'Approbation du directeur général non requise, ou tâches direction/direction générale fusionnées valablement',
      loan_financeApproved_executive:
        'Approbation de la direction requise : montant > seuil de la direction figé à la soumission',
      loan_financeApproved_gm:
        'Aucune approbation de la direction requise ; montant > seuil du directeur général figé à la soumission',
      loan_financeApproved_cashier:
        'Aucune condition d’approbation supplémentaire de direction ou de direction générale ne s’applique',
      loan_executiveApproved_gm:
        'Approbation du directeur général requise et validation de fusion des tâches direction/direction générale non réussie',
      loan_executiveApproved_cashier:
        'Approbation du directeur général non requise, ou tâches direction/direction générale fusionnées valablement',
      purchase_financeApproved_executive:
        'Approbation de la direction requise : montant > seuil de la direction figé à la soumission',
      purchase_financeApproved_gm:
        'Aucune approbation de la direction requise ; montant > seuil du directeur général figé à la soumission',
      purchase_financeApproved_approved:
        'Aucune condition d’approbation supplémentaire de direction ou de direction générale ne s’applique',
      purchase_executiveApproved_gm:
        'Approbation du directeur général requise et validation de fusion des tâches direction/direction générale non réussie',
      purchase_executiveApproved_approved:
        'Approbation du directeur général non requise, ou tâches direction/direction générale fusionnées valablement',
      payment_financeApproved_executive:
        'Approbation de la direction requise : circuit complet et montant > seuil de la direction figé à la soumission',
      payment_financeApproved_gm:
        'Aucune approbation de la direction requise ; montant > seuil du directeur général figé à la soumission et approbation complète requise',
      payment_financeApproved_cashier:
        'Aucune condition d’approbation supplémentaire de direction ou de direction générale ne s’applique',
      payment_executiveApproved_gm:
        'Approbation du directeur général requise et validation de fusion des tâches direction/direction générale non réussie',
      payment_executiveApproved_cashier:
        'Approbation du directeur général non requise, ou tâches direction/direction générale fusionnées valablement',
      travel_financeApproved_executive:
        'Approbation de la direction requise : déplacement international ou montant > seuil de la direction figé à la soumission',
      travel_financeApproved_gm:
        'Aucune approbation de la direction requise ; montant > seuil du directeur général figé à la soumission',
      travel_financeApproved_booking:
        'Aucune autre approbation de direction/direction générale requise et réservation demandée',
      travel_financeApproved_completed:
        'Aucune autre approbation de direction/direction générale requise et réservation non demandée',
      travel_executiveApproved_gm:
        'Approbation du directeur général requise et validation de fusion des tâches direction/direction générale non réussie',
      travel_executiveApproved_booking:
        'Approbation du directeur général non requise ou fusionnée valablement ; réservation demandée',
      travel_executiveApproved_completed:
        'Approbation du directeur général non requise ou fusionnée valablement ; réservation non demandée',
      travel_gmApproved_booking: 'Réservation demandée',
      travel_gmApproved_completed: 'Réservation non demandée',
      payment_submit_head:
        'La vérification de la source de financement exige le circuit complet d’approbation, y compris pour les dépassements nécessitant une approbation supplémentaire',
      payment_submit_finance:
        'La vérification de la source de financement n’exige pas le circuit complet d’approbation',
      budgetAdjustment_cfoApproved_gm:
        'L’augmentation budgétaire dépasse le seuil du directeur général figé à la soumission',
      budgetAdjustment_cfoApproved_approved:
        'Il ne s’agit pas d’une augmentation budgétaire, ou celle-ci ne dépasse pas le seuil figé du directeur général',
      leave_managerApproved_head:
        'Jours ≥ seuil figé du chef de service et chef absent ou distinct du responsable',
      leave_managerApproved_hr:
        'Aucun examen du chef requis ; type de congé exigeant les RH ou jours ≥ seuil RH figé',
      leave_managerApproved_approved:
        'Aucun examen du chef, type de congé sans obligation RH et jours sous le seuil RH figé',
      leave_headApproved_hr:
        'Type de congé exigeant les RH ou jours ≥ seuil RH figé',
      leave_headApproved_approved:
        'Type de congé sans obligation RH et jours sous le seuil RH figé',
      overtime_managerApproved_head:
        'Heures supplémentaires mensuelles au-delà du seuil figé d’examen du chef et chef absent ou distinct du responsable',
      overtime_managerApproved_hr:
        'Aucun examen du chef requis ; soumission plus de 3 jours ouvrés après les heures supplémentaires',
      overtime_managerApproved_approved:
        'Aucun examen du chef requis ; soumission dans le délai de 3 jours ouvrés',
      overtime_headApproved_hr:
        'Soumis plus de 3 jours ouvrés après les heures supplémentaires',
      overtime_headApproved_approved:
        'Soumis dans les 3 jours ouvrés suivant les heures supplémentaires',
      supplies_submit_issuing:
        'Soumis à nouveau depuis une exception d’exécution avec contenu approuvé inchangé',
      supplies_submit_manager:
        'Nouvelle demande, contenu couvert par l’approbation modifié ou conditions de reprise non remplies',
      vehicleRequest_submit_dispatch:
        'Soumis à nouveau depuis une exception d’exécution avec contenu approuvé inchangé',
      vehicleRequest_submit_head:
        'Nouvelle demande, contenu couvert par l’approbation modifié ou conditions de reprise non remplies',
      purchase_submit_purchasing:
        'Soumis à nouveau depuis une exception d’exécution avec contenu approuvé inchangé',
      purchase_submit_head:
        'Nouvelle demande, contenu couvert par l’approbation modifié ou conditions de reprise non remplies',
      assetRequest_submit_issuing:
        'Soumis à nouveau depuis une exception d’exécution avec contenu approuvé inchangé ; reprise admissible ; hors demande de mise au rebut',
      assetRequest_submit_head:
        'Nouvelle demande, contenu couvert par l’approbation modifié ou conditions de reprise non remplies',
      sealRequest_submit_stamping:
        'Soumis à nouveau depuis une exception d’exécution avec contenu approuvé inchangé ; reprise admissible',
      sealRequest_submit_head:
        'Nouvelle demande, contenu couvert par l’approbation modifié ou conditions de reprise non remplies',
      purchase_priced_revision:
        'Prix réel > 120 % de l’estimation d’origine ; confirmation du demandeur et nouvelle soumission requises',
      purchase_priced_finance: 'Prix réel ≤ 120 % de l’estimation d’origine',
      purchase_forcedPriced_revision:
        'Prix réel > 120 % de l’estimation d’origine ; confirmation du demandeur et nouvelle soumission requises',
      purchase_forcedPriced_finance:
        'Prix réel ≤ 120 % de l’estimation d’origine',
      probation_hrApproved_gm:
        'Confirmation après période d’essai refusée ou grade confirmé par les RH atteignant le seuil figé du rang responsable',
      probation_hrApproved_approved:
        'Confirmation après période d’essai non refusée et grade confirmé par les RH sous le seuil responsable',
      departure_hrApproved_gm:
        'Grade de l’employé ≥ seuil du rang responsable figé à la soumission',
      departure_hrApproved_handover:
        'Grade de l’employé sous le seuil figé du rang responsable',
      departure_cancellationRejected_gm:
        'Annulation rejetée ; reprise de l’état de direction générale enregistré avant annulation',
      departure_cancellationRejected_handover:
        'Annulation rejetée ; reprise de l’état de passation enregistré avant annulation',
      departure_cancellationRejected_completed:
        'Annulation rejetée ; reprise de l’état terminé enregistré avant annulation',
      recruitment_submit_head:
        'Le demandeur n’est pas le chef de service ou le chef est absent',
      recruitment_submit_hrbp:
        'Le demandeur est le chef de service ; ignorer l’autoapprobation',
      recruitment_reviewEdit_head:
        'Le demandeur n’est pas le chef de service ou le chef est absent',
      recruitment_reviewEdit_hrbp:
        'Le demandeur est le chef de service ; ignorer l’autoapprobation',
      recruitment_hrDirectorApproved_executive:
        'La demande utilise un effectif supplémentaire',
      recruitment_hrDirectorApproved_gm:
        'Hors effectif supplémentaire ; grade cible atteignant le seuil figé du rang directeur',
      recruitment_hrDirectorApproved_approved:
        'Hors effectif supplémentaire ; grade cible sous le seuil figé du rang directeur',
      recruitment_executiveApproved_gm:
        'Effectif supplémentaire ou grade cible atteignant le seuil directeur',
      recruitment_executiveApproved_approved:
        'Hors effectif supplémentaire et grade cible sous le seuil directeur',
      transfer_submit_manager:
        'L’auteur de la soumission n’est pas le responsable de l’employé ; un responsable absent conduit tout de même à l’examen du responsable',
      transfer_submit_sourceHead:
        'L’auteur de la soumission est le responsable de l’employé',
      transfer_reviewEdit_manager:
        'L’auteur de la soumission n’est pas le responsable de l’employé ; un responsable absent conduit tout de même à l’examen du responsable',
      transfer_reviewEdit_sourceHead:
        'L’auteur de la soumission est le responsable de l’employé',
      transfer_sourceHeadApproved_targetHead:
        'La modification inclut une mutation de service',
      transfer_sourceHeadApproved_hr:
        'La modification n’inclut pas de mutation de service',
      transfer_hrApproved_executive:
        'Augmentation salariale au-delà du seuil figé de direction ou grade cible atteignant le rang responsable',
      transfer_hrApproved_gm:
        'Aucun examen de direction ; augmentation au-delà du seuil figé du directeur général ou grade cible atteignant le rang directeur',
      transfer_hrApproved_pendingEffective:
        'Aucune condition d’examen supplémentaire de direction/direction générale liée au salaire ou au grade ne s’applique',
      transfer_executiveApproved_gm:
        'Augmentation au-delà du seuil figé du directeur général ou grade cible atteignant le rang directeur',
      transfer_executiveApproved_pendingEffective:
        'Aucune condition d’examen supplémentaire du directeur général liée au salaire ou au grade ne s’applique',
      assetRequest_headApproved_appraisal:
        'La demande concerne la mise au rebut d’un bien',
      assetRequest_headApproved_issuing:
        'La demande ne concerne pas la mise au rebut d’un bien',
      assetRequest_financeApproved_gm:
        'Demande de mise au rebut ; valeur d’origine totale des biens au-delà du seuil figé de direction générale pour la mise au rebut',
      assetRequest_financeApproved_scrapped:
        'Le seuil de valeur d’origine de mise au rebut pour la direction générale n’est pas dépassé',
      assetRequest_issueCompleted_returning:
        'Demande d’emprunt : remise puis traitement du retour',
      assetRequest_issueCompleted_issued:
        'La demande ne concerne pas un emprunt',
      sealRequest_stamped_returning:
        'L’emprunt externe d’un sceau exige le traitement du retour',
      sealRequest_stamped_completed: 'Le sceau n’est pas utilisé à l’extérieur',
      vendorQualification_submit_removalReview:
        'L’opération retire un fournisseur de l’annuaire',
      vendorQualification_submit_purchasing:
        'L’opération ne retire pas un fournisseur',
      contract_headApproved_legalFinance:
        'Résiliation de contrat ou modèle non standard',
      contract_headApproved_standardFinance:
        'Hors résiliation et modèle standard utilisé',
      contract_legalFinanceApproved_executive:
        'Montant du contrat au-delà du seuil figé de direction ; hors résiliation',
      contract_legalFinanceApproved_gm:
        'Aucun examen de direction ; montant au-delà du seuil figé du directeur général pour les contrats ou qualification non standard par juridique/finances ; hors résiliation',
      contract_legalFinanceApproved_approved:
        'Résiliation ou aucune autre condition d’approbation',
      contract_standardFinanceApproved_executive:
        'Montant du contrat au-delà du seuil figé de direction',
      contract_standardFinanceApproved_gm:
        'Aucun examen de direction ; montant au-delà du seuil figé du directeur général pour les contrats',
      contract_standardFinanceApproved_approved:
        'Ni le seuil de direction ni celui du directeur général pour les contrats ne sont dépassés',
      contract_executiveApproved_gm:
        'Montant au-delà du seuil figé du directeur général pour les contrats ou contrat non standard',
      contract_executiveApproved_approved:
        'Montant ne dépassant pas le seuil du directeur général pour les contrats et contrat standard',
      committeeVersion:
        'Utiliser le groupe de comité correspondant à la version figée à la soumission',
      returnApplicant:
        'La décision de retour sélectionne la correction par le demandeur et une nouvelle soumission',
      returnEarlier:
        'La décision de retour sélectionne cette étape d’approbation antérieure déjà parcourue',
      seal_legal: 'Après examen du chef : sceau de contrat ou contrat lié',
      seal_financeManager:
        'Depuis l’examen chef/juridique : sceau financier, après la priorité du parcours contrat',
      seal_gm:
        'Aucune branche juridique/financière applicable ; sceau du représentant ou usage externe et examinateur actuel distinct du directeur général',
      seal_stamping:
        'Aucune branche juridique/financière applicable et aucun examen supplémentaire du directeur général, ou examinateur actuel égal au directeur général',
    },

    conditional: 'Conditions métier applicables',
    transitionUnknown: 'Action : {{name}}',
    transitionNames: {
      edit: 'Modifier le contenu',
      submit: 'Soumettre',
      approved: 'Approbation obtenue',
      rejected: 'Rejeter',
      returned: 'Renvoyer pour correction',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      booked: 'Réservation terminée',
      bookingFailed: 'Échec de la réservation',
      bookingForced: 'Confirmer la fin',
      retryBooking: 'Réessayer la réservation',
      reviseTrip: 'Réviser le déplacement',
      cancelApproved: 'Annulation approuvée',
      issued: 'Remise terminée',
      unavailable: 'Indisponible / échec d’exécution',
      forceClosed: 'Forcer la clôture',
    },

    place: 'Emplacement vacant',
    placeNumber: 'Emplacement vacant {{number}}',
    placeRequired: 'Choisissez un emplacement vacant.',
    title: 'Gestion des processus',
    description:
      'Consulter les définitions, exécutions et historiques d’approbation autorisés',
    definitions: 'Définitions',
    executions: 'Exécutions',
    refresh: 'Actualiser',
    search: 'Rechercher par numéro, processus ou demandeur',
    definitionSearch: 'Rechercher par nom de processus',
    clear: 'Effacer les filtres',
    all: 'Tout',
    name: 'Nom',
    domain: 'Domaine métier',
    category: 'Catégorie',
    capabilities: 'Fonctions de gestion',
    approval: 'Processus d’approbation',
    connected: 'Connecté',
    readOnly: 'Lecture seule',
    notConnected: 'Actions de gestion pas encore connectées',
    reference: 'Numéro / titre',
    applicant: 'Demandeur',
    status: 'Statut',
    stage: 'Étape actuelle',
    createdAt: 'Début',
    endedAt: 'Terminé',
    empty: 'Aucune exécution',
    emptyDescription:
      'Les exécutions des processus connectés apparaissent ici à leur démarrage',
    noDefinitions: 'Aucune définition lisible',
    noDefinitionsDescription:
      'Demandez à un administrateur de configurer l’accès aux définitions',
    noResults: 'Aucun enregistrement correspondant',
    noResultsDescription:
      'Ajustez ou effacez les filtres pour trouver des enregistrements',
    definitionGraph: 'Définition actuelle',
    graphDescription:
      'États et transitions actuellement enregistrés ; les règles métier déterminent les branches dynamiques',
    currentNode: 'État actuel',
    visitedNode: 'Parcouru',
    unvisitedNode: 'Non parcouru',
    executionHistory: 'Historique d’exécution',
    terminationOutcome: 'Résultat de clôture',
    actualPath: 'Parcours d’exécution réel',
    actualDescription:
      'Circuit complet d’approbation et d’exécution avec les étapes parcourues, transitions et état actuel mis en évidence. Les retours réels et parcours historiques restent visibles.',
    tasks: 'Tâches et historique d’approbation',
    timeline: 'Historique d’approbation et de gestion',
    run: 'Exécution d’approbation',
    historical: 'Historique d’exécution',
    definitionMissing: 'Définition historique indisponible',
    commentsRestricted:
      'Les commentaires peuvent contenir des informations privées et nécessitent un accès métier distinct',
    comment: 'Commentaire / motif',
    actor: 'Acteur',
    assignee: 'Attributaire',
    answer: 'Décision',
    previousTask: 'Tâche précédente',
    from: 'De',
    to: 'À',
    initial: 'Initial',
    final: 'Final',
    transitions: 'Transitions d’état',
    definitionDetails: 'Étapes et transitions',
    viewExecutions: 'Consulter tous les enregistrements',
    back: 'Retour',
    manage: 'Actions de gestion',
    appoint: 'Attribuer',
    reassign: 'Réattribuer',
    terminate: 'Clôturer',
    unavailable:
      'La tâche actuelle ou l’état métier ne permet pas cette action',
    person: 'Destinataire',
    reason: 'Motif',
    personRequired: 'Choisissez un destinataire',
    reasonRequired: 'Saisissez un motif',
    cancel: 'Annuler',
    retry: 'Réessayer',
    loadFailed: 'Échec du chargement. Réessayez',
    submitFailed: 'Échec de l’action. Vérifiez et réessayez',
    unknown: 'Résultat inconnu. Actualisez pour vérifier',
    stale: 'La tâche a changé. Actualisez et vérifiez',
    gone: 'Enregistrement absent ou hors de votre périmètre actuel',
    forbidden:
      'Vous ne pouvez pas lire cette section. Contactez un administrateur',
    loading: 'Chargement',
    noPeople: 'Aucun destinataire admissible pour la tâche actuelle',
    peopleSearch: 'Rechercher des destinataires autorisés',
    loadMore: 'Charger plus',
    reassignTitle: 'Réattribuer une tâche de « {{recordLabel}} »',
    appointTitle: 'Attribuer une tâche de « {{recordLabel}} »',
    terminateTitle: 'Clôturer la demande « {{recordLabel}} »',
    reassigned: 'Tâche de « {{recordLabel}} » réattribuée',
    appointed: 'Tâche de « {{recordLabel}} » attribuée',
    terminated: 'Demande « {{recordLabel}} » clôturée',
    recentDescription:
      'Les cinq exécutions autorisées les plus récentes. Ouvrez la liste des exécutions pour l’historique complet.',
    vehicleTerminationGuard:
      'Les demandes déjà affectées ne peuvent pas être clôturées directement. Le demandeur effectif doit enregistrer l’utilisation et suivre le processus métier des véhicules.',
    terminationConsequences: {
      vehicle:
        'Termine une demande non affectée. Cette opération ne peut pas clôturer une demande déjà affectée.',
      leave:
        'Clôture l’approbation actuelle ; le service des congés traite les réservations d’enveloppe en attente.',
      funding:
        'Clôture l’approbation actuelle ; le service métier traite les réservations de budget, de financement ou de demande en attente. Les paiements réglés restent enregistrés.',
      stock:
        'Clôture l’approbation actuelle ; le service des fournitures traite les réservations de stock en attente. Les retours physiques nécessitent leur processus métier.',
      ordinary:
        'Clôture l’approbation actuelle et exécute les contrôles métier de clôture ainsi que le traitement de sortie.',
    },
    terminationDescription:
      'La clôture ferme les tâches actuelles et libère les réservations selon les règles métier, tout en conservant l’historique. Les faits métier exécutés nécessitent leur propre annulation ou apurement de garde.',
    graphView: 'Diagramme',
    dateRange: 'Date de début',
    last7: '7 derniers jours',
    last30: '30 derniers jours',
    last90: '90 derniers jours',
    thisMonth: 'Ce mois-ci',
    lastMonth: 'Mois dernier',
    safeHistory:
      'Cette vue contient uniquement les informations de processus sûres autorisées',
    business: 'Contenu métier',
    businessRestricted:
      'Le contenu métier, les pièces jointes et les champs privés nécessitent un accès distinct',
    guardedBranch: 'Branche sélectionnée selon les conditions métier source',
    frozen: 'Champs figés',
    covered: 'Champs couverts',
    management: 'Intervention administrative',
    kinds: {
      itRepair: 'IT repair',
      leave: 'Congé',
      overtime: 'Heures supplémentaires',
      leaveCancellation: 'Annulation de congé',
      general: 'Demande générale',
      attendanceChange: 'Correction de présence',
      outing: 'Sortie professionnelle',
      supplies: 'Demande de fournitures',
      budgetAdjustment: 'Ajustement budgétaire',
      expensePlan: 'Autorisation de dépenses',
      training: 'Formation',
      travel: 'Déplacement',
      travelCancellation: 'Annulation de déplacement',
      reimbursement: 'Remboursement',
      purchase: 'Achat',
      loan: 'Demande d’avance',
      payment: 'Demande de paiement',
      probation: 'Examen de période d’essai',
      vehicleRequest: 'Demande de véhicule',
      contract: 'Contrat',
      assetRequest: 'Demande de bien',
      vendorQualification: 'Qualification fournisseur',
      recruitment: 'Recrutement',
      sealRequest: 'Demande de sceau',
      transfer: 'Changement de personnel',
      departure: 'Départ',
      certificateRequest: 'Demande de certificat',
    },
    domains: {
      office: 'Vie de bureau',
      organization: 'Organisation et RH',
      finance: 'Finances et frais',
      procurement: 'Achats et contrats',
      administration: 'Administration et biens',
    },
    states: {
      issued: 'Remis',
      forcedClosed: 'Clôturé de force',
      draft: 'Brouillon',
      revision: 'Révision',
      manager: 'Responsable',
      head: 'Chef de service',
      hr: 'RH',
      extra: 'Examen supplémentaire',
      finance: 'Finances',
      cashier: 'Caissier',
      executive: 'Direction',
      gm: 'Directeur général',
      cfo: 'Directeur financier',
      legal: 'Juridique',
      financeManager: 'Responsable financier',
      hrbp: 'Partenaire RH',
      hrDirector: 'Directeur des ressources humaines',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
      completed: 'Terminé',
      exception: 'Exception de traitement',
      dispatch: 'Affectation',
      usage: 'Utilisation de véhicule',
      issuing: 'Remise en cours',
      returning: 'Retour en cours',
      returnException: 'Exception de retour',
      stamping: 'Apposition du sceau',
      booking: 'Réservation',
      unbooking: 'Annuler la réservation',
      paid: 'Payé',
      paymentException: 'Exception de paiement',
      pendingEffective: 'En attente de la date d’effet',
      cancellationReview: 'Examen de l’annulation',
      sourceHead: 'Chef du service source',
      targetHead: 'Chef du service cible',
      committee: 'Comité',
      purchasing: 'Achats',
      inquiry: 'Consultation',
      quoting: 'Devis',
      pending: 'En attente',
      claimed: 'Pris en charge',
      waiting: 'En attente',
      blocked: 'Bloqué',
      candidate: 'Candidat',
      suspended: 'Suspendu',
      transferred: 'Transféré',
      voided: 'Clos',
      open: 'Ouvrir',
      cancelled: 'Annulé',
      returned: 'Retourné',
      concluded: 'Conclu',
      decide: 'Décision',
      copy: 'Mettre en copie',
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer',
      unknown: 'Autre état',
    },
    authz: {
      definitionRead: 'Définitions',
      historyRead: 'Historique d’exécution',
      appoint: 'Attribuer',
      reassign: 'Réattribuer',
      terminate: 'Clôturer',
    },
    otherStage: 'Autre étape ({{name}})',
    otherEvent: 'Événement du processus ({{name}})',
    events: {
      approve: 'Approuvé',
      reject: 'Rejeté',
      return: 'Retourné',
      reassign: 'Réattribution administrative',
      appoint: 'Attribution administrative',
      comment: 'Commenter',
      transfer: 'Transféré',
      addSign: 'Approbateur ajouté',
      claim: 'Pris en charge',
      release: 'Tâche libérée',
      'stage.unassigned': 'Étape non attribuée',
      'run.started': 'Approbation commencée',
      'run.ended': 'Approbation terminée',
      'stage.entered': 'Entrée dans l’étape',
      remind: 'Rappel',
      escalate: 'Escaladé',
      read: 'Lire',
    },
  },
};
