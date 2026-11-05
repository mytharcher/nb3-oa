# 原生审批建议接入契约

## 2026-11-05 内置审批建议替换契约（当前）

日期：2026-11-05，Asia/Singapore。用户明确要求升级上游内核和审批插件、替换旧实现，并将全部流程接通 AI 建议。本节替代前述合同法务阶段一期范围、手动首次生成及追问运行时约定；历史记录与迁移原文保留，不表示当前功能。

- 应用模板由 `1.0.0-beta.60` 合并至 `1.0.0-beta.88`，审批使用正式发布 `1.0.0-beta.11`。不再通过本地补丁提供 assistant 导出。
- 插件默认 `approvalSuggestionsToken` 负责生成、幂等、取消、授权版本和尝试历史；默认 provider 负责 Queue consumer、独立存储、任务激活及未发布意图恢复。OA 不再注册第二个生成 worker、process/sweep 或合同单独入队。
- 覆盖 `processOwners` 的全部 26 个审批业务及其可操作决策任务，不再仅限 `contracts.legal-review/legalFinance`。对应流程包括请假、销假、加班、考勤更正、外出、通用申请、领用、预算调整、费用计划、培训、出差、取消出差、采购、借款、报销、付款、转正、用车、合同、资产、供应商准入、招聘、调动、离职、证明和用印。业务详情统一挂载标准建议面板，原审批动作和业务生命周期继续由各 owner 负责。
- `GET approvalAi/reviews?lifecycle&recordId` 只读；Generate/Cancel mutation 要求业务定位、稳定请求键/当前 generation 身份。身份由服务端 session 推导；既有业务资源、记录策略、全部冻结字段可读性以及 SDK 当前 offered actions 分别校验。代理读者与任务 assignee 分开传递，服务端操作后再次校验权限。任务索引中的定位信息不授权详情。
- 插件按任务激活时的已配置默认模型自动生成；缺模型或服务前提的激活被跳过，配置后不回扫旧任务，须手动 Generate。AI 故障不阻止人工审批。默认模型由 Agents 模型服务管理；旧 `oaApprovalAiSettings` 的 enabled/model 配置不再控制执行。原 configure 权限保留，以兼容已执行种子和存量角色，不恢复旧写端点。
- 自动建议当前只读取冻结字段，不能声明已读取附件或制度。手动生成传入真实 principal，由 OA 知识公共服务按业务主题加载授权 markdown 制度，限制篇数和文本长度，标记实际 UTF-16 range/truncated；发布和读取时再验权限、版本及文本。无法读取材料时显示缺失/未覆盖，部分制度不能支持确定性合规判断。
- 前端复用 OSS `@nocobase/approval-review` 源码组件。最新尝试状态与选中成功报告独立；生成失败可保留仍授权旧报告。状态读取失败必须清空报告和 selectable versions、禁止写操作并提供刷新。打开、刷新、重连、切换历史版本不得生成。请求标识使用 `createRequestKey`。
- 失效事件只含任务定位，不含报告内容；主题逐次复用业务详情权限。客户端在 acknowledged ready、重连和变化后重新读取。通知不代替权威读取。
- beta.11 已移除旧会话 helper。旧追问 drawer、API、草稿插入和 shell Provider 退出运行；历史迁移、旧表、结果引用和 Agents 会话不删除，也不直接转成未经新版证据验证的报告版本。

实施、验证、现存数据库 checksum 差异及未验证范围见[升级与原生建议接入记录](../../records/oa/2026-11-05-core-native-approval-suggestions.md)。
