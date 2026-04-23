<!-- 文件职责：冻结 user 模块 SSOT 第一阶段“身份与超管语义入口”的边界、注册中心职责与迁移顺序；不负责在本文内改写现有登录、中间件或权限运行时逻辑；依赖当前 base 模块登录/角色/权限实现和全域 SSOT Phase 0 设计；维护重点是先把分散的身份语义变成结构化主入口，而不是立即重构 auth 运行时。 -->
# 2026-04-22 User 模块 SSOT Phase 1 设计

## 结论

`user` 模块第一阶段先收口“身份语义”，不是收口“所有用户代码”。

当前和 admin 身份、角色、超管语义直接相关的关键事实分散在：

1. `base/service/sys/login.ts`
2. `base/service/sys/perms.ts`
3. `base/service/sys/role.ts`
4. `base/service/sys/user.ts`
5. `base/entity/sys/role.ts`
6. `base/middleware/authority.ts`

因此本阶段新增 `user/domain/auth`，把以下事实集中为模块级 registry：

1. admin token claim 语义
2. 超管角色判定语义
3. admin 登录态缓存键约定
4. 受保护角色/用户修改面的关键入口

本阶段允许基础 admin 运行时 helper 开始只读消费 `user/domain/auth` 提供的 cache key 和 token claim helper，但不改变 token 结构与鉴权语义。

## 范围

本阶段要做：

1. 新增 `src/modules/user/domain/auth/catalog.ts`
2. 新增 `src/modules/user/domain/registry/index.ts`
3. 新增 `src/modules/user/domain/index.ts`
4. 增加最小测试，验证 registry 描述与现有 base 运行时没有脱节
5. 更新仓库级 global registry，把 `user` 标记为已有 domain registry 骨架

本阶段不做：

1. 不迁移 `base` 登录逻辑到 `user`
2. 不改 token 结构
3. 不改超管判定逻辑
4. 不改角色、菜单或 permission bit 运行时
5. 不改 app 侧普通用户登录链

## 设计要点

### 1. `user/domain/auth` 只收口语义，不改运行时 owner

这里集中的是“身份事实”，不是“代码归属”。

也就是说：

1. 运行时代码还在 `base` 模块
2. 语义主入口放到 `user/domain/auth`
3. 后续如需重构运行时代码，先读 registry 再改实现
4. 第一批允许接线的 consumer 是 `login.ts`、`perms.ts`、`authority.ts`

### 2. 先冻结四类事实

第一阶段冻结：

1. admin token claim keys
2. super-admin role flag 与判定规则
3. admin cache key templates
4. admin token payload / claim helper
5. 关键 source paths

这些是目前最容易在多处复制、口头约定和暗改的身份事实。

### 3. 用测试反向校验 registry 与运行时一致

最小测试覆盖：

1. `BaseSysLoginService.generateToken()` 的 claim key 集合要和 registry 一致
2. `BaseSysPermsService.isAdmin()` 与 `BaseSysLoginService.resolveIsAdmin()` 仍基于 `isSuperAdmin`
3. registry 中声明的缓存键模板和 token claim helper 已被现有 base runtime source 显式消费
4. global registry 中 `user.domain_registry` 已接线

## 目录骨架

```text
src/modules/user/domain/
  auth/
    catalog.ts
  registry/
    index.ts
  index.ts
```

## 后续阶段

### Phase 2

1. 让 `base/service/sys/login.ts`、`perms.ts`、`authority.ts`、`user.ts` 优先只读消费 `user/domain/registry`
2. 把超级管理员角色保护、用户保护与 token claim 结构检查升级为守卫脚本

### Phase 3

1. 补 `user` 模块错误目录
2. 补 `user` 与 `base` 的角色/身份边界文档
3. 评估前端登录态、用户态类型是否也要接入统一主源

## 验收标准

1. `user/domain/auth/catalog.ts` 成为 admin 身份语义的结构化入口
2. `user/domain/registry/index.ts` 能稳定导出 user 模块后端 registry
3. 测试能证明 token claims、super-admin 判定和 cache key 约定没有与运行时脱节
4. global registry 中 `user.domain_registry` 变为 `implemented`
5. 本阶段不改变现有登录与权限行为

## 验证计划

1. `cd cool-admin-midway && npm test -- --runTestsByPath test/user-domain-registry.test.ts test/domain-registry.test.ts`
2. `cd cool-admin-midway && ./node_modules/.bin/tsc -p tsconfig.test.json --noEmit`
