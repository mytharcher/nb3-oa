export default {
  vendorQualifications: {
    authz: {
      resource: '仕入先資格',
      view: '仕入先資格を閲覧',
      submit: '仕入先資格申請を作成・編集',
      paymentAccount: '保護された仕入先銀行口座を閲覧',
      updatePaymentAccount: '自分の下書き仕入先銀行口座を更新',
      manage: '仕入先資格委員会を設定',
    },
    schedule: {
      expiryReminder:
        '仕入先{{supplierName}}の資格は{{expiry}}に満了します。更新をご手配ください。',
      title: '仕入先資格の有効期限リマインダー',
      description: '会社暦で資格満了30日前に購買へ通知します。',
    },
  },
};
