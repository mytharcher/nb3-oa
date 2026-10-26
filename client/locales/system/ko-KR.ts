import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/ko-KR';
import inboxEnUS from '#extensions/nocobase-inbox/locales/ko-KR';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': '메시지',
  'inbox.loadFailed': '메시지를 불러올 수 없음',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': '메시지',
  'inboxButton.pending': '메시지, 대기 {{count}}개',
  'inboxButton.unread': '메시지, 읽지 않은 {{count}}개',
  'inboxButton.pendingHint':
    '내 대기 항목 {{count}}개입니다. 처리하면 줄어듭니다.',
  'inboxButton.unreadHint':
    '읽지 않은 항목 {{count}}개입니다. 읽으면 줄어듭니다.',
  'auth.welcome': '다시 오신 것을 환영합니다',
  'auth.loginDescription': '사용자 이름 또는 이메일과 비밀번호로 로그인하세요.',
  'auth.registerTitle': '계정 생성',
  'auth.registerDescription': '계정을 생성하여 시작하세요.',
  'auth.forgotTitle': '비밀번호 찾기',
  'auth.forgotDescription':
    '이메일을 입력하세요. 계정이 있으면 재설정 링크를 보냅니다.',
  'auth.resetDescription': '새 계정 비밀번호를 선택하세요.',
  'auth.resetTitle': '비밀번호 재설정',
  'auth.identifier': '사용자 이름 또는 이메일',
  'auth.password': '비밀번호',
  'auth.signIn': '로그인',
  'auth.signingIn': '로그인 중…',
  'auth.hidePassword': '비밀번호 숨기기',
  'auth.showPassword': '비밀번호 표시',
  'auth.forgotLink': '비밀번호를 잊으셨나요?',
  'auth.noAccount': '계정이 없으신가요?',
  'auth.signUp': '가입',
  'auth.createAccount': '계정 생성',
  'auth.creatingAccount': '계정 생성 중…',
  'auth.name': '이름',
  'auth.username': '사용자 이름',
  'auth.email': '이메일',
  'auth.confirmPassword': '비밀번호 확인',
  'auth.existingAccount': '이미 계정이 있으신가요?',
  'auth.passwordMismatch': '비밀번호가 일치하지 않습니다.',
  'auth.resetting': '재설정 중…',
  'auth.newPassword': '새 비밀번호',
  'auth.confirmNewPassword': '새 비밀번호 확인',
  'auth.invalidResetLink':
    '비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.',
  'auth.backToSignIn': '로그인으로 돌아가기',
  'auth.sendResetLink': '재설정 링크 전송',
  'auth.sending': '전송 중…',
  'auth.resetSent': '계정이 있으면 재설정 링크를 보냈습니다.',
  'auth.rememberPassword': '비밀번호가 기억나셨나요?',
  'auth.methods': '로그인 방식',
  'auth.or': '또는 다음으로 계속',
  'auth.continueWith': '{provider}로 계속',
  'auth.about': '애플리케이션 소개',
  'auth.platform': 'AI 네이티브 애플리케이션 플랫폼',
  'auth.marketingTitleFirst': 'AI가 자유롭게 만들도록.',
  'auth.marketingTitleSecond': 'NocoBase가 지키는',
  'auth.marketingTitleThird': '신뢰성.',
  'auth.marketingDescription':
    'AI에는 각 경험을 구성할 유연한 프런트엔드 프레임워크를, 기반 데이터와 권한 및 거버넌스 보호는 NocoBase에 맡기세요.',
  'auth.frontend': 'AI 네이티브 프런트엔드',
  'auth.frontendDescription':
    '유연한 프레임워크에서 인터페이스를 자유롭게 구성합니다.',
  'auth.foundation': 'NocoBase 기반',
  'auth.foundationDescription': '신뢰할 수 있는 데이터, 접근 제어 및 거버넌스.',
  'auth.marketingFooter': '위에는 자유를. 기반에는 확신을.',
  'status.loading': '로딩 중',
  'status.loadingPage': '페이지 불러오는 중',
  'status.denied': '접근 거부',
  'status.pageFailed': '페이지를 불러올 수 없음',
  'status.retry': '다시 시도',
  'navigation.brandHome': 'NocoBase 홈',
  'navigation.brandApps': 'NocoBase 애플리케이션',
  'routeOverlay.close': '닫기',
  'status.backHome': '워크벤치로 돌아가기',
  'status.deniedDescription': '페이지 접근 권한이 없습니다.',
  'status.routeFailedDescription':
    '페이지를 불러오지 못했습니다. 다시 시도하세요.',
  shell: {
    buildFreely: 'AI가 자유롭게 만듭니다.',
    reliability: '<brand>NocoBase</brand>가 신뢰성을 지킵니다.',
  },
  home: {
    platform: 'NocoBase · AI 네이티브 애플리케이션 플랫폼',
    title: '설명하면 에이전트가 만듭니다',
    description:
      '이 애플리케이션은 코딩 에이전트와 대화하여 개발합니다. 업무 요구를 쉬운 말로 설명하면 이 프로젝트의 페이지, 데이터 모델, API 및 업무 절차를 작성합니다.',
    steps: {
      describe: {
        title: '요구 설명',
        description:
          '누가 사용하고, 어떤 데이터를 보관하며, 어떤 일이 일어나야 하는지 말하세요.',
      },
      build: {
        title: '에이전트가 구축',
        description: '프로젝트와 내장 기능을 읽고 코드를 작성합니다.',
      },
      review: {
        title: '확인 및 개선',
        description:
          '페이지를 새로고침하여 사용해 보고 같은 방식으로 변경을 요청하세요.',
      },
    },
    example: {
      title: '다음과 같이 요청해 보세요',
      text: '구매 주문 애플리케이션을 만드세요.\n\n주문에는 번호, 물품, 신청자, 금액 및 결재 상태가 있습니다. 신청자는 주문을 만들고 자기 주문만 봅니다. 검토자는 모든 대기 주문을 보고 승인하거나 거절합니다.\n결정 후 수신함으로 신청자에게 주문 링크와 함께 알리세요.',
      hint: '이 프로젝트에서 연 Claude Code, Codex, Cursor 또는 코딩 에이전트에 붙여 넣으세요.',
    },
    capabilitiesTitle: '내장 기능',
    capabilitiesDescription:
      '에이전트는 처음부터 만들지 않고 내장 기능을 직접 사용합니다. 열어서 수정 및 복사할 프롬프트를 확인하세요.',
    viewPrompts: '프롬프트 보기({{count}})',
    prompt: {
      label: '프롬프트',
      hint: '복사 전에 업무에 맞게 프롬프트를 편집하세요. 대화 상자를 닫으면 변경은 저장되지 않습니다.',
      copy: '참조',
      copiedShort: '복사됨',
      copied: '프롬프트 복사됨',
      copyFailed: '복사할 수 없습니다. 텍스트를 직접 선택하여 복사하세요.',
      reset: '기본값 복원',
    },
    capabilities: {
      auth: {
        title: '인증',
        description: '로그인, 가입, 비밀번호 재설정 및 회사 통합 로그인.',
        prompts: {
          disableSignUp: {
            label: '가입 닫기',
            text: '회사 직원 전용 애플리케이션입니다. 모든 계정은 관리자가 생성합니다.\n자체 가입을 비활성화하고 로그인 페이지의 가입 링크를 제거하세요.\n기존 직원은 계정과 비밀번호로 계속 로그인할 수 있어야 합니다.\n비밀번호 찾기 링크는 유지하세요.',
          },
          passwordRules: {
            label: '비밀번호 규칙',
            text: '가입 또는 비밀번호 재설정 시 12자 이상을 요구하세요.\n두 양식에 요구 사항을 표시하고 일관된 검증 메시지를 사용하세요.\n기존 계정은 즉시 비밀번호를 바꾸지 않고도 로그인할 수 있게 하세요.',
          },
          companySso: {
            label: '회사 SSO',
            text: 'OIDC로 회사 신원 플랫폼을 사용하여 직원이 로그인하도록 하세요.\n\n계정 및 비밀번호 로그인을 유지하고 회사 계정 버튼을 추가하세요.\n버튼은 회사 신원 플랫폼을 엽니다. 로그인 성공 후 애플리케이션 홈으로 돌아옵니다.\n\n최초 로그인 시 플랫폼의 고정 사용자 식별자로 애플리케이션 계정을 생성할 수 있게 하세요.\n이름 또는 이메일 일치로 계정을 자동 연결하지 마세요. 새 계정은 애플리케이션 기본 권한을 사용합니다.\n\n신원 플랫폼 관리자가 제공할 정보와 등록할 콜백 URL을 나열하세요.',
          },
        },
      },
      authorization: {
        title: '권한',
        description:
          '누가 어떤 페이지를 열고 어떤 작업을 수행하며 어떤 레코드를 볼지 제어합니다.',
        prompts: {
          jobs: {
            label: '직무',
            text: '애플리케이션에 구매 신청자 및 주문 검토자 직무를 생성하세요.\n구매 신청자는 주문 페이지를 열고 본인이 신청한 주문을 봅니다.\n주문 검토자는 주문 페이지를 열고 주문을 보고 대기 주문을 승인하거나 거절합니다.\n애플리케이션 관리자만 권한과 할당을 변경할 수 있습니다.\n기존 권한 기능을 사용하여 관리자가 이후 권한 조정 및 사용자 할당을 할 수 있게 하세요.',
          },
          dataScopes: {
            label: '데이터 범위',
            text: '주문의 신청자 필드로 소유권을 결정하여 구매 신청자는 자기 주문만 보도록 하세요.\n주문 검토자는 모든 주문을 보고 대기 결재를 처리할 수 있습니다.\n관리자는 권한 집합에서 직무별 주문 보기 범위를 조정할 수 있습니다.',
          },
          sharing: {
            label: '공유',
            text: 'Bob의 주문 PO-2026-004를 Alice에게 공유하여 검토할 수 있게 하세요.\nAlice에게는 이미 주문 보기 권한이 있으므로 이 주문의 보기 접근을 추가하세요.\n기존 담당 업무는 유지합니다. 결재는 계속 주문 검토자가 처리합니다.\n관리자가 이 공유 규칙을 관리하도록 하세요.',
          },
        },
      },
      scheduler: {
        title: '예약 작업',
        description:
          '지정 시각에 업무를 실행하고 다음 실행 및 결과를 확인합니다.',
        prompts: {
          reminder: {
            label: '일일 알림',
            text: '기존 주문 애플리케이션에 대기 주문 알림을 추가하세요.\n\n평일마다 베이징 시간 09:00에 결재 대기 주문을 찾아 검토자별로 묶고 각 검토자에게 앱 내 알림 하나를 보내세요.\n대기 주문 수와 대기 주문 목록 링크를 포함하세요. 대기 주문이 없으면 보내지 마세요.\n관리자는 일정과 실행 기록을 보고 알림을 일시 중지하거나 재개할 수 있습니다.',
          },
          weeklyReport: {
            label: '주간 보고서',
            text: '매주 월요일 베이징 시간 08:00에 지난주 영업 요약을 생성하고 영업 관리자에게 알리세요.\n매출, 주문 수 및 지역 합계를 포함하세요. 관리자는 작업과 실행 기록을 볼 수 있습니다.',
          },
        },
      },
      notification: {
        title: '알림',
        description:
          '이벤트 발생 시 앱 내 메시지, 이메일 또는 그룹 봇 메시지를 보냅니다.',
        prompts: {
          inApp: {
            label: '앱 내 메시지',
            text: '현재 애플리케이션에 주문 결재를 추가하고 결과를 앱 내 메시지로 신청자에게 알리세요.\n\n주문에는 번호, 이름, 신청자, 금액 및 결재 상태가 있습니다.\n신청자는 자기 주문을 봅니다. 검토자는 대기 주문을 보고 승인하거나 거절합니다. 기존 주문 및 결재 기능이 있으면 재사용하세요.\n\n승인 또는 거절 후 해당 주문 신청자에게만 앱 내 메시지 하나를 보내세요.\n제목은 승인 또는 거절 여부를 나타내고 본문에는 주문 번호, 이름 및 결재 결과를 포함하세요.\n메시지를 클릭하면 해당 주문 세부 정보가 열립니다.\n결재 대기 중에는 보내지 마세요. 동일 결재 결과에는 한 번만 알리세요.\n알림 실패는 저장된 결재 결과에 영향을 주지 않습니다.',
          },
          email: {
            label: '이메일',
            text: '설정된 이메일 채널로 기존 주문 결재 알림에 이메일을 추가하세요.\n\n승인 또는 거절 후 신청자 계정 이메일에 결과를 보내세요.\n제목에는 주문 번호, 본문에는 주문 이름과 결과를 포함하세요.\n기존 앱 내 메시지는 유지합니다. 신청자에게 이메일이 없으면 앱 내 메시지만 보내세요.\n이메일 실패는 결재 결과나 앱 내 메시지에 영향을 주지 않아야 합니다.',
          },
        },
      },
      mail: {
        title: '우편',
        description:
          '개인 메일함을 연결하여 업무 이메일을 읽고 답장하고 보냅니다.',
        prompts: {
          mailCenter: {
            label: '메일 센터',
            text: '애플리케이션에 메일 센터와 메일 계정 관리 항목을 추가하세요. 사용자는 자기 메일함을 연결하고 선택하여 수신 메시지를 동기화하고 메시지와 첨부를 읽고 답장할 수 있습니다.\n\n영업 담당자가 견적 요청을 받으면 메일 센터에서 답장할 수 있습니다. 원래 제목과 대화 맥락을 유지하고 원래 발신자에게 답장하세요. 각 사용자는 본인이 연결한 메일함을 사용합니다.',
          },
          correspondence: {
            label: '고객 이메일',
            text: '고객 세부 정보에 서신 섹션을 추가하세요. 발신자 또는 수신자가 현재 고객의 연락 이메일과 일치하는 메시지를 표시하세요. 영업 담당자는 자기 연결 메일함으로 메시지와 첨부를 보고 답장할 수 있습니다.',
          },
        },
      },
      file: {
        title: '파일',
        description:
          '파일을 업로드하고 레코드에 첨부하여 미리 보거나 다운로드합니다.',
        prompts: {
          attachments: {
            label: '첨부 파일',
            text: '기존 주문 관리 애플리케이션에 구매 첨부 파일을 추가하세요.\n\n주문 세부 정보에 첨부 영역을 추가하세요. 각 주문에 PDF, 이미지 및 DOCX를 포함한 여러 파일을 첨부할 수 있습니다.\n파일 이름과 크기 및 미리 보기, 다운로드, 제거 작업을 표시하세요.\n업로드 후 현재 주문에 첨부를 저장하고 다시 열어도 사용할 수 있게 하세요.\n주문 접근 권한이 있는 사용자는 첨부를 보고 다운로드할 수 있습니다. 신청자와 검토자는 첨부를 추가하거나 제거할 수 있습니다.\n첨부 제거는 현재 주문의 연결만 해제하며 파일은 유지합니다.',
          },
          avatar: {
            label: '아바타',
            text: '직원당 이미지 하나의 아바타를 추가하세요.\n아바타 업로드와 교체를 지원하고 직원 목록 및 세부 정보에 표시하세요.\n교체 후 새 아바타를 사용하며 페이지 새로고침 후에도 유지하세요.',
          },
        },
      },
      templatePrint: {
        title: '템플릿 인쇄',
        description:
          'Word 또는 Excel 템플릿에 업무 데이터를 채워 파일을 생성합니다.',
        prompts: {
          approvalForm: {
            label: '결재서',
            text: '주문 세부 정보에 “결재서 생성” 작업을 추가하세요.\n\n제공한 Word 템플릿에 현재 주문의 번호, 구매 신청, 신청자, 금액, 결재 결과 및 처리 시간을 채우세요.\n템플릿 제목, 표 구조 및 서명 영역을 유지하세요. 출력 이름은 “구매-결재-주문번호”로 하고 Word 다운로드를 제공하세요.\n주문 접근 권한이 있는 누구나 결재서를 생성할 수 있습니다. 파일 생성 시 현재 주문 데이터를 사용하세요.',
          },
          pdf: {
            label: 'PDF 출력',
            text: '구매 결재서에 PDF 다운로드를 추가하고 Word 템플릿 글꼴, 표 및 서명 영역을 유지하세요.',
          },
        },
      },
      i18n: {
        title: '언어',
        description: '인터페이스 언어 전환, 언어 추가 및 기본 언어 설정.',
        prompts: {
          addLanguage: {
            label: '언어 추가',
            text: '애플리케이션에 스페인어를 추가하세요. 인터페이스와 서버 메시지를 번역하고 언어 메뉴에 스페인어를 추가하세요.',
          },
          defaultLanguage: {
            label: '기본 언어',
            text: '언어를 선택하지 않은 사용자의 기본 언어를 중국어 간체로 설정하세요. 언어 메뉴의 영어는 유지하세요.',
          },
        },
      },
      theme: {
        title: '테마',
        description:
          '색상, 글꼴 및 밀도를 조정하고 밝은 모드와 어두운 모드를 전환합니다.',
        prompts: {
          changeTheme: {
            label: '테마 변경',
            text: '간결 테마를 업데이트하세요. 기본색을 파랑으로 하고 모서리를 조금 더 둥글게 하세요. 현재 글꼴, 텍스트 크기 및 간결한 간격을 유지하세요.',
          },
          newTheme: {
            label: '새 테마',
            text: '초록 기본색, 부드러운 배경, 적당히 둥근 모서리와 은은한 그림자의 숲 테마를 생성하세요.',
          },
        },
      },
    },
  },

  appearance: {
    title: '모양',
    mode: '색상 모드',
    preset: '테마',
    light: '밝게',
    dark: '어둡게',
    system: '시스템',
    themes: { default: '여유롭게', compact: '간결하게' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: '닫기',
    save: '저장',
    cancel: '취소',
    confirm: '확인',
    language: '언어',
  },
  notices: {
    serverLocaleFallback:
      '서버가 이 언어를 지원하지 않아 서버 메시지에는 영어를 사용합니다.',
    languageChangeFailed: '언어 변경을 완료하지 못했습니다. 다시 시도하세요.',
  },
  account: {
    signOutFailed: '로그아웃하지 못했습니다. 다시 시도하세요.',
    openMenu: '계정 메뉴 열기',
    fallback: '계정',
    signOut: '로그아웃',
    signingOut: '로그아웃 중…',
  },
  navigation: {
    home: '홈',
    open: '탐색 열기',
    close: '탐색 닫기',
    expand: '탐색 펼치기',
    collapse: '탐색 접기',
    toggle: '탐색 펼치기 또는 접기',
    label: '애플리케이션 탐색',
    description: '이 애플리케이션의 페이지로 이동합니다.',
    breadcrumb: '이동 경로',
    breadcrumbMore: '중간 단계 표시',
    back: '뒤로',
  },
  dataTable: {
    emptyDescription:
      '현재 범위에 사용 가능한 레코드가 없습니다. 다른 범위를 선택하거나 나중에 확인하세요.',
    noResults: '결과가 없습니다.',
    sortAscending: '오름차순',
    sortDescending: '내림차순',
    hideColumn: '숨기기',
    view: '보기',
    toggleColumns: '열 표시 전환',
    selectedCount: '전체 {{total}}행 중 {{selected}}행 선택됨.',
    rowsPerPage: '페이지당 행 수',
    pageOf: '{{pageCount}}페이지 중 {{page}}페이지',
    firstPage: '첫 페이지로 이동',
    previousPage: '이전 페이지로 이동',
    nextPage: '다음 페이지로 이동',
    lastPage: '마지막 페이지로 이동',
  },
  datePicker: {
    placeholder: '날짜 선택',
    rangePlaceholder: '날짜 범위 선택',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
