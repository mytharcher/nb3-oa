export default {
  attendanceChange: {
    authz: { resource: '출퇴근 기록 정정' },
    navigation: '출퇴근 기록 정정',
    new: '새 출퇴근 기록 정정',
    edit: '출퇴근 기록 정정 편집',
    emptyMissing:
      '정정 가능한 누락 기록이 없습니다. 가져온 근태 증빙에 오류가 있으면 인사팀에 문의하세요.',
    uploadAfterDraft: '초안을 저장한 후 편집을 열어 증빙을 업로드하세요.',
    formDescription: '증빙을 확인하여 검토를 요청하거나 초안으로 저장하세요.',
    description: '누락 시간을 입력하고 증빙을 제공하여 관리자 검토를 받으세요.',
    date: '기록 누락일',
    original: '원본 누락 기록',
    correctionAt: '정정 기록 시간',
    proof: '증빙 설명',
    attachments: '증빙 첨부 파일',
    punchKinds: { in: '출근', out: '퇴근' },
    missing: '누락 기록 선택',
    policyHint:
      '누락 기록은 7일 이내여야 합니다. 대기 및 승인된 신청도 월 한도에 포함됩니다.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        '누락 레코드가 변경되었습니다. 새로고침하고 다시 선택하세요.',
      ATTENDANCE_CHANGE_TOO_OLD:
        '7일 이내의 누락 기록만 제출할 수 있습니다. 이전 기록은 인사팀에 문의하세요.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        '정정 시간은 누락일에 속해야 하며 미래일 수 없습니다.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        '대기 및 승인된 정정이 월 한도에 도달했습니다.',
      ATTENDANCE_CHANGE_DUPLICATE:
        '이 누락 기록에 이미 대기 또는 승인된 정정이 있습니다.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        '증빙 설명을 입력하거나 증빙을 업로드하세요.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        '신청자는 활성 직원이어야 합니다. 인사팀에 인사 기록 확인을 요청하세요.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: '정정 사유를 입력하세요.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        '첨부 파일은 비어 있지 않아야 하며 최대 5MB입니다.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        '내용과 형식이 일치하는 PDF, JPEG, PNG, WebP 파일을 사용하세요.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        '이 증빙을 보거나 업로드할 권한이 없습니다.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        '첨부 링크가 유효하지 않습니다. 이 초안에 업로드한 증빙을 선택하세요.',
      ATTENDANCE_BASELINE_CHANGED:
        '원본 근태 증빙이 변경되어 결재가 롤백되었습니다. 새로고침 후 검토하세요.',
    },
  },
};
