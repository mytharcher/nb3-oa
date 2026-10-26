import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Cerrar',
  nav: { apiKeys: 'Claves de API' },
  page: {
    search: 'Buscar por nombre de clave',
    retry: 'Reintentar',
    clear: 'Borrar filtros',
    noResults: 'No hay claves que coincidan con la búsqueda.',
    loading: 'Cargando',
    title: 'Claves de API',
    description:
      'Crea claves para que scripts e integraciones accedan a esta aplicación con tu identidad.',
    add: 'Crear clave',
    empty: 'Aún no tienes claves de API.',
    unnamed: 'Clave sin nombre',
    never: 'Nunca',
    unused: 'Nunca utilizada',
    active: 'Activo',
    expired: 'Caducado',
    disabled: 'Desactivado',
    columns: {
      name: 'Nombre',
      key: 'Clave',
      status: 'Estado',
      lastUsed: 'Último uso',
      expires: 'Caduca',
      actions: 'Acciones',
    },
    actions: { revoke: 'Revocar', menu: 'Acciones para «{{name}}»' },
  },
  form: {
    title: 'Crear clave de API',
    description:
      'La clave actúa con tu identidad y tiene exactamente los permisos de tu cuenta.',
    name: 'Nombre',
    namePlaceholder: 'Tarea de exportación nocturna',
    expiry: 'Caduca',
    expiryChoices: {
      never: 'Nunca',
      '7': 'En 7 días',
      '30': 'En 30 días',
      '90': 'En 90 días',
      '365': 'En 1 año',
    },
    cancel: 'Cancelar',
    create: 'Crear',
  },
  reveal: {
    title: 'Copia tu clave ahora',
    description:
      'Se ha creado «{{name}}». La clave solo se muestra en este momento.',
    usage: 'Envíala en la cabecera x-api-key de la solicitud.',
    copy: 'Copiar clave',
    done: 'Finalizadas',
  },
  revoke: {
    success: 'Se ha revocado la clave «{{name}}»',
    title: '¿Revocar la clave «{{name}}»?',
    description:
      'Las solicitudes que utilicen «{{name}}» fallarán inmediatamente. Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    confirm: 'Revocar',
  },
  errors: {
    forbidden: 'Ya no puedes ver las claves. Contacta con un administrador.',
    notFound:
      'La gestión de claves de API no está disponible. Vuelve al panel de trabajo.',
    nameRequired: 'Introduce un nombre para la clave.',
    copyFailed:
      'No se ha podido copiar la clave. Selecciónala y cópiala manualmente.',
    loadFailed: 'No se han podido cargar tus claves de API.',
    createFailed: 'No se ha podido crear la clave de API.',
    revokeFailed: 'No se ha podido revocar la clave de API.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
