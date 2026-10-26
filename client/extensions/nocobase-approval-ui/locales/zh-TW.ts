import type { ApprovalUiLocale } from './en-US.js';

const zhTW: ApprovalUiLocale = {
  approvalUi: {
    timeline: {
      onBehalf: '代 {{name}}',
      showEvents: '具體變化（{{count}}）',
      system: '{{count}} 條系統記錄',
      empty: '還沒有任何記錄。',
    },
    progress: {
      empty: '尚未發起簽核。',
      copies: '抄送給',
      read: '已讀',
      unread: '未讀',
      step: {
        current: '處理中',
        rejected: '已駁回',
        returned: '已退回',
        ended: '已結束',
        skipped: '已跳過',
      },
      tally: {
        answered: '已答復 {{count}}/{{total}}',
        needed: '需 {{count}} 票通過',
      },
    },
    branches: {
      done: '已完成 {{count}}/{{total}}',
      blocked: '正在阻塞整個申請',
    },
    receipts: {
      read: '已讀',
      confirmed: '已確認',
      empty: '還沒有人收到。',
    },
    preview: {
      title: '誰來簽核',
      loading: '正在計算簽核路徑…',
      submit: '提交',
      finished: '完成',
      automatic: '無需簽核直接通過',
      parallel: '並行',
      optional: '可選',
      nobody: '暫無合適人選',
      none: '此申請不經過簽核。',
      skipped: '無需經過：{{stages}}',
    },
    actions: {
      more: '更多',
      all: '操作',
      admin: '管理',
      confirm: '確定要{{action}}嗎？',
      loading: '載入中…',
      loadFailed: '載入失敗，請關閉後重試。',
      cancel: '取消',
    },
  },
};

export default zhTW;
