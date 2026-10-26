import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Permisos de páginas',
    page: 'Páginas',
    business: 'Permisos empresariales',
    administration: 'Administración',
    other: 'Otros',
  },
  options: {
    defaultAndSharing: 'Usar el ámbito de datos predeterminado',
    actions: {
      assign: 'Gestionar asignaciones',
      configure: 'Configurar',
      inspect: 'Inspeccionar permisos',

      read: 'Leer',
      create: 'Crear',
      update: 'Actualizar',
      delete: 'Eliminar',
      access: 'Acceso',
    },
    settingsModules: { authorization: 'Autorización' },
    pages: {
      all: 'Todas las páginas',
      allDescription:
        'Permite acceder a todas las páginas, incluidas las que se añadan más adelante.',
    },
    settings: {
      inspector: 'Inspector de permisos',
      'permission-sets': 'Conjuntos de permisos',
    },
    subjectTypes: {
      authenticated: 'Todos los usuarios con sesión iniciada',
      authenticatedDescription:
        'Se aplica a todos los usuarios con una sesión válida iniciada.',
      user: 'Usuarios',
    },
    recordAccessPolicies: {
      allRecords: 'Todos los registros',
      recordsIOwn: 'Registros que me pertenecen',
      recordsICreated: 'Registros que he creado',
      customFilter: 'Filtro personalizado',
      customFilterHint:
        'Selecciona registros mediante una condición de filtro personalizada.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
