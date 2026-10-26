/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: '部署',
      positions: '役職',
      grades: '等級',
      dutyRoles: '職責ロール',
    },
    authz: {
      section: '組織・人員',
      departments: '部署',
      positions: '役職',
      grades: '等級',
      dutyRoles: '職責ロール',
      read: '表示',
      update: '管理',
    },
    subjects: {
      departments: '部署',
      heads: '部署長',
      dutyRoles: '職責ロール',
      disabled: '無効',
    },
    scopes: {
      mine: '自分の部署',
      mineHint: '自分が所属または長を務める部署のメンバーが所有するレコード。',
      mineAndBelow: '自分の部署と下位部署',
      mineAndBelowHint: '自分の部署と全下位部署のメンバーが所有するレコード。',
      headed: '自分が長を務める部署と下位部署',
      headedHint:
        '自分が長を務める部署と全下位部署のメンバーが所有するレコード。',
    },
    dutyRoleTitles: {
      gm: '総経理',
      cfo: 'CFO',
      hr: '人事担当者',
      hrbp: 'HRBP',
      hrDirector: '人事部長',
      admin: '管理',
      sealKeeper: '印章管理者',
      finance: '会計担当者',
      financeManager: '財務マネージャー',
      cashier: '出納担当者',
      legal: '法務',
      purchasing: '購買',
      it: 'IT',
      committeeTech: '審査委員会（技術枠）',
    },
    common: {
      active: '有効',
      inactive: '無効',
      allStatuses: 'すべての状態',
      noResults: 'フィルターに一致する項目がありません。',
      clearFilters: 'フィルターをクリア',
      clearSearch: '検索をクリア',
      searchByTitleOrCode: '名前またはコードで検索',
      askAdministrator: '管理者に設定を依頼してください。',
      fields: {
        title: '名前',
        code: 'コード',
        status: '状態',
        name: '名前',
        email: 'メールアドレス',
        user: 'ユーザー',
      },
      actions: {
        label: '操作',
        more: '{{name}}の操作',
        edit: '編集',
        enable: '有効にする',
        disable: '無効にする',
      },
      form: {
        titleRequired: '名前を入力してください。',
        titleTooLong: '{{max}}文字以内で入力してください。',
        codeRequired: 'コードを入力してください。',
        codeFormat:
          '先頭を英数字とし、英数字、「.」「_」「-」で64文字以内にしてください。',
        codeHint: 'インポートや他のシステムで使う固定識別子です。',
        integer: '整数を入力してください。',
        userRequired: '担当者を選択してください。',
      },
    },
    errors: {
      executiveTopLevelOnly:
        '担当役員を指定できるのは最上位部署だけです。下位部署は継承します。',
      codeTaken: 'このコードは使用済みです。別のコードを選択してください。',
      parentCycle: '部署を自分自身や配下部署の下に移動できません。',
      parentNotFound: '親部署が存在しません。別の部署を選択してください。',
      userNotFound: 'この人は存在しないか無効です。',
      notFound: 'このレコードは存在しないか削除されています。',
      forbidden: 'この操作の権限がありません。',
      requestFailed: 'リクエストに失敗しました。もう一度お試しください。',
    },
    departmentPicker: {
      placeholder: '部署を検索',
      empty: '一致する部署はありません',
      loadFailed: '部署を読み込めません。',
      inactivePath: '{{path}}（無効）',
    },
    departments: {
      title: '部署',
      description:
        '部署階層、部署長、メンバーを管理します。部署を無効にすると配下もすべて無効になります。',
      create: '新しい部署',
      createChild: '新しい下位部署',
      editTitle: '部署を編集',
      formDescription: '親を変更すると配下全体とともに部署が移動します。',
      created: '部署「{{name}}」を作成しました',
      saved: '部署「{{name}}」を保存しました',
      enabled: '部署「{{name}}」を有効化しました',
      disabled: '部署「{{name}}」を無効化しました',
      disableTitle: '部署「{{name}}」を無効にしますか？',
      disableDescription:
        '下位部署も集計対象外になり、メンバーは部署の権限を継承しなくなります。削除はされず、いつでも有効化できます。',
      loadFailed: '部署を読み込めません',
      emptyTitle: '部署はまだありません',
      emptyDescription:
        '組織の最上位を作成してから配下の部署を追加してください。',
      noResults: '検索条件に一致する部署はありません。',
      searchPlaceholder: '部署名またはコードで検索',
      treeLabel: '部署ツリー',
      choose: '左側の部署を選択して詳細を確認してください。',
      notFound: 'この部署は存在しないか削除されています。',
      backToTree: 'ツリーに戻る',
      topLevel: '最上位部署',
      inheritedFrom: '（「{{name}}」から継承）',
      inactiveByAncestor: '「{{name}}」とともに無効',
      fields: {
        parent: '親部署',
        manager: '部署長',
        executive: '担当役員',
        sortOrder: '並び順',
      },
      form: {
        codeHint: '任意です。インポートはコードで部署を更新します。',
        parentPlaceholder: '最上位（親なし）',
        parentHint: '最上位部署の場合は空欄にしてください。',
        managerHint:
          '承認をこの人に送ります。部署メンバーである必要はありません。空欄なら親部署の長を使用します。',
        executiveHint:
          '最上位部署のみ指定できます。親を選ぶとこの項目はクリアされ、下位部署は継承します。',
        sortOrderHint: '同階層内では小さい数が先になります。',
      },
      members: {
        title: 'メンバー（{{count}}人）',
        description:
          '直属メンバーです。各人には承認と予算に使う主所属部署が1つあります。',
        add: 'メンバーを追加',
        addTitle: '「{{name}}」にメンバーを追加',
        added: '「{{name}}」を「{{department}}」に追加しました',
        primary: '部署区分',
        primaryBadge: '主所属',
        secondaryBadge: '副所属',
        makePrimary: '主所属部署に設定',
        primarySet: '「{{name}}」の主所属部署に設定しました',
        makePrimaryField: 'この人の主所属部署にする',
        makePrimaryHint:
          '現在の主所属部署を置き換えます。未選択の場合、主所属がないときだけ主所属になります。',
        remove: '部署から削除',
        removeTitle: '「{{name}}」を「{{department}}」から削除しますか？',
        removeDescription:
          'この部署の権限を継承しなくなります。主所属だった場合、別に設定するまで主所属はなくなります。',
        removed: '「{{name}}」を「{{department}}」から削除しました',
        loadFailed: 'メンバーを読み込めません',
        emptyTitle: 'メンバーはまだいません',
        emptyDescription: 'この部署で働く人を追加してください。',
      },
    },
    positions: {
      title: '役職',
      description: '従業員記録が参照する役職です。削除せず無効化してください。',
      create: '新しい役職',
      editTitle: '役職を編集',
      formDescription: '名前を変更してもコードは維持されます。',
      created: '役職「{{name}}」を作成しました',
      saved: '役職「{{name}}」を保存しました',
      enabled: '役職「{{name}}」を有効化しました',
      disabled: '役職「{{name}}」を無効化しました',
      disableTitle: '役職「{{name}}」を無効にしますか？',
      disableDescription:
        '新しい割り当てでは選択できなくなります。現在の従業員の役職は維持されます。',
      loadFailed: '役職を読み込めません',
      notFound: 'この役職は存在しないか削除されています。',
      emptyTitle: '役職はまだありません',
      emptyDescription:
        '「購買担当者」など、従業員の採用先役職を追加してください。',
      fields: { number: '並び順' },
      form: {
        numberRequired: '並び順を入力してください。',
        numberHint: '任意です。小さい数が先になります。',
      },
    },
    grades: {
      title: '等級',
      description:
        'P5、M2などの職務等級です。順位が出張基準と承認階層の上下関係を決めます。',
      create: '新しい等級',
      editTitle: '等級を編集',
      formDescription: '名前を変更してもコードは維持されます。',
      created: '等級「{{name}}」を作成しました',
      saved: '等級「{{name}}」を保存しました',
      enabled: '等級「{{name}}」を有効化しました',
      disabled: '等級「{{name}}」を無効化しました',
      disableTitle: '等級「{{name}}」を無効にしますか？',
      disableDescription:
        '新しい割り当てでは選択できなくなります。現在の従業員の役職は維持されます。',
      loadFailed: '等級を読み込めません',
      notFound: 'この等級は存在しないか削除されています。',
      emptyTitle: '等級はまだありません',
      emptyDescription:
        '順位付きで等級を追加してください。大きい順位ほど上位です。',
      fields: { number: '順位' },
      form: {
        numberRequired: '順位を入力してください。',
        numberHint: '整数で、大きいほど上位です。',
      },
    },
    dutyRoles: {
      title: '職責ロール',
      description:
        '承認と処理段階はこれらのロールで担当者を探します。各ロールの操作権限は権限設定で指定してください。',
      viewMembers: 'メンバーを表示',
      drawerDescription:
        'この職責を持つ人です。ロールに割り当てられた承認段階を担当します。',
      enabled: '職責ロール「{{name}}」を有効化しました',
      disabled: '職責ロール「{{name}}」を無効化しました',
      disableTitle: '職責ロール「{{name}}」を無効にしますか？',
      disableDescription:
        'メンバーはロールを持たなくなり、承認段階で担当者が見つからず、割り当て権限も適用されません。メンバー情報は保持されます。',
      loadFailed: '職責ロールを読み込めません',
      detailFailed: '職責ロールを読み込めません',
      notFound:
        'この職責ロールは存在しません。パネルを閉じて一覧に戻ってください。',
      emptyTitle: '職責ロールがありません',
      emptyDescription:
        '職責ロールはアプリとともにインストールされます。管理者にインストール状態の確認を依頼してください。',
      fields: {
        code: 'コード',
        memberCount: 'メンバー',
        description: '説明',
      },
      members: {
        title: 'メンバー（{{count}}人）',
        add: 'メンバーを追加',
        addTitle: '「{{role}}」にメンバーを追加',
        added: '「{{name}}」を「{{role}}」に追加しました',
        remove: '削除',
        removeTitle: '「{{name}}」を「{{role}}」から削除しますか？',
        removeDescription:
          'このロールの承認と割り当て権限を受け取らなくなります。',
        removed: '「{{name}}」を「{{role}}」から削除しました',
        alreadyRemoved: 'この人は既に削除されています。',
        emptyTitle: 'メンバーはまだいません',
        emptyDescription:
          'この職責の担当者を追加してください。追加するまで承認段階は待機します。',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
