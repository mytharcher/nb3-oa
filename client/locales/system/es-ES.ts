import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/es-ES';
import inboxEnUS from '#extensions/nocobase-inbox/locales/es-ES';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'Mensajes',
  'inbox.loadFailed': 'No se han podido cargar los mensajes',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Mensajes',
  'inboxButton.pending': 'Mensajes, {{count}} pendientes',
  'inboxButton.unread': 'Mensajes, {{count}} sin leer',
  'inboxButton.pendingHint':
    'Tienes {{count}} pendientes; el número disminuye al resolverlos.',
  'inboxButton.unreadHint':
    'Tienes {{count}} sin leer; el número disminuye al leerlos.',
  'auth.welcome': 'Te damos la bienvenida',
  'auth.loginDescription':
    'Inicia sesión con tu nombre de usuario o correo y contraseña.',
  'auth.registerTitle': 'Crear una cuenta',
  'auth.registerDescription': 'Crea una cuenta para empezar.',
  'auth.forgotTitle': 'Contraseña olvidada',
  'auth.forgotDescription':
    'Introduce tu correo y te enviaremos un enlace de restablecimiento si la cuenta existe.',
  'auth.resetDescription': 'Elige una nueva contraseña para tu cuenta.',
  'auth.resetTitle': 'Restablecer contraseña',
  'auth.identifier': 'Nombre de usuario o correo',
  'auth.password': 'Contraseña',
  'auth.signIn': 'Iniciar sesión',
  'auth.signingIn': 'Iniciando sesión…',
  'auth.hidePassword': 'Ocultar contraseña',
  'auth.showPassword': 'Mostrar contraseña',
  'auth.forgotLink': '¿Has olvidado la contraseña?',
  'auth.noAccount': '¿No tienes una cuenta?',
  'auth.signUp': 'Registrarse',
  'auth.createAccount': 'Crear cuenta',
  'auth.creatingAccount': 'Creando cuenta…',
  'auth.name': 'Nombre',
  'auth.username': 'Nombre de usuario',
  'auth.email': 'Correo electrónico',
  'auth.confirmPassword': 'Confirmar contraseña',
  'auth.existingAccount': '¿Ya tienes una cuenta?',
  'auth.passwordMismatch': 'Las contraseñas no coinciden.',
  'auth.resetting': 'Restableciendo…',
  'auth.newPassword': 'Nueva contraseña',
  'auth.confirmNewPassword': 'Confirmar nueva contraseña',
  'auth.invalidResetLink':
    'Este enlace de restablecimiento no es válido o ha caducado.',
  'auth.backToSignIn': 'Volver al inicio de sesión',
  'auth.sendResetLink': 'Enviar enlace de restablecimiento',
  'auth.sending': 'Enviando…',
  'auth.resetSent':
    'Si la cuenta existe, se ha enviado un enlace de restablecimiento.',
  'auth.rememberPassword': '¿Recuerdas tu contraseña?',
  'auth.methods': 'Métodos de inicio de sesión',
  'auth.or': 'O continuar con',
  'auth.continueWith': 'Continuar con {provider}',
  'auth.about': 'Acerca de esta aplicación',
  'auth.platform': 'Plataforma de aplicaciones nativa de IA',
  'auth.marketingTitleFirst': 'Deja que la IA cree libremente.',
  'auth.marketingTitleSecond': 'NocoBase garantiza la',
  'auth.marketingTitleThird': 'fiabilidad.',
  'auth.marketingDescription':
    'Ofrece a la IA un entorno de interfaz flexible para diseñar cada experiencia mientras NocoBase protege los datos, los permisos y la gobernanza.',
  'auth.frontend': 'Interfaz nativa de IA',
  'auth.frontendDescription':
    'Crea interfaces libremente con una estructura flexible.',
  'auth.foundation': 'Base de NocoBase',
  'auth.foundationDescription':
    'Datos, control de acceso y gobernanza fiables.',
  'auth.marketingFooter': 'Libertad al crear. Confianza en la base.',
  'status.loading': 'Cargando',
  'status.loadingPage': 'Cargando página',
  'status.denied': 'Acceso denegado',
  'status.pageFailed': 'No se ha podido cargar la página',
  'status.retry': 'Reintentar',
  'navigation.brandHome': 'Inicio de NocoBase',
  'navigation.brandApps': 'Aplicaciones NocoBase',
  'routeOverlay.close': 'Cerrar',
  'status.backHome': 'Volver al panel de trabajo',
  'status.deniedDescription': 'No tienes permiso para acceder a esta página.',
  'status.routeFailedDescription':
    'No se ha podido cargar esta página. Vuelve a intentarlo.',
  shell: {
    buildFreely: 'La IA crea libremente.',
    reliability: '<brand>NocoBase</brand> garantiza la fiabilidad.',
  },
  home: {
    platform: 'NocoBase · Plataforma de aplicaciones nativa de IA',
    title: 'Descríbelo y tu agente lo crea',
    description:
      'Esta aplicación se desarrolla conversando con tu agente de programación. Explica las necesidades de la empresa con palabras sencillas y el agente creará las páginas, los modelos de datos, las API y los procesos de negocio del proyecto.',
    steps: {
      describe: {
        title: 'Describe la necesidad',
        description:
          'Indica quién lo utiliza, qué datos conserva y qué debe ocurrir.',
      },
      build: {
        title: 'Deja que el agente lo cree',
        description:
          'Lee este proyecto y sus capacidades integradas y después escribe el código.',
      },
      review: {
        title: 'Comprueba y ajusta',
        description:
          'Actualiza la página para probarlo y solicita cambios del mismo modo.',
      },
    },
    example: {
      title: 'Prueba con una solicitud como esta',
      text: 'Crea una aplicación de pedidos de compra.\n\nCada pedido tiene número, artículo, solicitante, importe y estado de aprobación. Los solicitantes crean pedidos y solo ven los propios; los revisores ven todos los pedidos pendientes y los aprueban o rechazan.\nDespués de decidir, notifica al solicitante en la bandeja de entrada con un enlace al pedido.',
      hint: 'Pégala en Claude Code, Codex, Cursor o cualquier agente de programación abierto en este proyecto.',
    },
    capabilitiesTitle: 'Capacidades integradas',
    capabilitiesDescription:
      'Tu agente utiliza directamente estas capacidades sin tener que crearlas desde cero. Abre una para obtener una instrucción que puedes editar y copiar.',
    viewPrompts: 'Ver instrucciones ({{count}})',
    prompt: {
      label: 'Instrucción',
      hint: 'Adapta la instrucción a tu empresa antes de copiarla. Los cambios no se guardan al cerrar el diálogo.',
      copy: 'Copiar',
      copiedShort: 'Copiado',
      copied: 'Instrucción copiada',
      copyFailed:
        'No se ha podido copiar. Selecciona el texto y cópialo manualmente.',
      reset: 'Restaurar valor predeterminado',
    },
    capabilities: {
      auth: {
        title: 'Autenticación',
        description:
          'Inicio de sesión, registro, restablecimiento de contraseña y acceso único de empresa.',
        prompts: {
          disableSignUp: {
            label: 'Cerrar el registro',
            text: 'Esta aplicación es exclusiva para empleados de la empresa. Los administradores crean todas las cuentas.\nDesactiva el registro libre y elimina el enlace de registro de la página de inicio de sesión.\nLos empleados existentes deben poder seguir iniciando sesión con sus cuentas y contraseñas.\nConserva el enlace de contraseña olvidada.',
          },
          passwordRules: {
            label: 'Reglas de contraseña',
            text: 'Exige al menos 12 caracteres al registrarse o restablecer una contraseña.\nMuestra este requisito en ambos formularios y utiliza mensajes de validación coherentes.\nPermite que las cuentas existentes sigan iniciando sesión sin exigir un cambio inmediato de contraseña.',
          },
          companySso: {
            label: 'Acceso único de empresa',
            text: 'Permite que los empleados inicien sesión mediante nuestra plataforma de identidad empresarial con OIDC.\n\nConserva el acceso con cuenta y contraseña y añade un botón Cuenta de empresa.\nEl botón abre la plataforma de identidad de la empresa. Tras iniciar sesión correctamente, vuelve a la página de inicio de la aplicación.\n\nPermite que el primer acceso cree una cuenta en la aplicación, identificada por el identificador estable de usuario de la plataforma.\nNo vincules cuentas automáticamente por coincidencias de nombre o correo. Las cuentas nuevas utilizan los permisos predeterminados de la aplicación.\n\nEnumera los datos que debe proporcionar el administrador de la plataforma de identidad y la URL de retorno que debe registrar.',
          },
        },
      },
      authorization: {
        title: 'Permisos',
        description:
          'Controla quién puede abrir cada página, ejecutar acciones y ver registros.',
        prompts: {
          jobs: {
            label: 'Funciones',
            text: 'Crea las funciones Solicitante de compras y Revisor de pedidos en la aplicación.\nLos solicitantes de compras pueden entrar en la página de pedidos y ver los que han solicitado.\nLos revisores de pedidos pueden entrar en la página de pedidos, ver pedidos y aprobar o rechazar los pendientes.\nSolo los administradores de la aplicación pueden cambiar permisos y asignaciones.\nUtiliza la capacidad de autorización existente para que los administradores puedan ajustar permisos y asignar personas más adelante.',
          },
          dataScopes: {
            label: 'Ámbitos de datos',
            text: 'Permite que los solicitantes de compras vean solo sus propios pedidos, utilizando el campo solicitante para determinar a quién pertenecen.\nLos revisores de pedidos pueden ver todos los pedidos y procesar aprobaciones pendientes.\nLos administradores pueden ajustar el ámbito de visualización de pedidos de cada función en su conjunto de permisos.',
          },
          sharing: {
            label: 'Uso compartido',
            text: 'Comparte el pedido PO-2026-004 de Bob con Alice para que pueda revisarlo.\nAlice ya tiene permiso para ver pedidos; añade acceso de lectura a este pedido.\nConserva sus responsabilidades actuales. Los revisores de pedidos seguirán procesando las aprobaciones.\nPermite que los administradores gestionen esta regla de uso compartido.',
          },
        },
      },
      scheduler: {
        title: 'Tareas programadas',
        description:
          'Ejecuta tareas empresariales a horas programadas y consulta la siguiente ejecución y sus resultados.',
        prompts: {
          reminder: {
            label: 'Recordatorio diario',
            text: 'Añade un Recordatorio de pedidos pendientes a la aplicación de pedidos existente.\n\nA las 09:00, hora de Pekín, de cada día laborable, busca los pedidos pendientes de aprobación, agrúpalos por revisor y envía una notificación en la aplicación a cada revisor.\nIncluye el número de pedidos pendientes y un enlace a la lista correspondiente. No envíes nada si no hay pedidos pendientes.\nLos administradores pueden ver la programación y los registros de ejecución, así como pausar o reanudar los recordatorios.',
          },
          weeklyReport: {
            label: 'Informe semanal',
            text: 'A las 08:00, hora de Pekín, de cada lunes, genera el resumen de ventas de la semana anterior y notifica al responsable de ventas.\nIncluye los ingresos por ventas, el número de pedidos y los totales por región. Los administradores pueden consultar la tarea y los registros de ejecución.',
          },
        },
      },
      notification: {
        title: 'Notificaciones',
        description:
          'Envía mensajes en la aplicación, correos o mensajes de bots de grupo cuando ocurra algo.',
        prompts: {
          inApp: {
            label: 'Mensaje en la aplicación',
            text: 'Añade la aprobación de pedidos a la aplicación actual y notifica los resultados a los solicitantes mediante mensajes en la aplicación.\n\nLos pedidos incluyen número, nombre, solicitante, importe y estado de aprobación.\nLos solicitantes pueden ver sus propios pedidos. Los revisores pueden ver los pendientes y aprobarlos o rechazarlos. Reutiliza las funciones existentes de pedidos y aprobación si están disponibles.\n\nTras aprobar o rechazar un pedido, envía un único mensaje en la aplicación exclusivamente al solicitante.\nEl título indica si el pedido se ha aprobado o rechazado. El cuerpo incluye el número, el nombre y el resultado de aprobación.\nAl pulsar el mensaje se abren los detalles del pedido correspondiente.\nNo envíes mensajes mientras la aprobación esté pendiente. Notifica una sola vez el mismo resultado de aprobación.\nUn fallo en la notificación no afecta al resultado de aprobación guardado.',
          },
          email: {
            label: 'Correo electrónico',
            text: 'Añade el correo a las notificaciones existentes de aprobación de pedidos mediante el canal de correo configurado en la aplicación.\n\nTras aprobar o rechazar un pedido, envía el resultado al correo de la cuenta del solicitante.\nIncluye el número de pedido en el asunto y el nombre del pedido y su resultado en el cuerpo.\nConserva los mensajes existentes en la aplicación. Si el solicitante no tiene correo, envía únicamente el mensaje en la aplicación.\nUn fallo del correo no debe afectar al resultado de aprobación ni al mensaje en la aplicación.',
          },
        },
      },
      mail: {
        title: 'Correo',
        description:
          'Conecta buzones personales para leer, responder y enviar correos de trabajo.',
        prompts: {
          mailCenter: {
            label: 'Centro de correo',
            text: 'Añade un centro de correo y una entrada de gestión de cuentas de buzón a la aplicación. Los usuarios pueden conectar sus propios buzones, seleccionar uno, sincronizar los mensajes entrantes, leer mensajes y adjuntos y responder.\n\nCuando un representante de ventas reciba una solicitud de presupuesto, podrá responder desde el centro de correo. Conserva el asunto original y el contexto de la conversación y dirige la respuesta al remitente original. Cada usuario trabaja con sus propios buzones conectados.',
          },
          correspondence: {
            label: 'Correos de clientes',
            text: 'Añade una sección de correspondencia a los detalles del cliente. Muestra los mensajes cuyo remitente o destinatario coincida con las direcciones de correo de contacto del cliente actual. Los representantes de ventas pueden leer mensajes, ver adjuntos y responder desde sus propios buzones conectados.',
          },
        },
      },
      file: {
        title: 'Archivos',
        description:
          'Sube archivos, adjúntalos a registros y previsualízalos o descárgalos.',
        prompts: {
          attachments: {
            label: 'Adjuntos',
            text: 'Añade adjuntos de compras a mi aplicación de gestión de pedidos existente.\n\nAñade un área de adjuntos en los detalles de cada pedido. Cada pedido puede tener varios archivos, incluidos PDF, imágenes y DOCX.\nMuestra los nombres y tamaños de archivo, con acciones para previsualizar, descargar y quitar adjuntos.\nTras subirlos, permite guardar los adjuntos en el pedido actual. Deben seguir disponibles al volver a abrirlo.\nCualquier persona con acceso al pedido puede ver y descargar sus adjuntos. Los solicitantes y revisores pueden añadir o quitar adjuntos.\nQuitar un adjunto solo lo desvincula del pedido actual; conserva el archivo.',
          },
          avatar: {
            label: 'Avatar',
            text: 'Añade un avatar a cada empleado, con una imagen por empleado.\nPermite subir y sustituir el avatar y muéstralo en las listas y los detalles de empleados.\nUtiliza el avatar nuevo tras sustituirlo y mantenlo visible al actualizar la página.',
          },
        },
      },
      templatePrint: {
        title: 'Impresión de plantillas',
        description:
          'Rellena plantillas de Word o Excel con datos empresariales y genera archivos.',
        prompts: {
          approvalForm: {
            label: 'Formulario de aprobación',
            text: 'Añade una acción «Generar formulario de aprobación» a los detalles del pedido.\n\nUtiliza la plantilla de Word que he proporcionado para rellenar el número del pedido actual, la solicitud de compra, el solicitante, el importe, el resultado de aprobación y la hora de procesamiento.\nConserva el encabezado, la disposición de las tablas y el área de firmas. Nombra el archivo «Aprobación-compra-número-pedido» y permite descargarlo en Word.\nCualquier persona con acceso al pedido puede generar su formulario de aprobación. Utiliza los datos actuales del pedido al generar el archivo.',
          },
          pdf: {
            label: 'Exportación a PDF',
            text: 'Añade la descarga en PDF del formulario de aprobación de compras, conservando las fuentes, las tablas y la zona de firmas de la plantilla de Word.',
          },
        },
      },
      i18n: {
        title: 'Idiomas',
        description:
          'Cambia el idioma de la interfaz, añade idiomas y establece el predeterminado.',
        prompts: {
          addLanguage: {
            label: 'Añadir un idioma',
            text: 'Añade español a mi aplicación. Traduce la interfaz y los mensajes del servidor y añade español al menú de idiomas.',
          },
          defaultLanguage: {
            label: 'Idioma predeterminado',
            text: 'Establece el chino simplificado como idioma predeterminado para quienes no hayan elegido uno. Mantén el inglés en el menú de idiomas.',
          },
        },
      },
      theme: {
        title: 'Temas',
        description:
          'Ajusta los colores, las fuentes y la densidad y alterna entre los modos claro y oscuro.',
        prompts: {
          changeTheme: {
            label: 'Cambiar un tema',
            text: 'Actualiza el tema Compacto: usa azul como color principal y aumenta ligeramente el radio de las esquinas. Mantén las fuentes, los tamaños de texto y el espaciado compacto actuales.',
          },
          newTheme: {
            label: 'Nuevo tema',
            text: 'Crea un tema Bosque con verde como color principal, fondos suaves, esquinas moderadamente redondeadas y sombras sutiles.',
          },
        },
      },
    },
  },

  appearance: {
    title: 'Apariencia',
    mode: 'Modo de color',
    preset: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    themes: { default: 'Amplio', compact: 'Compacto' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Cerrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    language: 'Idioma',
  },
  notices: {
    serverLocaleFallback:
      'El servidor no admite este idioma, por lo que sus mensajes se mostrarán en inglés.',
    languageChangeFailed:
      'No se ha podido cambiar el idioma. Vuelve a intentarlo.',
  },
  account: {
    signOutFailed: 'No se ha podido cerrar la sesión. Vuelve a intentarlo.',
    openMenu: 'Abrir menú de cuenta',
    fallback: 'Cuenta',
    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión…',
  },
  navigation: {
    home: 'Inicio',
    open: 'Abrir navegación',
    close: 'Cerrar navegación',
    expand: 'Expandir navegación',
    collapse: 'Contraer navegación',
    toggle: 'Expandir o contraer navegación',
    label: 'Navegación de la aplicación',
    description: 'Ir a una página de esta aplicación.',
    breadcrumb: 'Ruta de navegación',
    breadcrumbMore: 'Mostrar los niveles intermedios',
    back: 'Volver',
  },
  dataTable: {
    emptyDescription:
      'No hay registros disponibles en el ámbito actual. Prueba con otro ámbito o vuelve a consultar más tarde.',
    noResults: 'Sin resultados.',
    sortAscending: 'Ascendente',
    sortDescending: 'Descendente',
    hideColumn: 'Ocultar',
    view: 'Ver',
    toggleColumns: 'Mostrar u ocultar columnas',
    selectedCount: '{{selected}} de {{total}} filas seleccionadas.',
    rowsPerPage: 'Filas por página',
    pageOf: 'Página {{page}} de {{pageCount}}',
    firstPage: 'Ir a la primera página',
    previousPage: 'Ir a la página anterior',
    nextPage: 'Ir a la página siguiente',
    lastPage: 'Ir a la última página',
  },
  datePicker: {
    placeholder: 'Seleccionar una fecha',
    rangePlaceholder: 'Seleccionar un intervalo de fechas',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
