# IT报修第四阶段：容量与交付门槛核验

日期：2026-10-30 Asia/Singapore。已审基点f938c3a44733，追加验证夹具、实测及交付准备；本轮没有修改业务代码、持久模型、权限契约或历史迁移。**容量与回退门槛未通过，整项不具备最终验收/生产合并发布条件。** 功能42项既有证据保留，不能把本轮负载测量的Vitest成功退出当性能达标。

入口：[当前设计](../../designs/oa/it-repairs-design.md)、[42项功能台账](it-repairs-reporting-2026-10-30.md)、[最终配置及发布准备](it-repairs-delivery-readiness-2026-10-30.md)。第三阶段独立审查已通过f938c3a；原件与T01/T02正文4工作小时、12:00勘误均保留。

## 环境与方法

- 自建临时PostgreSQL15.10、独立测试数据库对象/文件目录；127.0.0.1:15435，shared_buffers256MB、max_connections120。应用未改连接池配置（Knex默认min2/max10）。独立Redis7.0.15进程16385，AOF及noeviction，原生共享jobs；软件包仅解包到本步临时目录，没有系统安装或修改管理实例。
- Node24.15.0；Linux6.2.16-3-pve，AMD Ryzen7 5700G，16逻辑CPU，32GiB RAM；正式样本开始可用约18.15GiB，load1.53/1.99/2.39。共享宿主无CPU/内存隔离，因此结果是该环境实测，不外推生产硬件。原始环境字段见capacity.json。
- 100000条工单由一个真实原生提交/分诊/办理样本派生，250行/批入库；10个组、两个报修人，负责人能读5组共50000条。各组均包含各状态：20%关闭，其余triage/supplement/pool/assigned/processing/waiting/acceptance/cancelled各10%；五分类、四优先级，提交时间跨90天，10%长描述。组与状态已解耦。读样本结束后另加160条新鲜工单测写入，不把它们算入读基线。
- 每列表路径先一次SQL采样、再预热5次，50个闭环并发worker×4轮=200请求；报表先一次SQL采样、再预热2次，50×2轮=100。P95采用排序后ceil(n×0.95)位置；计时从客户端发起到完整响应消费，包括认证、授权、数据库排队、序列化及loopback HTTP；不是只计SQL。
- 流式HTTP桥接保留原生认证cookie、CSRF映射与完整应用中间件，响应以Readable.pipe传输，不先缓冲整份CSV。cookie仅在内存中，不写证据。周期报修扫描设24小时，启动空扫完成后再造数，避免性能样本被无关到期补扫占满；其他模块既有任务不改。
- 读阈值仍为P95≤2000ms，普通写仍为P95≤3000ms，没有降低阈值。负载夹具把未达标保存在pass:false，而不因测量本身完成就宣布通过。

## 正式预热后结果

| 路径                      | 并发 | 样本数 | P50毫秒 | P95毫秒 | 最大毫秒 | 门槛毫秒 | 判定       |
| ------------------------- | ---- | ------ | ------- | ------- | -------- | -------- | ---------- |
| 普通列表                  | 50   | 200    | 1779.37 | 2256.29 | 2474.17  | 2000     | 失败 C1/C2 |
| 分类＋优先级筛选/期限排序 | 50   | 200    | 1087.07 | 1262.58 | 1302.88  | 2000     | 通过       |
| 第2000页/更新时间排序     | 50   | 200    | 2490.29 | 3000.79 | 3464.29  | 2000     | 失败 C1/C2 |
| 完整运营报表              | 50   | 100    | 7495.53 | 7861.71 | 8618.19  | 2000     | 失败 C1/C2 |
| 串行普通公开沟通写        | 1    | 50     | 152.56  | 164.65  | 197.67   | 3000     | 通过       |
| 同账号50路跨单写          | 50   | 50     | 2750.50 | 4873.54 | 5112.88  | 3000     | 失败 C1/C2 |

全部正式HTTP样本均200且errors为空。容量采集夹具1文件1项完成，152.15秒；此项表示测量完整，不是C1/C2达标。串行普通写有余量；同账号跨单写暴露身份写锁排队，不能用串行结果覆盖其延迟。另一次解耦组/状态后的重复样本保留在replicate-capacity.json，普通列表/深分页/报告与同账号写的超标方向一致。

## CSV与执行计划

