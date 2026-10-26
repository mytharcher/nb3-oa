export default {
  leaveCancellations: {
    new: '發起銷假',
    edit: '編輯銷假',
    navigation: '銷假',
    description: '取消尚未開始的已批假期並跟蹤確認進度。',
    formDescription: '核對銷假內容後提交給原簽核人確認，也可儲存為草稿。',
    original: '原請假單',
    chooseOriginal: '選擇本人已批請假',
    mode: '銷假方式',
    all: '整單取消',
    shorten: '提前結束',
    actualEnd: '實際結束日期',
    endHalf: '結束半天',
    originalRange: '目前已批期間',
    refunded: '退還天數',
    sourceRange: '{{name}}：{{start}} 至 {{end}}（{{zone}}）',
    noOriginals: '暫無可銷假的已批請假單。',
    policyHint:
      '只能取消尚未開始的半天。原第一環節簽核人須在待取消半天開始前確認；通過後同步退還餘額、修正出勤並失效原單簽核委託。',
    uncertainCreate:
      '儲存結果尚不確定，請關閉表單並查看「我的申請」，確認後再建立新的草稿。',
    invalidOriginal: '請選擇本人已批准、尚未整單取消的請假單。',
    noRemainder: '該請假單已整單取消。',
    invalidRange:
      '請選擇目前請假期間內更早的結束日，待取消的半天不得已經開始。',
    alreadyStarted: '已開始的半天不可取消。',
    noWorkdays: '此次修改沒有可退還的工作半天。',
    changed: '原請假有效期間已變化，請退回修改並重新提交銷假。',
    inactive: '員工檔案暫不可用。',
    invalid: '請檢查原請假單、銷假期間和理由。',
    emptyDescription: '選擇已批請假單，建立銷假草稿。',
  },
};
