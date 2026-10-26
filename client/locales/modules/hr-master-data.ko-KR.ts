export default {
  hrMasterData: {
    mappingSearch:
      '정확한 외부 ID로 매핑 레코드 찾기(필터가 없으면 최근 100개 표시)',
    title: '인사 동기화',
    description:
      '승인된 연동 게이트웨이에서 조직 및 직원 기준 데이터를 받습니다. 기존 계정 연결이 필요하며 동기화로 로그인이 활성화되지는 않습니다.',
    read: '동기화 보기',
    sync: '동기화 및 재실행',
    manage: '원본 및 소유권 관리',
    addSource: '원본 추가',
    editSource: '원본 편집',
    sourceCode: '원본 코드(소문자, 숫자 및 하이픈)',
    sourceName: '원본 이름',
    principal: '허가된 연동 계정',
    enabled: '활성화됨',
    disabled: '비활성',
    noSources: '계정에 설정된 인사 원본이 없습니다.',
    recent: '최근 동기화',
    latest: '이 원본의 최근 50개 일괄 처리를 표시합니다.',
    items_one: '레코드 {{count}}개',
    items_other: '레코드 {{count}}개',
    actions: '작업',
    replay: '원래 일괄 처리 재시도',
    refresh: '새로고침',
    noRuns: '수신된 일괄 처리 없음.',
    mappings: '매핑된 레코드',
    revision: '개정 {{revision}}',
    reclaim: '외부 소유권 복원',
    reclaimHelp:
      '로컬 편집은 보호됩니다. 소유권 복원 시 다음 유효 업데이트에서 외부 원본이 이 필드를 대체할 수 있습니다. 먼저 로컬 레코드를 검토하고 결정 사유를 설명하세요.',
    confirmReclaim: '외부 소유권 확인',
    reason: '사유',
    cancel: '취소',
    save: '저장',
    failed: '작업에 실패했습니다. 권한과 원본 설정을 확인하고 재시도하세요.',
    localConflict:
      '로컬에서 변경된 레코드입니다. 인사팀이 검토하고 외부 소유권을 명시적으로 복원한 후 재시도해야 합니다.',
    businessConflict:
      '레코드를 적용하지 못했습니다. 원본 데이터를 수정하거나 업무 제한을 해결한 후 원래 일괄 처리를 재시도하세요.',
    states: { pending: '대기 중', completed: '완료됨', failed: '실패' },
    entities: {
      department: '부서',
      grade: '직급',
      employee: '직원',
    },
  },
};