同一授权负责人导出50000条公共摘要：12029617字节（约11.47MiB），流式消费24.89秒。API/Node驱动共进程RSS从1251.18MiB到峰值1289.75MiB，观察增量38.57MiB。基线包含ORM造数后的堆及开发运行时，未强制GC；该RSS包含Node HTTP驱动开销，不宣称纯服务端内存上限。浏览器独立Chromium原生cookie下载真实Blob大小相同，JS堆从890220到1061004字节；Blob字节在堆外，不能把JS堆增量当总客户端内存。未测50份CSV同时导出、浏览器进程总RSS或下载中断峰值，后续容量扩展需单列。

plans.json保留12个原生生成SQL的EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON)，采样在负载结束后执行，不把EXPLAIN时间混入P95。包含响应/解决/等待/暂停/验收/总工作/自然时长的有序中位/P90与评分/退回聚合。计划有对授权范围扫描后排序/offset；分布查询重复扫描并非一次读出全量再在JS计算。单条计划耗时低于并发端到端P95，框架日志实际报告请求约116–118条SQL（38条业务统计之外还有认证、权限、元数据/组检查），不能把“38条”写成整个请求SQL数。

## 100单配置阻塞

configuration.json：101张同组待领取单、真实原生待办索引；一次配置更新100张、保留1张给不同账号的并发写。配置请求200，100条refreshMembership审计；HTTP中间件内约5064ms、6803条含框架SQL，外层采样5223.30ms。另一账号写请求200，外层等待5112.43ms；pg_stat_activity实际出现transactionid Lock。注入闸门在发现真实锁等待后立即释放，没有人为延长保持时间。该样本是大配置事务，不冒充普通写P95；它表明同组写会被整批配置阻塞。早先4.127秒/5503SQL样本继续保留，夹具接收人与任务分布不同，不能直接声称同比回归。

## 多进程、重启和真实通知

两个独立OS原生应用进程使用同一隔离PG对象与Redis命名空间。并发补扫同一迟到单，仅一边改变事实；另一个进程停止并重新创建，第二次补扫无新增告警。6个响应/解决80%、超时及当日提醒各有唯一事件，持久effect成功。共享ScheduleExecutor把同一deadlines规则改为一次受控触发，在两个进程收集的ScheduleEnd合计1个jobId。multi-instance.json是进入回退实验前的原生断言检查点；复合运维用例后段因回退包拒启失败，不能把整条用例记为绿色。

R4接受发送后中断再重试的原生站内通知回归另跑；校验候选/旧办理人仅一条，旧人403。未使用模拟通知替代真实发送，也不宣称邮件/IM已联通。全部运维检查的最终计数见下方检查汇总。

## 迁移与回退发现

| 编号 | 实测                                                                                                              | 影响与建议                                                                                                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R7   | 原样复制的报告迁移up保留编号、版本、冻结日历/规则和processing；down之后仍有submittedAt+id索引，schema等价断言失败 | 后续down数据回读/二次up未被框架执行，不能记完整演练通过。建议审定尚未合并迁移的显式索引命名/清理方案，结合已运行预览的历史校验处理；本步未改历史文件。 |
| R8a  | 新库直接启动旧5415业务包，缺少已执行报告迁移源文件，原生启动拒绝                                                  | 不能只切旧artifact并保留新库就宣称可回退。保留完整迁移/seed清单是必要条件。                                                                            |
| R8b  | 旧业务包补上不可变迁移/seed后，已存reports/export/transferSecurity权限动作在旧注册表不存在，仍拒启                | 清单保留并不足够；需兼容权限及守卫实现的回退包，或验证升级前快照恢复方案。禁止跳过原生权限/迁移校验，禁止直接改历史校验记录。                          |

以上均为隔离原生失败，未动生产。rollback-results.json与可执行rehearsal夹具保留预期/实际。当前回退准备**未通过**；之前设计“回退代码并保留新增表”现已修正为待验证的兼容回退，不可照旧执行。

## 第三阶段额外探针限制

原独立审查记录：两项汇总探针在与回归并行启动时，fixture准备阶段30秒超时，未计通过。本步串行新增命名边界探针：目标安全组停用事务与转交竞争返回400，原组/版本不变、无转交审计；仅摘要字段策略筛rated cohort被底层Repository拒绝。两项通过，沿用默认启动时限，没有提高timeout。该结果补充边界证据，不能抹去原超时，也未证明其历史根因。

