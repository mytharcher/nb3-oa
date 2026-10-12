# seals 验证夹具

从docs迁出的候选迁移/权限代码，保留独立验证用途；不作为生产初始化来源，不自动纳入main发现目录。正式模块已主注册，生产以database/main及实际provider/actions为准。

`browser-acceptance.test.ts`是默认跳过的真实浏览器验收：`OA_SEALS_BROWSER=1 pnpm exec vitest run tests/fixtures/seals/browser-acceptance.test.ts`。复用共享isolated browser harness，在14159/15159端口启动真实main App及隔离的临时PG schema/Vite，使用主初始化授权、公开员工/组织/印章服务建立合成场景，UI执行文件上传、创建提交、审批、领取、内用登记和外带借出归还。第六轮还覆盖印章元数据管理、实际DOCX打印、默认员工本人台账/保管员/管理员权限交集、授权撤销和375px固定页脚；打印使用主初始化及前向seed的默认权限，独立manage grant仅用于非行政角色拒绝测试。截图仅作为本地补充；实际结果与未验证边界见[用印实施记录](../../../docs/records/seals/browser-pages-2026-10-11.md)。

第七轮扩展同一fixture：从独立`/seal-ledger/:sealLedgerId` drawer执行真实内用/外带归还登记打印，保留source hash；375px中文dark/default及英文窄屏检查、公司时区日期展示、loaded ordinary ledger撤权清内容及恢复。命令显式同时设置`DB_DIALECT=sqlite NOCOBASE_TEST_DB_DIALECT=sqlite`，确保逻辑测试helpers不继承运行中业务dialect。精确结果见上述模块记录第七轮追加节；不把同一fixture重复运行累计为新测试数量。

2026-10-12配置校正：历史第七轮命令仍保留为当时事实。当前Vitest统一设置postgres并从本地DB配置映射PG测试连接，浏览器harness不再固定SQLite；无需再设置两个sqlite变量。
