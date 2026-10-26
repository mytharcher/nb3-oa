export default {
  outings: {
    authz: { resource: '外出申請' },
    navigation: '外出申請',
    new: '新增外出申請',
    edit: '編輯外出申請',
    formDescription: '核對時段後提交簽核，也可儲存為草稿。',
    description: '登記外出時段、地點和事由，提交直屬上層簽核。',
    startAt: '開始時間',
    endAt: '結束時間',
    location: '外出地點',
    reason: '外出事由',
    timeZone: '時間按 {{zone}} 記錄',
    policyHint: '時段開始後不能撤回，只能由直屬上層說明原因終止。',
    nonexistentTime: '時鐘切換導致此本地時間不存在，請選擇其他時間。',
    daylightSavingPolicy:
      '若時鐘切換導致本地時間重複，按第一次出現的時間記錄。',
    errors: {
      OUTING_EMPLOYEE_INACTIVE: '申請人須為在職員工，請聯絡 HR 核對。',
      OUTING_INVALID_PERIOD: '結束時間須晚於開始時間，請檢查外出時段。',
      OUTING_REQUIRED_FIELDS: '請填寫外出地點和事由。',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        '暫時無法提交簽核，請聯絡管理員檢查簽核期限設定。',
      ATTENDANCE_ACTIVITY_CHANGED: '出勤事實已變化，請重新整理後重新核對。',
    },
  },
};
