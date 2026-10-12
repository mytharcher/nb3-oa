export default {
  leaveCancellations: {
    new: '发起销假',
    edit: '编辑销假',
    navigation: '销假',
    description: '取消尚未开始的已批假期并跟踪确认进度。',
    formDescription: '核对销假内容后提交给原审批人确认，也可保存为草稿。',
    original: '原请假单',
    chooseOriginal: '选择本人已批请假',
    mode: '销假方式',
    all: '整单取消',
    shorten: '提前结束',
    actualEnd: '实际结束日期',
    endHalf: '结束半天',
    originalRange: '当前已批期间',
    refunded: '退还天数',
    sourceRange: '{{name}}：{{start}} 至 {{end}}（{{zone}}）',
    noOriginals: '暂无可销假的已批请假单。',
    policyHint:
      '只能取消尚未开始的半天。原第一环节审批人须在待取消半天开始前确认；通过后同步退还余额、修正考勤并失效原单审批委托。',
    uncertainCreate:
      '保存结果尚不确定，请关闭表单并查看“我的申请”，确认后再创建新的草稿。',
    invalidOriginal: '请选择本人已批准、尚未整单取消的请假单。',
    noRemainder: '该请假单已整单取消。',
    invalidRange:
      '请选择当前请假期间内更早的结束日，待取消的半天不得已经开始。',
    alreadyStarted: '已开始的半天不可取消。',
    noWorkdays: '此次修改没有可退还的工作半天。',
    changed: '原请假有效期间已变化，请退回修改并重新提交销假。',
    inactive: '员工档案暂不可用。',
    invalid: '请检查原请假单、销假期间和理由。',
    emptyDescription: '选择已批请假单，创建销假草稿。',
  },
};
