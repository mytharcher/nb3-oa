export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        '현재 급여표가 변경되었습니다. 게시 전에 다시 불러오세요.',
      IDEMPOTENCY_CONFLICT: '다른 내용으로 이미 사용한 게시 키입니다.',
      TABLE_UNAVAILABLE: '급여표가 초기화되지 않았습니다.',
      GRADE_UNAVAILABLE: '필수 직급을 사용할 수 없거나 비활성 상태입니다.',
      INVALID_PUBLICATION: '게시 입력이 유효하지 않습니다.',
      STORED_DATA_INVALID: '저장된 급여표 데이터가 유효하지 않습니다.',
      INVALID_RANGE: '급여 범위는 유효한 정수 금액이어야 합니다.',
      DUPLICATE_GRADE: '각 직급은 한 번 나타나야 합니다.',
      OUTSIDE_RANGE: '제안 급여가 게시된 구간 밖입니다.',

      ACCESS_DENIED: '급여 직급 작업이 부여된 범위 밖입니다.',
      NOT_FOUND: '급여 직급 개정본을 사용할 수 없습니다.',
    },
    authz: {
      resource: '급여 직급표',
      view: '게시 이력 보기',
      viewSalary: '급여 범위 읽기',
      manage: '급여 직급표 게시',
    },
  },
};
