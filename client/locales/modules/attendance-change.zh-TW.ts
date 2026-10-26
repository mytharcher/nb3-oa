export default {
  attendanceChange: {
    authz: { resource: '補卡申請' },
    navigation: '補卡申請',
    new: '新增補卡申請',
    edit: '編輯補卡申請',
    emptyMissing: '沒有可補卡的缺卡記錄；若匯入出勤有誤，請聯絡 HR。',
    uploadAfterDraft: '先儲存草稿，再從編輯頁上傳證明附件。',
    formDescription: '核對證明後提交簽核，也可儲存為草稿。',
    description: '為缺卡記錄補充時間和證明，並提交直屬上層簽核。',
    date: '缺卡日期',
    original: '原缺卡記錄',
    correctionAt: '補卡時間',
    proof: '證明說明',
    attachments: '證明附件',
    punchKinds: { in: '上班', out: '下班' },
    missing: '選擇缺卡記錄',
    policyHint: '缺卡日期須在七個自然日內；當月在途及已通過申請計入補卡限額。',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        '原缺卡記錄已變化，請重新整理並重新選擇記錄。',
      ATTENDANCE_CHANGE_TOO_OLD:
        '僅可申請七個自然日內的缺卡，請聯絡 HR 處理更早的記錄。',
      ATTENDANCE_CHANGE_INVALID_TIME: '補卡時間須在缺卡當天，且不能晚於現在。',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT: '當月在途及已通過的補卡已達到限額。',
      ATTENDANCE_CHANGE_DUPLICATE: '該缺卡記錄已有在途或已通過的補卡申請。',
      ATTENDANCE_CHANGE_PROOF_REQUIRED: '請填寫證明說明或上傳證明附件。',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        '申請人須為在職員工，請聯絡 HR 核對檔案。',
      ATTENDANCE_CHANGE_REASON_REQUIRED: '請填寫補卡原因。',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        '暫時無法提交簽核，請聯絡管理員檢查簽核期限設定。',
      ATTENDANCE_CHANGE_FILE_SIZE: '附件不能為空且不超過 5 MB。',
      ATTENDANCE_CHANGE_FILE_TYPE:
        '僅支援內容與格式一致的 PDF、JPEG、PNG 和 WebP 附件。',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED: '沒有查看或上傳此證明附件的權限。',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        '附件關聯無效，請重新選擇目前草稿上傳的證明附件。',
      ATTENDANCE_BASELINE_CHANGED:
        '原出勤證據已變化，本次簽核未生效。請重新整理後核對。',
    },
  },
};
