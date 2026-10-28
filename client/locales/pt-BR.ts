import invoiceRecognitionLocale from './modules/invoice-recognition.pt-BR.js';
import electronicSignaturesLocale from './modules/electronic-signatures.pt-BR.js';
import wecomAttendanceLocale from './modules/wecom-attendance.pt-BR.js';
import hrMasterDataLocale from './modules/hr-master-data.pt-BR.js';
import globalSearchLocale from './modules/global-search.pt-BR.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.pt-BR.js';
import processOperationsLocale from './modules/process-operations.pt-BR.js';
import financeIntegrationLocale from './modules/finance-integration.pt-BR.js';
import attendanceResultsLocale from './modules/attendance-results.pt-BR.js';
import personalSchedulesLocale from './modules/personal-schedules.pt-BR.js';
import demoData from './modules/demo-data.pt-BR.js';
import processManagementLocale from './modules/process-management.pt-BR.js';
import attendanceImportEnUS from './modules/attendance-import.pt-BR.js';
import reportsExpenseEnUS from './modules/reports-expense.pt-BR.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.pt-BR.js';
import onboardingLocale from './modules/onboarding.pt-BR.js';
import sealsLocale from './modules/seals.pt-BR.js';
import recruitmentLocale from './modules/recruitment.pt-BR.js';
import announcementsLocale from './modules/announcements.pt-BR.js';
import workItemsLocale from './modules/work-items.pt-BR.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/pt-BR.js';
import taskCenterLocale from './modules/task-center.pt-BR.js';
import knowledgeLocale from './modules/knowledge.pt-BR.js';
import transferLocale from './modules/transfer.pt-BR.js';
import attendanceManagementLocale from './modules/attendance-management.pt-BR.js';
import certificatesLocale from './modules/certificates.pt-BR.js';
import accessLocale from './modules/access.pt-BR.js';
import meetingRoomsLocale from './modules/meeting-rooms.pt-BR.js';
import vehiclesLocale from './modules/vehicles.pt-BR.js';
import jobGradesLocale from './modules/job-grades.pt-BR.js';
import templatePrintLocale from './modules/template-print.pt-BR.js';
import headcountsLocale from './modules/headcounts.pt-BR.js';
import contractsLocale from './modules/contracts.pt-BR.js';
import assetRequestsLocale from './modules/asset-requests.pt-BR.js';
import vendorQualificationLocale from './modules/vendor-qualification.pt-BR.js';
import assetLocale from './modules/assets.pt-BR.js';
import departureLocale from './modules/departure.pt-BR.js';
import probationFormCopy from './modules/probation-form.pt-BR.js';
import probationActionsCopy from './modules/probation-actions.pt-BR.js';
import probationLocale from './modules/probation.pt-BR.js';
import paymentFormEnUS from './modules/payment-requests-form.pt-BR.js';
import paymentActionsEnUS from './modules/payment-actions.pt-BR.js';
import reimbursementLocale from './modules/reimbursement.pt-BR.js';
import purchasesLocale from './modules/purchases.pt-BR.js';
import travelEnUS from './modules/travel.pt-BR.js';
import travelCancellationEnUS from './modules/travel-cancellations.pt-BR.js';
import loanRequestsEnUS from './modules/loan-requests.pt-BR.js';
import paymentRequestsEnUS from './modules/payment-requests.pt-BR.js';
import vendorsEnUS from './modules/vendors.pt-BR.js';
import financeAssignmentsEnUS from './modules/finance-assignments.pt-BR.js';
import trainingEnUS from './modules/training.pt-BR.js';
import expensePlansEnUS from './modules/expense-plan.pt-BR.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.pt-BR.js';
import suppliesLocale from './modules/supplies.pt-BR.js';
import budgetsEnUS from './modules/budgets.pt-BR.js';
import reportsEnUS from './modules/reports.pt-BR.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.pt-BR.js';
import generalLocale from './modules/general.pt-BR.js';
import outingsEnUS from './modules/outings.pt-BR.js';
import attendanceChangeEnUS from './modules/attendance-change.pt-BR.js';
import cancellationsEnUS from './modules/leave-cancellations.pt-BR.js';
import workbenchEnUS from './modules/workbench.pt-BR.js';
import centerEnUS from './modules/approval-center.pt-BR.js';
import overtimeEnUS from './modules/overtime.pt-BR.js';
import leaveBalancesEnUS from './modules/leave-balances.pt-BR.js';
import admin0 from './administration/users/pt-BR.js';
import admin1 from './administration/api-keys/pt-BR.js';
import admin2 from './administration/authorization/pt-BR.js';
import admin3 from './administration/authz-default-access/pt-BR.js';
import admin4 from './administration/authz-sharing-rules/pt-BR.js';
import admin5 from './administration/authz-restriction-rules/pt-BR.js';
import admin7 from './administration/notification/pt-BR.js';
import admin8 from './administration/scheduler/pt-BR.js';
import type { AppResource } from './en-US.js';
import employeesEnUS from './modules/employees.pt-BR.js';
import importEnUS from './modules/import.pt-BR.js';
import orgEnUS from './modules/org.pt-BR.js';
import platformEnUS from './modules/platform.pt-BR.js';
import approvalsEnUS from './modules/approvals.pt-BR.js';

