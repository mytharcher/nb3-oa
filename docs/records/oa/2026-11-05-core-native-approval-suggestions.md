# 内核升级及全流程原生审批建议

日期：2026-11-05，时区 Asia/Singapore。

## 范围与来源

用户明确要求升级上游内核和审批插件，替换旧 AI 建议实现、覆盖全部审批流程并使用 OSS UI Library；随后明确允许在已有未提交改动的工作区直接实施，不要求清理或提交。实施阶段未提交、暂存或重置原工作；后续按用户明确授权，将相关代码保存在 feat 分支并准备 PR。升级前 HEAD 为 `7f3f2872d493c6ba88bd39e5497ad526c66f46d2`；开始时有83个已修改文件及未跟踪实现。临时源码快照仅用于本轮恢复，不包含真实配置或凭据。

模板目标按 beta 渠道解析一次为 `@nocobase/app-template-default@1.0.0-beta.88`，基线 beta.60；逐文件审阅发布 tarball 的差异。运行时使用 app-server 5.0.0-beta.1、app-client 4.0.0-beta.8、CLI beta.32、Agents 2.0.0-beta.5、Approval 1.0.0-beta.11、Task Center 0.1.0-beta.5。正式包已安装，不依赖邻仓源码或本地运行时补丁。

## 实现与需求差异

- 原设计仅合同 `legalFinance` 阶段。现在26业务统一使用插件默认 `approvalSuggestionsToken`，各业务详情挂载同一标准受控面板。完整业务清单见[当前设计](../../designs/approval-center/native-suggestions-design.md)。
- 新插件不再提供旧 `dispatch/process/sweep` 或会话 helper。OA 旧生成 JobExecutor、追问接口/界面和草稿插入退出运行；历史迁移、旧结果/绑定/Agents 会话保留，不伪装成新版报告。
- 默认自动生成只有冻结字段。手动生成才使用真实 principal 加载OA公共知识服务的授权markdown材料，并重验版本、文本和访问；模型未配置时跳过激活，后续配置不回填旧任务。未将全部流程接通解释为无配置也会调用模型。
- 使用 OSS 构建 Registry 的 approval-review/long-text 文件，按声明 target 合并；公网 Registry 当次返回HTML，shadcn dry-run无法解析，未声称公网安装成功。运行时只依赖应用本地文件。报告版本、生成尝试、取消、重试及部分材料覆盖来自标准组件；beta.11 不再提供 nextStep 文案。
- 主程序注册 concurrency/mail/foundation、新配置聚合和submission receipt；保留OA业务、品牌、禁用自注册策略、字段与记录权限、泛化拒绝页和抽屉handoff。保留已有管理页，不复制另一套模板settings。保留标注插件与Refine测试夹具依赖；没有删除模板中的NocoBase能力。Vitest保留现有logic/components测试发现规则。
- 审批删除跨记录tasksOf后，候选读取迁到公开个人索引；离职交接由业务记录穷尽发现，再通过公开单记录任务与业务动作执行，保留durable request、审计和剩余完整性校验。大数据量扫描性能仍需测量。

## 业务库只读预览及发布限制

目标CLI执行 `pnpm nocobase db apply --dry-run --json` 与 `pnpm nocobase db repair --dry-run --json` 均返回success-noop。共18个待执行migration、1个seed，涉及mail、Agents、Foundation、Approval默认建议和mutation receipts。本轮没有对业务库执行apply、repair或启动升级版应用。

checksum预览发现以下3个应用迁移的已记录值与现有工作区源码不同：

- `202610310001_approval_review_conversations`
- `202610310003_approval_review_history`
- `202611020002_approval_assistant_public_storage`

这三个文件在本轮开始时即为未跟踪现存文件，本轮未修改它们。尚无已审核来源能解释全部差异，因此未写入repair、未放宽checksum策略。启动 retained 数据前须对照原发布源/执行历史，准备与旧包匹配的可恢复PostgreSQL及文件备份，并核准迁移。源码回退不能自动恢复schema，发布仍未完成。

## 验证进度

验证结果在本轮检查收束后补充。所有数据库自动化使用公共测试provisioner的隔离PostgreSQL schema，不切换SQLite，不读取真实个人业务数据。

