import type { LocaleResource } from '@nocobase/i18n';
import type { ImportLocale } from './import.en-US.js';

const importZhCN: LocaleResource<ImportLocale> = {
  import: {
    navigation: { title: '数据导入' },
    authz: {
      settings: '数据导入',
      read: '查看历史与模板',
      update: '导入',
    },
    title: '数据导入',
    description:
      '从 Excel 模板批量导入部门、岗位、职级、员工档案和角色池成员。',
    kinds: {
      departments: '部门',
      positions: '岗位',
      grades: '职级',
      employees: '员工档案',
      dutyRoleMembers: '角色池成员',
    },
    kindHints: {
      departments: '按部门编码匹配；上级部门可以写在表中后面的行。',
      positions: '按岗位编码匹配。',
      grades: '按职级编码匹配。',
      employees:
        '按工号匹配。请先导入部门、岗位和职级；直属上级可以在同一张表中。',
      dutyRoleMembers: '按角色编码和成员账号匹配；“是否启用”填“否”会移除成员。',
    },
    actions: {
      new: '新建导入',
      templates: '下载模板',
      templateFor: '下载{{kind}}模板',
      check: '检查',
      checking: '检查中…',
      confirm: '确认导入',
      importing: '导入中…',
      chooseAgain: '重新选择文件',
      back: '返回',
      chooseFile: '选择文件',
      downloadFile: '下载原文件',
      refresh: '刷新',
      clearFilters: '清除筛选',
    },
    fields: {
      kind: '导入类型',
      file: '文件',
      createdAt: '开始时间',
      finishedAt: '完成时间',
      status: '结果',
      summary: '摘要',
      actor: '操作人',
      rowCount: '读取行数',
      createdCount: '新增',
      updatedCount: '更新',
      unchangedCount: '无变化',
      errorCount: '问题数',
      row: '行',
      column: '列',
      problem: '问题',
    },
    filters: { allKinds: '全部类型' },
    status: { succeeded: '成功', failed: '失败' },
    summary: {
      succeeded: '新增 {{created}} · 更新 {{updated}} · 无变化 {{unchanged}}',
      failed: '{{count}} 个问题',
    },
    noFile: '未选择文件',
    templateFile: '{{kind}}导入模板.xlsx',
    fileHint: '按模板填写的 .xlsx 文件，不超过 5 MB。',
    notice: {
      title: '导入前请注意',
      accounts:
        '导入不会创建登录账号：表中引用的账号（用户名或邮箱）必须已存在且已启用，否则该行报错。',
      atomic:
        '系统先检查整个文件，再一次性写入：只要有一行有问题，就不会写入任何数据。',
    },
    validation: {
      kindRequired: '请选择导入类型。',
      fileRequired: '请选择 .xlsx 文件。',
      fileType: '只能导入 .xlsx 文件。',
      fileSize: '文件超过 5 MB，请拆分为多个文件。',
    },
    report: {
      invalidTitle: '发现 {{count}} 个问题，未导入任何数据。',
      invalidDescription: '请在文件中修正下列行后重新检查。',
      truncated: '共 {{count}} 个问题，仅列出前 {{shown}} 个。',
      okTitle: '文件已通过检查',
      okDescription:
        '读取 {{rows}} 行：将新增 {{created}}，更新 {{updated}}，{{unchanged}} 行无变化。',
      wholeFile: '文件',
    },
    toast: {
      imported: '已导入“{{name}}”',
      templateFailed: '模板下载失败，请重试。',
    },
    failure: {
      forbidden: '你没有导入数据的权限。',
      tooLarge: '文件超过 5 MB，请拆分为多个文件。',
      invalidFile: '文件无法提交，请选择 .xlsx 文件。',
      generic: '请求失败，请检查网络后重试。',
    },
    empty: {
      title: '还没有导入记录',
      description: '下载模板、填写后导入，即可批量建立部门、人员和角色。',
      readOnly: '还没有导入记录。如需导入组织数据，请联系管理员。',
    },
    noResults: '没有符合筛选条件的导入记录。',
    loadFailedTitle: '无法加载导入历史',
    detail: {
      title: '导入详情 · {{name}}',
      titleLoading: '导入详情',
      notFound: '该导入记录不存在或已删除。',
      problems: '问题',
    },
    common: {
      forbidden: '你没有查看此内容的权限。',
      notFound: '该记录不存在或已删除。',
      loadFailed: '数据加载失败，请检查网络后重试。',
    },
    errors: {
      FILE_UNREADABLE:
        '文件不是可读取的 .xlsx 工作簿，请另存为 Excel 工作簿后重试。',
      SHEET_EMPTY: '第一个工作表没有数据行，请在表头下方填写数据。',
      TOO_MANY_ROWS: '文件超过 {{max}} 行，请拆分为多个文件。',
      HEADER_MISSING: '表头缺少必填列“{{header}}”。',
      HEADER_DUPLICATE: '列“{{header}}”出现了多次。',
      REQUIRED: '必填。',
      INVALID_CODE:
        '“{{value}}”不是有效的编码：只能使用字母、数字、“.”“_”“-”，最长 64 位。',
      TOO_LONG: '超过 {{max}} 个字符。',
      INVALID_INTEGER: '“{{value}}”不是整数。',
      INVALID_BOOLEAN: '“{{value}}”不是“是 / 否”。',
      INVALID_DATE: '“{{value}}”不是有效日期，请使用日期格式或 YYYY-MM-DD。',
      INVALID_STATUS:
        '“{{value}}”不是有效状态，请填写试用、正式、离职中或已离职。',
      INVALID_EMAIL: '“{{value}}”不是邮箱地址。',
      DUPLICATE_IN_FILE: '“{{value}}”与第 {{firstRow}} 行重复。',
      USER_NOT_FOUND:
        '账号“{{value}}”不存在。导入不会创建账号，请先在“用户”页面创建。',
      USER_DISABLED: '账号“{{value}}”已停用，请先在“用户”页面启用。',
      USER_TAKEN: '账号“{{value}}”已绑定工号 {{code}} 的档案。',
      USER_MISMATCH: '该工号的档案已绑定其他账号，档案的账号不能通过导入更换。',
      PARENT_NOT_FOUND: '文件和系统中都没有编码为“{{value}}”的部门。',
      EXECUTIVE_TOP_LEVEL_ONLY:
        '分管副总只能在一级部门设置；下级部门从上级继承。',
      PARENT_CYCLE: '上级部门形成了循环。',
      DEPARTMENT_NOT_FOUND: '没有编码为“{{value}}”的部门，请先导入部门。',
      DEPARTMENT_INACTIVE: '部门“{{value}}”已停用。',
      POSITION_NOT_FOUND: '没有编码为“{{value}}”的岗位。',
      POSITION_INACTIVE: '岗位“{{value}}”已停用。',
      GRADE_NOT_FOUND: '没有编码为“{{value}}”的职级。',
      GRADE_INACTIVE: '职级“{{value}}”已停用。',
      MANAGER_NOT_FOUND: '文件和系统中都没有工号“{{value}}”。',
      MANAGER_SELF: '直属上级不能是本人。',
      MANAGER_INACTIVE: '直属上级“{{value}}”已离职。',
      MANAGER_CYCLE: '直属上级关系形成了循环。',
      DUTY_ROLE_NOT_FOUND: '没有编码为“{{value}}”的角色。',
      WRITE_FAILED:
        '该行写入失败（{{reason}}），整个文件均未导入。请检查该行后重试。',
      unknown: '该行无法导入。',
    },
  },
};

export default importZhCN;
