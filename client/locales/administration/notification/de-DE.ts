import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Benachrichtigungen',
    logs: 'Benachrichtigungsprotokolle',
  },
  logs: {
    retry: 'Erneut versuchen',
    limitNotice:
      'Es werden nur die neuesten {{count}} Benachrichtigungen angezeigt; die Summen beziehen sich auf diese Datensätze.',
    deliveryOperations: 'Zustellungsvorgänge',
    recipeDescription:
      'Verfolgen Sie jede Kanalübergabe und jeden Zustellversuch des Anbieters.',
    redacted:
      'Nachrichteninhalte, Empfänger und Reservierungstoken sind ausgeblendet.',
    providerAttempts: 'Anbieterversuche',

    eyebrow: 'Benachrichtigungen',
    title: 'Benachrichtigungsprotokolle',
    description:
      'Verfolgen Sie die Benachrichtigungszustellung und jeden Anbieterversuch. Nachrichteninhalte, Empfänger und Reservierungstoken sind ausgeblendet.',
    refreshing: 'Wird aktualisiert…',
    refresh: 'Aktualisieren',
    deliveriesShown: 'Angezeigte Zustellungen',
    needAttention: 'Handlungsbedarf',
    unavailable: 'Protokolle nicht verfügbar',
    recent: 'Letzte Benachrichtigungen',
    loading: 'Zustellverlauf wird geladen…',
    emptyTitle: 'Noch keine Zustellungen',
    emptyDescription:
      'Zustellnachweise erscheinen hier, nachdem Benachrichtigungen gesendet wurden.',
    expand: 'Benachrichtigung aufklappen',
    collapse: 'Benachrichtigung zuklappen',
    noDeliveries: 'Keine Zustellungen erfasst.',
    noAttempts: 'Keine Versuche erfasst.',
    columns: {
      source: 'Quelle',
      notificationId: 'Benachrichtigungs-ID',
      status: 'Status',
      deliveries: 'Zustellungen',
      created: 'Erstellt',
      channel: 'Kanal',
      provider: 'Anbieter',
      attempts: 'Versuche',
      updated: 'Aktualisiert',
    },
  },
  status: {
    pending: 'Ausstehend',
    processing: 'In Verarbeitung',
    completed: 'Abgeschlossen',
    partial: 'Teilweise',
    failed: 'Fehlgeschlagen',
    unknown: 'Unbekannt',
    preparing: 'Wird vorbereitet',
    submitting: 'Wird eingereicht',
    retrying: 'Erneuter Versuch läuft',
    accepted: 'Angenommen',
  },
  errors: {
    forbidden:
      'Der Zugriff wurde entzogen. Wenden Sie sich an einen Administrator.',
    notFound:
      'Diese Datensätze sind nicht verfügbar. Kehren Sie zum Arbeitsplatz zurück.',
    providerFailed:
      'Zustellung fehlgeschlagen. Prüfen Sie die Kanaleinstellungen oder wenden Sie sich an einen Administrator.',
    requestFailed: 'Benachrichtigungsanfrage fehlgeschlagen.',
    inAppRecipientNotFound:
      'Der Empfänger der In-App-Benachrichtigung ist nicht vorhanden.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
