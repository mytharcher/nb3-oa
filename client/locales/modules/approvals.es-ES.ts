import registryLocale from '../../extensions/nocobase-approval-ui/locales/es-ES.js';
import { approvalLocaleEsES as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: 'Imprimir / Guardar PDF',
    printFailed: 'La impresión ha fallado. Vuelve a intentarlo.',
    saving: 'Guardando…',
    noAvailableAction: 'No hay acciones disponibles actualmente',
    authz: {
      cancellation: 'Cancelación de ausencia',
      section: 'Aprobaciones de OA',
      leave: 'Solicitudes de ausencia',
      submit: 'Enviar solicitud propia',
      delegate: 'Enviar solicitud para un empleado',
      view: 'Leer solicitudes',
      delegations: 'Delegaciones de aprobación',
      read: 'Leer',
      update: 'Gestionar',
    },
    permissionSets: {
      delegations: 'Administración de delegaciones de aprobación',
    },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'Introduce el motivo de esta operación.',
    CLAIM_FIRST: 'Asume esta tarea de gestión antes de registrar su resultado.',
    TASK_CLOSED:
      'Esta tarea ha finalizado. Actualiza la solicitud y utiliza sus acciones disponibles actualmente.',
    ALREADY_ANSWERED:
      'Esta tarea ya tiene tu respuesta. Actualiza para ver el resultado registrado.',
    NOT_YOUR_TURN: 'Una aprobación anterior sigue pendiente. Espera tu turno.',
    STALE:
      'La aprobación ha cambiado. Carga la última solicitud antes de continuar.',
    CONTENT_CHANGED:
      'El contenido revisado ha cambiado. Actualiza y revísalo de nuevo antes de actuar.',
    STALE_CONTENT:
      'El contenido revisado ha cambiado. Actualiza y revísalo de nuevo antes de actuar.',
    INVALID_ANSWER:
      'Esta decisión no está disponible en la etapa actual. Actualiza y elige una acción disponible.',
    NOT_ALLOWED:
      'Esta acción ya no está disponible. Actualiza y elige una acción actual.',
    NO_ASSIGNEE:
      'No hay un gestor apto asignado. Pide a un administrador de aprobación que asigne uno.',
    NO_STAGE:
      'No hay una etapa de aprobación activa disponible. Actualiza y pide a un administrador de aprobación que revise la solicitud.',
    ASSIGNMENT_LOOP:
      'Esta reasignación devolvería la tarea a un gestor anterior. Selecciona otro destinatario apto.',
  },
  businessErrorFields: '{{message}} Comprueba estos campos: {{fields}}.',
  invalidFields: 'Comprueba estos campos: {{fields}}.',
  fieldSeparator: ', ',
  businessErrors: {
    LEAVE_MAX_DAYS:
      'La ausencia solicitada supera el máximo de este tipo. Reduce el período.',
    LEAVE_NO_WORKDAYS:
      'El período seleccionado no contiene medias jornadas laborables. Ajusta las fechas.',
    LEAVE_TYPE_UNAVAILABLE:
      'Este tipo de ausencia no está disponible. Selecciona un tipo activado.',
    LEAVE_DELEGATE_REQUIRED:
      'Selecciona otro empleado activo para la solicitud delegada.',
  },

  creationUnknown:
    'Se desconoce el resultado del guardado. Reintenta el mismo guardado o comprueba los borradores existentes.',
  resubmit: 'Volver a enviar',
  submitted: 'Se ha enviado {{name}}',
  draftSavedSubmitFailed:
    'Borrador guardado. El envío no se ha completado. Resuelve el problema y vuelve a intentarlo.',
  submissionUnknown:
    'Se desconoce el resultado del envío. Reintenta Enviar con el mismo contenido antes de modificarlo.',
  transfer: 'Transferir',
  addSigner: 'Añadir firmante',
  urge: 'Recordar',
  recipientSearch: 'Buscar destinatarios aptos',
  moreRecipients: 'Cargar más destinatarios',
  signerMode: 'Modo de firmantes',
  signerbefore: 'Antes de mi decisión',
  signeralongside: 'En paralelo con mi decisión',
  emptyTodoTitle: 'No hay aprobaciones pendientes',
  emptyTodoDescription:
    'Aquí aparecerán las aprobaciones que requieran tu acción.',
  emptyDoneTitle: 'No hay aprobaciones completadas',
  emptyDoneDescription:
    'Aquí aparecerán las aprobaciones en las que has actuado.',
  emptyCopiedTitle: 'No hay aprobaciones en copia',
  emptyCopiedDescription:
    'Aquí aparecerán las solicitudes que recibas en copia.',
  emptyMineTitle: 'No hay solicitudes iniciadas',
  emptyMineDescription:
    'Completa una solicitud y envíala o guarda un borrador.',
  calendarTimeZone: 'Las fechas utilizan el calendario laboral de {{zone}}.',
  refreshAfterSuccess:
    'La acción se ha realizado, pero no se han podido cargar los últimos detalles. Actualiza sin repetir la acción.',
  domainInvalid:
    'La solicitud no cumple las condiciones empresariales. Revisa el tipo de ausencia, las fechas, la persona de traspaso y los detalles de la solicitud.',
  confirmSubmit:
    'El envío inicia el proceso de aprobación. Confirma los detalles de la solicitud.',
  confirmWithdraw: 'La retirada sale del proceso de aprobación actual.',
  confirmReject:
    'El rechazo finaliza esta solicitud y su proceso de aprobación.',
  confirmReturn:
    'La devolución permite al solicitante revisar la solicitud. El reenvío empieza en la primera etapa.',
  confirmTerminate:
    'La terminación administrativa finaliza este proceso de aprobación.',

  navigation: {
    center: 'Centro de tareas',
    delegations: 'Delegaciones de aprobación',
  },
  description: 'Procesa tareas de aprobación y sigue tus solicitudes.',
  tabs: {
    todo: 'Pendientes',
    done: 'Finalizadas',
    copied: 'En copia para mí',
    mine: 'Mis solicitudes',
  },
  newLeave: 'Nueva solicitud de ausencia',
  editLeave: 'Editar solicitud de ausencia',
  draft: 'Borrador',
  search: 'Buscar por referencia o solicitante',
  clear: 'Borrar filtros',
  all: 'Todas',
  noResults: 'No hay registros coincidentes',
  emptyTitle: 'Aún no hay solicitudes',
  emptyDescription:
    'Aquí aparecerán las nuevas tareas de aprobación y solicitudes.',
  refresh: 'Actualizar',
  loading: 'Cargando',
  reference: 'Número de solicitud',
  applicant: 'Solicitante',
  type: 'Tipo de ausencia',
  days: 'Días',
  status: 'Estado',
  createdAt: 'Fecha de solicitud',
  actions: 'Acciones para «{{name}}»',
  detail: 'Ver',
  edit: 'Editar',
  saveDraft: 'Guardar borrador',
  save: 'Guardar',
  cancel: 'Cancelar',
  close: 'Cerrar',
  submit: 'Enviar',
  withdraw: 'Retirar',
  terminate: 'Terminar',
  read: 'Marcar como leído',
  approve: 'Aprobar',
  reject: 'Rechazar',
  return: 'Devolver',
  comment: 'Comentar',
  appoint: 'Asignar',
  reassign: 'Reasignar',
  reason: 'Motivo',
  opinion: 'Comentar',
  person: 'Aprobador',
  place: 'Puesto sin asignar',
  startDate: 'Fecha de inicio',
  endDate: 'Fecha de fin',
  startHalf: 'Media jornada inicial',
  endHalf: 'Media jornada final',
  am: 'Mañana',
  pm: 'Tarde',
  handover: 'Persona de traspaso',
  delegate: 'Delegar aprobaciones durante la ausencia',
  attachmentMissing:
    'Algunos adjuntos no están disponibles. Vuelve a cargar la solicitud o contacta con el solicitante.',
  attachments: 'Adjuntos',
  attachmentRequired:
    'Añade los adjuntos justificativos que requiere el tipo de ausencia seleccionado.',
  attachmentUnavailable:
    'La subida de adjuntos no está disponible temporalmente. Reintenta más tarde o contacta con un administrador.',
  attachmentInvalid:
    'Algunos adjuntos seleccionados no son válidos o no pertenecen a esta solicitud. Vuelve a cargar la solicitud y selecciónalos de nuevo.',
  attachmentLimit:
    'Adjuntos: PDF, JPEG, PNG o WebP, hasta 5 MB por archivo y 10 archivos. Se guarda un borrador válido antes de la primera subida.',
  attachmentSize: 'Elige un archivo con contenido de hasta 5 MB.',
  attachmentType:
    'Elige un archivo PDF, JPEG, PNG o WebP con un formato coherente.',
  attachmentCount: 'Se permiten como máximo 10 adjuntos.',
  attachmentDenied:
    'No puedes acceder a los adjuntos de esta solicitud. Vuelve a cargarla para comprobar el acceso.',
  attachmentFailed:
    'La subida ha fallado. Comprueba el formulario y la conexión y elige de nuevo el archivo.',
  attachmentUploading: 'Guardando borrador y subiendo…',
  attachmentRemove: 'Quitar adjunto {{number}}',
  balanceInsufficient:
    'El saldo disponible de ausencia es insuficiente. Reduce los días o contacta con RR. HH.',
  balanceLimit:
    'Las vacaciones anuales y el descanso compensatorio estarán disponibles con los saldos de ausencias.',
  unavailable: 'Esta acción no está disponible. Revisa sus bloqueos.',
  formDescription: 'Completa la solicitud y envíala o guarda un borrador.',
  preview: 'Vista previa de la ruta de aprobación',
  facts: 'Detalles de la solicitud',
  progress: 'Progreso de aprobación',
  timeline: 'Historial de aprobación',
  saved: 'Se ha guardado la solicitud de ausencia «{{name}}»',
  completed: '{{action}}: «{{name}}»',
  actionTitle: '{{action}} solicitud «{{name}}»',
  returnHint:
    'Devuelve al solicitante; el reenvío empieza en la primera etapa.',
  confirmDescription:
    'Esto finaliza la tarea de aprobación actual. Confirma el contenido revisado.',
  discard: '¿Descartar los cambios?',
  discardDescription: 'Se perderán los cambios sin guardar.',
  discardConfirm: 'Descartar cambios',
  readOnly: 'Este registro es de solo lectura.',
  hrPreview:
    'Para una solicitud realizada en nombre de un empleado, la ruta se calcula al enviar.',
  dateRange: 'El fin no puede ser anterior al inicio.',
  required: 'Introduce un valor.',
  limit: 'Utiliza como máximo 10 000 caracteres.',
  handoverRequired:
    'Selecciona una persona de traspaso para activar la delegación.',
  unknownPerson: 'Nombre no disponible',
  yes: 'Sí',
  no: 'No',
  error: {
    invalid:
      'El contenido o la acción no cumplen los requisitos. Revísalos y ajústalos.',
    overlap:
      'Ya existe una solicitud de ausencia activa o aprobada que se solapa con este período. Ajusta las fechas.',
    configuration:
      'La configuración actual de plazos de aprobación no es compatible. Contacta con un administrador.',
    inactive: 'Un empleado requerido no está disponible. Revisa su estado.',

    failed: 'La solicitud ha fallado. Vuelve a intentarlo.',
    forbidden: 'Acceso denegado. Contacta con un administrador.',
    notFound: 'Este registro no existe o se ha eliminado. Vuelve a la lista.',
    conflict:
      'Esta solicitud ha cambiado. Carga el contenido actual antes de actuar.',
    stale: 'Esta tarea está cerrada o la acción ya no está disponible.',
  },
  loadLatest: 'Cargar última versión',
  retry: 'Reintentar',
  states: {
    draft: 'Borrador',
    revision: 'Requiere revisión',
    manager: 'Revisión del responsable',
    head: 'Revisión del responsable del departamento',
    hr: 'Revisión de RR. HH.',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
    terminated: 'Terminado',
  },
  stages: {
    manager: 'Responsable directo',
    head: 'Responsable del departamento',
    hr: 'RR. HH.',
    revision: 'Revisión del solicitante',
  },
  delegations: {
    create: 'Crear',
    description:
      'Permite que una persona delegada procese aprobaciones durante un período determinado.',
    new: 'Nueva delegación',
    edit: 'Editar delegación',
    disable: 'Desactivar',
    principal: 'Delegante',
    delegate: 'Delegar',
    scope: 'Ámbito',
    from: 'Inicio',
    to: 'Fin',
    source: 'Origen',
    active: 'Activo',
    inactive: 'Inactivo',
    manual: 'Manual',
    leave: 'Ausencia',
    search: 'Buscar por delegante o delegado',
    sourceLeave:
      'Creada desde una ausencia. Gestiónala mediante la solicitud relacionada.',
    invalid:
      'Selecciona empleados activos distintos y un fin posterior al inicio.',
    overlap:
      'Ya existe una delegación que cubre este ámbito y período. Ajusta el período o el ámbito.',
    disableTitle:
      '¿Desactivar la delegación de «{{principal}}» a «{{delegate}}»?',
    disableDescription:
      'La persona delegada dejará de procesar aprobaciones en este ámbito.',
    saved: 'Se ha guardado la delegación de «{{name}}»',
    empty: 'Aún no hay delegaciones de aprobación',
    emptyDescription:
      'Crea una delegación para permitir que otra persona procese aprobaciones durante un período.',
    timeZone: 'Las horas utilizan {{zone}}. El instante final queda excluido.',
  },
  typeUnavailable: 'Tipo de ausencia no disponible',
  noPickerPermission:
    'Seleccionar personas requiere permiso de lectura de usuarios. Contacta con un administrador.',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: 'Mis registros',
      readableScope: 'Solicitudes de aprobación legibles',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'Todas las aprobaciones',
      leaveScope: 'Aprobaciones de ausencias',
      fromTime: 'Hora de inicio (HH:mm)',
      toTime: 'Hora de fin (HH:mm)',
      timeInvalid:
        'Elige fechas e introduce horas válidas en formato de 24 horas.',
      disabled: 'Se ha desactivado la delegación de aprobación de «{{name}}»',
      readOnly: 'Esta delegación es de solo lectura.',
    },
  },
};
