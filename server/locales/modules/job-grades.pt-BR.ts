export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'A tabela salarial atual mudou. Recarregue-a antes de publicar.',
      IDEMPOTENCY_CONFLICT:
        'A chave de publicação já foi usada com outro conteúdo.',
      TABLE_UNAVAILABLE: 'A tabela salarial não foi inicializada.',
      GRADE_UNAVAILABLE: 'Um nível obrigatório está indisponível ou inativo.',
      INVALID_PUBLICATION: 'Os dados de publicação são inválidos.',
      STORED_DATA_INVALID:
        'Os dados armazenados da tabela salarial são inválidos.',
      INVALID_RANGE: 'Faixas salariais devem conter valores inteiros válidos.',
      DUPLICATE_GRADE: 'Cada nível deve aparecer uma vez.',
      OUTSIDE_RANGE: 'O salário oferecido está fora do intervalo publicado.',

      ACCESS_DENIED:
        'Esta operação de nível salarial está fora do seu escopo concedido.',
      NOT_FOUND: 'A revisão do nível salarial está indisponível.',
    },
    authz: {
      resource: 'Tabelas de níveis salariais',
      view: 'Visualizar histórico de publicação',
      viewSalary: 'Ler faixas salariais',
      manage: 'Publicar tabela de níveis salariais',
    },
  },
};
