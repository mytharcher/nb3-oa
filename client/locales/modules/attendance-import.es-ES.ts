export default {
  attendanceImport: {
    title: 'Importar justificantes de asistencia',
    description:
      'Previsualiza e importa justificantes originales inmutables. Esto no evalúa la asistencia ni calcula nóminas.',
    template: 'Descargar plantilla de Excel',
    downloadStarted: 'Se ha iniciado la descarga de la plantilla de Excel.',
    downloadFailed:
      'No se ha podido descargar la plantilla de Excel. Vuelve a intentarlo.',
    file: 'Archivo Excel de justificantes',
    empty: 'Elige un archivo .xlsx para iniciar la vista previa.',
    help: 'Utiliza la plantilla con una sola hoja y celdas de texto. Columnas obligatorias: userId, date, punchKind, source, sourceKey y sourceData (objeto JSON). punchedAt puede estar vacío o ser texto ISO UTC, como 2035-01-02T01:00:00Z. date es la fecha local de la empresa. userId es el identificador estable de usuario de un empleado real, nunca un nombre. Máximo 4 MiB y 1000 filas. No se admiten fórmulas ni fechas numéricas. Las claves de objetos JSON deben ser únicas; los números deben conservar su valor decimal al serializarse y los enteros deben ser seguros. Representa identificadores grandes o decimales exactos como cadenas.',
    parsing: 'Analizando Excel',
    preview: 'Vista previa: {{count}} filas',
    confirm:
      'He revisado estos justificantes y confirmo la importación del lote completo',
    submit: 'Confirmar importación del lote',
    submitting: 'Importando',
    success: 'Se han importado {{count}} filas de justificantes.',
    evidence: 'Expandir justificantes originales',
    denied: 'No tienes permiso para importar justificantes de asistencia.',
    failed:
      'No se ha podido importar el lote. Revisa el archivo y vuelve a intentarlo.',
    invalid:
      'El servidor ha rechazado estos justificantes. Comprueba los identificadores de empleados, las fechas de empresa y los datos de origen.',
    conflict:
      'Una clave de origen ya tiene otros justificantes. No se ha importado ninguna fila de este lote.',
    retry: 'Reintentar importación',
    discard: '¿Descartar la vista previa de justificantes sin enviar?',
    continue: 'Seguir revisando',
    discardConfirm: 'Descartar vista previa',
    discardHelp:
      'Tras descartar la vista previa, vuelve a pulsar el destino para continuar navegando.',
    columns: {
      userId: 'Identificador de usuario',
      date: 'Fecha de empresa',
      punchKind: 'Tipo de fichaje',
      punchedAt: 'Instante UTC',
      source: 'Origen',
      sourceKey: 'Clave de origen',
      sourceData: 'Justificantes originales',
    },
    errors: {
      file: 'Elige un archivo .xlsx de hasta 4 MiB.',
      archive:
        'El archivo Excel no es válido o supera los límites de extracción segura.',
      template:
        'Utiliza exactamente las cabeceras de la plantilla descargada y una sola hoja.',
      cell: 'Fila {{row}}: utiliza celdas de texto sin fórmulas y solo las siete columnas de la plantilla.',
      rows: 'Utiliza entre 1 y 1000 filas consecutivas de justificantes después de la cabecera.',
      identity:
        'Fila {{row}}: proporciona un identificador estable de usuario y un origen y clave de origen válidos.',
      date: 'Fila {{row}}: proporciona una fecha real de empresa, el tipo in/out y un instante ISO UTC explícito o un valor vacío.',
      evidence:
        'Fila {{row}}: proporciona un objeto JSON acotado con claves únicas, números que se conserven al serializar y deserializar y una clave de origen única.',
    },
  },
};
