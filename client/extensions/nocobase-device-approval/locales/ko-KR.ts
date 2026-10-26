/** Every key the device approval looks up, so each locale is checked against the same list. */
export interface DeviceApprovalLocale {
  readonly 'deviceApproval.title': string;
  readonly 'deviceApproval.description': string;
  readonly 'deviceApproval.enterCode': string;
  readonly 'deviceApproval.codeLabel': string;
  readonly 'deviceApproval.continue': string;
  readonly 'deviceApproval.checking': string;
  readonly 'deviceApproval.confirm': string;
  readonly 'deviceApproval.client': string;
  readonly 'deviceApproval.approve': string;
  readonly 'deviceApproval.approving': string;
  readonly 'deviceApproval.deny': string;
  readonly 'deviceApproval.denying': string;
  readonly 'deviceApproval.approved': string;
  readonly 'deviceApproval.denied': string;
  readonly 'deviceApproval.expired': string;
  readonly 'deviceApproval.invalid': string;
  readonly 'deviceApproval.notYours': string;
  readonly 'deviceApproval.error': string;
  readonly 'deviceApproval.retry': string;
  readonly 'deviceApproval.otherCode': string;
}

const enUS: DeviceApprovalLocale = {
  'deviceApproval.title': '장치 허가',
  'deviceApproval.description':
    '명령줄 또는 다른 장치에서 내 계정 로그인을 요청했습니다. 직접 시작한 로그인인 경우에만 승인하세요.',
  'deviceApproval.enterCode': '장치에 표시된 코드를 입력하세요.',
  'deviceApproval.codeLabel': '코드',
  'deviceApproval.continue': '계속',
  'deviceApproval.checking': '코드 확인 중…',
  'deviceApproval.confirm': '장치에 표시된 코드와 일치하는지 확인하세요.',
  'deviceApproval.client': '요청자 {{client}}',
  'deviceApproval.approve': '승인',
  'deviceApproval.approving': '승인 중…',
  'deviceApproval.deny': '거부',
  'deviceApproval.denying': '거부 중…',
  'deviceApproval.approved':
    '장치를 승인했습니다. 터미널로 돌아가 계속하세요. 이 페이지는 닫아도 됩니다.',
  'deviceApproval.denied':
    '요청을 거부했습니다. 장치는 로그인되지 않았습니다. 페이지를 닫아도 됩니다.',
  'deviceApproval.expired':
    '코드가 만료되었습니다. 장치에서 로그인을 다시 시작하세요.',
  'deviceApproval.invalid':
    '유효하지 않은 코드입니다. 장치의 코드와 비교하고 재시도하세요.',
  'deviceApproval.notYours': '다른 계정에서 이미 승인 중인 코드입니다.',
  'deviceApproval.error': '문제가 발생했습니다. 다시 시도하세요.',
  'deviceApproval.retry': '다시 시도',
  'deviceApproval.otherCode': '다른 코드 입력',
};

export default enUS;
