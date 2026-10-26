export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: '原始出勤證據格式無效。',
      ATTENDANCE_INVALID_TIME: '打卡時間必須屬於公司時區出勤日期。',
      ATTENDANCE_INVALID_BATCH: '請提供1–1000行且不超過證據大小限制。',
      ATTENDANCE_SOURCE_CONFLICT: '來源鍵已對應不同的不可變證據。',
      ATTENDANCE_IDENTITY_UNAVAILABLE: '每行必須對應具有員工檔案的真實人員。',

      NOT_FOUND: '此班次已不存在。',
      ACCESS_DENIED: '無權訪問或修改此出勤設定。',
      ATTENDANCE_ACCESS_DENIED: '目前記錄或欄位權限不允許此變更。',
      ATTENDANCE_VERSION_CONFLICT: '設定已被修改，請重新載入後再儲存。',
      ATTENDANCE_SHIFT_INVALID: '請輸入有效且明確的班次設定。',
      ATTENDANCE_SHIFT_NOT_FOUND: '班次不存在或已停用。',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: '班次程式碼建立後不可修改。',
      ATTENDANCE_SHIFT_CODE_CONFLICT: '此班次程式碼已存在。',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED: '請使用目前公司時區的班次版本。',
      ATTENDANCE_SCHEDULE_INVALID: '請選擇有效日期並明確指定班次或休息日。',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: '此部門不可用。',
      ATTENDANCE_SCHEDULE_NOT_READABLE: '無權讀取目前排班版本。',
      ATTENDANCE_LIST_INVALID: '分頁參數無效。',
      ATTENDANCE_LOCAL_TIME_INVALID:
        '此本地時間因夏令時不存在或重複，請選擇明確的時間邊界。',
    },
    authz: {
      importResource: '原始出勤匯入',
      ingest: '匯入不可變證據',
      attendanceRecords: '原始出勤記錄',

      resource: '出勤設定',
      view: '查看出勤設定',
      manage: '管理出勤設定',
      attendanceShifts: '出勤班次',
      attendanceShiftRevisions: '班次版本',
      attendanceSchedules: '部門排班',
      attendanceScheduleRevisions: '排班版本',
    },
  },
};
