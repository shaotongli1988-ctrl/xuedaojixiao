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

补充说明：

1. 仓库当前以“9 类核心 SSOT”为主表。
2. UI 设计系统作为仓库级共享基座治理面，单独在“扩展治理面”中登记，不与 9 类核心表混淆。

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
| 领域模型 | `cool-admin-midway/src/domain-registry/catalog.ts` | repo-governance | `node ./scripts/check-global-domain-ssot.mjs` | backend domain registry、交付文档 | `implemented` |
| 错误语义 | `cool-admin-midway/src/modules/base/domain/errors/catalog.ts` + `cool-admin-midway/src/modules/performance/domain/errors/catalog.ts` | backend-owner | `node ./scripts/check-shared-error-semantics.mjs` | backend middleware/service、performance service/frontend service | `implemented` |
| 状态机 | `contracts/ssot/state-machine-coverage.catalog.json` + `cool-admin-midway/src/modules/performance/domain/states/` | repo-governance / performance-owner | `node ./scripts/check-state-machine-coverage-ssot.mjs` + `node ./scripts/check-state-machine-alignment.mjs --phase batch --force` | performance service/controller/views/docs、repo consistency gates | `implemented` |
| 权限 / RBAC | `contracts/ssot/rbac-domain.catalog.json` | repo-governance | `node ./scripts/check-rbac-domain-ssot.mjs` | menu topology、permission bits、performance role guards、repo consistency gates | `implemented` |
| 字典 / 枚举 | `contracts/ssot/business-dict-binding.catalog.json` + `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts` + `cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts` | repo-governance / performance-owner / dict-owner | `node ./scripts/check-business-dict-binding-ssot.mjs` + `node ./scripts/check-global-domain-ssot.mjs` | performance service/types、dict store/mobile store、repo consistency gates | `implemented` |
| API / OpenAPI / 前端类型 | `contracts/openapi/xuedao.openapi.json` + `cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}` | repo-governance | `node ./scripts/sync-performance-openapi-ssot.mjs --write` + `node ./scripts/openapi-contract-sync.mjs --write` + `node ./scripts/check-performance-contract-closure.mjs` | backend contract docs、web/mobile generated consumers、repo consistency guards | `implemented` |
| 脚本 / 守卫 / CI | `contracts/ssot/xuedao-ssot-manifest.yaml` | repo-governance | `node ./scripts/check-xuedao-ssot-manifest.mjs` | pre-push、CI、reports/delivery | `implemented` |
| 配置 / 环境变量 | `contracts/ssot/environment-config.catalog.json` | repo-governance | `node ./scripts/check-environment-config-ssot.mjs` | runtime entrypoints、migration/smoke/guard scripts、repo automation | `implemented` |
| 数据库 schema / migration | `contracts/ssot/database-schema.catalog.json` | repo-governance | `node ./scripts/check-database-schema-ssot.mjs` | migration runner、entities aggregator、local schema bootstrap、repo conformance guards | `implemented` |

## 扩展治理面

| 类别 | 当前 primary source | owner | validator | 主要消费者 | 当前判断 |
| --- | --- | --- | --- | --- | --- |
| UI 设计系统 | `cool-admin-vue/src/styles/index.scss` + `tokens.* / adapters.element-plus.scss / patterns.*.scss` | frontend-owner / repo-governance | `node ./scripts/check-ui-token-ssot.mjs` | `cool-admin-vue/src/styles/`、`base/performance/helper/space` 前端模块 | `implemented` |

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

第六批补了以下几件事：

1. 把 `environment-config.catalog.json` 从“curated scan roots”升级为“全仓显式扫描 + excludeRoots”，阻断新增 runtime/config/script 入口绕过环境变量登记。
2. 把 `check-environment-config-ssot.mjs` 升级为支持 repo-root 扫描与显式排除目录，补齐此前漏扫到的 `NODE_ENV / UNI_UTS_PLATFORM` 等变量登记。
3. 回写 repo-level inventory 与 records，移除“环境变量尚未全仓无漏扫”的过时残余风险表述。

第七批补了以下几件事：

1. 把 `database-schema.catalog.json` 从“ownership + migration coverage”升级为显式表级登记：每个 ownership group 现在都声明 `entityTables` 与 `migrationOnlyTables`。
2. 把 `check-database-schema-ssot.mjs` 升级为同时校验 entity `@Entity('table')`、migration 触达表、table namespace 和 ownership group 覆盖关系。
3. 把数据库 schema 从 `planned` 提升到 `partial`：当前已具备表级 parity，但列/索引级 parity 仍未进入 machine-source 主链。

