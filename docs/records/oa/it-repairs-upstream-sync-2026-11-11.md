# IT 报修与新版上游同步

2026-11-11 Asia/Singapore。将 main `5fa25e1` 合入原报修分支，保留双方历史。报修状态流转、计时、权限规则、每类5单、池max10及事务事实复用不变；新增兼容处理涉及依赖补丁和非审批流程边界，需对该增量检查。未合并 main，未生产发布。

## 冲突及处理依据

- 12个 `client/locales/<locale>.ts` 和10个 `server/locales/<locale>.ts`：同时保留报修文案及上游文件、Agents、审批建议文案。服务器英文、简中文件自动合并，另外10种语言手动合并。
- `client/routes.ts`、`server/routes/index.ts`、`server/providers/index.ts`：保留两套模块导入和已有注册，不把报修接成审批流程。
- `server/config/index.ts`：同时保留 itRepairs 与上游 mailers/mail/concurrency/knowledge/approvalSuggestions。
- `pnpm-workspace.yaml`、`pnpm-lock.yaml`：以上游依赖版本为基准，重新通过 pnpm 生成补丁映射与依赖图，不降级内核。保留上游 Tiptap 固定版本。

共28个文本冲突。报修 provider、路由、页面、迁移与同步前 `883be31` 逐字一致。上游主注册、路由和语言资源相对 main 的差异仅为已存在的报修注册与文案。

## 必要兼容增量

- Authentication beta.19 仍无共享账号锁，移植原 FOR SHARE 可选模式；默认管理操作仍独占，SQLite不变。
- DB beta.25 仍无 aggregateScoped，原受权聚合及非空排序补丁原样适用；未增加索引或改迁移。
- Authorization beta.16 / 插件 beta.36 原生支持按key批量读取，由原生 resolver 恢复顺序并拒绝缺失key。移除旧底层补丁，只保留 owner 每200个参数分批及同连接读取；测试改为返回无序的已找到集合，验证等价性。
- 新审批建议服务消费所有流程 owner 时补 `approvals === null` 拒绝分支；26个审批流程继续原生建议，独立报修不能读取或生成审批建议。增加拒绝回归。
- CLI beta.32 的独立部署配置未携带源工作区的补丁。新增可审核构建补丁，只复制与部署确切版本匹配的运行时补丁到 dist 并生成本地相对映射；独立部署测试核对内容一致。Approval/Agents仍用原生发行API，无对应补丁。

请求成本：锁模式、业务查询、写入和事务数量不变；49个权限集仍一条参数化查询，大于200个仍分批。审批建议拒绝非审批 owner 不创建任务、生成或持久状态。CLI补丁只作用于构建，不增加业务请求成本。

## 验证

本轮实际结果在交接附件记录。首次安装下载超时，单路下载重试成功；包 Skills 已同步。首次PG回归因原15432端口无监听而失败，改用本次专用 PostgreSQL 15、16432端口、trust合成身份、临时数据目录，未连接管理或业务数据库。

首轮独立部署夹具因临时目录相邻补丁提取目录被工具识别为workspace而失败；夹具显式声明独立workspace后通过。安装期间一次类型检查遇到正在替换的依赖链接而失败，依赖稳定后复核。全部历史失败保留，不计为通过。报表回归又发现真实执行日已晚于合成业务日，时区规则尚未生效的测试缺陷；将规则设置移入受控时钟、置于业务事件之前，不改产品时区逻辑。

本次不重跑完整10万/50并发容量、42项角色浏览器和完整回退演练；原证据、93ms最小容量余量、失败历史及T01/T02勘误继续保留，不将旧样本称作本次测量。安全转交默认关闭，公司制度及生产仍另授权。CI与匹配预览在本次推送后由现有工作流生成，交接时按实际状态报告。

## 详情

- [PR #3](https://github.com/mytharcher/nb3-oa/pull/3)
- [原正式容量证据](it-repairs-transaction-facts-2026-10-30.md)
- [原同步记录](it-repairs-upstream-sync-2026-11-02.md)
- [当前补丁说明](../../../patches/README.md)
