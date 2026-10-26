export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        '提出前に従業員の自己評価を入力してください。',
      PROBATION_CONCLUSION_REQUIRED: '承認前に上司の結論を入力してください。',
      PROBATION_COMPENSATION_REQUIRED:
        '人事承認フォームで保護された等級・給与情報を入力してください。',
      PROBATION_INVALID_GRADE: '有効な等級を選択してください。',
      PROBATION_ALREADY_ACTIVE:
        'この従業員には進行中の試用期間申請があります。既存申請を開いてください。',
      PROBATION_STALE_EMPLOYEE:
        '従業員の試用期間情報が変更されました。再操作前に更新してください。',
      PROBATION_DEPARTMENT_REQUIRED:
        '従業員には有効な主所属部署が必要です。人事に更新を依頼してください。',
    },

    title: '試用期間申請',
    description: '試用期間評価を確認し、本採用の決定を追跡します。',
    new: '新しい試用期間申請',
    edit: '編集',
    details: '詳細を表示',
    number: '番号',
    employee: '従業員',
    probationEndDate: '試用期間終了日',
    conclusion: '結論',
    search: '番号、従業員名、自己評価で検索',
    view: 'レコード表示',
    allStatuses: 'すべての状態',
    refresh: '更新',
    clearFilters: 'フィルターをクリア',
    emptyTitle: '試用期間申請はまだありません',
    emptyDescription:
      '満了間近にシステムが下書きを作成します。人事も試用中の従業員の評価を作成できます。',
    noResults: '一致する申請がありません',
    rowActions: '{{name}}の操作',
    views: {
      mine: '自分',
      pending: '待機中',
      done: '完了',
      copied: 'コピー済み',
    },
    conclusions: {
      regular: '本採用',
      deferred: '試用期間を延長',
      declined: '本採用を見送り',
    },
    statuses: {
      draft: '下書き',
      revision: 'リビジョン',
      manager: '直属上司の審査',
      head: '部署審査',
      hr: '人事の審査',
      gm: '総経理審査',
      approved: '承認済み',
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
        '評価が変更されました。再操作前に最新レコードを確認してください。',
      invalid: '評価内容と必須項目を確認してください。',
      failed: 'リクエストは完了しませんでした。再試行してください。',
      departureUnavailable:
        '退職フローを利用できず操作は未完了です。総経理審査は保留のままです。',
    },
    detail: {
      creator: '作成者',
      selfEvaluation: '自己評価',
      evaluation: '上司評価',
      deferredTo: '延長後の試用期間終了日',
      grade: '等級',
      manager: '上司審査者',
      head: '部署審査者',
      hr: '人事審査者',
      gm: '総経理審査者',
      rules: '固定ルール',
      unsubmitted: '提出時にルールを固定します。',
    },
    rules: {
      grade_managerRank: 'マネージャー等級基準',
      sla_remindHours: 'リマインダー勤務時間',
      sla_escalateHours: 'エスカレーション勤務時間',
      sla_urgeCooldownHours: 'リマインダー間隔（時間）',
    },
    compensation: {
      title: '非公開の報酬提案',
      denied: '報酬を閲覧できません。',
      missing: '保存済み報酬提案はありません。',
      grade: '提案等級',
      salary: '基本給（元）',
    },
    authz: {
      resource: '試用期間評価',
      submit: '試用期間評価を編集・提出',
      delegate: '人事による試用期間評価作成',
      view: '権限のある試用期間評価を閲覧',
      compensation: '非公開の試用期間報酬にアクセス',
    },
    schedule: {
      title: '試用期間終了リマインダー',
      description:
        '会社時刻で試用期間日付を照合し、満了14日前に自己評価下書きを作成して従業員に通知します。',
    },
  },
};
