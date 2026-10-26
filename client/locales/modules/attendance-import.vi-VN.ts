export default {
  attendanceImport: {
    title: 'Nhập dữ liệu chấm công',
    description:
      'Xem trước và nhập dữ liệu gốc bất biến. Thao tác này không đánh giá chấm công hay tính lương.',
    template: 'Tải mẫu Excel',
    downloadStarted: 'Đã bắt đầu tải mẫu Excel.',
    downloadFailed: 'Không thể tải mẫu Excel. Thử lại.',
    file: 'Tệp dữ liệu Excel',
    empty: 'Chọn tệp .xlsx để bắt đầu xem trước.',
    help: 'Dùng mẫu có một trang tính và ô văn bản. Cột bắt buộc: userId, date, punchKind, source, sourceKey và sourceData (đối tượng JSON). punchedAt có thể trống hoặc là chuỗi ISO UTC như 2035-01-02T01:00:00Z. date là ngày địa phương của công ty. userId là ID người dùng cố định của nhân viên thực, không phải tên. Tối đa 4 MiB và 1.000 dòng. Không chấp nhận công thức và ngày dạng số. Khóa đối tượng JSON phải duy nhất; số phải giữ giá trị thập phân khi tuần tự hóa và số nguyên phải an toàn. Biểu diễn ID lớn hơn hoặc số thập phân chính xác bằng chuỗi.',
    parsing: 'Đang phân tích Excel',
    preview: 'Xem trước: {{count}} dòng',
    confirm: 'Tôi đã xem dữ liệu này và xác nhận nhập toàn bộ lô',
    submit: 'Xác nhận nhập lô',
    submitting: 'Đang nhập',
    success: 'Đã nhập {{count}} dòng dữ liệu.',
    evidence: 'Mở rộng dữ liệu gốc',
    denied: 'Bạn không có quyền nhập dữ liệu chấm công.',
    failed: 'Không thể nhập lô. Kiểm tra tệp và thử lại.',
    invalid:
      'Máy chủ từ chối dữ liệu này. Kiểm tra ID nhân viên, ngày công ty và dữ liệu nguồn.',
    conflict:
      'Mã nguồn đã có dữ liệu khác. Không có dòng nào của lô này được nhập.',
    retry: 'Thử nhập lại',
    discard: 'Bỏ bản xem trước dữ liệu chưa gửi?',
    continue: 'Tiếp tục kiểm tra',
    discardConfirm: 'Bỏ bản xem trước',
    discardHelp:
      'Sau khi bỏ bản xem trước, nhấn lại đích để tiếp tục điều hướng.',
    columns: {
      userId: 'ID người dùng',
      date: 'Ngày công ty',
      punchKind: 'Loại chấm công',
      punchedAt: 'Thời điểm UTC',
      source: 'Nguồn',
      sourceKey: 'Mã nguồn',
      sourceData: 'Dữ liệu gốc',
    },
    errors: {
      file: 'Chọn tệp .xlsx không quá 4 MiB.',
      archive:
        'Tệp nén Excel không hợp lệ hoặc vượt giới hạn giải nén an toàn.',
      template: 'Dùng đúng tiêu đề mẫu đã tải và một trang tính duy nhất.',
      cell: 'Dòng {{row}}: dùng ô văn bản không có công thức và chỉ bảy cột của mẫu.',
      rows: 'Dùng 1–1.000 dòng dữ liệu liên tiếp sau tiêu đề.',
      identity:
        'Dòng {{row}}: cung cấp ID người dùng cố định cùng nguồn và mã nguồn hợp lệ.',
      date: 'Dòng {{row}}: cung cấp ngày công ty thực, loại in/out và thời điểm ISO UTC rõ ràng hoặc để trống.',
      evidence:
        'Dòng {{row}}: cung cấp đối tượng JSON có giới hạn, khóa duy nhất, số tuần tự hóa khứ hồi an toàn và mã nguồn duy nhất.',
    },
  },
};
