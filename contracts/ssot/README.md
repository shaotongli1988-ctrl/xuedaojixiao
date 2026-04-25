# xuedao 仓库级 SSOT 映射

本目录承载 `xuedao` 仓库对通用 SSOT 基座的第一层真实落地。

定位：

1. 定义仓库级 SSOT 映射入口。
2. 约束仓库级 OpenAPI、权限主源、状态机、业务字典、错误目录、守卫脚本、交付记录模板的实际路径。
3. 为后续把通用模板替换成真实项目文件提供稳定落点。

当前资产：

1. `xuedao-ssot-bootstrap.yaml`
2. `xuedao-ssot-manifest.yaml`
3. `xuedao-ssot-inventory.md`
4. `environment-config.catalog.json`
5. `database-schema.catalog.json`
6. `menu-route-topology.catalog.json`
7. `records/change-record.template.yaml`
8. `records/verification-record.template.yaml`
9. `records/change-record.yaml`
10. `records/verification-record.yaml`

运行态入口：

1. `node ./scripts/check-xuedao-ssot-manifest.mjs`
   - 校验 manifest 中声明的关键路径、machine source 注册、脚本入口和报告目录是否真实存在
2. `node ./scripts/check-xuedao-ssot-conformance.mjs`
   - 校验当前仓库是否满足 SSOT 最小闭环，并要求 change / verification record 达到 strict-change 结构
   - 默认报告产物：
     - `reports/delivery/xuedao-ssot-conformance.latest.md`
     - `reports/delivery/xuedao-ssot-conformance.latest.json`

当前仓库级 machine source 已覆盖：

1. 仓库级 OpenAPI 主源
2. `base` 权限位主源
3. `user` 鉴权语义目录
4. `base/user/dict` 运行时配置主源
5. 仓库级环境变量 catalog 主源
6. 仓库级 schema / migration ownership catalog 主源
7. 仓库级菜单 / 路由 / view topology catalog 主源
8. `cool-uni` 移动端共享契约主源
9. `performance` 状态机主源
10. `performance` 业务字典主源
11. `dict` 业务字典聚合主源
12. `base/user/dict` 共享错误语义主源
13. `performance` 错误目录主源
14. `performance` API 模块 coverage / consumer target / closure guard 主源：`cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}`，并在 `xuedao-ssot-manifest.yaml` 中以 `sourceOfTruth.performanceContractSource` 独立登记

全域映射总表见：

- [xuedao-ssot-inventory.md](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-inventory.md)

如果要继续推进 9 类 SSOT 治理，统一从 `xuedao-ssot-inventory.md` 的以下部分进入：

1. `9 类 SSOT 映射`
2. `当前已知缺口`
3. `当前整改优先级与收口计划`

当前真实记录：

1. `records/change-record.yaml`
2. `records/verification-record.yaml`

不负责：

1. 替代 `contracts/openapi/xuedao.openapi.json` 作为 API 契约主源。
2. 替代项目业务文档或主题冻结文档。
3. 直接执行发布动作。
