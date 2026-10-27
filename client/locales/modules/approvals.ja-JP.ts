import registryLocale from '../../extensions/nocobase-approval-ui/locales/ja-JP.js';
import { approvalLocaleJaJP as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: '印刷／PDF保存',
    printFailed: '印刷に失敗しました。もう一度お試しください。',
    saving: '保存中…',
    noAvailableAction: '現在利用可能な操作はありません',
    authz: {
      cancellation: '休暇取消',
      section: 'OA承認',
      leave: '休暇申請',
      submit: '自分の申請を提出',
      delegate: '従業員の代理申請を提出',
      view: '申請を閲覧',
      delegations: '承認の代理設定',
      read: '読み取り',
      update: '管理',
    },
    permissionSets: { delegations: '承認代理管理' },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'この操作の理由を入力してください。',
    CLAIM_FIRST: '結果を記録する前に、この処理タスクを引き受けてください。',
    TASK_CLOSED:
      'このタスクは終了しました。申請を更新し、現在利用できる操作を使用してください。',
    ALREADY_ANSWERED:
      'このタスクには回答済みです。更新して記録済みの結果を確認してください。',
    NOT_YOUR_TURN: '前の承認が保留中です。順番をお待ちください。',
    STALE: '承認が変更されました。続行する前に最新の申請を読み込んでください。',
    CONTENT_CHANGED:
      '確認した内容が変更されました。操作する前に更新して再確認してください。',
    STALE_CONTENT:
      '確認した内容が変更されました。操作する前に更新して再確認してください。',
    INVALID_ANSWER:
      '現在の段階ではこの判断を利用できません。更新して利用可能な操作を選択してください。',
    NOT_ALLOWED:
      'この操作は利用できなくなりました。更新して現在利用可能な操作を選択してください。',
    NO_ASSIGNEE:
      '条件を満たす担当者が割り当てられていません。承認管理者に割り当てを依頼してください。',
    NO_STAGE:
      '有効な承認段階がありません。更新し、承認管理者に申請の確認を依頼してください。',
    ASSIGNMENT_LOOP:
      'この再割り当ては以前の担当者に戻してしまいます。別の適格な受取人を選択してください。',
  },
  businessErrorFields: '{{message}} 以下の項目を確認してください：{{fields}}。',
  invalidFields: '以下の項目を確認してください：{{fields}}。',
  fieldSeparator: '、 ',
  businessErrors: {
    LEAVE_EMPLOYEE_INACTIVE:
      '申請者には有効な在職従業員情報が必要です。人事担当者に従業員情報と紐づくアカウントの確認を依頼してください。',
    LEAVE_HANDOVER_INACTIVE:
      '選択した引継ぎ担当者は利用できません。別の担当者を選ぶか、承認代理が無効の場合は選択を解除してください。',
    LEAVE_MAX_DAYS:
      '申請した休暇がこの休暇種類の上限を超えています。期間を短縮してください。',
    LEAVE_NO_WORKDAYS:
      '選択期間に勤務対象の半日単位がありません。日付を調整してください。',
    LEAVE_TYPE_UNAVAILABLE:
      'この休暇種類を利用できません。有効な休暇種類を選択してください。',
    LEAVE_DELEGATE_REQUIRED:
      '代理申請では別の在籍中の従業員を選択してください。',
  },

  creationUnknown:
    '保存結果が不明です。同じ保存を再試行するか、既存の下書きを確認してください。',
  resubmit: '再申請',
  submitted: '{{name}}を提出しました',
  draftSavedSubmitFailed:
    '下書きを保存しましたが、提出は完了していません。問題を解決して再試行してください。',
  submissionUnknown:
    '提出結果が不明です。内容を変更する前に、同じ内容で提出を再試行してください。',
  transfer: '転送',
  addSigner: '承認者を追加',
  urge: 'リマインド',
  recipientSearch: '適格な受取人を検索',
  moreRecipients: '受取人をさらに読み込む',
  signerMode: '承認者の追加方式',
  signerbefore: '自分の判断前',
  signeralongside: '自分の判断と並行',
  emptyTodoTitle: '未処理の承認はありません',
  emptyTodoDescription: '対応が必要な承認はここに表示されます。',
  emptyDoneTitle: '処理済みの承認はありません',
  emptyDoneDescription: '対応した承認はここに表示されます。',
  emptyCopiedTitle: '共有された承認はありません',
  emptyCopiedDescription: 'あなたに共有された申請はここに表示されます。',
  emptyMineTitle: '開始した申請はありません',
  emptyMineDescription:
    '申請内容を入力して提出するか、下書きを保存してください。',
  calendarTimeZone: '日付は{{zone}}の勤務カレンダーを使用します。',
  refreshAfterSuccess:
    '操作は成功しましたが最新の詳細を読み込めませんでした。操作を繰り返さず更新してください。',
  domainInvalid:
    '申請が業務条件を満たしていません。休暇種類、日付、引継ぎ担当者、申請内容を確認してください。',
  confirmSubmit: '提出すると承認処理が開始します。申請内容を確認してください。',
  confirmWithdraw: '取り下げると現在の承認処理から退出します。',
  confirmReject: '却下するとこの申請と承認処理が終了します。',
  confirmReturn:
    '差し戻すと申請者が修正できます。再提出時は最初の段階から開始します。',
  confirmTerminate: '管理者による終了でこの承認処理を終了します。',

  navigation: {
    center: 'タスクセンター',
    delegations: '承認の代理設定',
  },
  description: '承認タスクを処理し、自分の申請状況を確認します。',
  tabs: {
    todo: '未処理',
    done: '完了',
    copied: '自分への共有',
    mine: '自分の申請',
  },
  newLeave: '新しい休暇申請',
  editLeave: '休暇申請を編集',
  draft: '下書き',
  search: '番号または申請者で検索',
  clear: 'フィルターをクリア',
  all: 'すべて',
  noResults: '一致するレコードがありません',
  emptyTitle: '申請はまだありません',
  emptyDescription: '新しい承認タスクと申請はここに表示されます。',
  refresh: '更新',
  loading: '読み込み中',
  reference: '申請番号',
  applicant: '申請者',
  type: '休暇種類',
  days: '日数',
  status: '状態',
  createdAt: '申請日時',
  actions: '「{{name}}」の操作',
  detail: '表示',
  edit: '編集',
  saveDraft: '下書きを保存',
  save: '保存',
  cancel: 'キャンセル',
  close: '閉じる',
  submit: '提出',
  withdraw: '取り下げ',
  terminate: '終了',
  read: '既読にする',
  approve: '承認',
  reject: '却下',
  return: '差し戻し',
  comment: 'コメント',
  appoint: '割り当て',
  reassign: '再割り当て',
  reason: '理由',
  opinion: 'コメント',
  person: '承認者',
  place: '未割り当ての承認枠',
  startDate: '開始日',
  endDate: '終了日',
  startHalf: '開始の半日区分',
  endHalf: '終了の半日区分',
  am: '午前',
  pm: '午後',
  handover: '引継ぎ担当者',
  delegate: '休暇中の承認を委任',
  attachmentMissing:
    '一部の添付ファイルを利用できません。申請を再読み込みするか申請者にお問い合わせください。',
  attachments: '添付ファイル',
  attachmentRequired: '選択した休暇種類で必要な証明資料を添付してください。',
  attachmentUnavailable:
    '添付ファイルを一時的にアップロードできません。後で再試行するか管理者にお問い合わせください。',
  attachmentInvalid:
    '選択した添付ファイルの一部が無効か、この申請に属していません。再読み込みして選び直してください。',
  attachmentLimit:
    '添付ファイル：PDF、JPEG、PNG、WebP。各5 MB以下、最大10件。初回アップロード前に有効な下書きを保存します。',
  attachmentSize: '空でない5 MB以下のファイルを選択してください。',
  attachmentType:
    '形式が一致するPDF、JPEG、PNG、WebPファイルを選択してください。',
  attachmentCount: '添付ファイルは最大10件です。',
  attachmentDenied:
    'この申請の添付ファイルにアクセスできません。再読み込みしてアクセスを確認してください。',
  attachmentFailed:
    'アップロードに失敗しました。フォームと接続を確認し、再度ファイルを選択してください。',
  attachmentUploading: '下書きを保存してアップロード中…',
  attachmentRemove: '添付ファイル{{number}}を削除',
  balanceInsufficient:
    '利用可能な休暇残高が不足しています。日数を減らすか人事にお問い合わせください。',
  balanceLimit: '年次有給休暇と代休は休暇残高とともに利用可能になります。',
  unavailable: 'この操作を利用できません。阻害要因を確認してください。',
  formDescription: '申請内容を入力して提出するか、下書きを保存してください。',
  preview: '承認経路のプレビュー',
  facts: '申請詳細',
  progress: '承認の進捗',
  timeline: '承認履歴',
  saved: '休暇申請「{{name}}」を保存しました',
  completed: '{{action}}：「{{name}}」',
  actionTitle: '申請「{{name}}」を{{action}}',
  returnHint: '申請者に差し戻します。再提出は最初の段階から開始します。',
  confirmDescription:
    '現在の承認タスクを終了します。確認した内容を再確認してください。',
  discard: '変更を破棄しますか？',
  discardDescription: '未保存の変更は失われます。',
  discardConfirm: '変更を破棄',
  readOnly: 'このレコードは読み取り専用です。',
  hrPreview: '従業員の代理申請では、提出時に承認経路が計算されます。',
  dateRange: '終了は開始より前にできません。',
  required: '値を入力してください。',
  limit: '10000文字以内で入力してください。',
  handoverRequired: '委任を有効にするには引継ぎ担当者を選択してください。',
  unknownPerson: '名前を取得できません',
  yes: 'はい',
  no: 'いいえ',
  error: {
    invalid:
      '内容または操作が要件を満たしていません。確認して調整してください。',
    overlap:
      '進行中または承認済みの休暇申請がこの期間と重複しています。日付を調整してください。',
    configuration:
      '現在の承認期限設定はサポートされていません。管理者にお問い合わせください。',
    inactive: '必要な従業員を利用できません。従業員の状態を確認してください。',

    failed: 'リクエストに失敗しました。再試行してください。',
    forbidden: 'アクセスが拒否されました。管理者にお問い合わせください。',
    notFound:
      'このレコードは存在しないか削除されています。一覧に戻ってください。',
    conflict:
      'この申請は変更されました。操作前に最新の内容を読み込んでください。',
    stale: 'このタスクは終了済みか、操作が利用できなくなりました。',
  },
  loadLatest: '最新を読み込む',
  retry: '再試行',
  states: {
    draft: '下書き',
    revision: '要修正',
    manager: '直属上司の審査',
    head: '部署長の審査',
    hr: '人事の審査',
    approved: '承認済み',
    rejected: '却下済み',
    withdrawn: '取り下げ済み',
    terminated: '終了済み',
  },
  stages: {
    manager: '直属上司',
    head: '部署長',
    hr: '人事',
    revision: '申請者による修正',
  },
  delegations: {
    create: '作成',
    description: '指定した期間中の承認処理を代理人に委任します。',
    new: '新しい委任',
    edit: '委任を編集',
    disable: '無効にする',
    principal: '委任元',
    delegate: '代理人',
    scope: '範囲',
    from: '開始',
    to: '終了',
    source: 'ソース',
    active: '有効',
    inactive: '非アクティブ',
    manual: '手動',
    leave: '休暇',
    search: '委任元または代理人で検索',
    sourceLeave: '休暇から作成されました。関連申請から管理してください。',
    invalid: '異なる在籍中の従業員を選択し、終了を開始より後にしてください。',
    overlap:
      'この範囲と期間には既に委任があります。期間か範囲を調整してください。',
    disableTitle:
      '「{{principal}}」から「{{delegate}}」への委任を無効にしますか？',
    disableDescription: '代理人はこの範囲の承認を処理できなくなります。',
    saved: '「{{name}}」の委任を保存しました',
    empty: '承認委任はまだありません',
    emptyDescription:
      '一定期間、他の人に承認を処理してもらう委任を作成してください。',
    timeZone: '時刻は{{zone}}を使用します。終了時点は含みません。',
  },
  typeUnavailable: '休暇種類を利用できません',
  noPickerPermission:
    '担当者の選択にはユーザー読み取り権限が必要です。管理者にお問い合わせください。',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: '自分のレコード',
      readableScope: '閲覧可能な承認申請',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'すべての承認',
      leaveScope: '休暇承認',
      fromTime: '開始時刻（HH:mm）',
      toTime: '終了時刻（HH:mm）',
      timeInvalid: '日付を選択し、有効な24時間形式の時刻を入力してください。',
      disabled: '「{{name}}」の承認委任を無効にしました',
      readOnly: 'この委任は読み取り専用です。',
    },
  },
};