第八批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/job-standard.ts`，把主题17职位标准状态机从文档冻结提升为真正 machine source。
2. 把 `job-standard` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `2` 个 implemented 提升到 `3` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts`，验证职位标准状态机已进入领域注册中心主链。

第九批补了以下几件事：

1. 把 `performance.jobStandard.status` 加入 `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`，让职位标准状态字典进入高层 business dict registry。
2. 把 `business-dict-binding.catalog.json` 中的 backed key / bound provider family 从 assessment 扩展到 `job-standard`，让高层 registry 与实际 provider 不再分叉。
3. 同步更新 repo guard regression，确保 `job-standard` 的 registry-binding 事实能被仓库级回归守住。

第十批补了以下几件事：

1. 把 `goal / contract / purchase_order / teacher_channel` 四个高价值 provider family 的 registry keys 一次性接入 `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`。
2. 把 `business-dict-binding.catalog.json` 的 backed key / withRegistryBinding 覆盖面从 `assessment / job-standard` 扩大到 `goal / contract / purchase_order / teacher_channel`。
3. 同步更新 repo guard regression，确保高层 business dict registry 不会再回退到“provider 已有但 registry 未声明”的状态。

第十一批补了以下几件事：

1. 把 `capability / certificate / feedback / salary` 四个高价值 provider family 的 registry keys 一次性接入 `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`。
2. 把 `business-dict-binding.catalog.json` 的 backed key / withRegistryBinding 覆盖面继续扩大到 `capability / certificate / feedback / salary`，让高层 registry 与实际 provider 输出继续收敛。
3. 同步更新 repo guard regression 与 records，确保这四个 family 的高层绑定不会再次漂回“provider 已有但 registry 未声明”的状态。

第十二批补了以下几件事：

1. 把 `course / hiring / supplier / work_plan` 四个高价值 provider family 的 registry keys 一次性接入 `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`。
2. 把 `business-dict-binding.catalog.json` 的 backed key / withRegistryBinding 覆盖面继续扩大到 `course / hiring / supplier / work_plan`，让高层 registry 与实际 provider 输出继续收敛。
3. 同步更新 repo guard regression 与 records，确保这四个 family 的高层绑定不会再次漂回“provider 已有但 registry 未声明”的状态。

第十三批补了以下几件事：

1. 把 `course_learning / indicator / interview / meeting / suggestion / talent_asset` 六个高价值 provider family 的 registry keys 一次性接入 `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`。
2. 把 `business-dict-binding.catalog.json` 的 backed key / withRegistryBinding 覆盖面继续扩大到 `course_learning / indicator / interview / meeting / suggestion / talent_asset`，让高层 registry 与实际 provider 输出继续收敛。
3. 同步更新 repo guard regression 与 records，确保这六个 family 的高层绑定不会再次漂回“provider 已有但 registry 未声明”的状态。

第十四批补了以下几件事：

1. 把 `document_center / knowledge_base / pip / promotion / recruit_plan / resume_pool` 六个剩余 provider family 的 registry keys 一次性接入 `cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`。
2. 把 `business-dict-binding.catalog.json` 的 backed key / withRegistryBinding 覆盖面补齐到所有已登记 provider family，并把 `providerFamiliesWithoutRegistryBinding` 收敛为 `[]`。
3. 同步更新 repo guard regression 与 records，确保 business dict registry/provider family 覆盖缺口不会再次回退。

第十五批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/goal.ts`，把目标主链的状态集合和合法流转从 helper/service 隐式规则提升为 machine source。
2. 把 `goal` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `3` 个 implemented 提升到 `4` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证目标状态机已进入领域注册中心主链。

第十六批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/promotion.ts`，把晋升单主链的状态集合和合法流转从 helper/service 隐式规则提升为 machine source。
2. 把 `promotion` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `4` 个 implemented 提升到 `5` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证晋升单状态机已进入领域注册中心主链。

第十七批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/pip.ts`，把 PIP 主链的状态集合和合法流转从 service 内嵌规则提升为 machine source。
2. 把 `pip` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `5` 个 implemented 提升到 `6` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证 PIP 状态机已进入领域注册中心主链。

第十八批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/suggestion.ts`，把自动建议主链的状态集合和合法流转从 helper 隐式规则提升为 machine source。
2. 把 `suggestion` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `6` 个 implemented 提升到 `7` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证自动建议状态机已进入领域注册中心主链。

