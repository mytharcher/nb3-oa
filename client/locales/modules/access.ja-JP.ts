export default {
  access: {
    guide: {
      title: 'ロールと権限の仕組み',
      roles:
        '部署、役職、職責別に操作を設定します。メンバーには、直接割り当てられた権限に加えてこれらの権限が付与されます。',
      setsTitle: '権限セット',
      sets: 'ロールの基となる付与設定です。検査や再利用に使えます。日常の変更はロールページで行ってください。',
      defaultTitle: 'デフォルトレコードアクセス',
      default:
        '操作に固有の範囲がない場合の基本範囲です。操作自体は付与しません。',
      sharingTitle: '共有ルール',
      sharing: '操作権限を持つ人が利用できるレコードを拡張します。',
      restrictionTitle: '制限ルール',
      restriction: '認可済みのレコードへのアクセスをさらに制限します。',
      inspectTitle: '権限検査',
      inspect:
        'ページやレコードを利用できない場合、有効な権限とその付与元を確認します。',
    },
    permissionColumn: '権限',
    personalGranted: '個別に付与',
    personalTarget: '個別付与の保存先を選択',
    rowSaving: '保存中…',
    rowSaved: '保存済み',
    rowFailed:
      '変更は保存されませんでした。現在の設定に戻しました。確認して再試行してください。',
    rowUncertain:
      '保存結果を確認できませんでした。さらに変更する前に更新してください。',
    inlinePermissionsHelp:
      '変更は直ちに保存されます。個別付与は継承アクセスに追加され、無効にしても継承権限は解除されません。',
    configuredOnly: '設定済み権限のみ',

    personalGrantEnabled: 'この操作を個別に付与',
    systemScope: 'システムルールを使用',
    systemScopeHelp:
      '未指定の範囲にはデフォルトアクセスと共有ルールが適用されます。全レコードを意味するものではありません。',
    grantSources: '付与元',
    scopeForAction: '{{action}}：{{scope}}範囲',
    personalGrantAction: '「{{action}}」を個別に付与',
    personalGrantScope: '「{{action}}」を個別に付与。データ範囲：{{scope}}',
    personalGrantOff: '個別付与なし。継承権限は維持されます。',
    personalGrantPending: '未保存の変更です。保存後に有効になります。',
    editPersonalCard: '{{name}}の個別権限を編集',
    userPermissions: '権限',
    inheritedPermissions: '継承権限',
    inheritedUnavailable: '継承権限へのアクセス権がありません。',
    personalOnly: '個別の例外のみ',
    notGranted: '未付与',
    notSet: '未設定',
    adjustPersonalPermissions: '個別権限を調整',
    unifiedPermissionsHelp:
      '付与元別の設定済み権限です。個別変更で継承権限は解除されません。実際のアクセスには該当する制限も適用されます。',
    sourceGroups: {
      baseline: '全員の基本アクセス',
      duties: '職責ロール',
      organization: '組織関係',
      direct: '個別付与',
      system: 'システム管理者',
    },
    noPersonalExceptions: '個別の例外なし',
    membershipChanged:
      '別の操作でメンバー構成が変更されました。現在の状態を再読み込みしました。残りの変更を確認してください。',
    username: 'ユーザー名',
    personalExceptions: '個別の例外',
    adjustExceptions: '個別の例外を調整',
    exceptionsHelp:
      'この人に直接付与された権限のみを変更します。削除後もロールや組織の権限が適用される場合があります。',
    editDenied: 'この設定を編集できません。読み取り専用で表示しています。',
    permissionSources: '権限の付与元',
    frozenConfiguration:
      'このアカウントは凍結中です。認可設定は保持され、有効化時に適用されるルールに従います。',
    frozenRoles:
      'このアカウントは凍結中です。職責ロールを追加する前に有効化してください。既存のロールは解除できます。',
    roleInactive: '非アクティブ',
    roleAdditionBlocked:
      'アカウントが凍結中か、選択したロールが無効または利用不可です。追加を取り消すか、状態を再読み込みしてから確認してください。',
    membershipUnverified:
      '結果を確認できません。続行する前にメンバー構成を再読み込みし、再送信しないでください。',
    dutyRolesHelp: 'この人に直接割り当てられた職責ロールを表示します。',
    noPrimaryDepartment: '現在の主所属部署なし',
    primaryDepartment: '主所属部署',
    departmentPath: '部署階層',
    organizationHelp: '組織所属は組織管理者が管理します。',
    roleFilterInvalid:
      'この職責ロールを利用できません。ロールフィルターを解除しました。',
    roleFilterTooLarge:
      'このロールには500人を超えるメンバーがいるため、ロールによる絞り込みはできません。フィルターを解除してください。',
    organizationState: {
      'inactive-chain':
        '主所属部署または上位部署が無効です。この組織関係は現在適用されません。',
      'invalid-chain':
        'この組織関係は無効です。組織管理者にお問い合わせください。',
    },

    scopeNumber: 'レコード範囲{{number}}',
    scopeLabels: {
      paymentRequests: '支払申請',
      reimbursementRequests: '経費精算申請',
      leaveRequests: '休暇申請',
      contractRequests: '契約承認申請',
      certificateRequests: '証明書申請',
      sealRequests: '印章使用申請',
      printTemplates: 'テンプレート',
      printTemplateRevisions: 'テンプレートバージョン',
      knowledgeDocuments: '文書',
      knowledgeVersions: '文書バージョン',
      knowledgeFolders: 'フォルダー',
      sealLedger: '印章登録',
      sealReceipts: '印章受領',
      contracts: '契約',
      contractVersions: '契約バージョン',
      contractChanges: '契約変更',
      contractPayments: '契約支払',
    },
    sourceNumber: '付与元{{number}}',
    more: 'その他',
    userRoles: 'ロール',
    permissionOverview: '権限の概要',
    noRoles: 'なし',
    organization: '組織',
    moreFor: 'その他・{{name}}',
    addModules: 'モジュールを追加',
    userDetails: 'ユーザー詳細',
    information: '情報',
    email: 'メールアドレス',
    accountStatus: 'アカウント状態',
    enabled: '有効',
    disabled: '凍結中',
    organizationReadOnly: '部署、役職、報告関係は組織管理で管理します。',
    advancedExceptions: '詳細：例外的な権限付与',
    partialSave:
      '{{count}}件の変更を保存しました。残りの変更は保持されています。再試行して続けてください。',
    addedRoles: '追加：{{names}}',
    removedRoles: '削除：{{names}}',
    compareRole: 'ロールを比較',
    copyRole: '比較元からコピー',
    copyHelp:
      '通常の権限付与をこの下書きにコピーします。特殊ポリシーは変更しません。保存前にすべての変更を確認してください。',
    advanced: '詳細',
    addRoles: '比較にロールを追加',

    directAudience: '個別の割り当て',
    dutyAudience: '職責ロールのメンバー',

    targetSet: '保存先の権限セット',
    chooseTarget: 'この操作の権限セットを選択',
    targetRequired: '保存する前に、この新しい操作の保存先を選択してください。',
    roleGrantTitle: '{{module}}（{{role}}・独立した付与{{number}}）',

    assignmentSearch: '権限、操作、レコード範囲を検索',
    assignmentOnlySelected: '選択済みのみ',
    assignmentCount:
      '{{total}}件中{{visible}}件表示・全モジュールで{{selected}}件選択',
    assignmentChoicesHelp:
      'モジュールで絞り込み、操作とレコード範囲を比較します。同名のセットも独立しています。他のモジュールの選択は保持されます。',
    assignmentBusiness: '業務操作',
    assignmentOther: '管理／その他',
    pageAccess: 'ページアクセス',
    configuredGrant: '付与済み',
    dutyMembershipTitle:
      '「{{name}}」の職責ロール「{{role}}」を{{action}}しますか？',
    exceptionSummary: '例外的な付与：{{names}}',
    noExceptions: 'なし',
    baseOnlyDepartment:
      '部署アクセスは下位部署のメンバーにも適用されます。専門業務には職責ロールを推奨します。',

    adminMembersHelp:
      '管理者はユーザーアカウントで管理します。有効な管理者を1人以上維持してください。',
    openUsers: 'ユーザーアカウントを表示',
    ruleLinks: 'アクセスルール',
    rulesHelp:
      'デフォルトアクセス、共有ルール、制限ルールも有効なアクセスに影響します。',
    defaultRules: 'デフォルトアクセス',
    sharingRules: '共有ルール',
    restrictionRules: '制限ルール',

    modules: 'モジュール別に参照',
    onlyConfigured: '設定済みのみ',
    baselineValue: '全員の基本アクセス：{{value}}',
    advancedEdit: '詳細エディター',
    changedCount: '{{count}}件の変更',
    roleImpact: '「{{name}}」の影響を受けるメンバー：{{count}}人',
    sharedObjects: '権限セットの他の割り当て先：{{names}}',
    changeShared: 'これらすべての対象を変更',
    splitDefault:
      'デフォルトでは共有セットをこのロール専用の独立したコピーに分割します。',
    userPermissionsTitle: '{{name}}の権限',
    unionHelp:
      '複数の付与元のレコード範囲は統合され、アクセスルールも適用されます。',
    assignedRoles: '割り当て済みロール',
    preferRoles: '職責ロールを優先し、直接付与は例外に使用してください。',
    exceptionGrant: '例外的な付与を管理',
    configurationDenied:
      '設定詳細を表示するには権限セットの読み取り権限が必要です。管理者にお問い合わせください。',
    checkOperation: '操作を確認',
    notConfigured: '未設定',
    applicable: '適用対象',
    modulesCount: '設定済みモジュール',
    personalAudience: '直接割り当て・{{count}}人',
    maintainedAudience: '管理対象メンバー・{{count}}人',
    automaticAudience: '組織関係から算出',
    departmentAudience: '部署と下位部署のメンバー',
    positionAudience: 'この役職に就く人',
    allAuthenticated: 'ログイン済みの全員',
    organizationMembersHelp:
      'メンバーは組織で管理され、有効な関係から算出されます。',
    openOrganization: '組織を表示',
    adjustDutyRoles: '職責ロールを調整',
    membersUnknown: 'メンバー数を取得できません',

    labelValue: '{{label}}：{{value}}',
    clearModuleFilters: 'フィルターをクリア',
    noModuleMatches: 'このモジュールに一致する権限がありません',

    businessModules: '業務モジュール',
    allModules: 'すべて',
    otherModules: 'その他',
    noModulePermissions: 'このモジュールに設定済み権限がありません',
    moduleCount: '{{module}}：{{total}}リソース中{{configured}}件を設定済み',

    actionsFor: '「{{name}}」の操作',
    configuredScopes: '設定済み範囲',

    lastAdmin:
      '有効なシステム管理者を1人以上維持する必要があります。先に後任を割り当ててください。',
    subjectNotAllowed:
      'この種類の対象にはこのアクセスを割り当てられません。別の業務アクセスを選択してください。',

    title: 'アクセス管理',
    description: 'ロール別に業務操作とレコード範囲を設定します。',
    roles: 'ロールアクセス',
    baseline: 'ログイン済みユーザーの基本アクセス',
    baselineHelp:
      '基本アクセスはログイン済みアカウントに適用されます。職責の所属は承認者候補にも影響します。',
    name: '名前',
    type: '種類',
    all: 'すべての種類',
    dutyRoles: '職責ロール',
    positions: '役職',
    departments: '部署',
    automatic: '自動アクセス',
    members: 'メンバー',
    permissions: '業務権限',
    missingMembers: 'メンバーの割り当てなし',
    memberDenied: 'メンバーアクセスを利用できません',
    membersFailed: 'メンバーを読み込めませんでした',
    byMembership: '所属により適用',
    none: '業務アクセスの割り当てなし',
    noneHelp:
      '職責を確認してから既存の業務アクセスを割り当ててください。継承アクセスは維持されます。',
    searchRoles: 'ロール、役職、部署を検索…',
    clear: 'フィルターをクリア',
    noResults: '一致する結果がありません',
    clearHelp: '検索条件を変更するか、フィルターをクリアしてください。',
    loading: '読み込み中',
    refresh: '更新',
    denied:
      'この操作へのアクセス権がありません。アクセス管理者にお問い合わせください。',
    missing: 'この項目は存在しません。一覧に戻ってください。',
    conflict:
      'アクセス設定が変更されました。再読み込みして確認してから保存してください。',
    failed:
      '操作を完了できませんでした。再試行するか管理者にお問い合わせください。',
    reload: '再読み込み',
    retry: '再試行',
    roleHelp: 'この職責のメンバー、業務操作、レコード範囲を確認します。',
    rules:
      '追加のアクセスルールが適用される場合があります。対象者のアクセスと実際の業務操作を確認してください。',
    actions: '操作',
    addMember: 'メンバーを追加',
    remove: '削除',
    memberImpact:
      '職責の所属は継承アクセスと承認者候補に影響します。解除後も他の付与元によるアクセスは維持されます。',
    assign: '業務アクセスを割り当て',
    usedBy:
      'このアクセスは{{count}}件の対象に割り当てられています。編集は全対象に影響します。',
    edit: '編集',
    special: '既存のカスタム設定',
    specialReadOnly: 'カスタム設定は読み取り専用で、保存時に保持されます。',
    noScope: 'レコード範囲の設定なし',
    systemAdmin: 'システム管理者',
    unrestricted: 'システム管理者：制限なしのアクセス',
    removeTitle: 'メンバー「{{name}}」を削除しますか？',
    cancel: 'キャンセル',
    removed: '「{{name}}」を削除しました',
    added: '「{{name}}」を追加しました',
    addMemberTitle: '{{name}}のメンバーを追加',
    add: '追加',
    person: 'ユーザー',
    selectPerson: 'この職責を担当する人を選択してください。',
    userDenied:
      'ユーザーディレクトリを表示できません。管理者にお問い合わせください。',
    direct: '直接割り当て',
    inherited: '継承アクセス',
    personUnknown: 'ユーザー（名前を取得できません）',
    back: '一覧に戻る',
    pageActionHelp:
      'ページアクセスはメニューと入口を制御します。各業務操作とレコード範囲は別に付与してください。ページを開くだけでは操作は許可されません。',
    emptyDirectory: '利用可能な対象がありません',
    emptyHelp: 'このディレクトリに現在利用可能なレコードはありません。',
    deniedAction: '権限がありません',
    sensitive: '機密性の高いアクセス',
    impactUnavailable:
      '影響全体を確認できません。この共有アクセスを変更する前に、影響を受ける対象と表示範囲を確認してください。',
    conditional: '条件付きアクセス',
    permitted: '無条件アクセス',
    assignTitle: '「{{name}}」のアクセスを変更',
    assignHelp:
      'この対象に直接付与する業務アクセスを選択します。他の付与元は保持されます。',
    noAssignable: '割り当て可能な業務アクセスがありません',
    preserveInherited:
      'ここで変更するのは直接の割り当てのみです。部署、役職、職責、基本アクセスからの継承は維持されます。',
    save: '保存',
    saved: '「{{name}}」のアクセスを保存しました',
    confirmTitle: '「{{name}}」のアクセス変更を保存しますか？',
    assignmentImpact:
      '追加・解除するアクセスを確認してください。他の付与元は維持されます。有効なシステム管理者が必要です。',
    discardTitle: '未保存の変更を破棄しますか？',
    discard: '破棄',
    discardHelp: '変更は保存されていません。破棄すると失われます。',
    editTitle: '「{{name}}」の業務アクセスを編集',
    editorHelp:
      '操作と範囲を個別に選択します。機密性の高い操作は別に設定し、保存前に影響を確認してください。',
    impact: '影響を受ける対象',
    searchActions: '業務機能または操作を検索…',
    multipleScopes: 'この操作の以下の範囲をそれぞれ設定してください。',
    levelFor: '「{{name}}」のレコード範囲',
    protected: 'このアクセスは保護されています',
    protectedHelp:
      'システム保護は維持されます。管理者の所属はユーザーアカウントで管理してください。',
    sharedHelp:
      'この変更は上記すべての対象に影響します。操作と範囲を確認してください。',
    system: 'システム職責',
  },
};
