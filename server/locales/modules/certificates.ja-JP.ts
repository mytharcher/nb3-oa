export default {
  certificates: {
    authz: {
      requests: '証明書申請',
      view: '表示',
      create: '作成',
      edit: '編集',
      operate: '操作',
      issue: '発行',
      income: '収入',
      owned: '所有',
    },
    errors: {
      CERTIFICATE_ACCESS_DENIED: '証明書操作が拒否されました：アクセス拒否',
      CERTIFICATE_APPROVAL_REFUSED: '証明書操作が拒否されました：承認拒否',
      CERTIFICATE_ARTIFACT_MISSING: '証明書操作が拒否されました：成果物なし',
      CERTIFICATE_CLAIM_REQUIRED: '証明書操作が拒否されました：引き受けが必要',
      CERTIFICATE_COMMAND_CONFLICT: '証明書操作が拒否されました：コマンド競合',
      CERTIFICATE_COMMAND_INVALID: '証明書操作が拒否されました：無効なコマンド',
      CERTIFICATE_DEPARTMENT_REQUIRED: '証明書操作が拒否されました：部署が必要',
      CERTIFICATE_EMPLOYEE_REQUIRED: '証明書操作が拒否されました：従業員が必要',
      CERTIFICATE_HEAD_REQUIRED: '証明書操作が拒否されました：部署長が必要',
      CERTIFICATE_HR_REQUIRED: '証明書操作が拒否されました：人事担当が必要',
      CERTIFICATE_INCOME_DENIED:
        '証明書操作が拒否されました：収入へのアクセス拒否',
      CERTIFICATE_INCOME_INVALID: '証明書操作が拒否されました：収入が不正',
      CERTIFICATE_INVALID: '証明書操作が拒否されました：不正な操作',
      CERTIFICATE_PREPARATION_INVALID: '証明書操作が拒否されました：準備が不正',
      CERTIFICATE_PREPARATION_MISSING: '証明書操作が拒否されました：準備なし',
      CERTIFICATE_PREPARATION_STALE: '証明書操作が拒否されました：準備が古い',
      CERTIFICATE_SOURCE_STALE: '証明書操作が拒否されました：ソースが古い',
      CERTIFICATE_TARGET_MISMATCH: '証明書操作が拒否されました：対象不一致',
      CERTIFICATE_TEMPLATE_DENIED:
        '証明書操作が拒否されました：テンプレートへのアクセス拒否',
    },
  },
};
