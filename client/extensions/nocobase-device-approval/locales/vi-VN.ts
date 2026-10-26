/** Every key the device approval looks up, so each locale is checked against the same list. */
export interface DeviceApprovalLocale {
  readonly 'deviceApproval.title': string;
  readonly 'deviceApproval.description': string;
  readonly 'deviceApproval.enterCode': string;
  readonly 'deviceApproval.codeLabel': string;
  readonly 'deviceApproval.continue': string;
  readonly 'deviceApproval.checking': string;
  readonly 'deviceApproval.confirm': string;
  readonly 'deviceApproval.client': string;
  readonly 'deviceApproval.approve': string;
  readonly 'deviceApproval.approving': string;
  readonly 'deviceApproval.deny': string;
  readonly 'deviceApproval.denying': string;
  readonly 'deviceApproval.approved': string;
  readonly 'deviceApproval.denied': string;
  readonly 'deviceApproval.expired': string;
  readonly 'deviceApproval.invalid': string;
  readonly 'deviceApproval.notYours': string;
  readonly 'deviceApproval.error': string;
  readonly 'deviceApproval.retry': string;
  readonly 'deviceApproval.otherCode': string;
}

const enUS: DeviceApprovalLocale = {
  'deviceApproval.title': 'Cấp quyền thiết bị',
  'deviceApproval.description':
    'Dòng lệnh hoặc thiết bị khác yêu cầu đăng nhập dưới danh nghĩa bạn. Chỉ duyệt nếu chính bạn bắt đầu đăng nhập.',
  'deviceApproval.enterCode': 'Nhập mã hiển thị trên thiết bị.',
  'deviceApproval.codeLabel': 'Mã',
  'deviceApproval.continue': 'Tiếp tục',
  'deviceApproval.checking': 'Đang kiểm tra mã…',
  'deviceApproval.confirm': 'Kiểm tra mã này khớp mã trên thiết bị.',
  'deviceApproval.client': 'Yêu cầu bởi {{client}}',
  'deviceApproval.approve': 'Phê duyệt',
  'deviceApproval.approving': 'Đang phê duyệt…',
  'deviceApproval.deny': 'Từ chối',
  'deviceApproval.denying': 'Đang từ chối…',
  'deviceApproval.approved':
    'Đã duyệt thiết bị. Quay lại cửa sổ dòng lệnh để tiếp tục; bạn có thể đóng trang này.',
  'deviceApproval.denied':
    'Đã từ chối yêu cầu. Thiết bị chưa được đăng nhập; bạn có thể đóng trang này.',
  'deviceApproval.expired':
    'Mã đã hết hạn. Bắt đầu đăng nhập lại trên thiết bị.',
  'deviceApproval.invalid':
    'Mã không hợp lệ. Đối chiếu với thiết bị và thử lại.',
  'deviceApproval.notYours': 'Mã đang được tài khoản khác phê duyệt.',
  'deviceApproval.error': 'Đã xảy ra lỗi. Thử lại.',
  'deviceApproval.retry': 'Thử lại',
  'deviceApproval.otherCode': 'Nhập mã khác',
};

export default enUS;
