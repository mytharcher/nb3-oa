export default {
  onboarding: {
    notifications: {
      overdueTitle: '到職辦理任務已超期',
      overdueBody: '有到職辦理任務已超過期限，請查看目前負責的辦理任務。',
    },
    authz: {
      resource: '到職辦理',
      readable: '到職相關人員',
      view: '查看到職辦理',
      create: '建立到職辦理',
      cancel: '取消到職辦理',
      claim: '認領辦理任務',
      reassignMentor: '重新指定部門負責人',
      transfer: '轉辦',
      release: '釋放辦理任務',
      complete: '完成辦理任務',
      forceComplete: '強制完成辦理任務',
      viewSalary: '查看到職工資',
      viewBank: '查看到職收款資料',
    },
    errors: {
      employeeSourceConflict: '此到職來源已綁定其他員工資料。',
      employeeAccountEnabled: '建立員工檔案時，到職帳號必須保持停用。',
      forbidden: '您無權執行此到職操作。',
      sourceInvalid: '招募名額或到職業務事實已不再有效。',
      idempotencyConflict: '此命令標識已用於其他資料。',
    },
  },
};
