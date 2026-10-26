export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        '제출 전에 직원의 자기 평가를 입력하세요.',
      PROBATION_CONCLUSION_REQUIRED: '승인 전에 관리자의 결론을 입력하세요.',
      PROBATION_COMPENSATION_REQUIRED:
        '인사 승인 양식의 보호된 직급 및 급여 정보를 완성하세요.',
      PROBATION_INVALID_GRADE: '활성 직급을 선택하세요.',
      PROBATION_ALREADY_ACTIVE:
        '직원에게 이미 진행 중인 수습 신청이 있습니다. 기존 신청을 여세요.',
      PROBATION_STALE_EMPLOYEE:
        '직원의 수습 정보가 변경되었습니다. 다시 처리하기 전에 새로고침하세요.',
      PROBATION_DEPARTMENT_REQUIRED:
        '직원에게 활성 기본 부서가 필요합니다. 인사팀에 레코드 업데이트를 요청하세요.',
    },

    title: '수습 신청',
    description: '수습 평가를 검토하고 정규직 전환 결정을 추적합니다.',
    new: '새 수습 신청',
    edit: '편집',
    details: '세부 정보 보기',
    number: '숫자',
    employee: '직원',
    probationEndDate: '수습 종료일',
    conclusion: '결론',
    search: '번호, 직원 이름 또는 자기 평가 검색',
    view: '레코드 보기',
    allStatuses: '모든 상태',
    refresh: '새로고침',
    clearFilters: '필터 초기화',
    emptyTitle: '수습 신청 없음',
    emptyDescription:
      '직원은 만료 무렵 시스템 초안을 받습니다. 인사팀은 수습 직원의 평가를 생성할 수 있습니다.',
    noResults: '일치하는 신청 없음',
    rowActions: '{{name}} 작업',
    views: {
      mine: '내 것',
      pending: '대기 중',
      done: '완료',
      copied: '복사됨',
    },
    conclusions: {
      regular: '정규직 전환',
      deferred: '수습 연장',
      declined: '정규직 전환 거절',
    },
    statuses: {
      draft: '초안',
      revision: '개정본',
      manager: '관리자 검토',
      head: '부서 검토',
      hr: '인사 검토',
      gm: '총괄 책임자 검토',
      approved: '승인됨',
      rejected: '거절됨',
      withdrawn: '철회됨',
      terminated: '종료됨',
    },
    errors: {
      forbidden: '접근할 수 없습니다. 관리자에게 권한 확인을 요청하세요.',
      notFound: '레코드가 없거나 사용할 수 없습니다. 원본 페이지로 돌아가세요.',
      conflict: '평가가 변경되었습니다. 최신 레코드를 읽은 후 다시 처리하세요.',
      invalid: '평가 내용 및 필수 필드를 확인하세요.',
      failed: '요청을 완료하지 못했습니다. 다시 시도하세요.',
      departureUnavailable:
        '퇴직 절차를 사용할 수 없어 작업을 완료하지 않았습니다. 총괄 책임자 검토는 대기 상태로 유지됩니다.',
    },
    detail: {
      creator: '생성자',
      selfEvaluation: '자기 평가',
      evaluation: '관리자 평가',
      deferredTo: '연장 수습 종료일',
      grade: '직급',
      manager: '관리자 검토자',
      head: '부서 검토자',
      hr: '인사 검토자',
      gm: '총괄 책임자 검토자',
      rules: '고정 규칙',
      unsubmitted: '규칙은 제출 시 고정됩니다.',
    },
    rules: {
      grade_managerRank: '관리자 직급 기준',
      sla_remindHours: '알림 근무 시간',
      sla_escalateHours: '상신 근무 시간',
      sla_urgeCooldownHours: '알림 대기 시간',
    },
    compensation: {
      title: '비공개 보수 제안',
      denied: '보수를 볼 수 없습니다.',
      missing: '저장된 보수 제안이 없습니다.',
      grade: '제안 직급',
      salary: '기본급(위안)',
    },
    authz: {
      resource: '수습 평가',
      submit: '수습 평가 편집 및 제출',
      delegate: '인사팀 수습 평가 생성',
      view: '권한이 있는 수습 평가 읽기',
      compensation: '비공개 수습 보수 접근',
    },
    schedule: {
      title: '수습 기간 만료 알림',
      description:
        '회사 시간으로 수습 날짜를 대사하고 만료 14일 전에 자기 평가 초안을 생성하여 직원에게 알립니다.',
    },
  },
};
