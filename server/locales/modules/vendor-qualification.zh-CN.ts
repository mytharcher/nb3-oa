export default {
  vendorQualifications: {
    authz: {
      resource: '供应商准入',
      view: '查看供应商准入',
      submit: '新建和修改供应商准入申请',
      paymentAccount: '读取受保护供应商银行账户',
      updatePaymentAccount: '修改本人草稿供应商银行账户',
      manage: '配置供应商准入委员会',
    },
    schedule: {
      expiryReminder:
        '供应商{{supplierName}}的资质将于{{expiry}}到期，请安排重新准入。',
      title: '供应商资质到期提醒',
      description: '按公司工作日历时区，在资质到期前30个自然日提醒采购人员。',
    },
  },
};
