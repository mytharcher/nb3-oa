# IT报修权限批量读取与回退断点核验

日期：2026-10-30 Asia/Singapore。权限批量读取及条件缩批已实现，配置竞争写仍超过3秒门槛，当前仍不建议合并发布。历史容量失败及原始down失败保留。生产操作未授权，安全转交默认关闭。

## 范围与成本

授权owner的可选`PermissionSetStore.getMany`按输入顺序返回值或undefined；解析owner仍先去重、按首次出现顺序合并，首个缺失key仍报原错误。无该方法的store保留逐个get回退。数据库owner沿用同一绑定连接/事务，每200个不同key一次参数化IN，空输入零查询，不缓存身份、授权或业务事实。

49个key由49次读取降至1次。完整请求SQL：列表20、筛选20、深页35、报表34；原补救样本分别69、68、83、82。报表业务聚合仍为3条，授权策略、精确分位、公开页码、共享资格锁及管理员排他撤权不变。每次解析内存O(K)，每批CSV重新授权；无新增持久模型、索引或写锁。

先保留每类10单正式复测，配置竞争写仍失败，才按授权缩至每类5单；每类读取6条判断hasMore，沿用原游标，单张工单的路由、待办、审计和通知意图仍同事务。后台每轮最多10组不变。101单从11批变为21批，总事务/查询量增加；本次不进一步扩大契约。

## 容量

与[原方法](it-repairs-capacity-2026-10-30.md)相同：独立PG15.10，127.0.0.1:15435，shared_buffers256MB、max_connections120；应用池max10。合成10万单、50路完整原生HTTP响应、列表各200样本/报表100样本，分别5次/2次串行预热；普通写50个不同单。正式测量期间没有并行本轮测试、构建或静态检查。

第一轮只增加批量读取、保留每类10单：[原样本](evidence/it-repairs-permission-batching-2026-10-30/capacity-before-shrink.json)的列表/筛选/深页/报表P95为1894.38/890.76/1475.96/1728.55ms；串行写153.23ms，同账号并发写2876.63ms，全部过门槛。SQL捕获证明列表和报表各一次权限集IN读取。此轮JSON的base字段沿用旧夹具标签，实际执行基点为bb11e5b加本轮两个owner patch；最终样本修正标签。

| 配置策略 | 配置耗时ms | 持锁工作窗口ms | 50写P95ms | 101单收敛ms | 批数 | 写门槛 |
| -------- | ---------: | -------------: | --------: | ----------: | ---: | ------ |
| 每类10单 |    1469.75 |        1364.22 |   3655.63 |     7779.83 |   11 | 失败   |
| 每类5单  |    1229.70 |        1128.92 |   3624.45 |     8707.92 |   21 | 失败   |

[10单](evidence/it-repairs-permission-batching-2026-10-30/configuration-batch10.json)、[5单](evidence/it-repairs-permission-batching-2026-10-30/configuration-batch5.json)均50个HTTP200、旧工程师在全部同步前403、最终101单全部待办归新人。持锁工作窗口从组锁内第一条成员刷新审计到配置响应，包含受控门与提交/响应；不是精确数据库锁持有时间。门仅等待另一请求出现真实PG Lock后立即释放，诊断独立1连接，应用池不变；此为受控竞争而非无干预自然吞吐。

缩批减少单批工作，但同账号原本已接近3秒，配置持锁与50写排队仍超标。建议后续审查根据锁内资格/待办/生命周期成本决定是否另行授权优化；本轮保留共享锁、即时撤权和单工单事务，不降低门槛。

## 权限与回归

新增owner等价性验证覆盖顺序、重复assignment去重、缺失错误、保护root/unrestricted、合并与逐个get回退。原生PG49key一次读取、206key两次读取（200+6）、空输入零读取；绑定事务能读取未提交的权限集和assignment，外部不可见，主动失败后全部回滚。

每类5单补验101单完整续跑、第三条恢复审计失败时整批回滚、原编号/冻结时钟保留；原生同版本竞争、旧成员即时失权、敏感转交、批间CSV撤权和真实站内通知重试继续验证。首次新增PG测试将员工默认member权限遗漏于期望，修正夹具期望为48个显式加member共49个；未改授权行为。

