export default {
  flowDiagram: {
    escapeHint: 'Escで終了',
    controls: '図の操作',
    zoomIn: '拡大',
    zoomOut: '縮小',
    fitView: '全体表示',
    fullscreen: '全画面',
    exitFullscreen: '全画面を終了',
    minimap: 'ミニマップ',

    empty: '表示する状態がありません。',
    loading: '図を配置中…',
    failed:
      '図を配置できません。フローパラメーターと最近の実行を確認してください。',
    nodeHelp: 'フローの状態。移動・拡大して確認できます。',
    edgeHelp: 'フローの遷移',
  },
  processManagement: {
    managementReason: '理由',
    normalDescription: '主な業務経路です。分岐は条件で決まります。',
    revealHint:
      '段階にカーソルを合わせると差し戻しや他の出口を表示し、出口に合わせると詳細を表示します。',
    graphLegend: '図の凡例',
    otherExits: 'その他の出口',
    exitNext: '次に可能な操作：',
    exitEnds: 'ここでフローが終了します。',
    nodeTypes: {
      start: '開始',
      approval: '承認',
      work: '作業段階',
      success: '完了',
      negative: '終了',
      exception: '差し戻し・例外',
    },
    rulesCount_one: '{{count}}件のルール',
    rulesCount_other: '{{count}}件のルール',
    notReached: '未到達',
    parameters: {
      title: 'フローパラメーター',
      description:
        '各段階が読み取る基準値です。各値は一度設定し、横に示したすべての段階に適用されます。',
      none: '調整可能なパラメーターはありません。',
      onNodes:
        'このフローは段階ごとに設定します。図の段階の設定ボタンを使用してください。',
      forbidden: 'このフローのパラメーターを閲覧する権限がありません。',
      readOnly: 'パラメーターは閲覧のみで変更できません。',
      changed: '変更済み',
      scheduled: '{{date}}に{{value}}へ変更。',
      orderViolated:
        '関連パラメーターとの順序が不正です。低い基準は高い基準を超えられません。両方をここで調整して一緒に保存してください。',
      discard: '変更を破棄',
      save_zero: '保存',
      save_one: '1件の変更を保存',
      save_other: '{{count}}件の変更を保存',
      saved_one: '1件のパラメーターを保存しました',
      saved_other: '{{count}}件のパラメーターを保存しました',
    },
    nodeSettings: {
      edit: 'パラメーターを編集',
      editNamed: '{{name}}のパラメーターを編集',
      title: '{{name}}のパラメーターを編集',
      parameter: 'パラメーター',
      effect:
        '変更は保存済み申請スナップショットや既存タスクを書き換えません。新規提出は有効な設定を、再提出は所属フローのルールを使用します。',
      shared: '共有設定です。影響する他のフロー：{{flows}}。',
      unavailable:
        '編集可能なパラメーターがありません。閉じて設定済みノードを選択してください。',
      forbidden: 'このノードの設定を編集する権限がありません。',
      newCommittee: '新しい委員会構成を公開',
      seat: 'バージョン{{version}}・{{name}}枠の担当者',
      committeeContext:
        '選択ノード：バージョン{{selected}}。有効：{{active}}。最新保存：{{latest}}。',
    },
    conditionMissing:
      'この分岐には明示的な条件説明が必要です。所属する業務ルールを確認してください',
    snapshotConditions:
      '金額、日数、等級の基準は提出時に固定したルールを使います。この定義は判断基準の説明であり、過去申請のスナップショットではありません。',
    branchConditions: {
      travelCancellation_unbooking:
        '元の出張に予約依頼があるため、取消時に予約解除が必要',
      travelCancellation_approved:
        '元の出張に予約依頼がないため、予約解除は不要',
      reimbursement_managerApproved_head:
        '精算合計が固定済み部署長基準を超え、上司・部署長タスクの統合検証が未通過',
      reimbursement_managerApproved_finance:
        '精算合計が部署長基準以下、または上司・部署長承認タスクが正しく統合済み',

      training_managerApproved_head:
        '研修金額 > 0、かつ上司・部署長承認タスクが未統合',
      training_managerApproved_finance:
        '研修金額 > 0、上司と部署長が同一人物で今回の承認タスク統合検証に合格',
      training_managerApproved_approved: '研修金額がゼロ',

      travel_managerApproved_head: '上司・部署長の統合条件を満たさない',
      travel_managerApproved_finance:
        '上司と部署長が同一人物で今回の承認タスク統合検証に合格',
      probation_managerApproved_head: '上司・部署長の統合条件を満たさない',
      probation_managerApproved_hr:
        '上司と部署長が同一人物で今回の承認タスク統合検証に合格',
      departure_managerApproved_head: '上司・部署長の統合条件を満たさない',
      departure_managerApproved_hr:
        '上司と部署長が同一人物で今回の承認タスク統合検証に合格',
      expensePlan_financeApproved_executive:
        '担当役員承認が必要：金額が提出時の固定役員基準を超える',
      expensePlan_financeApproved_gm:
        '担当役員承認は不要、金額が提出時の固定総経理基準を超える',
      expensePlan_financeApproved_approved:
        '担当役員・総経理の追加承認条件に該当しない',
      expensePlan_executiveApproved_gm:
        '総経理承認が必要で、担当役員・総経理タスクの統合検証が未通過',
      expensePlan_executiveApproved_approved:
        '総経理承認が不要、または担当役員・総経理承認タスクが正しく統合済み',
      loan_financeApproved_executive:
        '担当役員承認が必要：金額が提出時の固定役員基準を超える',
      loan_financeApproved_gm:
        '担当役員承認は不要、金額が提出時の固定総経理基準を超える',
      loan_financeApproved_cashier:
        '担当役員・総経理の追加承認条件に該当しない',
      loan_executiveApproved_gm:
        '総経理承認が必要で、担当役員・総経理タスクの統合検証が未通過',
      loan_executiveApproved_cashier:
        '総経理承認が不要、または担当役員・総経理承認タスクが正しく統合済み',
      purchase_financeApproved_executive:
        '担当役員承認が必要：金額が提出時の固定役員基準を超える',
      purchase_financeApproved_gm:
        '担当役員承認は不要、金額が提出時の固定総経理基準を超える',
      purchase_financeApproved_approved:
        '担当役員・総経理の追加承認条件に該当しない',
      purchase_executiveApproved_gm:
        '総経理承認が必要で、担当役員・総経理タスクの統合検証が未通過',
      purchase_executiveApproved_approved:
        '総経理承認が不要、または担当役員・総経理承認タスクが正しく統合済み',
      payment_financeApproved_executive:
        '担当役員承認が必要：全承認階層が必要で、金額が提出時の固定役員基準を超える',
      payment_financeApproved_gm:
        '担当役員承認は不要、金額が提出時の固定総経理基準を超え、全承認が必要',
      payment_financeApproved_cashier:
        '担当役員・総経理の追加承認条件に該当しない',
      payment_executiveApproved_gm:
        '総経理承認が必要で、担当役員・総経理タスクの統合検証が未通過',
      payment_executiveApproved_cashier:
        '総経理承認が不要、または担当役員・総経理承認タスクが正しく統合済み',
      travel_financeApproved_executive:
        '担当役員承認が必要：海外出張、または金額が提出時の固定役員基準を超える',
      travel_financeApproved_gm:
        '担当役員承認は不要、金額が提出時の固定総経理基準を超える',
      travel_financeApproved_booking:
        '担当役員・総経理の追加承認が不要で、予約依頼あり',
      travel_financeApproved_completed:
        '担当役員・総経理の追加承認が不要で、予約依頼なし',
      travel_executiveApproved_gm:
        '総経理承認が必要で、担当役員・総経理タスクの統合検証が未通過',
      travel_executiveApproved_booking:
        '総経理承認が不要または正しく統合済み、予約依頼あり',
      travel_executiveApproved_completed:
        '総経理承認が不要または正しく統合済み、予約依頼なし',
      travel_gmApproved_booking: '予約依頼あり',
      travel_gmApproved_completed: '予約依頼なし',
      payment_submit_head:
        '資金ソース確認により、追加承認が必要な超過支払を含む全承認階層が必要',
      payment_submit_finance: '資金ソース確認で全承認階層は不要',
      budgetAdjustment_cfoApproved_gm:
        '予算増額が提出時の固定総経理基準を超える',
      budgetAdjustment_cfoApproved_approved:
        '予算増額ではない、または増額が固定総経理基準以下',
      leave_managerApproved_head:
        '日数が固定部署長基準以上で、部署長が不在または上司と異なる',
      leave_managerApproved_hr:
        '部署長審査は不要で、休暇種類が人事審査必須か日数が固定人事基準以上',
      leave_managerApproved_approved:
        '部署長審査不要、人事必須の種類でもなく、日数が固定人事基準未満',
      leave_headApproved_hr: '休暇種類が人事必須、または日数が固定人事基準以上',
      leave_headApproved_approved:
        '休暇種類が人事必須ではなく、日数が固定人事基準未満',
      overtime_managerApproved_head:
        '月間時間外勤務が固定部署長基準を超え、部署長が不在または上司と異なる',
      overtime_managerApproved_hr:
        '部署長審査不要、時間外勤務日から3勤務日超で提出',
      overtime_managerApproved_approved:
        '部署長審査不要、3勤務日の報告期間内に提出',
      overtime_headApproved_hr: '時間外勤務日から3勤務日を超えて提出',
      overtime_headApproved_approved: '時間外勤務日から3勤務日以内に提出',
      supplies_submit_issuing: '承認済み内容を変えずに履行例外から再提出',
      supplies_submit_manager:
        '新規申請、承認対象内容の変更、または再開条件を満たさない',
      vehicleRequest_submit_dispatch:
        '承認済み内容を変えずに履行例外から再提出',
      vehicleRequest_submit_head:
        '新規申請、承認対象内容の変更、または再開条件を満たさない',
      purchase_submit_purchasing: '承認済み内容を変えずに履行例外から再提出',
      purchase_submit_head:
        '新規申請、承認対象内容の変更、または再開条件を満たさない',
      assetRequest_submit_issuing:
        '承認済み内容を変えず履行例外から再提出、再開条件合格、廃棄申請ではない',
      assetRequest_submit_head:
        '新規申請、承認対象内容の変更、または再開条件を満たさない',
      sealRequest_submit_stamping:
        '承認済み内容を変えず履行例外から再提出、再開条件合格',
      sealRequest_submit_head:
        '新規申請、承認対象内容の変更、または再開条件を満たさない',
      purchase_priced_revision:
        '実価格が当初見積の120%を超過。申請者の確認と再提出が必要',
      purchase_priced_finance: '実価格が当初見積の120%以下',
      purchase_forcedPriced_revision:
        '実価格が当初見積の120%を超過。申請者の確認と再提出が必要',
      purchase_forcedPriced_finance: '実価格が当初見積の120%以下',
      probation_hrApproved_gm:
        '本採用見送り、または人事確認等級が固定マネージャー順位基準以上',
      probation_hrApproved_approved:
        '本採用見送りではなく、人事確認等級がマネージャー基準未満',
      departure_hrApproved_gm:
        '従業員等級が提出時の固定マネージャー順位基準以上',
      departure_hrApproved_handover: '従業員等級が固定マネージャー順位基準未満',
      departure_cancellationRejected_gm:
        '取消拒否：保存済みの取消前総経理状態に戻る',
      departure_cancellationRejected_handover:
        '取消拒否：保存済みの取消前引継ぎ状態に戻る',
      departure_cancellationRejected_completed:
        '取消拒否：保存済みの取消前完了状態に戻る',
      recruitment_submit_head: '申請者が部署長ではない、または部署長が不在',
      recruitment_submit_hrbp: '申請者が部署長のため自己承認を省略',
      recruitment_reviewEdit_head: '申請者が部署長ではない、または部署長が不在',
      recruitment_reviewEdit_hrbp: '申請者が部署長のため自己承認を省略',
      recruitment_hrDirectorApproved_executive: '増員の採用申請',
      recruitment_hrDirectorApproved_gm:
        '増員ではなく、目標等級が固定部長順位基準以上',
      recruitment_hrDirectorApproved_approved:
        '増員ではなく、目標等級が部長順位基準未満',
      recruitment_executiveApproved_gm: '増員、または目標等級が部長基準以上',
      recruitment_executiveApproved_approved:
        '増員ではなく、目標等級が部長基準未満',
      transfer_submit_manager:
        '提出者が従業員の上司ではない。上司不在でも上司審査に進む',
      transfer_submit_sourceHead: '提出者が従業員の上司',
      transfer_reviewEdit_manager:
        '提出者が従業員の上司ではない。上司不在でも上司審査に進む',
      transfer_reviewEdit_sourceHead: '提出者が従業員の上司',
      transfer_sourceHeadApproved_targetHead: '変更に部署異動を含む',
      transfer_sourceHeadApproved_hr: '変更に部署異動を含まない',
      transfer_hrApproved_executive:
        '昇給率が固定役員基準を超える、または目標等級がマネージャー順位以上',
      transfer_hrApproved_gm:
        '役員審査不要、昇給率が固定総経理基準超または目標等級が部長順位以上',
      transfer_hrApproved_pendingEffective:
        '担当役員・総経理の追加審査に該当する昇給・等級条件なし',
      transfer_executiveApproved_gm:
        '昇給率が固定総経理基準を超える、または目標等級が部長順位以上',
      transfer_executiveApproved_pendingEffective:
        '総経理の追加審査に該当する昇給・等級条件なし',
      assetRequest_headApproved_appraisal: '資産廃棄申請',
      assetRequest_headApproved_issuing: '資産廃棄申請ではない',
      assetRequest_financeApproved_gm:
        '廃棄申請で、取得価額合計が固定廃棄総経理基準を超える',
      assetRequest_financeApproved_scrapped: '廃棄取得価額が総経理基準以下',
      assetRequest_issueCompleted_returning: '借用申請：交付後に返却処理へ進む',
      assetRequest_issueCompleted_issued: '借用申請ではない',
      sealRequest_stamped_returning: '社外持出の印章借用は返却処理が必要',
      sealRequest_stamped_completed: '印章の社外使用ではない',
      vendorQualification_submit_removalReview: '仕入先を名簿から削除する操作',
      vendorQualification_submit_purchasing: '仕入先削除ではない操作',
      contract_headApproved_legalFinance: '契約終了または非標準テンプレート',
      contract_headApproved_standardFinance:
        '契約終了ではなく標準テンプレートを使用',
      contract_legalFinanceApproved_executive:
        '契約金額が固定役員基準を超え、終了ではない',
      contract_legalFinanceApproved_gm:
        '役員審査不要、金額が固定契約総経理基準超または法務・財務が非標準指定、終了ではない',
      contract_legalFinanceApproved_approved: '終了、または追加承認条件なし',
      contract_standardFinanceApproved_executive:
        '契約金額が固定役員基準を超える',
      contract_standardFinanceApproved_gm:
        '役員審査不要、金額が固定契約総経理基準を超える',
      contract_standardFinanceApproved_approved: '役員と契約総経理の両基準以下',
      contract_executiveApproved_gm:
        '金額が固定契約総経理基準を超える、または非標準契約',
      contract_executiveApproved_approved: '金額が契約総経理基準以下で標準契約',
      committeeVersion: '提出時の固定バージョンに一致する委員会グループを使用',
      returnApplicant: '差し戻し判断で申請者の修正・再提出を選択',
      returnEarlier: '差し戻し判断で以前に入ったこの承認段階を選択',
      seal_legal: '部署長審査後：契約印章または関連契約あり',
      seal_financeManager:
        '部署長・法務審査から：契約経路を優先した後の財務印章',
      seal_gm:
        '法務・財務分岐なし、代表者印章または社外使用で現在の審査者が総経理ではない',
      seal_stamping:
        '法務・財務分岐も総経理追加審査もなし、または現在の審査者が総経理',
    },

    conditional: '業務条件を適用',
    transitionUnknown: '操作：{{name}}',
    transitionNames: {
      edit: '内容を編集',
      submit: '提出',
      approved: '承認通過',
      rejected: '却下',
      returned: '修正のため差し戻す',
      withdraw: '取り下げ',
      terminate: '終了',
      booked: '予約完了',
      bookingFailed: '予約失敗',
      bookingForced: '完了を確認',
      retryBooking: '予約を再試行',
      reviseTrip: '出張を修正',
      cancelApproved: '取消承認済み',
      issued: '交付完了',
      unavailable: '利用不可／履行失敗',
      forceClosed: '強制終了',
    },

    place: '空き承認枠',
    placeNumber: '空き承認枠{{number}}',
    placeRequired: '空き承認枠を選択してください。',
    title: 'フロー管理',
    description: '権限のあるフロー定義、実行、承認履歴を閲覧',
    definitions: '定義',
    executions: '実行',
    refresh: '更新',
    search: '番号、フロー、申請者で検索',
    definitionSearch: 'フロー名で検索',
    clear: 'フィルターをクリア',
    all: 'すべて',
    name: '名前',
    domain: '業務領域',
    category: '区分',
    capabilities: '管理機能',
    approval: '承認フロー',
    connected: '接続済み',
    readOnly: '読み取り専用',
    notConnected: '管理操作は未接続',
    reference: '番号／タイトル',
    applicant: '申請者',
    status: '状態',
    stage: '現在の段階',
    createdAt: '開始日時',
    endedAt: '終了',
    empty: '実行はまだありません',
    emptyDescription: '接続済みフローの実行開始後にここに表示されます',
    noDefinitions: '閲覧可能な定義がありません',
    noDefinitionsDescription: '管理者に定義アクセス設定を依頼してください',
    noResults: '一致するレコードがありません',
    noResultsDescription:
      'フィルターを調整または解除してレコードを探してください',
    definitionGraph: '現在の定義',
    graphDescription:
      '現在登録された状態と遷移です。動的分岐は業務ルールで決まります',
    currentNode: '現在の状態',
    visitedNode: '通過済み',
    unvisitedNode: '未通過',
    executionHistory: '実行履歴',
    terminationOutcome: '終了結果',
    actualPath: '実際の実行経路',
    actualDescription:
      '承認と履行のフロー全体で、通過ノード、遷移、現在状態を強調します。実際の差し戻しと過去の経路も表示します。',
    tasks: 'タスク・承認履歴',
    timeline: '承認・管理履歴',
    run: '承認実行',
    historical: '実行履歴',
    definitionMissing: '過去の定義を利用できません',
    commentsRestricted:
      'コメントには非公開情報が含まれる場合があり、別の業務アクセスが必要です',
    comment: 'コメント／理由',
    actor: '操作者',
    assignee: '割り当て先',
    answer: '判定',
    previousTask: '前のタスク',
    from: '遷移元',
    to: '遷移先',
    initial: '初期',
    final: '最終',
    transitions: '状態遷移',
    definitionDetails: '段階と遷移',
    viewExecutions: 'すべてのレコードを表示',
    back: '戻る',
    manage: '管理操作',
    appoint: '割り当て',
    reassign: '再割り当て',
    terminate: '終了',
    unavailable: '現在のタスクまたは業務状態では操作できません',
    person: '受信者',
    reason: '理由',
    personRequired: '受取人を選択',
    reasonRequired: '理由を入力',
    cancel: 'キャンセル',
    retry: '再試行',
    loadFailed: '読み込み失敗。再試行してください',
    submitFailed: '操作失敗。確認して再試行してください',
    unknown: '結果不明。更新して確認してください',
    stale: 'タスクが変更されました。更新して確認してください',
    gone: 'レコードが存在しないか現在の範囲外です',
    forbidden: 'この区分を読み取れません。管理者にお問い合わせください',
    loading: '読み込み中',
    noPeople: '現在のタスクに適格な受取人がいません',
    peopleSearch: '権限のある受取人を検索',
    loadMore: 'さらに読み込む',
    reassignTitle: '「{{recordLabel}}」のタスクを再割り当て',
    appointTitle: '「{{recordLabel}}」のタスクを割り当て',
    terminateTitle: '申請「{{recordLabel}}」を終了',
    reassigned: '「{{recordLabel}}」のタスクを再割り当てしました',
    appointed: '「{{recordLabel}}」のタスクを割り当てました',
    terminated: '申請「{{recordLabel}}」を終了しました',
    recentDescription:
      '最新5件の権限のある実行です。全履歴は実行一覧を開いてください。',
    vehicleTerminationGuard:
      '配車済み申請を直接終了できません。実際の申請者が使用を登録し、車両業務フローに従ってください。',
    terminationConsequences: {
      vehicle: '未配車の申請を終了します。配車済み申請は終了できません。',
      leave:
        '現在の承認を終了します。未処理の枠予約は休暇サービスが処理します。',
      funding:
        '現在の承認を終了します。未処理の予算、資金、申請予約は業務サービスが処理します。精算済み支払は保持されます。',
      stock:
        '現在の承認を終了します。在庫予約は消耗品サービスが処理します。現物返却は専用業務フローが必要です。',
      ordinary: '現在の承認を終了し、業務終了のガードと退出処理を実行します。',
    },
    terminationDescription:
      '終了は履歴を保持し、業務ルールに従い現在のタスクと予約を解放します。実行済み業務の取消や保管清算は専用処理が必要です。',
    graphView: '図',
    dateRange: '開始日',
    last7: '過去7日',
    last30: '過去30日',
    last90: '過去90日',
    thisMonth: '今月',
    lastMonth: '先月',
    safeHistory: 'この画面には権限のある安全なフロー情報のみを表示します',
    business: '業務内容',
    businessRestricted:
      '業務内容、添付、非公開項目には別のアクセス権が必要です',
    guardedBranch: '元業務条件に従い選択した分岐',
    frozen: '固定フィールド',
    covered: '対象フィールド',
    management: '管理者介入',
    kinds: {
      itRepair: 'IT repair',
      leave: '休暇',
      overtime: '時間外勤務',
      leaveCancellation: '休暇取消',
      general: '一般申請',
      attendanceChange: '勤怠修正',
      outing: '外出',
      supplies: '消耗品申請',
      budgetAdjustment: '予算調整',
      expensePlan: '経費承認',
      training: '研修',
      travel: '出張',
      travelCancellation: '出張取消',
      reimbursement: '経費精算',
      purchase: '購入',
      loan: '貸付申請',
      payment: '支払申請',
      probation: '試用期間審査',
      vehicleRequest: '車両利用申請',
      contract: '契約',
      assetRequest: '資産申請',
      vendorQualification: '仕入先資格',
      recruitment: '採用',
      sealRequest: '印章使用申請',
      transfer: '人事異動',
      departure: '退職',
      certificateRequest: '証明書申請',
    },
    domains: {
      office: '日常業務',
      organization: '組織・人事',
      finance: '財務・経費',
      procurement: '調達・契約',
      administration: '総務・資産',
    },
    states: {
      issued: '交付済み',
      forcedClosed: '強制終了済み',
      draft: '下書き',
      revision: 'リビジョン',
      manager: '上司',
      head: '部署長',
      hr: '人事',
      extra: '追加審査',
      finance: '財務',
      cashier: '出納担当者',
      executive: '担当役員',
      gm: '総経理',
      cfo: 'CFO',
      legal: '法務',
      financeManager: '財務マネージャー',
      hrbp: 'HRBP',
      hrDirector: '人事部長',
      approved: '承認済み',
      rejected: '却下済み',
      withdrawn: '取り下げ済み',
      terminated: '終了済み',
      completed: '完了',
      exception: '処理例外',
      dispatch: '配車',
      usage: '車両使用',
      issuing: '交付中',
      returning: '返却中',
      returnException: '返却例外',
      stamping: '押印中',
      booking: '予約中',
      unbooking: '予約を取消',
      paid: '支払済み',
      paymentException: '支払例外',
      pendingEffective: '発効日待ち',
      cancellationReview: '取消審査',
      sourceHead: '異動元部署長',
      targetHead: '異動先部署長',
      committee: '委員会',
      purchasing: '購買',
      inquiry: '照会',
      quoting: '見積',
      pending: '待機中',
      claimed: '引き受け済み',
      waiting: '待機',
      blocked: '停止',
      candidate: '候補',
      suspended: '中断',
      transferred: '転送済み',
      voided: '終了',
      open: '未終了',
      cancelled: 'キャンセル済み',
      returned: '返却済み',
      concluded: '完結',
      decide: '判定',
      copy: '共有',
      approve: '承認',
      reject: '却下',
      return: '差し戻し',
      unknown: 'その他の状態',
    },
    authz: {
      definitionRead: '定義',
      historyRead: '実行履歴',
      appoint: '割り当て',
      reassign: '再割り当て',
      terminate: '終了',
    },
    otherStage: 'その他の段階（{{name}}）',
    otherEvent: 'フローイベント（{{name}}）',
    events: {
      approve: '承認済み',
      reject: '却下済み',
      return: '差し戻し済み',
      reassign: '管理者による再割り当て',
      appoint: '管理者による割り当て',
      comment: 'コメント',
      transfer: '転送済み',
      addSign: '承認者追加済み',
      claim: '引き受け済み',
      release: 'タスク解放済み',
      'stage.unassigned': '未割り当ての段階',
      'run.started': '承認開始',
      'run.ended': '承認終了',
      'stage.entered': '段階へ進入',
      remind: 'リマインダー',
      escalate: 'エスカレーション済み',
      read: '既読',
    },
  },
};
