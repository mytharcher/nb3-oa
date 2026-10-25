export default {
  attendanceResults: {
    failed: '暂时无法处理考勤结果，请检查权限、排班和日期后重试。',
    scheduleTitle: '每日考勤核算',
    scheduleDescription:
      '按公司时区核算过去七天已结束的班次，包含补卡和假勤变化；待核对结果会报告失败。',
    authz: {
      resource: '考勤结果',
      calculateSelf: '计算本人考勤',
      self: '本人考勤',
      view: '查看结果',
      recalculate: '重新计算',
      export: '导出结果',
      attendanceEvaluations: '每日考勤',
      attendanceEvaluationRevisions: '考勤计算记录',
    },
  },
};
