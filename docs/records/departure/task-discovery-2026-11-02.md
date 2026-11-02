# 离职审批任务发现迁移（2026-11-02）

时区 Asia/Singapore。基于 `fix/list-projections-approval-tasks`，实施前 fetch 核对本地/远端均为 `ce367ca`、ahead/behind 0/0，工作区干净。仅修改 OA，未修改审批插件、历史迁移或业务数据库。原需求见[离职原设计](../../designs/departure/source/29-departure-design.md)，当前补充见[离职契约](../../designs/departure/cancellation-capacity-design.md)。

## 实现及完整性

主应用已有 DepartureReassignmentProvider 注册，本次注入发现器；26 个 owner 保留。调用链为公共个人待办全状态 list（100/页，createdAt+ID 稳定游标）→ OA 映射逐页批读 → 每个 owner 业务集合 ID 游标分页（200/页）补全 → 单据去重 → tasksFor / runsFor → taskId 去重与原始 assignee、OPEN、角色/种类、当前 run/source/stage/version 校验 → 原 owner.action → 单据级 actionsOf 验证所有 receipt → 再次完整发现和事实检查 remaining。后一个任务失败保留前一个真实提交；journal 与 requestKey 校验不变。

投影只发现候选，不授予权限。OPEN 六状态中 suspended 被贡献为 cancelled，其他五状态对 active 接收人贡献 pending；被代理的原始 assignee 不变，未处理代理失效后取消投影，完成任务仅原责任人及实际操作人保留 completed。候选池领取挂起其他候选，释放恢复；copy 在 approval.cc，info/copy 事实再次排除。全状态读取不把取消历史当真实责任，也不会漏 suspended；active 变化或同步滞后无投影时，所有业务单据补全仍发现原任务。

现有公共 API 没有证明个人索引完整的水位/同步 barrier；回填 done 不能解决该缺口。因此无论回填是否完成都补全业务记录，不依赖投影数量判定无任务。缺映射、未知 owner、读取失败及投影任务事实不存在均明确失败；当前 run 缺失或不匹配留 remaining，确证关闭 run 排除。候选页和权威读取全部结束后才开始改派，自己的写入不会移动发现分页。

维护发现成本为索引页数 + 业务集合页数 + 去重单据数；每轮每单据 tasksFor 一次、有相关任务时 runsFor 一次，receipt 每受影响单据一次。业务 action 每个任务仍须自己的权限/资格/写事务，不宣称业务 action 内部查询恒定。业务补全包括历史记录，是维护成本；原常规列表投影、统计、详情和 pending 候选加速不变。

## OA 暴露与删除前置条件

- contracts、vendor-qualification 包装改为 tasksFor；departure-reassignment、asset-requests、loan-requests、payment-requests、seals 等 contract 移除旧读接口，seals 返回任务类型改为 tasksFor 的结果。
- `createAppApprovalService` 返回显式 AppApprovalService 方法清单及运行时 facade，防止直接返回 SDK 再隐式暴露旧读接口。保留其他现有按单据读取。旧供应商 maintenanceReassign 没有消费者，已删除；它原本调用 SDK 全局 reassign，间接依赖旧读接口。应用 facade 同时不暴露该 SDK 全局改派入口；真实改派用业务 action，不受影响。
- 测试归属断言按已知单据读取并核对 assignee/status；删除审批候选测试对旧 reader 的 spy，新增公共 facade 无旧入口断言。没有保留模拟旧扫描的测试。
- 审批插件自身仍有 `ApprovalActions.reassign → host.tasksOf`；service-actions 的 host 类型、service facade、reader 实现和声明仍相互依赖。插件删除公共 API 前必须先迁移/弃用其全局 reassign，处理内部类型及对应测试/示例/文档。
- 其他应用、外部调用方及独立集成不在本仓库扫描范围；插件发布前须列消费者清单、完成迁移、给出破坏性版本/弃用与升级说明，并验证编译、运行及发布产物兼容性。OA 的接口删除不证明生态已迁完。
- 旧五列索引是否可删仍需审批插件审计其他消费者、查询计划和数据规模，再走新的前向迁移；不得改历史迁移。此轮未对插件作任何写入。

## 自动验证

所有数据库夹具使用 PostgreSQL 临时独立 schema，并自动清理。测试命令统一在进程环境设置 `NOCOBASE_DEMO_MODE=false NOCOBASE_DEMO_WRITABLE_COLLECTIONS=session,verification`，隔离本地演示配置，不写配置文件。

