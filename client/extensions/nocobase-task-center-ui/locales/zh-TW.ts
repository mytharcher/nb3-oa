import type { TaskCenterUiLocale } from './en-US.js';

const zhTW: TaskCenterUiLocale = {
  taskCenterUi: {
    nav: {
      label: '待辦來源',
      search: '搜尋事項類型',
      noMatches: '沒有匹配的事項類型',
      clearSearch: '清除搜尋',
      expand: '展開{{name}}',
      collapse: '收起{{name}}',
      subjects: '{{name}}的事項類型',
      pending: '{{count}} 項待辦',
    },
    tabs: {
      pending: '待辦',
      closed: '已結',
      all: '全部',
    },
    groups: {
      today: '今天',
      yesterday: '昨天',
      earlier: '更早',
    },
    time: {
      received: '{{time}}',
      closed: '{{time}}結束',
    },
    selection: {
      select: '選擇「{{name}}」',
      lockedTask: '「{{name}}」不可選：已選擇{{type}}，只能同時選擇同類事項',
      otherType: '已選擇{{type}}，只能同時選擇同類事項',
      unsupportedTask: '「{{name}}」不支援批次處理',
      unsupported: '此類事項需逐項處理',
    },
    bulk: {
      label: '批次操作',
      selected: '已選 {{count}} 項',
      clear: '取消選擇',
      cancel: '取消',
      skipped: '另有 {{count}} 項不支援此操作，將保持不變。',
    },
    empty: {
      pending: {
        title: '都處理完了',
        description: '這裡沒有等你處理的事項。',
      },
      closed: {
        title: '還沒有已結事項',
        description: '處理完成或被取消的事項會出現在這裡。',
      },
      all: {
        title: '暫無事項',
        description: '此類事項到達後會出現在這裡。',
      },
      showAll: '查看全部',
    },
    loading: '正在載入事項',
    pagination: {
      label: '分頁',
      summary: '第 {{page}}/{{pages}} 頁，共 {{total}} 項',
      previous: '上一頁',
      next: '下一頁',
    },
  },
};

export default zhTW;