### 已完成检查

| 检查 | 实际结果 |
| --- | --- |
| `pnpm install`、`pnpm dedupe`、包 Skills 同步 | 完成；正式包安装配置不再使用补丁 |
| `pnpm peers check` | 通过；Tiptap 3.30.2 的两个菜单依赖固定为同版本，避免新版传递解析产生core/pm peer冲突 |
| `pnpm check:packages` | 通过 |
| `pnpm typecheck` | 通过；后续生产构建再次完成客户端/服务端编译 |
| 256个受影响TS/TSX/MJS文件的 scoped ESLint | 通过；后续竞态与测试夹具修改另做scoped lint通过 |
| `pnpm build` | 通过，独立生产安装、native retarget、36个服务端包引用检查均完成；有现存大chunk与依赖注释警告，无构建错误 |
| 原生建议 service/materials、离职交接单元及独立部署manifest测试 | 4文件21项通过，真实API来自正式发布包且无需本地patch |
| 原生建议 HTTP 集成 | 隔离PostgreSQL，1项通过；登录、伪造身份拒绝、退休路由关闭及OpenAPI均覆盖 |
| 离职交接 application | 隔离PostgreSQL，5项通过；真实任务/receipt、部分成功重试、停用接收人及并发 |
| 待办候选分页、排序与代理 | 隔离PostgreSQL，1项通过；首次发现Task Center pageSize上限为100而非1000，改正后通过 |
| AI/合同/壳与导航相关组件 | 9文件88项；首轮84通过4失败，修正历史版本locator与旧footer/guest断言，失败2文件重跑17项全通过 |
| 返回、文件预览、认证翻译、路由恢复、流程图布局与overlay | 6文件60项；首轮55通过5失败，补新版密码恢复mock、完整表单必填字段及父路由查询归属断言，失败2文件重跑7项全通过 |
| 文档格式与本地链接 | owning design、guide、progress、record及规则等10文件链接无缺失 |

### 独立审查及浏览器

独立源码验收发现两项：B1为延迟mutation响应可能覆盖新权限重验失败后的清空状态；G1为通用适配器硬编码知识证据跨模块导航。B1改为捕获读取epoch，任何较新状态读取出现后丢弃旧payload并重新授权读取，新增deferred POST与失败GET竞态测试已通过；G1改为仅由owner提供证据导航，无路径时显示文本。审查未作为浏览器证据，也未启动第二轮review。

隔离浏览器夹具 `pnpm exec tsx tests/fixtures/approval-ai/browser.ts` 已通过：合成合同申请人/部门负责人/法务等真实角色、实际审批阶段和公开服务、任务激活后才配置本地合成模型、打开只读不生成、原生Queue生成结构化报告、标准卡片历史/重新生成入口、读取撤权后清空。模拟模型仅在本地HTTP端口，无外部模型调用。1280/375及light/dark截图已生成，并检查无横向溢出。

首次浏览器运行缺Playwright匹配版本，安装headless Chromium后重试；旧HTTP-only测试bridge又因新SessionPreparation要求认证WebSocket而停留准备态，现已用公共Node WebSocket adapter桥接并保持代理Origin/URL的一致校验，没有关闭应用鉴权或Realtime。截图最初未滚动到建议卡，修正scrollIntoView后重新截图检查实际卡片。重载关闭Vite时有预期socket ECONNRESET，不归为生成失败。测试结束清理合成数据、schema与会话，未持久化用户登录cookie。

本轮实际测试及截图仅为合同代表流程和合成模型；26业务的源码接线及通用ACL单元覆盖，不等于26业务所有阶段真实角色逐一浏览器验收。没有真实外部模型/实际制度语义的验收，没有多进程Redis恢复或生产发布。新版默认recipe不解析合同PDF正文，页面保留正常合同附件功能；建议只把实际读取字段/手动markdown知识标为已读，PDF审查不能沿用旧实现的能力结论。

运行时回归及最后Realtime不重载展示断言的结果在收束后补记。

### 收束补记