1. 初次普通集成运行启动失败：本地 demo allow-list 含不存在的 knowledgePluginLinks。隔离环境覆盖后首次 sandbox 连接本机 PG 被 EPERM 拒绝；获准访问后正常运行。第一轮新实现还发现公共 list pageSize 最大为 100（此前误写 200），已修正并重跑；不是跳过测试。
2. `pnpm exec vitest run tests/logic/departure-reassignment/application.test.ts`：8 项通过，真实 SDK 改派、部分提交/重试、journal 冲突、inactive 接收人、全部 owner 解析，以及 200/205 条同时间戳分页、映射缺失/索引失败和回填未完成的补全。
3. `pnpm exec vitest run tests/logic/departure-reassignment tests/logic/approval-task-views.test.ts tests/logic/list-fields.test.ts tests/logic/approval-center/task-targets.test.ts tests/logic/approval-center/detail-tasks.test.ts tests/logic/approval-center/pending-candidates.test.ts tests/logic/task-center/routes.test.ts tests/logic/task-center/approval-adapter.test.ts tests/logic/task-center/delegation-boundary.test.ts tests/logic/task-center/synchronization-transaction.test.ts tests/logic/recruitment/host-app.test.ts tests/logic/seals/lifecycle.test.ts tests/logic/certificates/lifecycle.test.ts`：15 文件、71 项通过（125.91 秒）。
4. 增补重复单据候选与按单据批读 receipt 后，`pnpm exec vitest run tests/logic/departure-reassignment/service.test.ts tests/logic/departure-reassignment/coverage.test.ts`：2 文件、24 项通过。另增权限拒绝及改派成功后 remaining 读取失败的阻断测试。覆盖六 OPEN、三非 OPEN、info/copy、其他 assignee、多个 owner、多个同单据任务、未知 owner/缺事实、缺/错/关闭 run、资格或权限类 action 失败、receipt 缺失或不匹配及并发新增在第二轮被保留。
5. PG 分页用真实公共 UserTaskService 与 OA Repository：200 条恰好两页；205 条三页，创建时间全部相同且包含 cancelled。映射 SELECT 分别 2/3 次、业务 ID SELECT 均 2 次；每单据只保留一个候选。服务测试断言 tasksFor 每轮每单据一次、runsFor/history 不随同单据任务数重复。
6. `pnpm exec tsc -p tsconfig.server.json --noEmit`、变更 TypeScript 文件定向 ESLint（max-warnings 0）、Prettier 及本地链接检查见本记录末尾最终复核。类型检查包含 server/database/cli，这是现有最小服务器项目配置；未运行完整 pnpm check。

早期 coverage 仅匹配 raw SDK constructor，误把共享工厂当业务 owner；已改为检查业务 factory 调用，排除共享运行时模块。旧记录中历史验证未覆盖本轮，不替换原失败证据。

## 并发及验收限制

没有跨 owner/多页一致性快照。任务 action 保留 SDK 自己的并发校验，改派后重新发现可检出该轮可见的并发新增；游标之前插入的记录、最终扫描后新增任务不能据此保证不存在。最终账号停用不与所有审批任务写入共享锁，严格保证需要所有分配方共同使用员工/任务分配 fence。任务与业务记录、个人投影均断裂的孤儿历史无法由现有公开 API 证明不存在，应恢复归属再维护；本轮不宣称迁移了未知历史插件任务。

已注册、自动验证与生产发布是不同证据。没有执行真实角色浏览器验收、生产部署或业务库变更；未做审批插件升级兼容或全生态消费者审计。

## 最终复核

- 最后补充原责任人断言及 facade 无旧入口断言后，`vitest run tests/logic/departure-reassignment/application.test.ts tests/logic/recruitment/host-app.test.ts -t 'registered departure owner|resolves all registered'`：2 文件、2 项通过，19 项因筛选跳过（此前完整回归已执行）。
- `vitest run tests/logic/task-center/statistics-scope.test.ts`：5 项通过；该文件为纯范围逻辑测试，不将其称为 PG 集成。
- 最终服务器 TypeScript、变更文件 ESLint（含新增 discovery.ts）和 Prettier、`git diff --check` 通过。11 份变更文档的 1018 个本地文件链接存在性检查通过（不作为所有历史 fragment 锚点校验）。
- `rg -n 'tasksOf' server client cli database --glob '*.ts' --glob '*.tsx'`：无匹配。tests 仅剩一处 Reflect.get 的接口不存在断言；没有旧扫描模拟或调用。docs 的旧轮次记录保留，并标注后续迁移，不抹去历史。
- docs 默认由仓库忽略；本次新迁移记录用 intent-to-add 纳入 diff，未创建提交。既有所属设计、进度、审计及分类索引已按本地文档约定更新。
