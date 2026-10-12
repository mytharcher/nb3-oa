export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED: '需要真实完成的盖章证据。',
      CONTRACT_SEAL_EVIDENCE_CONFLICT: '此盖章证据已关联其他合同事实。',
      CONTRACT_ACCESS_DENIED: '此合同不在您的授权范围内。',
      CONTRACT_ACTION_NOT_ALLOWED: '此合同当前不能执行该操作。',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        '合同金额不得低于已付金额与付款预占金额之和。',
      CONTRACT_ATTACHMENT_DENIED: '合同附件字段或记录不在您的授权范围内。',
      CONTRACT_ATTACHMENT_INVALID: '请选择属于本合同申请的有效附件。',
      CONTRACT_CANDIDATE_REMOVED:
        '本申请的待审批合同草稿已移除，请重新发起申请。',
      CONTRACT_CATEGORY_INACTIVE: '请选择已启用的合同类型。',
      CONTRACT_CORRUPT_BALANCE: '合同付款余额不一致，请联系管理员核查。',
      CONTRACT_EMPLOYEE_REQUIRED: '申请人须为在职员工且已配置主部门。',
      CONTRACT_FIELDS_RESTRICTED: '必要的合同字段不在您的授权范围内。',
      CONTRACT_FILE_SIZE: '请选择非空且不超过 5 MiB 的合同文件。',
      CONTRACT_FILE_TYPE:
        '合同文本须为 PDF；证明附件支持内容与类型一致的 PDF、JPEG、PNG 或 WebP。',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        '此请求标识已用于不同内容，请刷新后重新提交。',
      CONTRACT_INACTIVE_SOURCE: '请选择已生效的已批合同来源。',
      CONTRACT_INCOMPLETE_PROPOSAL:
        '请填写申请原因、付款条款并选择合同文本版本。',
      CONTRACT_INPUT_INVALID: '请检查合同输入字段。',
      CONTRACT_INVALID_AMOUNT: '请输入支持范围内的非负整数分金额。',
      CONTRACT_INVALID_ID: '请提供有效且长度符合要求的标识。',
      CONTRACT_INVALID_TIME: '合同时间戳无效。',
      CONTRACT_LIMIT_EXCEEDED: '待付款与已付款合计超过合同额度。',
      CONTRACT_NOT_CANDIDATE: '只能移除本申请尚未发布的待审批合同草稿。',
      CONTRACT_NOT_FOUND: '未找到合同来源。',
      CONTRACT_OUTSTANDING_PAYMENTS: '请先释放待付款预占，再终止合同。',
      CONTRACT_REASON_REQUIRED: '请填写长度符合要求的操作原因。',
      CONTRACT_REBASE_NOT_ALLOWED:
        '仅申请人可在变更退回修改时显式同步合同基版本。',
      CONTRACT_REQUEST_KEY_REQUIRED: '操作须提供稳定的请求标识。',
      CONTRACT_RESERVATION_CLOSED: '付款预占已关闭，不能重复使用。',
      CONTRACT_RULE_INVALID: '合同审批规则缺失或无效，请联系管理员配置。',
      CONTRACT_SLA_UNSUPPORTED: '当前审批适配器仅支持已配置的 24/48 小时时限。',
      CONTRACT_SOURCE_CONFLICT: '此引用已属于另一合同来源。',
      CONTRACT_STORED_ID_INVALID: '已存储的合同标识无效，请联系管理员核查。',
      CONTRACT_SUPPLIER_INVALID:
        '合同供应商须已启用且资质审批通过；请核对最新资质后再审批。',
      CONTRACT_TARGET_MISMATCH: '审批目标不属于本合同申请。',
      CONTRACT_TEXT_INVALID: '请选择属于本申请的不可变 PDF 合同文本版本。',
      CONTRACT_TEXT_NOT_EDITABLE:
        '只能为本人草稿或退回修改中的合同追加文本版本。',
      CONTRACT_TEXT_REQUIRED: '请选择有效的合同文本版本。',
      CONTRACT_TRANSITION_NOT_ALLOWED: '请使用对应的受控合同业务操作。',
      CONTRACT_VERSION_CONFLICT:
        '已批合同版本已变更，请退回修改、显式同步基版本后重新提交审批。',
    },
    authz: {
      resource: '合同与变更',
      view: '查看合同申请',
      submit: '发起及修改本人合同申请',
      ledger: '查看已批合同台账及不可变版本',
      historicalEntry: '法务审计补录历史合同',
    },
  },
};
