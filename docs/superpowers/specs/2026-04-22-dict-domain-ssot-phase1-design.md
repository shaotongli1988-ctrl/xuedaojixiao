<!-- 文件职责：冻结 dict 模块 SSOT 第一阶段“业务字典聚合主入口”的边界、注册中心职责与迁移顺序；不负责在本文内重写数据库字典 CRUD 或业务域内部 provider 实现；依赖当前 DictInfoService、dict/service/business.ts 与 performance 业务字典 provider 现状；维护重点是让业务字典聚合层具备正式后端主入口，而不是继续把 provider 列表散在 service 中。 -->
# 2026-04-22 Dict 模块 SSOT Phase 1 设计

## 结论

`dict` 模块第一阶段先收口“业务字典 provider 聚合主入口”，不重写数据库字典体系。

当前业务字典聚合事实主要散在：

1. `src/modules/dict/service/business.ts`
2. `src/modules/dict/service/info.ts`
3. `src/modules/performance/service/*-dict.ts`
4. `src/modules/performance/domain/dicts/catalog.ts`

本阶段要把这些收成：

1. `src/modules/dict/domain/dicts/catalog.ts`
2. `src/modules/dict/domain/registry/index.ts`
3. `src/modules/dict/domain/index.ts`

并让 `dict/service/business.ts` 只读消费新的 catalog。

## 范围

本阶段要做：

1. 建 `dict/domain/dicts/catalog.ts`，集中 provider 注册表、group 快照与按 key 查询入口
2. 建 `dict/domain/registry/index.ts`
3. 让 `service/business.ts` 改成读取新的 domain catalog
4. 补最小测试，验证 provider 注册、group 快照、service 聚合入口和 global registry 一致
5. 更新仓库级 global registry，把 `dict.domain_registry` 标记为 `implemented`

本阶段不做：

1. 不改 `DictInfoService.data()` 的数据库字典读取语义
2. 不重写 `performance` 各业务域 provider
3. 不伪造“全量业务字典 rollout 主表”
4. 不把数据库字典 type/info 全部机器可读化为 registry

## 设计要点

### 1. `dict/domain/dicts/catalog.ts` 是新的业务字典聚合主源

这里统一导出：

1. provider 注册表
2. 当前 provider 产出的全部 business dict group 快照
3. `DICT_BUSINESS_DICT_BY_KEY`
4. `resolveBusinessDictGroups(keys)`

这样后续 `DictInfoService`、守卫脚本和文档都能从同一个入口读到业务字典聚合事实。

### 2. `performance/domain/dicts/catalog.ts` 仍然只是 rollout 目录

当前 `performance/domain/dicts/catalog.ts` 只登记少量 rollout key，不是全量 provider 主表。

因此本阶段：

1. 不把它错误升级成全量字典源
2. 继续只用它做“已登记 rollout key 不得缺 provider 输出”的约束

### 3. 数据库字典与业务字典继续双轨

`DictInfoService.data()` 目前合并两类来源：

1. DB 字典
2. 业务字典 provider

本阶段只收口第 2 类的主入口。DB 字典主源仍然在 `dictTypeEntity + dictInfoEntity`。

## 目录骨架

```text
src/modules/dict/domain/
  dicts/
    catalog.ts
  registry/
    index.ts
  index.ts
```

## 验收标准

1. `dict/domain/dicts/catalog.ts` 成为业务字典 provider 的统一后端入口
2. `dict/service/business.ts` 不再自己维护 provider 列表
3. `dict/domain/registry/index.ts` 能稳定导出 dict 模块 registry
4. 测试能验证 provider 聚合和 key 查询一致性
5. global registry 中 `dict.domain_registry` 变为 `implemented`
6. 本阶段不改变 `DictInfoService.data()` 的实际返回语义

## 后续阶段

### Phase 2

1. 为数据库字典 type/info 建机器可读 registry
2. 把业务字典 provider 与 rollout 主表关系做成更强门禁

### Phase 3

1. 评估前端字典消费链是否也从 dict registry 只读消费
2. 为 dict 模块补错误目录和接口契约说明

## 验证计划

1. `cd cool-admin-midway && npm test -- --runTestsByPath test/dict/domain-registry.test.ts test/dict/info.service.test.ts test/domain-registry.test.ts`
2. `cd cool-admin-midway && ./node_modules/.bin/tsc -p tsconfig.test.json --noEmit`