第十九批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/purchase-order.ts`，把采购订单主链的状态集合和合法流转从 service 隐式规则提升为 machine source。
2. 把 `purchase-order` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `7` 个 implemented 提升到 `8` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证采购订单状态机已进入领域注册中心主链。

第二十批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/feedback.ts`，把 360 环评任务主链的状态集合和合法流转从 service 隐式规则提升为 machine source。
2. 把 `feedback` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `8` 个 implemented 提升到 `9` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证 360 环评状态机已进入领域注册中心主链。

第二十一批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/work-plan.ts`，把工作计划主链的状态集合和合法流转从 service 隐式规则提升为 machine source。
2. 把 `work-plan` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `9` 个 implemented 提升到 `10` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证工作计划状态机已进入领域注册中心主链。

第二十二批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/salary.ts`，把薪资主链的状态集合和合法流转从 service 隐式规则提升为 machine source。
2. 把 `salary` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `10` 个 implemented 提升到 `11` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts`、`test/performance/salary.service.test.ts` 与 repo guard regression，验证薪资状态机已进入领域注册中心主链且与现有 service 规则一致。

第二十三批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/asset-assignment-request.ts`，把资产领用申请主链的状态集合和合法流转从 `asset-domain / approval-flow` 的隐式规则提升为 machine source。
2. 把 `asset-assignment-request` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `11` 个 implemented 提升到 `12` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts`、`test/performance/asset-domain.service.test.ts` 与 repo guard regression，验证资产领用申请状态机已进入领域注册中心主链且与现有审批/配发语义一致。

第二十四批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/asset-procurement.ts`，把采购入库单主链的状态集合和合法流转从 `asset-domain` 的隐式规则提升为 machine source。
2. 把 `asset-procurement` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `12` 个 implemented 提升到 `13` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts`、`test/performance/asset-domain.service.test.ts` 与 repo guard regression，验证采购入库状态机已进入领域注册中心主链且与现有提交/入库语义一致。

第二十五批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/asset-transfer.ts`、`asset-inventory.ts`、`asset-disposal.ts`、`asset-maintenance.ts`，把剩余四个资产子流程主链的状态集合和合法流转从 `asset-domain` 的隐式规则提升为 machine source。
2. 把这四个聚合一起接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `13` 个 implemented 提升到 `17` 个。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts`、`test/performance/asset-domain.service.test.ts` 与 repo guard regression，验证调拨/盘点/报废/维护状态机已进入领域注册中心主链且与现有 service 规则一致。

第二十六批补了以下几件事：

1. 新增 `cool-admin-midway/src/modules/performance/domain/states/teacher-cooperation.ts` 与 `teacher-class.ts`，把 `teacher-channel` 冻结主链拆成安全聚合并提升为 machine source。
2. 把 `teacher-cooperation / teacher-class` 接入 `cool-admin-midway/src/modules/performance/domain/registry/index.ts`、`xuedao-ssot-manifest.yaml` 与 `state-machine-coverage.catalog.json`，让 repo-level coverage 从 `17` 个 implemented 提升到 `19` 个，并清空 `plannedAggregates`。
3. 补充 `cool-admin-midway/test/performance/domain-registry.test.ts` 与 repo guard regression，验证班主任合作/建班状态机已进入领域注册中心主链且与现有 service 规则一致。

第二十七批补了以下几件事：

1. 把 `database-schema.catalog.json` 升级为 `1.2`，为 `performance-domain` 引入 machine-derived 的字段/索引级 parity 配置，并显式登记当前已知 drift 的排除表清单。
2. 把 `check-database-schema-ssot.mjs` 从单纯表级 parity 守卫升级为“表级 parity + 已启用 group 的字段/索引级 parity”，自动提取 entity decorator 与 migration CREATE TABLE DDL，不再依赖手工列清单。
3. 补充 repo guard regression，确保 field/index parity 配置不会回退，并把数据库 schema 的仓库级缺口从“完全没有字段/索引校验”收敛为“仅剩少量显式排除表待修复”。

第二十八批补了以下几件事：

1. 升级 `scripts/check-database-schema-ssot.mjs`，让字段/索引 parity 在比较 entity 与 migration 时识别 `@Column({ name: 'db_column' })` 这类物理列别名，避免把属性名误当成 schema 真值。
2. 对 `performance_course_* / goal_ops_plan / hiring / interview / knowledge_qa / recruit_plan / resume_pool / teacher_agent_relation` 的 entity 元数据做 migration-first 对齐，清掉此前只存在于 entity 或只存在于 migration 的索引声明漂移。
3. 把 `performance-domain` 从“有 10 张排除表的 field/index parity”推进到“排除清单清零”，剩余数据库 schema 缺口收敛为其它 ownership group 尚未进入字段/索引级 parity。

第二十九批补了以下几件事：

1. 为 `plugin / space / task` 三个 backend 模块补齐最小 `domain/registry/index.ts` 与 `domain/index.ts` 骨架，并把 `cool-admin-midway/src/domain-registry/catalog.ts` 的 `domain_registry` surface 从 `missing` 提升到 `implemented`。
2. 新增 `approval-flow / dashboard / workbench` 三个业务字典 provider，把 `performance.approvalFlow.status / performance.dashboard.scope / performance.workbench.persona` 从 planned key 收口为 backed key，并清空 `registryKeysPlannedWithoutProviders`。
3. 升级 `scripts/check-database-schema-ssot.mjs` 的 migration 文本解析，让守卫能识别模板变量展开后的 `ALTER TABLE ... ADD/DROP COLUMN`，为后续 ownership group 扩面提供更接近真实 migration 的基线。

第三十批补了以下几件事：

1. 升级 `scripts/check-database-schema-ssot.mjs`，只从 migration 的 forward 语义解析 schema 变化，不再把 `down()` 里的 `DROP COLUMN / DROP PRIMARY KEY / DROP TABLE` 混入字段/索引 parity。
2. 修复 entity schema 解析器对属性类型字面量的截断误判，让 `plugin_info / recycle_data` 这类含内联对象类型的实体也能完整进入 machine-derived parity。
3. 把 `platform-foundation / module-support` 一并纳入 `database-schema.catalog.json` 的 `enabledOwnershipGroups`，使数据库 schema / migration 从 `partial` 提升到 `implemented`。

第三十一批补了以下几件事：

1. 升级 `scripts/run-repo-consistency-guards.mjs`，支持显式 `--file` 与 `--files-from` 输入，但只把范围裁剪参数透传给 RBAC / 状态机 / 组件收敛这三类 changed-aware 子守卫，基线守卫仍保持全量执行。
2. 升级 `scripts/git-pre-push-gate.mjs`，在触发 `repo-consistency-guards` 命令组时自动把本次命中的仓库相对路径逐条追加为 `--file`，避免历史脏工作区放大 changed-aware 守卫范围。
3. 同步回写 `README.md`、`docs/24-自动化测试策略与脚本规划.md` 与 repo guard regression，确保 scoped 守卫入口、pre-push 接线和手工执行方式都有可见事实源与回归约束。

第三十二批补了以下几件事：

1. 升级 `scripts/audit-worktree-split.mjs`，让 `--batch-id <id> --output paths` 除了打印路径，还会默认落盘 `reports/delivery/worktree-split-audit.<batch-id>.latest.paths`。
2. 把 `README.md` 与 `docs/24-自动化测试策略与脚本规划.md` 的示例命令改成“先跑 worktree split，再把 `.paths` 直接喂给 repo-consistency --files-from”的闭环用法。
3. 补充 repo guard regression，锁住 `.paths` 产物的默认落盘行为，避免这条拆批到守卫的衔接链路回退。

第三十三批补了以下几件事：

1. 把 `cool-admin-vue/src/styles/index.scss`、`tokens.* / adapters.element-plus.scss / patterns.*.scss` 正式提升为仓库级 UI 设计系统主源，并在 `xuedao-ssot-manifest.yaml` 中新增 `sourceOfTruth.uiDesignSystem`。
2. 新增 `scripts/check-ui-token-ssot.mjs`，校验统一样式入口拓扑、共享样式文件登记，以及 scoped changed files 或 `--all` 全量 consumer 扫描时是否绕开共享 token 直写原始色值。
3. 把 UI 设计系统守卫接入 `run-repo-consistency-guards.mjs`、repo guard regression 和 SSOT 文档，避免视觉基座继续停留在“代码存在但无仓库级登记”的状态。

## 当前已知缺口

1. 状态机 coverage 已显式登记，当前已有 `approval-flow / asset-assignment-request / asset-disposal / asset-inventory / asset-maintenance / asset-procurement / asset-transfer / assessment / feedback / goal / job-standard / pip / promotion / purchase-order / salary / suggestion / teacher-class / teacher-cooperation / work-plan` 十九个聚合进入 machine source
2. 领域模型 registry 已显式登记，当前所有 backend 一级模块都已进入 `src/domain-registry/catalog.ts` 的 module registry 主链，其中 `demo / recycle / swagger` 仍维持显式排除或 out-of-scope
3. 字典 registry/provider 绑定已显式登记，当前 `dict/domain` provider catalog 中登记的全部 family 都已完成高层 registry 绑定，`providerFamiliesWithoutRegistryBinding` 与 `registryKeysPlannedWithoutProviders` 已清零
4. 数据库 schema 已对 `platform-foundation / module-support / performance-domain` 三个 ownership group 启用无排除表的字段/索引级 parity，当前仓库级主链已闭环，后续主要是新增 migration/entity 的增量维护

## 当前整改优先级与收口计划

这部分开始承担“下一步先做什么”的仓库级入口。

原则：

1. 先收 `partial`，再谈扩面
2. 先收会影响运行正确性和联动一致性的链路，再收纯登记类资产
3. 同一类 SSOT 必须同时说明主源、缺口、收口动作、验收命令，避免继续靠口头同步

### 9 类 SSOT 当前优先级

| 类别 | 当前判断 | 当前主源 | 主要缺口 | 当前优先级 |
| --- | --- | --- | --- | --- |
| 领域模型 | `implemented` | `cool-admin-midway/src/domain-registry/catalog.ts` + 各模块 `domain/registry/index.ts` | backend 一级模块的 domain registry 主链已闭环，后续主要是新增模块增量维护 | `P3` |
| 错误语义 | `implemented` | `base/user/dict/performance` 各自 `domain/errors/catalog.ts` | 已有稳定错误目录，当前主要是跟随新增模块持续登记 | `P3` |
| 状态机 | `implemented` | `contracts/ssot/state-machine-coverage.catalog.json` + `cool-admin-midway/src/modules/performance/domain/states/` | 当前 performance 高价值聚合已全部进入 machine source，后续主要是新增模块增量维护 | `P3` |
| 权限 / RBAC | `implemented` | `contracts/ssot/rbac-domain.catalog.json` | 仓库级主链已成型，后续重点是跟随新增角色/权限点增量维护 | `P2` |
| 字典 / 枚举 | `implemented` | `contracts/ssot/business-dict-binding.catalog.json` + `performance/dict` 双 catalog | registry key、provider family 和 planned key 已闭环，后续主要是新增字典增量维护 | `P3` |
| API / OpenAPI / 前端类型 | `implemented` | `contracts/openapi/xuedao.openapi.json` + `performance/domain/registry/contract-source.{json,mjs}` | registry 驱动的 producer/generator/consumer 闭环已稳定，后续主要是跟随新增模块增量维护 | `P3` |
| 脚本 / 守卫 / CI | `implemented` | `contracts/ssot/xuedao-ssot-manifest.yaml` | 主入口已统一，后续主要是新增子守卫时同步登记 | `P3` |
| 配置 / 环境变量 | `implemented` | `contracts/ssot/environment-config.catalog.json` | 已做到全仓扫描，后续主要是防新增变量绕过登记 | `P3` |
| 数据库 schema / migration | `implemented` | `contracts/ssot/database-schema.catalog.json` | 三个 ownership group 已全部进入 machine-derived field/index parity，后续主要是新增 migration/entity 的增量维护与守卫防回退 | `P3` |

优先级含义：

1. `P0`
   - 当前链路还会直接影响运行边界、联调一致性或变更可控性，必须优先推进
2. `P2`
   - 已有主链，但仍有治理缺口，需要继续收口
3. `P3`
   - 主链已经稳定，当前以守住不回退为主

### 每类 SSOT 收口定义

1. 领域模型 SSOT 收口
   - 仓库级总表、模块级 registry、消费者链三者一致
   - 新模块或新一级表面不能绕过 `src/domain-registry/catalog.ts` 登记
2. 错误语义 SSOT 收口
   - 新错误不能继续靠 service 内 message 字符串隐式表达
   - 错误码、分类、默认文案、运行时消费者保持一致
3. 状态机 SSOT 收口
   - 聚合的状态集合、动作、合法流转必须落在 `domain/states/*.ts`
   - coverage catalog、registry、guard、测试四条链必须同时闭环
4. 权限 / RBAC SSOT 收口
   - 菜单、权限位、角色事实源、路由权限生成物保持同一主链
   - 新角色或新权限点不能只改某一层
5. 字典 / 枚举 SSOT 收口
   - registry key、provider family、前后端消费键必须一一对应
   - 不再允许 provider 已有、registry 未声明的影子源回流
6. API / OpenAPI / 前端类型契约 SSOT 收口
   - producer 范围、OpenAPI、generated consumer、shared adapter 引用链一致
   - 新接口不能只进 OpenAPI、不进 module contract source
7. 脚本 / 守卫 / CI SSOT 收口
   - 新增仓库级 guard 必须回写 manifest，并进入统一执行入口
   - 本地 pre-push、CI、交付报告使用同一条守卫主链
8. 配置 / 环境变量 SSOT 收口
   - 新 runtime/config/script 入口出现的变量必须先登记再使用
   - 敏感变量分类和扫描豁免范围必须显式化
9. 数据库 schema / migration SSOT 收口
   - migration、entity、table ownership、字段/索引定义要进入同一主链
   - 至少做到新增字段和新增索引不会绕过 catalog 与 guard

### 下一批实施顺序

#### 第一步：状态机 SSOT

目标：

1. 继续把 `plannedAggregates` 中边界清晰、已有 service/helper 显式规则的聚合逐个提升为 machine source
2. 每提升一个聚合，都同步更新 `domain/states`、`domain/registry`、`state-machine-coverage.catalog.json`、manifest、测试和 repo guard regression

当前建议顺序：

1. `teacher-cooperation / teacher-class`
2. 新增 performance 聚合按同样规则增量接入

最小验收命令：

1. `node ./scripts/check-state-machine-coverage-ssot.mjs`
2. `node ./scripts/check-xuedao-ssot-manifest.mjs`
3. `cd /Users/shaotongli/Documents/xuedao/cool-admin-midway && npm run test -- test/performance/domain-registry.test.ts`
4. `node --test ./performance-management-system/test/repo-guard-scripts.test.mjs`

#### 第二步：API / OpenAPI / 前端类型契约 SSOT

目标：

1. 把剩余历史 performance producer 链路继续收回到 `performance/domain/registry/contract-source.{json,mjs}`
2. 继续减少“OpenAPI 发布主链”和“模块 contract source 主链”之间的人工解释层

重点检查项：

1. 是否仍有 controller/service 已对外暴露，但不在 contract source 中登记
2. web/uni generated target 是否仍依赖扫描反推，而不是 registry 显式声明
3. shared contract enum / adapter 是否还有局部常量回流

最小验收命令：

1. `node ./scripts/check-performance-contract-closure.mjs`
2. `node ./scripts/sync-performance-openapi-ssot.mjs --write`
3. `node ./scripts/openapi-contract-sync.mjs --write`

#### 第三步：数据库 schema / migration SSOT

目标：

1. 保持 `platform-foundation / module-support / performance-domain` 三个 ownership group 的 field/index parity 不回退
2. 让 database guard 在保持 migration-first 的前提下持续识别 CREATE TABLE 之后的 ALTER 增列/增索引，且不受 rollback-only `down()` 污染
3. 把新增 migration/entity 的 schema 漂移继续拦截在仓库守卫阶段，而不是回到人工排查

最小收口动作：

1. 新增 ownership group 时先登记 `entityTables / migrationOnlyTables / migrationFiles`，再决定是否纳入 `enabledOwnershipGroups`
2. 新增字段/索引或 ALTER 语义变化时，先过 `check-database-schema-ssot.mjs` 再提交
3. 保持“新增字段/索引必须即刻进守卫”不回退

最小验收命令：

1. `node ./scripts/check-database-schema-ssot.mjs`
2. `node --test ./performance-management-system/test/repo-guard-scripts.test.mjs`
3. `node ./scripts/check-xuedao-ssot-conformance.mjs`

#### 第四步：领域模型 / 字典 / RBAC 增量维护

目标：

1. 保持已 implemented 的主链不回退
2. 对 `implemented` 类别保持守卫不回退

执行原则：

1. 不新开平行文档
2. 继续以 `xuedao-ssot-inventory.md` + `xuedao-ssot-manifest.yaml` 为仓库总入口
3. 每一批只能有一个明确主语，不把多个高风险表面混成一个大补丁
