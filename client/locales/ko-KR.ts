import plugins from './plugins/ko-KR.js';
import invoiceRecognitionLocale from './modules/invoice-recognition.ko-KR.js';
import electronicSignaturesLocale from './modules/electronic-signatures.ko-KR.js';
import wecomAttendanceLocale from './modules/wecom-attendance.ko-KR.js';
import hrMasterDataLocale from './modules/hr-master-data.ko-KR.js';
import globalSearchLocale from './modules/global-search.ko-KR.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.ko-KR.js';
import processOperationsLocale from './modules/process-operations.ko-KR.js';
import financeIntegrationLocale from './modules/finance-integration.ko-KR.js';
import attendanceResultsLocale from './modules/attendance-results.ko-KR.js';
import personalSchedulesLocale from './modules/personal-schedules.ko-KR.js';
import demoData from './modules/demo-data.ko-KR.js';
import processManagementLocale from './modules/process-management.ko-KR.js';
import attendanceImportEnUS from './modules/attendance-import.ko-KR.js';
import reportsExpenseEnUS from './modules/reports-expense.ko-KR.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.ko-KR.js';
import onboardingLocale from './modules/onboarding.ko-KR.js';
import sealsLocale from './modules/seals.ko-KR.js';
import recruitmentLocale from './modules/recruitment.ko-KR.js';
import announcementsLocale from './modules/announcements.ko-KR.js';
import workItemsLocale from './modules/work-items.ko-KR.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/ko-KR.js';
import taskCenterLocale from './modules/task-center.ko-KR.js';
import knowledgeLocale from './modules/knowledge.ko-KR.js';
import transferLocale from './modules/transfer.ko-KR.js';
import attendanceManagementLocale from './modules/attendance-management.ko-KR.js';
import certificatesLocale from './modules/certificates.ko-KR.js';
import accessLocale from './modules/access.ko-KR.js';
import meetingRoomsLocale from './modules/meeting-rooms.ko-KR.js';
import vehiclesLocale from './modules/vehicles.ko-KR.js';
import jobGradesLocale from './modules/job-grades.ko-KR.js';
import templatePrintLocale from './modules/template-print.ko-KR.js';
import headcountsLocale from './modules/headcounts.ko-KR.js';
import contractsLocale from './modules/contracts.ko-KR.js';
import assetRequestsLocale from './modules/asset-requests.ko-KR.js';
import vendorQualificationLocale from './modules/vendor-qualification.ko-KR.js';
import assetLocale from './modules/assets.ko-KR.js';
import departureLocale from './modules/departure.ko-KR.js';
import probationFormCopy from './modules/probation-form.ko-KR.js';
import probationActionsCopy from './modules/probation-actions.ko-KR.js';
import probationLocale from './modules/probation.ko-KR.js';
import paymentFormEnUS from './modules/payment-requests-form.ko-KR.js';
import paymentActionsEnUS from './modules/payment-actions.ko-KR.js';
import reimbursementLocale from './modules/reimbursement.ko-KR.js';
import purchasesLocale from './modules/purchases.ko-KR.js';
import travelEnUS from './modules/travel.ko-KR.js';
import travelCancellationEnUS from './modules/travel-cancellations.ko-KR.js';
import loanRequestsEnUS from './modules/loan-requests.ko-KR.js';
import paymentRequestsEnUS from './modules/payment-requests.ko-KR.js';
import vendorsEnUS from './modules/vendors.ko-KR.js';
import financeAssignmentsEnUS from './modules/finance-assignments.ko-KR.js';
import trainingEnUS from './modules/training.ko-KR.js';
import expensePlansEnUS from './modules/expense-plan.ko-KR.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.ko-KR.js';
import suppliesLocale from './modules/supplies.ko-KR.js';
import budgetsEnUS from './modules/budgets.ko-KR.js';
import reportsEnUS from './modules/reports.ko-KR.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.ko-KR.js';
import generalLocale from './modules/general.ko-KR.js';
import outingsEnUS from './modules/outings.ko-KR.js';
import attendanceChangeEnUS from './modules/attendance-change.ko-KR.js';
import cancellationsEnUS from './modules/leave-cancellations.ko-KR.js';
import workbenchEnUS from './modules/workbench.ko-KR.js';
import centerEnUS from './modules/approval-center.ko-KR.js';
import overtimeEnUS from './modules/overtime.ko-KR.js';
import leaveBalancesEnUS from './modules/leave-balances.ko-KR.js';
import admin0 from './administration/users/ko-KR.js';
import admin1 from './administration/api-keys/ko-KR.js';
import admin2 from './administration/authorization/ko-KR.js';
import admin3 from './administration/authz-default-access/ko-KR.js';
import admin4 from './administration/authz-sharing-rules/ko-KR.js';
import admin5 from './administration/authz-restriction-rules/ko-KR.js';
import admin7 from './administration/notification/ko-KR.js';
import admin8 from './administration/scheduler/ko-KR.js';
import type { AppResource } from './en-US.js';
import employeesEnUS from './modules/employees.ko-KR.js';
import importEnUS from './modules/import.ko-KR.js';
import orgEnUS from './modules/org.ko-KR.js';
import platformEnUS from './modules/platform.ko-KR.js';
import approvalsEnUS from './modules/approvals.ko-KR.js';

