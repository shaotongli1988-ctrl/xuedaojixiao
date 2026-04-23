# xuedao 全域 SSOT Inventory

这份文档是仓库级 SSOT 总表。

它只负责：

1. 把 9 类 SSOT 的 primary source、owner、validator、consumer 放到同一张表里
2. 说明当前是 `implemented / partial / planned / missing / excluded / out_of_scope` 中的哪一种成熟度
3. 记录当前已完成的批次治理范围和剩余缺口

它不负责：

1. 替代各模块内部 domain registry
2. 替代 OpenAPI、状态机、权限、错误目录等子域的具体事实源文件
3. 直接决定业务字段、接口或状态的产品语义

## 状态语义

### 模块状态

1. `implemented`
   - 模块已进入仓库级治理视野，并且已有稳定 registry 或 machine source 主链
   - 允许仍有 `partial` surface，但缺口必须显式登记
2. `partial`
   - 已有局部事实源或消费者链，但还不能当成闭环
3. `planned`
   - 已进入治理范围，但主源或守卫尚未稳定
4. `excluded`
   - 明确不纳入当前业务域治理范围，但必须显式标注，防止盲区

### 表面状态

1. `implemented`
   - 当前表面已有唯一主源，并被消费者链真正使用
2. `partial`
   - 已有主源雏形，但仍存在影子源、双向维护或消费链不闭合
3. `missing`
   - 当前没有可信主源
4. `out_of_scope`
   - 该模块当前不以这个表面为治理重点

## 9 类 SSOT 映射

| 类别 | 当前 primary source | owner | validator | 主要消费者 | 当前判断 |
| --- | --- | --- | --- | --- | --- |
| 领域模型 | `cool-admin-midway/src/domain-registry/catalog.ts` | repo-governance | `node ./scripts/check-global-domain-ssot.mjs` | backend domain registry、交付文档 | `partial` |
| 错误语义 | `cool-admin-midway/src/modules/base/domain/errors/catalog.ts` + `cool-admin-midway/src/modules/performance/domain/errors/catalog.ts` | backend-owner | `node ./scripts/check-shared-error-semantics.mjs` | backend middleware/service、performance service/frontend service | `implemented` |
| 状态机 | `cool-admin-midway/src/modules/performance/domain/states/` | performance-owner | `node ./scripts/check-state-machine-alignment.mjs --phase batch --force` | performance service/controller/views/docs | `partial` |
| 权限 / RBAC | `cool-admin-midway/src/modules/base/domain/permissions/source.{json,mjs}` | base-owner | `node ./scripts/check-base-permission-domain-ssot.mjs` | generated permission artifacts、menu/rbac consumers | `partial` |
| 字典 / 枚举 | `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts` + `cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts` | performance-owner / dict-owner | `node ./scripts/check-global-domain-ssot.mjs` | performance service/types、dict store/mobile store | `partial` |
| API / OpenAPI / 前端类型 | `contracts/openapi/xuedao.openapi.json` + `cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}` | repo-governance | `node ./scripts/sync-performance-openapi-ssot.mjs --write` + `node ./scripts/openapi-contract-sync.mjs --write` + `node ./scripts/check-performance-contract-closure.mjs` | backend contract docs、web/mobile generated consumers、repo consistency guards | `partial` |
| 脚本 / 守卫 / CI | `contracts/ssot/xuedao-ssot-manifest.yaml` | repo-governance | `node ./scripts/check-xuedao-ssot-manifest.mjs` | pre-push、CI、reports/delivery | `implemented` |
| 配置 / 环境变量 | `contracts/ssot/environment-config.catalog.json` | repo-governance | `node ./scripts/check-environment-config-ssot.mjs` | runtime config roots、migration/smoke/guard scripts | `planned` |
| 数据库 schema / migration | `contracts/ssot/database-schema.catalog.json` | repo-governance | `node ./scripts/check-database-schema-ssot.mjs` | migration runner、entities aggregator、local schema bootstrap | `planned` |

## 已完成批次

第一批只做以下几件事：

1. 把配置 / 环境变量提升为 repo 级一等 SSOT
2. 把数据库 schema / migration 提升为 repo 级 owner manifest
3. 把菜单 / 路由 / view topology 单独从散落文件提升为受登记事实源
4. 把上述新守卫先接入 conformance 报告链，不直接升级为 pre-push 强阻断

第二批补了以下几件事：

1. 为 `performance` API 契约链新增 backend registry source：`cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}`。
2. 把 `sync-performance-openapi-ssot.mjs` 改成先读取 registry source，再决定 producer 覆盖范围，而不是继续靠 service 目录排除名单反推。
3. 把 `openapi-contract-sync.mjs` 改成先读取 registry source 中登记的 web/uni target，再决定 generated consumers 覆盖范围。
4. 新增 `scripts/check-performance-contract-closure.mjs`，校验 producer 覆盖、generated target、shared support adapter 与 uni wrapper 引用链。

第三批补了以下几件事：

1. 把 `cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}` 从“API 主源附属说明”提升为 `xuedao-ssot-manifest.yaml` 中显式 machine source：`sourceOfTruth.performanceContractSource`。
2. 把 bootstrap、manifest guard、conformance guard 与 repo guard regression 一并更新，确保该主源具备独立的登记、文档和回归约束。

第四批补了以下几件事：

1. 把 `assessment`、`certificate`、`contract`、`goal`、`hiring`、`indicator`、`interview`、`jobStandard`、`meeting`、`recruitPlan`、`resumePool`、`talentAsset` 从 `publishOnlyModules` 提升到 `serviceModules`，让更多 performance producer 进入 registry-driven 主链。
2. 新增 `cool-admin-vue/src/modules/performance/shared/contract-enums.ts`，把高优先级 contract adapter 的运行时枚举收敛到共享入口，并升级 `check-performance-domain-model-ssot.mjs` 阻断这些模块回退到局部常量主源。
3. 把 `cool-admin-vue/.env` 从工作区拆分审计中的通用前端批次拆出，单独落到 `local-runtime-env`，避免把本地运行态真值误当作仓库级 SSOT 交付内容。

第五批补了以下几件事：

1. 把 `capabilityItem / capabilityModel / capabilityPortrait` 从 `publishOnlyModules` 提升到 `serviceModules`，并让 `sync-performance-openapi-ssot.mjs` 能稳定表达“多 moduleRoot 复用单 `capability.ts` service wrapper”的 producer 主链。
2. 把剩余的 performance `*-contract.ts` 运行时枚举全部收敛到 `cool-admin-vue/src/modules/performance/shared/contract-enums.ts`。
3. 把 `check-performance-domain-model-ssot.mjs` 从“只检查高优先级 adapter”升级为覆盖所有 performance `*-contract.ts`，阻断局部 runtime enum projection 回流。

## 当前已知缺口

1. 菜单 / RBAC 仍然是 `menu.json + permission bits + generated consumers` 的分层事实源
2. 状态机只覆盖了 `assessment / approval-flow`
3. 字典 registry 与运行时 provider registry 仍未完全同源
4. 数据库 schema 目前只冻结到了“ownership + migration coverage”，尚未做到“表/字段/索引级 parity 校验”
5. 环境变量目前只冻结到了“变量名 + 命名空间 + curated scan roots”，尚未做到“全仓无漏扫”
