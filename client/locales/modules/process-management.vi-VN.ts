export default {
  flowDiagram: {
    escapeHint: 'Nhấn Esc để thoát',
    controls: 'Điều khiển sơ đồ',
    zoomIn: 'Phóng to',
    zoomOut: 'Thu nhỏ',
    fitView: 'Vừa khung',
    fullscreen: 'Toàn màn hình',
    exitFullscreen: 'Thoát toàn màn hình',
    minimap: 'Bản đồ thu nhỏ',

    empty: 'Không có trạng thái để hiển thị.',
    loading: 'Đang bố trí sơ đồ…',
    failed:
      'Không thể bố trí sơ đồ. Xem tham số quy trình và lần thực thi gần đây.',
    nodeHelp: 'Trạng thái quy trình. Kéo và thu phóng để khám phá.',
    edgeHelp: 'Chuyển trạng thái quy trình',
  },
  processManagement: {
    managementReason: 'Lý do',
    normalDescription:
      'Hiển thị đường nghiệp vụ chính; điều kiện quyết định nhánh.',
    revealHint:
      'Di chuột lên bước để hiển thị đường trả lại và lối thoát khác, rồi di lên lối thoát để xem chi tiết.',
    graphLegend: 'Chú giải sơ đồ',
    otherExits: 'Lối thoát khác',
    exitNext: 'Sau đó có thể:',
    exitEnds: 'Quy trình kết thúc tại đây.',
    nodeTypes: {
      start: 'Bắt đầu',
      approval: 'Phê duyệt',
      work: 'Bước công việc',
      success: 'Đã hoàn thành',
      negative: 'Đã kết thúc',
      exception: 'Trả lại hoặc ngoại lệ',
    },
    rulesCount_one: '{{count}} quy tắc',
    rulesCount_other: '{{count}} quy tắc',
    notReached: 'Chưa đến',
    parameters: {
      title: 'Tham số quy trình',
      description:
        'Ngưỡng quy trình đọc ở từng bước. Mỗi giá trị đặt một lần và áp dụng cho mọi bước liệt kê bên cạnh.',
      none: 'Quy trình không có tham số điều chỉnh được.',
      onNodes:
        'Quy trình được cấu hình tại các bước. Dùng nút thiết lập trên bước trong sơ đồ.',
      forbidden: 'Bạn không có quyền xem tham số quy trình này.',
      readOnly: 'Bạn có thể xem nhưng không thay đổi tham số.',
      changed: 'Đã thay đổi',
      scheduled: 'Đổi thành {{value}} vào {{date}}.',
      orderViolated:
        'Sai thứ tự với tham số liên quan: ngưỡng thấp không được vượt ngưỡng cao. Điều chỉnh cả hai tại đây và lưu cùng nhau.',
      discard: 'Bỏ thay đổi',
      save_zero: 'Lưu',
      save_one: 'Lưu 1 thay đổi',
      save_other: 'Lưu {{count}} thay đổi',
      saved_one: 'Đã lưu 1 tham số',
      saved_other: 'Đã lưu {{count}} tham số',
    },
    nodeSettings: {
      edit: 'Chỉnh sửa tham số',
      editNamed: 'Chỉnh sửa tham số cho {{name}}',
      title: 'Chỉnh sửa tham số cho {{name}}',
      parameter: 'Tham số',
      effect:
        'Thay đổi không viết lại ảnh chụp yêu cầu đã lưu hoặc tác vụ hiện có. Yêu cầu mới dùng cấu hình có hiệu lực; gửi lại theo quy tắc quy trình chủ quản.',
      shared: 'Thiết lập dùng chung. Cũng ảnh hưởng: {{flows}}.',
      unavailable:
        'Nút không có tham số có thể chỉnh sửa. Đóng hộp thoại và chọn nút đã cấu hình.',
      forbidden: 'Bạn không có quyền chỉnh sửa cấu hình nút này.',
      newCommittee: 'Công bố cấu trúc hội đồng mới',
      seat: 'Phiên bản {{version}} · người giữ vị trí {{name}}',
      committeeContext:
        'Nút đã chọn: phiên bản {{selected}}. Đang hoạt động: {{active}}. Lưu mới nhất: {{latest}}.',
    },
    conditionMissing:
      'Nhánh này cần mô tả điều kiện rõ ràng; kiểm tra quy tắc nghiệp vụ chủ quản',
    snapshotConditions:
      'Ngưỡng số tiền, ngày và cấp bậc dùng quy tắc cố định khi gửi. Định nghĩa này giải thích tiêu chí quyết định, không phải ảnh chụp yêu cầu lịch sử.',
    branchConditions: {
      travelCancellation_unbooking:
        'Công tác gốc yêu cầu đặt chỗ nên hủy cần hủy đặt chỗ',
      travelCancellation_approved:
        'Công tác gốc không yêu cầu đặt chỗ nên không cần hủy đặt chỗ',
      reimbursement_managerApproved_head:
        'Tổng hoàn chi phí > ngưỡng trưởng phòng cố định và chưa vượt kiểm tra gộp tác vụ quản lý/trưởng phòng',
      reimbursement_managerApproved_finance:
        'Tổng hoàn chi phí không vượt ngưỡng trưởng phòng hoặc tác vụ quản lý/trưởng phòng được gộp hợp lệ',

      training_managerApproved_head:
        'Số tiền đào tạo > 0 và tác vụ quản lý/trưởng phòng chưa được gộp hợp lệ',
      training_managerApproved_finance:
        'Số tiền đào tạo > 0; quản lý và trưởng phòng cùng người và vòng này vượt kiểm tra gộp tác vụ phê duyệt',
      training_managerApproved_approved: 'Số tiền đào tạo bằng không',

      travel_managerApproved_head:
        'Chưa đáp ứng điều kiện gộp quản lý/trưởng phòng',
      travel_managerApproved_finance:
        'Quản lý và trưởng phòng cùng người và vòng này vượt kiểm tra gộp tác vụ phê duyệt',
      probation_managerApproved_head:
        'Chưa đáp ứng điều kiện gộp quản lý/trưởng phòng',
      probation_managerApproved_hr:
        'Quản lý và trưởng phòng cùng người và vòng này vượt kiểm tra gộp tác vụ phê duyệt',
      departure_managerApproved_head:
        'Chưa đáp ứng điều kiện gộp quản lý/trưởng phòng',
      departure_managerApproved_hr:
        'Quản lý và trưởng phòng cùng người và vòng này vượt kiểm tra gộp tác vụ phê duyệt',
      expensePlan_financeApproved_executive:
        'Cần điều hành phê duyệt: số tiền > ngưỡng điều hành cố định khi gửi',
      expensePlan_financeApproved_gm:
        'Không cần điều hành phê duyệt; số tiền > ngưỡng tổng giám đốc cố định khi gửi',
      expensePlan_financeApproved_approved:
        'Không áp dụng điều kiện phê duyệt bổ sung điều hành hoặc tổng giám đốc',
      expensePlan_executiveApproved_gm:
        'Cần tổng giám đốc duyệt và chưa vượt kiểm tra gộp tác vụ điều hành/tổng giám đốc',
      expensePlan_executiveApproved_approved:
        'Không cần tổng giám đốc duyệt hoặc tác vụ điều hành/tổng giám đốc được gộp hợp lệ',
      loan_financeApproved_executive:
        'Cần điều hành phê duyệt: số tiền > ngưỡng điều hành cố định khi gửi',
      loan_financeApproved_gm:
        'Không cần điều hành phê duyệt; số tiền > ngưỡng tổng giám đốc cố định khi gửi',
      loan_financeApproved_cashier:
        'Không áp dụng điều kiện phê duyệt bổ sung điều hành hoặc tổng giám đốc',
      loan_executiveApproved_gm:
        'Cần tổng giám đốc duyệt và chưa vượt kiểm tra gộp tác vụ điều hành/tổng giám đốc',
      loan_executiveApproved_cashier:
        'Không cần tổng giám đốc duyệt hoặc tác vụ điều hành/tổng giám đốc được gộp hợp lệ',
      purchase_financeApproved_executive:
        'Cần điều hành phê duyệt: số tiền > ngưỡng điều hành cố định khi gửi',
      purchase_financeApproved_gm:
        'Không cần điều hành phê duyệt; số tiền > ngưỡng tổng giám đốc cố định khi gửi',
      purchase_financeApproved_approved:
        'Không áp dụng điều kiện phê duyệt bổ sung điều hành hoặc tổng giám đốc',
      purchase_executiveApproved_gm:
        'Cần tổng giám đốc duyệt và chưa vượt kiểm tra gộp tác vụ điều hành/tổng giám đốc',
      purchase_executiveApproved_approved:
        'Không cần tổng giám đốc duyệt hoặc tác vụ điều hành/tổng giám đốc được gộp hợp lệ',
      payment_financeApproved_executive:
        'Cần điều hành phê duyệt: đầy đủ bậc phê duyệt và số tiền > ngưỡng điều hành cố định khi gửi',
      payment_financeApproved_gm:
        'Không cần điều hành phê duyệt; số tiền > ngưỡng tổng giám đốc cố định khi gửi và cần phê duyệt đầy đủ',
      payment_financeApproved_cashier:
        'Không áp dụng điều kiện phê duyệt bổ sung điều hành hoặc tổng giám đốc',
      payment_executiveApproved_gm:
        'Cần tổng giám đốc duyệt và chưa vượt kiểm tra gộp tác vụ điều hành/tổng giám đốc',
      payment_executiveApproved_cashier:
        'Không cần tổng giám đốc duyệt hoặc tác vụ điều hành/tổng giám đốc được gộp hợp lệ',
      travel_financeApproved_executive:
        'Cần điều hành phê duyệt: công tác quốc tế hoặc số tiền > ngưỡng điều hành cố định khi gửi',
      travel_financeApproved_gm:
        'Không cần điều hành phê duyệt; số tiền > ngưỡng tổng giám đốc cố định khi gửi',
      travel_financeApproved_booking:
        'Không cần phê duyệt điều hành/tổng giám đốc thêm và có yêu cầu đặt chỗ',
      travel_financeApproved_completed:
        'Không cần phê duyệt điều hành/tổng giám đốc thêm và không yêu cầu đặt chỗ',
      travel_executiveApproved_gm:
        'Cần tổng giám đốc duyệt và chưa vượt kiểm tra gộp tác vụ điều hành/tổng giám đốc',
      travel_executiveApproved_booking:
        'Không cần tổng giám đốc duyệt hoặc đã gộp hợp lệ; có yêu cầu đặt chỗ',
      travel_executiveApproved_completed:
        'Không cần tổng giám đốc duyệt hoặc đã gộp hợp lệ; không yêu cầu đặt chỗ',
      travel_gmApproved_booking: 'Có yêu cầu đặt chỗ',
      travel_gmApproved_completed: 'Không yêu cầu đặt chỗ',
      payment_submit_head:
        'Kiểm tra nguồn tiền yêu cầu đầy đủ bậc phê duyệt, gồm khoản thanh toán vượt cần phê duyệt bổ sung',
      payment_submit_finance:
        'Kiểm tra nguồn tiền không yêu cầu đầy đủ bậc phê duyệt',
      budgetAdjustment_cfoApproved_gm:
        'Số tiền tăng ngân sách vượt ngưỡng tổng giám đốc cố định khi gửi',
      budgetAdjustment_cfoApproved_approved:
        'Không phải tăng ngân sách hoặc mức tăng không vượt ngưỡng tổng giám đốc cố định',
      leave_managerApproved_head:
        'Số ngày ≥ ngưỡng trưởng phòng cố định và trưởng phòng thiếu hoặc khác quản lý',
      leave_managerApproved_hr:
        'Không cần trưởng phòng xem xét; loại nghỉ cần nhân sự hoặc số ngày ≥ ngưỡng nhân sự cố định',
      leave_managerApproved_approved:
        'Không cần trưởng phòng, loại nghỉ không bắt buộc nhân sự và số ngày dưới ngưỡng nhân sự cố định',
      leave_headApproved_hr:
        'Loại nghỉ cần nhân sự hoặc số ngày ≥ ngưỡng nhân sự cố định',
      leave_headApproved_approved:
        'Loại nghỉ không cần nhân sự và số ngày dưới ngưỡng nhân sự cố định',
      overtime_managerApproved_head:
        'Làm thêm tháng vượt ngưỡng trưởng phòng cố định và trưởng phòng thiếu hoặc khác quản lý',
      overtime_managerApproved_hr:
        'Không cần trưởng phòng xem xét; gửi sau ngày làm thêm hơn 3 ngày làm việc',
      overtime_managerApproved_approved:
        'Không cần trưởng phòng xem xét; gửi trong hạn báo cáo 3 ngày làm việc',
      overtime_headApproved_hr: 'Gửi sau ngày làm thêm hơn 3 ngày làm việc',
      overtime_headApproved_approved:
        'Gửi trong 3 ngày làm việc sau ngày làm thêm',
      supplies_submit_issuing:
        'Gửi lại từ ngoại lệ thực hiện với nội dung đã duyệt giữ nguyên',
      supplies_submit_manager:
        'Yêu cầu mới, nội dung thuộc phê duyệt thay đổi hoặc chưa đáp ứng điều kiện tiếp tục',
      vehicleRequest_submit_dispatch:
        'Gửi lại từ ngoại lệ thực hiện với nội dung đã duyệt giữ nguyên',
      vehicleRequest_submit_head:
        'Yêu cầu mới, nội dung thuộc phê duyệt thay đổi hoặc chưa đáp ứng điều kiện tiếp tục',
      purchase_submit_purchasing:
        'Gửi lại từ ngoại lệ thực hiện với nội dung đã duyệt giữ nguyên',
      purchase_submit_head:
        'Yêu cầu mới, nội dung thuộc phê duyệt thay đổi hoặc chưa đáp ứng điều kiện tiếp tục',
      assetRequest_submit_issuing:
        'Gửi lại từ ngoại lệ thực hiện với nội dung đã duyệt giữ nguyên; đủ điều kiện tiếp tục; không phải yêu cầu loại bỏ',
      assetRequest_submit_head:
        'Yêu cầu mới, nội dung thuộc phê duyệt thay đổi hoặc chưa đáp ứng điều kiện tiếp tục',
      sealRequest_submit_stamping:
        'Gửi lại từ ngoại lệ thực hiện với nội dung đã duyệt giữ nguyên; đủ điều kiện tiếp tục',
      sealRequest_submit_head:
        'Yêu cầu mới, nội dung thuộc phê duyệt thay đổi hoặc chưa đáp ứng điều kiện tiếp tục',
      purchase_priced_revision:
        'Giá thực tế > 120% dự toán gốc; cần người yêu cầu xác nhận và gửi lại',
      purchase_priced_finance: 'Giá thực tế ≤ 120% dự toán gốc',
      purchase_forcedPriced_revision:
        'Giá thực tế > 120% dự toán gốc; cần người yêu cầu xác nhận và gửi lại',
      purchase_forcedPriced_finance: 'Giá thực tế ≤ 120% dự toán gốc',
      probation_hrApproved_gm:
        'Từ chối thử việc hoặc cấp bậc nhân sự xác nhận đạt ngưỡng quản lý cố định',
      probation_hrApproved_approved:
        'Không từ chối thử việc và cấp bậc nhân sự xác nhận dưới ngưỡng quản lý',
      departure_hrApproved_gm:
        'Cấp bậc nhân viên ≥ ngưỡng quản lý cố định khi gửi',
      departure_hrApproved_handover:
        'Cấp bậc nhân viên dưới ngưỡng quản lý cố định',
      departure_cancellationRejected_gm:
        'Hủy bị từ chối; tiếp tục trạng thái gm trước hủy đã lưu',
      departure_cancellationRejected_handover:
        'Hủy bị từ chối; tiếp tục trạng thái bàn giao trước hủy đã lưu',
      departure_cancellationRejected_completed:
        'Hủy bị từ chối; tiếp tục trạng thái hoàn tất trước hủy đã lưu',
      recruitment_submit_head:
        'Người yêu cầu không phải trưởng phòng hoặc thiếu trưởng phòng',
      recruitment_submit_hrbp:
        'Người yêu cầu là trưởng phòng; bỏ qua tự phê duyệt',
      recruitment_reviewEdit_head:
        'Người yêu cầu không phải trưởng phòng hoặc thiếu trưởng phòng',
      recruitment_reviewEdit_hrbp:
        'Người yêu cầu là trưởng phòng; bỏ qua tự phê duyệt',
      recruitment_hrDirectorApproved_executive:
        'Đề nghị dùng định biên bổ sung',
      recruitment_hrDirectorApproved_gm:
        'Không phải định biên bổ sung; cấp bậc đích đạt ngưỡng giám đốc cố định',
      recruitment_hrDirectorApproved_approved:
        'Không phải định biên bổ sung; cấp bậc đích dưới ngưỡng giám đốc cố định',
      recruitment_executiveApproved_gm:
        'Định biên bổ sung hoặc cấp bậc đích đạt ngưỡng giám đốc',
      recruitment_executiveApproved_approved:
        'Không phải định biên bổ sung và cấp bậc đích dưới ngưỡng giám đốc',
      transfer_submit_manager:
        'Người gửi không phải quản lý nhân viên; thiếu quản lý vẫn vào bước quản lý xem xét',
      transfer_submit_sourceHead: 'Người gửi là quản lý nhân viên',
      transfer_reviewEdit_manager:
        'Người gửi không phải quản lý nhân viên; thiếu quản lý vẫn vào bước quản lý xem xét',
      transfer_reviewEdit_sourceHead: 'Người gửi là quản lý nhân viên',
      transfer_sourceHeadApproved_targetHead:
        'Thay đổi gồm điều chuyển phòng ban',
      transfer_sourceHeadApproved_hr:
        'Thay đổi không gồm điều chuyển phòng ban',
      transfer_hrApproved_executive:
        'Tăng lương vượt ngưỡng điều hành cố định hoặc cấp bậc đích đạt cấp quản lý',
      transfer_hrApproved_gm:
        'Không có điều hành xem xét; tăng vượt ngưỡng tổng giám đốc cố định hoặc cấp bậc đích đạt cấp giám đốc',
      transfer_hrApproved_pendingEffective:
        'Không áp dụng điều kiện lương hoặc cấp bậc cho xem xét bổ sung điều hành/tổng giám đốc',
      transfer_executiveApproved_gm:
        'Tăng vượt ngưỡng tổng giám đốc cố định hoặc cấp bậc đích đạt cấp giám đốc',
      transfer_executiveApproved_pendingEffective:
        'Không áp dụng điều kiện lương hoặc cấp bậc cho xem xét bổ sung tổng giám đốc',
      assetRequest_headApproved_appraisal: 'Yêu cầu là loại bỏ tài sản',
      assetRequest_headApproved_issuing: 'Yêu cầu không phải loại bỏ tài sản',
      assetRequest_financeApproved_gm:
        'Yêu cầu loại bỏ; tổng nguyên giá vượt ngưỡng tổng giám đốc cố định',
      assetRequest_financeApproved_scrapped:
        'Nguyên giá loại bỏ không vượt ngưỡng tổng giám đốc',
      assetRequest_issueCompleted_returning:
        'Yêu cầu mượn: cấp phát rồi vào xử lý trả',
      assetRequest_issueCompleted_issued: 'Yêu cầu không phải mượn',
      sealRequest_stamped_returning: 'Mượn con dấu ra ngoài cần xử lý trả',
      sealRequest_stamped_completed: 'Con dấu không dùng bên ngoài',
      vendorQualification_submit_removalReview:
        'Thao tác gỡ nhà cung cấp khỏi danh bạ',
      vendorQualification_submit_purchasing: 'Thao tác không gỡ nhà cung cấp',
      contract_headApproved_legalFinance:
        'Chấm dứt hợp đồng hoặc mẫu phi tiêu chuẩn',
      contract_headApproved_standardFinance: 'Không chấm dứt và dùng mẫu chuẩn',
      contract_legalFinanceApproved_executive:
        'Giá trị hợp đồng vượt ngưỡng điều hành cố định; không phải chấm dứt',
      contract_legalFinanceApproved_gm:
        'Không có điều hành xem xét; giá trị vượt ngưỡng tổng giám đốc hợp đồng cố định hoặc pháp chế/tài chính đánh dấu phi tiêu chuẩn; không phải chấm dứt',
      contract_legalFinanceApproved_approved:
        'Chấm dứt hoặc không còn điều kiện phê duyệt',
      contract_standardFinanceApproved_executive:
        'Giá trị hợp đồng vượt ngưỡng điều hành cố định',
      contract_standardFinanceApproved_gm:
        'Không có điều hành xem xét; giá trị vượt ngưỡng tổng giám đốc hợp đồng cố định',
      contract_standardFinanceApproved_approved:
        'Không vượt ngưỡng điều hành và tổng giám đốc hợp đồng',
      contract_executiveApproved_gm:
        'Giá trị vượt ngưỡng tổng giám đốc hợp đồng cố định hoặc hợp đồng phi tiêu chuẩn',
      contract_executiveApproved_approved:
        'Giá trị không vượt ngưỡng tổng giám đốc hợp đồng và hợp đồng chuẩn',
      committeeVersion: 'Dùng nhóm hội đồng khớp phiên bản cố định khi gửi',
      returnApplicant: 'Quyết định trả lại chọn người yêu cầu sửa và gửi lại',
      returnEarlier:
        'Quyết định trả lại chọn giai đoạn phê duyệt trước đã vào này',
      seal_legal:
        'Sau trưởng phòng xem xét: con dấu hợp đồng hoặc hợp đồng liên kết',
      seal_financeManager:
        'Từ trưởng phòng/pháp chế xem xét: con dấu tài chính, sau ưu tiên nhánh hợp đồng',
      seal_gm:
        'Không áp dụng nhánh pháp chế/tài chính; con dấu đại diện hoặc dùng ngoài và người xem xét hiện tại không phải tổng giám đốc',
      seal_stamping:
        'Không áp dụng nhánh pháp chế/tài chính và không cần tổng giám đốc xem xét thêm hoặc người hiện tại là tổng giám đốc',
    },

    conditional: 'Điều kiện nghiệp vụ áp dụng',
    transitionUnknown: 'Thao tác: {{name}}',
    transitionNames: {
      edit: 'Chỉnh sửa nội dung',
      submit: 'Gửi',
      approved: 'Đã thông qua phê duyệt',
      rejected: 'Từ chối',
      returned: 'Trả lại để chỉnh sửa',
      withdraw: 'Rút lại',
      terminate: 'Chấm dứt',
      booked: 'Đã hoàn tất đặt chỗ',
      bookingFailed: 'Đặt chỗ thất bại',
      bookingForced: 'Xác nhận hoàn tất',
      retryBooking: 'Thử đặt chỗ lại',
      reviseTrip: 'Sửa chuyến đi',
      cancelApproved: 'Đã duyệt hủy',
      issued: 'Đã hoàn tất cấp',
      unavailable: 'Không khả dụng / thực hiện thất bại',
      forceClosed: 'Buộc đóng',
    },

    place: 'Vị trí trống',
    placeNumber: 'Vị trí trống {{number}}',
    placeRequired: 'Chọn vị trí trống.',
    title: 'Quản lý quy trình',
    description: 'Xem định nghĩa, thực thi và lịch sử phê duyệt được cấp quyền',
    definitions: 'Định nghĩa',
    executions: 'Thực thi',
    refresh: 'Làm mới',
    search: 'Tìm theo số, quy trình hoặc người yêu cầu',
    definitionSearch: 'Tìm theo tên quy trình',
    clear: 'Xóa bộ lọc',
    all: 'Tất cả',
    name: 'Tên',
    domain: 'Lĩnh vực nghiệp vụ',
    category: 'Danh mục',
    capabilities: 'Khả năng quản lý',
    approval: 'Quy trình phê duyệt',
    connected: 'Đã kết nối',
    readOnly: 'Chỉ đọc',
    notConnected: 'Chưa kết nối thao tác quản lý',
    reference: 'Số / tiêu đề',
    applicant: 'Người yêu cầu',
    status: 'Trạng thái',
    stage: 'Giai đoạn hiện tại',
    createdAt: 'Đã bắt đầu',
    endedAt: 'Đã kết thúc',
    empty: 'Chưa có lần thực thi',
    emptyDescription:
      'Thực thi quy trình đã kết nối hiển thị tại đây khi bắt đầu',
    noDefinitions: 'Không có định nghĩa có thể đọc',
    noDefinitionsDescription:
      'Nhờ quản trị viên cấu hình quyền truy cập định nghĩa',
    noResults: 'Không có bản ghi phù hợp',
    noResultsDescription: 'Điều chỉnh hoặc xóa bộ lọc để tìm bản ghi',
    definitionGraph: 'Định nghĩa hiện tại',
    graphDescription:
      'Trạng thái và chuyển trạng thái hiện được đăng ký; quy tắc nghiệp vụ quyết định nhánh động',
    currentNode: 'Trạng thái hiện tại',
    visitedNode: 'Đã đi qua',
    unvisitedNode: 'Chưa đi qua',
    executionHistory: 'Lịch sử thực thi',
    terminationOutcome: 'Kết quả chấm dứt',
    actualPath: 'Đường thực thi thực tế',
    actualDescription:
      'Toàn bộ luồng phê duyệt và thực hiện với nút đã qua, chuyển trạng thái và trạng thái hiện tại được tô sáng. Đường trả lại thực tế và lịch sử vẫn hiển thị.',
    tasks: 'Tác vụ và lịch sử phê duyệt',
    timeline: 'Lịch sử phê duyệt và quản lý',
    run: 'Lượt phê duyệt',
    historical: 'Lịch sử thực thi',
    definitionMissing: 'Định nghĩa lịch sử không khả dụng',
    commentsRestricted:
      'Bình luận có thể chứa nội dung riêng tư và cần quyền nghiệp vụ riêng',
    comment: 'Bình luận / lý do',
    actor: 'Người thao tác',
    assignee: 'Người được giao',
    answer: 'Quyết định',
    previousTask: 'Tác vụ trước',
    from: 'Từ',
    to: 'Đến',
    initial: 'Ban đầu',
    final: 'Cuối cùng',
    transitions: 'Chuyển trạng thái',
    definitionDetails: 'Giai đoạn và chuyển trạng thái',
    viewExecutions: 'Xem tất cả bản ghi',
    back: 'Quay lại',
    manage: 'Thao tác quản lý',
    appoint: 'Phân công',
    reassign: 'Phân công lại',
    terminate: 'Chấm dứt',
    unavailable:
      'Tác vụ hoặc trạng thái nghiệp vụ hiện tại không cho phép thao tác',
    person: 'Người nhận',
    reason: 'Lý do',
    personRequired: 'Chọn người nhận',
    reasonRequired: 'Nhập lý do',
    cancel: 'Hủy',
    retry: 'Thử lại',
    loadFailed: 'Tải thất bại. Thử lại',
    submitFailed: 'Thao tác thất bại. Kiểm tra và thử lại',
    unknown: 'Chưa biết kết quả. Làm mới để kiểm tra',
    stale: 'Tác vụ đã thay đổi. Làm mới và kiểm tra',
    gone: 'Bản ghi thiếu hoặc ngoài phạm vi hiện tại của bạn',
    forbidden: 'Bạn không thể đọc phần này. Liên hệ quản trị viên',
    loading: 'Đang tải',
    noPeople: 'Không có người nhận đủ điều kiện cho tác vụ hiện tại',
    peopleSearch: 'Tìm người nhận được cấp quyền',
    loadMore: 'Tải thêm',
    reassignTitle: 'Phân công lại tác vụ cho "{{recordLabel}}"',
    appointTitle: 'Phân công tác vụ cho "{{recordLabel}}"',
    terminateTitle: 'Chấm dứt yêu cầu "{{recordLabel}}"',
    reassigned: 'Đã phân công lại tác vụ cho "{{recordLabel}}"',
    appointed: 'Đã phân công tác vụ cho "{{recordLabel}}"',
    terminated: 'Đã chấm dứt yêu cầu "{{recordLabel}}"',
    recentDescription:
      'Năm lần thực thi được cấp quyền gần nhất. Mở danh sách thực thi để xem lịch sử đầy đủ.',
    vehicleTerminationGuard:
      'Không thể chấm dứt trực tiếp yêu cầu đã điều xe. Người yêu cầu thực tế phải đăng ký sử dụng và theo quy trình nghiệp vụ xe.',
    terminationConsequences: {
      vehicle:
        'Kết thúc yêu cầu chưa điều xe. Thao tác không thể đóng yêu cầu đã điều xe.',
      leave:
        'Đóng phê duyệt hiện tại; dịch vụ nghỉ phép xử lý khoản giữ hạn mức còn tồn.',
      funding:
        'Đóng phê duyệt hiện tại; dịch vụ nghiệp vụ xử lý khoản giữ ngân sách, tiền hoặc yêu cầu còn tồn. Thanh toán đã quyết toán vẫn được ghi.',
      stock:
        'Đóng phê duyệt hiện tại; dịch vụ vật tư xử lý khoản giữ tồn kho còn tồn. Trả vật lý cần quy trình nghiệp vụ riêng.',
      ordinary:
        'Đóng phê duyệt hiện tại và thực thi bảo vệ chấm dứt nghiệp vụ cùng xử lý thoát.',
    },
    terminationDescription:
      'Chấm dứt đóng tác vụ hiện tại và giải phóng khoản giữ theo quy tắc nghiệp vụ, giữ mọi lịch sử. Dữ kiện đã thực hiện cần hủy riêng hoặc thanh lý bảo quản.',
    graphView: 'Sơ đồ',
    dateRange: 'Ngày bắt đầu',
    last7: '7 ngày qua',
    last30: '30 ngày qua',
    last90: '90 ngày qua',
    thisMonth: 'Tháng này',
    lastMonth: 'Tháng trước',
    safeHistory:
      'Chế độ xem chỉ chứa thông tin quy trình an toàn được cấp quyền',
    business: 'Nội dung nghiệp vụ',
    businessRestricted:
      'Nội dung nghiệp vụ, tệp đính kèm và trường riêng cần quyền truy cập riêng',
    guardedBranch: 'Nhánh chọn theo điều kiện nghiệp vụ nguồn',
    frozen: 'Trường cố định',
    covered: 'Trường được bao phủ',
    management: 'Can thiệp quản trị viên',
    kinds: {
      leave: 'Nghỉ phép',
      overtime: 'Làm thêm giờ',
      leaveCancellation: 'Hủy nghỉ phép',
      general: 'Yêu cầu chung',
      attendanceChange: 'Bổ sung chấm công',
      outing: 'Ra ngoài',
      supplies: 'Yêu cầu vật tư',
      budgetAdjustment: 'Điều chỉnh ngân sách',
      expensePlan: 'Cấp quyền chi phí',
      training: 'Đào tạo',
      travel: 'Công tác',
      travelCancellation: 'Hủy công tác',
      reimbursement: 'Hoàn chi phí',
      purchase: 'Mua sắm',
      loan: 'Yêu cầu tạm ứng',
      payment: 'Yêu cầu thanh toán',
      probation: 'Đánh giá thử việc',
      vehicleRequest: 'Yêu cầu xe',
      contract: 'Hợp đồng',
      assetRequest: 'Yêu cầu tài sản',
      vendorQualification: 'Hồ sơ năng lực nhà cung cấp',
      recruitment: 'Tuyển dụng',
      sealRequest: 'Yêu cầu con dấu',
      transfer: 'Thay đổi nhân sự',
      departure: 'Nghỉ việc',
      certificateRequest: 'Yêu cầu giấy chứng nhận',
    },
    domains: {
      office: 'Văn phòng hằng ngày',
      organization: 'Tổ chức và nhân sự',
      finance: 'Tài chính và chi phí',
      procurement: 'Mua sắm và hợp đồng',
      administration: 'Hành chính và tài sản',
    },
    states: {
      issued: 'Đã cấp phát',
      forcedClosed: 'Đã buộc đóng',
      draft: 'Bản nháp',
      revision: 'Phiên bản',
      manager: 'Quản lý',
      head: 'Trưởng phòng',
      hr: 'Nhân sự',
      extra: 'Xem xét bổ sung',
      finance: 'Tài chính',
      cashier: 'Thủ quỹ',
      executive: 'Điều hành',
      gm: 'Tổng giám đốc',
      cfo: 'Giám đốc tài chính',
      legal: 'Pháp chế',
      financeManager: 'Trưởng bộ phận tài chính',
      hrbp: 'Đối tác nhân sự',
      hrDirector: 'Giám đốc nhân sự',
      approved: 'Đã phê duyệt',
      rejected: 'Đã từ chối',
      withdrawn: 'Đã rút lại',
      terminated: 'Đã chấm dứt',
      completed: 'Đã hoàn thành',
      exception: 'Ngoại lệ xử lý',
      dispatch: 'Điều xe',
      usage: 'Sử dụng xe',
      issuing: 'Đang cấp',
      returning: 'Đang trả',
      returnException: 'Ngoại lệ trả',
      stamping: 'Đóng dấu',
      booking: 'Đặt chỗ',
      unbooking: 'Hủy lịch đặt',
      paid: 'Đã chi trả',
      paymentException: 'Ngoại lệ chi trả',
      pendingEffective: 'Chờ ngày có hiệu lực',
      cancellationReview: 'Xem xét hủy',
      sourceHead: 'Trưởng phòng nguồn',
      targetHead: 'Trưởng phòng đích',
      committee: 'Hội đồng',
      purchasing: 'Mua hàng',
      inquiry: 'Hỏi giá',
      quoting: 'Báo giá',
      pending: 'Đang chờ',
      claimed: 'Đã nhận',
      waiting: 'Đang chờ',
      blocked: 'Bị chặn',
      candidate: 'Ứng viên',
      suspended: 'Đã tạm ngưng',
      transferred: 'Đã chuyển giao',
      voided: 'Đã đóng',
      open: 'Mở',
      cancelled: 'Đã hủy',
      returned: 'Đã trả',
      concluded: 'Đã kết luận',
      decide: 'Quyết định',
      copy: 'Sao chép',
      approve: 'Phê duyệt',
      reject: 'Từ chối',
      return: 'Trả lại',
      unknown: 'Trạng thái khác',
    },
    authz: {
      definitionRead: 'Định nghĩa',
      historyRead: 'Lịch sử thực thi',
      appoint: 'Phân công',
      reassign: 'Phân công lại',
      terminate: 'Chấm dứt',
    },
    otherStage: 'Giai đoạn khác ({{name}})',
    otherEvent: 'Sự kiện quy trình ({{name}})',
    events: {
      approve: 'Đã phê duyệt',
      reject: 'Đã từ chối',
      return: 'Đã trả',
      reassign: 'Phân công lại theo quản trị',
      appoint: 'Phân công theo quản trị',
      comment: 'Bình luận',
      transfer: 'Đã chuyển giao',
      addSign: 'Người ký bổ sung',
      claim: 'Đã nhận',
      release: 'Tác vụ đã nhả',
      'stage.unassigned': 'Giai đoạn chưa phân công',
      'run.started': 'Đã bắt đầu phê duyệt',
      'run.ended': 'Đã kết thúc phê duyệt',
      'stage.entered': 'Đã vào giai đoạn',
      remind: 'Nhắc nhở',
      escalate: 'Đã nâng cấp',
      read: 'Đọc',
    },
  },
};
