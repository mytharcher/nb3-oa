import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Notificaciones',
    logs: 'Registros de notificaciones',
  },
  logs: {
    retry: 'Reintentar',
    limitNotice:
      'Solo se muestran las {{count}} notificaciones más recientes; los totales corresponden a estos registros.',
    deliveryOperations: 'Operaciones de entrega',
    recipeDescription:
      'Consulta cada envío al canal y cada intento del proveedor.',
    redacted:
      'El contenido de los mensajes, los destinatarios y los tokens de arrendamiento están ocultos.',
    providerAttempts: 'Intentos del proveedor',

    eyebrow: 'Notificaciones',
    title: 'Registros de notificaciones',
    description:
      'Consulta la entrega de notificaciones y cada intento del proveedor. El contenido de los mensajes, los destinatarios y los tokens de arrendamiento están ocultos.',
    refreshing: 'Actualizando…',
    refresh: 'Actualizar',
    deliveriesShown: 'Entregas mostradas',
    needAttention: 'Requieren atención',
    unavailable: 'Registros no disponibles',
    recent: 'Notificaciones recientes',
    loading: 'Cargando historial de entregas…',
    emptyTitle: 'Aún no hay entregas',
    emptyDescription:
      'Los registros de entrega aparecerán aquí cuando se envíen notificaciones.',
    expand: 'Expandir notificación',
    collapse: 'Contraer notificación',
    noDeliveries: 'No hay entregas registradas.',
    noAttempts: 'No hay intentos registrados.',
    columns: {
      source: 'Origen',
      notificationId: 'Identificador de notificación',
      status: 'Estado',
      deliveries: 'Entregas',
      created: 'Creado',
      channel: 'Canal',
      provider: 'Proveedor',
      attempts: 'Intentos',
      updated: 'Actualizado',
    },
  },
  status: {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    partial: 'Parcial',
    failed: 'Fallido',
    unknown: 'Desconocido',
    preparing: 'Preparando',
    submitting: 'Enviando',
    retrying: 'Reintentando',
    accepted: 'Aceptado',
  },
  errors: {
    forbidden: 'Se ha retirado el acceso. Contacta con un administrador.',
    notFound:
      'Estos registros no están disponibles. Vuelve al panel de trabajo.',
    providerFailed:
      'La entrega ha fallado. Revisa la configuración del canal o contacta con un administrador.',
    requestFailed: 'La solicitud de notificación ha fallado.',
    inAppRecipientNotFound:
      'El destinatario de la notificación en la aplicación no existe.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
