export default {
  attendanceChange: {
    authz: { resource: '打刻修正' },
    navigation: '打刻修正',
    new: '新しい打刻修正',
    edit: '打刻修正を編集',
    emptyMissing:
      '対象となる打刻漏れがありません。取り込んだ勤怠証拠が誤っている場合は人事にお問い合わせください。',
    uploadAfterDraft:
      '下書きを保存し、編集画面で証拠をアップロードしてください。',
    formDescription:
      '証拠を確認して審査に提出するか、下書きを保存してください。',
    description: '上司の審査用に打刻漏れの時刻と証拠を提出してください。',
    date: '打刻漏れの日付',
    original: '元の打刻漏れ',
    correctionAt: '修正後の打刻時刻',
    proof: '証拠説明',
    attachments: '証拠添付ファイル',
    punchKinds: { in: '出勤', out: '退勤' },
    missing: '打刻漏れを選択',
    policyHint:
      '打刻漏れは7暦日以内に限ります。保留中と承認済みの申請は月間上限に含まれます。',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        '打刻漏れレコードが変更されました。更新して選び直してください。',
      ATTENDANCE_CHANGE_TOO_OLD:
        '提出できるのは7暦日以内の打刻漏れのみです。以前の記録は人事にお問い合わせください。',
      ATTENDANCE_CHANGE_INVALID_TIME:
        '修正時刻は打刻漏れ当日で、未来にできません。',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        '保留中と承認済みの修正が月間上限に達しています。',
      ATTENDANCE_CHANGE_DUPLICATE:
        'この打刻漏れには保留中または承認済みの修正があります。',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        '証拠説明を入力するか証拠をアップロードしてください。',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        '申請者は在籍中の従業員である必要があります。人事に従業員記録の確認を依頼してください。',
      ATTENDANCE_CHANGE_REASON_REQUIRED: '修正理由を入力してください。',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        '承認を提出できません。管理者に承認期限の確認を依頼してください。',
      ATTENDANCE_CHANGE_FILE_SIZE:
        '添付ファイルは空でなく、5 MB以下にしてください。',
      ATTENDANCE_CHANGE_FILE_TYPE:
        '内容と形式が一致するPDF、JPEG、PNG、WebPファイルを使用してください。',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'この証拠を閲覧またはアップロードする権限がありません。',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        '添付リンクが無効です。この下書きにアップロードした証拠を選択してください。',
      ATTENDANCE_BASELINE_CHANGED:
        '元の勤怠証拠が変更されました。承認をロールバックしました。更新して確認してください。',
    },
  },
};
