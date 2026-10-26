export default {
  resourceTitle: '제한 규칙',
  navigation: { title: '제한 규칙' },
  restrictionRules: {
    noResources:
      '레코드 범위를 지원하는 업무 리소스가 정의되지 않았습니다. 여기에서 규칙을 설정하기 전에 AI에게 업무 권한과 레코드 범위를 정의하도록 요청하세요.',
    page: {
      title: '제한 규칙',
      description:
        '제한 규칙은 선택한 사용자가 접근하는 레코드를 제한하며 자체적으로 접근을 부여하지 않습니다.',
    },
    notice:
      '제한 규칙은 기존 접근만 축소하며 자체적으로 권한을 부여하지 않습니다.',
    search: '규칙 이름, 키 또는 리소스 검색',
    create: '새 제한 규칙',
    ruleHeader: '규칙',
    appliesToHeader: '적용 대상',
    restrictedActionsHeader: '제한할 작업',
    allowedScopeHeader: '허용 범위',
    emptyNone:
      '제한 규칙이 없습니다. 선택한 사용자의 접근을 제한할 규칙을 생성하세요.',
    emptySearch: '검색과 일치하는 제한 규칙이 없습니다.',
    pagerLabel: '제한 규칙',
    editTitle: '제한 규칙 편집',
    newTitle: '새 제한 규칙',
    editorDescription: '대상 그룹의 유효한 레코드 범위를 제한합니다.',
    ruleHeading: '기본 정보',
    ruleDescription: '규칙 이름과 제한할 리소스를 선택하세요.',
    ruleName: '규칙 이름',
    assignmentsHeading: '적용 대상',
    assignmentsDescription: '이 제한을 적용할 대상을 선택하세요.',
    reason: '설명',
    accessHeading: '작업 및 레코드 범위',
    accessDescription: '작업마다 최대 레코드 범위를 설정하세요.',
    deleteRule: '규칙 삭제',
    save: '제한 규칙 저장',
    confirmDeleteTitle: '"{{title}}" 규칙을 삭제하시겠습니까?',
    confirmDeleteBody:
      '“{{title}}” 제한 규칙을 삭제합니다. 나머지 권한 집합 및 규칙이 접근을 결정합니다.',
  },
};
