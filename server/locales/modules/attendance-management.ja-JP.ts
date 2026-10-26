export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: '元の勤怠証拠が不正です。',
      ATTENDANCE_INVALID_TIME: '打刻は会社の勤怠日付に属する必要があります。',
      ATTENDANCE_INVALID_BATCH:
        '証拠サイズ上限内で1～1000行を指定してください。',
      ATTENDANCE_SOURCE_CONFLICT:
        'ソースキーが異なる変更不可の証拠を識別しています。',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        '各行には従業員記録のある実在の人が必要です。',

      NOT_FOUND: 'このシフトは存在しません。',
      ACCESS_DENIED: 'この勤怠設定へのアクセス権がありません。',
      ATTENDANCE_ACCESS_DENIED:
        '現在のレコード権限またはフィールド権限ではこの変更は許可されません。',
      ATTENDANCE_VERSION_CONFLICT:
        '設定が変更されました。保存前に再読み込みしてください。',
      ATTENDANCE_SHIFT_INVALID: '有効な明示的シフト定義を入力してください。',
      ATTENDANCE_SHIFT_NOT_FOUND: 'シフトが存在しないか無効です。',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: 'シフトコードは変更できません。',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'このシフトコードは既に存在します。',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        '現在の会社タイムゾーンのリビジョンを使用してください。',
      ATTENDANCE_SCHEDULE_INVALID:
        '実在する日付と明示的なシフトまたは休日を選択してください。',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'この部署は利用できません。',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        '現在の勤務予定リビジョンを読み取れません。',
      ATTENDANCE_LIST_INVALID: 'ページのパラメーターが不正です。',
      ATTENDANCE_LOCAL_TIME_INVALID:
        '夏時間により現地時刻が存在しないか重複しています。一意に決まる境界を選択してください。',
    },
    authz: {
      importResource: '元勤怠インポート',
      ingest: '変更不可の証拠をインポート',
      attendanceRecords: '元勤怠レコード',

      resource: '勤怠設定',
      view: '勤怠設定を閲覧',
      manage: '勤怠設定を管理',
      attendanceShifts: '勤怠シフト',
      attendanceShiftRevisions: 'シフトリビジョン',
      attendanceSchedules: '部署の勤務予定',
      attendanceScheduleRevisions: '勤務予定リビジョン',
    },
  },
};
