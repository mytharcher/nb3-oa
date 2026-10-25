export default {
  outings: {
    authz: { resource: '外出申请' },
    navigation: '外出申请',
    new: '新建外出申请',
    edit: '编辑外出申请',
    formDescription: '核对时段后提交审批，也可保存为草稿。',
    description: '登记外出时段、地点和事由，提交直属上级审批。',
    startAt: '开始时间',
    endAt: '结束时间',
    location: '外出地点',
    reason: '外出事由',
    timeZone: '时间按 {{zone}} 记录',
    policyHint: '时段开始后不能撤回，只能由直属上级说明原因终止。',
    nonexistentTime: '时钟切换导致此本地时间不存在，请选择其他时间。',
    daylightSavingPolicy:
      '若时钟切换导致本地时间重复，按第一次出现的时间记录。',
    errors: {
      OUTING_EMPLOYEE_INACTIVE: '申请人须为在职员工，请联系 HR 核对。',
      OUTING_INVALID_PERIOD: '结束时间须晚于开始时间，请检查外出时段。',
      OUTING_REQUIRED_FIELDS: '请填写外出地点和事由。',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        '暂时无法提交审批，请联系管理员检查审批期限设置。',
      ATTENDANCE_ACTIVITY_CHANGED: '考勤事实已变化，请刷新后重新核对。',
    },
  },
};
