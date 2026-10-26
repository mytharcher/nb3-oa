export default {
  general: {
    authz: {
      resource: '一般申請',
      submit: '自分の一般申請を提出',
      delegate: '従業員の代理で一般申請を提出',
      view: '一般申請を閲覧',
    },
    navigation: '一般申請',
    new: '新しい一般申請',
    edit: '一般申請を編集',
    title: 'タイトル',
    body: '申請詳細',
    extraApprovers: '追加承認者',
    extraStage: '追加審査',
    extraHint: '1～3人を選択してください。上司の後にこの順で審査します。',
    addApprover: '承認者を追加',
    removeApprover: '承認者{{number}}を削除',
    approver: '追加承認者{{number}}',
    formDescription: '他の申請種類で扱わない案件を記述してください。',
    approversInvalid: '申請者以外の有効な人を重複なく1～3人選択してください。',
    invalid: '許容文字数内でタイトルと申請内容を入力してください。',
    inactive: '申請者は在籍中の従業員である必要があります。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    uncertainCreate:
      '保存結果が不明です。閉じて「自分の申請」を確認してから別の下書きを作成してください。',
    attachmentInvalid: '一部の添付ファイルはこの申請に属していません。',
    attachmentDenied: 'これらの添付ファイルにアクセスできません。',
    attachmentType:
      '形式が一致するPDF、JPEG、PNG、WebPファイルを使用してください。',
    attachmentSize: '添付ファイルは空でなく、5 MB以下にしてください。',
  },
};
