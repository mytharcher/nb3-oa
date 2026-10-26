export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT: '目前薪級表已變更，請重新整理後再發佈。',
      IDEMPOTENCY_CONFLICT: '該發佈鍵已用於其他內容。',
      TABLE_UNAVAILABLE: '薪級表尚未初始化。',
      GRADE_UNAVAILABLE: '所需職級不存在或已停用。',
      INVALID_PUBLICATION: '發佈輸入無效。',
      STORED_DATA_INVALID: '已存儲薪級表資料無效。',
      INVALID_RANGE: '薪資區間必須包含有效整分金額。',
      DUPLICATE_GRADE: '每個職級只能出現一次。',
      OUTSIDE_RANGE: '擬定薪資超出已發佈區間。',

      ACCESS_DENIED: '該薪級表操作超出授權範圍。',
      NOT_FOUND: '薪級表版本不存在或不可訪問。',
    },
    authz: {
      resource: '職級薪資區間',
      view: '查看發佈歷史',
      viewSalary: '查看薪資區間',
      manage: '發佈薪級表',
    },
  },
};
