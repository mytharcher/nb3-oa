import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Thông báo',
    logs: 'Nhật ký thông báo',
  },
  logs: {
    retry: 'Thử lại',
    limitNotice:
      'Chỉ hiển thị {{count}} thông báo mới nhất; tổng số tính trên các bản ghi này.',
    deliveryOperations: 'Vận hành gửi thông báo',
    recipeDescription:
      'Theo dõi từng lần chuyển giao qua kênh và lần thử của nhà cung cấp.',
    redacted: 'Nội dung, người nhận và mã thuê được che giấu.',
    providerAttempts: 'Lần thử của nhà cung cấp',

    eyebrow: 'Thông báo',
    title: 'Nhật ký thông báo',
    description:
      'Theo dõi việc gửi thông báo và từng lần thử của nhà cung cấp. Nội dung, người nhận và mã thuê được che giấu.',
    refreshing: 'Đang làm mới…',
    refresh: 'Làm mới',
    deliveriesShown: 'Lượt gửi hiển thị',
    needAttention: 'Cần chú ý',
    unavailable: 'Nhật ký không khả dụng',
    recent: 'Thông báo gần đây',
    loading: 'Đang tải lịch sử gửi…',
    emptyTitle: 'Chưa có lượt gửi',
    emptyDescription: 'Bản ghi gửi sẽ hiển thị tại đây sau khi gửi thông báo.',
    expand: 'Mở rộng thông báo',
    collapse: 'Thu gọn thông báo',
    noDeliveries: 'Chưa ghi nhận lượt gửi.',
    noAttempts: 'Chưa ghi nhận lần thử.',
    columns: {
      source: 'Nguồn',
      notificationId: 'ID thông báo',
      status: 'Trạng thái',
      deliveries: 'Lượt gửi',
      created: 'Đã tạo',
      channel: 'Kênh',
      provider: 'Nhà cung cấp',
      attempts: 'Lần thử',
      updated: 'Đã cập nhật',
    },
  },
  status: {
    pending: 'Đang chờ',
    processing: 'Đang xử lý',
    completed: 'Đã hoàn thành',
    partial: 'Một phần',
    failed: 'Thất bại',
    unknown: 'Không xác định',
    preparing: 'Đang chuẩn bị',
    submitting: 'Đang gửi',
    retrying: 'Đang thử lại',
    accepted: 'Đã tiếp nhận',
  },
  errors: {
    forbidden: 'Quyền truy cập đã bị gỡ. Hãy liên hệ quản trị viên.',
    notFound: 'Các bản ghi này không khả dụng. Hãy quay lại bàn làm việc.',
    providerFailed:
      'Gửi thất bại. Kiểm tra thiết lập kênh hoặc liên hệ quản trị viên.',
    requestFailed: 'Yêu cầu thông báo thất bại.',
    inAppRecipientNotFound:
      'Người nhận thông báo trong ứng dụng không tồn tại.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
