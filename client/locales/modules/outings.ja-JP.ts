export default {
  outings: {
    authz: { resource: '外出申請' },
    navigation: '外出申請',
    new: '新しい外出申請',
    edit: '外出申請を編集',
    formDescription:
      '期間を確認して審査に提出するか、下書きを保存してください。',
    description: '上司の審査用に外出の期間、場所、目的を記録します。',
    startAt: '開始時刻',
    endAt: '終了時刻',
    location: '場所',
    reason: '目的',
    timeZone: '時刻は{{zone}}で記録されます',
    policyHint: '外出開始後は上司のみが理由付きで終了できます。',
    nonexistentTime:
      '時計の変更によりこの現地時刻は存在しません。別の時刻を選択してください。',
    daylightSavingPolicy:
      '時計の変更で時刻が重複する場合、先の時点を使用します。',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        '申請者は在籍中の従業員である必要があります。人事に従業員記録の確認を依頼してください。',
      OUTING_INVALID_PERIOD:
        '終了は開始より後にしてください。外出期間を確認してください。',
      OUTING_REQUIRED_FIELDS: '場所と目的を入力してください。',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        '承認を提出できません。管理者に承認期限の確認を依頼してください。',
      ATTENDANCE_ACTIVITY_CHANGED:
        '勤怠情報が変更されました。更新して確認してください。',
    },
  },
};
