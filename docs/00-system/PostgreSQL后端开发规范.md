# PostgreSQL 后端开发规范（基座通用）

这份规范适用于基于以下技术栈开发的后端项目：

- Midway
- TypeORM
- PostgreSQL
- Cool Admin / cool-admin-midway

目标：

- 减少 PostgreSQL 下字段名、分页、排序、QueryBuilder 的兼容问题
- 统一 controller / service / entity 的推荐写法
- 避免因为局部问题误改全局基础层
- 给 AI agent 和团队成员一份可重复遵守的后端开发约束

---

## 1. 适用范围

当你在下面这些场景里写代码时，默认要遵守本规范：

- 新增后端模块
- 修改 entity
- 修改 controller / service
- 修改分页 `page()`
- 使用 QueryBuilder
- 修改排序逻辑
- 接入旧表
- 兼容 PostgreSQL 字段

---

## 2. 核心原则

### 2.1 优先用框架标准能力，不要先手搓 SQL

推荐优先级：

1. `@CoolController`
2. `listQueryOp`
3. `BaseService` / `entityRenderPage`
4. TypeORM Entity + QueryBuilder
5. 原生 SQL

普通 CRUD 场景优先使用标准能力，只有在标准能力无法覆盖时才下沉到自定义 service 查询。

---

### 2.2 PostgreSQL 下不要猜字段名

PostgreSQL 对字段名、大小写、引用方式比 MySQL 更严格。

所以：

- 不要凭感觉写 `createtime`
- 不要凭感觉写 `updatetime`
- 不要凭感觉写 `create_time`
- 不要凭感觉写 `update_time`
- 不要假设驼峰字段在 SQL 里一定能按预期工作

先看实体，再写查询。

---

### 2.3 单模块问题优先模块内修，不要先动全局基础层

如果只是某个模块报错：

优先检查：

- 当前模块实体定义
- 当前模块 `page()`
- 当前模块排序字段
- 当前模块旧表兼容逻辑

不要先改：

- 基础实体时间字段映射
- 全局 QueryBuilder 行为
- 全局数据库配置
- 全局 base service 行为

**结论：局部问题优先局部修。**

---

## 3. Entity 规范

### 3.1 先确认实体字段，再写 where / select / orderBy

推荐做法：

- 先看 entity 字段定义
- 再写 controller / service
- 再写 QueryBuilder

不要先写 SQL，再猜 entity 怎么补。

---

### 3.2 不要用“改基础实体列名”的方式修业务问题

例如：

- 把全局 `createTime` 改映射成 `createtime`
- 把全局 `updateTime` 改映射成 `updatetime`

这会影响所有继承基础实体的表，并且在 `synchronize: true` 下触发不可控结构变更。

如果只是个别模块兼容旧表：

- 优先在该模块内处理
- 不要污染整个基座

---

### 3.3 接入旧表前，先确认真实表结构

对于已有 PostgreSQL 表：

接入前先确认：

- 字段真实名字
- 是否驼峰 / 下划线
- 是否允许 null
- 是否已有默认值
- 是否已有历史数据

不要依赖 `synchronize` 帮你“猜对”。

---

## 4. Controller / Service 规范

### 4.1 普通 CRUD 优先用 `@CoolController`

如果功能只是：

- add
- delete
- update
- info
- list
- page

优先使用：

- `@CoolController`
- `listQueryOp`
- `fieldEq`
- `keyWordLikeFields`
- `addOrderBy`

只有在复杂业务场景才自定义 `page()`。

---

### 4.2 controller 轻，service 重

推荐分工：

- controller：收参数、调用 service、返回结果
- service：处理查询、权限、排序、组装字段

这样出了 PostgreSQL 兼容问题，排查范围更集中。

---

### 4.3 复杂查询才下沉到自定义 service

只有遇到这些情况时，再自定义 `page()` 或复杂查询：

- 多表 join
- 权限过滤
- 聚合统计
- 特殊业务条件
- 需要额外衍生字段

只要自定义了 `page()`，就默认要接管排序逻辑。

---

## 5. 分页与排序规范

### 5.1 自定义 `page()` 必须自己接管排序

这是 PostgreSQL 项目里最容易踩坑的点。

如果你写了自定义 `page()`：

必须做这两件事：

1. 自己明确写默认排序
2. 不要把前端传来的 `order/sort` 原样继续透传给 `entityRenderPage`

