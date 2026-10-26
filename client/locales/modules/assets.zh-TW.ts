export default {
  authz: {
    returnHeld: '確認歷史持有資產實物歸還',
    resource: '資產臺帳',
    view: '查看資產臺帳與原值',
    viewHeld: '查看本人持有的資產',
    manage: '輸入及更正資產資料',
    heldScope: '本人持有的資產',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN: '須由目前有效的資產管理員確認實物歸還。',
    ASSET_REQUEST_REUSED: '此歸還請求標識已用於另一份收回記錄。',
    ASSET_RETURN_INELIGIBLE: '請核對實際持有的資產、員工和序列號。',
    ASSET_RETURN_FLOW_REQUIRED:
      '請先通過該資產的實際申請流程處理後再確認歸還。',

    ASSET_ACCESS_DENIED: '你沒有執行此資產操作的權限。',
    ASSET_NOT_FOUND: '找不到此資產。',
    ASSET_INVALID_INPUT: '請輸入資產編號、名稱及非負的精確分值。',
    ASSET_CATEGORY_INACTIVE: '請選擇啟用的資產類別。',
    ASSET_INVALID_COMMAND: '必須提供操作人及更正理由。',
    ASSET_INVALID_VERSION: '請提供資產的目前版本。',
    ASSET_VERSION_CONFLICT: '此資產已變更，請載入最新版本。',
    ASSET_CODE_EXISTS: '此資產編號已存在。',
    ASSET_INVALID_STORED_AMOUNT: '已存資產原值超出可精確處理的範圍。',
    ASSET_WRITE_UNCONFIRMED: '無法確認資產寫入結果。',
    ASSET_DEPARTURE_NOT_CLEARED:
      '在用、借出或預佔的資產歸還後才能完成離職清關。',
  },
};
