# 车辆后台设计与独立审查响应

基于 WorkLog 05 §19、33；迁移前缀 2026101036。

当前正式完整契约与2026-10-11离职清关补充见[车辆设计](../../../docs/designs/vehicles/vehicles-browser-design.md)；本文件早期边界保留当时范围，不替代正式方案和[最新清关验证](../../../docs/records/vehicles/departure-clearance-2026-10-11.md)。

| 状态                                    | 人员及策略              | 操作                                  | 出口与副作用                                                                                                   |
| --------------------------------------- | ----------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| draft/revision                          | 申请人                  | edit/submit/withdraw                  | submit校验当时有足额车辆，不预占；冻结时段、人数、用途、目的地、司机要求                                       |
| head                                    | 真实部门负责人，单人    | approve/reject/return/comment         | 批准冻结fingerprint；退回重审                                                                                  |
| dispatch                                | admin真实名单，抢单单席 | claim/release/complete/unable/comment | complete在SDK已通过任务授权的同一生命周期事务中写车辆使用事实，锁司机与车辆后检查半开区间；unable进入exception |
| exception                               | 申请人                  | edit/submit/withdraw                  | 内容一致重试dispatch；任何冻结字段变化重审head                                                                 |
| usage                                   | 申请人本人              | registerUsage/comment                 | 同事务写不可变用后收据与隔离油费表，完成；不开放撤回、终止或强制结束                                           |
| completed/rejected/withdrawn/terminated | 结束                    | read                                  | 保留事实和历史                                                                                                 |

Root独立审查修正：来源guard只接受内部SDK通过任务检查之后的hook capability（记录、actor、phase、tx全部相同），普通公共调度调用无法伪造。候选查阅用公开LifecycleStore事务子store构造只读runtime/ApprovalService，在锁真实source后重查allowed complete offer。油费从独立privateInput facade进入，不放SDK input/data/output、immutable lifecycle record或audit。SDK预筛assignment的stage为空，依据公开configured registerUsage action识别申请人用后登记，仍保留head阶段排除申请人。命令在SDK请求去重之前锁源并绑定actor/target/private payload hash，不能换payload复用SDK key。

提醒按Calendar公司时区将end本地钟点推进2工作日，工作日每日bucket稳定eventId；成功记录sent，失败pending可重试，完成停止。无需报销、预算或资产清关的虚假副作用。

当前边界：车辆service、真实SDK graph、公司工作日提醒、车库和申请HTTP、独立油费读取权限及默认权限seed已注册并自动验证。head/dispatch支持公开reassign与同事务审计；usage仍只能申请人实际登记，不能借离职改派抹去事实，未清用车任务将保留并阻断零剩余停号。审批中心composition、浏览器页面及真实角色验收仍待完成；异常重试/改期、所有字段缩窄组合及PostgreSQL实际并发需补专项回归。迁移仅结构，不注入演示车辆/司机。