生成完成不重载展示的浏览器断言通过，直接验证了授权任务主题的失效通知与标准面板重新读取。375px截图已人工查看，实际建议卡位于合同正文后、审批进度前；1280/375明暗截图在 `storage/ui-workflow/approval-ai-isolated-browser/screenshots/native-controls-*.png`（忽略的测试输出，非生产数据）。

大运行时回归首轮32项中23通过、9失败：含旧测试在清空插件后却保留全部OA业务provider、两项自定义root没有隔离数据库配置、匿名未知API预期过时，以及真实全应用安装+provider drain超过原30秒。修正测试夹具，保持应用生产行为和PostgreSQL隔离；超时改为该文件60秒，未知API先以合成管理员登录后确认404。九项重跑七项通过，两项root又发现Vitest module runner不支持import.meta.resolve，已改用Node createRequire.resolve，单独复核。上述历史失败不计为通过。

业务库migration预览在最终生产构建前后完全一致：没有借构建执行迁移或修复校验和。构建完成不代表生产部署。`docs/`沿用项目原有ignore规则，本记录和owning文档已更新到当前工作区，未擅自修改Git忽略策略或暂存文档。

最终两项自定义root用例复核通过（2通过、27未选择）；七项前序失败用例已通过重跑，连同初轮通过的23项，原32项运行时/lifecycle用例均有本轮通过证据。未再重复运行全部长耗时用例。浏览器最后一次含不重载Realtime断言的运行退出0；后续fixture ESLint和Prettier检查通过，`git diff --check`无错误。26个固定业务source与页面lifecycle接线再次逐项核对，无缺失。

最终状态：源码与主注册已完成；定向自动化、独立源码review整改、合同合成角色浏览器与本地模型已验证；所有26业务的真实角色逐阶段验收、真实外部模型、业务库checksum处理/迁移、部署与生产发布均未完成。该区分是交付边界，不把源码覆盖当作已经发布。

## 2026-11-05 20:48（Asia/Singapore）后续：现有业务库迁移完成

用户随后明确允许不解析PDF，要求继续在当前工作区完成迁移。下文覆盖上一阶段“尚未迁移/启动”的状态；原失败与只读检查保留作历史。

### 实际数据库及来源核验

通过目标运行时的公共配置解析确认：当前main连接为既有SQLite，数据库位于`storage/nocobase3_dev`，不是默认PostgreSQL。上一阶段对业务库备份类型的推断不正确。此次沿用现有SQLite，没有切换数据库；此前应用自动化测试仍使用隔离PostgreSQL。

从本应用历史开发工具输出恢复三份原始迁移源文件，它们的SHA-256分别与业务库历史记录逐字匹配；没有修改历史迁移源码。差异审阅如下：

| 迁移 | 已确认的源码变化 | 数据前提与结果 |
| --- | --- | --- |
| `202610310001_approval_review_conversations` | 无效的字段选项`primary: true`改为`nullable:false`及显式`c.primary('id')` | 既有补全迁移已给实际id增加唯一约束，现场检查通过；本次不重放create |
| `202610310003_approval_review_history` | down中的`dropColumn`改为公共`dropField` | up完全一致；本次不执行down |
| `202611020002_approval_assistant_public_storage` | 将`String(row.id)`改成验证字符串的`rowId`，另有停机说明注释调整 | 相关既有表全部id都是text；DDL与复制映射不变，原迁移不会重跑 |

原始源码指纹及审阅结果随私有备份保存。三个变化均能解释，未通过篡改源代码、直接SQL改历史、放宽校验或reset来绕过检查。

### 备份、执行与数据保留

确认没有OA服务或旧worker运行后，使用SQLite在线backup API保存迁移前数据库，并以`PRAGMA integrity_check`验证为ok。备份路径为`storage/backups/20261105-native-suggestions/`，目录权限0700、文件0600；包含数据库、业务文件/任务状态、私有配置和升级前源码快照。不要将该目录加入版本控制或公开传输。回退必须先停新服务，再配套恢复数据库、文件、配置及旧源码/依赖；不可只退源码。本次包含不可逆的默认建议存储创建迁移，不能承诺用down完整回退。

执行目标CLI：

