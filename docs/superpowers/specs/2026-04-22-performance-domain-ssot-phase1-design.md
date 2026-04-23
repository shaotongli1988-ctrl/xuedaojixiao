<!-- 文件职责：冻结 performance 领域模型 SSOT 第一阶段“骨架优先”的目录边界、注册中心职责与迁移顺序；不负责在本文内直接替换现有 service、entity、controller 或前端消费链；依赖仓库现有 OpenAPI 主源、业务字典聚合、角色 SSOT 设计和状态机主文档；维护重点是 Phase 1 只新增主源骨架、不改变当前运行行为。 -->
# 2026-04-22 Performance 领域模型 SSOT Phase 1 设计

## 目标

为 `xuedao` 仓库中的 `performance` 域补齐“后端统一领域模型中心”的第一阶段骨架，解决当前领域真相分散在 `entity / service / dict / OpenAPI / 文档` 多处的问题。

本阶段只做：

1. 新增 `performance/domain` 主源骨架
2. 固定 `errors / states / dicts / roles / registry` 五类注册中心边界
3. 为后续模块迁移提供稳定导出入口
4. 不改变现有 API、权限、页面、菜单和运行时行为

本阶段不做：

1. 不一次性替换现有 `service/*-dict.ts`
2. 不直接改造 `access-context.ts`
3. 不把 OpenAPI 生成链改成从 registry 正向生成
4. 不修改现有 `controller / entity / service` 业务逻辑

## Before Starting

- Scope:
  新增 `cool-admin-midway/src/modules/performance/domain/` 骨架与注册中心，补充设计文档和 ADR，新增最小测试。
- Non-goals:
  不调整现有权限判定、状态流转、接口契约、数据库 schema、前端页面逻辑。
- Affected modules:
  `cool-admin-midway/src/modules/performance/domain/*`
  `cool-admin-midway/test/performance/*`
  `docs/superpowers/specs/*`
- Acceptance criteria:
  1. 新增统一 `registry` 导出入口。
  2. `errors / states / dicts / roles` 四类主源均有清晰类型和样例注册。
  3. 新增代码不改变当前运行行为。
  4. 提供最小测试证明骨架可加载、结构稳定、关键主键不重复。
- Impact surface:
  后端共享模块导出结构、后续迁移路径、设计文档与架构决策记录。
- Source of truth:
  当前阶段以 `cool-admin-midway/src/modules/performance/domain/registry` 为后端领域模型中心的唯一主入口。
- High-risk surfaces:
  权限、状态机、错误语义、OpenAPI 派生链、业务字典聚合。
- Required delivery evidence:
  设计文档、ADR、registry skeleton 代码、最小测试、仓库守卫通过记录。
- Key assumptions and constraints:
  1. 当前仓库允许先引入“未接线”的主源骨架。
  2. 现有 `OpenAPI -> generated/*` 链路继续保留。
  3. 第一阶段必须是 additive-only，不得破坏现有消费者。

## 当前状态

截至 2026-04-22，这份设计对应的“骨架优先”方案已经从骨架期推进到了静态规则接线期：

1. `performance/domain/registry` 已成为后端领域结构化主入口。
2. `DictInfoService` 已开始消费 `domain/dicts/catalog.ts`。
3. `access-context.ts` 中可稳定外提的静态 capability-scope 规则已迁入 `domain/roles/catalog.ts`。
4. `scripts/check-performance-domain-model-ssot.mjs` 已开始校验部分 SSOT 结构一致性。

因此，下文中“本阶段不接线”的描述应理解为最初设计约束，而不是仓库当前事实状态。

## 背景

当前仓库已经形成了“前端消费模型已收口、后端领域真相仍分散”的结构：

1. 前端实体模型通过 `OpenAPI -> generated/*` 收口。
2. 业务字典已有统一聚合入口，但真实定义仍散在 `service/*-dict.ts`。
3. 角色视角有设计稿和运行时解析器，但没有正式 registry。
4. 状态机仍以文档和 service 内部判断为主，没有统一的 machine-readable 主源。
5. 错误语义仍大量散落在 `CoolCommException('...')` 中，没有统一错误码中心。

因此需要先建立一个稳定的后端领域主源骨架，让后续迁移有地方可收。

## 推荐方案

采用“骨架优先、逐步接线”的方案。