## 最小后续方案

1. 先优化现有请求内的资格/范围重复读取并合并同范围报表聚合，保留记录/字段权限、实时失权及SQL分位定义；同时核对深页排序执行计划。不得先加通用快照/去重模型。重跑同一100000/50基线并保留本次失败。
2. 同账号身份锁和组资格锁承担并发撤权保障；拆锁或改变批量配置提交边界属于契约变化，先提交最小方案及并发/失权回归，不能为达到P95删掉保护。若需游标替代深offset，也先确认公开查询契约。
3. 回退包需同时保留迁移历史与已存授权动作的有效注册/守卫；明确哪个功能关闭、哪些事实可继续写。原样旧包及仅补清单包均不是已验证方案。R7单列修复审定后再演练完整up/down/up；生产前另验备份恢复、文件保留、停写窗口与回退后增量数据处理。

## 命令与检查

```sh
OA_IT_REPAIR_CAPACITY=1 OA_CAPACITY_OUTPUT=<隔离证据目录> POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=15435 POSTGRES_USER=postgres POSTGRES_DATABASE=nocobase_collection_builder pnpm exec vitest run tests/fixtures/it-repairs/capacity.test.ts --maxWorkers=1
OA_IT_REPAIR_OPERATIONS=1 OA_OPERATIONS_OUTPUT=<隔离证据目录> pnpm exec vitest run tests/fixtures/it-repairs/configuration-cost.test.ts tests/fixtures/it-repairs/operations.test.ts --maxWorkers=1
pnpm exec vitest run tests/logic/it-repairs/migration-rehearsal.test.ts --maxWorkers=1
pnpm exec vitest run tests/logic/it-repairs/operational-probes.test.ts tests/logic/it-repairs/notification-timing.test.ts --testNamePattern 'target group|rated cohort|R4 native' --maxWorkers=1
pnpm exec tsc -p tests/fixtures/it-repairs/tsconfig.json --noEmit
```

运维命令须同样设置上述隔离PG变量；Redis需独立本地16385、AOF/noeviction；raw/兼容旧源码由fixture自行git archive到TMPDIR，不克隆仓库。早期pilot-incomplete/pilot-correlated保留相关性数据及超标数值，因组与状态相关，不作为完整报表分布基线；replicate的读/CSV/写已完成，后段错误配置闸门中断，实际100单配置以独立configuration.json为准。原始尝试中的EXPLAIN占位符、配置闸门名称、临时目录包解析及夹具必填优先级错误均属测试工具问题，已修正；错误尝试未计为业务通过。复合运维夹具仍保留R8b正向启动断言，迁移夹具仍保留R7 schema等价断言，当前均会真实失败，没有skip/降门槛。

[正式测量](evidence/it-repairs-capacity-2026-10-30/capacity.json) · [执行计划](evidence/it-repairs-capacity-2026-10-30/plans.json) · [配置阻塞](evidence/it-repairs-capacity-2026-10-30/configuration.json) · [多进程检查点](evidence/it-repairs-capacity-2026-10-30/multi-instance.json) · [回退失败](evidence/it-repairs-capacity-2026-10-30/rollback-results.json)

## 最终检查汇总

| 检查                     | 实际结果                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| 容量采集                 | 1文件1测量场景完成152.15秒；C1/C2仍失败                                                  |
| 配置阻塞                 | 1场景通过；100条刷新审计、真实PG Lock、两请求200                                         |
| 两项补充权限探针＋原生R4 | 3项通过；R5/R6未被本步name selector选择，不重新计数；强化field code后单项再次通过19.58秒 |
| 双OS复合运维             | 调度/重启检查点成功；后段旧包兼容启动失败，整场景记失败                                  |
| 原生up/down/up           | schema等价断言失败；保留失败夹具，不能记为通过                                           |
| 夹具TypeScript           | `tests/fixtures/it-repairs/tsconfig.json` exit0                                          |
| 六个新增TS文件ESLint     | exit0，零警告；Prettier和新增文档本地链接通过                                            |
| 既有功能/角色            | 保留第三阶段独立32项及双语浏览器，当前业务代码未改                                       |

计数见[检查汇总JSON](evidence/it-repairs-capacity-2026-10-30/check-summary.json)。本步预计需要后续容量优化及回退方案确认，不申请整项验收。
