import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/ja-JP';
import inboxEnUS from '#extensions/nocobase-inbox/locales/ja-JP';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'メッセージ',
  'inbox.loadFailed': 'メッセージを読み込めません',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'メッセージ',
  'inboxButton.pending': 'メッセージ、待機{{count}}件',
  'inboxButton.unread': 'メッセージ、未読{{count}}件',
  'inboxButton.pendingHint':
    'あなたの対応待ちは{{count}}件です。処理すると減ります。',
  'inboxButton.unreadHint': '未読は{{count}}件です。読むと減ります。',
  'auth.welcome': 'おかえりなさい',
  'auth.loginDescription':
    'ユーザー名またはメールアドレスとパスワードでログインしてください。',
  'auth.registerTitle': 'アカウントを作成',
  'auth.registerDescription': 'アカウントを作成して開始します。',
  'auth.forgotTitle': 'パスワードを忘れた場合',
  'auth.forgotDescription':
    'メールアドレスを入力してください。アカウントが存在すれば再設定リンクを送信します。',
  'auth.resetDescription': '新しいパスワードを選択してください。',
  'auth.resetTitle': 'パスワードをリセット',
  'auth.identifier': 'ユーザー名またはメールアドレス',
  'auth.password': 'パスワード',
  'auth.signIn': 'ログイン',
  'auth.signingIn': 'ログイン中…',
  'auth.hidePassword': 'パスワードを隠す',
  'auth.showPassword': 'パスワードを表示',
  'auth.forgotLink': 'パスワードをお忘れですか？',
  'auth.noAccount': 'アカウントをお持ちでないですか？',
  'auth.signUp': '登録',
  'auth.createAccount': 'アカウントを作成',
  'auth.creatingAccount': 'アカウント作成中…',
  'auth.name': '名前',
  'auth.username': 'ユーザー名',
  'auth.email': 'メールアドレス',
  'auth.confirmPassword': 'パスワードを確認',
  'auth.existingAccount': 'アカウントをお持ちですか？',
  'auth.passwordMismatch': 'パスワードが一致しません。',
  'auth.resetting': '再設定中…',
  'auth.newPassword': '新しいパスワード',
  'auth.confirmNewPassword': '新しいパスワードを確認',
  'auth.invalidResetLink': 'この再設定リンクは無効か期限切れです。',
  'auth.backToSignIn': 'ログインに戻る',
  'auth.sendResetLink': '再設定リンクを送信',
  'auth.sending': '送信中…',
  'auth.resetSent': 'アカウントが存在する場合、再設定リンクを送信しました。',
  'auth.rememberPassword': 'パスワードを思い出しましたか？',
  'auth.methods': 'ログイン方法',
  'auth.or': 'または次で続行',
  'auth.continueWith': '{provider}で続行',
  'auth.about': 'このアプリについて',
  'auth.platform': 'AIネイティブなアプリ基盤',
  'auth.marketingTitleFirst': 'AIが自由に構築。',
  'auth.marketingTitleSecond': 'NocoBaseが支える',
  'auth.marketingTitleThird': '信頼性。',
  'auth.marketingDescription':
    '柔軟なフロントエンドでAIが体験を形にし、NocoBaseが基盤となるデータ、権限、ガバナンスを守ります。',
  'auth.frontend': 'AIネイティブなフロントエンド',
  'auth.frontendDescription': '柔軟なフレームワークで自由に画面を構成します。',
  'auth.foundation': 'NocoBase基盤',
  'auth.foundationDescription': '信頼できるデータ、アクセス制御、ガバナンス。',
  'auth.marketingFooter': '表現は自由に。基盤は確かに。',
  'status.loading': '読み込み中',
  'status.loadingPage': 'ページを読み込み中',
  'status.denied': 'アクセス拒否',
  'status.pageFailed': 'ページを読み込めません',
  'status.retry': '再試行',
  'navigation.brandHome': 'NocoBaseホーム',
  'navigation.brandApps': 'NocoBaseアプリ',
  'routeOverlay.close': '閉じる',
  'status.backHome': 'ワークベンチに戻る',
  'status.deniedDescription': 'このページにアクセスする権限がありません。',
  'status.routeFailedDescription':
    'ページを読み込めませんでした。再試行してください。',
  shell: {
    buildFreely: 'AIが自由に構築。',
    reliability: '<brand>NocoBase</brand>が信頼性を支えます。',
  },
  home: {
    platform: 'NocoBase・AIネイティブなアプリ基盤',
    title: '伝えるだけで、エージェントが構築',
    description:
      'このアプリはコーディングエージェントとの対話で開発します。業務で必要なことを普段の言葉で伝えると、このプロジェクトに画面、データモデル、API、業務フローを作成します。',
    steps: {
      describe: {
        title: '要望を伝える',
        description: '利用者、保存するデータ、起きるべき動作を説明します。',
      },
      build: {
        title: 'エージェントが構築',
        description: 'プロジェクトと内蔵機能を読み取り、コードを記述します。',
      },
      review: {
        title: '確認して改善',
        description: 'ページを更新して試し、同じ方法で変更を依頼します。',
      },
    },
    example: {
      title: 'こんな依頼を試してください',
      text: '発注管理アプリを作成してください。\n\n発注には番号、品目、申請者、金額、承認状態があります。申請者は発注を作成し、自分の発注だけを閲覧します。審査者はすべての未処理発注を閲覧し、承認または却下します。\n判断後、発注リンク付きで申請者の受信箱に通知してください。',
      hint: 'このプロジェクトを開いたClaude Code、Codex、Cursorなどのコーディングエージェントに貼り付けてください。',
    },
    capabilitiesTitle: '内蔵機能',
    capabilitiesDescription:
      'エージェントは一から作らず、これらを直接利用します。項目を開くと編集・コピー可能なプロンプトを表示します。',
    viewPrompts: 'プロンプトを表示（{{count}}件）',
    prompt: {
      label: 'プロンプト',
      hint: 'コピー前に業務に合わせて編集してください。閉じると変更は保存されません。',
      copy: 'コピー',
      copiedShort: 'コピー済み',
      copied: 'プロンプトをコピーしました',
      copyFailed:
        'コピーできません。テキストを選択して手動でコピーしてください。',
      reset: 'デフォルトを復元',
    },
    capabilities: {
      auth: {
        title: '認証',
        description:
          'ログイン、登録、パスワード再設定、企業シングルサインオン。',
        prompts: {
          disableSignUp: {
            label: '新規登録を停止',
            text: 'このアプリは社員専用です。管理者がすべてのアカウントを作成します。\n自己登録を無効にし、ログインページの登録リンクを削除してください。\n既存の社員はアカウントとパスワードで引き続きログインできるようにしてください。\nパスワードを忘れた場合のリンクは残してください。',
          },
          passwordRules: {
            label: 'パスワードルール',
            text: '登録または再設定時に12文字以上のパスワードを必須にしてください。\n両方のフォームに要件を表示し、検証メッセージを統一してください。\n既存アカウントは即時のパスワード変更を要求せずログインできるようにしてください。',
          },
          companySso: {
            label: '企業SSO',
            text: '会社のID基盤を使い、OIDCで社員がログインできるようにしてください。\n\nアカウント・パスワードでのログインを残し、「企業アカウント」ボタンを追加してください。\nボタンから会社のID基盤を開き、ログイン成功後にアプリのホームへ戻してください。\n\n初回ログイン時は基盤の固定ユーザー識別子を使い、アプリアカウントの作成を許可してください。\n名前やメールの一致による自動紐付けはしないでください。新規アカウントにはアプリのデフォルト権限を使います。\n\nID基盤の管理者が提供すべき情報と、登録すべきコールバックURLを一覧にしてください。',
          },
        },
      },
      authorization: {
        title: '権限',
        description:
          'ページへのアクセス、操作、レコードの閲覧権限を制御します。',
        prompts: {
          jobs: {
            label: '職務',
            text: 'アプリに「購入申請者」と「発注審査者」の職務を作成してください。\n購入申請者は発注ページに入り、自分が申請した発注を閲覧できます。\n発注審査者は発注ページに入り、発注を閲覧し未処理発注を承認・却下できます。\n権限と割り当てを変更できるのはアプリ管理者のみです。\n管理者が後で権限を調整し人を割り当てられるよう、既存の認可機能を使ってください。',
          },
          dataScopes: {
            label: 'データ範囲',
            text: '購入申請者は自分の発注だけ閲覧できるよう、発注の申請者フィールドで所有者を判定してください。\n発注審査者はすべての発注を閲覧し、未処理承認を処理できます。\n管理者は権限セットで各職務の発注閲覧範囲を調整できます。',
          },
          sharing: {
            label: '共有',
            text: 'Bobの発注PO-2026-004をAliceに共有して確認できるようにしてください。\nAliceは発注の閲覧権限を持っているので、この発注への閲覧アクセスを追加してください。\n既存の職責は維持します。承認処理は引き続き発注審査者が行います。\nこの共有ルールを管理者が管理できるようにしてください。',
          },
        },
      },
      scheduler: {
        title: '定期タスク',
        description: '指定時刻に業務を実行し、次回実行と結果を確認します。',
        prompts: {
          reminder: {
            label: '日次リマインダー',
            text: '既存の発注アプリに「未処理発注リマインダー」を追加してください。\n\n平日の北京時間09:00に承認待ち発注を検索し、審査者ごとにまとめて各審査者にアプリ内通知を1件送ってください。\n未処理件数と未処理発注一覧へのリンクを含め、該当がなければ送信しないでください。\n管理者はスケジュールと実行記録を閲覧し、リマインダーを一時停止・再開できます。',
          },
          weeklyReport: {
            label: '週次レポート',
            text: '毎週月曜の北京時間08:00に先週の売上概要を生成し、営業マネージャーへ通知してください。\n売上額、受注件数、地域別合計を含めてください。管理者はタスクと実行記録を閲覧できます。',
          },
        },
      },
      notification: {
        title: '通知',
        description:
          '出来事に応じてアプリ内メッセージ、メール、グループボット通知を送信します。',
        prompts: {
          inApp: {
            label: 'アプリ内メッセージ',
            text: '現在のアプリに発注承認を追加し、結果をアプリ内メッセージで申請者へ通知してください。\n\n発注には番号、名前、申請者、金額、承認状態があります。\n申請者は自分の発注を閲覧します。審査者は未処理発注を閲覧し承認・却下します。既存の発注・承認機能があれば再利用してください。\n\n承認または却下後、その発注の申請者だけにアプリ内メッセージを1件送ってください。\nタイトルに承認・却下を示し、本文に発注番号、名前、承認結果を含めてください。\nクリックすると対応する発注詳細を開きます。\n承認保留中は送信せず、同じ結果は一度だけ通知してください。\n通知失敗が保存済み承認結果に影響しないようにしてください。',
          },
          email: {
            label: 'メールアドレス',
            text: '既存の発注承認通知に、アプリの設定済みメールチャネルを使うメール通知を追加してください。\n\n承認・却下後、申請者のアカウントメールへ結果を送信してください。\n件名に発注番号、本文に発注名と結果を含めてください。\n既存のアプリ内通知は残し、メールがなければアプリ内通知のみ送ってください。\nメール失敗は承認結果やアプリ内通知に影響しないようにしてください。',
          },
        },
      },
      mail: {
        title: 'メール',
        description:
          '個人メールボックスを接続し、業務メールを閲覧・返信・送信します。',
        prompts: {
          mailCenter: {
            label: 'メールセンター',
            text: 'アプリにメールセンターとメールアカウント管理の入口を追加してください。自分のメールボックスを接続・選択し、受信メールの同期、本文と添付の閲覧、返信ができるようにします。\n\n営業担当者が見積依頼を受け取ったらメールセンターから返信できます。元の件名と会話の文脈を保持し、元の送信者へ返信します。各ユーザーは自分の接続済みメールボックスを使います。',
          },
          correspondence: {
            label: '顧客メール',
            text: '顧客詳細にやり取りの区分を追加してください。送信者または受信者が現在の顧客の連絡先メールと一致するメッセージを表示します。営業担当者は自分の接続済みメールボックスで本文・添付を読み、返信できます。',
          },
        },
      },
      file: {
        title: 'ファイル',
        description:
          'ファイルをアップロードしてレコードに添付し、プレビュー・ダウンロードします。',
        prompts: {
          attachments: {
            label: '添付ファイル',
            text: '既存の発注管理アプリに購入添付を追加してください。\n\n発注詳細に添付領域を追加し、PDF、画像、DOCXなど複数ファイルを保持できるようにしてください。\nファイル名とサイズ、プレビュー・ダウンロード・削除操作を表示してください。\nアップロード後に現在の発注へ添付を保存でき、再度開いても利用できるようにします。\n発注へのアクセス権がある人は添付を閲覧・ダウンロードでき、申請者と審査者は追加・削除できます。\n削除は現在の発注との紐付けのみ解除し、ファイルは保持してください。',
          },
          avatar: {
            label: 'アバター',
            text: '各従業員に1枚のアバター画像を追加してください。\nアップロードと差し替えに対応し、従業員一覧と詳細に表示してください。\n差し替え後は新画像を使い、ページ更新後も保持してください。',
          },
        },
      },
      templatePrint: {
        title: 'テンプレート印刷',
        description:
          '業務データをWordやExcelテンプレートに差し込んでファイルを生成します。',
        prompts: {
          approvalForm: {
            label: '承認書',
            text: '発注詳細に「承認書を生成」操作を追加してください。\n\n提供したWordテンプレートに現在の発注番号、購入申請、申請者、金額、承認結果、処理時刻を差し込んでください。\n見出し、表レイアウト、署名欄を保持し、「Purchase-approval-order-number」という名前でWordをダウンロードできるようにします。\n発注にアクセスできる人なら誰でも、その時点のデータから生成できるようにしてください。',
          },
          pdf: {
            label: 'PDF出力',
            text: '購入承認書にPDFダウンロードを追加し、Wordテンプレートのフォント、表、署名欄を保持してください。',
          },
        },
      },
      i18n: {
        title: '言語',
        description: '画面言語の切替、言語追加、デフォルト設定を行います。',
        prompts: {
          addLanguage: {
            label: '言語を追加',
            text: 'アプリにスペイン語を追加してください。画面とサーバーメッセージを翻訳し、言語メニューに追加してください。',
          },
          defaultLanguage: {
            label: 'デフォルト言語',
            text: '言語未選択の人には簡体字中国語をデフォルトにしてください。言語メニューには英語を残してください。',
          },
        },
      },
      theme: {
        title: 'テーマ',
        description:
          '色、フォント、密度を調整し、ライト・ダークを切り替えます。',
        prompts: {
          changeTheme: {
            label: 'テーマを変更',
            text: 'コンパクトテーマを更新してください。主色を青にし、角丸を少し大きくしてください。現在のフォント、文字サイズ、コンパクトな間隔を維持してください。',
          },
          newTheme: {
            label: '新しいテーマ',
            text: '主色が緑、柔らかな背景、適度な角丸、控えめな影を持つForestテーマを作成してください。',
          },
        },
      },
    },
  },

  appearance: {
    title: '外観',
    mode: '配色モード',
    preset: 'テーマ',
    light: 'ライト',
    dark: 'ダーク',
    system: 'システム',
    themes: { default: 'ゆったり', compact: 'コンパクト' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: '閉じる',
    save: '保存',
    cancel: 'キャンセル',
    confirm: '確認',
    language: '言語',
  },
  notices: {
    serverLocaleFallback:
      'サーバーがこの言語に対応していないため、サーバーメッセージは英語を使用します。',
    languageChangeFailed: '言語を変更できませんでした。再試行してください。',
  },
  account: {
    signOutFailed: 'ログアウトできません。再試行してください。',
    openMenu: 'アカウントメニューを開く',
    fallback: 'アカウント',
    signOut: 'ログアウト',
    signingOut: 'ログアウト中…',
  },
  navigation: {
    home: 'ホーム',
    open: 'ナビゲーションを開く',
    close: 'ナビゲーションを閉じる',
    expand: 'ナビゲーションを展開',
    collapse: 'ナビゲーションを折りたたむ',
    toggle: 'ナビゲーションを展開・折りたたむ',
    label: 'アプリナビゲーション',
    description: 'このアプリのページへ移動します。',
    breadcrumb: 'パンくず',
    breadcrumbMore: '中間の階層を表示',
    back: '戻る',
  },
  dataTable: {
    emptyDescription:
      '現在の範囲に利用可能なレコードはありません。別の範囲を試すか後で確認してください。',
    noResults: '結果なし。',
    sortAscending: '昇順',
    sortDescending: '降順',
    hideColumn: '非表示',
    view: '表示',
    toggleColumns: '列の表示切替',
    selectedCount: '{{total}}行中{{selected}}行を選択。',
    rowsPerPage: '1ページの行数',
    pageOf: '{{pageCount}}ページ中{{page}}ページ',
    firstPage: '最初のページへ',
    previousPage: '前のページへ',
    nextPage: '次のページへ',
    lastPage: '最後のページへ',
  },
  datePicker: {
    placeholder: '日付を選択',
    rangePlaceholder: '日付範囲を選択',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
