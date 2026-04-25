<!-- 文件职责：冻结 base 模块 SSOT 第一阶段“权限与菜单主源入口”的边界、注册中心职责与迁移顺序；不负责在本文内改写现有权限运行时、菜单导入或角色分配逻辑；依赖现有 menu.json、permission generated 文件与全域 SSOT Phase 0 设计；维护重点是先建统一后端入口，不改变现有权限语义与位图分配。 -->
# 2026-04-22 Base 模块 SSOT Phase 1 设计

## 结论

`base` 模块第一阶段不重做权限系统，只做“权限与菜单事实源的后端统一入口”：

1. 把 `menu.json`
2. 把 `permissions.generated.ts`
3. 把 `permission-bits.generated.ts`
4. 把 `route-permissions.generated.ts`

统一聚合到 `base/domain/permissions` 和 `base/domain/registry` 下。

当前阶段不重写权限语义，但开始允许运行时消费方向 `base/domain` 收敛。
首批允许切换的消费方是 `login.ts`、`perms.ts`、`permission-ssot.ts`，以及 `authority.ts` 中本地维护的路由鉴权边界配置与候选解析 helper；它们可以只读 `base/domain` 暴露的权限位、helper 和路由鉴权事实，而不是继续散读 generated 文件或在中间件里维护本地常量。

## 目标

本阶段要解决的问题不是“权限逻辑不对”，而是“权限事实源没有正式入口”。

当前 `base` 模块里：

1. 菜单结构主源在 `menu.json`
2. 权限键主源在 `permissions.generated.ts`
3. 位图主源在 `permission-bits.generated.ts`
4. 路由权限主源在 `route-permissions.generated.ts`
5. 运行时 helper 在 `service/sys/permission-ssot.ts`
6. 鉴权中间件里的路由别名与登录态免鉴权前缀
7. 鉴权中间件里的 admin 路由归一化与权限候选解析 helper

这些文件彼此有关联，但没有一个正式的 `domain registry` 可以让仓库级治理、测试和文档只读消费。

## 范围

本阶段要做：

1. 新增 `src/modules/base/domain/permissions/catalog.ts`
2. 新增 `src/modules/base/domain/registry/index.ts`
3. 新增 `src/modules/base/domain/index.ts`
4. 补最小测试，验证菜单、权限键、位图和路由映射的一致性
5. 更新仓库级 global registry，对 `base` 标记为已具备 domain registry 骨架

本阶段不做：

1. 不改动 `menu.json`
2. 不改动 generated 产物的生成逻辑
3. 不改动登录、鉴权、中间件运行时语义
4. 不把角色分配、用户态或错误目录也一起收口

## 目录骨架

```text
src/modules/base/domain/
  permissions/
    catalog.ts
  registry/
    index.ts
  index.ts
```

## 设计要点

### 1. `permissions/catalog.ts` 是当前阶段唯一主入口

这里统一导出：

1. 原始菜单树
2. 菜单中引用到的权限键集合
3. generated 权限键集合
4. generated 权限位映射
5. generated 路由权限映射
6. 菜单路由列表
7. 生成链源配置，包括 `menuSourcePath`、`generatedTargets`、`ownedSourceFiles`、`permissionUsageScanRoots`、`permissionUsageIgnoredPathSegments`、`permissionUsageScanExtensions`、`permissionUsageAllowedFiles`、`writeActions`、`routePermissionPriority`
8. `source.mjs` 中的菜单遍历、写权限归类与路由权限归并纯函数
9. 中间件运行时别名与登录态免鉴权前缀
10. 中间件运行时 admin 路由归一化与权限候选解析 helper
11. 相关源文件指针

它负责描述和聚合，不负责重算 permission bit，也不替代生成脚本。

### 2. `registry/index.ts` 只做 registry 聚合

`base/domain/registry` 当前只聚合 `permissions` 一类事实，后续再逐步接入：

1. errors
2. roles
3. auth identity
4. user/runtime invariants

### 3. 门禁先验证一致性，不做正向生成

本阶段最小门禁应覆盖：

1. `menu.json` 引用到的权限键必须都存在于 generated 权限表
2. 路由权限映射引用到的权限键必须都存在于 generated 权限表
3. 位图映射 key 集合必须与 generated 权限 key 集合一致
4. `base` 模块必须被全域 registry 识别为已有 domain registry
5. 权限生成脚本与权限检查脚本必须读取 `base/domain/permissions/source.json` 的统一源配置
6. 权限生成脚本必须复用 `base/domain/permissions/source.mjs` 的纯计算逻辑，不能继续在脚本内硬编码同名算法
7. repo consistency 中依赖菜单权限快照的守卫也必须优先读取 `base/domain/permissions/source.mjs`

## 风险与约束

1. 现在的 generated 文件仍然是运行时直接消费对象，所以不能随意改字段或重排行为
2. permission bit 顺序一旦漂移，会直接影响 `permissionMask`
3. 如果只建 registry 不加最小一致性测试，很快会退化成新的壳层

## 后续阶段

### Phase 2

1. 让 `service/sys/permission-ssot.ts`、`login.ts`、`perms.ts`、`authority.ts` 等基础运行时 helper 只读消费 `base/domain`
2. 把菜单、permission bits、route permissions 的跨文件一致性检查升级为仓库守卫

### Phase 3

1. 为 `base` 模块补错误目录和角色/鉴权 registry
2. 决定 OpenAPI、前端路由权限链是否继续从 base registry 派生

## 验收标准

1. `base/domain/permissions/catalog.ts` 能稳定导出菜单、权限、位图、路由映射
2. `base/domain/registry/index.ts` 成为模块级后端统一入口
3. 一条测试能证明菜单权限引用、路由权限引用和位图映射都没有脱节
4. 仓库级 global registry 中，`base` 的 `domain_registry` 状态变为 `implemented`
5. 现有运行时行为不变

## 验证计划

1. `cd cool-admin-midway && npm test -- --runTestsByPath test/base/base-domain-registry.test.ts test/domain-registry.test.ts`
2. `cd cool-admin-midway && ./node_modules/.bin/tsc -p tsconfig.test.json --noEmit`
