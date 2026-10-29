/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: '勤務カレンダー',
      dictionaries: '辞書',
      rules: 'ルール概要・履歴',
      sequences: '伝票番号',
      auditLogs: '監査ログ',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'OA基盤',
      calendar: '勤務カレンダー',
      dictionaries: '辞書',
      rules: 'ルール概要・履歴',
      sequences: '伝票番号',
      auditLogs: '監査ログ',
      actions: { read: '表示', update: '編集' },
    },
    common: {
      actions: '操作',
      actionsFor: '{{name}}の操作',
      edit: '編集',
      delete: '削除',
      refresh: '更新',
      clearFilters: 'フィルターをクリア',
      noResults: 'フィルターに一致する項目がありません。',
      forbidden: '閲覧権限がありません。',
      notFound: 'このレコードは存在しないか削除されています。',
      loadFailed:
        'データを読み込めませんでした。接続を確認して再試行してください。',
      writeForbidden: 'この変更の権限がありません。',
      saveFailed: '変更を保存できませんでした。再試行してください。',
    },
    calendar: {
      title: '勤務カレンダー',
      description: '勤務時間と各年の祝日・振替出勤日を管理します。',
      loadFailedTitle: 'カレンダー設定を読み込めませんでした',
      kinds: {
        holiday: '祝日',
        adjustedWorkday: '振替出勤日',
        workday: '勤務日',
        weekend: '休日',
      },
      workHours: {
        title: '勤務時間',
        description:
          '承認リマインダーとエスカレーションは勤務日のこの時間のみを計算します。',
        start: '開始日時',
        end: '終了日時',
        range: '{{start}}～{{end}}',
        invalidTime: '09:00のような時刻を入力してください。',
        endBeforeStart: '終了は開始より後にしてください。',
        scheduled: '{{date}}以降：{{start}}～{{end}}',
        saved: '勤務時間を保存しました',
      },
      timeZone: {
        title: 'タイムゾーン',
        description:
          'カレンダーと伝票番号で使用するタイムゾーンです。変更は即時適用されます。',
        label: 'タイムゾーン',
        hint: 'Asia/ShanghaiなどのIANAタイムゾーン名。',
        required: 'タイムゾーンを入力してください。',
        invalid:
          'サーバーが認識できないタイムゾーンです。Asia/Shanghaiなどを使用してください。',
        saved: 'タイムゾーンを保存しました',
      },
      days: {
        remove: '削除',
        title: '特別日',
        description: '未指定の日は曜日に従い、月～金を勤務日とします。',
        previousYear: '前年',
        nextYear: '翌年',
        add: '日付を追加',
        addTitle: '日付を追加',
        addDescription: '既存の日付は置き換えます。',
        addSubmit: '追加',
        editTitle: '{{date}}を編集',
        import: 'インポート',
        date: '日付',
        weekday: '曜日',
        kind: '種類',
        note: 'メモ',
        dateRequired: '日付を選択してください。',
        noteTooLong: '{{max}}文字以内で入力してください。',
        emptyTitle: '{{year}}年の特別日はまだありません',
        emptyDescription:
          '年の祝日・振替出勤日をインポートするか、個別に追加してください。',
        emptyReadOnly:
          'すべての日は曜日に従います。管理者に祝日のインポートを依頼してください。',
        saved: '「{{date}}」を保存しました',
        removed: '「{{date}}」を削除しました',
        removeTitle: '「{{date}}」を削除しますか？',
        removeDescription: 'この日付は再び曜日に従います。',
        notFound: 'この日は一覧にありません。削除された可能性があります。',
      },
      import: {
        title: '{{year}}年の特別日をインポート',
        description: '1行に日付、種類、任意のメモを貼り付けてください。',
        lines: '日数',
        placeholder:
          '{{year}}-10-01,holiday,国慶節\n{{year}}-10-10,adjustedWorkday',
        hint: 'カンマかタブで区切ります。種類：holiday、adjustedWorkday、workday、weekend（または休／班）。',
        replace: '年全体を置き換え',
        replacePreview:
          '現在のカレンダーでは、{{year}}年の既存特別日{{count}}件が今回のインポートに含まれず削除されます。保存前に他ユーザーが変更する場合があります。',
        previewFailed:
          '年全体のカレンダーを読み込めませんでした。置き換え前に再試行してください。',
        confirmReplaceTitle: '{{year}}年の特別日を置き換えますか？',
        replaceHint: '一覧にない{{year}}年の特別日を削除します。',
        submit: 'インポート',
        emptyText: '1日以上貼り付けてください。',
        success:
          'インポート：{{created}}件追加、{{updated}}件変更、{{removed}}件削除',
        problems: {
          format: '{{line}}行目に日付と種類が必要です。',
          date: '{{line}}行目の日付が不正です。',
          kind: '{{line}}行目の種類が不明です。',
          year: '{{line}}行目は{{year}}年ではありません。',
          duplicate: '{{line}}行目の日付が重複しています。',
        },
      },
    },
    dictionaries: {
      title: '辞書',
      description:
        '申請フォームの選択肢を管理します。項目は削除せず無効化します。',
      loadFailedTitle: '辞書を読み込めませんでした',
      searchPlaceholder: '名前またはコードで検索',
      searchLabel: '項目を検索',
      notFound: 'この項目は存在しないか削除されています。',
      enable: '有効にする',
      enabled: '「{{name}}」を有効化しました',
      disable: '無効にする',
      disabled: '「{{name}}」を無効化しました',
      disableTitle: '「{{name}}」を無効にしますか？',
      disableDescription:
        '既存申請では表示が維持されますが、新規申請では選べなくなります。再有効化できます。',
      extraValue: '{{name}}：{{value}}',
      extraUnlimited: '{{name}}：制限なし',
      fields: {
        type: '辞書の種類',
        label: '名前',
        labelZh: '名前（中国語）',
        labelEn: '名前（英語）',
        code: 'コード',
        extra: '属性',
        sortOrder: '順序',
        status: '状態',
      },
      status: { all: 'すべての状態', active: '有効', inactive: '無効' },
      empty: {
        title: 'この種類の項目はまだありません',
        description: '最初の項目を追加してフォームで選べるようにしてください。',
        readOnly: '管理者に項目追加を依頼してください。',
      },
      create: {
        action: '新しい項目',
        title: '新しい項目：{{type}}',
        success: '項目「{{name}}」を作成しました',
      },
      edit: { title: '項目を編集', success: '項目「{{name}}」を保存しました' },
      form: {
        description: '{{type}}の項目です。1言語以上で名前を入力してください。',
        codeHint:
          '先頭は英字、以降は英数字、_、-を使用します。後で変更できません。',
        codeFixed: 'レコードがコードを保存するため、変更できません。',
        codeInvalid: '先頭は英字、英数字、_、-で64文字以内にしてください。',
        codeTaken: 'この種類には同じコードの項目があります。',
        labelRequired: '1言語以上で名前を入力してください。',
        labelTooLong: '{{max}}文字以内で入力してください。',
        sortOrderHint: 'フォームでは小さい数が先になります。',
        sortOrderInvalid: '0～1000000の整数を入力してください。',
        numberRequired: '数値を入力してください。',
        numberMin: '{{min}}以上の数値を入力してください。',
        integerMin: '{{min}}以上の整数を入力してください。',
        blankUnlimited: '制限なしの場合は空欄にしてください。',
        extraInvalid: 'この値は受け付けられません。',
      },
      types: {
        itRepairCategory: 'IT repair categories',
        expensePlanType: '経費申請の案件',
        officeItem: '事務用品',
        leaveType: '休暇種類',
        annualLeaveTier: '勤続年数別年休',
        paymentMethod: '支払方法',
        expenseCategory: '経費区分',
        budgetSubject: '予算科目',
        sealType: '印章種類',
        contractType: '契約種類',
        assetCategory: '資産区分',
        supplierCategory: '仕入先区分',
        vehicleType: '車両種類',
        departureType: '退職種類',
        resignationReason: '退職理由',
        recruitmentReason: '採用理由',
        certificateType: '証明書種類',
        travelStandard: '出張基準',
      },
      travelStandardKindHelp:
        '宿泊費と日当には対応する区分を使ってください。出張総合区分はどちらにも該当せず日額基準はありません。',
      invalidStandardKind: '有効な出張基準区分を選択してください。',
      extraOptions: {
        travelStandardKind: {
          none: '該当なし',
          lodging: '1泊あたり宿泊費',
          allowance: '1日あたり日当',
        },
      },
      extra: {
        travelStandardKind: '出張基準区分',
        requiresPrintInfo: '印刷詳細が必要',
        deductsBalance: '残高を控除',
        requiresAttachment: '添付が必要',
        attachmentAboveDays: '添付必須日数の超過基準',
        maxDays: '最大日数',
        requiresHr: '人事承認',
        minYears: '勤続年数の下限',
        days: '日数',
        voluntary: '自己都合',
        replacement: '退職者補充',
        involvesSalary: '給与を表示',
        minRank: '等級順位の下限',
        lodgingPerNight: '1泊あたり宿泊費（元）',
        allowancePerDay: '1日あたり日当（元）',
      },
    },
    rules: {
      relatedFlows: '関連フロー（ノードで編集）',
      editAtNode: 'フローノードで編集',
      title: 'ルール概要・履歴',
      description:
        '現在のルール、変更予定、履歴を確認します。関連フローノードを開いて編集してください。共有ルールは複数フローに影響します。',
      loadFailedTitle: '承認ルールを読み込めませんでした',
      notFound: 'このルールは存在しません。',
      change: '変更',
      history: '履歴',
      changeTitle: '「{{name}}」を変更',
      changeDescription: '発効後に提出された申請に新しい値を適用します。',
      changed: '「{{name}}」を変更しました',
      historyTitle: '「{{name}}」の履歴',
      currentValue: '現在：{{value}}',
      scheduledValue: '{{date}}以降：{{value}}',
      defaultVersion: 'デフォルト',
      withdraw: '取り下げ',
      withdrawn: '「{{name}}」の変更予定を取り消しました',
      withdrawTitle: '{{date}}からの「{{name}}」の変更を取り消しますか？',
      withdrawDescription: '予定値{{value}}は適用されません。',
      versionStatus: { current: '適用中', scheduled: '公開予定' },
      fields: {
        rule: 'ルール',
        current: '現在の値',
        scheduled: '公開予定',
        newValue: '新しい値',
        value: '値',
        note: 'メモ',
        effectiveFrom: '適用時点',
        changedBy: '変更者',
      },
      effective: {
        label: '適用時点',
        now: '即時',
        fromDate: '指定日から',
        dateLabel: '発効日',
        hint: '当日00:00から。',
        dateRequired: '適用日を選択してください。',
        pastError: '明日以降の日付を選択してください。',
      },
      errors: {
        valueRequired: '値を入力してください。',
        notANumber: '数値を入力してください。',
        minimum: '{{min}}以上を入力してください。',
        percentRange: '{{min}}～{{max}}の百分率を入力してください。',
        integer: '整数を入力してください。',
        halfDays: '日数は0.5単位で入力してください。',
        noteTooLong: '{{max}}文字以内で入力してください。',
        invalidValue: 'この値は受け付けられません。',
        orderViolated:
          '関連ルールとの順序が不正です（副総経理基準額が総経理基準額を超える等）。先に関連ルールを変更してください。',
        versionExists:
          'その時点には既に変更があります。別の日付を選択してください。',
        inEffect: 'この変更は適用済みで履歴になっています。',
      },
      domains: {
        spend: {
          title: '支出',
          description: '支出承認階層と他の金銭承認の基準額。',
        },
        leave: {
          title: '休暇',
          description: '部署長または人事の審査が必要な休暇日数。',
        },
        attendance: {
          title: '勤怠',
          description: '時間外勤務と打刻修正の上限。',
        },
        hr: {
          title: '人事',
          description: '等級階層と昇給基準。',
        },
        sla: {
          title: '承認タイミング',
          description: '勤務時間で計算するリマインダーとエスカレーション。',
        },
        committee: {
          title: '審査委員会',
          description: '委員会投票のデフォルト値。',
        },
        calendar: {
          title: '勤務カレンダー',
          description: '勤務時間とタイムゾーン。',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}}回',
        integer: '{{value}}',
        days: '{{value}}日',
        hours: '{{value}}時間',
        workingHours: '{{value}}勤務時間',
        rank: '順位{{value}}',
      },
      unitSuffix: {
        money: '元',
        count: '回',
        integer: '',
        days: '日',
        hours: '時間',
        workingHours: '勤務時間',
        ratio: '%',
        rank: '順位',
      },
      keys: {
        itRepair_acceptanceDays: {
          label: 'Acceptance reminder (working days)',
          description:
            'Frozen on submission; never closes a repair automatically.',
        },
        itRepair_followUpDays: {
          label: 'Follow-up interval (working days)',
          description: 'Frozen interval after a waiting reminder.',
        },
        itRepair_morning: {
          label: 'IT repair morning hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_afternoon: {
          label: 'IT repair afternoon hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_P1_response: {
          label: 'P1 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P1_resolution: {
          label: 'P1 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_response: {
          label: 'P2 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_resolution: {
          label: 'P2 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_response: {
          label: 'P3 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_resolution: {
          label: 'P3 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_response: {
          label: 'P4 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_resolution: {
          label: 'P4 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        leave_annualAccrualEnabled: {
          label: '年次有給休暇の自動付与',
          description:
            '0は自動付与無効、1は日次付与有効です。有効化前に従業員の就業開始日を入力してください。',
        },
        leave_annualCarryExpiryMonth: {
          label: '年休繰越の失効月',
          description: '未使用年休が失効する翌年の月（1～12）。',
        },
        leave_annualCarryExpiryDay: {
          label: '年休繰越の失効日',
          description:
            '失効月の最終有効日（1～31）。短い月は月末日を使用します。',
        },
        spend_vp: {
          label: '副総経理基準額',
          description: 'これを超える金額は担当副総経理が必要です。',
        },
        spend_gm: {
          label: '総経理基準額',
          description: 'これを超える金額は総経理が必要です。',
        },
        expense_head: {
          label: '部署長を省略する経費精算',
          description: '合計がこの金額以下なら直属上司が代わりに承認します。',
        },
        loan_head: {
          label: '貸付の部署長基準額',
          description: 'これを超える貸付には部署長が必要です。',
        },
        loan_personalMax: {
          label: '個人貸付上限',
          description: '1人が同時に負える債務の最大額。',
        },
        purchase_quotes: {
          label: '3社見積が必要な基準額',
          description: 'これを超える購入には3社の競合見積が必要です。',
        },
        contract_gm: {
          label: '契約の総経理基準額',
          description: 'これを超える契約には総経理が必要です。',
        },
        asset_scrapGm: {
          label: '資産廃棄基準額',
          description: '取得価額がこれを超える資産の廃棄には総経理が必要です。',
        },
        budget_increaseGm: {
          label: '予算増額基準額',
          description: 'これを超える予算増額には総経理が必要です。',
        },
        leave_head: {
          label: '部署長が必要な休暇日数',
          description: 'この日数以上の休暇には部署長が必要です。',
        },
        leave_hr: {
          label: '人事が必要な休暇日数',
          description: 'この日数以上の休暇には人事が必要です。',
        },
        overtime_monthlyHead: {
          label: '部署長が必要な月間時間外勤務',
          description: '月の時間外勤務がこの時間を超えると部署長が必要です。',
        },
        attendance_fixPerMonth: {
          label: '月間打刻修正回数',
          description: '1人が月に申請できる修正回数。',
        },
        grade_managerRank: {
          label: 'マネージャー等級順位',
          description: 'この順位以上の等級をマネージャー層とします。',
        },
        grade_directorRank: {
          label: '部長等級順位',
          description: 'この順位以上の等級を部長層とします。',
        },
        raise_vp: {
          label: '副総経理が必要な昇給率',
          description: 'これを超える昇給率には副総経理が必要です。',
        },
        raise_gm: {
          label: '総経理が必要な昇給率',
          description: 'これを超える昇給率には総経理が必要です。',
        },
        sla_remindHours: {
          label: 'リマインダーまで',
          description: 'この勤務時間後に承認者へ通知します。',
        },
        sla_escalateHours: {
          label: 'エスカレーションまで',
          description: 'この勤務時間後に承認者の上司へエスカレーションします。',
        },
        sla_urgeCooldownHours: {
          label: '催促間隔',
          description: '申請者が催促を繰り返すまでの待ち時間。',
        },
        committee_min: {
          label: '委員会の可決票数',
          description: '委員会に必要な賛成票のデフォルト数。',
        },
        calendar_workHours: {
          label: '勤務時間',
          description: '1日の勤務時間帯。',
        },
        calendar_timeZone: {
          label: 'タイムゾーン',
          description: 'カレンダーのタイムゾーン。',
        },
      },
    },
    sequences: {
      title: '伝票番号',
      description: '伝票接頭辞ごとの月間発行番号です。提出時に発行します。',
      loadFailedTitle: '伝票番号を読み込めませんでした',
      searchPlaceholder: 'LVなどの接頭辞で絞り込み',
      searchLabel: '接頭辞で絞り込み',
      fields: {
        prefix: '接頭辞',
        period: '月',
        issued: '発行済み',
        next: '次の番号',
      },
      empty: {
        title: '番号はまだ発行されていません',
        description: '申請を提出すると番号がここに表示されます。',
      },
    },
    auditLogs: {
      title: '監査ログ',
      description:
        '組織、人員、ルール、設定の機密変更を記録する読み取り専用ログ。',
      loadFailedTitle: '監査ログを読み込めませんでした',
      system: 'システム',
      notFound: 'この項目は存在しません。',
      detailTitle: '監査記録：{{action}}',
      detailTitleLoading: '監査記録',
      changes: '変更内容',
      noChanges: '値は記録されていません。',
      changed: '変更済み',
      wholeValue: '値',
      fields: {
        at: '時刻',
        actor: '実行者',
        action: '操作',
        targetType: 'オブジェクト種類',
        targetId: 'オブジェクト',
        reason: '理由',
        field: 'フィールド',
        before: '前',
        after: '後',
      },
      filters: {
        allTargetTypes: 'すべてのオブジェクト種類',
        allActions: 'すべての操作',
        actor: '全員',
        dateRange: 'すべての日付',
        presets: '期間指定',
      },
      presets: {
        last7: '過去7日',
        last30: '過去30日',
        thisMonth: '今月',
        lastMonth: '先月',
        last90: '過去90日',
      },
      empty: {
        title: '監査記録はまだありません',
        description: '機密変更が行われるとここに記録されます。',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;
