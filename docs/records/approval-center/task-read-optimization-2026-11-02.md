# OA 审批任务读取优化

日期：2026-11-02（Asia/Singapore）。仅修改 OA 应用；审批插件索引、依赖版本和历史迁移不在本次范围。工作区原有知识库等改动不属于本次。

## 调用审计与兼容

| 路径                                                      | 实际用途                                      | 本次结果                                                                         |
| --------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| seals/detail、certificates/detail                         | 生产单据详情，另被业务操作预览/权限检查复用   | tasksFor(lifecycle, recordId)，再按 assigneeId 和 pending/claimed/candidate 过滤 |
| approval-runtime/pending-candidates                       | 已注册 GET approvalCenter 的 pending 候选加速 | 公共 UserTaskService.list + OA oaTaskCenterTargets；不再调用 tasksOf             |
| departure-reassignment/service                            | 离职维护/业务改派的权威归属扫描               | 保留 tasksOf(from, OPEN, {limit:100, offset})                                    |
| contracts/service、vendor-qualification/service           | SDK 纯读包装，离职 owner 适配可调用           | 保留透传 tasksOf 参数与读事务；不是另一个列表入口                                |
| tests/logic 中 recruitment、seals、departure-reassignment | 真实任务归属断言及 mock                       | 属测试调用，不代表生产流量                                                       |

客户端 approvals/index.tsx 将旧页和深链接重定向到 taskCenter；旧 list/use-center-resource/batch-approve 源码仍在，路由注册也保留。GET approvalCenter 及 batch 接口仍在主应用注册、具有独立 API 契约和回归测试；没有外部消费者停用证据，不删除。工作台 useCenterResource 明确传入 workbench/tasks，不使用默认 approvalCenter 路径。普通任务页、工作台和徽标不应按静态字符串命中数量推断访问频率，本次没有生产访问日志或调用频率测量。

常规列表/统计、旧兼容候选路径均不再依赖 tasksOf。生产保留一个实际扫描位置、两个 SDK 包装位置；不能据此认定审批插件对应索引无用，离职扫描仍按 assignee/status/source 分页，插件内部其他消费者不属于此次审计。

## 语义与需求差异

遵循 01 基础、02 当前权限/代理、03 证明、05 用印、06 离职、07 中心及 08 验收基线，以及各模块原设计。原始业务规则没有改变；本次是读取实现补充。

详情原 tasksOf(actor) 的插件默认状态是 pending、claimed、candidate，并非 OPEN 的全部状态。新共享 personalDetailTasksFor 保留这一集合、顺序及本人过滤；不把代理人等同 assignee，不暴露其他人的任务。runs/actions 和普通记录权限保持原有读取。用印原 route 的 recordId 防御过滤继续保留，但服务自身也只返回目标单据。

兼容候选：先确认 OA 持久化 backfill.done，再按本人及当前有效委托人的集合，按业务 subject + approval.task 查询公共个人索引。复用 query-service 的任务映射读取，采用 createdAt/id 游标，每页100，直到 nextCursor 为空；不以页长或业务页大小决定结束。相同时间戳、整页与尾页均须完整。保留所有投影状态作为候选超集，避免取消的代理投影或状态映射差异提前排除记录；当前权限、业务状态、参与及真实操作 offer 决定最终返回。

证明仍保留原来的不收窄策略，因为其 pending 包含审批以外的业务办理。未知 owner 和受限字段仍返回 undefined，调用方走原业务读取。历史回填未完成或单条映射缺失也不把部分候选当完整集合；回退业务读取，基础设施读取异常直接报错，不吞成空列表。在线贡献与历史回填仍复用已注册 TaskCenterProvider，不新增插件内部表访问。

离职扫描保持每个 owner 的公开权威任务查询、OPEN/assignee/非抄送过滤、当前 run 核对、去重和真实 owner action。全部源和页收集完成后才开始写入；改派后再次扫描 remaining，避免自身写入造成 offset 漏项。此顺序不等同与其他并发写入共享全局快照。

## 验证

初次沙箱运行 PostgreSQL 连接报 EPERM；随后经执行授权在本机隔离 PostgreSQL 测试环境重跑，没有使用业务库或 SQLite。第一轮开发类型检查发现证明服务缺失 helper import，已修复。

最终验证（2026-11-02，Asia/Singapore）：