### 为什么不直接模块迁移

如果一开始就同时迁移 `assessment + approval-flow + workbench + dashboard`，会把注册中心设计、兼容层和业务行为改造绑死，返工风险高。

### 为什么不先只做字典

只做字典只能解决展示真相，无法同时收住状态机、角色能力和错误语义，仍然会留下核心领域模型分散问题。

### 为什么骨架优先更合适

1. 改动小，不影响运行时。
2. 可以先固定目录、导出和命名。
3. 后续模块迁移只需要“搬真相”和“改接线”，不再反复讨论结构。
4. 更容易被现有门禁和测试接受。

## Phase 1 目录结构

新增目录：

```text
cool-admin-midway/src/modules/performance/domain/
  errors/
  states/
  dicts/
  roles/
  registry/
  index.ts
```

### 1. `errors/`

职责：

1. 定义领域错误码
2. 定义错误分类和默认消息
3. 提供统一错误目录导出

限制：

1. 本阶段不强制所有 service 立即改用错误码
2. 不在这里做异常抛出封装器，避免影响运行逻辑

### 2. `states/`

职责：

1. 定义聚合根的状态集合
2. 定义动作名
3. 定义合法流转和非法流转说明

首批样例：

1. `assessment`
2. `approval-flow`

限制：

1. 本阶段不替换 service 中的状态判断
2. 本阶段不自动生成前端按钮显隐

### 3. `dicts/`

职责：

1. 定义业务字典注册协议
2. 提供 key、owner、version、rolloutState 等注册信息
3. 为后续接管 `service/*-dict.ts` 做准备

限制：

1. 本阶段不接入 `DictInfoService`
2. 本阶段不替换现有业务字典提供器

### 4. `roles/`

职责：

1. 定义 persona、capability、scope、state guard 注册结构
2. 提供第一批全域能力清单的稳定入口

限制：

1. 本阶段不直接替换 `access-context.ts`
2. 本阶段不自动改写 `menu.json` 或 `authority.ts`

### 5. `registry/`

职责：

1. 聚合 `errors / states / dicts / roles`
2. 对外提供统一入口
3. 作为后续 OpenAPI、守卫脚本、service 和文档同步的唯一主入口

限制：

1. 本阶段不承担 OpenAPI 生成
2. 本阶段不承担运行时依赖注入

## 已完成接线范围

当前已经在 `roles/catalog.ts -> registry -> access-context.ts` 这条链路上完成接线的规则组包括：

1. `assessment`
2. `approval_flow`
3. `dashboard`
4. `capability_domain`
5. `certificate_domain`
6. `job_standard`
7. `purchase_report`
8. `goal`
9. `talent_asset`
10. `course_learning`
11. `course_catalog`
12. `contract`
13. `indicator`
14. `intellectual_property`
15. `material_domain`
16. `salary_domain`
17. `feedback`
18. `suggestion`
19. `promotion`
20. `pip`
21. `workplan`
22. `meeting`
23. `interview`
24. `recruit_plan`
25. `resume_pool`
26. `hiring`
27. `asset_domain`
28. `purchase_order`
29. `teacher_domain`
30. `supplier_vehicle`
31. `document_center`
32. `knowledge_base`
33. `office_collab`

现在 `access-context.ts` 主要负责：

1. 登录上下文与部门上下文解析
2. 动态 scope preset 组合
3. persona 推断与 workbench 页签裁决

而不再承载大块静态 capability-to-scope 真相。

## 已加门禁

`scripts/check-performance-domain-model-ssot.mjs` 当前除了前端 wrapper 派生检查外，还会额外校验：

1. `PerformanceLegacyPermissionAlias` 不得有重复 union 成员
2. `PERFORMANCE_CAPABILITIES` 不得有重复 key
3. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 中的 `capabilityKey` 必须已在 capability 主表注册，且不能重复
4. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 中的 `scopePreset` 必须在 preset 主表中声明
5. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 中的 `legacyPermissionAliases` 必须在 alias 主表中声明

## 核心类型设计

### Error Catalog

统一格式：

```ts
type PerformanceDomainErrorDefinition = {
  code: string;
  category: 'auth' | 'permission' | 'validation' | 'not_found' | 'state' | 'dependency';
  defaultMessage: string;
};
```

### State Machine Catalog

统一格式：

