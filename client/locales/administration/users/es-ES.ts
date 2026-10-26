import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Cerrar',
  nav: { users: 'Gestión de usuarios' },
  assignment: {
    saved: 'Se han actualizado los permisos de «{{name}}»',
    inspect: 'Comprobar permisos efectivos',
    keepEditing: 'Seguir editando',
    discardChanges: 'Descartar cambios',
    showMore: 'Mostrar más',
    title: 'Asignaciones de permisos',
    description:
      'Gestiona los permisos asignados directamente a este usuario. Los cambios se aplican al guardar.',
    search: 'Buscar nombres o descripciones',
    selectedOnly: 'Solo seleccionados',
    selected: '{{count}} seleccionadas',
    changes: '{{added}} añadidos, {{removed}} quitados',
    noChanges: 'Sin cambios',
    empty: 'No hay opciones coincidentes',
    protected: 'Esta asignación está protegida y no se puede modificar aquí',
    failed: 'No se ha podido guardar. Vuelve a intentarlo.',
    discard: '¿Descartar los cambios sin guardar?',
  },
  sessions: {
    title: '¿Revocar las sesiones de «{{name}}»?',
    description:
      'El usuario tendrá que volver a iniciar sesión en todos los dispositivos.',
    confirm: 'Revocar',
    success: 'Se han revocado las sesiones de «{{name}}»',
  },
  page: {
    noMatches: 'No hay usuarios que coincidan con los filtros.',
    clearFilters: 'Borrar filtros',
    emptyDescription:
      'Crea usuarios aquí o pide a un administrador que añada una cuenta.',
    retry: 'Reintentar',
    loading: 'Cargando',
    title: 'Usuarios',
    description:
      'Gestiona cuentas, asignaciones de permisos y sesiones activas.',
    add: 'Añadir usuario',
    search: 'Buscar nombre, usuario o correo',
    allStatuses: 'Todos los estados',
    allRoles: 'Todos los conjuntos de permisos',
    enabled: 'Activo',
    disabled: 'Suspendido',
    noUsers: 'No se han encontrado usuarios.',
    total: '{{count}} usuarios',
    previous: 'Anterior',
    next: 'Siguiente',
    selectRole: 'Seleccionar conjunto de permisos',
    roles: 'Conjuntos de permisos',
    systemAdministrator: 'Administrador del sistema',
    noDirectRoles: 'Sin asignación directa',
    protectedRole: 'Asignación protegida',
    authenticatedDefaultAccess:
      'Aquí solo se muestran las asignaciones directas. No se incluyen los permisos recibidos mediante todos los usuarios con sesión iniciada, equipos u otros sujetos.',
    columns: { user: 'Usuario', status: 'Estado', actions: 'Acciones' },
    actions: {
      menuFor: 'Acciones para {{name}}',
      edit: 'Editar',
      resetPassword: 'Restablecer contraseña',
      revokeSessions: 'Revocar sesiones',
      enable: 'Activar cuenta',
      delete: 'Eliminar',
      disable: 'Suspender cuenta',
    },
  },
  form: {
    roleRequired: 'Elige un valor para {{name}}.',
    nameRequired: 'Introduce un nombre.',
    emailInvalid: 'Introduce un correo electrónico válido.',
    passwordRequired: 'Introduce una contraseña.',
    saved: 'Se ha guardado el usuario «{{name}}»',
    addTitle: 'Añadir usuario',
    editTitle: 'Editar usuario',
    addDescription: 'Crea una cuenta y asígnale permisos.',
    editDescription: 'Actualiza el perfil de la cuenta.',
    name: 'Nombre',
    username: 'Nombre de usuario',
    email: 'Correo electrónico',
    password: 'Contraseña',
    cancel: 'Cancelar',
    save: 'Guardar',
    create: 'Crear',
  },
  password: {
    saved: 'Restablecer la contraseña de «{{name}}»',
    title: 'Restablecer contraseña',
    description:
      'Establece una nueva contraseña para {{name}}. Se revocarán todas las sesiones.',
    newPassword: 'Nueva contraseña',
    submit: 'Restablecer contraseña',
  },
  state: {
    enabled: 'Se ha activado la cuenta «{{name}}»',
    disabled: 'Se ha suspendido la cuenta «{{name}}»',
    enableTitle: '¿Activar la cuenta «{{name}}»?',
    disableTitle: '¿Suspender la cuenta «{{name}}»?',
    enableDescription:
      'Se retirará el bloqueo de inicio de sesión de {{name}}. Las reglas de acceso existentes seguirán vigentes.',
    disableDescription:
      '{{name}} no podrá iniciar sesión y se cerrarán sus sesiones en todos los dispositivos. Se conserva la configuración de autorización; suspender la cuenta no implica una baja laboral.',
    enable: 'Activar cuenta',
    disable: 'Suspender cuenta',
  },
  deletion: {
    title: '¿Eliminar el usuario «{{name}}»?',
    description:
      'Se revocarán todas las sesiones y claves de API de {{name}}. Se conservará la actividad histórica. Esta acción no se puede deshacer.',
    success: 'Se ha eliminado el usuario «{{name}}»',
  },
  invite: {
    open: 'Invitar usuarios',
    title: 'Invitar usuarios',
    description:
      'Cada dirección que no tenga una cuenta recibirá un correo con un enlace para crearla.',
    emails: 'Direcciones de correo',
    emailsHint:
      'Una por línea o separadas por comas o espacios. Hasta 50 a la vez.',
    emailsRequired: 'Introduce al menos una dirección de correo.',
    emailsInvalid: 'Direcciones de correo no válidas: {{emails}}',
    emailsTooMany: 'Invita a un máximo de 50 direcciones a la vez.',
    roles: 'Permisos al incorporarse',
    send: 'Enviar invitaciones',
    sent: 'Invitaciones enviadas.',
    done: 'Finalizadas',
    link: 'Enlace de invitación',
    copy: 'Copiar enlace',
    copied: 'Copiado',
    copyFailed: 'No se ha podido copiar el enlace.',
    outcome: {
      sent: 'Correo enviado',
      notSent: 'Correo no enviado: copia el enlace siguiente',
      existingUser: 'Ya tiene una cuenta',
    },
  },
  invitations: {
    title: 'Invitaciones pendientes',
    empty: 'No hay invitaciones pendientes.',
    email: 'Correo electrónico',
    invitedBy: 'Invitado por',
    expires: 'Caduca',
    status: 'Estado',
    pending: 'Pendiente',
    expired: 'Caducado',
    notSent: 'No enviado',
    resend: 'Volver a enviar',
    revoke: 'Revocar',
    actionsFor: 'Acciones para la invitación a {{email}}',
    resent: 'Invitación enviada de nuevo.',
    revoked: 'Invitación revocada.',
    revokeTitle: '¿Revocar la invitación a «{{email}}»?',
    revokeDescription: 'El enlace enviado a {{email}} dejará de funcionar.',
  },
  accept: {
    title: 'Aceptar la invitación',
    description: '{{inviter}} te ha invitado.',
    summary: 'También te incorporarás a: {{items}}',
    loading: 'Cargando la invitación…',
    email: 'Correo electrónico',
    name: 'Nombre',
    password: 'Contraseña',
    nameRequired: 'Introduce tu nombre.',
    passwordTooShort: 'La contraseña debe tener al menos {{min}} caracteres.',
    submit: 'Crear cuenta e incorporarse',
    submitting: 'Incorporando…',
    signedIn:
      'Has iniciado sesión como {{name}}. Cierra la sesión para aceptar esta invitación con una cuenta nueva.',
    signOut: 'Cerrar sesión',
    signOutFailed: 'No se ha podido cerrar la sesión.',
    existingAccount:
      'Esta dirección ya tiene una cuenta. Inicia sesión con ella para continuar.',
    goToLogin: 'Ir al inicio de sesión',
    errors: {
      notFound: 'Este enlace de invitación no es válido.',
      expired: 'Esta invitación ha caducado. Solicita una nueva.',
      accepted: 'Esta invitación ya se ha aceptado.',
      revoked: 'Esta invitación se ha revocado.',
      password: 'La contraseña no cumple los requisitos.',
      accountConflict: 'No se puede crear una cuenta con esta dirección.',
      failed: 'Se ha producido un error. Vuelve a intentarlo.',
    },
  },
  errors: {
    loadFailed: 'No se han podido cargar los usuarios. Vuelve a intentarlo.',
    loadForbidden:
      'Ya no puedes ver los usuarios. Contacta con un administrador.',
    loadNotFound:
      'La gestión de usuarios no está disponible. Vuelve al panel de trabajo.',
    SELF_DELETE_NOT_ALLOWED: 'No puedes eliminar tu propia cuenta.',
    LAST_ASSIGNMENT:
      'Este usuario es el último que tiene un conjunto de permisos que debe permanecer asignado.',
    USER_HAS_APPS:
      'Transfiere o elimina las aplicaciones de este usuario antes de eliminarlo.',
    HUB_ADMIN_REQUIRED:
      'Solo un administrador de la plataforma puede eliminar usuarios.',
    PROTECTED_ROLE_ASSIGNMENT:
      'Este rol no se puede asignar ni quitar desde Gestión de usuarios.',
    USER_NOT_FOUND: 'El usuario ya no existe.',
    USER_DELETION_NOT_CONFIGURED:
      'La eliminación de usuarios no está configurada para esta aplicación.',
    USER_EMAIL_CONFLICT: 'Ya existe un usuario con este correo.',
    USER_USERNAME_CONFLICT: 'Ya existe un usuario con este nombre de usuario.',
    USER_IDENTITY_CONFLICT:
      'Ya existe un usuario con este correo o nombre de usuario.',
    PASSWORD_TOO_SHORT: 'La contraseña es demasiado corta.',
    PASSWORD_TOO_LONG: 'La contraseña es demasiado larga.',
    operationFailed: 'La operación de usuario ha fallado.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
