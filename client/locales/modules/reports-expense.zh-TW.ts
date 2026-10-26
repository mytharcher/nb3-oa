export default {
  reportsExpense: {
    firstPage: '返回第一頁',

    pageEmpty: '本頁暫無費用彙總',
    pageEmptyHint:
      '目前來源的彙總數量已減少，請返回第一頁或點選上一頁查看有資料的頁面。',

    exportStarted: 'Excel 下載已開始',
    reloading: '正在重新整理，目前篩選載入完成前顯示上次結果。',
    exportLock: '正在匯出，下載完成前暫不可調整篩選與翻頁。',

    title: '已結算費用月彙總',
    description: '按原費用日期與分類統計已結算費用毛額，非淨現金實付。',
    month: '費用月份（1–12，可留空）',
    effectiveYear: '公司行事曆年度：{{year}}',
    sourceNotice:
      '最多核對 10,000 條獲權的已結算申請。調整年度或月份不會減少來源掃描。',
    precondition:
      '結算證據無法核驗或已超過報表限額，請聯絡管理員檢查來源證據與報表規模。',
    forbidden: '無權讀取目前費用報銷來源，請聯絡管理員核對來源權限。',
    empty: '本年度暫無已結算費用',
    emptyHint:
      '僅統計獲權且結算證據完整的申請。請檢查年度與月份，或聯絡管理員核對來源權限。',
    fields: {
      year: '年度',
      month: '費用月份',
      category: '費用分類程式碼',
      settledRequestCount: '已結算申請數',
      settledExpenseCents: '已結算費用毛額（元，非現金實付）',
    },
  },
};
