/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: 'Calendrier de travail',
      dictionaries: 'Dictionnaires',
      rules: 'Vue d’ensemble et historique des règles',
      sequences: 'Numéros de documents',
      auditLogs: 'Journal d’audit',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'Plateforme bureautique',
      calendar: 'Calendrier de travail',
      dictionaries: 'Dictionnaires',
      rules: 'Vue d’ensemble et historique des règles',
      sequences: 'Numéros de documents',
      auditLogs: 'Journal d’audit',
      actions: { read: 'Consulter', update: 'Modifier' },
    },
    common: {
      actions: 'Actions',
      actionsFor: 'Actions pour {{name}}',
      edit: 'Modifier',
      delete: 'Supprimer',
      refresh: 'Actualiser',
      clearFilters: 'Effacer les filtres',
      noResults: 'Aucun élément ne correspond aux filtres.',
      forbidden: 'Vous n’avez pas l’autorisation de consulter cet élément.',
      notFound: 'Cet enregistrement n’existe pas ou a été supprimé.',
      loadFailed:
        'Impossible de charger les données. Vérifiez votre connexion et réessayez.',
      writeForbidden:
        'Vous n’avez pas l’autorisation d’effectuer cette modification.',
      saveFailed: 'Impossible d’enregistrer la modification. Réessayez.',
    },
    calendar: {
      title: 'Calendrier de travail',
      description:
        'Définissez les heures de travail et gérez les jours fériés et jours travaillés de compensation de chaque année.',
      loadFailedTitle: 'Impossible de charger les paramètres du calendrier',
      kinds: {
        holiday: 'Jour férié',
        adjustedWorkday: 'Jour travaillé de compensation',
        workday: 'Jour ouvré',
        weekend: 'Jour non travaillé',
      },
      workHours: {
        title: 'Heures de travail',
        description:
          'Les rappels et escalades d’approbation ne comptent que ces heures pendant les jours ouvrés.',
        start: 'Début',
        end: 'Fin',
        range: '{{start}}–{{end}}',
        invalidTime: 'Saisissez une heure telle que 09:00.',
        endBeforeStart: 'La fin doit être postérieure au début.',
        scheduled: 'À partir du {{date}} : {{start}}–{{end}}',
        saved: 'Heures de travail enregistrées',
      },
      timeZone: {
        title: 'Fuseau horaire',
        description:
          'Fuseau horaire utilisé par le calendrier et les numéros de documents. Une modification s’applique immédiatement.',
        label: 'Fuseau horaire',
        hint: 'Nom de fuseau horaire IANA, tel que Asia/Shanghai.',
        required: 'Saisissez un fuseau horaire.',
        invalid:
          'Le serveur ne connaît pas ce fuseau horaire. Utilisez un nom tel que Asia/Shanghai.',
        saved: 'Fuseau horaire enregistré',
      },
      days: {
        remove: 'Retirer',
        title: 'Jours spéciaux',
        description:
          'Les jours non répertoriés suivent la semaine : du lundi au vendredi sont des jours ouvrés.',
        previousYear: 'Année précédente',
        nextYear: 'Année suivante',
        add: 'Ajouter un jour',
        addTitle: 'Ajouter un jour',
        addDescription: 'Une date déjà répertoriée est remplacée.',
        addSubmit: 'Ajouter',
        editTitle: 'Modifier le {{date}}',
        import: 'Importer',
        date: 'Date',
        weekday: 'Jour de semaine',
        kind: 'Type',
        note: 'Note',
        dateRequired: 'Choisissez une date.',
        noteTooLong: 'Utilisez au maximum {{max}} caractères.',
        emptyTitle: 'Aucun jour spécial en {{year}}',
        emptyDescription:
          'Importez les jours fériés et jours travaillés de compensation de l’année, ou ajoutez-les un à un.',
        emptyReadOnly:
          'Tous les jours suivent la semaine. Demandez à un administrateur d’importer les jours fériés.',
        saved: '« {{date}} » enregistré',
        removed: '« {{date}} » retiré',
        removeTitle: 'Retirer « {{date}} » ?',
        removeDescription: 'La date suit à nouveau la semaine.',
        notFound: 'Ce jour n’est plus répertorié. Il a peut-être été retiré.',
      },
      import: {
        title: 'Importer les jours spéciaux de {{year}}',
        description:
          'Collez un jour par ligne : date, type et note facultative.',
        lines: 'Jours',
        placeholder:
          '{{year}}-10-01,holiday,Fête nationale\n{{year}}-10-10,adjustedWorkday',
        hint: 'Séparez par des virgules ou tabulations. Types : holiday, adjustedWorkday, workday, weekend (ou 休 / 班).',
        replace: 'Remplacer l’année',
        replacePreview:
          'Selon le calendrier actuel, {{count}} jours spéciaux existants en {{year}} sont absents de cette importation et seront supprimés. D’autres utilisateurs peuvent modifier le calendrier avant votre enregistrement.',
        previewFailed:
          'Impossible de charger l’année complète du calendrier. Réessayez avant de la remplacer.',
        confirmReplaceTitle: 'Remplacer les jours spéciaux de {{year}} ?',
        replaceHint:
          'Retirer les jours spéciaux de {{year}} absents de la liste.',
        submit: 'Importer',
        emptyText: 'Collez au moins un jour.',
        success:
          'Importés : {{created}} ajoutés, {{updated}} modifiés, {{removed}} retirés',
        problems: {
          format: 'La ligne {{line}} nécessite une date et un type.',
          date: 'La ligne {{line}} contient une date invalide.',
          kind: 'La ligne {{line}} contient un type inconnu.',
          year: 'La ligne {{line}} n’appartient pas à {{year}}.',
          duplicate: 'La ligne {{line}} répète une date.',
        },
      },
    },
    dictionaries: {
      title: 'Dictionnaires',
      description:
        'Gérez les options proposées par les formulaires de demande. Les entrées sont désactivées, jamais supprimées.',
      loadFailedTitle: 'Impossible de charger le dictionnaire',
      searchPlaceholder: 'Rechercher par nom ou code',
      searchLabel: 'Rechercher des entrées',
      notFound: 'Cette entrée n’existe pas ou a été retirée.',
      enable: 'Activer',
      enabled: '« {{name}} » activé',
      disable: 'Désactiver',
      disabled: '« {{name}} » désactivé',
      disableTitle: 'Désactiver « {{name}} » ?',
      disableDescription:
        'Les demandes existantes continuent de l’afficher, mais les nouvelles demandes ne peuvent plus la choisir. Vous pouvez la réactiver.',
      extraValue: '{{name}} : {{value}}',
      extraUnlimited: '{{name}} : aucune limite',
      fields: {
        type: 'Type de dictionnaire',
        label: 'Nom',
        labelZh: 'Nom (chinois)',
        labelEn: 'Nom (anglais)',
        code: 'Code',
        extra: 'Attributs',
        sortOrder: 'Ordre',
        status: 'Statut',
      },
      status: {
        all: 'Tous les statuts',
        active: 'Activé',
        inactive: 'Désactivée',
      },
      empty: {
        title: 'Aucune entrée de ce type',
        description:
          'Ajoutez la première entrée pour la proposer dans les formulaires.',
        readOnly: 'Demandez à un administrateur d’ajouter des entrées.',
      },
      create: {
        action: 'Nouvelle entrée',
        title: 'Nouvelle entrée : {{type}}',
        success: 'Entrée « {{name}} » créée',
      },
      edit: {
        title: 'Modifier l’entrée',
        success: 'Entrée « {{name}} » enregistrée',
      },
      form: {
        description:
          'Une entrée de {{type}}. Nommez-la dans au moins une langue.',
        codeHint:
          'Lettres, chiffres, _ et -, en commençant par une lettre. Ce code ne pourra plus changer.',
        codeFixed:
          'Les enregistrements stockent le code, qui ne peut donc plus changer.',
        codeInvalid:
          'Utilisez lettres, chiffres, _ et -, en commençant par une lettre (64 maximum).',
        codeTaken: 'Ce type possède déjà une entrée portant ce code.',
        labelRequired: 'Saisissez un nom dans au moins une langue.',
        labelTooLong: 'Utilisez au maximum {{max}} caractères.',
        sortOrderHint:
          'Les nombres inférieurs passent en premier dans les formulaires.',
        sortOrderInvalid: 'Saisissez un entier compris entre 0 et 1 000 000.',
        numberRequired: 'Saisissez un nombre.',
        numberMin: 'Saisissez un nombre supérieur ou égal à {{min}}.',
        integerMin: 'Saisissez un entier supérieur ou égal à {{min}}.',
        blankUnlimited: 'Laissez vide pour ne pas limiter.',
        extraInvalid: 'Cette valeur n’est pas acceptée.',
      },
      types: {
        expensePlanType: 'Activités des demandes de dépenses',
        officeItem: 'Fournitures de bureau',
        leaveType: 'Types de congé',
        annualLeaveTier: 'Congés annuels selon l’ancienneté',
        paymentMethod: 'Mode de paiement',
        expenseCategory: 'Catégories de dépenses',
        budgetSubject: 'Postes budgétaires',
        sealType: 'Types de sceaux',
        contractType: 'Types de contrats',
        assetCategory: 'Catégories de biens',
        supplierCategory: 'Catégories de fournisseurs',
        vehicleType: 'Types de véhicules',
        departureType: 'Type de départ',
        resignationReason: 'Motifs de démission',
        recruitmentReason: 'Motifs d’embauche',
        certificateType: 'Types de certificats',
        travelStandard: 'Barèmes de déplacement',
      },
      travelStandardKindHelp:
        'Utilisez la catégorie correspondante pour l’hébergement et l’indemnité. Une catégorie globale de déplacement ne représente aucun des deux et n’a pas de barème quotidien.',
      invalidStandardKind:
        'Choisissez une classification valide de barème de déplacement.',
      extraOptions: {
        travelStandardKind: {
          none: 'Sans objet',
          lodging: 'Hébergement par nuit',
          allowance: 'Indemnité par jour',
        },
      },
      extra: {
        travelStandardKind: 'Classification du barème de déplacement',
        requiresPrintInfo: 'Détails d’impression requis',
        deductsBalance: 'Déduit du solde',
        requiresAttachment: 'Pièce jointe requise',
        attachmentAboveDays: 'Pièce jointe au-delà de (jours)',
        maxDays: 'Nombre maximal de jours',
        requiresHr: 'Approbation RH',
        minYears: 'À partir de l’ancienneté (années)',
        days: 'Jours',
        voluntary: 'Volontaire',
        replacement: 'Remplace un départ',
        involvesSalary: 'Affiche le salaire',
        minRank: 'À partir du rang de grade',
        lodgingPerNight: 'Hébergement par nuit (yuans)',
        allowancePerDay: 'Indemnité par jour (yuans)',
      },
    },
    rules: {
      relatedFlows: 'Processus liés (modifier au niveau de l’étape)',
      editAtNode: 'Modifier à l’étape du processus',
      title: 'Vue d’ensemble et historique des règles',
      description:
        'Consultez les règles actuelles, les changements planifiés et l’historique. Ouvrez une étape liée pour modifier ; les règles partagées affectent plusieurs processus.',
      loadFailedTitle: 'Impossible de charger les règles d’approbation',
      notFound: 'Cette règle n’existe pas.',
      change: 'Modification',
      history: 'Historique',
      changeTitle: 'Modifier « {{name}} »',
      changeDescription:
        'La nouvelle valeur s’applique aux demandes soumises à partir de sa prise d’effet.',
      changed: '« {{name}} » modifié',
      historyTitle: 'Historique de « {{name}} »',
      currentValue: 'Actuellement : {{value}}',
      scheduledValue: 'À partir du {{date}} : {{value}}',
      defaultVersion: 'Par défaut',
      withdraw: 'Retirer',
      withdrawn: 'Modification planifiée de « {{name}} » retirée',
      withdrawTitle: 'Retirer la modification de « {{name}} » du {{date}} ?',
      withdrawDescription:
        'La valeur planifiée {{value}} ne prendra pas effet.',
      versionStatus: { current: 'En vigueur', scheduled: 'Planifié' },
      fields: {
        rule: 'Règle',
        current: 'Valeur actuelle',
        scheduled: 'Planifié',
        newValue: 'Nouvelle valeur',
        value: 'Valeur',
        note: 'Note',
        effectiveFrom: 'Prise d’effet',
        changedBy: 'Modifié par',
      },
      effective: {
        label: 'Prise d’effet',
        now: 'Immédiatement',
        fromDate: 'À partir d’une date',
        dateLabel: 'Date d’effet',
        hint: 'À partir de 00:00 ce jour-là.',
        dateRequired: 'Choisissez la date de prise d’effet.',
        pastError: 'Choisissez une date à partir de demain.',
      },
      errors: {
        valueRequired: 'Saisissez une valeur.',
        notANumber: 'Saisissez un nombre.',
        minimum: 'Saisissez au moins {{min}}.',
        percentRange: 'Saisissez un pourcentage de {{min}} à {{max}}.',
        integer: 'Saisissez un entier.',
        halfDays: 'Saisissez les jours par incréments de 0,5.',
        noteTooLong: 'Utilisez au maximum {{max}} caractères.',
        invalidValue: 'Cette valeur n’est pas acceptée.',
        orderViolated:
          'Cette valeur est incohérente avec une règle liée (par exemple le seuil du vice-président supérieur à celui du directeur général). Modifiez d’abord la règle liée.',
        versionExists:
          'Une modification prend déjà effet à cet instant. Choisissez une autre date.',
        inEffect:
          'Cette modification a déjà pris effet et fait désormais partie de l’historique.',
      },
      domains: {
        spend: {
          title: 'Dépenses',
          description:
            'Seuils de montant de l’échelle de dépenses et autres approbations financières.',
        },
        leave: {
          title: 'Congé',
          description:
            'Durées de congé nécessitant un chef de service ou les RH.',
        },
        attendance: {
          title: 'Présence',
          description:
            'Limites d’heures supplémentaires et de corrections de présence.',
        },
        hr: {
          title: 'RH',
          description: 'Niveaux de grade et seuils d’augmentation salariale.',
        },
        sla: {
          title: 'Délais d’approbation',
          description: 'Rappels et escalades, comptés en heures ouvrées.',
        },
        committee: {
          title: 'Comités d’examen',
          description: 'Valeurs par défaut des votes de comité.',
        },
        calendar: {
          title: 'Calendrier de travail',
          description: 'Heures de travail et fuseau horaire.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}} fois',
        integer: '{{value}}',
        days: '{{value}} jours',
        hours: '{{value}} heures',
        workingHours: '{{value}} heures ouvrées',
        rank: 'Rang {{value}}',
      },
      unitSuffix: {
        money: 'yuans',
        count: 'fois',
        integer: '',
        days: 'jours',
        hours: 'heures',
        workingHours: 'heures ouvrées',
        ratio: '%',
        rank: 'rang',
      },
      keys: {
        leave_annualAccrualEnabled: {
          label: 'Acquisition automatique des congés annuels',
          description:
            '0 désactive les attributions automatiques ; 1 active l’acquisition quotidienne. Renseignez les dates de début de carrière des employés avant l’activation.',
        },
        leave_annualCarryExpiryMonth: {
          label: 'Mois d’expiration du report des congés annuels',
          description:
            'Mois de l’année suivante où les congés annuels inutilisés expirent (1–12).',
        },
        leave_annualCarryExpiryDay: {
          label: 'Jour d’expiration du report des congés annuels',
          description:
            'Dernier jour valide du mois d’expiration (1–31) ; les mois plus courts utilisent leur dernier jour.',
        },
        spend_vp: {
          label: 'Seuil du vice-président',
          description:
            'Les montants supérieurs nécessitent le vice-président responsable.',
        },
        spend_gm: {
          label: 'Seuil du directeur général',
          description:
            'Les montants supérieurs nécessitent le directeur général.',
        },
        expense_head: {
          label: 'Notes de frais sans chef de service',
          description:
            'Une note de frais dont le total ne dépasse pas ce montant est approuvée par le responsable direct à la place.',
        },
        loan_head: {
          label: 'Seuil d’avance pour le chef de service',
          description:
            'Les avances supérieures nécessitent le chef de service.',
        },
        loan_personalMax: {
          label: 'Plafond personnel d’avance',
          description:
            'Dette maximale autorisée pour une personne à un instant donné.',
        },
        purchase_quotes: {
          label: 'Trois devis requis au-delà de',
          description:
            'Les achats supérieurs nécessitent trois devis concurrents.',
        },
        contract_gm: {
          label: 'Seuil des contrats pour le directeur général',
          description:
            'Les contrats supérieurs nécessitent le directeur général.',
        },
        asset_scrapGm: {
          label: 'Seuil de mise au rebut des biens',
          description:
            'La mise au rebut de biens dont la valeur d’origine dépasse ce seuil nécessite le directeur général.',
        },
        budget_increaseGm: {
          label: 'Seuil d’augmentation budgétaire',
          description:
            'Les augmentations budgétaires supérieures nécessitent le directeur général.',
        },
        leave_head: {
          label: 'Congés nécessitant le chef de service',
          description:
            'Les congés d’au moins ce nombre de jours nécessitent le chef de service.',
        },
        leave_hr: {
          label: 'Congés nécessitant les RH',
          description:
            'Les congés d’au moins ce nombre de jours nécessitent les RH.',
        },
        overtime_monthlyHead: {
          label:
            'Heures supplémentaires mensuelles nécessitant le chef de service',
          description:
            'Les heures supplémentaires dépassant ce nombre d’heures par mois nécessitent le chef de service.',
        },
        attendance_fixPerMonth: {
          label: 'Corrections de présence par mois',
          description:
            'Nombre de corrections qu’une personne peut demander par mois.',
        },
        grade_managerRank: {
          label: 'Rang de grade du niveau responsable',
          description:
            'Les grades de rang au moins égal à cette valeur sont considérés de niveau responsable.',
        },
        grade_directorRank: {
          label: 'Rang de grade du niveau directeur',
          description:
            'Les grades de rang au moins égal à cette valeur sont considérés de niveau directeur.',
        },
        raise_vp: {
          label: 'Augmentation salariale nécessitant le vice-président',
          description:
            'Les augmentations dépassant ce taux nécessitent le vice-président.',
        },
        raise_gm: {
          label: 'Augmentation salariale nécessitant le directeur général',
          description:
            'Les augmentations dépassant ce taux nécessitent le directeur général.',
        },
        sla_remindHours: {
          label: 'Rappel après',
          description: 'Relancer l’approbateur après cette durée de travail.',
        },
        sla_escalateHours: {
          label: 'Escalade après',
          description:
            'Transférer au responsable de l’approbateur après cette durée de travail.',
        },
        sla_urgeCooldownHours: {
          label: 'Délai entre relances',
          description: 'Temps d’attente du demandeur entre deux relances.',
        },
        committee_min: {
          label: 'Votes requis du comité',
          description:
            'Nombre de votes favorables nécessaires par défaut au comité.',
        },
        calendar_workHours: {
          label: 'Heures de travail',
          description: 'Plage de travail quotidienne.',
        },
        calendar_timeZone: {
          label: 'Fuseau horaire',
          description: 'Fuseau horaire du calendrier.',
        },
      },
    },
    sequences: {
      title: 'Numéros de documents',
      description:
        'Numéros émis par préfixe de document et par mois. Les numéros sont émis à la soumission.',
      loadFailedTitle: 'Impossible de charger les numéros de documents',
      searchPlaceholder: 'Filtrer par préfixe, par exemple LV',
      searchLabel: 'Filtrer par préfixe',
      fields: {
        prefix: 'Préfixe',
        period: 'Mois',
        issued: 'Remis',
        next: 'Prochain numéro',
      },
      empty: {
        title: 'Aucun numéro émis',
        description:
          'Les numéros apparaîtront ici après la soumission de demandes.',
      },
    },
    auditLogs: {
      title: 'Journal d’audit',
      description:
        'Registre en lecture seule des modifications sensibles concernant l’organisation, les personnes, les règles et la configuration.',
      loadFailedTitle: 'Impossible de charger le journal d’audit',
      system: 'Système',
      notFound: 'Cette entrée n’existe pas.',
      detailTitle: 'Entrée d’audit : {{action}}',
      detailTitleLoading: 'Entrée d’audit',
      changes: 'Modifications effectuées',
      noChanges: 'Aucune valeur enregistrée.',
      changed: 'Modifié',
      wholeValue: 'Valeur',
      fields: {
        at: 'Heure',
        actor: 'Par',
        action: 'Action',
        targetType: 'Type d’objet',
        targetId: 'Objet',
        reason: 'Motif',
        field: 'Champ',
        before: 'Avant',
        after: 'Après',
      },
      filters: {
        allTargetTypes: 'Tous les types d’objets',
        allActions: 'Toutes les actions',
        actor: 'Toute personne',
        dateRange: 'Toute date',
        presets: 'Période rapide',
      },
      presets: {
        last7: '7 derniers jours',
        last30: '30 derniers jours',
        thisMonth: 'Ce mois-ci',
        lastMonth: 'Mois dernier',
        last90: '90 derniers jours',
      },
      empty: {
        title: 'Aucune entrée d’audit',
        description:
          'Les modifications sensibles sont enregistrées ici au fur et à mesure.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;
