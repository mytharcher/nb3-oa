export default {
  authz: {
    returnHeld: '确认历史持有资产实物归还',
    resource: '资产台账',
    view: '查看资产台账与原值',
    viewHeld: '查看本人持有的资产',
    manage: '录入及更正资产资料',
    heldScope: '本人持有的资产',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN: '须由当前有效的资产管理员确认实物归还。',
    ASSET_REQUEST_REUSED: '此归还请求标识已用于另一份收回记录。',
    ASSET_RETURN_INELIGIBLE: '请核对实际持有的资产、员工和序列号。',
    ASSET_RETURN_FLOW_REQUIRED:
      '请先通过该资产的实际申请流程处理后再确认归还。',

    ASSET_ACCESS_DENIED: '你没有执行此资产操作的权限。',
    ASSET_NOT_FOUND: '找不到此资产。',
    ASSET_INVALID_INPUT: '请输入资产编号、名称及非负的精确分值。',
    ASSET_CATEGORY_INACTIVE: '请选择启用的资产类别。',
    ASSET_INVALID_COMMAND: '必须提供操作人及更正理由。',
    ASSET_INVALID_VERSION: '请提供资产的当前版本。',
    ASSET_VERSION_CONFLICT: '此资产已变更，请加载最新版本。',
    ASSET_CODE_EXISTS: '此资产编号已存在。',
    ASSET_INVALID_STORED_AMOUNT: '已存资产原值超出可精确处理的范围。',
    ASSET_WRITE_UNCONFIRMED: '无法确认资产写入结果。',
    ASSET_DEPARTURE_NOT_CLEARED:
      '在用、借出或预占的资产归还后才能完成离职清关。',
  },
};