- `pnpm exec tsc -p tsconfig.server.json --noEmit`：通过；这是覆盖改动的最小现有 TypeScript 项目。
- `pnpm exec eslint` 对本次 5 个生产文件和 6 个测试文件，`--max-warnings 0`：通过。
- `pnpm exec prettier --check` 对上述代码文件；文档使用 `--ignore-path /dev/null` 格式化并检查：通过。
- 修改的 7 份文档共 984 个本地文件链接：全部目标存在。
- `pnpm exec vitest run tests/logic/approval-center/pending-candidates.test.ts tests/logic/seals/lifecycle.test.ts tests/logic/certificates/lifecycle.test.ts tests/logic/departure-reassignment/service.test.ts`：4 文件、12 项通过。
- `pnpm exec vitest run tests/logic/approval-center/task-targets.test.ts tests/logic/approval-center/detail-tasks.test.ts tests/logic/task-center/routes.test.ts tests/logic/task-center/statistics-scope.test.ts tests/logic/approval-center/administration-recruitment.test.ts tests/logic/departure-reassignment/application.test.ts`：第一轮5文件19项通过，新增分页夹具失败；修复后单独重跑 task-targets 1项通过，合计10文件32项通过。
- 新增分页夹具先后发现时间参数需 Date、upsert.update 不允许空对象，两处已修复；保存失败经过，不将第一轮记为全绿。
- 回填保护增加后单独重跑 pending-candidates：通过。代理个人投影暂时缺失场景也通过：通过当前委托人的索引仍返回7条候选，停用委托后返回0条。
- `git diff --check`：通过。没有运行全量 `pnpm check` 或构建。

覆盖范围：用印/证明详情本人和状态隔离、候选领取及已完成历史、权限拒绝、委托启用/撤销、全局业务分页、205 条同时间戳游标、状态变化、缺失映射、未完成回填、200/205 条离职任务全量改派与真实应用改派回执。

仅后端与自动化验证；没有真实岗位浏览器验收、生产发布、生产数据规模延迟或 SQL 执行计划测量。不能把合成分页正确性解释为生产吞吐提升，也不能把读优化当作完成基线全部业务验收。

## 同日反馈修正：当前候选不再扫描关闭历史

用户指出初版虽使用游标，仍读取本人/委托人在该业务的全部历史；核对属实。上文“保留所有投影状态作为候选超集”记录初版实现，本节替代其当前候选契约，历史证据保留。

personalTaskTargets 增加可选 pending 状态范围，仅 pendingCandidateRecordIds 显式选择；历史权限查询默认仍读全状态。使用公共 list 的数据库状态过滤，不在应用中遍历历史后过滤。核对当前插件 contributor 及同事务贡献规则，候选/已领取/等待/阻塞均映射 pending；关闭或被领取后挂起的任务不是当前可操作候选，释放/恢复会原子更新投影。继续读取有效委托人，保留原后续权限和实际 offer 校验，不增加 tasksOf 或插件内部表访问。

回归夹具包含205条混合状态任务，其中超过100条 pending，另加1000条 completed/cancelled 历史且故意不提供历史映射：pending 查询仍完整返回当前任务；取消后剔除、恢复后重新出现，当前待办映射缺失仍触发原保护。历史全状态读取原断言保留；同时重跑真实委托启停、代理投影暂缺、业务分页、用印领取及权限接口回归。

本轮验证（2026-11-02，Asia/Singapore）：

- `pnpm exec vitest run tests/logic/approval-center/task-targets.test.ts tests/logic/approval-center/pending-candidates.test.ts tests/logic/approval-center/administration-recruitment.test.ts`：4项通过、1项失败。新分页/历史隔离、委托、用印与车辆候选回归通过。失败为 administration-recruitment.test.ts:558 的 `view=mine` 受限字段响应预期200、实际403；该请求不进入 pending 候选路径。当前工作区另有 recruitment/service.ts 列表字段改动，本轮未修改或覆盖该模块，不宣称整个测试文件通过。
- `pnpm exec tsc -p tsconfig.server.json --noEmit`：未通过，唯一诊断为 leave-balances/service.ts:528 的 RepositoryFilter employeeId 类型不匹配，位于当前工作区其他改动。本次修改文件无类型诊断。
- 定向 ESLint（query-service、pending-candidates、task-targets.test，max-warnings 0）、Prettier、文档本地链接与 diff whitespace 检查通过。
- 未进行生产规模延迟测量；当前候选枚举量随 pending 数量增长，历史权限查询仍保留完整历史读取。

## 合并列表修复后的交叉回归复核（2026-11-02）

前节的招聘 mine 受限字段403已经复现并修复：listForCenter 显式投影现在与字段授权求交集，可选 reason 隐藏时沿用已有摘要降级，必需字段缺失仍拒绝。administration-recruitment 完整文件重跑3/3通过（120秒夹具超时，实际31.89秒）。leave-balances 的 RepositoryFilter 类型错误也已修复，server/client 类型检查通过。

列表与审批读取共同提交到 `fix/list-projections-approval-tasks`。独立工作树排除了知识库插件迁移与依赖改动；不改变审批插件索引、不改历史迁移。完整范围及验证见[列表 checklist](../oa/list-query-checklist-2026-11-02.md)。

独立 PR 工作树最终复跑：审批 detail-tasks、task-targets、pending-candidates、administration-recruitment 四个文件全部通过；同批知识库原实现与列表字段保护也通过。供应商历史权限测试失败单独记录在 checklist，未把整批称为全绿。
