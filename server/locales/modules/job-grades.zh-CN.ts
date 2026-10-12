export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT: '当前薪级表已变更，请刷新后再发布。',
      IDEMPOTENCY_CONFLICT: '该发布键已用于其他内容。',
      TABLE_UNAVAILABLE: '薪级表尚未初始化。',
      GRADE_UNAVAILABLE: '所需职级不存在或已停用。',
      INVALID_PUBLICATION: '发布输入无效。',
      STORED_DATA_INVALID: '已存储薪级表数据无效。',
      INVALID_RANGE: '薪资区间必须包含有效整分金额。',
      DUPLICATE_GRADE: '每个职级只能出现一次。',
      OUTSIDE_RANGE: '拟定薪资超出已发布区间。',

      ACCESS_DENIED: '该薪级表操作超出授权范围。',
      NOT_FOUND: '薪级表版本不存在或不可访问。',
    },
    authz: {
      resource: '职级薪资区间',
      view: '查看发布历史',
      viewSalary: '查看薪资区间',
      manage: '发布薪级表',
    },
  },
};
