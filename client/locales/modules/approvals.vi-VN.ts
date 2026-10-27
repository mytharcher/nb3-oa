import registryLocale from '../../extensions/nocobase-approval-ui/locales/vi-VN.js';
import { approvalLocaleViVN as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: 'In / Lưu PDF',
    printFailed: 'In thất bại. Vui lòng thử lại.',
    saving: 'Đang lưu…',
    noAvailableAction: 'Hiện không có thao tác khả dụng',
    authz: {
      cancellation: 'Hủy nghỉ phép',
      section: 'Phê duyệt OA',
      leave: 'Đơn nghỉ phép',
      submit: 'Gửi yêu cầu của mình',
      delegate: 'Gửi yêu cầu thay nhân viên',
      view: 'Đọc yêu cầu',
      delegations: 'Ủy quyền phê duyệt',
      read: 'Đọc',
      update: 'Quản lý',
    },
    permissionSets: { delegations: 'Quản trị ủy quyền phê duyệt' },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'Nhập lý do cho thao tác này.',
    CLAIM_FIRST: 'Nhận tác vụ xử lý này trước khi ghi kết quả.',
    TASK_CLOSED:
      'Tác vụ này đã kết thúc. Làm mới yêu cầu và dùng thao tác hiện khả dụng.',
    ALREADY_ANSWERED:
      'Tác vụ này đã có phản hồi của bạn. Làm mới để xem kết quả đã ghi.',
    NOT_YOUR_TURN: 'Phê duyệt trước đó vẫn đang chờ. Hãy đợi đến lượt.',
    STALE: 'Phê duyệt đã thay đổi. Tải yêu cầu mới nhất trước khi tiếp tục.',
    CONTENT_CHANGED:
      'Nội dung đã xem đã thay đổi. Làm mới và xem lại trước khi thao tác.',
    STALE_CONTENT:
      'Nội dung đã xem đã thay đổi. Làm mới và xem lại trước khi thao tác.',
    INVALID_ANSWER:
      'Quyết định này không khả dụng ở giai đoạn hiện tại. Làm mới và chọn thao tác khả dụng.',
    NOT_ALLOWED:
      'Thao tác này không còn khả dụng. Làm mới và chọn thao tác hiện tại.',
    NO_ASSIGNEE:
      'Chưa gán người xử lý đủ điều kiện. Nhờ quản trị viên phê duyệt chỉ định.',
    NO_STAGE:
      'Không có giai đoạn phê duyệt đang hoạt động. Làm mới và nhờ quản trị viên kiểm tra yêu cầu.',
    ASSIGNMENT_LOOP:
      'Việc phân công lại này sẽ trả tác vụ về người xử lý trước. Chọn người nhận đủ điều kiện khác.',
  },
  businessErrorFields: '{{message}} Kiểm tra các trường: {{fields}}.',
  invalidFields: 'Kiểm tra các trường: {{fields}}.',
  fieldSeparator: ', ',
  businessErrors: {
    LEAVE_EMPLOYEE_INACTIVE:
      'Người nộp đơn cần có hồ sơ nhân viên đang làm việc và hoạt động. Nhờ HR kiểm tra hồ sơ và tài khoản liên kết.',
    LEAVE_HANDOVER_INACTIVE:
      'Người nhận bàn giao đã chọn hiện không khả dụng. Chọn người khác hoặc xóa lựa chọn nếu chưa bật ủy quyền phê duyệt.',
    LEAVE_MAX_DAYS:
      'Số ngày nghỉ vượt mức tối đa của loại nghỉ phép này. Rút ngắn thời gian.',
    LEAVE_NO_WORKDAYS:
      'Khoảng thời gian đã chọn không có nửa ngày làm việc nào. Điều chỉnh ngày.',
    LEAVE_TYPE_UNAVAILABLE:
      'Loại nghỉ phép này không khả dụng. Chọn loại đang bật.',
    LEAVE_DELEGATE_REQUIRED:
      'Chọn nhân viên đang hoạt động khác cho yêu cầu gửi thay.',
  },

  creationUnknown:
    'Chưa biết kết quả lưu. Thử lại cùng thao tác lưu hoặc kiểm tra bản nháp hiện có.',
  resubmit: 'Gửi lại',
  submitted: 'Đã gửi {{name}}',
  draftSavedSubmitFailed:
    'Đã lưu bản nháp. Gửi chưa hoàn tất. Khắc phục sự cố và thử lại.',
  submissionUnknown:
    'Chưa biết kết quả gửi. Thử lại Gửi với cùng nội dung trước khi thay đổi.',
  transfer: 'Chuyển giao',
  addSigner: 'Thêm người ký',
  urge: 'Nhắc nhở',
  recipientSearch: 'Tìm người nhận đủ điều kiện',
  moreRecipients: 'Tải thêm người nhận',
  signerMode: 'Chế độ người ký',
  signerbefore: 'Trước quyết định của tôi',
  signeralongside: 'Song song với quyết định của tôi',
  emptyTodoTitle: 'Không có phê duyệt đang chờ',
  emptyTodoDescription: 'Phê duyệt cần bạn xử lý sẽ hiển thị tại đây.',
  emptyDoneTitle: 'Không có phê duyệt đã hoàn tất',
  emptyDoneDescription: 'Phê duyệt bạn đã xử lý sẽ hiển thị tại đây.',
  emptyCopiedTitle: 'Không có phê duyệt được gửi bản sao',
  emptyCopiedDescription:
    'Yêu cầu được gửi bản sao cho bạn sẽ hiển thị tại đây.',
  emptyMineTitle: 'Chưa khởi tạo yêu cầu',
  emptyMineDescription: 'Hoàn thành yêu cầu và gửi hoặc lưu bản nháp.',
  calendarTimeZone: 'Ngày sử dụng lịch làm việc tại {{zone}}.',
  refreshAfterSuccess:
    'Thao tác thành công nhưng không thể tải chi tiết mới nhất. Làm mới và không lặp lại thao tác.',
  domainInvalid:
    'Yêu cầu chưa đáp ứng điều kiện nghiệp vụ. Kiểm tra loại nghỉ phép, ngày, người bàn giao và chi tiết yêu cầu.',
  confirmSubmit:
    'Gửi sẽ bắt đầu quy trình phê duyệt. Xác nhận chi tiết yêu cầu.',
  confirmWithdraw: 'Rút lại sẽ thoát quy trình phê duyệt hiện tại.',
  confirmReject: 'Từ chối sẽ kết thúc yêu cầu và quy trình phê duyệt.',
  confirmReturn:
    'Trả lại cho phép người yêu cầu chỉnh sửa. Gửi lại sẽ bắt đầu từ giai đoạn đầu.',
  confirmTerminate: 'Chấm dứt quản trị sẽ kết thúc quy trình phê duyệt này.',

  navigation: {
    center: 'Trung tâm tác vụ',
    delegations: 'Ủy quyền phê duyệt',
  },
  description: 'Xử lý tác vụ phê duyệt và theo dõi yêu cầu của bạn.',
  tabs: {
    todo: 'Cần làm',
    done: 'Hoàn tất',
    copied: 'Bản sao gửi tôi',
    mine: 'Yêu cầu của tôi',
  },
  newLeave: 'Đơn nghỉ phép mới',
  editLeave: 'Chỉnh sửa đơn nghỉ phép',
  draft: 'Bản nháp',
  search: 'Tìm theo mã tham chiếu hoặc người yêu cầu',
  clear: 'Xóa bộ lọc',
  all: 'Tất cả',
  noResults: 'Không có bản ghi phù hợp',
  emptyTitle: 'Chưa có yêu cầu',
  emptyDescription: 'Tác vụ phê duyệt và yêu cầu mới sẽ hiển thị tại đây.',
  refresh: 'Làm mới',
  loading: 'Đang tải',
  reference: 'Số yêu cầu',
  applicant: 'Người yêu cầu',
  type: 'Loại nghỉ phép',
  days: 'Số ngày',
  status: 'Trạng thái',
  createdAt: 'Thời điểm yêu cầu',
  actions: 'Thao tác cho "{{name}}"',
  detail: 'Xem',
  edit: 'Chỉnh sửa',
  saveDraft: 'Lưu bản nháp',
  save: 'Lưu',
  cancel: 'Hủy',
  close: 'Đóng',
  submit: 'Gửi',
  withdraw: 'Rút lại',
  terminate: 'Chấm dứt',
  read: 'Đánh dấu đã đọc',
  approve: 'Phê duyệt',
  reject: 'Từ chối',
  return: 'Trả lại',
  comment: 'Bình luận',
  appoint: 'Phân công',
  reassign: 'Phân công lại',
  reason: 'Lý do',
  opinion: 'Bình luận',
  person: 'Người phê duyệt',
  place: 'Vị trí chưa phân công',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  startHalf: 'Buổi bắt đầu',
  endHalf: 'Buổi kết thúc',
  am: 'Sáng',
  pm: 'Chiều',
  handover: 'Người bàn giao',
  delegate: 'Ủy quyền phê duyệt trong thời gian nghỉ',
  attachmentMissing:
    'Một số tệp đính kèm không khả dụng. Tải lại yêu cầu hoặc liên hệ người yêu cầu.',
  attachments: 'Tệp đính kèm',
  attachmentRequired:
    'Thêm tệp chứng minh bắt buộc của loại nghỉ phép đã chọn.',
  attachmentUnavailable:
    'Tạm thời không thể tải tệp đính kèm lên. Thử lại sau hoặc liên hệ quản trị viên.',
  attachmentInvalid:
    'Một số tệp đã chọn không hợp lệ hoặc không thuộc yêu cầu này. Tải lại yêu cầu và chọn lại.',
  attachmentLimit:
    'Tệp đính kèm: PDF, JPEG, PNG hoặc WebP, tối đa 5 MB mỗi tệp và 10 tệp. Bản nháp hợp lệ được lưu trước lần tải lên đầu tiên.',
  attachmentSize: 'Chọn tệp không rỗng tối đa 5 MB.',
  attachmentType: 'Chọn tệp PDF, JPEG, PNG hoặc WebP đúng định dạng.',
  attachmentCount: 'Cho phép tối đa 10 tệp đính kèm.',
  attachmentDenied:
    'Bạn không thể truy cập tệp đính kèm của yêu cầu này. Tải lại để kiểm tra quyền truy cập.',
  attachmentFailed:
    'Tải lên thất bại. Kiểm tra biểu mẫu và kết nối rồi chọn lại tệp.',
  attachmentUploading: 'Đang lưu bản nháp và tải lên…',
  attachmentRemove: 'Gỡ tệp đính kèm {{number}}',
  balanceInsufficient:
    'Số dư nghỉ phép khả dụng không đủ. Giảm số ngày hoặc liên hệ nhân sự.',
  balanceLimit: 'Nghỉ phép năm và nghỉ bù sẽ khả dụng khi có số dư nghỉ phép.',
  unavailable: 'Thao tác này không khả dụng. Kiểm tra điều kiện cản trở.',
  formDescription: 'Hoàn thành yêu cầu và gửi hoặc lưu bản nháp.',
  preview: 'Xem trước luồng phê duyệt',
  facts: 'Chi tiết yêu cầu',
  progress: 'Tiến độ phê duyệt',
  timeline: 'Lịch sử phê duyệt',
  saved: 'Đã lưu đơn nghỉ phép "{{name}}"',
  completed: '{{action}}: "{{name}}"',
  actionTitle: '{{action}} yêu cầu "{{name}}"',
  returnHint: 'Trả lại người yêu cầu; gửi lại bắt đầu từ giai đoạn đầu.',
  confirmDescription:
    'Thao tác này kết thúc tác vụ phê duyệt hiện tại. Xác nhận nội dung đã xem.',
  discard: 'Bỏ thay đổi?',
  discardDescription: 'Thay đổi chưa lưu sẽ bị mất.',
  discardConfirm: 'Bỏ thay đổi',
  readOnly: 'Bản ghi này chỉ đọc.',
  hrPreview: 'Với yêu cầu thay nhân viên, luồng được tính khi gửi.',
  dateRange: 'Ngày kết thúc không được trước ngày bắt đầu.',
  required: 'Nhập giá trị.',
  limit: 'Không quá 10.000 ký tự.',
  handoverRequired: 'Chọn người bàn giao để bật ủy quyền.',
  unknownPerson: 'Không có tên',
  yes: 'Có',
  no: 'Không',
  error: {
    invalid:
      'Nội dung hoặc thao tác chưa đáp ứng yêu cầu. Kiểm tra và điều chỉnh.',
    overlap:
      'Đã có đơn nghỉ phép đang xử lý hoặc đã duyệt trùng thời gian này. Điều chỉnh ngày.',
    configuration:
      'Cấu hình thời hạn phê duyệt hiện tại không được hỗ trợ. Liên hệ quản trị viên.',
    inactive:
      'Nhân viên bắt buộc không khả dụng. Kiểm tra trạng thái nhân viên.',

    failed: 'Yêu cầu thất bại. Vui lòng thử lại.',
    forbidden: 'Truy cập bị từ chối. Liên hệ quản trị viên.',
    notFound: 'Bản ghi không tồn tại hoặc đã bị xóa. Quay lại danh sách.',
    conflict: 'Yêu cầu đã thay đổi. Tải nội dung mới nhất trước khi thao tác.',
    stale: 'Tác vụ này đã đóng hoặc thao tác không còn khả dụng.',
  },
  loadLatest: 'Tải mới nhất',
  retry: 'Thử lại',
  states: {
    draft: 'Bản nháp',
    revision: 'Cần chỉnh sửa',
    manager: 'Quản lý xem xét',
    head: 'Trưởng phòng xem xét',
    hr: 'Nhân sự xem xét',
    approved: 'Đã phê duyệt',
    rejected: 'Đã từ chối',
    withdrawn: 'Đã rút lại',
    terminated: 'Đã chấm dứt',
  },
  stages: {
    manager: 'Quản lý trực tiếp',
    head: 'Trưởng phòng',
    hr: 'Nhân sự',
    revision: 'Người yêu cầu chỉnh sửa',
  },
  delegations: {
    create: 'Tạo',
    description:
      'Cho phép người được ủy quyền xử lý phê duyệt trong khoảng thời gian chỉ định.',
    new: 'Ủy quyền mới',
    edit: 'Chỉnh sửa ủy quyền',
    disable: 'Tắt',
    principal: 'Người ủy quyền',
    delegate: 'Người được ủy quyền',
    scope: 'Phạm vi',
    from: 'Bắt đầu',
    to: 'Kết thúc',
    source: 'Nguồn',
    active: 'Đang hoạt động',
    inactive: 'Không hoạt động',
    manual: 'Thủ công',
    leave: 'Nghỉ phép',
    search: 'Tìm theo người ủy quyền hoặc người được ủy quyền',
    sourceLeave: 'Được tạo từ nghỉ phép. Quản lý qua yêu cầu liên quan.',
    invalid:
      'Chọn hai nhân viên đang hoạt động khác nhau và thời điểm kết thúc sau bắt đầu.',
    overlap:
      'Đã có ủy quyền bao phủ phạm vi và thời gian này. Điều chỉnh thời gian hoặc phạm vi.',
    disableTitle: 'Tắt ủy quyền từ "{{principal}}" cho "{{delegate}}"?',
    disableDescription:
      'Người được ủy quyền sẽ không còn xử lý phê duyệt trong phạm vi này.',
    saved: 'Đã lưu ủy quyền cho "{{name}}"',
    empty: 'Chưa có ủy quyền phê duyệt',
    emptyDescription:
      'Tạo ủy quyền để người khác xử lý phê duyệt trong một khoảng thời gian.',
    timeZone: 'Thời gian theo {{zone}}. Không bao gồm thời điểm kết thúc.',
  },
  typeUnavailable: 'Loại nghỉ phép không khả dụng',
  noPickerPermission:
    'Chọn người cần quyền đọc người dùng. Liên hệ quản trị viên.',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: 'Bản ghi của tôi',
      readableScope: 'Yêu cầu phê duyệt có thể đọc',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'Tất cả phê duyệt',
      leaveScope: 'Phê duyệt nghỉ phép',
      fromTime: 'Giờ bắt đầu (HH:mm)',
      toTime: 'Giờ kết thúc (HH:mm)',
      timeInvalid: 'Chọn ngày và nhập giờ hợp lệ theo định dạng 24 giờ.',
      disabled: 'Đã tắt ủy quyền phê duyệt cho "{{name}}"',
      readOnly: 'Ủy quyền này chỉ đọc.',
    },
  },
};
