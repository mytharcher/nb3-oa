import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': '閉じる',
  nav: { users: 'ユーザー管理' },
  assignment: {
    saved: '「{{name}}」の権限を更新しました',
    inspect: '有効な権限を確認',
    keepEditing: '編集を続ける',
    discardChanges: '変更を破棄',
    showMore: 'さらに表示',
    title: '権限の割り当て',
    description:
      'このユーザーに直接割り当てた権限を管理します。変更は保存後に適用されます。',
    search: '名前または説明で検索',
    selectedOnly: '選択済みのみ',
    selected: '{{count}}件選択中',
    changes: '{{added}}件追加、{{removed}}件削除',
    noChanges: '変更なし',
    empty: '一致する選択肢がありません',
    protected: 'この割り当ては保護されており、ここでは変更できません',
    failed: '保存できませんでした。もう一度お試しください。',
    discard: '未保存の変更を破棄しますか？',
  },
  sessions: {
    title: '「{{name}}」のセッションを失効しますか？',
    description: 'このユーザーはすべての端末で再ログインが必要になります。',
    confirm: '失効',
    success: '「{{name}}」のセッションを失効しました',
  },
  page: {
    noMatches: 'フィルターに一致するユーザーはいません。',
    clearFilters: 'フィルターをクリア',
    emptyDescription:
      'ここでユーザーを作成するか、管理者にアカウント追加を依頼してください。',
    retry: '再試行',
    loading: '読み込み中',
    title: 'ユーザー',
    description: 'アカウント、権限の割り当て、有効なセッションを管理します。',
    add: 'ユーザーを追加',
    search: '名前、ユーザー名、メールアドレスで検索',
    allStatuses: 'すべての状態',
    allRoles: 'すべての権限セット',
    enabled: '有効',
    disabled: '凍結中',
    noUsers: 'ユーザーが見つかりません。',
    total: '{{count}}人のユーザー',
    previous: '前へ',
    next: '次へ',
    selectRole: '権限セットを選択',
    roles: '権限セット',
    systemAdministrator: 'システム管理者',
    noDirectRoles: '直接割り当てなし',
    protectedRole: '保護された割り当て',
    authenticatedDefaultAccess:
      'ここには直接の割り当てのみが表示されます。ログイン済みの全ユーザー、チーム、その他の対象経由で受け取る権限は表示されません。',
    columns: { user: 'ユーザー', status: '状態', actions: '操作' },
    actions: {
      menuFor: '{{name}}の操作',
      edit: '編集',
      resetPassword: 'パスワードをリセット',
      revokeSessions: 'セッションを失効',
      enable: 'アカウントを有効化',
      delete: '削除',
      disable: 'アカウントを凍結',
    },
  },
  form: {
    roleRequired: '{{name}}の値を選択してください。',
    nameRequired: '名前を入力してください。',
    emailInvalid: '有効なメールアドレスを入力してください。',
    passwordRequired: 'パスワードを入力してください。',
    saved: 'ユーザー「{{name}}」を保存しました',
    addTitle: 'ユーザーを追加',
    editTitle: 'ユーザーを編集',
    addDescription: 'アカウントを作成し、権限を割り当てます。',
    editDescription: 'アカウント情報を更新します。',
    name: '名前',
    username: 'ユーザー名',
    email: 'メールアドレス',
    password: 'パスワード',
    cancel: 'キャンセル',
    save: '保存',
    create: '作成',
  },
  password: {
    saved: '「{{name}}」のパスワードをリセット',
    title: 'パスワードをリセット',
    description:
      '{{name}}の新しいパスワードを設定します。すべてのセッションが失効します。',
    newPassword: '新しいパスワード',
    submit: 'パスワードをリセット',
  },
  state: {
    enabled: 'アカウント「{{name}}」を有効化しました',
    disabled: 'アカウント「{{name}}」を凍結しました',
    enableTitle: 'アカウント「{{name}}」を有効化しますか？',
    disableTitle: 'アカウント「{{name}}」を凍結しますか？',
    enableDescription:
      '{{name}}のログイン凍結を解除します。既存のアクセスルールは引き続き適用されます。',
    disableDescription:
      '{{name}}のログインを禁止し、すべての端末からログアウトします。認可設定は保持されます。凍結は退職を意味しません。',
    enable: 'アカウントを有効化',
    disable: 'アカウントを凍結',
  },
  deletion: {
    title: 'ユーザー「{{name}}」を削除しますか？',
    description:
      '{{name}}のすべてのセッションとAPIキーを失効します。過去の操作履歴は保持されます。この操作は取り消せません。',
    success: 'ユーザー「{{name}}」を削除しました',
  },
  invite: {
    open: 'ユーザーを招待',
    title: 'ユーザーを招待',
    description:
      'アカウントのないメールアドレスに、アカウント作成リンクを送信します。',
    emails: 'メールアドレス',
    emailsHint:
      '1行に1件、またはカンマや空白で区切ります。1回に最大50件まで指定できます。',
    emailsRequired: 'メールアドレスを1件以上入力してください。',
    emailsInvalid: '無効なメールアドレス：{{emails}}',
    emailsTooMany: '1回に招待できるのは50件までです。',
    roles: '参加後の権限',
    send: '招待を送信',
    sent: '招待を送信しました。',
    done: '完了',
    link: '招待リンク',
    copy: 'リンクをコピー',
    copied: 'コピー済み',
    copyFailed: 'リンクをコピーできませんでした。',
    outcome: {
      sent: 'メール送信済み',
      notSent: 'メール未送信：以下のリンクをコピーしてください',
      existingUser: 'アカウント作成済み',
    },
  },
  invitations: {
    title: '保留中の招待',
    empty: '保留中の招待はありません。',
    email: 'メールアドレス',
    invitedBy: '招待者',
    expires: '有効期限',
    status: '状態',
    pending: '待機中',
    expired: '期限切れ',
    notSent: '未送信',
    resend: '再送信',
    revoke: '失効',
    actionsFor: '{{email}}への招待の操作',
    resent: '招待を再送信しました。',
    revoked: '招待を取り消しました。',
    revokeTitle: '「{{email}}」への招待を取り消しますか？',
    revokeDescription: '{{email}}に送信したリンクは無効になります。',
  },
  accept: {
    title: '招待を承諾',
    description: '{{inviter}}があなたを招待しました。',
    summary: '以下にも参加します：{{items}}',
    loading: '招待を読み込み中…',
    email: 'メールアドレス',
    name: '名前',
    password: 'パスワード',
    nameRequired: '名前を入力してください。',
    passwordTooShort: 'パスワードは{{min}}文字以上で入力してください。',
    submit: 'アカウントを作成して参加',
    submitting: '参加中…',
    signedIn:
      '{{name}}としてログイン中です。新しいアカウントで招待を承諾するにはログアウトしてください。',
    signOut: 'ログアウト',
    signOutFailed: 'ログアウトできませんでした。',
    existingAccount:
      'このアドレスにはアカウントがあります。そのアカウントでログインして続けてください。',
    goToLogin: 'ログインへ',
    errors: {
      notFound: 'この招待リンクは無効です。',
      expired: '招待の有効期限が切れています。新しい招待を依頼してください。',
      accepted: 'この招待は承諾済みです。',
      revoked: 'この招待は取り消されています。',
      password: 'パスワードが要件を満たしていません。',
      accountConflict: 'このアドレスでアカウントを作成できません。',
      failed: 'エラーが発生しました。もう一度お試しください。',
    },
  },
  errors: {
    loadFailed: 'ユーザーを読み込めませんでした。もう一度お試しください。',
    loadForbidden:
      'ユーザーを表示する権限がありません。管理者にお問い合わせください。',
    loadNotFound:
      'ユーザー管理を利用できません。ワークベンチに戻ってください。',
    SELF_DELETE_NOT_ALLOWED: '自分のアカウントは削除できません。',
    LAST_ASSIGNMENT:
      'このユーザーは、割り当ての維持が必須の権限セットを持つ最後のユーザーです。',
    USER_HAS_APPS:
      'このユーザーを削除する前に、そのアプリを移管または削除してください。',
    HUB_ADMIN_REQUIRED:
      'ユーザーを削除できるのはプラットフォーム管理者だけです。',
    PROTECTED_ROLE_ASSIGNMENT:
      'このロールはユーザー管理では割り当てや解除ができません。',
    USER_NOT_FOUND: 'このユーザーは存在しません。',
    USER_DELETION_NOT_CONFIGURED:
      'このアプリにはユーザー削除が設定されていません。',
    USER_EMAIL_CONFLICT: 'このメールアドレスのユーザーが既に存在します。',
    USER_USERNAME_CONFLICT: 'このユーザー名のユーザーが既に存在します。',
    USER_IDENTITY_CONFLICT:
      'このメールアドレスまたはユーザー名のユーザーが既に存在します。',
    PASSWORD_TOO_SHORT: 'パスワードが短すぎます。',
    PASSWORD_TOO_LONG: 'パスワードが長すぎます。',
    operationFailed: 'ユーザー操作に失敗しました。',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
