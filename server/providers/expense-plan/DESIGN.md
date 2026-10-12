# 费用事前申请

需求03§26及02统一规则。事项类型、用途、整数分预计金额、预算科目、人数、当地日期。本人在职员工发起；HR独立delegate grant代发起，作者与申请人可修订/撤回。HTTP严格输入不接受部门/年度；提交事务重新解析有效主部门，年度取事项日期。草稿无需主部门即可保存，提交必须具备。无出纳或行政执行环节。

| 环节 | 条件/人员 | 策略/缺人 | 动作/时钟 |
| --- | --- | --- | --- |
| head | 主部门负责人（向祖先解析） | single，申请人回避，缺人hold | approve/reject理由/return修订理由/transfer同部门或角色/addSigner前并深度1/comment/cc/read/urge；24/48工作小时 |
| finance | finance职能池 | any，申请人回避，缺人hold | 同上 |
| executive | 整数分严格大于spend.vp元 | single提交时主部门分管副总快照 | 同上 |
| gm | 整数分严格大于spend.gm元 | single提交时唯一有效gm快照 | 同上 |

freeze为全部业务字段加提交解析的departmentId/year，覆盖保守；各段reuse unchanged。重提从head，预占/取号/快照在submit转换，不挂入口，无改动覆盖+同人本人历史意见可沿用，代理不沿用。规则快照首次submit固定；快照默认24/48以外拒绝，绝不偷偷采用默认时钟。纯审批固定抄送为空（03§26无固定职能），允许审批期间追加抄送，afterEnd read。

| 转换 | 事务副作用 |
| --- | --- |
| submit | 用户管理锁、员工/主部门/字典/date校验、规则/审批人快照、EXPENSE编号；旧heldAccount变化时先release再新account.adjustHold；任一失败原子回滚 |
| return/edit | 不释放或调整旧hold，保留实际heldAccount/heldCents直到重提 |
| final approved | set预生成authorizationId，onTransition public expenseAuthorizationService.issue，sourceReference=oa.expensePlan:id，与原预算预占一致；持有原预占，绝不settle |
| reject/withdraw/terminate | previous实际heldAccount release，单据heldCents清零；终止须approval.admin+reason+同事务audit |
| executive/gm同人 | 相邻且snapshot identities相同，当前run/stage/enteredVersion的depth0 member decide completed answer approve、actorId=assigneeId=本人；跳过gm并持久gmMerged+audit。head/exec间有finance，绝不合并 |

SDK公共runViewsFor拆成多次runtime.transaction，不能观察当前未commit完成回答；只读适配器通过公开APPROVAL_COLLECTIONS.tasks/TaskRow在当前transaction读取确证，不改插件源码，不写插件表。guard async预计算当前事务Map，route同步读取，set写合并事实。不能依靠最终回答actor（可能是补签者），不能读取旧run/cycle；代理/转办回答不能替代本人意见。gm缺人始终hold。

权限oa.expensePlan submit/delegate/view；collection expensePlans scope oa.expensePlanReadable。本人/代作者/实际历史与当前任务参与人/抄送与代理，冻结部门负责人及祖先、报告线、财务、快照分管副总、gm、approval.admin可读；HR只有代作者或其他真实参与，不能自动读所有费用。所有HTTP分别session与composite grant、exact collectionpolicy；foreign task/candidate目标拒绝。敏感管理员appoint/reassign与terminate同事务audit。

额度90自然日关闭由共享expense-authorizations模块；source批准事实不变。报销pending/settlement/超额20%说明由共享额度及报销模块负责。详情返回authorization当前事实，不将源heldCents当成后续消费的实时余额。通知kind oa.expensePlan，effects仅发送结果，资金发额度绝不作为异步effect。维护oa-expense-plan job scope，每10分钟sweep/recover/prune，缺人/链顶通知approval.admin。

代码与事务验证独立完成后UI将另交过程设计评审；浏览器角色视觉验收尚待实际运行。
