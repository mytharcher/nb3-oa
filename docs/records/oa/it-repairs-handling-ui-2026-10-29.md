# IT 报修第二阶段界面独立验收

| 项目     | 说明                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 日期     | 2026-10-29，Asia/Singapore                                                                             |
| 评审对象 | 未提交的第二阶段增量；`client/pages/it-repairs/handling.tsx`、详情接入、两语言文案与浏览器证据         |
| 依据     | 本文件下方归档设计 D1–D7；应用 UI guidelines 完整检查表；AGENTS 右侧抽屉约定                           |
| 方法     | 独立子代理只读审查；真实 Chromium、隔离 PostgreSQL、原生测试身份 A/E1/L；不访问管理 Studio，不修改仓库 |
| 独立重跑 | 正式 fixture 1 项通过，69.44 秒；额外 TMP 浏览器探针 1 项通过，52.49 秒                                |

结论：核心双语闭环通过，初次界面验收有 G/D 项，需主代理修复并自检。无需第二轮评审；以下记录首次发现，主代理把实际修复和复查结果填写在末表。部分改动在独立测试期间已由主代理修复，其最新结果不冒充本轮独立覆盖。

## 发现

| ID  | 类型 | 位置                                      | 问题                                                                                                                       | 依据                                            | 建议                                                                            |
| --- | ---- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| U1  | G    | handling.tsx 的事件 `Object.entries` 渲染 | 等待方 `employee`、结果 `restored`、ISO 时间原样显示，且原因/方案/完成说明无字段名；中文页面也出现这些英文代码。截图可见。 | C1、T1.6、D5                                    | 明确列出允许显示的业务字段，添加本地化标签/枚举/日期格式；隐藏技术提醒键与 ID。 |
| U2  | G    | handling.tsx 导航 guard                   | 原表达式在 busy 时仍进入 `window.confirm`，确认后允许离开正在提交的抽屉。                                                  | T3.5                                            | busy 首先直接拒绝导航；草稿父 guard 不参与已提交工单操作。                      |
| U3  | G    | handling.tsx 动作表单                     | 必填字段未标记 `*`；首次校验失败没有把焦点移至第一个错误字段，部分 Select 未传 invalid。                                   | T3.2、T3.3、A6                                  | 按动作列出必填项；错误后聚焦相应文本框/选择器并标记 invalid。                   |
| U4  | G    | handling.tsx 只读详情                     | 其他角色和调度可在后台改变工单，详情没有手动 Refresh，也未接入实时刷新。409 恢复入口只在写失败后出现。                     | R4                                              | 详情提供一个刷新入口，统一刷新记录、资格、事件和附件，刷新时保留旧数据。        |
| U5  | G    | handling.tsx AlertDialogTitle             | 取消/重复/管理结案确认标题只有动作名；编号仅在描述中。                                                                     | I2、C7                                          | 标题加入当前工单编号/名称，说明具体后果，确认按钮使用 destructive 样式。        |
| U6  | D    | handling.tsx 附件区                       | 工程师材料统一交给一个附件列表，未标明哪些是 IT 内部材料。                                                                 | D5；设计正文“Internal materials marked IT only” | 已授权 IT 视图分开显示公开/内部材料；员工端只保留公开列表。                     |
| U7  | D    | fixture 截图产物                          | 原正式 fixture 只有员工待验收和关闭截图，没有负责人动作、工程师内部材料视图；无法以截图核对 D7 的完整要求。                | D7                                              | 自检补英文负责人分诊表单及工程师内部记录/材料截图，保留员工对照。               |
| U8  | S    | 来源查找                                  | 按按钮查找而非 debounce，且全来源搜索的前 50 条在客户端筛为采购/费用；未展示更多结果入口或截断提示。                       | I5、T1.10                                       | 限定来源或提供分页/结果上限说明，避免合法记录被其他来源占满首批结果。           |

## 实际浏览器验证

正式命令：`OA_IT_REPAIR_BROWSER=1 POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=15432 POSTGRES_USER=postgres POSTGRES_DATABASE=nocobase_collection_builder pnpm exec vitest run tests/fixtures/it-repairs/handling-browser.test.ts`。

A/L/E1 使用各自原生身份；在 375×812 的英语和中文页面完成：负责人分诊 → 工程师认领和开始 → 内部记录 → 等待员工/恢复 → 提交解决 → 员工退回 → 二次解决 → 本人评分关闭。员工页面没有工程师内部文字；每次成功后 URL 退出 action、状态更新；断言文档宽度不超过视口；没有 pageerror。合成工单和专用存储随 harness 清理。

额外独立探针保存在 TMP `handling-probe.test.ts`（配置 `probe.config.mts`，日志 `independent-probe.log`），不修改仓库。真实工程师处理表单使用逐字输入、Home 插入及 Chromium CDP 中文 IME。拦截写请求返回 409，断言文字保留、提交禁用，点击 Reload latest 后原输入保留且可重新提交；500 同样保留输入/表单。取消时拒绝放弃保留 URL/文字，接受后退出动作。截图 `independent-retained-input.png`。

