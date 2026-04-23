# API Contracts

仓库级 API 契约主源固定放在这里。

当前规则：

1. `contracts/openapi/xuedao.openapi.json` 是仓库级 API 契约唯一事实源。
2. 前后端类型、局部 contract evidence、以及调试用 Swagger 页面都必须向这个主源收敛。
3. 当前仓库级发布主源仍是 `contracts/openapi/xuedao.openapi.json`；但 `performance` 域的模块覆盖范围、web/uni consumer target 和 closure guard 已先收口到 `cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}`，并作为 `contracts/ssot/xuedao-ssot-manifest.yaml` 中的独立 machine source `performanceContractSource` 显式登记。后续新增或迁移 `performance` API 时，应先改 backend registry source，再执行同步脚本回写 OpenAPI 与前端 generated consumers。
4. 运行 `node ./scripts/sync-repo-openapi-ssot.mjs --write` 会根据现有非 `performance` admin EPS 快照补齐仓库级 OpenAPI 主源。
5. 运行 `node ./scripts/sync-performance-openapi-ssot.mjs --write` 会根据现有 `performance` controller/service/types 补齐仓库级 OpenAPI 主源。
6. 运行 `node ./scripts/openapi-contract-sync.mjs --write` 会根据主源刷新 `performance` Vue/Uni 生成类型。
7. 运行 `node ./scripts/sync-eps-openapi-ssot.mjs --write` 会根据主源刷新 `cool-admin-vue` 的 `eps.ssot.d.ts`，让非 `performance` 动态 EPS 消费也受主源驱动。
8. 运行 `node ./scripts/check-xuedao-ssot-manifest.mjs` 会校验 `contracts/ssot/xuedao-ssot-manifest.yaml` 中声明的 OpenAPI、权限主源、状态机、业务字典、错误目录、环境变量 catalog、schema / migration catalog、菜单拓扑、脚本入口和报告目录是否真实存在。
9. 运行 `node ./scripts/check-xuedao-ssot-conformance.mjs` 会按仓库级 SSOT 标准检查当前 `xuedao` 是否具备主源、运行时绑定、文档同步、strict-change 级 change/verification record 和交付证据闭环。
10. 运行 `node ./scripts/check-environment-config-ssot.mjs` 会校验受治理 runtime/config/automation roots 中的环境变量名是否全部登记到 `contracts/ssot/environment-config.catalog.json`。
11. 运行 `node ./scripts/check-database-schema-ssot.mjs` 会校验 `contracts/ssot/database-schema.catalog.json` 是否完整覆盖 migration root、entity aggregator 和 schema bootstrap 入口。
12. 运行 `node ./scripts/check-performance-contract-closure.mjs` 会校验 `performance` backend registry source 是否完整闭合 producer 覆盖、web/uni generated target、shared support adapter 和 uni wrapper 引用链。
13. `check-xuedao-ssot-conformance.mjs` 默认会把检查结果写到 `reports/delivery/xuedao-ssot-conformance.latest.{md,json}`，供本地和 CI 留痕复用。

仓库级 SSOT 配套映射见：

- [contracts/ssot/README.md](/Users/shaotongli/Documents/xuedao/contracts/ssot/README.md)
- [contracts/ssot/xuedao-ssot-manifest.yaml](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-manifest.yaml)
- [contracts/ssot/xuedao-ssot-inventory.md](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-inventory.md)

非目标：

- 这里不负责替代业务说明文档、权限矩阵或状态机文档。
- 这里不直接承载运行态 Swagger 导出。
- 这里当前不强制把非 `performance` 前端动态 EPS 消费重构为静态 service wrapper；这部分仍保留现状，但必须受主源回写守卫和 `eps.ssot.d.ts` 类型增强约束。
