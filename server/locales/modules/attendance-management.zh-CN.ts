export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: '原始考勤证据格式无效。',
      ATTENDANCE_INVALID_TIME: '打卡时间必须属于公司时区考勤日期。',
      ATTENDANCE_INVALID_BATCH: '请提供1–1000行且不超过证据大小限制。',
      ATTENDANCE_SOURCE_CONFLICT: '来源键已对应不同的不可变证据。',
      ATTENDANCE_IDENTITY_UNAVAILABLE: '每行必须对应具有员工档案的真实人员。',

      NOT_FOUND: '此班次已不存在。',
      ACCESS_DENIED: '无权访问或修改此考勤配置。',
      ATTENDANCE_ACCESS_DENIED: '当前记录或字段权限不允许此变更。',
      ATTENDANCE_VERSION_CONFLICT: '配置已被修改，请重新加载后再保存。',
      ATTENDANCE_SHIFT_INVALID: '请输入有效且明确的班次配置。',
      ATTENDANCE_SHIFT_NOT_FOUND: '班次不存在或已停用。',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: '班次代码创建后不可修改。',
      ATTENDANCE_SHIFT_CODE_CONFLICT: '此班次代码已存在。',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED: '请使用当前公司时区的班次版本。',
      ATTENDANCE_SCHEDULE_INVALID: '请选择有效日期并明确指定班次或休息日。',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: '此部门不可用。',
      ATTENDANCE_SCHEDULE_NOT_READABLE: '无权读取当前排班版本。',
      ATTENDANCE_LIST_INVALID: '分页参数无效。',
      ATTENDANCE_LOCAL_TIME_INVALID:
        '此本地时间因夏令时不存在或重复，请选择明确的时间边界。',
    },
    authz: {
      importResource: '原始考勤导入',
      ingest: '导入不可变证据',
      attendanceRecords: '原始考勤记录',

      resource: '考勤配置',
      view: '查看考勤配置',
      manage: '管理考勤配置',
      attendanceShifts: '考勤班次',
      attendanceShiftRevisions: '班次版本',
      attendanceSchedules: '部门排班',
      attendanceScheduleRevisions: '排班版本',
    },
  },
};