import system from './system/pt-BR.js';

const ptBR: AppResource = {
  demoData,
  ...processManagementLocale,
  ...attendanceImportEnUS,
  ...reportsExpenseEnUS,
  reportsEfficiency: reportsEfficiencyEnUS,
  ...sealsLocale,
  ...recruitmentLocale,
  ...onboardingLocale,
  ...announcementsLocale,
  transfer: transferLocale,
  ...attendanceManagementLocale,
  ...attendanceResultsLocale,
  ...wecomAttendanceLocale,
  ...certificatesLocale,
  ...knowledgeLocale,
  ...workItemsLocale,
  ...taskCenterUiLocale,
  ...taskCenterLocale,
  ...globalSearchLocale,
  ...enterpriseIdentityLocale,
  ...processOperationsLocale,
  ...financeIntegrationLocale,
  ...invoiceRecognitionLocale,
  ...electronicSignaturesLocale,
  ...hrMasterDataLocale,
  ...personalSchedulesLocale,
  ...accessLocale,
  ...meetingRoomsLocale,
  ...vehiclesLocale,
  ...templatePrintLocale,
  ...jobGradesLocale,
  ...headcountsLocale,
  ...contractsLocale,
  assetRequests: assetRequestsLocale,
  ...vendorQualificationLocale,
  assets: assetLocale,
  ...system,
  'shell.buildFreely': 'Seu ambiente de trabalho conectado.',
  'shell.reliability': 'Pessoas, trabalho e aprovações em um só lugar.',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'Página inicial do NocoOA',
  'auth.welcome': 'Bem-vindo de volta ao seu ambiente OA',
  'auth.loginDescription':
    'Entre com seu nome de usuário ou e-mail para gerenciar tarefas e manter contato com a equipe.',
  'auth.about': 'Sobre o ambiente OA',
  'auth.platform': 'Seu ambiente de trabalho diário',
  'auth.marketingTitleFirst': 'Trabalhe em equipe.',
  'auth.marketingTitleSecond': 'Trabalhe com facilidade.',
  'auth.marketingDescription':
    'Reúna aprovações, serviços aos colaboradores e informações da equipe para acompanhar solicitações e se concentrar no trabalho que importa.',
  'auth.frontend': 'Tarefas ao seu alcance',
  'auth.frontendDescription':
    'Processe aprovações pendentes e acompanhe suas solicitações em um só ambiente.',
  'auth.foundation': 'Equipes conectadas',
  'auth.foundationDescription':
    'Encontre serviços aos colaboradores, conhecimento compartilhado e recursos administrativos em um só lugar.',
  'auth.marketingFooter': 'Um início claro para cada dia de trabalho.',
  departureRequests: departureLocale,
  probationRequests: {
    ...probationLocale.probationRequests,
    ...probationFormCopy,
    ...probationActionsCopy,
  },
  ...reimbursementLocale,
  ...purchasesLocale,
  ...financeAssignmentsEnUS,
  ...vendorsEnUS,
  ...loanRequestsEnUS,
  ...paymentRequestsEnUS,
  ...paymentFormEnUS,
  paymentRequests: {
    ...paymentRequestsEnUS.paymentRequests,
    ...paymentActionsEnUS,
  },
  ...trainingEnUS,
  ...travelEnUS,
  ...travelCancellationEnUS,
  ...expensePlansEnUS,
  ...expenseAuthorizationsEnUS,
  ...budgetsEnUS,
  ...reportsEnUS,
  ...budgetAdjustmentsEnUS,
  ...outingsEnUS,
  ...attendanceChangeEnUS,
  ...cancellationsEnUS,
  ...centerEnUS,
  ...workbenchEnUS,
  ...generalLocale,
  ...suppliesLocale,
  ...overtimeEnUS,
  navigation: { ...system.navigation, home: workbenchEnUS.workbench.title },
  ...leaveBalancesEnUS,
  attachmentList: {
    chooseFile: 'Selecionar arquivo',
    singleFile: 'Selecione um arquivo por vez.',
    images: 'Imagens',
    files: 'Arquivos',
    preview: 'Visualizar {name}',
    download: 'Baixar {name}',
  },
  actions: {
    ...system.actions,
    close: 'Fechar',
    save: 'Salvar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    language: 'Idioma',
    create: 'Criar',
    saving: 'Salvando…',
    discard: 'Descartar alterações',
    signInAgain: 'Entrar novamente',
  },
  'status.sessionExpired':
    'Sua sessão terminou. Entre novamente para continuar.',
  formDrawer: {
    discardTitle: 'Descartar alterações não salvas?',
    discardDescription: 'Fechar descartará suas alterações não salvas.',
    continueEditing: 'Continuar editando',
  },
  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
    '@nocobase/app-plugin-demo-mode': {
      accounts: {
        administrator: 'Administrador do sistema',
        noRole: 'Sem rótulo de função',
        rolesLoading: 'Carregando funções…',
        rolesUnavailable: 'Funções indisponíveis',
      },
      menu: {
        description:
          'As alterações são salvas. Troque de conta para testar as permissões de cada função.',
      },
    },
    '@nocobase/app-plugin-users': admin0,
    '@nocobase/app-plugin-api-keys': admin1,
    '@nocobase/app-plugin-authorization': admin2,
    '@nocobase/app-plugin-authz-default-access': admin3,
    '@nocobase/app-plugin-authz-sharing-rules': admin4,
    '@nocobase/app-plugin-authz-restriction-rules': admin5,
    '@nocobase/app-plugin-notification': admin7,
    '@nocobase/app-plugin-scheduler': admin8,
  },
  oa: {
    navigation: {
      backToApplication: 'Voltar ao aplicativo',
      systemLabel: 'Navegação da administração do sistema',
      systemPeople: 'Usuários e organização',
      systemAccess: 'Papéis e permissões',
      systemConnections: 'Notificações e integrações',
      systemOperations: 'Operações',
      foundation: 'Base do aplicativo',
      office: 'Rotina de escritório',
      finance: 'Finanças e despesas',
      procurement: 'Compras e contratos',
      administration: 'Administração e patrimônio',

      personal: 'Pessoal',
      organization: 'Organização',
      hr: 'Recursos humanos',
      configuration: 'Configurações de negócio',
      system: 'Administração do sistema',
      inbox: 'Mensagens',
      automation: 'Automação',
      agents: 'Agentes',
      runtimes: 'Ambientes de execução de agentes',
      skills: 'Habilidades de agentes',
      models: 'Serviços de modelos',
      agentUsage: 'Uso de agentes',
      users: 'Contas de usuários',
      permissionSets: 'Conjuntos de permissões',
      defaultAccess: 'Acesso padrão',
      sharingRules: 'Regras de compartilhamento',
      restrictionRules: 'Regras de restrição',
      inspector: 'Inspetor de permissões',
      apiKeys: 'Chaves de API',
      notificationLogs: 'Registros de notificações',
      schedules: 'Tarefas agendadas',
      access: 'Controle de acesso',
    },
  },
  userPicker: {
    placeholder: 'Pesquisar por nome, usuário ou e-mail',
    multiplePlaceholder: 'Adicionar pessoas',
    empty: 'Nenhum usuário correspondente',
    searching: 'Pesquisando…',
    forbidden: 'Você não tem permissão para consultar usuários.',
    loadFailed: 'Não foi possível carregar usuários.',
    remove: 'Remover {{name}}',
  },
  tableScroll: {
    region: 'Área de rolagem horizontal da tabela',
    hint: 'Role para ver todas as colunas',
    left: 'Rolar tabela para a esquerda',
    right: 'Rolar tabela para a direita',
  },
  datePicker: {
    placeholder: 'Escolher uma data',
    rangePlaceholder: 'Escolher um intervalo de datas',
  },
};
export default ptBR;
