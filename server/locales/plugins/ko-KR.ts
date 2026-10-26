// Application-owned Korean translations for installed plugin namespaces.
const plugins = {
  '@nocobase/app-plugin-authorization': {
    sections: {
      pages: '페이지 접근',
      page: '페이지',
      business: '업무 작업',
      administration: '시스템 및 도구',
      other: '기타',
    },
    options: {
      defaultAndSharing: '기본 데이터 범위 사용',
      actions: {
        assign: '할당 관리',
        configure: '설정',
        inspect: '권한 검사',
        read: '읽기',
        create: '생성',
        update: '업데이트',
        delete: '삭제',
        access: '접근',
      },
      settingsModules: {
        authorization: '권한 관리',
      },
      pages: {
        all: '모든 페이지',
        allDescription:
          '나중에 추가되는 페이지를 포함하여 모든 페이지에 접근을 허용합니다.',
      },
      settings: {
        inspector: '권한 검사',
        'permission-sets': '권한 집합',
      },
      subjectTypes: {
        authenticated: '로그인한 모든 사용자',
        authenticatedDescription:
          '유효한 로그인 세션이 있는 모든 사용자에게 적용됩니다.',
        user: '사용자',
      },
      recordAccessPolicies: {
        allRecords: '모든 레코드',
        recordsIOwn: '내가 소유한 레코드',
        recordsICreated: '내가 생성한 레코드',
        customFilter: '사용자 지정 필터',
        customFilterHint: '사용자 지정 필터 조건으로 레코드를 선택합니다.',
      },
    },
  },
  '@nocobase/app-plugin-authz-default-access': {
    resourceTitle: '기본 데이터 범위',
  },
  '@nocobase/app-plugin-authz-sharing-rules': {
    resourceTitle: '공유 규칙',
  },
  '@nocobase/app-plugin-authz-restriction-rules': {
    resourceTitle: '제한 규칙',
  },
  '@nocobase/app-plugin-users': {
    invitationEmail: {
      subject: '{{inviter}}님이 {{app}}에 초대했습니다',
      intro: '{{inviter}}님이 {{app}}에 초대했습니다.',
      summary: '함께 참여할 항목: {{items}}.',
      separator: ', ',
      action: '초대 수락',
      validity:
        '링크를 열어 이름과 비밀번호를 설정하세요. {{date}}까지 한 번만 사용할 수 있습니다.',
      fallback: '링크가 열리지 않으면 브라우저에 복사하세요:',
    },
  },
  '@nocobase/app-plugin-notification-in-app': {
    channels: {
      inApp: '앱 내',
    },
    providers: {
      builtIn: '내장',
    },
    errors: {
      authenticationRequired: '인증이 필요합니다.',
      invalidPageToken: 'pageToken이 이 목록에서 반환된 토큰이 아닙니다.',
      notFound: '알림 메시지를 찾지 못했습니다.',
    },
  },
  '@nocobase/app-plugin-notification': {
    errors: {
      logsForbidden: '알림 로그 접근 권한이 필요합니다.',
      logNotFound: '알림 로그를 찾지 못했습니다.',
    },
  },
  '@nocobase/app-plugin-scheduler': {
    nav: {
      automation: '자동화',
    },
    authorization: {
      title: '일정',
      read: '읽기',
    },
  },
  '@nocobase/app-plugin-agents': {
    access: {
      section: '에이전트 팀',
      businessSection: '에이전트 팀',
      businesses: {
        agents: {
          title: '에이전트 및 스킬',
          description: '팀의 에이전트 및 사용하는 스킬입니다.',
          actions: {
            edit: {
              title: '에이전트 및 스킬 관리',
              description:
                '에이전트 설정, 스킬 및 변수 변경, 보관, 복원, 삭제와 스킬 편집입니다. 에이전트에는 편집자 본인의 권한을 넘는 기능이 부여되지 않습니다',
              related:
                '에이전트 및 스킬 관리(본인 소유 에이전트 및 본인이 생성한 스킬)',
              relatedLabel: '내 에이전트 및 내가 생성한 스킬',
              relatedHint: '내가 소유한 에이전트 및 생성한 스킬',
              all: '에이전트 및 스킬 관리(전체)',
            },
          },
        },
      },
      settings: {
        agents: {
          agents: '에이전트',
          runners: '런타임',
          prices: '모델 가격',
          services: '모델 서비스',
        },
      },
      actions: {
        read: '보기',
        manage: '관리',
      },
      keyScopes: {
        agents: {
          title: '에이전트',
          description:
            '에이전트, 스킬 및 실행 조회, 에이전트 및 스킬 변경, 실행 취소 및 재시도.',
        },
        runners: {
          title: '런타임',
          description: '러너 및 등록 토큰 조회와 러너 관리.',
        },
        prices: {
          title: '모델 가격',
          description: '예상 비용 계산용 모델 가격 조회 및 변경.',
        },
        services: {
          title: '모델 서비스',
          description: '모델 서비스 및 제공 모델 조회. 키는 표시하지 않음.',
        },
      },
    },
  },
  '@nocobase/app-plugin-notification-providers': {
    providers: {
      smtp: 'SMTP',
      resend: 'Resend',
      feishuWebhook: 'Feishu 웹훅',
      dingtalkWebhook: 'DingTalk 웹훅',
    },
  },
};

export default plugins;