import system from './system/ko-KR.js';

const koKR: AppResource = {
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
  'shell.buildFreely': '서로 연결되는 업무 공간.',
  'shell.reliability': '직원, 업무, 결재를 한곳에서.',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'NocoOA 홈',
  'auth.welcome': 'OA 업무 공간에 다시 오신 것을 환영합니다',
  'auth.loginDescription':
    '사용자 이름 또는 이메일로 로그인하여 할 일을 관리하고 팀과 소통하세요.',
  'auth.about': 'OA 업무 공간 소개',
  'auth.platform': '매일 사용하는 업무 공간',
  'auth.marketingTitleFirst': '함께 일하세요.',
  'auth.marketingTitleSecond': '편하게 일하세요.',
  'auth.marketingDescription':
    '결재, 직원 서비스, 팀 정보를 모아 신청을 추적하고 중요한 업무에 집중하도록 돕습니다.',
  'auth.frontend': '가까이 있는 할 일',
  'auth.frontendDescription':
    '한 공간에서 결재 대기 건을 처리하고 내 신청을 추적하세요.',
  'auth.foundation': '연결되는 팀',
  'auth.foundationDescription':
    '직원 서비스, 공유 지식, 행정 자료를 한곳에서 찾으세요.',
  'auth.marketingFooter': '매일의 업무를 명확하게 시작하세요.',
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
    chooseFile: '파일 선택',
    singleFile: '한 번에 파일 하나를 선택하세요.',
    images: '이미지',
    files: '파일',
    preview: '{name} 미리 보기',
    download: '{name} 다운로드',
  },
  actions: {
    ...system.actions,
    close: '닫기',
    save: '저장',
    cancel: '취소',
    confirm: '확인',
    language: '언어',
    create: '생성',
    saving: '저장 중…',
    discard: '변경 사항 버리기',
    signInAgain: '다시 로그인',
  },
  'status.sessionExpired':
    '세션이 종료되었습니다. 계속하려면 다시 로그인하세요.',
  formDrawer: {
    discardTitle: '저장하지 않은 변경 사항을 버리시겠습니까?',
    discardDescription: '닫으면 저장하지 않은 변경 사항이 사라집니다.',
    continueEditing: '계속 편집',
  },
  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
    '@nocobase/app-plugin-demo-mode': {
      accounts: {
        administrator: '시스템 관리자',
        noRole: '역할 미지정',
        rolesLoading: '역할 불러오는 중…',
        rolesUnavailable: '역할을 불러올 수 없습니다',
      },
      menu: {
        description:
          '변경 사항은 저장됩니다. 계정을 전환하여 각 역할의 권한을 확인하세요.',
      },
    },
    ...plugins,
    '@nocobase/app-plugin-users': {
      ...plugins['@nocobase/app-plugin-users'],
      ...admin0,
      page: {
        ...plugins['@nocobase/app-plugin-users']['page'],
        ...admin0['page'],
      },
      accept: {
        ...plugins['@nocobase/app-plugin-users']['accept'],
        ...admin0['accept'],
        errors: {
          ...plugins['@nocobase/app-plugin-users']['accept']['errors'],
          ...admin0['accept']['errors'],
        },
      },
    },
    '@nocobase/app-plugin-api-keys': admin1,
    '@nocobase/app-plugin-authorization': {
      ...plugins['@nocobase/app-plugin-authorization'],
      ...admin2,
      permissionSets: {
        ...plugins['@nocobase/app-plugin-authorization']['permissionSets'],
        ...admin2['permissionSets'],
        builtIn: {
          ...plugins['@nocobase/app-plugin-authorization']['permissionSets'][
            'builtIn'
          ],
          ...admin2['permissionSets']['builtIn'],
        },
      },
      sections: {
        ...plugins['@nocobase/app-plugin-authorization']['sections'],
        ...admin2['sections'],
      },
      options: {
        ...plugins['@nocobase/app-plugin-authorization']['options'],
        ...admin2['options'],
        actions: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'actions'
          ],
          ...admin2['options']['actions'],
        },
        settingsModules: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'settingsModules'
          ],
          ...admin2['options']['settingsModules'],
        },
        pages: {
          ...plugins['@nocobase/app-plugin-authorization']['options']['pages'],
          ...admin2['options']['pages'],
        },
        settings: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'settings'
          ],
          ...admin2['options']['settings'],
        },
        subjectTypes: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'subjectTypes'
          ],
          ...admin2['options']['subjectTypes'],
        },
        recordAccessPolicies: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'recordAccessPolicies'
          ],
          ...admin2['options']['recordAccessPolicies'],
        },
      },
    },
    '@nocobase/app-plugin-authz-default-access': {
      ...plugins['@nocobase/app-plugin-authz-default-access'],
      ...admin3,
    },
    '@nocobase/app-plugin-authz-sharing-rules': {
      ...plugins['@nocobase/app-plugin-authz-sharing-rules'],
      ...admin4,
    },
    '@nocobase/app-plugin-authz-restriction-rules': {
      ...plugins['@nocobase/app-plugin-authz-restriction-rules'],
      ...admin5,
    },
    '@nocobase/app-plugin-notification': {
      ...plugins['@nocobase/app-plugin-notification'],
      ...admin7,
      logs: {
        ...plugins['@nocobase/app-plugin-notification']['logs'],
        ...admin7['logs'],
        columns: {
          ...plugins['@nocobase/app-plugin-notification']['logs']['columns'],
          ...admin7['logs']['columns'],
        },
      },
      status: {
        ...plugins['@nocobase/app-plugin-notification']['status'],
        ...admin7['status'],
      },
      errors: {
        ...plugins['@nocobase/app-plugin-notification']['errors'],
        ...admin7['errors'],
      },
    },
    '@nocobase/app-plugin-scheduler': {
      ...plugins['@nocobase/app-plugin-scheduler'],
      ...admin8,
      authorization: {
        ...plugins['@nocobase/app-plugin-scheduler']['authorization'],
        ...admin8['authorization'],
      },
      nav: {
        ...plugins['@nocobase/app-plugin-scheduler']['nav'],
        ...admin8['nav'],
      },
    },
  },
  oa: {
    navigation: {
      backToApplication: '애플리케이션으로 돌아가기',
      systemLabel: '시스템 관리 탐색',
      systemPeople: '사용자 및 조직',
      systemAccess: '역할 및 권한',
      systemConnections: '알림 및 연동',
      systemOperations: '운영',
      office: '일상 업무',
      finance: '재무 및 경비',
      procurement: '구매 및 계약',
      administration: '행정 및 자산',

      personal: '개인',
      organization: '조직',
      hr: '인사',
      configuration: '업무 설정',
      system: '시스템 관리',
      inbox: '메시지',
      automation: '자동화',
      agents: '에이전트',
      runtimes: '에이전트 런타임',
      skills: '에이전트 스킬',
      models: '모델 서비스',
      agentUsage: '에이전트 사용량',
      users: '사용자 계정',
      permissionSets: '권한 집합',
      defaultAccess: '기본 접근',
      sharingRules: '공유 규칙',
      restrictionRules: '제한 규칙',
      inspector: '권한 검사',
      apiKeys: 'API 키',
      notificationLogs: '알림 로그',
      schedules: '예약 작업',
      access: '접근 제어',
    },
  },
  userPicker: {
    placeholder: '이름, 사용자 이름 또는 이메일 검색',
    multiplePlaceholder: '사용자 추가',
    empty: '일치하는 사용자 없음',
    searching: '검색 중…',
    forbidden: '사용자를 조회할 권한이 없습니다.',
    loadFailed: '사용자를 불러올 수 없습니다.',
    remove: '{{name}} 제거',
  },
  tableScroll: {
    region: '테이블 가로 스크롤 영역',
    hint: '스크롤하여 모든 열 보기',
    left: '테이블 왼쪽으로 스크롤',
    right: '테이블 오른쪽으로 스크롤',
  },
  datePicker: {
    placeholder: '날짜 선택',
    rangePlaceholder: '날짜 범위 선택',
  },
};
export default koKR;
