import registryLocale from '../../extensions/nocobase-approval-ui/locales/pt-BR.js';
import { approvalLocalePtBR as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: 'Imprimir / Salvar PDF',
    printFailed: 'A impressão falhou. Tente novamente.',
    saving: 'Salvando…',
    noAvailableAction: 'Nenhuma ação disponível no momento',
    authz: {
      cancellation: 'Cancelamento de licença',
      section: 'Aprovações OA',
      leave: 'Solicitações de licença',
      submit: 'Enviar a própria solicitação',
      delegate: 'Enviar uma solicitação por um colaborador',
      view: 'Ler solicitações',
      delegations: 'Delegações de aprovação',
      read: 'Ler',
      update: 'Gerenciar',
    },
    permissionSets: { delegations: 'Administração de delegações de aprovação' },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'Informe o motivo desta operação.',
    CLAIM_FIRST:
      'Assuma esta tarefa de processamento antes de registrar seu resultado.',
    TASK_CLOSED:
      'Esta tarefa terminou. Atualize a solicitação e use as ações atualmente disponíveis.',
    ALREADY_ANSWERED:
      'Esta tarefa já contém sua resposta. Atualize para ver o resultado registrado.',
    NOT_YOUR_TURN:
      'Uma aprovação anterior ainda está pendente. Aguarde sua vez.',
    STALE:
      'A aprovação mudou. Carregue a solicitação mais recente antes de continuar.',
    CONTENT_CHANGED:
      'O conteúdo revisado mudou. Atualize e revise-o novamente antes de agir.',
    STALE_CONTENT:
      'O conteúdo revisado mudou. Atualize e revise-o novamente antes de agir.',
    INVALID_ANSWER:
      'Esta decisão não está disponível na etapa atual. Atualize e escolha uma ação disponível.',
    NOT_ALLOWED:
      'Esta ação não está mais disponível. Atualize e escolha uma ação atual.',
    NO_ASSIGNEE:
      'Nenhum responsável elegível atribuído. Peça a um administrador de aprovações que atribua um.',
    NO_STAGE:
      'Nenhuma etapa ativa de aprovação disponível. Atualize e peça a um administrador de aprovações que verifique a solicitação.',
    ASSIGNMENT_LOOP:
      'Esta reatribuição devolveria a tarefa a um responsável anterior. Selecione outro destinatário elegível.',
  },
  businessErrorFields: '{{message}} Verifique estes campos: {{fields}}.',
  invalidFields: 'Verifique estes campos: {{fields}}.',
  fieldSeparator: ', ',
  businessErrors: {
    LEAVE_MAX_DAYS:
      'A licença solicitada excede o máximo deste tipo. Reduza o período.',
    LEAVE_NO_WORKDAYS:
      'O período selecionado não contém meios dias úteis. Ajuste as datas.',
    LEAVE_TYPE_UNAVAILABLE:
      'Este tipo de licença está indisponível. Selecione um tipo habilitado.',
    LEAVE_DELEGATE_REQUIRED:
      'Selecione outro colaborador ativo para a solicitação delegada.',
  },

  creationUnknown:
    'O resultado do salvamento é desconhecido. Repita o mesmo salvamento ou verifique os rascunhos existentes.',
  resubmit: 'Reenviar',
  submitted: '{{name}} enviado',
  draftSavedSubmitFailed:
    'Rascunho salvo. O envio não foi concluído. Resolva o problema e tente novamente.',
  submissionUnknown:
    'O resultado do envio é desconhecido. Tente Enviar novamente com o mesmo conteúdo antes de alterar.',
  transfer: 'Transferir',
  addSigner: 'Adicionar signatário',
  urge: 'Lembrar',
  recipientSearch: 'Pesquisar destinatários elegíveis',
  moreRecipients: 'Carregar mais destinatários',
  signerMode: 'Modo de assinatura',
  signerbefore: 'Antes da minha decisão',
  signeralongside: 'Junto à minha decisão',
  emptyTodoTitle: 'Nenhuma aprovação pendente',
  emptyTodoDescription: 'Aprovações que exigem sua ação aparecerão aqui.',
  emptyDoneTitle: 'Nenhuma aprovação concluída',
  emptyDoneDescription: 'Aprovações em que você atuou aparecerão aqui.',
  emptyCopiedTitle: 'Nenhuma aprovação em cópia',
  emptyCopiedDescription: 'Solicitações copiadas para você aparecerão aqui.',
  emptyMineTitle: 'Nenhuma solicitação iniciada',
  emptyMineDescription:
    'Complete uma solicitação e envie-a ou salve um rascunho.',
  calendarTimeZone: 'As datas usam o calendário de trabalho em {{zone}}.',
  refreshAfterSuccess:
    'A ação foi concluída, mas não foi possível carregar os detalhes mais recentes. Atualize sem repetir a ação.',
  domainInvalid:
    'A solicitação não atende às condições de negócio. Revise o tipo de licença, as datas, o substituto e os detalhes da solicitação.',
  confirmSubmit:
    'O envio inicia o processo de aprovação. Confirme os detalhes da solicitação.',
  confirmWithdraw:
    'A retirada encerra a participação no processo atual de aprovação.',
  confirmReject:
    'A rejeição encerra esta solicitação e seu processo de aprovação.',
  confirmReturn:
    'A devolução permite ao solicitante revisar a solicitação. O reenvio começa na primeira etapa.',
  confirmTerminate:
    'O encerramento administrativo finaliza este processo de aprovação.',

  navigation: {
    center: 'Central de tarefas',
    delegations: 'Delegações de aprovação',
  },
  description: 'Processe tarefas de aprovação e acompanhe suas solicitações.',
  tabs: {
    todo: 'A fazer',
    done: 'Concluído',
    copied: 'Em cópia para mim',
    mine: 'Minhas solicitações',
  },
  newLeave: 'Nova solicitação de licença',
  editLeave: 'Editar solicitação de licença',
  draft: 'Rascunho',
  search: 'Pesquisar por referência ou solicitante',
  clear: 'Limpar filtros',
  all: 'Todos',
  noResults: 'Nenhum registro correspondente',
  emptyTitle: 'Nenhuma solicitação ainda',
  emptyDescription:
    'Novas tarefas de aprovação e solicitações aparecerão aqui.',
  refresh: 'Atualizar',
  loading: 'Carregando',
  reference: 'Número da solicitação',
  applicant: 'Solicitante',
  type: 'Tipo de licença',
  days: 'Dias',
  status: 'Status',
  createdAt: 'Solicitado em',
  actions: 'Ações de "{{name}}"',
  detail: 'Visualizar',
  edit: 'Editar',
  saveDraft: 'Salvar rascunho',
  save: 'Salvar',
  cancel: 'Cancelar',
  close: 'Fechar',
  submit: 'Enviar',
  withdraw: 'Retirar',
  terminate: 'Encerrar',
  read: 'Marcar como lido',
  approve: 'Aprovar',
  reject: 'Rejeitar',
  return: 'Devolver',
  comment: 'Comentário',
  appoint: 'Atribuir',
  reassign: 'Reatribuir',
  reason: 'Motivo',
  opinion: 'Comentário',
  person: 'Aprovador',
  place: 'Posição não atribuída',
  startDate: 'Data de início',
  endDate: 'Data de término',
  startHalf: 'Metade inicial do dia',
  endHalf: 'Metade final do dia',
  am: 'Manhã',
  pm: 'Tarde',
  handover: 'Substituto',
  delegate: 'Delegar aprovações durante a licença',
  attachmentMissing:
    'Alguns anexos estão indisponíveis. Recarregue a solicitação ou entre em contato com o solicitante.',
  attachments: 'Anexos',
  attachmentRequired:
    'Adicione os anexos comprobatórios exigidos pelo tipo de licença selecionado.',
  attachmentUnavailable:
    'O envio de anexos está temporariamente indisponível. Tente novamente mais tarde ou entre em contato com um administrador.',
  attachmentInvalid:
    'Alguns anexos selecionados são inválidos ou não pertencem a esta solicitação. Recarregue a solicitação e selecione-os novamente.',
  attachmentLimit:
    'Anexos: PDF, JPEG, PNG ou WebP, até 5 MB por arquivo e 10 arquivos. Um rascunho válido é salvo antes do primeiro envio.',
  attachmentSize: 'Escolha um arquivo não vazio de até 5 MB.',
  attachmentType:
    'Escolha um arquivo PDF, JPEG, PNG ou WebP cujo formato corresponda.',
  attachmentCount: 'São permitidos no máximo 10 anexos.',
  attachmentDenied:
    'Você não pode acessar os anexos desta solicitação. Recarregue a solicitação para verificar o acesso.',
  attachmentFailed:
    'O envio falhou. Verifique o formulário e a conexão e escolha o arquivo novamente.',
  attachmentUploading: 'Salvando rascunho e enviando…',
  attachmentRemove: 'Remover anexo {{number}}',
  balanceInsufficient:
    'O saldo de licença disponível é insuficiente. Reduza os dias ou entre em contato com RH.',
  balanceLimit:
    'Férias anuais e folgas compensatórias estarão disponíveis com os saldos de licença.',
  unavailable: 'Esta ação está indisponível. Revise seus impedimentos.',
  formDescription: 'Complete a solicitação e envie-a ou salve um rascunho.',
  preview: 'Prévia do fluxo de aprovação',
  facts: 'Detalhes da solicitação',
  progress: 'Progresso da aprovação',
  timeline: 'Histórico de aprovação',
  saved: 'Solicitação de licença "{{name}}" salva',
  completed: '{{action}}: "{{name}}"',
  actionTitle: '{{action}} a solicitação "{{name}}"',
  returnHint: 'Devolver ao solicitante; o reenvio começa na primeira etapa.',
  confirmDescription:
    'Isto encerra a tarefa atual de aprovação. Confirme o conteúdo revisado.',
  discard: 'Descartar alterações?',
  discardDescription: 'As alterações não salvas serão perdidas.',
  discardConfirm: 'Descartar alterações',
  readOnly: 'Este registro é somente leitura.',
  hrPreview:
    'Para solicitações feitas em nome de um colaborador, o fluxo é calculado no envio.',
  dateRange: 'O término não pode ser anterior ao início.',
  required: 'Informe um valor.',
  limit: 'Use no máximo 10.000 caracteres.',
  handoverRequired: 'Selecione um substituto para habilitar a delegação.',
  unknownPerson: 'Nome indisponível',
  yes: 'Sim',
  no: 'Não',
  error: {
    invalid: 'O conteúdo ou a ação não atende aos requisitos. Revise e ajuste.',
    overlap:
      'Uma solicitação de licença ativa ou aprovada já se sobrepõe a este período. Ajuste as datas.',
    configuration:
      'A configuração atual de prazo de aprovação não é suportada. Entre em contato com um administrador.',
    inactive:
      'Um colaborador obrigatório está indisponível. Revise o status dos colaboradores.',

    failed: 'A requisição falhou. Tente novamente.',
    forbidden: 'Acesso negado. Entre em contato com um administrador.',
    notFound: 'Este registro não existe ou foi excluído. Volte à lista.',
    conflict:
      'Esta solicitação mudou. Carregue o conteúdo mais recente antes de agir.',
    stale: 'Esta tarefa está encerrada ou a ação não está mais disponível.',
  },
  loadLatest: 'Carregar versão mais recente',
  retry: 'Tentar novamente',
  states: {
    draft: 'Rascunho',
    revision: 'Precisa de revisão',
    manager: 'Revisão do gestor',
    head: 'Revisão do chefe de departamento',
    hr: 'Revisão de RH',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    withdrawn: 'Retirado',
    terminated: 'Encerrado',
  },
  stages: {
    manager: 'Gestor direto',
    head: 'Chefe de departamento',
    hr: 'RH',
    revision: 'Revisão do solicitante',
  },
  delegations: {
    create: 'Criar',
    description:
      'Permita que um delegado processe aprovações durante um período específico.',
    new: 'Nova delegação',
    edit: 'Editar delegação',
    disable: 'Desabilitar',
    principal: 'Delegante',
    delegate: 'Delegado',
    scope: 'Escopo',
    from: 'Início',
    to: 'Fim',
    source: 'Origem',
    active: 'Ativa',
    inactive: 'Inativo',
    manual: 'Manual',
    leave: 'Licença',
    search: 'Pesquisar por delegante ou delegado',
    sourceLeave:
      'Criada a partir de licença. Gerencie-a pela solicitação relacionada.',
    invalid:
      'Selecione colaboradores ativos diferentes e um término posterior ao início.',
    overlap:
      'Uma delegação já abrange este escopo e período. Ajuste o período ou o escopo.',
    disableTitle:
      'Desabilitar a delegação de "{{principal}}" para "{{delegate}}"?',
    disableDescription:
      'O delegado não processará mais aprovações neste escopo.',
    saved: 'Delegação de "{{name}}" salva',
    empty: 'Nenhuma delegação de aprovação ainda',
    emptyDescription:
      'Crie uma delegação para permitir que alguém processe aprovações por um período.',
    timeZone: 'Os horários usam {{zone}}. O instante de término é excluído.',
  },
  typeUnavailable: 'Tipo de licença indisponível',
  noPickerPermission:
    'Selecionar pessoas exige permissão de leitura de usuários. Entre em contato com um administrador.',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: 'Meus registros',
      readableScope: 'Solicitações de aprovação legíveis',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'Todas as aprovações',
      leaveScope: 'Aprovações de licença',
      fromTime: 'Horário inicial (HH:mm)',
      toTime: 'Horário final (HH:mm)',
      timeInvalid: 'Escolha as datas e informe horários válidos de 24 horas.',
      disabled: 'Delegação de aprovação de "{{name}}" desabilitada',
      readOnly: 'Esta delegação é somente leitura.',
    },
  },
};
