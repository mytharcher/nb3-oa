export default {
  onboarding: {
    notifications: {
      overdueTitle: '入职办理任务已超期',
      overdueBody: '有入职办理任务已超过期限，请查看当前负责的办理任务。',
    },
    authz: {
      resource: '入职办理',
      readable: '入职相关人员',
      view: '查看入职办理',
      create: '创建入职办理',
      cancel: '取消入职办理',
      claim: '认领办理任务',
      reassignMentor: '重新指定部门负责人',
      transfer: '转办',
      release: '释放办理任务',
      complete: '完成办理任务',
      forceComplete: '强制完成办理任务',
      viewSalary: '查看入职工资',
      viewBank: '查看入职收款资料',
    },
    errors: {
      employeeSourceConflict: '此入职来源已绑定其他员工资料。',
      employeeAccountEnabled: '创建员工档案时，入职账号必须保持禁用。',
      forbidden: '您无权执行此入职操作。',
      sourceInvalid: '招聘名额或入职业务事实已不再有效。',
      idempotencyConflict: '此命令标识已用于其他资料。',
    },
  },
};
