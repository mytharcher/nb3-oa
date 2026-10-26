export default {
  general: {
    authz: {
      resource: '일반 신청',
      submit: '내 일반 신청 제출',
      delegate: '직원을 대신하여 일반 신청 제출',
      view: '일반 신청 읽기',
    },
    navigation: '일반 신청',
    new: '새 일반 신청',
    edit: '일반 신청 편집',
    title: '제목',
    body: '신청 세부 정보',
    extraApprovers: '추가 결재자',
    extraStage: '추가 검토',
    extraHint: '1~3명을 선택하세요. 관리자 이후 선택 순서대로 검토합니다.',
    addApprover: '결재자 추가',
    removeApprover: '결재자 {{number}} 제거',
    approver: '추가 결재자 {{number}}',
    formDescription: '다른 신청 유형에서 다루지 않는 업무를 설명하세요.',
    approversInvalid: '신청자가 아닌 서로 다른 활성 사용자 1~3명을 선택하세요.',
    invalid: '허용 길이 이내의 제목 및 신청 내용을 입력하세요.',
    inactive: '신청자는 활성 직원이어야 합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    uncertainCreate:
      '저장 결과가 불확실합니다. 새 초안 생성 전에 닫고 내 신청을 확인하세요.',
    attachmentInvalid: '일부 첨부 파일이 이 신청에 속하지 않습니다.',
    attachmentDenied: '첨부 파일에 접근할 수 없습니다.',
    attachmentType: '내용이 일치하는 PDF, JPEG, PNG, WebP 파일을 사용하세요.',
    attachmentSize: '첨부 파일은 비어 있지 않아야 하며 최대 5MB입니다.',
  },
};
