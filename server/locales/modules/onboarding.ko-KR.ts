export default {
  onboarding: {
    notifications: {
      overdueTitle: '입사 할 일 기한 초과',
      overdueBody:
        '기한 초과 입사 할 일이 있습니다. 현재 할당 업무를 확인하세요.',
    },
    authz: {
      resource: '입사',
      readable: '입사 참여자',
      view: '입사 보기',
      create: '입사 생성',
      cancel: '입사 취소',
      claim: '할 일 맡기',
      reassignMentor: '부서장 재할당',
      transfer: '이관',
      release: '할 일 해제',
      complete: '할 일 완료',
      forceComplete: '강제 완료',
      viewSalary: '입사 급여 보기',
      viewBank: '입사 은행 정보 보기',
    },
    errors: {
      employeeSourceConflict:
        '입사 원본이 다른 직원 정보에 이미 연결되어 있습니다.',
      employeeAccountEnabled:
        '직원 인사 기록 생성 중 입사 계정은 비활성을 유지해야 합니다.',
      forbidden: '입사 작업 권한이 없습니다.',
      sourceInvalid: '채용 배정 또는 입사 업무 사실이 유효하지 않습니다.',
      idempotencyConflict: '다른 정보로 이미 사용한 명령 식별자입니다.',
    },
  },
};
