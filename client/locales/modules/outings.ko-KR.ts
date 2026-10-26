export default {
  outings: {
    authz: { resource: '외출 신청' },
    navigation: '외출 신청',
    new: '새 외출 신청',
    edit: '외출 신청 편집',
    formDescription: '기간을 확인하여 검토를 요청하거나 초안으로 저장하세요.',
    description: '관리자 검토를 위해 외출 기간, 장소 및 목적을 기록하세요.',
    startAt: '시작 시간',
    endAt: '종료 시간',
    location: '위치',
    reason: '목적',
    timeZone: '시간은 {{zone}} 기준으로 기록됩니다',
    policyHint: '외출 시작 후에는 상사만 사유와 함께 종료할 수 있습니다.',
    nonexistentTime:
      '시간 변경으로 존재하지 않는 현지 시간입니다. 다른 시간을 선택하세요.',
    daylightSavingPolicy:
      '시간 변경으로 현지 시간이 반복되면 이른 시점을 사용합니다.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        '신청자는 활성 직원이어야 합니다. 인사팀에 인사 기록 확인을 요청하세요.',
      OUTING_INVALID_PERIOD:
        '종료는 시작 이후여야 합니다. 외출 기간을 확인하세요.',
      OUTING_REQUIRED_FIELDS: '장소 및 목적을 입력하세요.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
      ATTENDANCE_ACTIVITY_CHANGED:
        '근태 사실이 변경되었습니다. 새로고침 후 검토하세요.',
    },
  },
};
