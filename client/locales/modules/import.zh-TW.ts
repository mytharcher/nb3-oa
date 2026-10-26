import type { LocaleResource } from '@nocobase/i18n';
import type { ImportLocale } from './import.en-US.js';

const importZhTW: LocaleResource<ImportLocale> = {
  import: {
    navigation: { title: '資料匯入' },
    authz: {
      settings: '資料匯入',
      read: '查看歷史與範本',
      update: '匯入',
    },
    title: '資料匯入',
    description:
      '從 Excel 範本批次匯入部門、職位、職級、員工檔案和角色池成員。',
    kinds: {
      departments: '部門',
      positions: '職位',
      grades: '職級',
      employees: '員工檔案',
      dutyRoleMembers: '角色池成員',
    },
    kindHints: {
      departments: '按部門編碼匹配；上層部門可以寫在表中後面的行。',
      positions: '按職位編碼匹配。',
      grades: '按職級編碼匹配。',
      employees:
        '按員工編號匹配。請先匯入部門、職位和職級；直屬上層可以在同一張表中。',
      dutyRoleMembers:
        '按角色編碼和成員帳號匹配；「是否啟用」填「否」會移除成員。',
    },
    actions: {
      new: '新增匯入',
      templates: '下載範本',
      templateFor: '下載{{kind}}範本',
      check: '檢查',
      checking: '檢查中…',
      confirm: '確認匯入',
      importing: '匯入中…',
      chooseAgain: '重新選擇檔案',
      back: '返回',
      chooseFile: '選擇檔案',
      downloadFile: '下載原檔案',
      refresh: '重新整理',
      clearFilters: '清除篩選',
    },
    fields: {
      kind: '匯入類型',
      file: '檔案',
      createdAt: '開始時間',
      finishedAt: '完成時間',
      status: '結果',
      summary: '摘要',
      actor: '操作人',
      rowCount: '讀取行數',
      createdCount: '新增',
      updatedCount: '更新',
      unchangedCount: '無變化',
      errorCount: '問題數',
      row: '行',
      column: '列',
      problem: '問題',
    },
    filters: { allKinds: '全部類型' },
    status: { succeeded: '成功', failed: '失敗' },
    summary: {
      succeeded: '新增 {{created}} · 更新 {{updated}} · 無變化 {{unchanged}}',
      failed: '{{count}} 個問題',
    },
    noFile: '未選擇檔案',
    templateFile: '{{kind}}匯入範本.xlsx',
    fileHint: '按範本填寫的 .xlsx 檔案，不超過 5 MB。',
    notice: {
      title: '匯入前請注意',
      accounts:
        '匯入不會建立登入帳號：表中引用的帳號（使用者名稱或電子郵件）必須已存在且已啟用，否則該行報錯。',
      atomic:
        '系統先檢查整個檔案，再一次性寫入：只要有一行有問題，就不會寫入任何資料。',
    },
    validation: {
      kindRequired: '請選擇匯入類型。',
      fileRequired: '請選擇 .xlsx 檔案。',
      fileType: '只能匯入 .xlsx 檔案。',
      fileSize: '檔案超過 5 MB，請拆分為多個檔案。',
    },
    report: {
      invalidTitle: '發現 {{count}} 個問題，未匯入任何資料。',
      invalidDescription: '請在檔案中修正下列行後重新檢查。',
      truncated: '共 {{count}} 個問題，僅列出前 {{shown}} 個。',
      okTitle: '檔案已通過檢查',
      okDescription:
        '讀取 {{rows}} 行：將新增 {{created}}，更新 {{updated}}，{{unchanged}} 行無變化。',
      wholeFile: '檔案',
    },
    toast: {
      imported: '已匯入「{{name}}」',
      templateFailed: '範本下載失敗，請重試。',
    },
    failure: {
      forbidden: '你沒有匯入資料的權限。',
      tooLarge: '檔案超過 5 MB，請拆分為多個檔案。',
      invalidFile: '檔案無法提交，請選擇 .xlsx 檔案。',
      generic: '請求失敗，請檢查網路後重試。',
    },
    empty: {
      title: '還沒有匯入記錄',
      description: '下載範本、填寫後匯入，即可批次建立部門、人員和角色。',
      readOnly: '還沒有匯入記錄。如需匯入組織資料，請聯絡管理員。',
    },
    noResults: '沒有符合篩選條件的匯入記錄。',
    loadFailedTitle: '無法載入匯入歷史',
    detail: {
      title: '匯入詳情 · {{name}}',
      titleLoading: '匯入詳情',
      notFound: '該匯入記錄不存在或已刪除。',
      problems: '問題',
    },
    common: {
      forbidden: '你沒有查看此內容的權限。',
      notFound: '該記錄不存在或已刪除。',
      loadFailed: '資料載入失敗，請檢查網路後重試。',
    },
    errors: {
      FILE_UNREADABLE:
        '檔案不是可讀取的 .xlsx 工作簿，請另存為 Excel 工作簿後重試。',
      SHEET_EMPTY: '第一個工作表沒有資料行，請在表頭下方填寫資料。',
      TOO_MANY_ROWS: '檔案超過 {{max}} 行，請拆分為多個檔案。',
      HEADER_MISSING: '表頭缺少必填列「{{header}}」。',
      HEADER_DUPLICATE: '列「{{header}}」出現了多次。',
      REQUIRED: '必填。',
      INVALID_CODE:
        '「{{value}}」不是有效的編碼：只能使用字母、數字、「.」「_」「-」，最長 64 位。',
      TOO_LONG: '超過 {{max}} 個字元。',
      INVALID_INTEGER: '「{{value}}」不是整數。',
      INVALID_BOOLEAN: '「{{value}}」不是「是 / 否」。',
      CAREER_START_FUTURE: '首次參加工作日期不能晚於工作行事曆時區的今天。',
      CAREER_START_AFTER_HIRE: '首次參加工作日期不能晚於到職日期。',
      INVALID_DATE: '「{{value}}」不是有效日期，請使用日期格式或 YYYY-MM-DD。',
      INVALID_STATUS:
        '「{{value}}」不是有效狀態，請填寫試用、正式、離職中或已離職。',
      INVALID_EMAIL: '「{{value}}」不是電子郵件地址。',
      DUPLICATE_IN_FILE: '「{{value}}」與第 {{firstRow}} 行重複。',
      USER_NOT_FOUND:
        '帳號「{{value}}」不存在。匯入不會建立帳號，請先在「使用者」頁面建立。',
      USER_DISABLED: '帳號「{{value}}」已停用，請先在「使用者」頁面啟用。',
      USER_TAKEN: '帳號「{{value}}」已綁定員工編號 {{code}} 的檔案。',
      USER_MISMATCH:
        '該員工編號的檔案已綁定其他帳號，檔案的帳號不能通過匯入更換。',
      PARENT_NOT_FOUND: '檔案和系統中都沒有編碼為「{{value}}」的部門。',
      EXECUTIVE_TOP_LEVEL_ONLY:
        '分管副總只能在一級部門設定；下層部門從上層繼承。',
      PARENT_CYCLE: '上層部門形成了循環。',
      DEPARTMENT_NOT_FOUND: '沒有編碼為「{{value}}」的部門，請先匯入部門。',
      DEPARTMENT_INACTIVE: '部門「{{value}}」已停用。',
      POSITION_NOT_FOUND: '沒有編碼為「{{value}}」的職位。',
      POSITION_INACTIVE: '職位「{{value}}」已停用。',
      GRADE_NOT_FOUND: '沒有編碼為「{{value}}」的職級。',
      GRADE_INACTIVE: '職級「{{value}}」已停用。',
      MANAGER_NOT_FOUND: '檔案和系統中都沒有員工編號「{{value}}」。',
      MANAGER_SELF: '直屬上層不能是本人。',
      MANAGER_INACTIVE: '直屬上層「{{value}}」已離職。',
      MANAGER_CYCLE: '直屬上層關係形成了循環。',
      DUTY_ROLE_INACTIVE: '該角色已停用，不能新增成員。',
      DUTY_ROLE_NOT_FOUND: '沒有編碼為「{{value}}」的角色。',
      WRITE_FAILED:
        '該行寫入失敗（{{reason}}），整個檔案均未匯入。請檢查該行後重試。',
      unknown: '該行無法匯入。',
    },
  },
};

export default importZhTW;
