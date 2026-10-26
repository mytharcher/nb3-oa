export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED: '需要真實完成的蓋章證據。',
      CONTRACT_SEAL_EVIDENCE_CONFLICT: '此蓋章證據已關聯其他合約事實。',
      CONTRACT_ACCESS_DENIED: '此合約不在您的授權範圍內。',
      CONTRACT_ACTION_NOT_ALLOWED: '此合約目前不能執行該操作。',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        '合約金額不得低於已付金額與付款預佔金額之和。',
      CONTRACT_ATTACHMENT_DENIED: '合約附件欄位或記錄不在您的授權範圍內。',
      CONTRACT_ATTACHMENT_INVALID: '請選擇屬於本合約申請的有效附件。',
      CONTRACT_CANDIDATE_REMOVED:
        '本申請的待簽核合約草稿已移除，請重新發起申請。',
      CONTRACT_CATEGORY_INACTIVE: '請選擇已啟用的合約類型。',
      CONTRACT_CORRUPT_BALANCE: '合約付款餘額不一致，請聯絡管理員核查。',
      CONTRACT_EMPLOYEE_REQUIRED: '申請人須為在職員工且已設定主部門。',
      CONTRACT_FIELDS_RESTRICTED: '必要的合約欄位不在您的授權範圍內。',
      CONTRACT_FILE_SIZE: '請選擇非空且不超過 5 MiB 的合約檔案。',
      CONTRACT_FILE_TYPE:
        '合約文字須為 PDF；證明附件支援內容與類型一致的 PDF、JPEG、PNG 或 WebP。',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        '此請求標識已用於不同內容，請重新整理後重新提交。',
      CONTRACT_INACTIVE_SOURCE: '請選擇已生效的已批合約來源。',
      CONTRACT_INCOMPLETE_PROPOSAL:
        '請填寫申請原因、付款條款並選擇合約文字版本。',
      CONTRACT_INPUT_INVALID: '請檢查合約輸入欄位。',
      CONTRACT_INVALID_AMOUNT: '請輸入支援範圍內的非負整數分金額。',
      CONTRACT_INVALID_ID: '請提供有效且長度符合要求的標識。',
      CONTRACT_INVALID_TIME: '合約時間戳無效。',
      CONTRACT_LIMIT_EXCEEDED: '待付款與已付款合計超過合約額度。',
      CONTRACT_NOT_CANDIDATE: '只能移除本申請尚未發佈的待簽核合約草稿。',
      CONTRACT_NOT_FOUND: '未找到合約來源。',
      CONTRACT_OUTSTANDING_PAYMENTS: '請先釋放待付款預佔，再終止合約。',
      CONTRACT_REASON_REQUIRED: '請填寫長度符合要求的操作原因。',
      CONTRACT_REBASE_NOT_ALLOWED:
        '僅申請人可在變更退回修改時顯式同步合約基版本。',
      CONTRACT_REQUEST_KEY_REQUIRED: '操作須提供穩定的請求標識。',
      CONTRACT_RESERVATION_CLOSED: '付款預佔已關閉，不能重複使用。',
      CONTRACT_RULE_INVALID: '合約簽核規則缺失或無效，請聯絡管理員設定。',
      CONTRACT_SLA_UNSUPPORTED: '目前簽核適配器僅支援已設定的 24/48 小時時限。',
      CONTRACT_SOURCE_CONFLICT: '此引用已屬於另一合約來源。',
      CONTRACT_STORED_ID_INVALID: '已存儲的合約標識無效，請聯絡管理員核查。',
      CONTRACT_SUPPLIER_INVALID:
        '合約供應商須已啟用且資質簽核通過；請核對最新資質後再簽核。',
      CONTRACT_TARGET_MISMATCH: '簽核目標不屬於本合約申請。',
      CONTRACT_TEXT_INVALID: '請選擇屬於本申請的不可變 PDF 合約文字版本。',
      CONTRACT_TEXT_NOT_EDITABLE:
        '只能為本人草稿或退回修改中的合約追加文字版本。',
      CONTRACT_TEXT_REQUIRED: '請選擇有效的合約文字版本。',
      CONTRACT_TRANSITION_NOT_ALLOWED: '請使用對應的受控合約業務操作。',
      CONTRACT_VERSION_CONFLICT:
        '已批合約版本已變更，請退回修改、顯式同步基版本後重新提交簽核。',
    },
    authz: {
      resource: '合約與變更',
      view: '查看合約申請',
      submit: '發起及修改本人合約申請',
      ledger: '查看已批合約臺帳及不可變版本',
      historicalEntry: '法務審計補錄歷史合約',
    },
  },
};
