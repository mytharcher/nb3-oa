/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'データインポート' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'データインポート',
      read: '履歴・テンプレートを閲覧',
      update: 'インポート',
    },
    title: 'データインポート',
    description:
      'Excelテンプレートから部署、役職、等級、従業員記録、職責ロールメンバーをインポートします。',
    kinds: {
      departments: '部署',
      positions: '役職',
      grades: '等級',
      employees: '従業員記録',
      dutyRoleMembers: '職責ロールメンバー',
    },
    kindHints: {
      departments:
        '部署コードで照合します。親部署はシートの後方に定義しても構いません。',
      positions: '役職コードで照合します。',
      grades: '等級コードで照合します。',
      employees:
        '従業員番号で照合します。部署、役職、等級を先にインポートしてください。上司は同じシートに定義できます。',
      dutyRoleMembers:
        'ロールコードとアカウントで照合します。有効列の「No」はメンバーを解除します。',
    },
    actions: {
      new: '新しいインポート',
      templates: 'テンプレートをダウンロード',
      templateFor: '{{kind}}テンプレートをダウンロード',
      check: '確認',
      checking: '確認中…',
      confirm: 'インポート',
      importing: 'インポート中…',
      chooseAgain: '別のファイルを選択',
      back: '戻る',
      chooseFile: 'ファイルを選択',
      downloadFile: '元ファイルをダウンロード',
      refresh: '更新',
      clearFilters: 'フィルターをクリア',
    },
    fields: {
      kind: '種類',
      file: 'ファイル',
      createdAt: '開始日時',
      finishedAt: '終了日時',
      status: '結果',
      summary: '概要',
      actor: '実行者',
      rowCount: '読み取り行数',
      createdCount: '作成日時',
      updatedCount: '更新日時',
      unchangedCount: '変更なし',
      errorCount: '問題',
      row: '行',
      column: '列',
      problem: '問題',
    },
    filters: { allKinds: 'すべての種類' },
    status: { succeeded: '成功', failed: '失敗' },
    summary: {
      succeeded:
        '{{created}}件作成・{{updated}}件更新・{{unchanged}}件変更なし',
      failed: '問題：{{count}}件',
    },
    noFile: 'ファイル未選択',
    templateFile: '{{kind}}インポートテンプレート.xlsx',
    fileHint: 'テンプレートに従った5 MB以下の.xlsxブック。',
    notice: {
      title: 'インポート前に',
      accounts:
        'インポートでアカウントは作成しません。ファイル内のユーザー名またはメールアドレスのアカウントは、既存かつ有効である必要があります。該当しない行は報告されます。',
      atomic:
        'ファイル全体を検査して一括保存します。1行でも問題があれば何も保存しません。',
    },
    validation: {
      kindRequired: 'ファイルの内容を選択してください。',
      fileRequired: '.xlsxファイルを選択してください。',
      fileType: 'インポートできるのは.xlsxブックのみです。',
      fileSize:
        'ファイルが5 MBを超えています。複数ファイルに分割してください。',
    },
    report: {
      invalidTitle:
        '問題が{{count}}件あります。何もインポートされませんでした。',
      invalidDescription: 'ファイルの以下の行を修正し、再確認してください。',
      truncated: '{{count}}件の問題のうち先頭{{shown}}件のみ表示します。',
      okTitle: 'ファイルの検査に合格しました',
      okDescription:
        '{{rows}}行読み取り：{{created}}件作成、{{updated}}件更新、{{unchanged}}件変更なしの予定。',
      wholeFile: 'ファイル',
    },
    toast: {
      imported: '「{{name}}」をインポートしました',
      templateFailed:
        'テンプレートをダウンロードできませんでした。再試行してください。',
    },
    failure: {
      forbidden: 'インポート権限がありません。',
      tooLarge:
        'ファイルが5 MBを超えています。複数ファイルに分割してください。',
      invalidFile:
        'ファイルを送信できませんでした。.xlsxブックを選択してください。',
      generic: 'リクエストに失敗しました。接続を確認して再試行してください。',
    },
    empty: {
      title: 'インポートはまだありません',
      description:
        'テンプレートをダウンロードして入力・インポートし、部署、人員、ロールを取り込んでください。',
      readOnly:
        'インポートはまだありません。管理者に組織データのインポートを依頼してください。',
    },
    noResults: 'フィルターに一致するインポートはありません。',
    loadFailedTitle: 'インポート履歴を読み込めませんでした',
    detail: {
      title: 'インポート詳細・{{name}}',
      titleLoading: 'インポート詳細',
      notFound: 'このインポートは存在しないか削除されています。',
      problems: '問題',
    },
    common: {
      forbidden: '閲覧権限がありません。',
      notFound: 'このレコードは存在しないか削除されています。',
      loadFailed:
        'データを読み込めませんでした。接続を確認して再試行してください。',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        '読み取り可能な.xlsxブックではありません。Excelブックとして保存して再試行してください。',
      SHEET_EMPTY:
        '最初のシートにデータ行がありません。見出しの下の行に入力してください。',
      TOO_MANY_ROWS:
        '{{max}}行を超えています。複数ファイルに分割してください。',
      HEADER_MISSING: '見出し行に必須列「{{header}}」がありません。',
      HEADER_DUPLICATE: '列「{{header}}」が重複しています。',
      REQUIRED: '必須です。',
      INVALID_CODE:
        '「{{value}}」は有効なコードではありません。英数字、「.」「_」「-」で64文字以内にしてください。',
      TOO_LONG: '{{max}}文字を超えています。',
      INVALID_INTEGER: '「{{value}}」は整数ではありません。',
      INVALID_BOOLEAN: '「{{value}}」は是／否（はい／いいえ）ではありません。',
      CAREER_START_FUTURE:
        '初就業日は勤務カレンダーのタイムゾーンで本日以前にしてください。',
      CAREER_START_AFTER_HIRE: '初就業日は入社日より後にできません。',
      INVALID_DATE:
        '「{{value}}」は有効な日付ではありません。日付セルまたはYYYY-MM-DDを使用してください。',
      INVALID_STATUS:
        '「{{value}}」は状態ではありません。试用、正式、离职中、已离职を使用してください。',
      INVALID_EMAIL: '「{{value}}」はメールアドレスではありません。',
      DUPLICATE_IN_FILE: '「{{value}}」は{{firstRow}}行目に既にあります。',
      USER_NOT_FOUND:
        'アカウント「{{value}}」がありません。インポートはアカウントを作成しません。先にユーザーページで作成してください。',
      USER_DISABLED:
        'アカウント「{{value}}」は無効です。先にユーザーページで有効化してください。',
      USER_TAKEN: 'アカウント「{{value}}」は従業員{{code}}に属しています。',
      USER_MISMATCH:
        'この従業員番号は別のアカウントに紐付いています。記録のアカウントは保持されます。',
      PARENT_NOT_FOUND:
        'ファイルにもシステムにも部署コード「{{value}}」がありません。',
      EXECUTIVE_TOP_LEVEL_ONLY:
        '担当役員を指定できるのは最上位部署だけです。下位部署は継承します。',
      PARENT_CYCLE: '親部署の関係が循環しています。',
      DEPARTMENT_NOT_FOUND:
        '部署コード「{{value}}」がありません。先に部署をインポートしてください。',
      DEPARTMENT_INACTIVE: '部署「{{value}}」は無効です。',
      POSITION_NOT_FOUND: '役職コード「{{value}}」がありません。',
      POSITION_INACTIVE: '役職「{{value}}」は無効です。',
      GRADE_NOT_FOUND: '等級コード「{{value}}」がありません。',
      GRADE_INACTIVE: '等級「{{value}}」は無効です。',
      MANAGER_NOT_FOUND:
        'ファイルにもシステムにも従業員番号「{{value}}」がありません。',
      MANAGER_SELF: '自分自身を上司にできません。',
      MANAGER_INACTIVE: '上司「{{value}}」は退職済みです。',
      MANAGER_CYCLE: '上司関係が循環しています。',
      DUTY_ROLE_INACTIVE:
        'このロールは無効です。新しいメンバーを追加できません。',
      DUTY_ROLE_NOT_FOUND: '職責ロールコード「{{value}}」がありません。',
      WRITE_FAILED:
        'この行を保存できなかったため（{{reason}}）、何もインポートされませんでした。行を確認して再試行してください。',
      unknown: 'この行はインポートできません。',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