临时 config 最初 `.ts` 被 ESM-only 配置加载拒绝；改 `.mts` 后执行成功。此工具配置失败不是业务失败。运行时还看到重复 `retryUpload` locale key 的构建警告，已告知主代理修正；现有 jobs 内存配置/弃用警告不作为本次业务界面新缺陷。

截图目录：`storage/ui-workflow/it-repairs-handling-isolated-browser/screenshots/`。本轮查看英语待验收和独立保留输入图；正式重跑重新生成中英 acceptance/closed 四张图。

## 完整检查表

| 检查项（按原顺序）                    | 结果         | 证据/限制                                                                                  |
| ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| 模板和叠层 T1–T5、I1                  | 通过         | 复用 RouteFormPage/RouteDrawer；按项目约定右抽屉，固定 FormActions。                       |
| 页面结构 L1/L2/L5/L6/L7               | 通过         | 外层原列表及抽屉标题；单个主提交；关闭/操作固定底部。                                      |
| 导航图标和计数 L8                     | 通过         | 沿用既有 IT 报修/服务组路由，无新增侧栏计数。                                              |
| 加载/空/无结果/失败/提交/无权限 S1–S6 | 部分验证     | 复用 Loading/Failure；500、409 实测；401/404 和来源无结果未单独注入。                      |
| 列表 T1.1–T1.12                       | 非本增量重点 | 原表组件延续，十状态选项更新；新来源选择的截断建议 U8。                                    |
| 详情 T2.1–T2.4                        | 需修复 U1    | 编号标题和直接 URL 可用；事件值缺标签。                                                    |
| 表单 T3.1–T3.8                        | 需修复 U2/U3 | 失败保留输入、冲突刷新通过；必填/聚焦/busy guard 待自检。                                  |
| 设置 T4.1–T4.3                        | 不适用       | 本子任务审查处理界面；原服务组/日历表单没有结构改动。                                      |
| 仪表盘 T5.1–T5.4                      | 不适用       | 汇总报表留后续。                                                                           |
| 数据新鲜度 R1–R4                      | 需修复 U4    | 请求含版本，409 保留/刷新实测；缺详情常驻刷新。                                            |
| 破坏操作 I2                           | 需修复 U5    | 已用 AlertDialog，标题还需编号。                                                           |
| 反馈/加载 I3/I4                       | 通过         | 原生 toast/Failure/Loading，500 不清空输入，无 SQL/堆栈显示。                              |
| URL 和来源视图 I6/I9                  | 部分验证     | repairAction 查询保留父路径；dirty Cancel 实测；任务中心/带过滤列表返回未独立复跑。        |
| 叠层宽度和滚动 I1                     | 通过         | 375px 正常，固定底部按钮可见；详情内部滚动。                                               |
| 日历/抽屉/Select I10–I13              | 通过         | 原生 DateTimePicker 的 Calendar Popover；英文和中文选定下一日；OptionSelect 支持扩宽换行。 |
| 详情就地编辑 T2.5                     | 不适用       | 状态动作有审计/版本约束，详情只读，输入经动作表单。                                        |
| 长文本 I14                            | 通过         | 说明和事件文本用 LongText。                                                                |
| 权限/键盘 I7/I8                       | 部分验证     | 角色允许动作由接口过滤；员工不见内部字；文字/IME 可用；全程纯键盘未穷举。                  |
| tokens/字体/尺寸 F1–F5/F7             | 通过         | 语义 Badge/Button/Alert 与间距 token，无新定制颜色。                                       |
| 多语言/文案 C1–C7                     | 需修复 U1/U5 | 核心动作中英均成功；事件枚举/date 和标题问题如上。                                         |
| 无障碍 A1–A3/A5/A6                    | 需修复 U3    | 文本状态、原生焦点样式；校验聚焦缺失。                                                     |
| 375px/暗色/IME A4/F6/A7               | 部分验证     | 375px 双语和中文 IME 通过；暗色本轮未切换。                                                |

## D1–D7

| 标准 | 结果                      | 证据/限制                                                                                                           |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| D1   | 通过核心覆盖              | 原生 A/E1/L；员工内部文字断言；细粒度 API 越权由主代理 PG 回归覆盖。                                                |
| D2   | 通过                      | 两语言真实角色完成主闭环和退回、评分，正式 fixture 69.44 秒。初始草稿/提交用原生 API 准备，阶段一 UI 证据另有记录。 |
| D3   | 通过保留/冲突；部分未验证 | TMP 实测 409、500、刷新保留和 dirty Cancel；resolve/return 缺字段的浏览器聚焦待 U3 自检。                           |
| D4   | 部分验证                  | wait/resume 实测；暂停待批/批准、取消待批/审核的 UI 操作未在独立 fixture 中执行。                                   |
| D5   | 需修复 U1/U6              | 退回轮次保留；内部文字员工不可见；IT 文件可见性标记和事件可读性待修复。                                             |
| D6   | 部分未验证                | 同抽屉及原路由接入；本轮没重跑阶段一 intake、文件预览、任务中心来源和日历配置的全部交互。                           |
| D7   | 需补 U7                   | 中英员工图和375px断言已有；负责人和工程师截图待补。                                                                 |

