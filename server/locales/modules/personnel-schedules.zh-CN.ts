export default {
  probationRequests: {
    schedule: {
      title: '试用期到期提醒',
      description:
        '每日按公司时区核对试用期，创建到期前14天自评草稿并通知员工。',
    },
  },
  departureRequests: {
    schedule: {
      title: '离职生效执行',
      description: '执行到期离职并重试未完成的账号及组织成员变更。',
    },
  },
};
