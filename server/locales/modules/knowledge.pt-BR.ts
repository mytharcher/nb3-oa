export default {
  knowledge: {
    notifications: {
      title: 'Documento de política atualizado',
      body: 'Um documento de política vinculado possui uma nova versão. Abra-o para ler a versão atual.',
    },
    authz: {
      knowledgeDocuments: 'Documentos de conhecimento',
      knowledgeFolders: 'Pastas de conhecimento',
      knowledgeVersions: 'Versões de documentos',
      view: 'Visualizar',
      manage: 'Gerenciar',
    },
    errors: {
      ACCESS_DENIED: 'Você não pode acessar este documento ou operação.',
      DOCUMENT_NOT_FOUND: 'O documento não existe ou está inacessível.',
      FOLDER_NOT_FOUND: 'A pasta não existe ou está inacessível.',
      INVALID_INPUT: 'Dados de documento inválidos.',
      INVALID_CONTENT: 'Conteúdo de documento inválido.',
      INVALID_AUDIENCE:
        'O público contém um departamento ou papel indisponível.',
      INVALID_FILE: 'O arquivo é inválido ou está indisponível.',
      VERSION_CONFLICT:
        'O documento foi atualizado. Atualize e tente novamente.',
      COMMAND_CONFLICT:
        'A chave de requisição já foi usada para outro conteúdo.',
      FOLDER_CYCLE: 'Uma pasta não pode ser movida para baixo de si mesma.',
      TREE_UNINITIALIZED: 'O diretório de documentos não foi inicializado.',
      BODY_TOO_LARGE: 'O arquivo enviado excede o tamanho permitido.',
    },
  },
};
