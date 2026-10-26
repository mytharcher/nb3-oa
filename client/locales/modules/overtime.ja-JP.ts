export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE: '有効な時間外勤務日を選択してください。',
    },

    authz: { resource: '時間外勤務申請' },
    navigation: '時間外勤務申請',
    description: '時間外勤務を申請し、承認と精算を確認します。',
    new: '新しい時間外勤務申請',
    edit: '時間外勤務申請を編集',
    date: '時間外勤務日',
    minutes: '時間（分）',
    monthlyMinutes: '月間合計（分）',
    settlement: '精算',
    compensatory: '代休',
    pay: '時間外勤務手当',
    durationInvalid: '1～1440分の整数を入力してください。',
    formDescription: '申請を確認して提出するか、下書きを保存してください。',
    policyHint:
      '1日1件です。事後申請は人事審査が必要です。代休は最終承認後に精算されます。',
    emptyDescription:
      '時間外勤務申請を完成して提出するか、下書きを保存してください。',
    uncertainCreate:
      '保存結果が不明です。閉じて「自分の申請」を確認してから別の下書きを作成してください。',
    duplicate: 'この日には進行中または承認済みの時間外勤務申請があります。',
    inactive: '申請者は在籍中の従業員である必要があります。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    invalid: '勤務日、時間、精算方法、理由を確認してください。',
    schemaUnavailable:
      '時間外勤務のDBスキーマ更新が必要です。まだ操作を完了できません。管理者にお問い合わせください。',
  },
};
