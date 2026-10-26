/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: '부서',
      positions: '직위',
      grades: '직급',
      dutyRoles: '업무 역할',
    },
    authz: {
      section: '조직 및 직원',
      departments: '부서',
      positions: '직위',
      grades: '직급',
      dutyRoles: '업무 역할',
      read: '보기',
      update: '관리',
    },
    subjects: {
      departments: '부서',
      heads: '부서장',
      dutyRoles: '업무 역할',
      disabled: '비활성',
    },
    scopes: {
      mine: '내 부서',
      mineHint: '내가 소속되거나 담당하는 부서 구성원의 소유 레코드.',
      mineAndBelow: '내 부서 및 하위',
      mineAndBelowHint: '내 부서와 모든 하위 부서 구성원의 소유 레코드.',
      headed: '담당 부서 및 하위',
      headedHint: '내가 담당하는 부서와 모든 하위 부서 구성원의 소유 레코드.',
    },
    dutyRoleTitles: {
      gm: '총괄 책임자',
      cfo: '재무 책임자',
      hr: '인사 담당자',
      hrbp: '인사 비즈니스 파트너',
      hrDirector: '인사 책임자',
      admin: '관리',
      sealKeeper: '인감 보관자',
      finance: '회계 담당자',
      financeManager: '재무 관리자',
      cashier: '출납 담당자',
      legal: '법무',
      purchasing: '구매',
      it: 'IT',
      committeeTech: '심사 위원회(기술 자리)',
    },
    common: {
      active: '활성화됨',
      inactive: '비활성',
      allStatuses: '모든 상태',
      noResults: '필터와 일치하는 항목이 없습니다.',
      clearFilters: '필터 초기화',
      clearSearch: '검색 지우기',
      searchByTitleOrCode: '이름 또는 코드 검색',
      askAdministrator: '관리자에게 설정을 요청하세요.',
      fields: {
        title: '이름',
        code: '코드',
        status: '상태',
        name: '이름',
        email: '이메일',
        user: '사람',
      },
      actions: {
        label: '작업',
        more: '{{name}} 작업',
        edit: '편집',
        enable: '활성화',
        disable: '비활성화',
      },
      form: {
        titleRequired: '이름을 입력하세요.',
        titleTooLong: '{{max}}자 이내로 입력하세요.',
        codeRequired: '코드를 입력하세요.',
        codeFormat:
          '영문 또는 숫자로 시작하며 영문, 숫자, ".", "_", "-"를 최대 64자 사용하세요.',
        codeHint: '가져오기 및 다른 시스템에서 사용하는 고정 식별자입니다.',
        integer: '정수를 입력하세요.',
        userRequired: '사용자를 선택하세요.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        '최상위 부서만 담당 임원을 지정할 수 있습니다. 하위 부서는 상속합니다.',
      codeTaken: '이미 사용한 코드입니다. 다른 코드를 선택하세요.',
      parentCycle: '부서를 자기 자신 또는 하위 부서 아래로 이동할 수 없습니다.',
      parentNotFound:
        '상위 부서가 더 이상 존재하지 않습니다. 다른 부서를 선택하세요.',
      userNotFound: '사용자가 없거나 비활성화되었습니다.',
      notFound: '레코드가 없거나 삭제되었습니다.',
      forbidden: '작업 권한이 없습니다.',
      requestFailed: '요청에 실패했습니다. 다시 시도하세요.',
    },
    departmentPicker: {
      placeholder: '부서 검색',
      empty: '일치하는 부서 없음',
      loadFailed: '부서를 불러올 수 없습니다.',
      inactivePath: '{{path}}(비활성)',
    },
    departments: {
      title: '부서',
      description:
        '부서 트리, 부서장 및 구성원을 관리합니다. 부서를 비활성화하면 모든 하위 항목도 비활성화됩니다.',
      create: '새 부서',
      createChild: '새 하위 부서',
      editTitle: '부서 편집',
      formDescription: '상위 변경 시 부서 및 모든 하위 항목이 함께 이동합니다.',
      created: '"{{name}}" 부서를 생성했습니다',
      saved: '"{{name}}" 부서를 저장했습니다',
      enabled: '"{{name}}" 부서를 활성화했습니다',
      disabled: '"{{name}}" 부서를 비활성화했습니다',
      disableTitle: '"{{name}}" 부서를 비활성화하시겠습니까?',
      disableDescription:
        '하위 부서도 제외되고 구성원은 더 이상 해당 권한을 상속하지 않습니다. 삭제되는 항목은 없으며 언제든 다시 활성화할 수 있습니다.',
      loadFailed: '부서를 불러올 수 없음',
      emptyTitle: '부서 없음',
      emptyDescription: '조직의 최상위를 만든 후 하위 부서를 추가하세요.',
      noResults: '검색과 일치하는 부서가 없습니다.',
      searchPlaceholder: '부서 이름 또는 코드 검색',
      treeLabel: '부서 트리',
      choose: '왼쪽에서 부서를 선택하여 세부 정보를 확인하세요.',
      notFound: '부서가 없거나 삭제되었습니다.',
      backToTree: '트리로 돌아가기',
      topLevel: '최상위 부서',
      inheritedFrom: '("{{name}}"에서 상속)',
      inactiveByAncestor: '"{{name}}"과 함께 비활성화됨',
      fields: {
        parent: '상위 부서',
        manager: '부서장',
        executive: '담당 임원',
        sortOrder: '정렬 순서',
      },
      form: {
        codeHint: '선택 사항. 가져오기는 코드로 부서를 업데이트합니다.',
        parentPlaceholder: '최상위(상위 없음)',
        parentHint: '최상위 부서는 비워 두세요.',
        managerHint:
          '이 사용자에게 결재를 전달하며 구성원일 필요는 없습니다. 비어 있으면 상위 부서장입니다.',
        executiveHint:
          '최상위 부서에만 설정합니다. 상위를 선택하면 지워지며 하위 부서는 상속합니다.',
        sortOrderHint: '같은 수준에서는 작은 숫자가 앞에 옵니다.',
      },
      members: {
        title: '구성원({{count}})',
        description:
          '직접 구성원입니다. 각 사용자는 결재와 예산에 사용되는 기본 부서 하나를 갖습니다.',
        add: '구성원 추가',
        addTitle: '"{{name}}"에 구성원 추가',
        added: '"{{name}}"을 "{{department}}"에 추가했습니다',
        primary: '부서 유형',
        primaryBadge: '기본',
        secondaryBadge: '보조',
        makePrimary: '기본 부서로 지정',
        primarySet: '"{{name}}"의 기본 부서로 지정했습니다',
        makePrimaryField: '이 사용자의 기본 부서로 지정',
        makePrimaryHint:
          '현재 기본 부서를 대체합니다. 선택하지 않으면 기본 부서가 없는 경우에만 기본으로 지정합니다.',
        remove: '부서에서 제거',
        removeTitle: '"{{name}}"을 "{{department}}"에서 제거하시겠습니까?',
        removeDescription:
          '이 부서의 권한을 더 이상 상속하지 않습니다. 기본 부서였다면 다른 부서를 지정할 때까지 기본 부서가 없습니다.',
        removed: '"{{name}}"을 "{{department}}"에서 제거했습니다',
        loadFailed: '구성원을 불러올 수 없음',
        emptyTitle: '구성원 없음',
        emptyDescription: '이 부서에서 근무하는 사용자를 추가하세요.',
      },
    },
    positions: {
      title: '직위',
      description:
        '직원 인사 기록에서 참조하는 직위입니다. 삭제 대신 비활성화하세요.',
      create: '새 직위',
      editTitle: '직위 편집',
      formDescription: '이름이 바뀌어도 코드는 유지됩니다.',
      created: '"{{name}}" 직위를 생성했습니다',
      saved: '"{{name}}" 직위를 저장했습니다',
      enabled: '"{{name}}" 직위를 활성화했습니다',
      disabled: '"{{name}}" 직위를 비활성화했습니다',
      disableTitle: '"{{name}}" 직위를 비활성화하시겠습니까?',
      disableDescription:
        '새 할당에서 제공되지 않습니다. 기존 직원은 직위를 유지합니다.',
      loadFailed: '직위를 불러올 수 없음',
      notFound: '직위가 없거나 삭제되었습니다.',
      emptyTitle: '직위 없음',
      emptyDescription: '"구매 담당자" 등 직원이 채용될 직위를 추가하세요.',
      fields: { number: '정렬 순서' },
      form: {
        numberRequired: '정렬 순서를 입력하세요.',
        numberHint: '선택 사항. 작은 숫자가 먼저 옵니다.',
      },
    },
    grades: {
      title: '직급',
      description:
        'P5, M2 같은 직급입니다. 순위가 출장 기준 및 결재 단계의 선임 여부를 결정합니다.',
      create: '새 직급',
      editTitle: '직급 편집',
      formDescription: '이름이 바뀌어도 코드는 유지됩니다.',
      created: '"{{name}}" 직급을 생성했습니다',
      saved: '"{{name}}" 직급을 저장했습니다',
      enabled: '"{{name}}" 직급을 활성화했습니다',
      disabled: '"{{name}}" 직급을 비활성화했습니다',
      disableTitle: '"{{name}}" 직급을 비활성화하시겠습니까?',
      disableDescription:
        '새 할당에서 제공되지 않습니다. 기존 직원은 직위를 유지합니다.',
      loadFailed: '직급을 불러올 수 없음',
      notFound: '직급이 없거나 삭제되었습니다.',
      emptyTitle: '직급 없음',
      emptyDescription:
        '순위와 함께 직급을 추가하세요. 순위가 높을수록 선임입니다.',
      fields: { number: '순위' },
      form: {
        numberRequired: '순위를 입력하세요.',
        numberHint: '정수이며 높을수록 선임입니다.',
      },
    },
    dutyRoles: {
      title: '업무 역할',
      description:
        '결재 및 처리 단계는 이 역할로 담당자를 찾습니다. 권한 설정에서 역할별 작업을 할당하세요.',
      viewMembers: '구성원 보기',
      drawerDescription:
        '이 업무 담당자입니다. 역할에 할당된 결재 단계는 이들에게 전달됩니다.',
      enabled: '"{{name}}" 업무 역할을 활성화했습니다',
      disabled: '"{{name}}" 업무 역할을 비활성화했습니다',
      disableTitle: '"{{name}}" 업무 역할을 비활성화하시겠습니까?',
      disableDescription:
        '구성원은 역할을 잃으며 결재 단계에서 찾을 수 없고 할당 권한도 적용되지 않습니다. 구성원 정보는 유지됩니다.',
      loadFailed: '업무 역할을 불러올 수 없음',
      detailFailed: '업무 역할을 불러올 수 없음',
      notFound: '업무 역할이 없습니다. 패널을 닫아 목록으로 돌아가세요.',
      emptyTitle: '업무 역할 없음',
      emptyDescription:
        '업무 역할은 애플리케이션과 함께 설치됩니다. 관리자에게 설치 확인을 요청하세요.',
      fields: {
        code: '코드',
        memberCount: '구성원',
        description: '설명',
      },
      members: {
        title: '구성원({{count}})',
        add: '구성원 추가',
        addTitle: '"{{role}}"에 구성원 추가',
        added: '"{{name}}"을 "{{role}}"에 추가했습니다',
        remove: '제거',
        removeTitle: '"{{name}}"을 "{{role}}"에서 제거하시겠습니까?',
        removeDescription:
          '이 역할의 결재와 할당된 권한을 더 이상 받지 않습니다.',
        removed: '"{{name}}"을 "{{role}}"에서 제거했습니다',
        alreadyRemoved: '이미 제거된 사용자입니다.',
        emptyTitle: '구성원 없음',
        emptyDescription:
          '이 업무 담당자를 추가하세요. 추가할 때까지 결재 단계가 대기합니다.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
