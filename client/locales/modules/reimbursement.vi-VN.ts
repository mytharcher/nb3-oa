import actionCopy from './reimbursement-actions.vi-VN.js';
import formCopy from './reimbursement-forms.vi-VN.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: 'Bản ghi liên quan không khả dụng',
    categoryUnavailable: 'Danh mục không khả dụng',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        'Mỗi dòng chi phí phải có số tiền dương trong phạm vi hỗ trợ.',
      REIMBURSEMENT_INVALID_LINE_DATE: 'Chọn ngày chi phí hợp lệ cho mỗi dòng.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        'Nhập số chứng từ trước khi xác nhận thanh toán.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        'Nhập lý do và xác nhận đúng tổng hoàn chi phí, bù trừ tạm ứng và tiền mặt.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        'Nhập lý do không thể hoàn tất thanh toán.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        'Tài khoản thanh toán đã thay đổi. Tải tài khoản mới nhất trước khi sửa.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        'Hạn mức đã duyệt thay đổi. Làm mới và kiểm tra tổng hoàn chi phí.',
      REIMBURSEMENT_INVOICES_CHANGED:
        'Chứng minh hóa đơn thay đổi. Làm mới yêu cầu và chọn lại hóa đơn khả dụng.',
      REIMBURSEMENT_LOAN_CHANGED:
        'Bù trừ tạm ứng đã thay đổi. Làm mới khoản tạm ứng và xác nhận số tiền bù trừ.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        'Tổng chi phí vượt số tiền hỗ trợ. Giảm tổng hoặc tách yêu cầu.',
      REIMBURSEMENT_FILE_SIZE: 'Chọn tệp đính kèm không rỗng tối đa 5 MB.',
      REIMBURSEMENT_FILE_TYPE:
        'Tải tệp PDF, JPEG, PNG hoặc WebP có loại tệp phù hợp.',
    },

    ...formCopy,
    ...actionCopy,
    title: 'Hoàn chi phí',
    description:
      'Kiểm tra chứng minh chi phí và theo dõi phê duyệt từng dòng cùng xử lý thanh toán.',
    new: 'Hoàn chi phí mới',
    edit: 'Chỉnh sửa hoàn chi phí',
    details: 'Xem chi tiết',
    number: 'Số',
    reason: 'Lý do',
    gross: 'Tổng hoàn chi phí',
    offset: 'Bù trừ tạm ứng',
    net: 'Tiền mặt ròng',
    search: 'Tìm số, lý do hoặc người yêu cầu',
    view: 'Xem bản ghi',
    allStatuses: 'Tất cả trạng thái',
    refresh: 'Làm mới hoàn chi phí',
    clearFilters: 'Xóa bộ lọc',
    emptyTitle: 'Chưa có hoàn chi phí',
    emptyDescription: 'Tạo bản nháp rồi thêm dòng chi phí và chứng minh.',
    noResults: 'Không có hoàn chi phí phù hợp. Điều chỉnh bộ lọc.',
    rowActions: 'Thao tác cho {{name}}',
    views: {
      mine: 'Của tôi',
      pending: 'Đang chờ',
      done: 'Hoàn tất',
      copied: 'Đã sao chép',
    },
    statuses: {
      draft: 'Bản nháp',
      revision: 'Phiên bản',
      manager: 'Quản lý xem xét',
      head: 'Phòng ban xem xét',
      finance: 'Tài chính xem xét',
      executive: 'Ban điều hành xem xét',
      gm: 'Tổng giám đốc xem xét',
      cashier: 'Thủ quỹ xử lý',
      exception: 'Ngoại lệ xử lý',
      paid: 'Đã chi trả',
      forcedPaid: 'Quyết toán ghi theo quản trị',
      rejected: 'Đã từ chối',
      withdrawn: 'Đã rút lại',
      terminated: 'Đã chấm dứt',
    },
    errors: {
      invoiceDuplicate:
        'Số hóa đơn phải duy nhất trong lần hoàn chi phí này. Kiểm tra từng dòng.',
      overrunReasonRequired:
        'Yêu cầu lũy kế vượt hạn mức liên kết đã duyệt hơn 20%. Nhập giải trình vượt hạn mức.',
      invoiceUnavailable:
        'Hóa đơn đã được giữ hoặc dùng bởi hoàn chi phí khác. Kiểm tra số hóa đơn và yêu cầu.',
      paymentAccountRequired:
        'Tài khoản thanh toán nhân viên chưa đầy đủ. Nhờ nhân sự hoàn thành tên ngân hàng, số tài khoản và chủ tài khoản trước khi gửi.',
      employeeInactive:
        'Người yêu cầu cần hồ sơ nhân viên đang hoạt động. Liên hệ nhân sự kiểm tra.',
      departmentRequired:
        'Người yêu cầu không có phòng ban chính đang hoạt động. Nhờ nhân sự hoặc quản trị viên tổ chức phân công.',
      categoryInvalid:
        'Danh mục chi phí không hoạt động hoặc không khả dụng. Chọn danh mục đang hoạt động cho mỗi dòng.',
      sourceInvalid:
        'Hạn mức liên kết không khả dụng, chưa duyệt hoặc thuộc người yêu cầu khác. Kiểm tra yêu cầu liên kết.',
      sourceRebind:
        'Hoàn chi phí đã gửi không thể đổi hạn mức hoặc tạm ứng liên kết. Giữ liên kết gốc.',
      loanRequired:
        'Chọn khoản tạm ứng cho bù trừ hoặc nhập 0 nếu không bù trừ.',
      loanInvalid:
        'Khoản tạm ứng không khả dụng hoặc thuộc người yêu cầu khác. Chọn khoản khác.',
      loanInsufficient:
        'Số dư tạm ứng khả dụng không đủ. Giảm bù trừ và kiểm tra số dư.',
      invalidOffset:
        'Bù trừ tạm ứng không được vượt tổng hoàn chi phí. Kiểm tra số tiền.',
      attachmentInvalid:
        'Một số chứng minh không khả dụng hoặc thuộc hoàn chi phí khác. Chọn hoặc tải chứng minh cho yêu cầu này.',
      slaConfiguration:
        'Giới hạn thời gian phê duyệt không được hỗ trợ. Liên hệ quản trị viên quy trình.',
      inputInvalid:
        'Nhập lý do hoàn chi phí và hoàn thành các dòng riêng biệt kèm chứng minh.',
      configuration:
        'Cấu trúc dữ liệu hoàn chi phí chưa đầy đủ. Nhờ quản trị viên hệ thống sửa trước khi thử lại.',
      forbidden: 'Bạn không thể truy cập hoàn chi phí này.',
      notFound: 'Hoàn chi phí không còn tồn tại.',
      conflict:
        'Hoàn chi phí đã thay đổi. Tải lại và kiểm tra trước khi thao tác lại.',
      standardReason:
        'Giải thích từng dòng trong ngày vượt tiêu chuẩn đã duyệt.',
      standardCategoryChanged:
        'Danh mục ngoài chính sách gốc. Tạo yêu cầu mới để dùng chính sách hiện tại.',
      standardConfiguration:
        'Tiêu chuẩn công tác đã duyệt chưa đầy đủ. Nhờ quản trị viên kiểm tra cấu hình.',
      invalid: 'Kiểm tra nội dung hoàn chi phí và chứng minh bắt buộc.',
      failed: 'Yêu cầu chưa hoàn tất. Thử lại.',
    },
    standard: {
      title: 'Chính sách chi phí cố định',
      unsubmitted: 'Chính sách được cố định ở lần gửi đầu.',
      frozenHint:
        'Phân loại đã lưu và giới hạn công tác đã duyệt giữ nguyên khi sửa. Số tiền ngày được tổng hợp theo loại tiêu chuẩn.',
      gradeCode: 'Cấp bậc công tác',
      gradeRank: 'Thứ hạng cấp bậc',
      lodging: 'Lưu trú mỗi đêm (nhân dân tệ)',
      allowance: 'Phụ cấp mỗi ngày (nhân dân tệ)',
      notApplicable:
        'Không có tiêu chuẩn công tác đã duyệt áp dụng cho yêu cầu này.',
      kinds: {
        none: 'Không có giới hạn công tác ngày',
        lodging: 'Giới hạn lưu trú ngày',
        allowance: 'Giới hạn phụ cấp ngày',
      },
    },
    detail: {
      lines: 'Dòng chi phí',
      failure: 'Lỗi xử lý',
      voucher: 'Chứng từ chi trả',
      forcedReason: 'Lý do quyết toán quản trị',
      noLines: 'Chưa có dòng chi phí.',
      line: 'Dòng chi phí {{number}}',
      financeResult: 'Kết quả tài chính',
      lineStates: {
        approved: 'Đã phê duyệt',
        returned: 'Trả lại để sửa',
        pending: 'Chờ xem xét',
      },
    },
    bank: {
      title: 'Tài khoản thanh toán riêng tư',
      bankName: 'Ngân hàng',
      bankAccount: 'Tài khoản ngân hàng',
      bankAccountName: 'Chủ tài khoản',
      missing: 'Không có tài khoản thanh toán đã lưu.',
      correct: 'Sửa tài khoản thanh toán',
      saved: 'Đã sửa tài khoản thanh toán',
      denied: 'Bị từ chối truy cập tài khoản thanh toán.',
      unavailable:
        'Không thể sửa tài khoản. Tải lại hoàn chi phí và kiểm tra tài khoản đã lưu.',
    },
    authz: {
      resource: 'Hoàn chi phí',
      submit: 'Tạo và gửi hoàn chi phí của tôi',
      delegate: 'Tạo hoàn chi phí thay nhân viên',
      view: 'Xem hoàn chi phí',
      paymentAccount: 'Đọc và sửa tài khoản thanh toán được cấp quyền',
    },
  },
};