推荐写法：

```ts
find.orderBy('a.updateTime', 'DESC').addOrderBy('a.id', 'DESC');

const pageQuery = { ...query };
delete pageQuery.order;
delete pageQuery.sort;

return await this.entityRenderPage(find, pageQuery);
```

---

### 5.2 前端排序必须走白名单映射

如果业务确实需要用户自定义排序：

禁止直接透传：

```ts
find.orderBy(`a.${query.order}`, query.sort);
```

推荐白名单映射：

```ts
const orderMap = {
  id: 'a.id',
  createTime: 'a.createTime',
  updateTime: 'a.updateTime',
};

const orderField = orderMap[query.order] || 'a.updateTime';
const orderSort = query.sort === 'asc' ? 'ASC' : 'DESC';
find.orderBy(orderField, orderSort);
```

没有白名单，就不要开放任意排序。

---

### 5.3 不要依赖默认分页追加排序行为

某些框架分页封装会根据 `query.order / query.sort` 自动追加排序。

在 PostgreSQL 下，这类默认行为容易因为：

- 裸字段
- 驼峰字段
- 字段别名
- 自动大小写转换

导致 SQL 报错。

所以：

**自定义分页时，默认主动清理默认排序透传。**

---

## 6. QueryBuilder 规范

### 6.1 优先使用实体字段语义

推荐：

```ts
.where('a.ownerUserId = :ownerUserId', { ownerUserId })
.orderBy('a.updateTime', 'DESC')
```

不要默认写：

```ts
.orderBy('a.updatetime', 'DESC')
.orderBy('createtime', 'DESC')
.orderBy('create_time', 'DESC')
```

除非你已经确认真实表结构就是这样。

---

### 6.2 避免裸字段排序

不推荐：

```sql
ORDER BY createTime DESC
```

推荐：

```ts
.orderBy('a.createTime', 'DESC')
```

所有排序字段尽量带 alias。

---

### 6.3 join 查询里的 select / where / orderBy 尽量都带 alias

推荐：

```ts
.select(['a.*', 'b.name as ownerUserName'])
.leftJoin(UserEntity, 'b', 'a.ownerUserId = b.id')
.orderBy('a.updateTime', 'DESC')
```

避免：

- 裸字段 select
- 裸字段排序
- 多表场景里省略 alias

---

## 7. PostgreSQL 与数据库结构规范

### 7.1 不要把 `synchronize: true` 当成迁移方案

开发环境可以开，但不能依赖它解决这些问题：

- 全局字段改名
- 旧表接入
- 新增非空字段
- 历史数据兼容

否则很容易出现：

- 自动 ALTER TABLE
- 非空列补数据失败
- 启动直接报错

推荐做法：

- migration
- 明确 SQL
- 明确一次性数据修复

---

### 7.2 旧表兼容先确认，再编码

当你要兼容已有 PostgreSQL 表时：

先确认真实表结构，再决定：

- entity 怎么写
- service 怎么写
- 排序字段怎么写
- 是否需要白名单映射

不要先编码再靠 `synchronize` 验证。

---

## 8. AI 编码约束（强制）

如果你是 AI agent，在这个技术栈下写后端代码，默认遵守：

1. 不要猜 PostgreSQL 字段名
2. 不要直接透传前端 `order/sort`
3. 自定义 `page()` 必须自己接管排序
4. 普通 CRUD 优先使用 `CoolController`
5. 单模块问题不要先改全局基础层
6. 不要用全局时间字段改名去修局部兼容问题
7. 不要依赖 `synchronize: true` 修历史表结构

---

## 9. 开发前 / 提交前最低检查

### 开发前

先做：

1. 找同类模块
2. 看实体定义
3. 判断能否先用标准 `CoolController`
4. 如果要自定义 `page()`，先设计排序策略

### 提交前

至少执行：

```bash
npx tsc -p tsconfig.json --noEmit
```

如果改了：

- entity
- controller
- service
- page
- QueryBuilder
- 排序

还要至少验证：

- page 可用
- info 可用
- 默认排序可用
- 日志写入不报错

---

## 10. 一句话总结

在 Midway + TypeORM + PostgreSQL + Cool Admin 项目里写后端代码时：

**优先标准写法，少猜字段名；自定义分页必须自己管排序；局部问题不要污染全局基础层。**
