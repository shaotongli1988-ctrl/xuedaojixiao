# API Contracts

仓库级 API 契约主源固定放在这里。

当前规则：

1. `contracts/openapi/xuedao.openapi.json` 是仓库级 API 契约唯一事实源。
2. 前后端类型、局部 contract evidence、以及调试用 Swagger 页面都必须向这个主源收敛。
3. 当前 `performance` 域 controller-backed API，以及非 `performance` 的现有 admin EPS 资源，都已统一回写到该主源；后续新增或改动接口时，必须先改这里，再改前后端实现。
4. 运行 `node ./scripts/sync-repo-openapi-ssot.mjs --write` 会根据现有非 `performance` admin EPS 快照补齐仓库级 OpenAPI 主源。
5. 运行 `node ./scripts/sync-performance-openapi-ssot.mjs --write` 会根据现有 `performance` controller/service/types 补齐仓库级 OpenAPI 主源。
6. 运行 `node ./scripts/openapi-contract-sync.mjs --write` 会根据主源刷新 `performance` Vue/Uni 生成类型。
7. 运行 `node ./scripts/sync-eps-openapi-ssot.mjs --write` 会根据主源刷新 `cool-admin-vue` 的 `eps.ssot.d.ts`，让非 `performance` 动态 EPS 消费也受主源驱动。
8. 运行 `node ./scripts/check-xuedao-ssot-manifest.mjs` 会校验 `contracts/ssot/xuedao-ssot-manifest.yaml` 中声明的 OpenAPI、权限主源、状态机、业务字典、错误目录、脚本入口和报告目录是否真实存在。
9. 运行 `node ./scripts/check-xuedao-ssot-conformance.mjs` 会按仓库级 SSOT 标准检查当前 `xuedao` 是否具备主源、运行时绑定、文档同步、strict-change 级 change/verification record 和交付证据闭环。
10. `check-xuedao-ssot-conformance.mjs` 默认会把检查结果写到 `reports/delivery/xuedao-ssot-conformance.latest.{md,json}`，供本地和 CI 留痕复用。

仓库级 SSOT 配套映射见：

- [contracts/ssot/README.md](/Users/shaotongli/Documents/xuedao/contracts/ssot/README.md)
- [contracts/ssot/xuedao-ssot-manifest.yaml](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-manifest.yaml)

非目标：

- 这里不负责替代业务说明文档、权限矩阵或状态机文档。
- 这里不直接承载运行态 Swagger 导出。
- 这里当前不强制把非 `performance` 前端动态 EPS 消费重构为静态 service wrapper；这部分仍保留现状，但必须受主源回写守卫和 `eps.ssot.d.ts` 类型增强约束。
