export default {
  paymentRequests: {
    relatedUnavailable: '関連レコードを利用できません',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        '理由、受取人、正の金額、請求書番号、請求書証拠を入力してください。',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        '提出前に受取人の保護された銀行口座を完成させてください。',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        '受取人口座が変更されました。訂正前に最新口座を読み込んでください。',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        '申請者には有効な主所属部署が必要です。人事に従業員記録の更新を依頼してください。',
      PAYMENT_REQUEST_METHOD_INVALID: '有効な支払方法を選択してください。',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        '事前承認がない理由を説明し、関連発注書を解除してください。',
      PAYMENT_REQUEST_SOURCE_INVALID:
        '有効な発注書または契約と、元の受取人を選択してください。',
      PAYMENT_REQUEST_SOURCE_STALE:
        '元伝票が変更されました。再操作前に支払とソースを更新してください。',
      PAYMENT_REQUEST_CONTRACT_STALE:
        '契約が変更されました。再提出前にバージョンを更新し、支払を修正してください。',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        '支払証憑番号を入力し、支払証拠をアップロードまたは選択してください。',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        '強制的な支払完了前に正確な承認額を確認してください。',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        '支払を完了できない理由を入力してください。',
      PAYMENT_REQUEST_ALREADY_PAID:
        'この支払は精算済みです。更新して結果を確認してください。',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'この操作を完了する前に、実際の契約支払を記録してください。',
      PAYMENT_FILE_SIZE: '空でない5 MB以下の添付ファイルを選択してください。',
      PAYMENT_FILE_TYPE:
        '形式が一致するPDF、JPEG、PNG、WebPをアップロードしてください。',
      PAYMENT_ATTACHMENT_INVALID:
        'この支払申請用にアップロードした証拠を選択してください。',
    },

    title: '支払申請',
    description: '支払申請、固定ソース情報、出納処理を確認します。',
    new: '新しい支払申請',
    edit: '編集',
    details: '詳細を表示',
    number: '番号',
    reason: '理由',
    vendor: '受取人',
    amount: '支払金額（元）',
    search: '番号、理由、申請者、受取人で検索',
    view: 'レコード表示',
    allStatuses: 'すべての状態',
    refresh: '更新',
    clearFilters: 'フィルターをクリア',
    emptyTitle: '支払申請はまだありません',
    emptyDescription:
      '下書きを作成して支払を申請し、請求書証拠を添付してください。',
    noResults:
      '一致するレコードがありません。フィルターを解除または調整してください。',
    rowActions: '{{name}}の操作',
    yes: 'はい',
    no: 'いいえ',
    frozenHint: '提出時にソース、受取人、金額、請求書を固定します。',
    sourceModes: {
      contract: '契約',
      purchase: '発注書',
      none: '事前承認なし',
    },
    views: {
      mine: '自分',
      pending: '待機中',
      done: '完了',
      copied: 'コピー済み',
    },
    statuses: {
      draft: '下書き',
      revision: 'リビジョン',
      head: '部署審査',
      finance: '財務審査',
      executive: '役員審査',
      gm: '総経理審査',
      cashier: '出納処理',
      exception: '処理例外',
      paid: '支払済み',
      forcedPaid: '強制支払記録済み',
      rejected: '却下済み',
      withdrawn: '取り下げ済み',
      terminated: '終了済み',
    },
    errors: {
      forbidden:
        'アクセス権がありません。管理者に権限の確認を依頼してください。',
      notFound:
        'このレコードは存在しないか利用できません。元のページに戻ってください。',
      conflict:
        '支払が変更されました。再操作前に最新レコードを確認してください。',
      invalid: '支払内容と必須証拠を確認してください。',
      failed: 'リクエストは完了しませんでした。再試行してください。',
    },
    detail: {
      creator: '作成者',
      sourceMode: 'ソース',
      order: '発注書',
      noPriorReason: '事前承認なしの理由',
      invoice: '請求書番号',
      method: '支払方法',
      failure: '処理失敗',
      voucher: '支払証憑',
      forcedReason: '強制支払理由',
      paidAt: '支払日時',
      sourceFacts: '固定ソース情報',
      cumulativeHint:
        '提出時の累計支払には保留中も含みます。現在の申請予約は別表示のため重複加算しないでください。支払は納品・受領の確認ではありません。',
      sourceApproved: '承認済み発注額（元）',
      sourceCumulative: '提出時累計額（元）',
      sourceHeld: '現在のソース予約額（元）',
      fullApproval: '全承認が必要',
      attachments: '請求書証拠',
      voucherAttachments: '支払証拠',
      notSubmitted: '提出時にルールを固定します。',
    },
    rules: {
      spend_vp: '担当役員基準額（元）',
      spend_gm: '総経理基準額（元）',
      sla_remindHours: 'リマインダー勤務時間',
      sla_escalateHours: 'エスカレーション勤務時間',
      sla_urgeCooldownHours: 'リマインダー間隔（時間）',
    },
    authz: {
      voucherEvidence: '支払証憑をアップロード',
      ownScope: '自分が所有または作成した支払',
      resource: '支払申請',
      view: '支払申請を閲覧',
      submit: '自分の支払を作成・提出',
      delegate: '従業員の支払を作成',
      paymentAccount: '権限のある支払口座を閲覧・訂正',
    },
  },
};