- `pnpm nocobase db repair --force --json`：成功，仅确认已审核三项checksum，未重跑其迁移。用户已明确要求继续完成本次迁移，force用于CLI非交互确认该已审核操作。
- `pnpm nocobase db repair --dry-run --json`：确认差异清零。
- `pnpm nocobase db apply --json`：main批次7执行17项迁移及1项种子成功。预览中的第18项`202610260001_ag_drop_directory_index`因实际agRuns没有待删旧索引，按上游`shouldRun`跳过；后续预览仍列出它是条件迁移行为，不是执行失败，不伪造历史记录使其消失。
- 再次repair预览：无迁移或seed校验和差异。

四张旧AI结果、任务及会话绑定表在迁移前后按id逐行比较完全一致；数据库完整性ok。新默认建议activations/jobs/results及mutation receipts表存在。旧结果未冒充新报告，未扫描或回填旧待办生成建议。

### 实际启动与HTTP核验

`pnpm dev`成功启动，26.9秒ready，保留运行于`http://127.0.0.1:15000/main/`。HTTP只读/无凭据验证均通过：页面200、healthz 200、相同Origin的get-session 200、匿名建议读取401；带正确Origin但空表单的sign-in返回400校验错误而非403 Origin错误。没有替用户输入密码、创建API key或调用真实模型。

启动后再次完整性检查为ok，最终checksum预览仍为零差异。日志保留现有单进程memory后端提示、权限目录未放置提示，以及一个无定义的旧定时调度提示；未恢复旧AI worker。此状态是当前开发应用迁移及启动完成，不是生产发布、真实外部模型或26业务全部真实角色验收。

## PR 集成复核（2026-11-05，Asia/Singapore）

按用户明确授权，将实现保存至 `feat/native-approval-suggestions`，合并远端 main `0569875`。保留主分支的新任务详情/候选读取、bounded 离职交接发现、Studio 预览部署、Foundation 路由与演示账号切换。主分支 Demo Mode beta.3 与新内核/Agents peer 不兼容，升级到 beta.9，peer/package 检查通过。上述离职交接实现替代本文初期的全业务记录扫描描述。

旧 Approval/CLI 编译补丁已无安装引用，从 package.files 移除；本地旧文件保留但不发布。私有备份、配置、运行状态和截图不加入 Git。当前契约与本记录加入 PR，历史本地文档继续保留原有 ignore 规则。

合并后的类型检查通过；标准建议面板 10 项、文件预览 4 项、演示菜单 4 项、离职交接单元 23 项以及 demo 配置 Node 测试通过。首轮完整应用测试与生产构建重叠导致严重资源竞争（请求超过 90 秒），出现招聘和普通模式测试超时；已停止重叠测试，不计为通过，待构建完成后定向串行复核。

### PR 最终复核结果

合并后 `pnpm typecheck` 通过；`pnpm build` 完整通过，独立生产依赖安装及37个服务端包引用校验通过，只有既有chunk/依赖注释警告。

停止重叠进程后，以默认超时串行执行：

```sh
pnpm exec vitest run tests/logic/recruitment/host-app.test.ts tests/logic/seals/lifecycle.test.ts tests/logic/departure-reassignment/application.test.ts tests/logic/approval-center/pending-candidates.test.ts tests/logic/approval-ai tests/logic/demo-mode.test.ts --maxWorkers=1
```

最终退出0，15文件58项全部通过，耗时381.38秒；包含招聘全部重新提交场景、用印生命周期、离职交接8项PostgreSQL集成、待办分页、原生建议与历史AI存储迁移、演示模式切换及普通模式权限。前述资源竞争期间的失败未复现，没有提高默认超时或放宽断言。日志 `/tmp/oa-pr-merge-serial-regression.log` 为本地临时输出，本段保留可复查命令和实际结果。合并后的开发服务页面和 `/main/healthz` 均200。

文件预览合并保留主分支标题/下载/关闭布局及新版onDownload与本地翻译契约，4项组件测试和scoped ESLint通过；文档格式及相对链接有效，`git diff --cached --check`通过。真实外部模型、26业务逐角色/阶段验收及生产发布仍在本次交付边界之外。