## 主代理修复与自检（主代理实际复查）

| ID  | 修复                                              | 自检                                           | 结果                 |
| --- | ------------------------------------------------- | ---------------------------------------------- | -------------------- |
| U1  | 允许列表字段、本地化标签/枚举/日期、隐藏技术ID/键 | 中英375px最终闭环，截图检查                    | 通过                 |
| U2  | busy先拒绝导航；已提交详情不触发草稿guard         | 主代理代码核对；独立探针脏表单确认             | 通过；busy由代码守卫 |
| U3  | 按动作标必填及invalid，首次错误聚焦               | 最终浏览器故意缺完成说明，输入保留并聚焦后重试 | 通过                 |
| U4  | 详情Refresh同时更新记录/资格/事件/附件            | 最终浏览器刷新及独立409后Reload保留输入        | 通过                 |
| U5  | 危险动作标题带工单编号，destructive确认           | 最终双语取消申请/负责人拒绝审核                | 通过                 |
| U6  | IT附件公开/内部分区，员工仅公开                   | 最终E1真实内部上传；A无内部文字/文件；截图     | 通过                 |
| U7  | 补L分诊、E1内部材料及A验收/关闭截图               | 最终双语375px实际截图                          | 通过                 |

清理截图：`rm -r storage/ui-workflow/it-repairs-handling-isolated-browser`。没有创建登录 cookie 文件；临时探针属于本轮 TMP，按 runner 生命周期清理。

## 后续自检与设计归档

最终主代理 fixture 119.96 秒通过：额外覆盖要求补充、任务中心真实入口、暂停待批/批准、取消待批/拒绝、内部真实文件和缺字段聚焦。来源查找增加继续加载，历史每页100条；不将这些修正标作再次独立验收。

# IT repair processing UI

Status: Confirmed for implementation under the accepted v2 and explicit instruction to complete this step without another approval round.
Existing right drawer remains the owning detail surface. T2 detail + T1 queue; reuse Drawer, Button, Label, Input, Textarea, Select, Badge, LongText, Failure and existing API/resource hooks. No new primitives.
Wireframe: fixed number/title header; scrollable issue/assignee/deadlines, public timeline, authorized IT internal timeline, available business actions; fixed Close footer. Input-bearing actions open a right-side action drawer with fixed submit/cancel footer and scrollable body. Narrow screens stack fields; no table or control horizontal overflow.
Data: GET /itRepairs/:id remains current record. GET /itRepairs/:id/handling returns authorized events and allowed action names, group candidates and clock totals. POST /itRepairs/:id/actions accepts requestKey, expectedVersion, action, data. Version conflict retains input, offers reload; errors generic localized with field focus. Keys retained for identical retry. Server rechecks current qualification and all scope/action grants.
Actions: requester supplement/comment/cancel/accept/return/rate; leader triage/requestSupplement/assign/priority/approvePause/reviewCancel/duplicate/manageClose; current engineer claim/release/start/comment/internal/wait/resume/resolve. Only allowed actions render. Each action has named labeled fields; triage includes priority/category/group and public advice, assignment uses current qualified candidates. Resolve has cause/solution/completion plus result type. Waiting requires party/reason/follow-up, optional pause request, explicit approval. Internal materials marked IT only. Safe transfer remains unavailable pending V30.
D1 Employee, engineer and leader see only currently allowed controls and safe event contents.
D2 Employee A -> leader L -> engineer E1 -> A completes submission, handling, return, second resolution and rated acceptance in both languages at 375px.
D3 Required resolve/return validation preserves text and permits retry; concurrency conflict refreshes without losing input.
D4 Waiting/pause and cancel approval visibly distinguish requested from approved and preserve main state.
D5 Timeline preserves append-only rounds, with internal records/files absent for employee.
D6 Existing intake forms, files, task center origin and current calendar configuration still work.
D7 English screenshots capture changed handling, acceptance, internal separation and leader actions; no horizontal overflow.
Review responses: fixed footer groups action selector and Open; selected action replaces the detail contents within the existing URL-addressable right drawer, using repairAction query parameter. It retains all existing origin/filter params and Back restores detail. Project-wide AGENTS drawer convention overrides generic short-detail container selection; issue sections collapse and events show a compact chronological list. Opening/reloading action refetches record and current eligibility; conflicts retain inputs but require Reload latest before resubmission. Destructive actions require a named AlertDialog confirmation with number/consequences. Loading, denied, inline field errors, busy close guard, success toast and immediate parent refresh reuse existing surfaces. Long labels wrap, no secret diagnostic copy. Pending pause/cancel use text badges.
