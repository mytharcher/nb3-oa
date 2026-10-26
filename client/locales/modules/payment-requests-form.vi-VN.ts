export default {
  paymentRequestsForm: {
    new: 'Yêu cầu thanh toán mới',
    edit: 'Chỉnh sửa yêu cầu thanh toán',
    description:
      'Gửi yêu cầu đã hoàn thành hoặc lưu bản nháp. Dữ kiện nghiệp vụ bắt buộc được kiểm tra lại khi gửi.',
    save: 'Lưu bản nháp',
    saved: 'Đã lưu bản nháp thanh toán',
    draft: 'Bản nháp',
    maxFiles: 'Chọn tối đa 10 tệp chứng minh.',
    limit: 'Văn bản vượt giới hạn độ dài.',
    required: 'Trường này là bắt buộc.',
    amountInvalid:
      'Nhập số tiền không âm tối đa hai chữ số thập phân trong phạm vi xu chính xác được hỗ trợ.',
    invalid: 'Kiểm tra trường này.',
    notEditable: 'Bản ghi không còn cho chỉnh sửa.',
    inactive: 'Không khả dụng — chọn tùy chọn đủ điều kiện',
    select: 'Chọn tùy chọn',
    unknown:
      'Chưa xác nhận kết quả. Giữ nội dung nhập và thử lại chính xác cùng yêu cầu.',
    replay: 'Đối soát yêu cầu gốc',
    latest:
      'Đã tải phiên bản mới nhất. Nội dung nhập được giữ; so sánh với tùy chọn nguồn mới nhất trước khi lưu lại.',
    leaveReady:
      'Nhấn lại đích ban đầu để rời đi. Chỉnh sửa thêm sẽ hủy xác nhận này.',
    applicantId: 'Người yêu cầu',
    reason: 'Lý do thanh toán',
    sourceMode: 'Nguồn phê duyệt trước',
    contract: 'Hợp đồng',
    contractVersion: 'Phiên bản hợp đồng',
    contractId: 'Hợp đồng',
    counterparty: 'Đối tác hợp đồng',
    customerAccountHint:
      'Hợp đồng khách hàng không có tài khoản ngân hàng nhà cung cấp. Nếu cần, có thể sửa tài khoản được bảo vệ sau khi thủ quỹ báo ngoại lệ.',
    purchase: 'Đơn đặt hàng đã duyệt',
    none: 'Không có phê duyệt trước',
    purchaseOrderId: 'Đơn đặt hàng',
    noPriorApprovalReason: 'Giải trình thanh toán không có phê duyệt trước',
    vendorId: 'Người nhận tiền',
    amount: 'Số tiền (nhân dân tệ)',
    invoiceNumber: 'Số hóa đơn',
    paymentMethod: 'Phương thức thanh toán',
    orderStatus: 'Trạng thái đơn hàng',
    approved: 'Số tiền đã duyệt',
    paid: 'Đã thanh toán',
    pending: 'Thanh toán đang chờ',
    available: 'Số tiền khả dụng',
    cents: 'xu',
    overApproval:
      'Số tiền vượt giới hạn lũy kế đã duyệt, gồm khoản đang chờ, cần phê duyệt đầy đủ. Cho phép yêu cầu trả vượt.',
    frozenHint: 'Nguồn, người nhận, số tiền và hóa đơn được cố định khi gửi.',
    voucherAttachments: 'Chứng minh thanh toán',
    attachments: 'Chứng minh hóa đơn',
    uploadHint:
      'PDF, JPEG, PNG hoặc WebP; tối đa 5 MB. Bỏ lựa chọn giữ dữ liệu chứng minh đã lưu.',
    fileSize: 'Chọn tệp không rỗng tối đa 5 MB.',
    fileType: 'Chọn tệp PDF, JPEG, PNG hoặc WebP có phần mở rộng phù hợp.',
    selectEvidence: 'Chọn chứng minh đã lưu / đối soát tải lên',
    uploading: 'Đang tải lên hoặc đọc chứng minh…',
    uploadUnknown:
      'Chưa xác nhận kết quả tải lên. Đọc và kiểm tra chứng minh đã lưu trước khi tải lại. Không tự động thử tải lại.',
    emptyEvidence: 'Không có chứng minh đã lưu.',
    evidenceMissing:
      'Một số chứng minh không còn truy cập được. Làm mới hoặc kiểm tra quyền.',
    removeEvidence: 'Gỡ {{name}} khỏi lựa chọn này',
    bank: {
      title: 'Tài khoản riêng của người nhận',
      denied: 'Bạn không có quyền truy cập tài khoản thanh toán này.',
      missing: 'Chưa ghi nhận tài khoản thanh toán.',
      correct: 'Sửa tài khoản thanh toán',
      unavailable:
        'Chỉ người yêu cầu hoặc người tạo được sửa tài khoản trong khi xử lý ngoại lệ.',
      bankName: 'Ngân hàng',
      bankAccount: 'Số tài khoản',
      bankAccountName: 'Chủ tài khoản',
      reason: 'Lý do sửa',
      saved: 'Đã sửa tài khoản thanh toán',
      unknown:
        'Chưa xác nhận kết quả ghi. Đọc tài khoản mới nhất và so sánh trước khi chủ động gửi lại.',
      conflict:
        'Tài khoản hoặc phiên bản thanh toán đã thay đổi. Tải dữ kiện mới nhất; chỉnh sửa của bạn được giữ.',
      reconciled:
        'Đã tải dữ kiện mới nhất. So sánh nội dung được giữ và chủ động xác nhận lần ghi mới.',
    },
  },
};
