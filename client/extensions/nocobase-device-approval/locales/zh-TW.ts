import type { DeviceApprovalLocale } from './en-US.js';

const zhTW: DeviceApprovalLocale = {
  'deviceApproval.title': '授權裝置',
  'deviceApproval.description':
    '一個命令行或其他裝置請求以你的身分登入。只有在登入是你自己發起的時候才批准。',
  'deviceApproval.enterCode': '輸入裝置上顯示的程式碼。',
  'deviceApproval.codeLabel': '程式碼',
  'deviceApproval.continue': '繼續',
  'deviceApproval.checking': '正在檢查程式碼…',
  'deviceApproval.confirm': '確認此程式碼與裝置上顯示的一致。',
  'deviceApproval.client': '由 {{client}} 發起',
  'deviceApproval.approve': '批准',
  'deviceApproval.approving': '正在批准…',
  'deviceApproval.deny': '拒絕',
  'deviceApproval.denying': '正在拒絕…',
  'deviceApproval.approved': '裝置已批准。回到終端機繼續操作，可以關閉此頁面。',
  'deviceApproval.denied': '已拒絕請求，裝置沒有登入。可以關閉此頁面。',
  'deviceApproval.expired': '此程式碼已過期。請在裝置上重新發起登入。',
  'deviceApproval.invalid': '此程式碼無效。請對照裝置上的程式碼重試。',
  'deviceApproval.notYours': '此程式碼已由另一個帳號處理。',
  'deviceApproval.error': '出了點問題，請重試。',
  'deviceApproval.retry': '重試',
  'deviceApproval.otherCode': '輸入其他程式碼',
};

export default zhTW;
