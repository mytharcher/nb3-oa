import type { SystemResource } from './en-US.js';
import deviceApprovalZhTW from '#extensions/nocobase-device-approval/locales/zh-TW';
import inboxZhTW from '#extensions/nocobase-inbox/locales/zh-TW';

/** The Chinese copy of what the template ships; see `./en-US.ts`. */
const systemZhTW: SystemResource = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalZhTW,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxZhTW,
  'inbox.title': '訊息',
  'inbox.loadFailed': '無法載入訊息',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': '訊息',
  'inboxButton.pending': '訊息，{{count}} 項待處理',
  'inboxButton.unread': '訊息，{{count}} 條未讀',
  'inboxButton.pendingHint': '{{count}} 項等你處理，處理後減少。',
  'inboxButton.unreadHint': '{{count}} 條未讀，閱讀後減少。',
  'auth.welcome': '歡迎回來',
  'auth.loginDescription': '使用使用者名稱或電子郵件和密碼登入。',
  'auth.registerTitle': '建立帳戶',
  'auth.registerDescription': '建立帳戶以開始使用。',
  'auth.forgotTitle': '忘記密碼',
  'auth.forgotDescription': '輸入電子郵件，如果帳戶存在，我們將傳送重設連結。',
  'auth.resetDescription': '為帳戶設定新密碼。',
  'auth.resetTitle': '重設密碼',
  'auth.identifier': '使用者名稱或電子郵件',
  'auth.password': '密碼',
  'auth.signIn': '登入',
  'auth.signingIn': '正在登入…',
  'auth.hidePassword': '隱藏密碼',
  'auth.showPassword': '顯示密碼',
  'auth.forgotLink': '忘記密碼？',
  'auth.noAccount': '還沒有帳戶？',
  'auth.signUp': '註冊',
  'auth.createAccount': '建立帳戶',
  'auth.creatingAccount': '正在建立帳戶…',
  'auth.name': '姓名',
  'auth.username': '使用者名稱',
  'auth.email': '電子郵件',
  'auth.confirmPassword': '確認密碼',
  'auth.existingAccount': '已有帳戶？',
  'auth.passwordMismatch': '兩次輸入的密碼不一致。',
  'auth.resetting': '正在重設…',
  'auth.newPassword': '新密碼',
  'auth.confirmNewPassword': '確認新密碼',
  'auth.invalidResetLink': '此密碼重設連結無效或已過期。',
  'auth.backToSignIn': '返回登入',
  'auth.sendResetLink': '傳送重設連結',
  'auth.sending': '正在傳送…',
  'auth.resetSent': '如果帳戶存在，重設連結已傳送。',
  'auth.rememberPassword': '記得密碼？',
  'auth.methods': '登入方式',
  'auth.or': '或使用以下方式繼續',
  'auth.continueWith': '使用 {provider} 繼續',
  'auth.about': '關於此應用程式',
  'auth.platform': 'AI 原生應用程式平台',
  'auth.marketingTitleFirst': '讓 AI 自由構建。',
  'auth.marketingTitleSecond': 'NocoBase 保障',
  'auth.marketingTitleThird': '可靠執行。',
  'auth.marketingDescription':
    '讓 AI 在靈活的前端框架上構建體驗，由 NocoBase 保障底層資料、權限與治理。',
  'auth.frontend': 'AI 原生前端',
  'auth.frontendDescription': '在靈活的框架上自由構建界面。',
  'auth.foundation': 'NocoBase 基礎能力',
  'auth.foundationDescription': '可靠的資料、訪問控制與治理。',
  'auth.marketingFooter': '自由構建，可靠支撐。',
  'status.loading': '載入中',
  'status.loadingPage': '正在載入頁面',
  'status.denied': '無權訪問',
  'status.pageFailed': '無法載入頁面',
  'status.retry': '重試',
  'navigation.brandHome': 'NocoBase 首頁',
  'navigation.brandApps': 'NocoBase 應用程式',
  'routeOverlay.close': '關閉',
  'status.backHome': '返回工作台',
  'status.deniedDescription':
    '你沒有訪問此頁面的權限，可返回工作台繼續處理其他事項。',
  'status.routeFailedDescription': '頁面暫時無法載入，請重試。',
  shell: {
    buildFreely: 'AI 自由構建。',
    reliability: '<brand>NocoBase</brand> 保障可靠。',
  },
  home: {
    platform: 'NocoBase · AI 原生應用程式平台',
    title: '說出需求，由 Agent 來構建',
    description:
      '這個應用程式通過和 Coding Agent 對話來開發。用平常的話說明業務需要甚麼，它會在這個項目里編寫頁面、資料模型、介面和業務流程。',
    steps: {
      describe: {
        title: '描述需求',
        description: '說明誰來使用、要記錄哪些資料、希望發生甚麼。',
      },
      build: {
        title: '交給 Agent 構建',
        description: '它會閱讀這個項目和內建能力，然後編寫程式碼。',
      },
      review: {
        title: '查看並調整',
        description: '重新整理頁面試用，有需要再用同樣的方式提出修改。',
      },
    },
    example: {
      title: '可以這樣提需求',
      text: '幫我做一個採購訂單應用程式。\n\n訂單包含編號、採購事項、申請人、金額和簽核狀態。申請人可以建立訂單，只能查看自己的訂單；簽核人可以查看所有待簽核訂單，並通過或駁回。\n簽核完成後，用站內信通知申請人，點選可以開啟對應訂單。',
      hint: '粘貼到在這個項目中開啟的 Claude Code、Codex、Cursor 或其他 Coding Agent 中即可。',
    },
    capabilitiesTitle: '內建能力',
    capabilitiesDescription:
      'Agent 會直接使用這些能力，不必從零開發。開啟任意一項，獲取可以修改和複製的提示詞。',
    viewPrompts: '查看提示詞（{{count}}）',
    prompt: {
      label: '提示詞',
      hint: '複製前可以按自己的業務修改提示詞。關閉彈窗後，修改不會保留。',
      copy: '複製',
      copiedShort: '已複製',
      copied: '提示詞已複製',
      copyFailed: '無法複製，請選中文字後手動複製。',
      reset: '還原預設',
    },
    capabilities: {
      auth: {
        title: '認證',
        description: '登入、註冊、找回密碼，以及企業統一身分登入。',
        prompts: {
          disableSignUp: {
            label: '關閉註冊',
            text: '這個應用程式只供公司員工使用，帳號由管理員統一建立。\n請關閉自助註冊，登入頁不再顯示註冊入口。\n已有員工仍能使用原帳號和密碼登入，保留忘記密碼入口。',
          },
          passwordRules: {
            label: '密碼規則',
            text: '新註冊和重設密碼時，密碼至少需要 12 個字元。\n在註冊和重設密碼表單中顯示這條要求，並使用一致的校驗提示。\n保留已有帳號的登入能力，已有使用者無需立即修改密碼。',
          },
          companySso: {
            label: '企業帳號登入',
            text: '請讓員工使用公司的統一身分平台登入，採用 OIDC。\n\n保留原有帳號密碼登入，在登入頁增加「企業帳號登入」入口。\n點選後進入企業身分平台，登入成功後返回應用程式首頁。\n\n首次登入允許建立應用程式帳號，以身分平台的穩定使用者標識識別使用者。\n不要根據同名或相同電子郵件自動關聯已有帳號，新帳號沿用應用程式預設權限。\n\n請列出身分平台管理員需要提供的資訊，以及需要登記的回呼地址。',
          },
        },
      },
      authorization: {
        title: '權限',
        description: '控制誰能進入哪些頁面、執行哪些操作、查看哪些資料。',
        prompts: {
          jobs: {
            label: '職位權限',
            text: '請為應用程式設定「採購申請人」和「訂單簽核人」兩個職位。\n採購申請人可以進入訂單頁面，查看本人申請的訂單。\n訂單簽核人可以進入訂單頁面，查看訂單，並批准或駁回待簽核訂單。\n只有應用程式管理員可以調整職位權限和人員分配。\n請接入應用程式已有的權限能力，讓管理員以後可以調整權限和分配人員。',
          },
          dataScopes: {
            label: '資料範圍',
            text: '採購申請人只查看自己申請的訂單，以訂單的申請人欄位判斷歸屬。\n訂單簽核人可以查看所有訂單，處理待簽核訂單。\n管理員可以在權限集中分別調整兩個職位的訂單查看範圍。',
          },
          sharing: {
            label: '共享記錄',
            text: '請將 Bob 的 PO-2026-004 訂單共享給 Alice，讓她協助復核。\nAlice 已有訂單查看權限，本次增加這筆訂單的查看範圍。\n保留她原有的職位職責，簽核仍由訂單簽核人處理。\n這項共享需要能由管理員管理。',
          },
        },
      },
      scheduler: {
        title: '定時任務',
        description: '按時間自動執行業務處理，查看下次執行時間和執行結果。',
        prompts: {
          reminder: {
            label: '每日提醒',
            text: '為現有訂單應用程式新增「待簽核訂單提醒」。\n\n每個工作日北京時間上午 9 點，查找仍待簽核的訂單，按簽核人彙總，並向對應簽核人傳送一條站內通知。\n通知顯示待簽核訂單數量，點選後開啟待簽核訂單清單；沒有待簽核訂單時不傳送。\n管理員可以查看任務的執行時間和執行記錄，並暫停或還原提醒。',
          },
          weeklyReport: {
            label: '每周報表',
            text: '每週一北京時間上午 8 點生成上周的銷售彙總報表，並通知銷售負責人查看。\n報表包含銷售額、訂單數量和各區域彙總。管理員可以查看任務及執行記錄。',
          },
        },
      },
      notification: {
        title: '通知',
        description:
          '在業務事件發生時，通過站內信、電子郵件或群機器人傳送訊息。',
        prompts: {
          inApp: {
            label: '站內信',
            text: '我要在目前應用程式中做訂單簽核，並用站內信通知申請人簽核結果。\n\n訂單包含編號、名稱、申請人、金額和簽核狀態。\n申請人可以查看自己的訂單，簽核人可以查看待簽核訂單並通過或駁回。如果已有訂單和簽核功能，請直接復用。\n\n簽核完成後，只給該訂單的申請人傳送一條站內信。\n訊息標題說明通過或駁回，正文包含訂單編號、名稱和簽核結果。\n點選訊息可以開啟對應訂單詳情。\n待簽核時不傳送，同一次簽核結果只通知一次。\n通知傳送失敗不影響已儲存的簽核結果。',
          },
          email: {
            label: '電子郵件通知',
            text: '請在現有訂單簽核通知中增加電子郵件，使用應用程式已設定的電子郵件管道。\n\n訂單簽核通過或駁回後，向申請人帳號中的電子郵件傳送簽核結果。\n主題包含訂單編號，正文包含訂單名稱和簽核結果。\n保留已有站內信；申請人未填寫電子郵件時，只傳送站內信。\n電子郵件傳送失敗不影響簽核結果和站內信。',
          },
        },
      },
      mail: {
        title: '電子郵件',
        description: '關聯個人電子郵件，閱讀、回覆和傳送業務電子郵件。',
        prompts: {
          mailCenter: {
            label: '電子郵件中心',
            text: '為應用程式新增電子郵件中心和電子郵件帳號管理入口。使用者可以關聯自己的電子郵件，按電子郵件查看收件匣、同步來信、閱讀正文和附件，並回覆電子郵件。\n\n銷售人員收到客戶的報價諮詢後，可以在電子郵件中心回覆。回覆時保留原電子郵件主題和上下文，收件者使用原寄件者。每位使用者只處理自己關聯的電子郵件。',
          },
          correspondence: {
            label: '客戶往來電子郵件',
            text: '在客戶詳情頁新增往來電子郵件區，展示寄件者或收件者與目前客戶聯絡人電子郵件匹配的電子郵件。銷售人員可以在這裡閱讀正文、查看附件和回覆，使用自己關聯的電子郵件。',
          },
        },
      },
      file: {
        title: '檔案',
        description: '上傳檔案並關聯業務記錄，支援預覽和下載。',
        prompts: {
          attachments: {
            label: '訂單附件',
            text: '給現有訂單管理應用程式增加採購附件功能。\n\n在訂單詳情中新增附件區域，每個訂單可以上傳多個檔案，支援 PDF、圖片和 DOCX。\n顯示附件的檔案名和大小，支援預覽、下載和移除。\n上傳後點選儲存，將附件關聯到目前訂單；重新開啟訂單時仍能看到這些附件。\n有權查看訂單的人員可以查看和下載附件，申請人和簽核人員可以新增或移除附件。\n移除附件只解除它與目前訂單的關聯，保留檔案。',
          },
          avatar: {
            label: '員工頭像',
            text: '給員工增加頭像，每名員工最多一張。\n支援上傳和更換頭像，在員工清單和詳情中顯示。\n更換後使用新頭像，重新整理頁面後仍能正常顯示。',
          },
        },
      },
      templatePrint: {
        title: '範本列印',
        description: '把業務資料填入 Word 或 Excel 範本，生成可下載的檔案。',
        prompts: {
          approvalForm: {
            label: '簽核單',
            text: '在訂單詳情中增加「生成採購簽核單」功能。\n\n使用我提供的 Word 範本，填入目前訂單的編號、採購事項、申請人、金額、簽核結果和處理時間。\n保留範本的標題、表格佈局和簽名區域，生成檔案名為「採購簽核單-訂單編號」，提供 Word 檔案下載。\n有權查看該訂單的人員可以生成簽核單，生成檔案使用目前訂單的資料。',
          },
          pdf: {
            label: 'PDF 輸出',
            text: '為採購簽核單增加 PDF 下載，保留 Word 範本的字體、表格和簽名區域。',
          },
        },
      },
      i18n: {
        title: '多語言',
        description: '切換界面語言，新增新語言，設定預設語言。',
        prompts: {
          addLanguage: {
            label: '新增語言',
            text: '為應用程式增加西班牙語，界面和伺服器端提示都使用對應的翻譯，並在語言選單中提供西班牙語選項。',
          },
          defaultLanguage: {
            label: '預設語言',
            text: '把應用程式的預設語言設為簡體中文，沒有選過語言的使用者第一次開啟時看到中文。語言選單中繼續保留英文。',
          },
        },
      },
      theme: {
        title: '主題',
        description: '調整配色、字體和佈局密度，切換淺色和深色模式。',
        prompts: {
          changeTheme: {
            label: '修改主題',
            text: '修改「緊湊」主題：將主色改為藍色，略微增大圓角。保留目前字體、字號和緊湊間距。',
          },
          newTheme: {
            label: '新增主題',
            text: '新增一個「森林」主題，以綠色為主色，背景柔和，圓角適中，陰影輕一些。',
          },
        },
      },
    },
  },

  appearance: {
    title: '外觀',
    mode: '顏色模式',
    preset: '主題',
    light: '淺色',
    dark: '深色',
    system: '跟隨系統',
    themes: { default: '寬松', compact: '緊湊' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: '關閉',
    save: '儲存',
    cancel: '取消',
    confirm: '確認',
    language: '語言',
  },
  notices: {
    serverLocaleFallback: '伺服器端不支援該語言，伺服器端內容已回落為英文。',
    languageChangeFailed: '未能完成語言切換，請重試。',
  },
  account: {
    signOutFailed: '登出失敗，請重試。',
    openMenu: '開啟帳戶選單',
    fallback: '帳戶',
    signOut: '登出',
    signingOut: '正在登出…',
  },
  navigation: {
    home: '首頁',
    open: '開啟導覽',
    close: '關閉導覽',
    expand: '展開導覽',
    collapse: '收起導覽',
    toggle: '展開或收起導覽',
    label: '應用程式導覽',
    description: '前往本應用程式的頁面。',
    breadcrumb: '麵包屑',
    breadcrumbMore: '顯示中間層級',
    back: '返回',
  },
  dataTable: {
    emptyDescription: '目前範圍暫無記錄，可切換範圍或稍後再查看。',
    noResults: '暫無資料。',
    sortAscending: '升序',
    sortDescending: '降序',
    hideColumn: '隱藏',
    view: '檢視',
    toggleColumns: '顯示列',
    selectedCount: '已選擇 {{selected}} / {{total}} 行。',
    rowsPerPage: '每頁行數',
    pageOf: '第 {{page}} 頁，共 {{pageCount}} 頁',
    firstPage: '第一頁',
    previousPage: '上一頁',
    nextPage: '下一頁',
    lastPage: '最後一頁',
  },
  datePicker: {
    placeholder: '選擇日期',
    rangePlaceholder: '選擇日期範圍',
  },
};

export default systemZhTW;
