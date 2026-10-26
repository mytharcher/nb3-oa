import actionCopy from './reimbursement-actions.ja-JP.js';
import formCopy from './reimbursement-forms.ja-JP.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: '関連レコードを利用できません',
    categoryUnavailable: '区分を利用できません',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        '各明細は対応範囲内の正の金額にしてください。',
      REIMBURSEMENT_INVALID_LINE_DATE:
        '各明細に有効な経費日を選択してください。',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        '支払確認前に支払証憑番号を入力してください。',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        '理由を入力し、正確な精算総額、貸付相殺、現金支払を確認してください。',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        '支払を完了できない理由を入力してください。',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        '支払口座が変更されました。訂正前に最新口座を読み込んでください。',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        '承認済み枠が変更されました。更新して精算総額を確認してください。',
      REIMBURSEMENT_INVOICES_CHANGED:
        '請求書証拠が変更されました。申請を更新して利用可能な請求書を選び直してください。',
      REIMBURSEMENT_LOAN_CHANGED:
        '貸付相殺が変更されました。貸付を更新して相殺額を確認してください。',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        '経費合計が対応額を超えています。減額するか申請を分割してください。',
      REIMBURSEMENT_FILE_SIZE:
        '空でない5 MB以下の添付ファイルを選択してください。',
      REIMBURSEMENT_FILE_TYPE:
        '形式が一致するPDF、JPEG、PNG、WebPをアップロードしてください。',
    },

    ...formCopy,
    ...actionCopy,
    title: '経費精算',
    description: '経費証拠、明細承認、支払処理を確認します。',
    new: '新しい経費精算',
    edit: '経費精算を編集',
    details: '詳細を表示',
    number: '番号',
    reason: '理由',
    gross: '精算総額',
    offset: '貸付相殺',
    net: '現金純額',
    search: '番号、理由、申請者で検索',
    view: 'レコード表示',
    allStatuses: 'すべての状態',
    refresh: '経費精算を更新',
    clearFilters: 'フィルターをクリア',
    emptyTitle: '経費精算はまだありません',
    emptyDescription: '下書きを作成して経費明細と証拠を追加してください。',
    noResults: '一致する経費精算はありません。フィルターを調整してください。',
    rowActions: '{{name}}の操作',
    views: {
      mine: '自分',
      pending: '待機中',
      done: '完了',
      copied: 'コピー済み',
    },
    statuses: {
      draft: '下書き',
      revision: 'リビジョン',
      manager: '直属上司の審査',
      head: '部署審査',
      finance: '財務審査',
      executive: '役員審査',
      gm: '総経理審査',
      cashier: '出納処理',
      exception: '処理例外',
      paid: '支払済み',
      forcedPaid: '管理精算記録済み',
      rejected: '却下済み',
      withdrawn: '取り下げ済み',
      terminated: '終了済み',
    },
    errors: {
      invoiceDuplicate:
        'この精算内で請求書番号は一意にしてください。各明細を確認してください。',
      overrunReasonRequired:
        '累計請求が関連承認枠を20%以上超えています。超過説明を入力してください。',
      invoiceUnavailable:
        '請求書が他の精算で予約または使用されています。番号と申請を確認してください。',
      paymentAccountRequired:
        '従業員支払口座が不完全です。提出前に人事に銀行名、口座番号、名義人の補完を依頼してください。',
      employeeInactive:
        '申請者には有効な従業員情報が必要です。人事に確認を依頼してください。',
      departmentRequired:
        '申請者に有効な主所属部署がありません。人事または組織管理者に割り当てを依頼してください。',
      categoryInvalid:
        '無効または利用不可の経費区分があります。各明細で有効な区分を選択してください。',
      sourceInvalid:
        '関連枠は利用不可、未承認、または別の申請者に属しています。関連申請を確認してください。',
      sourceRebind:
        '提出済み精算の関連枠や貸付は変更できません。元の紐付けを維持してください。',
      loanRequired:
        '相殺額に対する貸付を選択してください。相殺しない場合は0を入力してください。',
      loanInvalid:
        '選択した貸付は利用できないか別の申請者に属しています。別の貸付を選択してください。',
      loanInsufficient:
        '貸付の利用可能残高が不足しています。相殺を減らして残高を確認してください。',
      invalidOffset:
        '貸付相殺は精算総額を超えられません。金額を確認してください。',
      attachmentInvalid:
        '証拠の一部は利用不可か別の精算に属しています。この申請用の証拠を選択またはアップロードしてください。',
      slaConfiguration:
        '承認時間制限は未対応です。フロー管理者にお問い合わせください。',
      inputInvalid:
        '精算理由と、証拠付きの重複しない完全な明細を入力してください。',
      configuration:
        '精算データ構造が不完全です。再試行前にシステム管理者に修復を依頼してください。',
      forbidden: 'この経費精算にアクセスできません。',
      notFound: 'この経費精算は存在しません。',
      conflict:
        '経費精算が変更されました。再操作前に再読み込みして確認してください。',
      standardReason: '承認基準を超える日の各明細に説明を記入してください。',
      standardCategoryChanged:
        'この区分は元のポリシー範囲外です。現在のポリシーを使うには新しい申請を作成してください。',
      standardConfiguration:
        '承認済み出張基準が不完全です。管理者に設定確認を依頼してください。',
      invalid: '精算内容と必須証拠を確認してください。',
      failed: 'リクエストは完了しませんでした。再試行してください。',
    },
    standard: {
      title: '固定経費ポリシー',
      unsubmitted: '初回提出時にポリシーを固定します。',
      frozenHint:
        '保存された区分と承認済み出張上限は修正時も維持します。日額は基準種類ごとに合計します。',
      gradeCode: '出張等級',
      gradeRank: '等級順位',
      lodging: '1泊あたり宿泊費（元）',
      allowance: '1日あたり日当（元）',
      notApplicable: 'この申請に適用する承認済み出張基準はありません。',
      kinds: {
        none: '出張日額上限なし',
        lodging: '宿泊日額上限',
        allowance: '日当日額上限',
      },
    },
    detail: {
      lines: '経費明細',
      failure: '処理失敗',
      voucher: '支払証憑',
      forcedReason: '管理精算理由',
      noLines: '経費明細はまだありません。',
      line: '経費明細{{number}}',
      financeResult: '財務結果',
      lineStates: {
        approved: '承認済み',
        returned: '訂正のため差し戻し',
        pending: '審査待ち',
      },
    },
    bank: {
      title: '非公開支払口座',
      bankName: '銀行',
      bankAccount: '銀行口座',
      bankAccountName: '口座名義人',
      missing: '保存済み支払口座はありません。',
      correct: '支払口座を訂正',
      saved: '支払口座を訂正しました',
      denied: '支払口座へのアクセスが拒否されました。',
      unavailable:
        '口座訂正を利用できません。精算を再読み込みして保存口座を確認してください。',
    },
    authz: {
      resource: '経費精算',
      submit: '自分の経費精算を作成・提出',
      delegate: '従業員の経費精算を作成',
      view: '経費精算を閲覧',
      paymentAccount: '権限のある支払口座を閲覧・訂正',
    },
  },
};
