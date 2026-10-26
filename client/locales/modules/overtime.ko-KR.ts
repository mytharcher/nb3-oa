export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE: '올바른 초과 근무일을 선택하세요.',
    },

    authz: { resource: '초과 근무 신청' },
    navigation: '초과 근무 신청',
    description: '초과 근무를 신청하고 결재 및 정산을 추적합니다.',
    new: '새 초과 근무 신청',
    edit: '초과 근무 신청 편집',
    date: '초과 근무일',
    minutes: '시간(분)',
    monthlyMinutes: '월 합계(분)',
    settlement: '정산',
    compensatory: '보상 휴가',
    pay: '초과 근무 수당',
    durationInvalid: '1~1,440분의 정수를 입력하세요.',
    formDescription: '신청을 검토하여 제출하거나 초안으로 저장하세요.',
    policyHint:
      '날짜별 신청은 하나입니다. 지연 신청은 인사 검토가 필요합니다. 보상 휴가는 최종 승인 후 정산됩니다.',
    emptyDescription:
      '초과 근무 신청을 완성하여 제출하거나 초안으로 저장하세요.',
    uncertainCreate:
      '저장 결과가 불확실합니다. 양식을 닫고 내 신청을 확인한 후 새 초안을 생성하세요.',
    duplicate: '이 날짜에 진행 중이거나 승인된 초과 근무 신청이 있습니다.',
    inactive: '신청자는 활성 직원이어야 합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    invalid: '초과 근무일, 시간, 정산 및 사유를 검토하세요.',
    schemaUnavailable:
      '초과 근무 데이터베이스 스키마 업데이트가 필요합니다. 아직 작업을 완료할 수 없으니 관리자에게 문의하세요.',
  },
};
