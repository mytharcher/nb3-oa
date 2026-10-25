export default {
  attendanceChange: {
    authz: { resource: '补卡申请' },
    navigation: '补卡申请',
    new: '新建补卡申请',
    edit: '编辑补卡申请',
    emptyMissing: '没有可补卡的缺卡记录；若导入考勤有误，请联系 HR。',
    uploadAfterDraft: '先保存草稿，再从编辑页上传证明附件。',
    formDescription: '核对证明后提交审批，也可保存为草稿。',
    description: '为缺卡记录补充时间和证明，并提交直属上级审批。',
    date: '缺卡日期',
    original: '原缺卡记录',
    correctionAt: '补卡时间',
    proof: '证明说明',
    attachments: '证明附件',
    punchKinds: { in: '上班', out: '下班' },
    missing: '选择缺卡记录',
    policyHint: '缺卡日期须在七个自然日内；当月在途及已通过申请计入补卡限额。',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        '原缺卡记录已变化，请刷新并重新选择记录。',
      ATTENDANCE_CHANGE_TOO_OLD:
        '仅可申请七个自然日内的缺卡，请联系 HR 处理更早的记录。',
      ATTENDANCE_CHANGE_INVALID_TIME: '补卡时间须在缺卡当天，且不能晚于现在。',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT: '当月在途及已通过的补卡已达到限额。',
      ATTENDANCE_CHANGE_DUPLICATE: '该缺卡记录已有在途或已通过的补卡申请。',
      ATTENDANCE_CHANGE_PROOF_REQUIRED: '请填写证明说明或上传证明附件。',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        '申请人须为在职员工，请联系 HR 核对档案。',
      ATTENDANCE_CHANGE_REASON_REQUIRED: '请填写补卡原因。',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        '暂时无法提交审批，请联系管理员检查审批期限设置。',
      ATTENDANCE_CHANGE_FILE_SIZE: '附件不能为空且不超过 5 MB。',
      ATTENDANCE_CHANGE_FILE_TYPE:
        '仅支持内容与格式一致的 PDF、JPEG、PNG 和 WebP 附件。',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED: '没有查看或上传此证明附件的权限。',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        '附件关联无效，请重新选择当前草稿上传的证明附件。',
      ATTENDANCE_BASELINE_CHANGED:
        '原考勤证据已变化，本次审批未生效。请刷新后核对。',
    },
  },
};
