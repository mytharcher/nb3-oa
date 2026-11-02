# IT报修上游同步

2026-11-02 Asia/Singapore。将main的0569875合入agent/PM-2，解决4个冲突，保留已审报修和上游功能；未改写报修业务行为，未合并到main或生产发布。原最终审查继续适用。

## 冲突处理

| 文件                                                    | 处理依据                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| server/providers/approval-runtime/pending-candidates.ts | 采用上游完整实现：公共个人任务索引、backfill完成守卫及代理候选；不恢复旧tasksOf扫描。报修仍为独立非审批来源。    |
| server/providers/expense-plan/service.ts                | 同时保留scopeAst与readableListFields导入，分别供既有报修来源范围验证和上游列表字段投影使用。                     |
| server/providers/purchases/service.ts                   | 同时保留上述两个导入；来源只读门面与上游列表优化均保留。                                                         |
| server/providers/process-management/owners.ts           | 使用上游AppApprovalService类型并保留null分支；保留oa.itRepair的独立runtime注册和approvals:null，不生成审批任务。 |

报修server/provider、路由、client页面及数据库迁移与同步前f1b6f17逐字一致。通过TypeScript AST比较确认：采购/费用referenceSummary、referenceChanges，资产repairEligibility及采购单referenceProgress的方法正文均未变化。pending-candidates与origin/main逐字一致。其余上游改动使用Git三方自动合并。

冲突处理本身新增查询、写入、锁和事务均为0，原5单批次、连接池、事务事实复用、幂等、冻结计时和通知身份不变。上游列表/审批/离职优化保留其已合入main的实现及文档。

## 验证与边界

- 上游AGENTS与当前指引一致，项目记忆索引0项。当前依赖入口缺失，经普通pnpm install恢复；未变更依赖清单、锁文件或4个既有patch。
- 服务端TypeScript、4个冲突文件零警告ESLint、格式和Git冲突/空白检查通过。
- 按本次分派仅同步、不改写业务，未重跑完整本地容量、PG功能与角色验收；沿用[事务事实正式样本](it-repairs-transaction-facts-2026-10-30.md)及原最终独立审查。
- 原42项、历史失败、全部容量样本和自然并发93ms最小余量继续保留，未将旧测量改写为本次测量。
- 完整CI和匹配预览以同步后的提交在交接线程报告；预览不替代PG证据。

安全转交默认关闭，公司制度和生产合并发布仍另行授权。本步只推送原PR分支。

## 详情

- PR：[IT repair workflow](https://github.com/mytharcher/nb3-oa/pull/3)
- 已审基点：f1b6f174d2d08a4ffda75bb94e7abfccfc05d815。
- 上游基点：0569875；通过merge保留双方历史，不rebase或force push。