首次11文件18项中17项通过，R7物理序号比较失败；修正后R7单文件1项通过。没有延长时限、重试业务请求或删弱权限断言。完整新增结果及角色/运维检查见本记录后续核验段。

## R7与只读边界

R7仅首次up后为原始down精确补偿普通submittedAt/id索引；再次up保留全部索引，比较两个受影响collection的完整builder定义和物理列、索引、主外键与约束。PG DROP COLUMN保留attnum空洞，物理比较只将可见列序号规范为连续顺序，保留列次序及全部其他属性。原始迁移不改，原始down失败继续保留。

兼容只读包继续保留迁移、安全注册和私有文件守卫。断点演练在切换前制造明确未发送的queued effect，使其到期，停止全部active节点；只读期间比较完整effect状态/次数/时间，再恢复active，断言成功恰好增加一次尝试及重放不变。原报修人读200、旧IT403、写503及tick拒绝继续验证。生产停写、切包和数据取舍仍另授权。

## 42项与发布

[V01–V30和T01–T12](it-repairs-reporting-2026-10-30.md)原功能证据保留；本轮关联C1/C2容量和R7/R8回退，不把42项写为本次全部重验。T01/T02继续12:00勘误，原件11:00保留。历史报表菜单断言、任务中心fixture及30秒启动限制均保留。

公司制度、第14节建议、敏感开关、通知渠道、共享jobs、停写窗口及生产合并发布仍须负责人确认；本次隔离合成证据不替代生产授权。

## 最终代码容量复测

缩至5单后再次独占执行完整相同样本，夹具1文件1项完成（85.36秒）；所有HTTP200、错误数组为空。

| 路径                            | P95毫秒 | 门槛毫秒 | 结果 |
| ------------------------------- | ------: | -------: | ---- |
| 列表                            | 1787.76 |     2000 | 通过 |
| 分类/优先级/期限排序            |  791.98 |     2000 | 通过 |
| 第2000页                        | 1446.77 |     2000 | 通过 |
| 报表                            | 1675.57 |     2000 | 通过 |
| 串行普通写                      |  181.42 |     3000 | 通过 |
| 同账号50路跨单写                | 2783.05 |     3000 | 通过 |
| 配置持锁期间50写（上述5单样本） | 3624.45 |     3000 | 失败 |

[最终样本](evidence/it-repairs-permission-batching-2026-10-30/capacity.json)、[SQL形状](evidence/it-repairs-permission-batching-2026-10-30/query-shapes.json)、[6份真实计划](evidence/it-repairs-permission-batching-2026-10-30/plans.json)保留完整分布、硬件、池及方法。节点16核Ryzen7 5700G、32GiB，Node24.15.0；同进程驱动和API的限制不变。列查询计划保留原授权范围与排序；聚合继续对授权输入精确计算，不新增索引。

50k行CSV为12029617字节，完整流式读取6711.21ms；Node/API/驱动RSS从1118314496到1210478592（约87.89MiB增量），含种子与GC，不能当成独立服务器内存上限。Chromium Blob字节一致，JS堆890220→1061012；未测浏览器总RSS或50并发CSV。每100行重新授权的PG撤权回归仍通过。

## 运行检查的环境修正

首次运维启动命中旧临时Redis的MISCONF（原16385端口仍被旧进程占用且临时存储已消失），本轮改独立16486、Redis7.0.15、AOF/noeviction及唯一namespace；未关闭持久化或停止其他运行实例。夹具增加显式端口选择，并将配置诊断连接改为同一隔离PG的环境参数，避免硬编码账号和服务器。

只读断点首次新增种子误用字符串effect id过滤原生整数主键，Repository按预期拒绝；夹具按生命周期公开字符串ID到其既有整数主键的转换后重跑。未改变产品、原生守卫或超时。所有生成身份、数据和文件均为本轮隔离合成资料。

