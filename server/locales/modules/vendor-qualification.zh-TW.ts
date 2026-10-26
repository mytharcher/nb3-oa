export default {
  vendorQualifications: {
    authz: {
      resource: '供應商准入',
      view: '查看供應商准入',
      submit: '新增和修改供應商准入申請',
      paymentAccount: '讀取受保護供應商銀行帳戶',
      updatePaymentAccount: '修改本人草稿供應商銀行帳戶',
      manage: '設定供應商准入委員會',
    },
    schedule: {
      expiryReminder:
        '供應商{{supplierName}}的資質將於{{expiry}}到期，請安排重新准入。',
      title: '供應商資質到期提醒',
      description: '按公司工作行事曆時區，在資質到期前30個自然日提醒採購人員。',
    },
  },
};
