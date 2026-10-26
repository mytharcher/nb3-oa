export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'La tabla salarial actual ha cambiado. Vuelve a cargarla antes de publicar.',
      IDEMPOTENCY_CONFLICT:
        'La clave de publicación ya se ha utilizado con otro contenido.',
      TABLE_UNAVAILABLE: 'La tabla salarial no está inicializada.',
      GRADE_UNAVAILABLE:
        'Un nivel requerido no está disponible o está inactivo.',
      INVALID_PUBLICATION: 'Los datos de publicación no son válidos.',
      STORED_DATA_INVALID:
        'Los datos guardados de la tabla salarial no son válidos.',
      INVALID_RANGE:
        'Los intervalos salariales deben contener importes enteros válidos.',
      DUPLICATE_GRADE: 'Cada nivel debe aparecer una sola vez.',
      OUTSIDE_RANGE: 'El salario ofrecido está fuera del intervalo publicado.',

      ACCESS_DENIED:
        'Esta operación de nivel salarial está fuera de tu ámbito autorizado.',
      NOT_FOUND: 'La revisión del nivel salarial no está disponible.',
    },
    authz: {
      resource: 'Tablas de niveles salariales',
      view: 'Ver historial de publicaciones',
      viewSalary: 'Leer intervalos salariales',
      manage: 'Publicar tabla de niveles salariales',
    },
  },
};
