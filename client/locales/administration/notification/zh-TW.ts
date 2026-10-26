import type { NotificationResource } from './en-US.js';

const zhTW: NotificationResource = {
  nav: {
    notifications: '通知',
    logs: '通知日誌',
  },
  logs: {
    retry: '重試',
    limitNotice: '僅顯示最新 {{count}} 條通知，統計僅涵蓋這些記錄。',
    deliveryOperations: '投遞操作',
    recipeDescription: '跟蹤各管道的交接和服務提供方的每次嘗試。',
    redacted: '訊息正文、接收者和租約權杖已隱去。',
    providerAttempts: '服務提供方嘗試記錄',

    eyebrow: '通知',
    title: '通知日誌',
    description:
      '追蹤通知投遞及每一次服務商嘗試。訊息正文、收件者和租約權杖均已脫敏。',
    refreshing: '正在重新整理…',
    refresh: '重新整理',
    deliveriesShown: '目前投遞數',
    needAttention: '需要關注',
    unavailable: '通知日誌不可用',
    recent: '最近通知',
    loading: '正在載入投遞記錄…',
    emptyTitle: '暫無投遞記錄',
    emptyDescription: '傳送通知後，投遞記錄會顯示在這裡。',
    expand: '展開通知',
    collapse: '收起通知',
    noDeliveries: '暫無投遞記錄。',
    noAttempts: '暫無嘗試記錄。',
    columns: {
      source: '來源',
      notificationId: '通知 ID',
      status: '狀態',
      deliveries: '投遞',
      created: '建立時間',
      channel: '管道',
      provider: '服務商',
      attempts: '嘗試',
      updated: '更新時間',
    },
  },
  status: {
    pending: '等待中',
    processing: '處理中',
    completed: '已完成',
    partial: '部分完成',
    failed: '失敗',
    unknown: '狀態未知',
    preparing: '準備中',
    submitting: '提交中',
    retrying: '重試中',
    accepted: '已受理',
  },
  errors: {
    forbidden: '您已無權查看這些記錄，請聯絡管理員。',
    notFound: '記錄不可用，請返回工作台。',
    providerFailed: '傳送失敗，請檢查通知管道設定或聯絡管理員。',
    requestFailed: '通知請求失敗。',
    inAppRecipientNotFound: '站內信接收使用者不存在。',
  },
};

export default zhTW;
