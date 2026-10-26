/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: '데이터 가져오기' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: '데이터 가져오기',
      read: '이력 및 템플릿 보기',
      update: '가져오기',
    },
    title: '데이터 가져오기',
    description:
      'Excel 템플릿으로 부서, 직위, 직급, 직원 인사 기록 및 업무 역할 구성원을 가져옵니다.',
    kinds: {
      departments: '부서',
      positions: '직위',
      grades: '직급',
      employees: '직원 인사 기록',
      dutyRoleMembers: '업무 역할 구성원',
    },
    kindHints: {
      departments:
        '부서 코드로 일치시킵니다. 상위 부서는 시트 아래쪽에 정의할 수 있습니다.',
      positions: '직위 코드로 일치시킵니다.',
      grades: '직급 코드로 일치시킵니다.',
      employees:
        '사번으로 일치시킵니다. 부서, 직위 및 직급을 먼저 가져오세요. 관리자는 같은 시트에 정의할 수 있습니다.',
      dutyRoleMembers:
        '역할 코드와 계정으로 일치시킵니다. 활성 열의 "No"는 구성원을 제거합니다.',
    },
    actions: {
      new: '새 가져오기',
      templates: '템플릿 다운로드',
      templateFor: '{{kind}} 템플릿 다운로드',
      check: '확인',
      checking: '확인 중…',
      confirm: '가져오기',
      importing: '가져오는 중…',
      chooseAgain: '다른 파일 선택',
      back: '뒤로',
      chooseFile: '파일 선택',
      downloadFile: '원본 파일 다운로드',
      refresh: '새로고침',
      clearFilters: '필터 초기화',
    },
    fields: {
      kind: '종류',
      file: '파일',
      createdAt: '시작됨',
      finishedAt: '종료됨',
      status: '결과',
      summary: '요약',
      actor: '작업자',
      rowCount: '읽은 행',
      createdCount: '생성됨',
      updatedCount: '업데이트됨',
      unchangedCount: '변경 없음',
      errorCount: '문제',
      row: '행',
      column: '열',
      problem: '문제',
    },
    filters: { allKinds: '모든 종류' },
    status: { succeeded: '성공', failed: '실패' },
    summary: {
      succeeded:
        '{{created}}개 생성 · {{updated}}개 업데이트 · {{unchanged}}개 유지',
      failed: '문제: {{count}}개',
    },
    noFile: '선택한 파일 없음',
    templateFile: '{{kind}} 가져오기 템플릿.xlsx',
    fileHint: '템플릿 형식의 최대 5MB .xlsx 통합 문서.',
    notice: {
      title: '가져오기 전',
      accounts:
        '가져오기는 계정을 생성하지 않습니다. 파일에 지정한 계정(사용자 이름 또는 이메일)은 이미 존재하며 활성 상태여야 합니다. 그렇지 않으면 해당 행이 보고됩니다.',
      atomic:
        '파일 전체를 먼저 검사하고 한 번에 기록합니다. 한 행이라도 문제가 있으면 아무것도 기록하지 않습니다.',
    },
    validation: {
      kindRequired: '파일에 들어 있는 항목을 선택하세요.',
      fileRequired: '.xlsx 파일을 선택하세요.',
      fileType: '.xlsx 통합 문서만 가져올 수 있습니다.',
      fileSize: '파일이 5MB를 초과합니다. 여러 파일로 분할하세요.',
    },
    report: {
      invalidTitle:
        '문제 {{count}}개를 발견했습니다. 아무것도 가져오지 않았습니다.',
      invalidDescription: '파일에서 아래 행을 수정한 후 다시 확인하세요.',
      truncated: '문제 {{count}}개 중 첫 {{shown}}개만 표시합니다.',
      okTitle: '파일 검사 통과',
      okDescription:
        '{{rows}}행 읽음: {{created}}개 생성, {{updated}}개 업데이트, {{unchanged}}개 유지 예정.',
      wholeFile: '파일',
    },
    toast: {
      imported: '"{{name}}"을 가져왔습니다',
      templateFailed: '템플릿을 다운로드하지 못했습니다. 다시 시도하세요.',
    },
    failure: {
      forbidden: '가져오기 권한이 없습니다.',
      tooLarge: '파일이 5MB를 초과합니다. 여러 파일로 분할하세요.',
      invalidFile: '파일을 보내지 못했습니다. .xlsx 통합 문서를 선택하세요.',
      generic: '요청에 실패했습니다. 연결을 확인하고 다시 시도하세요.',
    },
    empty: {
      title: '가져오기 없음',
      description:
        '템플릿을 다운로드하여 입력한 후 가져와 부서, 직원 및 역할을 추가하세요.',
      readOnly: '가져오기 없음. 관리자에게 조직 데이터 가져오기를 요청하세요.',
    },
    noResults: '필터와 일치하는 가져오기가 없습니다.',
    loadFailedTitle: '가져오기 이력을 불러오지 못함',
    detail: {
      title: '가져오기 세부 정보 · {{name}}',
      titleLoading: '가져오기 세부 정보',
      notFound: '가져오기가 없거나 삭제되었습니다.',
      problems: '문제',
    },
    common: {
      forbidden: '볼 권한이 없습니다.',
      notFound: '레코드가 없거나 삭제되었습니다.',
      loadFailed:
        '데이터를 불러오지 못했습니다. 연결을 확인하고 다시 시도하세요.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        '읽을 수 있는 .xlsx 통합 문서가 아닙니다. Excel 통합 문서로 저장하고 다시 시도하세요.',
      SHEET_EMPTY:
        '첫 시트에 데이터 행이 없습니다. 헤더 아래에 행을 입력하세요.',
      TOO_MANY_ROWS: '파일이 {{max}}행을 초과합니다. 여러 파일로 분할하세요.',
      HEADER_MISSING: '헤더 행에 필수 열 "{{header}}"이 없습니다.',
      HEADER_DUPLICATE: '"{{header}}" 열이 중복됩니다.',
      REQUIRED: '필수 항목입니다.',
      INVALID_CODE:
        '"{{value}}"은 유효한 코드가 아닙니다. 영문, 숫자, ".", "_", "-"를 최대 64자 사용하세요.',
      TOO_LONG: '{{max}}자를 초과합니다.',
      INVALID_INTEGER: '"{{value}}"은 정수가 아닙니다.',
      INVALID_BOOLEAN: '"{{value}}"은 是 / 否(예 / 아니요)가 아닙니다.',
      CAREER_START_FUTURE:
        '최초 취업일은 근무 달력 시간대의 오늘 이후일 수 없습니다.',
      CAREER_START_AFTER_HIRE: '최초 취업일은 입사일 이후일 수 없습니다.',
      INVALID_DATE:
        '"{{value}}"은 올바른 날짜가 아닙니다. 날짜 셀 또는 YYYY-MM-DD를 사용하세요.',
      INVALID_STATUS:
        '"{{value}}"은 상태가 아닙니다. 试用, 正式, 离职中 또는 已离职를 사용하세요.',
      INVALID_EMAIL: '"{{value}}"은 이메일 주소가 아닙니다.',
      DUPLICATE_IN_FILE: '"{{value}}"은 {{firstRow}}행에 이미 있습니다.',
      USER_NOT_FOUND:
        '"{{value}}" 계정이 없습니다. 가져오기는 계정을 생성하지 않습니다. 사용자 페이지에서 먼저 생성하세요.',
      USER_DISABLED:
        '"{{value}}" 계정이 비활성 상태입니다. 사용자 페이지에서 먼저 활성화하세요.',
      USER_TAKEN: '"{{value}}" 계정이 이미 직원 {{code}}에 속합니다.',
      USER_MISMATCH:
        '사번이 다른 계정에 연결되어 있습니다. 인사 기록은 연결 계정을 유지합니다.',
      PARENT_NOT_FOUND:
        '파일 또는 시스템에 "{{value}}" 코드의 부서가 없습니다.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        '최상위 부서만 담당 임원을 지정할 수 있습니다. 하위 부서는 상속합니다.',
      PARENT_CYCLE: '상위 부서 관계에 순환이 있습니다.',
      DEPARTMENT_NOT_FOUND:
        '"{{value}}" 코드의 부서가 없습니다. 먼저 부서를 가져오세요.',
      DEPARTMENT_INACTIVE: '"{{value}}" 부서가 비활성 상태입니다.',
      POSITION_NOT_FOUND: '"{{value}}" 코드의 직위가 없습니다.',
      POSITION_INACTIVE: '"{{value}}" 직위가 비활성 상태입니다.',
      GRADE_NOT_FOUND: '"{{value}}" 코드의 직급이 없습니다.',
      GRADE_INACTIVE: '"{{value}}" 직급이 비활성 상태입니다.',
      MANAGER_NOT_FOUND: '파일 또는 시스템에 사번 "{{value}}"이 없습니다.',
      MANAGER_SELF: '자신을 관리자로 지정할 수 없습니다.',
      MANAGER_INACTIVE: '"{{value}}" 관리자가 퇴직했습니다.',
      MANAGER_CYCLE: '관리자 관계에 순환이 있습니다.',
      DUTY_ROLE_INACTIVE: '비활성 역할에는 새 구성원을 추가할 수 없습니다.',
      DUTY_ROLE_NOT_FOUND: '"{{value}}" 코드의 업무 역할이 없습니다.',
      WRITE_FAILED:
        '행을 기록하지 못해({{reason}}) 아무것도 가져오지 않았습니다. 행을 확인하고 재시도하세요.',
      unknown: '이 행을 가져올 수 없습니다.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
