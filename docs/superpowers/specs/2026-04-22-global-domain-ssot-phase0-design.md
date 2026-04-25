<!-- 文件职责：冻结仓库级全域 SSOT Phase 0 的目标边界、聚合骨架与推进顺序；不负责在本文内直接改写现有模块运行逻辑或生成链；依赖当前 performance 域 SSOT 落地结果、仓库模块分布与既有 OpenAPI/权限生成链；维护重点是明确“全域 SSOT”不是单表大一统，而是分层主源加派生产物。 -->
# 2026-04-22 全域 SSOT Phase 0 设计

## 结论

全域 SSOT 采用“分层单一事实源”而不是“单文件大总表”：

1. 每个后端模块最终都有自己的 `domain/registry`
2. 仓库根有一个 `global domain registry` 只负责聚合模块边界、覆盖状态与主源指针
3. OpenAPI、前端 generated types、菜单、permission bits、route permissions 都应逐步变成派生产物
4. 守卫脚本和测试负责阻止新的事实副本重新散落出来

当前 `performance` 是第一个已落地样板，Phase 0 先把这个样板提升为仓库级治理骨架，不改变现有运行行为。

## 范围

本阶段要做：

1. 新增仓库级 `global domain registry`
2. 把 `cool-admin-midway/src/modules/*` 当前模块全部纳入覆盖清单
3. 标记每个模块的 SSOT 状态、当前事实源位置和下一阶段收口目标
4. 让 `performance` 作为首个 `implemented` 模块接入全局聚合入口
5. 增加最小测试，确保新增 backend 模块时不会绕开全局清单

本阶段不做：

1. 不把 OpenAPI 改成从全局 registry 正向生成
2. 不改动现有 controller/service/entity 运行行为
3. 不重写 `base/menu.json`、`permissions.generated.ts`、`route-permissions.generated.ts`
4. 不要求其它模块在本阶段立刻补齐各自的 domain registry

## 背景

目前仓库内已经存在三类不同成熟度的事实源：

1. `performance`：后端已有结构化 registry/catalog，可作为样板
2. `base` / `dict` / `user`：有重要业务事实，但主源仍分散在 menu、service、generated 文件或运行时逻辑中
3. `demo` / `swagger` / `recycle` 等支持模块：存在模块代码，但不一定需要完整业务域 registry

如果没有仓库级骨架，后续每个域都可能各自定义“自己的 SSOT”，最后形成第二轮漂移。

## 设计目标

### 1. 仓库级入口只做聚合，不做业务判断

目标路径：

1. `cool-admin-midway/src/domain-registry/types.ts`
2. `cool-admin-midway/src/domain-registry/catalog.ts`
3. `cool-admin-midway/src/domain-registry/index.ts`

职责边界：

1. 记录每个模块的 registry 覆盖状态
2. 记录每个模块当前事实源的文件位置
3. 为后续守卫脚本、OpenAPI 同步链、文档同步提供统一入口

不负责：

1. 运行时注入
2. controller/service 的权限判断
3. 直接替代模块内 registry

### 2. 模块状态要机器可读

每个模块至少记录：

1. `key`
2. `category`
3. `status`
4. `surfaces`
5. `nextMilestone`

其中 `surfaces` 至少覆盖：

1. `domain_registry`
2. `api_contract`
3. `menu_rbac`
4. `state_machine`
5. `error_catalog`
6. `business_dict`
7. `frontend_types`

这样可以把“有没有 SSOT、缺哪一层 SSOT”从口头判断变成可读结构。

### 3. `performance` 作为首个 implemented 模块

`performance` 在全局 registry 中应体现为：

1. `domain_registry = implemented`
2. `state_machine = partial`
3. `error_catalog = partial`
4. `business_dict = implemented`
5. `api_contract / frontend_types / menu_rbac = partial`

这能准确表达当前真实成熟度，避免把局部收口误判成“已经全域闭环”。

### 4. 其它模块先建覆盖地图，再逐域收口

建议当前模块分层如下：

1. `performance`：样板域，已开始收口
2. `base` / `dict` / `user`：优先级最高的下一批
3. `task` / `space` / `plugin`：第二批
4. `demo` / `swagger` / `recycle`：支持模块，先纳入覆盖但允许 `excluded` 或 `planned`

## 代码骨架

```text
cool-admin-midway/src/
  domain-registry/
    types.ts
    catalog.ts
    index.ts
```

其中：

1. `types.ts`
定义仓库级 registry、模块描述、事实面描述的类型。

2. `catalog.ts`
维护各模块的 SSOT 覆盖清单和 `performance` 的已实现接线。

3. `index.ts`
导出统一入口和版本号。

## 推进顺序

### Phase 0

1. 建仓库级骨架
2. 完成模块覆盖地图
3. 接入 `performance`
4. 加最小测试
5. 加全域 SSOT 守卫脚本，阻止 backend 模块覆盖和 implemented registry 状态继续漂移

### Phase 1

1. 为 `base` 建立权限/菜单/路由 registry
2. 为 `dict` 建立业务字典 registry
3. 为 `user` 建立身份/角色/用户态 registry

### Phase 2

1. 让菜单、permission bits、route permissions 从统一主源派生
2. 让 OpenAPI 与 generated types 从明确主源派生

### Phase 3

1. 扩守卫脚本为全域门禁
2. 为状态机、错误码、字典和权限链增加跨层一致性校验

## 验收标准

1. `cool-admin-midway/src/domain-registry` 有稳定可导出的统一入口
2. 全部 backend 一级模块都在仓库级 registry 中有记录
3. `performance` 在全局 registry 中被标记为已落地域
4. 新增 backend 模块若未更新全局 registry，会被测试发现
5. `scripts/check-global-domain-ssot.mjs` 能阻止 implemented registry 状态与真实文件结构脱节
5. 本阶段不改变任何现有业务行为

## 风险与约束

1. 如果只加全局 registry 而不逐步让生成链消费它，会产生“全局目录存在但没人用”的治理空转
2. 如果模块状态定义得过于乐观，会掩盖实际仍然分散的事实源
3. 如果把 support 模块强行纳入业务域模板，后续会形成维护噪音

## 验证计划

1. `cd cool-admin-midway && npm test -- --runTestsByPath test/performance/domain-registry.test.ts test/domain-registry.test.ts`
2. `cd cool-admin-midway && ./node_modules/.bin/tsc -p tsconfig.test.json --noEmit`

## 当前阶段结论

全域 SSOT 的第一步不是继续在某个 service 里搬硬编码，而是先固定仓库级边界：

1. 哪些模块已经有主源
2. 哪些模块只有部分主源
3. 哪些模块仍然缺主源
4. 后续生成链应该从哪里读，不应该从哪里反向定义