断点首次稳定性比较捕获了尚未执行的初始queued，随后正常投递失败回队造成状态差异；现明确等待“queued且为受控发送错误”，再置为到期并停全部active节点。比较条件保留完整effect对象和真实回执ID，未忽略尝试次数或时间字段。

## 最终断点结果

[编译产物回切](evidence/it-repairs-permission-batching-2026-10-30/operations.json)1文件1项通过（59.12秒）：停全部active节点后启动本轮编译只读程序，queued effect的完整对象在只读前后相等，attempts均1，真实员工回执均2条；恢复active后succeeded、attempts2、回执3条，再次runEffect全部不变。原报修人200、旧IT403、写503、tick READ_ONLY均通过。

[双进程结果](evidence/it-repairs-permission-batching-2026-10-30/multi-instance.json)保持共享ScheduleEnd仅一个jobId、6条阈值事实及重启去重；[原始旧包](evidence/it-repairs-permission-batching-2026-10-30/raw-rollback.json)继续按预期拒启。旧包不跳过迁移校验；[本地编译身份](evidence/it-repairs-permission-batching-2026-10-30/artifact-info.json)记录归档SHA及未提交工作树身份，CI预览版本另按最终提交核对。

R7最终单文件1项通过（0.96秒），首次11文件18项中的其余17项保留通过结果，合计为分段18项；运维1项、两个容量样本及两种配置测量另列，不累加成验收项。原独立快照恢复审查证据保留，本轮未重跑快照恢复。

## 角色界面、静态与交接

本轮3文件3项真实角色浏览器通过（169.27秒），隔离PG及原生A/E1/L/K/S身份，覆盖办理/本人验收退回、中英375px报表/CSV/敏感转交和旧IT失权、只读明暗主题及待同步入口。英文报表和只读截图随交接附上；界面未新增交互，续跑仍显示实际processed和hasMore。配置截图中的通知通道提示来自未连接通道的只读展示夹具，真实站内通知检查另见运维断点。

Server和夹具TypeScript、受影响文件零警告ESLint、构建归档、格式/相对链接和git diff检查通过。主应用注册及发布开关保持原契约。CI与匹配预览按最终提交在交接线程报告，预览SQLite不用于PG容量或事务结论。当前不具备整项验收或生产发布条件。

## 复现详情

- 隔离PG使用本轮临时目录initdb/pg_ctl（本机15.10）、trust仅127.0.0.1及临时socket、15435端口、合成库nocobase_collection_builder；每测试原生provisioner独立schema/文件目录。DB_*和POSTGRES_*必须同一实例。未读写业务库。
- 容量：`OA_IT_REPAIR_CAPACITY=1 OA_CAPACITY_OUTPUT=<证据目录> pnpm exec vitest run tests/fixtures/it-repairs/capacity.test.ts --maxWorkers=1`；两轮测量之间无本轮其他检查。before-shrink保留10单策略，capacity为最终5单代码。
- 配置：`OA_IT_REPAIR_OPERATIONS=1 OA_CONFIGURATION_CONCURRENCY=50 OA_OPERATIONS_OUTPUT=<目录>`，选择configuration-cost；10单先测，失败后才改5单复测。
- 回切：`OA_OPERATIONS_REDIS_PORT=16486 OA_IT_REPAIR_OPERATIONS=1 OA_OPERATIONS_OUTPUT=<目录>`选择operations，先`pnpm build --tar`；本轮Redis7.0.15/AOF/noeviction，唯一namespace。
- 回归：选择permission-batching、permission-batching-pg、compensated-migration、reporting、service、recovery、shared-qualification、security、phase3-edges、notification-timing和组件it-repair-recovery。原始migration-rehearsal的已知失败仍单独保留。
- 浏览器：`OA_IT_REPAIR_BROWSER=1`选择handling-browser、reporting-browser、read-only-browser；所有用例保留原时限。
- [检查摘要](evidence/it-repairs-permission-batching-2026-10-30/check-summary.json)保留分项计数、失败和限制。源码基点bb11e5b；本轮四个依赖patch版本不变，其中新增两项是授权owner，既有DB/认证patch未改。