```ts
type PerformanceStateMachineDefinition = {
  aggregate: string;
  version: string;
  statuses: readonly string[];
  actions: readonly string[];
  transitions: readonly {
    from: string;
    action: string;
    to: string;
    actors?: readonly string[];
  }[];
};
```

### Dict Catalog

统一格式：

```ts
type PerformanceBusinessDictDefinition = {
  key: string;
  owner: string;
  version: string;
  rolloutState: 'planned' | 'shadow' | 'active';
};
```

### Role Catalog

统一格式：

```ts
type PerformancePersonaDefinition = { key: string; label: string };
type PerformanceCapabilityDefinition = { key: string; label: string };
type PerformanceScopeDefinition = { key: string; label: string };
type PerformanceStateGuardDefinition = {
  key: string;
  aggregate: string;
  capabilityKey: string;
  allowedStatuses: readonly string[];
};
```

## 迁移顺序

### Phase 1

新增骨架，不接线：

1. `errors`
2. `states`
3. `dicts`
4. `roles`
5. `registry`

### Phase 2

把现有共享入口改成读取 registry：

1. `DictInfoService`
2. `access-context.ts`
3. 状态机守卫脚本

### Phase 3

按模块搬迁：

1. `assessment`
2. `approval-flow`
3. `workbench`
4. `dashboard`

### Phase 4

继续扩展到：

1. 招聘/培训/人才
2. 采购/资产/物资

## 当前结论

迁移顺序中的 Phase 1 和 Phase 2 已经在静态规则层面基本完成，原本计划中的 Phase 3/Phase 4 也已经覆盖到了绝大多数 `access-context.ts` 静态权限范围映射。

当前剩余更合适的后续工作，不再是继续向 `access-context.ts` 搬静态规则，而是：

1. 评估 OpenAPI、菜单权限、前端能力判断是否继续从 registry 只读消费
2. 把今天新增的结构守卫扩展到 persona/workbench/state guard 等其它主表
3. 将当前 SSOT 覆盖面整理成更短的维护说明，方便后续改权限时快速定位唯一事实源
3. 行政协同
4. 教师渠道

## 兼容策略

1. 不删除现有文件。
2. 不改现有 API 路径和返回 shape。
3. 不改现有权限键。
4. 不改现有菜单结构。
5. 允许新旧主源在过渡期并存，但新逻辑必须优先接入 registry。

## 风险

1. 如果 Phase 1 目录边界不稳定，后续模块迁移会反复返工。
2. 如果先引入 registry 却长期不接线，会形成新的“第三事实源”。
3. 如果错误码不尽快迁移，领域模型中心仍然缺一块关键真相。

## 验收标准

### 结构验收

1. `performance/domain/` 目录存在且职责清晰。
2. `registry` 可以统一导出四类目录。
3. 首批样例注册内容完整可读。

### 工程验收

1. 新增代码不影响现有运行行为。
2. 最小结构测试通过。
3. 现有前端领域模型守卫和契约链守卫不回归。

### 风险验收

1. 没有把现有 `service` 逻辑硬迁入 registry。
2. 没有引入新的运行时依赖。
3. 没有修改现有 API/权限/菜单契约。

## Verification Plan

1. `cd cool-admin-midway && npm test -- --runTestsByPath test/performance/domain-registry.test.ts`
2. `node ./scripts/check-performance-domain-model-ssot.mjs`
3. `node ./scripts/sync-performance-openapi-ssot.mjs`
4. `node ./scripts/openapi-contract-sync.mjs`

## First Implementation Record

- Change summary:
  新增 performance 领域模型 SSOT 第一阶段骨架与文档，不改变业务运行逻辑。
- Reused modules or patterns:
  复用现有 `docs/superpowers/specs` 文档落点、现有 TS export 结构和现有 jest 测试方式。
- New dependencies and why existing tools were insufficient:
  无新增依赖。
- Verification run after each meaningful change:
  计划执行最小 jest 测试与仓库守卫。
- Minimum regression matrix evidence:
  本阶段不改行为，只验证结构装载和守卫不回归。
- Contract checks:
  骨架不改现有 API 契约；需确认 OpenAPI 同步脚本仍通过。
- High-risk trigger changes:
  权限、状态机、错误语义、共享导出层。
- Docs or operational updates made:
  本文与 ADR 文档。
