export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE: '請選擇有效的加班日期。',
    },

    authz: { resource: '加班申請' },
    navigation: '加班申請',
    description: '申請加班，查看簽核進度和結算方式。',
    new: '新增加班申請',
    edit: '編輯加班申請',
    date: '加班日期',
    minutes: '時長（分鐘）',
    monthlyMinutes: '當月累計（分鐘）',
    settlement: '結算方式',
    compensatory: '補休',
    pay: '加班費',
    durationInvalid: '請輸入 1 至 1,440 之間的整數分鐘數。',
    formDescription: '填寫並核對申請後直接提交，也可儲存為草稿。',
    policyHint:
      '同日不可重複申請。超期申請增加 HR 審核，補休在最終通過後結算。',
    emptyDescription: '新增加班草稿，核對後提交簽核。',
    uncertainCreate:
      '儲存結果尚未確認。請關閉表單，先在「我發起的」覈實是否已有草稿，避免重複申請。',
    duplicate: '該日期已有在途或已通過的加班申請。',
    inactive: '申請人須為在職員工。',
    configuration: '暫時無法提交簽核，請聯絡管理員檢查簽核期限設定。',
    invalid: '請檢查加班日期、時長、結算方式及事由。',
    schemaUnavailable: '加班資料結構尚未更新，暫時無法完成操作。請聯絡管理員。',
  },
};
