export default {
  flowDiagram: {
    escapeHint: '按 Esc 登出全螢幕',
    controls: '流程圖控制',
    zoomIn: '放大',
    zoomOut: '縮小',
    fitView: '適應畫布',
    fullscreen: '全螢幕',
    exitFullscreen: '登出全螢幕',
    minimap: '小地圖',

    empty: '沒有可顯示的階段',
    loading: '正在自動佈局流程圖…',
    failed: '流程圖佈局失敗，請查看流程參數和最近的執行記錄',
    nodeHelp: '流程階段，可通過平移和縮放查看',
    edgeHelp: '流程轉移',
  },
  processManagement: {
    managementReason: '操作原因',
    normalDescription: '展示主要業務路徑，具體分支由條件決定。',
    revealHint:
      '將鼠標移到環節上，可顯示它的退回連線和其他出口；再移到出口上查看說明。',
    graphLegend: '圖例',
    otherExits: '其他出口',
    exitNext: '之後可以：',
    exitEnds: '流程在此結束。',
    nodeTypes: {
      start: '起點',
      approval: '簽核',
      work: '辦理環節',
      success: '完成',
      negative: '結束',
      exception: '退回或異常',
    },
    rulesCount_one: '{{count}} 條規則',
    rulesCount_other: '{{count}} 條規則',
    notReached: '尚未到達',
    parameters: {
      title: '流程參數',
      description:
        '本流程各環節讀取的閾值。每個參數只設定一次，對旁邊列出的所有環節生效。',
      none: '本流程沒有可調整的參數。',
      onNodes: '本流程在各環節上設定，請點選流程圖中環節上的設定按鈕。',
      forbidden: '你沒有查看本流程參數的權限。',
      readOnly: '你可以查看這些參數，但不能修改。',
      changed: '已修改',
      scheduled: '將於 {{date}} 改為 {{value}}。',
      orderViolated:
        '與相關參數的大小順序衝突：較低的閾值不能高於較高的閾值。請在這裡同時調整兩者後一起儲存。',
      discard: '放棄修改',
      save_zero: '儲存',
      save_one: '儲存 1 項修改',
      save_other: '儲存 {{count}} 項修改',
      saved_one: '已儲存 1 個參數',
      saved_other: '已儲存 {{count}} 個參數',
    },
    nodeSettings: {
      edit: '編輯參數',
      editNamed: '編輯{{name}}的參數',
      title: '編輯{{name}}的參數',
      parameter: '設定項',
      effect:
        '修改不覆蓋申請已儲存的快照或已有任務。新提交按生效設定讀取，重提沿用各流程既有規則。',
      shared: '這是共享設定，同時影響：{{flows}}。',
      unavailable: '此節點沒有可編輯的參數，請關閉彈窗並選擇有設定入口的節點。',
      forbidden: '你沒有修改此節點設定的權限。',
      newCommittee: '發佈新的委員會結構',
      seat: '版本 {{version}} · {{name}} 席位人員',
      committeeContext:
        '目前節點版本：{{selected}}；執行中版本：{{active}}；最新儲存版本：{{latest}}。',
    },
    conditionMissing: '此分支尚缺條件說明，請核對源業務規則',
    snapshotConditions:
      '金額、天數和職級門檻以申請提交時凍結的規則為準；本定義圖說明判斷方式，不代替歷史申請的規則快照。',
    branchConditions: {
      travelCancellation_unbooking: '原出差申請需要預訂，取消時需辦理退訂',
      travelCancellation_approved: '原出差申請不需要預訂，無須辦理退訂',
      reimbursement_managerApproved_head:
        '費用報銷總金額 > 提交快照中的部門負責人門檻，且未通過主管與部門負責人同人簽核合併校驗',
      reimbursement_managerApproved_finance:
        '費用報銷總金額未超過部門負責人門檻，或已通過主管與部門負責人同人簽核合併校驗',

      training_managerApproved_head:
        '培訓金額 > 0，且未滿足主管與部門負責人同人簽核合併條件',
      training_managerApproved_finance:
        '培訓金額 > 0，主管與部門負責人同一人，且本輪同意任務滿足合併校驗',
      training_managerApproved_approved: '培訓金額為0',

      travel_managerApproved_head: '未滿足主管與部門負責人合併條件',
      travel_managerApproved_finance:
        '主管與部門負責人同一人，且本輪同意任務滿足合併校驗',
      probation_managerApproved_head: '未滿足主管與部門負責人合併條件',
      probation_managerApproved_hr:
        '主管與部門負責人同一人，且本輪同意任務滿足合併校驗',
      departure_managerApproved_head: '未滿足主管與部門負責人合併條件',
      departure_managerApproved_hr:
        '主管與部門負責人同一人，且本輪同意任務滿足合併校驗',
      expensePlan_financeApproved_executive:
        '申請金額 > 提交快照中的分管副總金額門檻',
      expensePlan_financeApproved_gm:
        '不需要分管副總簽核，且申請金額 > 提交快照中的總經理金額門檻',
      expensePlan_financeApproved_approved:
        '不滿足分管副總、總經理追加簽核條件',
      expensePlan_executiveApproved_gm:
        '申請金額 > 提交快照中的總經理金額門檻，且未通過分管副總與總經理同人簽核合併校驗',
      expensePlan_executiveApproved_approved:
        '不需總經理簽核，或已通過分管副總與總經理同人簽核合併校驗',
      loan_financeApproved_executive: '申請金額 > 提交快照中的分管副總金額門檻',
      loan_financeApproved_gm:
        '不需要分管副總簽核，且申請金額 > 提交快照中的總經理金額門檻',
      loan_financeApproved_cashier: '不滿足分管副總、總經理追加簽核條件',
      loan_executiveApproved_gm:
        '申請金額 > 提交快照中的總經理金額門檻，且未通過分管副總與總經理同人簽核合併校驗',
      loan_executiveApproved_cashier:
        '不需總經理簽核，或已通過分管副總與總經理同人簽核合併校驗',
      purchase_financeApproved_executive:
        '採購實際金額（尚未定價時用估算金額） > 提交快照中的分管副總金額門檻',
      purchase_financeApproved_gm:
        '不需要分管副總簽核，且採購實際金額（尚未定價時用估算金額） > 提交快照中的總經理金額門檻',
      purchase_financeApproved_approved: '不滿足分管副總、總經理追加簽核條件',
      purchase_executiveApproved_gm:
        '採購實際金額（尚未定價時用估算金額） > 提交快照中的總經理金額門檻，且未通過分管副總與總經理同人簽核合併校驗',
      purchase_executiveApproved_approved:
        '不需總經理簽核，或已通過分管副總與總經理同人簽核合併校驗',
      payment_financeApproved_executive:
        '需完整簽核階梯，且申請金額 > 提交快照中的分管副總金額門檻',
      payment_financeApproved_gm:
        '不需要分管副總簽核，且需完整簽核階梯，且申請金額 > 提交快照中的總經理金額門檻',
      payment_financeApproved_cashier: '不滿足分管副總、總經理追加簽核條件',
      payment_executiveApproved_gm:
        '需完整簽核階梯，且申請金額 > 提交快照中的總經理金額門檻，且未通過分管副總與總經理同人簽核合併校驗',
      payment_executiveApproved_cashier:
        '不需總經理簽核，或已通過分管副總與總經理同人簽核合併校驗',
      travel_financeApproved_executive:
        '境外出差，或申請金額 > 提交快照中的分管副總金額門檻',
      travel_financeApproved_gm:
        '不需要分管副總簽核，且（境外出差或申請金額 > 提交快照中的總經理金額門檻）',
      travel_financeApproved_booking:
        '無須再走分管副總/總經理簽核，且申請需要預訂',
      travel_financeApproved_completed:
        '無須再走分管副總/總經理簽核，且申請不需要預訂',
      travel_executiveApproved_gm:
        '（境外出差或申請金額 > 提交快照中的總經理金額門檻），且未通過分管副總與總經理同人簽核合併校驗',
      travel_executiveApproved_booking:
        '不需總經理簽核或已通過同人合併校驗，且需要預訂',
      travel_executiveApproved_completed:
        '不需總經理簽核或已通過同人合併校驗，且不需要預訂',
      travel_gmApproved_booking: '申請需要預訂',
      travel_gmApproved_completed: '申請不需要預訂',
      payment_submit_head:
        '資金來源校驗要求完整簽核階梯（含需追加簽核的超額支付）',
      payment_submit_finance: '資金來源校驗不要求完整簽核階梯',
      budgetAdjustment_cfoApproved_gm:
        '預算類型為增加，且增加金額超過提交快照的總經理簽核門檻',
      budgetAdjustment_cfoApproved_approved:
        '不是預算增加，或增加金額未超過提交快照的總經理簽核門檻',
      leave_managerApproved_head:
        '請假天數 ≥ 提交快照的部門負責人門檻，且負責人缺位或與主管不是同一人',
      leave_managerApproved_hr:
        '不滿足部門負責人追加條件，且假別要求HR或天數 ≥ 提交快照的HR門檻',
      leave_managerApproved_approved:
        '不滿足部門負責人追加條件，且假別不要求HR、天數低於HR門檻',
      leave_headApproved_hr: '假別要求HR，或請假天數 ≥ 提交快照的HR門檻',
      leave_headApproved_approved:
        '假別不要求HR，且請假天數低於提交快照的HR門檻',
      overtime_managerApproved_head:
        '當月累計加班時長 > 提交快照的月度負責人門檻，且負責人缺位或與主管不是同一人',
      overtime_managerApproved_hr:
        '不需負責人追加簽核，且在加班日期之後超過3個工作日補報',
      overtime_managerApproved_approved:
        '不需負責人追加簽核，且未超過3個工作日補報期限',
      overtime_headApproved_hr: '在加班日期之後超過3個工作日補報',
      overtime_headApproved_approved: '未超過加班日期後3個工作日的補報期限',
      supplies_submit_issuing:
        '辦理異常重新提交，且簽核覆蓋內容與上次通過簽核時一致',
      supplies_submit_manager:
        '新申請、簽核內容已改變或未滿足直接還原辦理的條件',
      vehicleRequest_submit_dispatch:
        '辦理異常重新提交，且簽核覆蓋內容與上次通過簽核時一致',
      vehicleRequest_submit_head:
        '新申請、簽核內容已改變或未滿足直接還原辦理的條件',
      purchase_submit_purchasing:
        '辦理異常重新提交，且簽核覆蓋內容與上次通過簽核時一致',
      purchase_submit_head: '新申請、簽核內容已改變或未滿足直接還原辦理的條件',
      assetRequest_submit_issuing:
        '辦理異常重新提交，且簽核覆蓋內容與上次通過簽核時一致，並通過還原資格校驗，且不是報廢申請',
      assetRequest_submit_head:
        '新申請、簽核內容已改變或未滿足直接還原辦理的條件',
      sealRequest_submit_stamping:
        '辦理異常重新提交，且簽核覆蓋內容與上次通過簽核時一致，並通過還原資格校驗',
      sealRequest_submit_head:
        '新申請、簽核內容已改變或未滿足直接還原辦理的條件',
      purchase_priced_revision:
        '實際價格 > 原估價的120%，需申請人確認後重新提交',
      purchase_priced_finance: '實際價格 ≤ 原估價的120%',
      purchase_forcedPriced_revision:
        '實際價格 > 原估價的120%，需申請人確認後重新提交',
      purchase_forcedPriced_finance: '實際價格 ≤ 原估價的120%',
      probation_hrApproved_gm:
        '轉正結論為不通過，或HR確認的職級達到提交快照的經理級門檻',
      probation_hrApproved_approved:
        '轉正結論不是不通過，且HR確認職級低於經理級門檻',
      departure_hrApproved_gm: '離職人員職級 ≥ 提交快照中的經理級門檻',
      departure_hrApproved_handover: '離職人員職級低於提交快照中的經理級門檻',
      departure_cancellationRejected_gm:
        '撤銷簽核駁回，還原到撤銷前的總經理簽核階段',
      departure_cancellationRejected_handover:
        '撤銷簽核駁回，還原到撤銷前的交接階段（其他原狀態也回到交接）',
      departure_cancellationRejected_completed:
        '撤銷簽核駁回，還原到撤銷前的完成狀態',
      recruitment_submit_head: '申請人不是部門負責人，或部門負責人缺位',
      recruitment_submit_hrbp: '申請人就是部門負責人，跳過本人簽核',
      recruitment_reviewEdit_head: '申請人不是部門負責人，或部門負責人缺位',
      recruitment_reviewEdit_hrbp: '申請人就是部門負責人，跳過本人簽核',
      recruitment_hrDirectorApproved_executive: '招募申請使用新增編制',
      recruitment_hrDirectorApproved_gm:
        '不是新增編制，且目標職級達到提交快照的總監級門檻',
      recruitment_hrDirectorApproved_approved:
        '不是新增編制，且目標職級低於總監級門檻',
      recruitment_executiveApproved_gm:
        '使用新增編制，或目標職級達到總監級門檻',
      recruitment_executiveApproved_approved:
        '非新增編制，且目標職級低於總監級門檻',
      transfer_submit_manager:
        '提交人不是員工的直屬主管（無主管時仍進入主管環節）',
      transfer_submit_sourceHead: '提交人是員工的直屬主管',
      transfer_reviewEdit_manager:
        '提交人不是員工的直屬主管（無主管時仍進入主管環節）',
      transfer_reviewEdit_sourceHead: '提交人是員工的直屬主管',
      transfer_sourceHeadApproved_targetHead: '異動類型包含部門調動',
      transfer_sourceHeadApproved_hr: '異動類型不包含部門調動',
      transfer_hrApproved_executive:
        '漲薪比例超過提交快照的副總門檻，或目標職級達到經理級',
      transfer_hrApproved_gm:
        '不需副總簽核，且漲薪比例超過總經理門檻或目標職級達到總監級',
      transfer_hrApproved_pendingEffective:
        '未達到副總/總經理的漲薪或職級追加簽核條件',
      transfer_executiveApproved_gm:
        '漲薪比例超過提交快照的總經理門檻，或目標職級達到總監級',
      transfer_executiveApproved_pendingEffective:
        '未達到總經理漲薪比例及職級追加簽核條件',
      assetRequest_headApproved_appraisal: '申請類型為資產報廢',
      assetRequest_headApproved_issuing: '申請類型不是報廢',
      assetRequest_financeApproved_gm:
        '申請類型為報廢，且資產原值合計超過提交快照的報廢總經理門檻',
      assetRequest_financeApproved_scrapped:
        '不滿足報廢原值合計超過總經理門檻的條件',
      assetRequest_issueCompleted_returning:
        '申請類型為借用，發放後進入歸還階段',
      assetRequest_issueCompleted_issued: '申請類型不是借用',
      sealRequest_stamped_returning: '印章外藉使用，須辦理歸還',
      sealRequest_stamped_completed: '不是印章外藉使用',
      vendorQualification_submit_removalReview: '申請操作為移出供應商名錄',
      vendorQualification_submit_purchasing: '申請操作不是移出供應商名錄',
      contract_headApproved_legalFinance: '合約終止申請，或未使用標準合約範本',
      contract_headApproved_standardFinance: '不是終止申請，且使用標準合約範本',
      contract_legalFinanceApproved_executive:
        '不是合約終止申請，且合約金額 > 提交快照的分管副總金額門檻',
      contract_legalFinanceApproved_gm:
        '不是合約終止申請，且不需副總簽核，並且金額超過合約總經理門檻或法務財務判定非標',
      contract_legalFinanceApproved_approved:
        '合約終止申請，或沒有副總/總經理追加簽核條件',
      contract_standardFinanceApproved_executive:
        '合約金額 > 提交快照的分管副總金額門檻',
      contract_standardFinanceApproved_gm:
        '不需副總簽核，並且金額超過合約總經理門檻',
      contract_standardFinanceApproved_approved:
        '未達到副總及合約總經理追加簽核門檻',
      contract_executiveApproved_gm: '金額超過合約總經理門檻，或合約被判定非標',
      contract_executiveApproved_approved:
        '金額未超過合約總經理門檻，且不是非標合約',
      committeeVersion: '使用提交時凍結的資質評審委員會版本對應的評審組',
      returnApplicant: '退回時選擇由申請人修改並重新提交',
      returnEarlier: '退回時選擇這個已走過的前置簽核環節',
      seal_legal: '部門負責人通過後，印章為合約章或關聯了合約',
      seal_financeManager:
        '從部門負責人或法務簽核進入，印章類型為財務章（合約路徑優先）',
      seal_gm:
        '前面法務/財務分支未命中，且為法人章或外借，目前簽核人不是總經理',
      seal_stamping:
        '法務/財務分支未命中，且無總經理追加簽核，或目前簽核人就是總經理',
    },

    conditional: '按業務條件選擇',
    transitionUnknown: '操作：{{name}}',
    transitionNames: {
      edit: '修改內容',
      submit: '提交申請',
      approved: '簽核同意',
      rejected: '簽核駁回',
      returned: '退回修改',
      withdraw: '申請人撤回',
      terminate: '終止流程',
      booked: '預訂完成',
      bookingFailed: '預訂失敗',
      bookingForced: '管理員確認完成',
      retryBooking: '重試預訂',
      reviseTrip: '修改行程',
      cancelApproved: '取消簽核通過',
      issued: '發放完成',
      unavailable: '辦理不可用 / 失敗',
      forceClosed: '強制關閉',
    },

    place: '待分配席位',
    placeNumber: '待分配席位 {{number}}',
    placeRequired: '請選擇待分配席位。',
    title: '流程管理',
    description: '查看授權範圍內的流程定義、執行記錄及簽核歷史',
    definitions: '流程定義',
    executions: '執行記錄',
    refresh: '重新整理',
    search: '搜尋編號、流程或申請人',
    definitionSearch: '搜尋流程名稱',
    clear: '清除篩選',
    all: '全部',
    name: '名稱',
    domain: '業務域',
    category: '類別',
    capabilities: '管理能力',
    approval: '簽核流程',
    connected: '已接入',
    readOnly: '僅查看',
    notConnected: '管理操作尚未接入',
    reference: '編號 / 標題',
    applicant: '申請人',
    status: '狀態',
    stage: '目前階段',
    createdAt: '發起時間',
    endedAt: '結束時間',
    empty: '暫無執行記錄',
    emptyDescription: '已接入流程的申請開始執行後會顯示在這裡',
    noDefinitions: '暫無可讀流程定義',
    noDefinitionsDescription: '請聯絡管理員設定流程讀取權限',
    noResults: '沒有匹配的記錄',
    noResultsDescription: '調整或清除篩選條件後查看記錄',
    definitionGraph: '目前流程定義',
    graphDescription: '展示目前主註冊的狀態與轉換，動態分支由業務規則決定',
    currentNode: '目前狀態',
    visitedNode: '已走過',
    unvisitedNode: '未經過',
    executionHistory: '執行歷史',
    terminationOutcome: '終止結果',
    actualPath: '實際執行路徑',
    actualDescription:
      '以完整簽核與辦理流程為背景，標注實際經過的節點、連線和目前狀態；已發生的退回或歷史路徑仍保留。',
    tasks: '任務與簽核歷史',
    timeline: '簽核與管理干預',
    run: '簽核輪次',
    historical: '歷次執行',
    definitionMissing: '歷史定義不可用',
    commentsRestricted: '簽核意見可能包含敏感內容，需要對應業務讀取權限',
    comment: '意見 / 原因',
    actor: '操作人',
    assignee: '責任人',
    answer: '決定',
    previousTask: '原任務',
    from: '從',
    to: '至',
    initial: '起點',
    final: '終態',
    transitions: '狀態轉換',
    definitionDetails: '階段與轉換',
    viewExecutions: '查看全部記錄',
    back: '返回',
    manage: '管理操作',
    appoint: '指派',
    reassign: '重新指派',
    terminate: '終止',
    unavailable: '目前任務或業務狀態不允許此操作',
    person: '接收人',
    reason: '原因',
    personRequired: '請選擇接收人',
    reasonRequired: '請填寫原因',
    cancel: '取消',
    retry: '重試',
    loadFailed: '載入失敗，請重試',
    submitFailed: '操作失敗，請核對後重試',
    unknown: '操作結果未知，請重新整理核對',
    stale: '任務已變化，請重新整理後核對',
    gone: '記錄不存在或不在目前授權範圍',
    forbidden: '無權讀取此部分，請聯絡管理員',
    loading: '正在載入',
    noPeople: '沒有符合目前任務要求的接收人',
    peopleSearch: '搜尋授權候選人員',
    loadMore: '載入更多',
    reassignTitle: '重派申請「{{recordLabel}}」的任務',
    appointTitle: '指派申請「{{recordLabel}}」的任務',
    terminateTitle: '終止申請「{{recordLabel}}」',
    reassigned: '已重派申請「{{recordLabel}}」的任務',
    appointed: '已指派申請「{{recordLabel}}」的任務',
    terminated: '已終止申請「{{recordLabel}}」',
    recentDescription: '最近五條已授權的執行記錄；完整歷史請進入執行記錄清單。',
    vehicleTerminationGuard:
      '已派車的申請不能直接終止，須由實際申請人完成用車登記並按車輛業務處理。',
    terminationConsequences: {
      vehicle: '終止尚未派車的申請；已派車記錄不能通過此操作關閉。',
      leave: '關閉目前簽核，由請假業務服務處理尚未完成的額度占用。',
      funding:
        '關閉目前簽核，由業務服務處理待完成的預算、資金或申請占用；不會撤銷已結算款項。',
      stock:
        '關閉目前簽核，由領用業務服務處理待完成的庫存占用；不會代替實物退還。',
      ordinary: '關閉目前簽核，執行該業務的終止守衛和登出處理。',
    },
    terminationDescription:
      '終止會關閉目前任務並按業務規則釋放占用，保留全部歷史；已經實際執行的業務必須另走對應撤銷或清退流程。',
    graphView: '流程圖',
    dateRange: '發起日期',
    last7: '最近7天',
    last30: '最近30天',
    last90: '最近90天',
    thisMonth: '本月',
    lastMonth: '上月',
    safeHistory: '目前清單與歷史僅包含已授權的安全流程資訊',
    business: '業務內容',
    businessRestricted: '業務內容、附件和敏感欄位需獨立授權',
    guardedBranch: '根據源業務條件選擇分支',
    frozen: '凍結欄位',
    covered: '覆蓋欄位',
    management: '管理員干預',
    kinds: {
      leave: '請假',
      overtime: '加班申請',
      leaveCancellation: '銷假申請',
      general: '通用申請',
      attendanceChange: '出勤更正',
      outing: '外出申請',
      supplies: '用品領用',
      budgetAdjustment: '預算調整',
      expensePlan: '費用事前申請',
      training: '培訓申請',
      travel: '出差申請',
      travelCancellation: '出差取消',
      reimbursement: '費用費用報銷',
      purchase: '採購申請',
      loan: '借款申請',
      payment: '付款申請',
      probation: '轉正申請',
      vehicleRequest: '車輛申請',
      contract: '合約簽核',
      assetRequest: '資產申請',
      vendorQualification: '供應商准入',
      recruitment: '招募需求',
      sealRequest: '用印申請',
      transfer: '轉崗調薪',
      departure: '離職申請',
      certificateRequest: '證明開具',
    },
    domains: {
      office: '日常辦公',
      organization: '組織與人事',
      finance: '財務與費用',
      procurement: '採購與合約',
      administration: '行政與資產',
    },
    states: {
      issued: '已發放',
      forcedClosed: '已強制關閉',
      draft: '草稿',
      revision: '待修訂',
      manager: '直屬上層',
      head: '部門負責人',
      hr: '人力資源',
      extra: '追加簽核',
      finance: '財務',
      cashier: '出納辦理',
      executive: '分管副總',
      gm: '總經理',
      cfo: 'CFO',
      legal: '法務',
      financeManager: '財務經理',
      hrbp: 'HRBP',
      hrDirector: '人力資源總監',
      approved: '已通過',
      rejected: '已駁回',
      withdrawn: '已撤回',
      terminated: '已終止',
      completed: '已完成',
      exception: '辦理異常',
      dispatch: '調度',
      usage: '實際用車',
      issuing: '發放',
      returning: '歸還',
      returnException: '歸還異常',
      stamping: '蓋章',
      booking: '預訂辦理',
      unbooking: '取消預訂',
      paid: '已付款',
      paymentException: '付款異常',
      pendingEffective: '待生效',
      cancellationReview: '取消審核',
      sourceHead: '原部門負責人',
      targetHead: '目標部門負責人',
      committee: '委員會',
      purchasing: '採購辦理',
      inquiry: '詢比價',
      quoting: '詢比價',
      pending: '待處理',
      claimed: '已認領',
      waiting: '等待中',
      blocked: '已阻塞',
      candidate: '候選待辦',
      suspended: '已掛起',
      transferred: '已轉辦',
      voided: '已關閉',
      open: '進行中',
      cancelled: '已取消',
      returned: '已退回',
      concluded: '已結束',
      decide: '簽核',
      copy: '抄送',
      approve: '同意',
      reject: '駁回',
      return: '退回',
      unknown: '其他狀態',
    },
    authz: {
      definitionRead: '流程定義',
      historyRead: '歷次執行',
      appoint: '指派',
      reassign: '重新指派',
      terminate: '終止',
    },
    otherStage: '其他環節（{{name}}）',
    otherEvent: '流程事件（{{name}}）',
    events: {
      approve: '同意',
      reject: '駁回',
      return: '退回',
      reassign: '管理員重派',
      appoint: '管理員指派',
      comment: '評論',
      transfer: '轉辦',
      addSign: '加簽',
      claim: '認領',
      release: '釋放任務',
      'stage.unassigned': '缺人掛起',
      'run.started': '簽核開始',
      'run.ended': '簽核結束',
      'stage.entered': '進入環節',
      remind: '超時提醒',
      escalate: '升級',
      read: '已讀',
    },
  },
};
