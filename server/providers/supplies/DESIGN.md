# 领用后端契约（03-tier1-simple §5、02 全局规则11）

`oa.supplies` / `supplyServiceToken` / `supplyRequests`。HTTP prefix `/supplyRequests`，兼容审批中心的 options/list/detail/transitions/actions/candidates。申请人本人创建；items 每行 code、quantity（正整数）、可选 printInfo；purpose 必填。officeItem 字典 extra.requiresPrintInfo=true 时必须附完整姓名、职位、电话、邮箱、地址，可附部门。

直属经理审批后进入 issuing。行政 admin 职务角色抢单池，先 claim，支持 release/transfer/assign；领取人 complete 表示已实际全量发放，unable 必填原因进入 exception。处理任务只按工作时间提醒，没有自动升级，不允许执行期间撤回。经理、行政为空时挂起，审批管理员可指定；行政执行可为其本人经上级批准的单据发放，不属于自批。

经理通过保存 approvedFingerprint（items+purpose 规范 hash）、approvedAt，字典标签和打印要求保存 itemSnapshot，规则快照固定审批时钟。exception 重提未变 items+purpose 直接返回 issuing 并保持批准时间/字典快照；业务字段任何改变回到 manager，不把已发生批准事实清除。行政无法发放不创建任何台账。

正常完成为 issued：每行原数量与实际发放量相等。审批管理员 forceComplete 必须理由，独立 forcedClosed 终态，台账 actualQuantity=null，outcome=forcedClosed，明确未知实际发放，不能呈现成已送达。两个完成出口与每行台账、audit 同事务，申请人锁与 applicationId+line 唯一防重复记录；审批插件表只走公开 ApprovalService。管理员 terminate 也必填理由并审计。没有库存表，不虚构库存扣减。

`GET /supplyRequests/ledger` 需要独立 oa.supplies ledger grant，offset/limit/applicationId，返回 `{data:{items,nextOffset},meta:{total,page,pageSize}}`，支持page/pageSize及offset/limit，sortBy（createdAt/number/itemCode/requestedQuantity/actualQuantity）与direction在DB全量排序后分页；entryId用于独立台账drawer读取一行。正常行政 admin role 默认可读全部台账；普通申请人没有台账全局 grant。台账保存发放时的单号、物品字典label及recipientName/issuerName快照，每个台账 user id 伴 recipient/issuer 的冻结id/name。列表沿用应用 read policy；详细打印信息只在单据授权边界内读取。

前端已实现：完整表单/详情/动作，包括上级审批、抢单、释放、实际发放确认、缺货异常原因、未变/变更重提区别及 forcedClosed 表示（不得显示“已发放”），行政台账独立页。不得添加全局sidebar供应申请独立入口，使用审批中心和home发起。物品选择从 officeItem 读取，长字典标签换行；数量正整数，名片字段按冻结打印要求显示。write未知结果同requestId/payload重试。
