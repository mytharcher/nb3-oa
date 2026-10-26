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
  'deviceApproval.title': '端末を認可',
  'deviceApproval.description':
    'コマンドラインまたは別の端末があなたとしてのログインを要求しました。自分で開始した場合のみ承認してください。',
  'deviceApproval.enterCode': '端末に表示されたコードを入力してください。',
  'deviceApproval.codeLabel': 'コード',
  'deviceApproval.continue': '続行',
  'deviceApproval.checking': 'コードを確認中…',
  'deviceApproval.confirm':
    '端末に表示されたコードと一致することを確認してください。',
  'deviceApproval.client': 'リクエスト元{{client}}',
  'deviceApproval.approve': '承認',
  'deviceApproval.approving': '承認中…',
  'deviceApproval.deny': '拒否',
  'deviceApproval.denying': '拒否中…',
  'deviceApproval.approved':
    '端末を承認しました。ターミナルに戻って続行してください。このページは閉じられます。',
  'deviceApproval.denied':
    'リクエストを拒否しました。端末はログインしていません。このページは閉じられます。',
  'deviceApproval.expired':
    'コードは期限切れです。端末でログインを再開始してください。',
  'deviceApproval.invalid':
    'コードが無効です。端末の表示と照合して再試行してください。',
  'deviceApproval.notYours': 'このコードは別のアカウントが承認中です。',
  'deviceApproval.error': 'エラーが発生しました。再試行してください。',
  'deviceApproval.retry': '再試行',
  'deviceApproval.otherCode': '別のコードを入力',
};

export default enUS;
