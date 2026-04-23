# API 设计

## 文档职责

这份文档是“接口说明与迁移索引”事实源。

已迁移到仓库级 OpenAPI 的资源，API 唯一事实源以 [contracts/openapi/xuedao.openapi.json](/Users/shaotongli/Documents/xuedao/contracts/openapi/xuedao.openapi.json) 为准；本页保留业务说明、迁移边界和未迁移资源的冻结口径。

当前仓库级 OpenAPI 覆盖范围已经扩展到现有后台模块：

1. `performance` 继续使用 `controller/service/types -> OpenAPI -> generated types` 的强类型收敛链路。
   - 前端业务实体模型的唯一事实源固定为 `OpenAPI -> generated/*`。
   - `cool-uni/types/performance-*.ts` 只允许做 generated re-export、`ApiResponse.data` 派生别名和页面级 helper，不允许再手写平级 `Record / PageResult / Status` 领域模型。
2. `base`、`demo`、`dict`、`plugin`、`recycle`、`space`、`task`、`user` 当前使用 `EPS snapshot -> OpenAPI -> eps.ssot.d.ts` 的仓库级收敛链路。
3. 非 `performance` 模块前端当前仍保留动态 EPS 消费，不把本页误写成“已经全部切到静态 service wrapper”；但其方法签名、请求类型和响应类型已经通过 `cool-admin-vue/build/cool/eps.ssot.d.ts` 受主源驱动。

它只负责定义：

1. 接口路径
2. 请求方法
3. 请求参数
4. 响应结构
5. 错误语义
6. 动作型接口的行为说明

## 不负责内容

这份文档不负责定义：

- 表结构来源
- 页面视觉设计
- 权限角色来源

但它必须引用对应的数据库、状态机和权限文档。

## 基线约束

### 命名空间

后端接口统一放在：

- `/admin/performance/*`

资源接口命名遵循当前 Cool 项目风格，例如：

- `/admin/performance/assessment/page`
- `/admin/performance/assessment/info`
- `/admin/performance/assessment/add`

### 通用响应结构

前端当前请求层 [request.ts](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/cool/service/request.ts) 以 `code === 1000` 作为成功判断，因此绩效模块接口统一返回：

```json
{
  "code": 1000,
  "message": "success",
  "data": {}
}
```

### 通用错误语义

| 场景 | 返回方式 |
| --- | --- |
| 参数校验失败 | `code != 1000`，`message` 为可展示错误 |
| 无权限 | HTTP `403` 或业务拒绝 |
| 登录失效 | HTTP `401` |
| 非法状态流转 | `code != 1000`，`message` 明确说明原因 |
| 数据不存在 | `code != 1000`，`message` 为“数据不存在” |

### 登录后公共绩效角色上下文接口

补充说明：

1. 绩效域大部分业务接口仍挂在 `/admin/performance/*`。
2. 但“当前账号的绩效角色访问上下文”和“当前 persona 偏好写入”属于登录后公共身份信息，固定复用基座通用入口 `/admin/base/comm/*`。
3. 这组接口是 `Web` 与 `cool-uni` 共享的唯一 persona 偏好入口；前端不得各自维护独立的本地事实源。

#### 获取当前绩效访问上下文

- 请求路径：`/admin/base/comm/performanceAccessContext`
- 请求方式：`GET`
- 权限要求：已登录

##### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| activePersonaKey | string | 否 | 本次请求临时指定的 persona；只参与本次返回，不落库 |

##### 返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| availablePersonas | object[] | 当前账号可切换 persona 列表 |
| defaultPersonaKey | string \| null | 当前权限下推导出的默认 persona |
| activePersonaKey | string \| null | 本次最终生效的 persona |
| roleKind | string | 当前 persona 对应的角色类型 |
| canSwitchPersona | boolean | 当前账号是否存在多个可切换 persona |
| workbenchPages | string[] | 当前 persona 可见的工作台页面列表 |
| surfaceAccess | object | 当前 persona 的页面入口访问快照 |

`availablePersonas[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| key | string | persona 键 |
| label | string | persona 展示名 |
| description | string | persona 说明 |

##### 解析优先级

1. 本次请求显式传入的 `activePersonaKey`
2. `base_sys_user.activePerformancePersonaKey` 中已持久化的偏好值
3. 当前账号按现有权限推导出的 `defaultPersonaKey`

##### 行为规则

1. 请求参数和数据库偏好都只能在属于当前 `availablePersonas` 时生效。
2. 若请求参数或数据库偏好已失效，接口必须自动回退到 `defaultPersonaKey`，不能报错阻断登录后主链。
3. `availablePersonas / roleKind / workbenchPages / surfaceAccess` 必须继续由后端基于当前权限和部门范围实时推导，不能直接信任数据库值。

#### 保存当前绩效视角

- 请求路径：`/admin/base/comm/performanceAccessContext/activePersona`
- 请求方式：`POST`
- 权限要求：已登录

##### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| activePersonaKey | string \| null | 目标 persona；传 `null` 表示清空偏好并回退默认视角 |

##### 返回结构

- 返回刷新后的绩效访问上下文，结构与 `GET /admin/base/comm/performanceAccessContext` 一致。

##### 行为规则

1. 后端保存前必须校验 `activePersonaKey` 是否属于当前账号的 `availablePersonas`。
2. 若请求的 persona 不属于当前账号，接口返回业务错误，不得写库。
3. 传 `null` 时只清空偏好字段，不改变当前账号已有权限、角色或数据范围。
4. `POST /admin/base/comm/personUpdate` 不得作为 `activePerformancePersonaKey` 的写入入口，避免通用资料修改接口成为后门。

## 接口分组

### 1. 驾驶舱

#### 接口名称

- 绩效驾驶舱汇总

#### 接口信息

- 目标端：后台首页看板
- 请求路径：`/admin/performance/dashboard/summary`
- 请求方式：`GET`
- 权限要求：`performance:dashboard:summary`

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| periodType | string | 否 | `month` / `quarter` / `year` |
| periodValue | string | 否 | 期间值 |
| departmentId | number | 否 | 部门筛选 |

#### 返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| averageScore | number | 全员绩效均分 |
| pendingApprovalCount | number | 待审批数量 |
| goalCompletionRate | number | 目标完成率 |
| stageProgress | object[] | 五环节进度 |
| departmentDistribution | object[] | 部门绩效分布 |
| gradeDistribution | object[] | 绩效等级分布 |

`stageProgress[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| stageKey | string | `indicatorConfigured` / `assessmentCreated` / `selfSubmitted` / `managerApproved` / `resultArchived` |
| stageLabel | string | 环节名称 |
| completedCount | number | 已完成数 |
| totalCount | number | 应完成数 |
| completionRate | number | 完成率，`0-100` |
| sort | number | 展示顺序 |

`departmentDistribution[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| departmentId | number | 部门 ID |
| departmentName | string | 部门名称 |
| averageScore | number | 部门均分 |
| assessmentCount | number | 纳入口径的评估单数量 |

`gradeDistribution[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| grade | string | `S` / `A` / `B` / `C` |
| count | number | 数量 |
| ratio | number | 占比，`0-100` |

#### 业务规则

- 首期只返回绩效域内可直接计算的数据。
- 招聘、培训、会议等跨模块指标首期不返回，也不提供 `reservedMetrics` 占位字段。

#### 二期主题 6：跨模块驾驶舱接口正式冻结（2026-04-18）

本节负责冻结主题 6 的最小只读聚合接口契约。它不修改首期绩效驾驶舱接口，不引入跨域写入，不开放任何明细下钻。

1. 现有 `/admin/performance/dashboard/summary` 契约继续保持“仅绩效域 6 个指标”不变。
2. 主题 6 必须使用独立只读聚合接口，不允许在现有 `dashboard/summary` 上静默追加跨模块字段。
3. 主题 6 当前正式结论为：`跨模块驾驶舱指标已完成阶段0冻结，可进入开发`。

##### 接口名称

- 跨模块驾驶舱汇总

##### 接口信息

- 目标端：后台管理端跨模块驾驶舱
- 请求路径：`/admin/performance/dashboard/crossSummary`
- 请求方式：`GET`
- 权限要求：`performance:dashboard:crossSummary`

##### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| periodType | string | 否 | 复用驾驶舱筛选：`month` / `quarter` / `year` |
| periodValue | string | 否 | 期间值 |
| departmentId | number | 否 | 部门筛选；`HR` 可为空或传部门；经理仅可传本人部门树范围 |
| metricCodes | string[] | 否 | 子集筛选；默认返回全部已冻结指标族 |

##### 返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| metricCards | object[] | 跨模块指标卡片列表 |

`metricCards[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| metricCode | string | `recruitment_completion_rate` / `training_pass_rate` / `meeting_effectiveness_index` |
| metricLabel | string | 指标名称快照 |
| sourceDomain | string | `recruitment` / `training` / `meeting` |
| metricValue | number \| null | 聚合值；来源不可用时为 `null` |
| unit | string | 单位；由来源域快照决定 |
| periodType | string | 当前返回对应的周期类型 |
| periodValue | string | 当前返回对应的周期值 |
| scopeType | string | `global` / `department_tree` |
| departmentId | number \| null | 实际生效的部门范围；全局时为空 |
| updatedAt | string \| null | 来源快照最后更新时间 |
| dataStatus | string | `ready` / `delayed` / `unavailable` |
| statusText | string | 状态提示文案，如“数据延迟”“暂不可用” |

##### 接口语义

1. `metricValue` 是来源域快照的权威聚合值，绩效模块只负责汇总展示，不在此接口内重算来源域公式、去重或新鲜度。
2. `HR` 请求返回三类已冻结指标族的卡片。
3. `部门经理` 只能请求并看到本人部门树范围内的聚合结果；若某来源域不支持部门树映射，接口仍返回该卡片，但 `metricValue = null` 且 `dataStatus = unavailable`。
4. `员工` 请求必须被拒绝，不返回聚合结果。
5. 接口只返回聚合卡片，不返回招聘、培训、会议域任何原始明细或主键全文。
6. 来源域延迟、缺数或不可用时，接口通过 `dataStatus / statusText / updatedAt` 透传状态，不得伪造 `0` 值冒充真实结果。

##### 错误语义

| 场景 | 返回语义 |
| --- | --- |
| 未登录或权限不足 | 拒绝访问 |
| 经理传入超出本人部门树范围的 `departmentId` | 拒绝访问 |
| `periodType` 非 `month / quarter / year` | 参数错误 |
| `metricCodes` 包含未冻结指标族 | 参数错误 |
| 来源域快照缺失或当前范围不可用 | 接口正常返回，单卡片进入 `unavailable` / `delayed` 状态 |

### 2. 评估单

#### 流程基线

首期评估单流程固定为：

1. `HR` 或 `部门经理` 发起评估单
2. `员工` 填写自评并提交
3. `部门经理` 审批通过或驳回
4. `HR` 不参与首期审批，只负责查看、归档和全局管理

#### 标准 CRUD

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 评估单分页 | `/admin/performance/assessment/page` | `POST` | `performance:assessment:page` |
| 评估单详情 | `/admin/performance/assessment/info` | `GET` | `performance:assessment:info` |
| 新增评估单 | `/admin/performance/assessment/add` | `POST` | `performance:assessment:add` |
| 修改评估单 | `/admin/performance/assessment/update` | `POST` | `performance:assessment:update` |
| 删除评估单 | `/admin/performance/assessment/delete` | `POST` | `performance:assessment:delete` |

#### 评估单分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| employeeId | number | 否 | 被考核人 |
| assessorId | number | 否 | 评估负责人 |
| periodValue | string | 否 | 期间 |
| status | string | 否 | 状态 |
| mode | string | 否 | `initiated` / `my` / `pending` |

#### 三张列表查询口径

| mode | 查询口径 | 默认排序 | 说明 |
| --- | --- | --- | --- |
| `my` | 当前登录人作为 `employeeId` 的记录 | `updateTime desc` | 我的考核 |
| `initiated` | 当前登录人作为发起人或负责人创建的记录 | `createTime desc` | 已发起考核 |
| `pending` | 当前登录部门经理可审批且 `status = submitted` 的记录 | `submitTime asc` | 待我审批 |

#### 评估单详情返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| code | string | 编号 |
| employeeId | number | 员工 ID |
| assessorId | number | 评估人 ID |
| periodType | string | 周期类型 |
| periodValue | string | 周期值 |
| targetCompletion | number | 目标完成率 |
| totalScore | number | 总分 |
| grade | string | 等级 |
| selfEvaluation | string | 自评 |
| managerFeedback | string | 经理反馈 |
| status | string | 状态 |
| scoreItems | object[] | 评分明细 |

`scoreItems[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 评分明细 ID |
| indicatorId | number | 指标 ID，可为空 |
| indicatorName | string | 指标名称快照 |
| score | number | 本项评分 |
| weight | number | 本项权重 |
| weightedScore | number | 加权结果，服务端计算 |
| comment | string | 单项说明 |

#### 动作接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 提交评估单 | `/admin/performance/assessment/submit` | `POST` | `performance:assessment:submit` |
| 审批通过 | `/admin/performance/assessment/approve` | `POST` | `performance:assessment:approve` |
| 审批驳回 | `/admin/performance/assessment/reject` | `POST` | `performance:assessment:reject` |
| 导出评估单 | `/admin/performance/assessment/export` | `POST` | `performance:assessment:export` |

#### 审批通过请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 评估单 ID |
| comment | string | 否 | 审批意见 |

#### 业务规则

- 发起人只允许是 `HR` 或 `部门经理`。
- 员工不允许创建评估单。
- `submit` 只允许 `draft` 状态执行。
- `approve` 和 `reject` 只允许 `submitted` 状态执行，且审批人必须是部门经理。
- 待我审批列表和我的考核列表共用 `assessment/page`，通过 `mode` 区分查询口径。
- `HR` 可以查看所有评估单，但首期没有审批动作权限。
- `totalScore` 由服务端按 `sum(score * weight) / sum(weight)` 计算。
- 目标完成率只作为一个普通评分项参与加权，不单独额外叠加一次。
- `grade` 由服务端按 `S / A / B / C` 区间自动计算，首期不接受前端手工覆盖。
- 同一条评估单允许因视角不同同时出现在“已发起考核”和“待我审批”中。
- 首期仅开放评估导出，且只允许 `HR` 使用，导出字段必须按权限裁剪。
- 首期评估导出固定为标准摘要列，不导出自评全文、审批意见全文和评分明细。
- `assessment` 当前已进入仓库级 API 契约迁移范围；前端与移动端类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 基于 `contracts/openapi/xuedao.openapi.json` 刷新，不再维护第二份手写 API 契约。

### 3. 目标地图

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 目标分页 | `/admin/performance/goal/page` | `POST` | `performance:goal:page` |
| 目标详情 | `/admin/performance/goal/info` | `GET` | `performance:goal:info` |
| 新增目标 | `/admin/performance/goal/add` | `POST` | `performance:goal:add` |
| 修改目标 | `/admin/performance/goal/update` | `POST` | `performance:goal:update` |
| 删除目标 | `/admin/performance/goal/delete` | `POST` | `performance:goal:delete` |
| 更新进度 | `/admin/performance/goal/progressUpdate` | `POST` | `performance:goal:progressUpdate` |
| 导出目标 | `/admin/performance/goal/export` | `POST` | `performance:goal:export` |

#### 目标分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| employeeId | number | 否 | 员工 ID |
| departmentId | number | 否 | 部门 ID |
| status | string | 否 | `draft` / `in-progress` / `completed` / `cancelled` |
| keyword | string | 否 | 目标标题关键词 |
| startDate | string | 否 | 开始日期下限 |
| endDate | string | 否 | 结束日期上限 |

#### 目标列表 / 详情返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| departmentId | number | 部门 ID |
| departmentName | string | 部门名称 |
| title | string | 目标标题 |
| description | string | 目标说明 |
| targetValue | number | 目标值 |
| currentValue | number | 当前值 |
| unit | string | 单位 |
| weight | number | 权重 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| progressRate | number | 完成进度百分比 |
| status | string | 状态 |
| progressRecords | object[] | 进度记录，详情返回 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

`progressRecords[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 进度记录 ID |
| goalId | number | 目标 ID |
| beforeValue | number | 更新前值 |
| afterValue | number | 更新后值 |
| progressRate | number | 本次更新后进度百分比 |
| remark | string | 更新说明 |
| operatorId | number | 操作人 ID |
| operatorName | string | 操作人姓名 |
| createTime | string | 创建时间 |

#### 新增 / 修改目标请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 修改时是 | 目标 ID |
| employeeId | number | 是 | 目标所属员工 |
| departmentId | number | 是 | 所属部门 |
| title | string | 是 | 目标标题 |
| description | string | 否 | 目标说明 |
| targetValue | number | 是 | 目标值 |
| currentValue | number | 否 | 当前值，默认 `0` |
| unit | string | 否 | 单位 |
| weight | number | 否 | 权重 |
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |

#### 目标业务规则

1. `startDate` 不能晚于 `endDate`。
2. `targetValue` 必须大于 `0`。
3. `currentValue` 默认从 `0` 开始。
4. 员工只能更新本人目标进度，不能新增或删除目标。
5. `update` 仅允许 `draft` 和 `in-progress` 状态执行。
6. `progressRate` 由服务端根据 `currentValue / targetValue` 计算并返回，不接受前端直接覆盖。

#### 更新进度请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 目标 ID |
| currentValue | number | 是 | 更新后的当前值 |
| remark | string | 否 | 更新说明 |

#### 更新进度动作规则

1. 目标新增后默认状态为 `draft`。
2. 首次执行 `progressUpdate` 时，目标从 `draft` 进入 `in-progress`。
3. 当 `currentValue >= targetValue` 时，服务端自动把目标状态置为 `completed`。
4. `completed` 状态不允许继续执行 `progressUpdate`。
5. 首期不额外新增“发布目标 / 完成目标 / 取消目标”独立动作接口。
6. `goal` 当前已进入仓库级 API 契约迁移范围；目标主链与目标运营台子接口的前端 / 移动端类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 基于 `contracts/openapi/xuedao.openapi.json` 刷新，不再维护第二份手写 API 契约。

#### 目标导出业务规则

- 首期仅 `HR` 和 `部门经理` 可导出目标数据。
- 导出字段必须按角色裁剪，不返回无权限字段。
- 首期目标导出固定为标准摘要列，不导出审批类、薪资类和越权字段。

#### 目标运营台增量接口（2026-04-19）

以下接口为在现有 `goal` 资源下新增的 ops 子能力，目的是在不破坏原 `/admin/performance/goal/*` 兼容前提下，承接 `目标&计划` 的日运营闭环。

| 接口名称 | 请求路径 | 请求方式 | 复用权限要求 |
| --- | --- | --- | --- |
| 目标运营台权限画像 | `/admin/performance/goal/opsAccessProfile` | `GET` | `performance:goal:page` |
| 目标运营台部门配置 | `/admin/performance/goal/opsDepartmentConfig` | `GET` | `performance:goal:page` |
| 保存目标运营台部门配置 | `/admin/performance/goal/opsDepartmentConfigSave` | `POST` | `performance:goal:add` 或 `performance:goal:update`，且需要 `performance:goal:opsManage` |
| 目标运营台计划分页 | `/admin/performance/goal/opsPlanPage` | `POST` | `performance:goal:page` |
| 目标运营台计划详情 | `/admin/performance/goal/opsPlanInfo` | `GET` | `performance:goal:info` |
| 保存目标运营台计划 | `/admin/performance/goal/opsPlanSave` | `POST` | `performance:goal:add` / `performance:goal:update`；公共目标额外需要 `performance:goal:opsManage`，个人目标场景复用 `performance:goal:update` |
| 删除目标运营台计划 | `/admin/performance/goal/opsPlanDelete` | `POST` | `performance:goal:delete`，个人目标自删兼容 `performance:goal:update` |
| 目标运营台日结果填报 | `/admin/performance/goal/opsDailySubmit` | `POST` | `performance:goal:progressUpdate` 或 `performance:goal:update` |
| 目标运营台日结果自动补零 | `/admin/performance/goal/opsDailyFinalize` | `POST` | `performance:goal:update` 或 `performance:goal:export`，且需要 `performance:goal:opsManage` |
| 目标运营台总览 | `/admin/performance/goal/opsOverview` | `POST` | `performance:goal:page` |
| 目标运营台日报详情 | `/admin/performance/goal/opsReportInfo` | `GET` | `performance:goal:page` |
| 生成目标运营台日报 | `/admin/performance/goal/opsReportGenerate` | `POST` | `performance:goal:update` 或 `performance:goal:export`，且需要 `performance:goal:opsManage` |
| 更新目标运营台日报状态 | `/admin/performance/goal/opsReportStatusUpdate` | `POST` | `performance:goal:update` 或 `performance:goal:export`，且需要 `performance:goal:opsManage` |

#### 目标运营台权限裁剪补充规则（2026-04-19）

1. `performance:goal:opsManage` 是部门运营台管理专用权限键，只负责公共目标、部门配置、自动补零、日报生成与状态更新。
2. `performance:goal:opsGlobalScope` 是目标运营台全局范围专用权限键，只用于标记 `HR` 视角的跨部门访问能力，不能再通过角色标签推断。
3. `performance:goal:add` 不能再被前后端视为“可管理部门运营台”的代替信号。
4. `opsAccessProfile` 返回 `departmentId / activePersonaKey / roleKind / scopeKey / isHr / canManageDepartment / canMaintainPersonalPlan / manageableDepartmentIds`，其中 `activePersonaKey + roleKind + scopeKey` 是前端角色展示与范围裁剪的唯一事实源。
5. 页面裁剪不能再借用薪酬模块权限、角色名或角色标签推断 HR 身份，必须以 `opsAccessProfile` 和当前目标模块权限结果为准。

#### 目标运营台计划对象返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 计划 ID |
| departmentId | number | 部门 ID |
| departmentName | string | 部门名称 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| periodType | string | `day / week / month` |
| planDate | string | 日计划日期；周/月可为空 |
| periodStartDate | string | 周期开始日期 |
| periodEndDate | string | 周期结束日期 |
| sourceType | string | `public / personal` |
| title | string | 目标标题 |
| description | string | 目标说明 |
| targetValue | number | 目标值 |
| actualValue | number | 实际值 |
| completionRate | number | 完成率 |
| unit | string | 单位 |
| status | string | `assigned / submitted / auto_zero` |
| parentPlanId | number | 父级计划 ID |
| isSystemGenerated | boolean | 是否系统生成 |
| assignedBy | number | 下发人 ID |
| submittedBy | number | 提交人 ID |
| submittedAt | string | 提交时间 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

#### 目标运营台总览返回结构

`opsOverview` 至少返回：

1. `departmentSummary`
2. `leaderboard`
   - `completionRate[]`
   - `output[]`
3. `rows[]`

其中 `rows[]` 和 `departmentSummary` 必须显式返回：

1. `publicTargetValue`
2. `publicActualValue`
3. `personalTargetValue`
4. `personalActualValue`
5. `totalTargetValue`
6. `totalActualValue`

补充规则：

1. `opsOverview` 与日报摘要都必须能区分 `公共目标贡献` 和 `个人补充目标贡献`。
2. 当前后端实现不输出单一“综合总榜分数”。
3. `opsDailyFinalize` 只对 `periodType = day` 且状态为 `assigned` 的计划项生效。

### 4. 指标库

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 指标分页 | `/admin/performance/indicator/page` | `POST` | `performance:indicator:page` |
| 指标详情 | `/admin/performance/indicator/info` | `GET` | `performance:indicator:info` |
| 新增指标 | `/admin/performance/indicator/add` | `POST` | `performance:indicator:add` |
| 修改指标 | `/admin/performance/indicator/update` | `POST` | `performance:indicator:update` |
| 删除指标 | `/admin/performance/indicator/delete` | `POST` | `performance:indicator:delete` |

补充约束：

1. 指标库当前已并入仓库级 OpenAPI 主源，`page / info / add / update / delete` 的请求与响应字段以 `contracts/openapi/xuedao.openapi.json` 为唯一事实源。
2. 前端生成类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 刷新，不再手写第二份 indicator API 类型。

### 5. 360 环评

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 环评任务分页 | `/admin/performance/feedback/page` | `POST` | `performance:feedback:page` |
| 环评任务详情 | `/admin/performance/feedback/info` | `GET` | `performance:feedback:info` |
| 新增环评任务 | `/admin/performance/feedback/add` | `POST` | `performance:feedback:add` |
| 提交环评反馈 | `/admin/performance/feedback/submit` | `POST` | `performance:feedback:submit` |
| 环评汇总 | `/admin/performance/feedback/summary` | `GET` | `performance:feedback:summary` |

#### 环评首期规则

1. 评价人由 `HR` 或 `部门经理` 发起任务时显式选择。
2. 首期不匿名，反馈记录可追溯到具体评价人。
3. 每个评价人对同一任务只能提交一次。
4. 汇总分按简单平均分计算。
5. 截止后默认不可补交。
6. 员工本人只能看汇总结果，不能看单条他人反馈内容。
7. `HR` 和对应 `部门经理` 可以看汇总和单条反馈内容。
8. 首期不开放环评导出。

#### 新增环评任务请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| assessmentId | number | 是 | 关联评估单 |
| employeeId | number | 是 | 被评价人 |
| title | string | 是 | 任务标题 |
| deadline | string | 否 | 截止时间 |
| feedbackUserIds | number[] | 是 | 显式选择的评价人列表 |
| relationTypes | object[] | 否 | 评价人对应关系类型 |

#### 提交环评反馈请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| taskId | number | 是 | 任务 ID |
| score | number | 是 | 汇总分 |
| content | string | 否 | 反馈内容 |
| relationType | string | 是 | 评价关系 |

#### 环评汇总返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| taskId | number | 任务 ID |
| averageScore | number | 简单平均分 |
| submittedCount | number | 已提交人数 |
| totalCount | number | 应提交人数 |
| records | object[] | 单条反馈记录，仅 HR/部门经理可见 |

`records[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 反馈记录 ID |
| feedbackUserId | number | 评价人 ID |
| feedbackUserName | string | 评价人姓名 |
| relationType | string | 评价关系 |
| score | number | 本次评分 |
| content | string | 反馈内容 |
| status | string | `draft` / `submitted` |
| submitTime | string | 提交时间 |

### 6. PIP

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| PIP 分页 | `/admin/performance/pip/page` | `POST` | `performance:pip:page` |
| PIP 详情 | `/admin/performance/pip/info` | `GET` | `performance:pip:info` |
| 新增 PIP | `/admin/performance/pip/add` | `POST` | `performance:pip:add` |
| 修改 PIP | `/admin/performance/pip/update` | `POST` | `performance:pip:update` |
| 启动 PIP | `/admin/performance/pip/start` | `POST` | `performance:pip:start` |
| 提交跟进记录 | `/admin/performance/pip/track` | `POST` | `performance:pip:track` |
| 完成 PIP | `/admin/performance/pip/complete` | `POST` | `performance:pip:complete` |
| 关闭 PIP | `/admin/performance/pip/close` | `POST` | `performance:pip:close` |

#### PIP 分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| employeeId | number | 否 | 员工 ID |
| ownerId | number | 否 | 负责人 ID |
| assessmentId | number | 否 | 来源评估单 ID |
| status | string | 否 | `draft` / `active` / `completed` / `closed` |
| keyword | string | 否 | 标题或原因关键词 |

#### PIP 列表 / 详情返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| assessmentId | number | 来源评估单 ID，可为空 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| ownerId | number | 负责人 ID |
| ownerName | string | 负责人姓名 |
| title | string | 标题 |
| improvementGoal | string | 改进目标 |
| sourceReason | string | 独立创建原因 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| status | string | 状态 |
| resultSummary | string | 结果总结 |
| trackRecords | object[] | 跟进记录，详情返回 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

`trackRecords[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 跟进记录 ID |
| pipId | number | 关联 PIP ID |
| recordDate | string | 跟进日期 |
| progress | string | 进展说明 |
| nextPlan | string | 下一步计划 |
| operatorId | number | 记录人 ID |
| operatorName | string | 记录人姓名 |
| createTime | string | 创建时间 |

#### 新增 / 修改 PIP 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 修改时是 | PIP ID |
| assessmentId | number | 否 | 来源评估单 ID |
| employeeId | number | 是 | 员工 ID |
| ownerId | number | 是 | 负责人 ID |
| title | string | 是 | 标题 |
| improvementGoal | string | 是 | 改进目标 |
| sourceReason | string | 条件必填 | 脱离评估单创建时必填 |
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |

#### PIP 动作接口请求参数

`start` / `complete` / `close`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | PIP ID |
| resultSummary | string | 否 | 完成或关闭时的总结 |

`track`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | PIP ID |
| recordDate | string | 是 | 跟进日期 |
| progress | string | 是 | 进展说明 |
| nextPlan | string | 否 | 下一步计划 |

#### PIP 首期规则

1. 首期允许手工创建。
2. 从评估详情发起时，默认自动带入 `assessmentId`。
3. 支持脱离评估单独立创建，但必须填写原因。
4. 首期不要求低绩效等级才能创建。
5. 首期不做自动建议创建规则引擎。
6. 首期不开放 PIP 导出。
7. 当 `assessmentId` 为空时，`sourceReason` 必填。
8. `start` 只允许 `draft` 状态执行。
9. `track`、`complete`、`close` 只允许 `active` 状态执行。

### 7. 晋升

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 晋升分页 | `/admin/performance/promotion/page` | `POST` | `performance:promotion:page` |
| 晋升详情 | `/admin/performance/promotion/info` | `GET` | `performance:promotion:info` |
| 新增晋升单 | `/admin/performance/promotion/add` | `POST` | `performance:promotion:add` |
| 修改晋升单 | `/admin/performance/promotion/update` | `POST` | `performance:promotion:update` |
| 提交晋升单 | `/admin/performance/promotion/submit` | `POST` | `performance:promotion:submit` |
| 评审晋升 | `/admin/performance/promotion/review` | `POST` | `performance:promotion:review` |

#### 晋升分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| employeeId | number | 否 | 员工 ID |
| assessmentId | number | 否 | 来源评估单 ID |
| status | string | 否 | `draft` / `reviewing` / `approved` / `rejected` |
| toPosition | string | 否 | 目标岗位 |

#### 晋升列表 / 详情返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| assessmentId | number | 来源评估单 ID，可为空 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| sponsorId | number | 发起人 ID |
| sponsorName | string | 发起人姓名 |
| fromPosition | string | 当前岗位 |
| toPosition | string | 目标岗位 |
| reason | string | 发起原因 |
| sourceReason | string | 独立创建原因 |
| status | string | 状态 |
| reviewTime | string | 评审时间 |
| reviewRecords | object[] | 评审记录，详情返回 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

`reviewRecords[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 评审记录 ID |
| promotionId | number | 关联晋升单 ID |
| reviewerId | number | 评审人 ID |
| reviewerName | string | 评审人姓名 |
| decision | string | `approved` / `rejected` |
| comment | string | 评审意见 |
| createTime | string | 创建时间 |

#### 新增 / 修改晋升单请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 修改时是 | 晋升单 ID |
| assessmentId | number | 否 | 来源评估单 ID |
| employeeId | number | 是 | 员工 ID |
| sponsorId | number | 是 | 发起人 ID |
| fromPosition | string | 是 | 当前岗位 |
| toPosition | string | 是 | 目标岗位 |
| reason | string | 否 | 发起原因 |
| sourceReason | string | 条件必填 | 脱离评估单创建时必填 |

#### 晋升动作接口请求参数

`submit`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 晋升单 ID |

`review`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 晋升单 ID |
| decision | string | 是 | `approved` / `rejected` |
| comment | string | 否 | 评审意见 |

#### 晋升首期规则

1. 首期允许手工创建。
2. 从评估详情发起时，默认自动带入 `assessmentId`。
3. 支持脱离评估单独立创建，但必须填写原因。
4. 首期不要求高绩效等级才能创建。
5. 首期不做自动建议创建规则引擎。
6. 首期不开放晋升导出。
7. 当 `assessmentId` 为空时，`sourceReason` 必填。
8. `submit` 只允许 `draft` 状态执行。
9. `review` 只允许 `reviewing` 状态执行。

### 7.1 工作计划（来源承接）

工作计划资源用于承接“内部分配执行”和“外部审批来源快照”，它不替代真实审批流引擎，也不回写钉钉审批主数据。

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 工作计划分页 | `/admin/performance/workPlan/page` | `POST` | `performance:workPlan:page` |
| 工作计划详情 | `/admin/performance/workPlan/info` | `GET` | `performance:workPlan:info` |
| 新增工作计划 | `/admin/performance/workPlan/add` | `POST` | `performance:workPlan:add` |
| 修改工作计划 | `/admin/performance/workPlan/update` | `POST` | `performance:workPlan:update` |
| 删除工作计划 | `/admin/performance/workPlan/delete` | `POST` | `performance:workPlan:delete` |
| 开始执行 | `/admin/performance/workPlan/start` | `POST` | `performance:workPlan:start` |
| 完成计划 | `/admin/performance/workPlan/complete` | `POST` | `performance:workPlan:complete` |
| 取消计划 | `/admin/performance/workPlan/cancel` | `POST` | `performance:workPlan:cancel` |
| 手工同步钉钉来源 | `/admin/performance/workPlan/syncDingtalkApproval` | `POST` | `performance:workPlan:sync` |
| 钉钉回调承接 | `/admin/performance/workPlan/dingtalk/callback` | `POST` | 忽略登录态，需 `x-workplan-sync-token` |

#### 工作计划分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 每页数量 |
| keyword | string | 否 | 支持匹配计划标题 / 单号 / 来源标题 / 外部实例 ID |
| departmentId | number | 否 | 所属部门筛选 |
| ownerId | number | 否 | 负责人筛选 |
| assigneeId | number | 否 | 协作执行人筛选 |
| status | string | 否 | 执行状态：`draft / planned / inProgress / completed / cancelled` |
| sourceStatus | string | 否 | 来源审批状态：`none / processing / approved / rejected / withdrawn / terminated` |

#### 工作计划列表 / 详情返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| workNo | string | 工作计划单号 |
| title | string | 计划标题 |
| description | string | 计划说明 |
| ownerDepartmentId | number | 所属部门 ID |
| ownerDepartmentName | string | 所属部门名称 |
| ownerId | number | 负责人 ID |
| ownerName | string | 负责人姓名 |
| assigneeIds | number[] | 协作执行人 ID 列表 |
| assigneeList | object[] | 协作执行人快照 |
| assigneeNames | string[] | 协作执行人名称列表 |
| priority | string | `low / medium / high / urgent` |
| plannedStartDate | string | 计划开始日期 |
| plannedEndDate | string | 计划结束日期 |
| startedAt | string | 实际开始执行时间 |
| completedAt | string | 实际完成时间 |
| status | string | 执行状态 |
| progressSummary | string | 进展摘要 |
| resultSummary | string | 结果总结 |
| sourceType | string | `manual / dingtalkApproval` |
| sourceBizType | string | 来源业务类型，如 `proposal` |
| sourceBizId | string | 来源业务 ID |
| sourceTitle | string | 来源标题快照 |
| sourceStatus | string | 来源审批状态 |
| externalInstanceId | string | 钉钉审批实例 ID |
| externalProcessCode | string | 钉钉审批模板编码 |
| approvalFinishedAt | string | 来源审批完成时间 |
| sourceSnapshot | object | 来源审批轻量快照 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

#### 新增 / 修改工作计划请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 修改时是 | 工作计划 ID |
| title | string | 是 | 计划标题 |
| description | string | 否 | 计划说明 |
| ownerDepartmentId | number | 是 | 所属部门 ID |
| ownerId | number | 是 | 负责人 ID |
| assigneeIds | number[] | 否 | 协作执行人 ID 列表 |
| priority | string | 否 | 默认 `medium` |
| plannedStartDate | string | 否 | `YYYY-MM-DD` |
| plannedEndDate | string | 否 | `YYYY-MM-DD` |
| progressSummary | string | 否 | 计划期内摘要 |
| resultSummary | string | 否 | 结果总结，仅编辑场景补充 |

#### 工作计划动作接口请求参数

`start`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 工作计划 ID |
| startedAt | string | 否 | `YYYY-MM-DD HH:mm:ss`，不传则服务端取当前时间 |
| progressSummary | string | 否 | 开始执行时补充进展摘要 |

`complete`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 工作计划 ID |
| completedAt | string | 否 | `YYYY-MM-DD HH:mm:ss`，不传则服务端取当前时间 |
| resultSummary | string | 否 | 完成总结 |

`cancel`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 工作计划 ID |
| progressSummary | string | 否 | 取消前的进展说明 |

#### 钉钉来源同步请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| externalInstanceId | string | 是 | 钉钉审批实例 ID |
| sourceTitle | string | 否 | 审批标题 |
| sourceBizType | string | 否 | 来源业务类型，默认 `proposal` |
| sourceBizId | string | 否 | 来源业务 ID |
| externalProcessCode | string | 否 | 审批模板编码 |
| sourceStatus | string | 是 | 审批状态，支持中英文别名，服务端归一化到固定枚举 |
| approvalFinishedAt | string | 否 | `YYYY-MM-DD HH:mm:ss` |
| ownerDepartmentId | number | 新建时是 | 目标所属部门 |
| ownerId | number | 新建时是 | 目标负责人 |
| assigneeIds | number[] | 否 | 协作执行人 |
| planTitle | string | 否 | 生成或覆盖计划标题 |
| planDescription | string | 否 | 生成或覆盖计划说明 |
| priority | string | 否 | 默认 `medium` |
| plannedStartDate | string | 否 | `YYYY-MM-DD` |
| plannedEndDate | string | 否 | `YYYY-MM-DD` |
| sourceSnapshot | object | 否 | 原始审批快照摘要 |

#### 工作计划首期规则

1. 工作计划执行状态与来源审批状态必须拆开维护，禁止使用单一状态同时表达两条语义。
2. `sourceType = dingtalkApproval` 且 `sourceStatus != approved` 时，不允许开始执行。
3. 钉钉回调承接只允许幂等 upsert，不创建真实审批流节点，不发送消息通知。
4. 同一 `externalInstanceId` 最多对应 1 条工作计划；若无实例 ID 冲突，则允许按 `sourceBizType + sourceBizId` 回补既有记录。
5. 计划日期必须满足 `plannedStartDate <= plannedEndDate`。
6. 员工默认仅可查看或执行与本人、本人协作或本人部门范围相关的计划；全量管理由已有高权限角色控制。

### 8. 薪资

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 薪资分页 | `/admin/performance/salary/page` | `POST` | `performance:salary:page` |
| 薪资详情 | `/admin/performance/salary/info` | `GET` | `performance:salary:info` |
| 新增薪资记录 | `/admin/performance/salary/add` | `POST` | `performance:salary:add` |
| 修改薪资记录 | `/admin/performance/salary/update` | `POST` | `performance:salary:update` |
| 确认薪资 | `/admin/performance/salary/confirm` | `POST` | `performance:salary:confirm` |
| 归档薪资 | `/admin/performance/salary/archive` | `POST` | `performance:salary:archive` |
| 薪资调整记录新增 | `/admin/performance/salary/changeAdd` | `POST` | `performance:salary:changeAdd` |

#### 薪资分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| employeeId | number | 否 | 员工 ID |
| periodValue | string | 否 | 期间 |
| status | string | 否 | `draft` / `confirmed` / `archived` |
| effectiveDateStart | string | 否 | 生效开始日期 |
| effectiveDateEnd | string | 否 | 生效结束日期 |

#### 薪资列表返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| assessmentId | number | 关联评估单 ID |
| periodValue | string | 期间 |
| grade | string | 绩效等级 |
| effectiveDate | string | 生效日期 |
| status | string | 状态 |
| baseSalary | number | 仅 HR 可见 |
| performanceBonus | number | 仅 HR 可见 |
| adjustAmount | number | 仅 HR 可见 |
| finalAmount | number | 仅 HR 可见 |

#### 薪资详情返回字段

在列表字段基础上额外返回：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| changeRecords | object[] | 调整记录 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

`changeRecords[]` 对象结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 调整记录 ID |
| salaryId | number | 关联薪资记录 ID |
| beforeAmount | number | 调整前最终金额 |
| adjustAmount | number | 本次调整金额 |
| afterAmount | number | 调整后最终金额 |
| changeReason | string | 调整原因 |
| operatorId | number | 操作人 ID |
| operatorName | string | 操作人姓名 |
| createTime | string | 创建时间 |

#### 新增 / 修改薪资请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 修改时是 | 薪资记录 ID |
| employeeId | number | 是 | 员工 ID |
| assessmentId | number | 否 | 关联评估单 |
| periodValue | string | 是 | 期间 |
| baseSalary | number | 是 | 基础薪资 |
| performanceBonus | number | 是 | 绩效奖金 |
| adjustAmount | number | 是 | 调整金额 |
| finalAmount | number | 是 | 最终金额 |
| grade | string | 否 | 绩效等级快照 |
| effectiveDate | string | 是 | 生效日期 |

#### 薪资动作接口请求参数

`confirm` / `archive`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 薪资记录 ID |

`changeAdd`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| salaryId | number | 是 | 薪资记录 ID |
| adjustAmount | number | 是 | 本次调整金额，可正可负 |
| changeReason | string | 是 | 调整原因 |

#### 薪资模块首期规则

1. 首期薪资模块为真实功能，不是占位页。
2. 只有 `HR` 可以访问薪资管理接口。
3. 首期允许维护真实金额字段：
   - `baseSalary`
   - `performanceBonus`
   - `adjustAmount`
   - `finalAmount`
4. 首期不开放薪资导出接口。
5. 已确认薪资不允许直接修改金额字段，只允许新增调整记录。
6. 首期不做复杂薪资计算引擎，只做结果录入和调整记录管理。
7. `confirm` 只允许 `draft` 状态执行。
8. `archive` 只允许 `confirmed` 状态执行。
9. `changeAdd` 只允许 `confirmed` 状态执行，由服务端计算 `beforeAmount` 和 `afterAmount`。

#### 薪资新增 / 修改业务规则

- `add` 允许 `draft` 数据录入。
- `update` 仅允许修改 `draft` 状态记录。
- 若状态已为 `confirmed`，金额变更必须走 `changeAdd`。
- `changeAdd` 必须记录变更前金额、变更后金额和原因。

### 9. 二期主题 2 导出增强冻结

以下内容只用于二期开发前冻结，不代表当前接口已实现，也不改变首期“仅开放评估与目标导出”的事实。

#### 阶段 1 首批实现边界

1. 当前阶段 1 首批仅允许进入主实现的接口是：
   - `/admin/performance/feedback/export`
   - `/admin/performance/pip/export`
2. `/admin/performance/promotion/export` 和 `/admin/performance/salary/export` 当前仍停留在冻结范围，不能回写为“已实现”或“已开放下载入口”。
3. 在仓库出现主实现代码、对应验证记录和任务卡留痕前，本节只能作为实现边界和契约基线，不能写成“已完成”。

#### 计划中的导出接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 导出环评汇总 | `/admin/performance/feedback/export` | `POST` | `performance:feedback:export` |
| 导出 PIP 摘要 | `/admin/performance/pip/export` | `POST` | `performance:pip:export` |
| 导出晋升摘要 | `/admin/performance/promotion/export` | `POST` | `performance:promotion:export` |
| 导出薪资摘要 | `/admin/performance/salary/export` | `POST` | `performance:salary:export` |

#### 统一冻结规则

1. 文件格式统一冻结为 `xlsx`。
2. 本轮只冻结“单次同步导出”，不新增异步导出中心。
3. 导出上限冻结为：
   - `feedback / pip / promotion`：单次最多 `5000` 行
   - `salary`：单次最多 `2000` 行
4. 超过上限时返回统一错误语义：
   - `code != 1000`
   - `message = 导出结果超过上限，请缩小筛选范围后重试`
5. 无数据时返回统一错误语义：
   - `code != 1000`
   - `message = 当前筛选条件下无可导出数据`
6. 无权限时返回统一错误语义：
   - HTTP `403` 或业务拒绝
   - `message = 无权限导出该数据`
7. 每次导出都必须记录审计留痕，最小字段固定为：
   - `operatorId`
   - `operatorRole`
   - `moduleKey`
   - `filterSummary`
   - `exportFieldVersion`
   - `rowCount`
   - `triggerTime`
   - `resultStatus`

#### 环评导出冻结口径

1. 仅允许导出“环评任务摘要 + 汇总结果”。
2. 不导出 `records[]` 单条反馈记录。
3. `HR` 可导出全量权限范围内数据，部门经理仅可导出所辖部门树内数据。
4. 首批优先实现 `feedback/export`。

#### PIP 导出冻结口径

1. 仅允许导出 PIP 摘要字段，不导出改进目标全文、跟进全文和结果总结全文。
2. `HR` 可导出全量权限范围内数据，部门经理仅可导出所辖部门树内数据。
3. 首批优先实现 `pip/export`。

#### 晋升导出冻结口径

1. 仅允许导出晋升摘要字段，不导出评审记录全文和评审意见全文。
2. `HR` 可导出全量权限范围内数据，部门经理仅可导出所辖部门树内数据。
3. 若后续出现调薪建议类字段，默认不纳入本轮导出范围。

#### 薪资导出冻结口径

1. 本轮冻结的薪资导出仅允许导出“非金额摘要字段”。
2. `salary/export` 仅 `HR` 可用，部门经理和员工无权下载。
3. `baseSalary`、`performanceBonus`、`adjustAmount`、`finalAmount` 继续定义为绝对禁止导出字段。
4. `changeRecords` 中的金额、原因和操作人明细不纳入导出。

## 联调说明

### 前端服务组织

前端建议按当前 `service.xxx.xxx` 方式组织：

- `service.performance.assessment`
- `service.performance.goal`
- `service.performance.indicator`
- `service.performance.feedback`
- `service.performance.pip`
- `service.performance.promotion`
- `service.performance.salary`
- `service.performance.dashboard`

### 页面更新规则

- 列表页成功执行新增、编辑、删除、审批、提交后，统一刷新当前页列表。
- 详情页执行动作后，刷新详情并回写列表状态。
- 驾驶舱只在筛选变化或页面首次进入时请求汇总接口。

## 异常情况

- 评估单不存在：提示“评估单不存在”
- 非法状态提交：提示“当前状态不允许执行该操作”
- 权限不足：前端隐藏按钮，后端仍需返回拒绝
- 薪资数据越权访问：返回无权限，不返回敏感字段

## 二期主题 4：自动建议引擎接口冻结基线（2026-04-17）

本节记录自动建议引擎进入开发前已冻结的接口契约。前端最终采用独立页面还是嵌入现有页面，不改变后端资源、动作语义和权限键。

### 当前冻结结论

- 当前唯一结论：`自动建议引擎接口已冻结，可进入开发`

### 接口资源选择

1. 为承载独立建议记录、状态流转、审计留痕和数据范围裁剪，自动建议统一采用独立 `suggestion` 资源。
2. 现有 `/admin/performance/pip/add` 与 `/admin/performance/promotion/add` 仍然是正式单据创建接口，不解释为建议动作接口。
3. “人工新建正式单据覆盖建议”不新增独立覆盖接口；由建议被 `accepted` 后跳转既有手工创建入口完成，正式单据创建成功后再回写关联关系。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 建议分页 | `/admin/performance/suggestion/page` | `POST` | `performance:suggestion:page` |
| 建议详情 | `/admin/performance/suggestion/info` | `GET` | `performance:suggestion:info` |
| 采用建议 | `/admin/performance/suggestion/accept` | `POST` | `performance:suggestion:accept` |
| 忽略建议 | `/admin/performance/suggestion/ignore` | `POST` | `performance:suggestion:ignore` |
| 驳回建议 | `/admin/performance/suggestion/reject` | `POST` | `performance:suggestion:reject` |
| 撤销建议 | `/admin/performance/suggestion/revoke` | `POST` | `performance:suggestion:revoke` |

### 建议分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| suggestionType | string | 否 | `pip` / `promotion` |
| status | string | 否 | `pending` / `accepted` / `ignored` / `rejected` / `revoked` |
| employeeId | number | 否 | 建议对应员工 |
| departmentId | number | 否 | 部门筛选 |
| assessmentId | number | 否 | 来源评估单 ID |
| periodValue | string | 否 | 期间 |

### 建议详情返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 建议 ID |
| suggestionType | string | `pip` / `promotion` |
| status | string | 建议状态 |
| assessmentId | number | 来源评估单 ID |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| departmentId | number | 部门 ID |
| departmentName | string | 部门名称 |
| periodType | string | 周期类型 |
| periodValue | string | 周期值 |
| triggerLabel | string | 非敏感触发摘要，如“命中 PIP 建议规则” |
| createTime | string | 生成时间 |
| handleTime | string | 最近处理时间 |
| handlerId | number | 最近处理人 ID，可为空 |
| handlerName | string | 最近处理人姓名，可为空 |
| ruleVersion | string | 规则版本 |
| revokeReason | string | 撤销原因，仅 `revoked` 时返回 |
| linkedEntityType | string | 关联正式单据类型，可为空 |
| linkedEntityId | number | 关联正式单据 ID，可为空 |

### 动作接口请求参数

#### 采用 / 忽略 / 驳回

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 建议 ID |

#### 撤销

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 建议 ID |
| revokeReasonCode | string | 是 | `thresholdError` / `assessmentCorrected` / `scopeError` / `duplicateSuggestion` |
| revokeReason | string | 是 | 撤销原因说明 |

### 动作接口行为说明

1. `accept` 只允许从 `pending` 执行；成功后只返回跳转既有手工创建入口所需的预填信息，不自动创建正式 `PIP / 晋升` 单据。
2. `ignore` 只允许从 `pending` 执行，成功后写回处理人和处理时间。
3. `reject` 只允许从 `pending` 执行，成功后写回处理人和处理时间。
4. `revoke` 只允许 `HR` 从 `pending / accepted` 执行，且必须保留撤销原因、规则版本、操作人与操作时间。
5. 若调用方随后通过既有 `pip/add` 或 `promotion/add` 创建正式单据，允许携带 `suggestionId` 作为来源关联字段；该字段只用于回写建议关联关系，不改变正式单据创建主链。

### 业务规则

1. 建议接口永远只返回建议摘要和审计摘要，不返回评分明细、审批意见全文、环评全文、`PIP` 全文、晋升评审全文或薪资金额字段。
2. `HR` 可访问全部建议分页、详情与动作接口。
3. 部门经理只能访问部门树范围内的建议分页、详情和动作接口；执行 `accept` 时还必须具备对应正式单据的创建权限。
4. 员工不允许访问任一建议接口。
5. 非法状态流转、越权处理和跨部门访问统一返回业务失败，`message` 必须明确说明原因。

## 二期主题 5：自动审批流接口冻结基线（2026-04-17）

本节记录自动审批流进入开发前已冻结的接口契约。自动审批流只在 `performance` 模块内服务 `assessment / promotion` 两类对象，不升级为跨模块工作流平台。

### 当前冻结结论

- 当前唯一结论：`自动审批流接口已冻结，可进入开发`

### 接口资源选择

1. 自动审批流统一采用独立 `approval-flow` 资源承载配置、实例详情和节点动作，但仍归属于 `performance` 模块。
2. 发起语义复用既有源业务对象提交接口：
   - `assessment` 复用 `/admin/performance/assessment/submit`
   - `promotion` 复用 `/admin/performance/promotion/submit`
3. 源业务对象既有 `/admin/performance/assessment/approve`、`/admin/performance/assessment/reject`、`/admin/performance/promotion/review` 保留为“未启用自动审批流”或“已回退到手工审批主链”时的兼容入口；当对象存在激活中的自动审批实例时，审批动作统一改走 `approval-flow` 资源。
4. 自动审批流不新增独立通知平台接口；催办只保留业务语义，通知通道仍以站内接口位为上限。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 审批流配置详情 | `/admin/performance/approval-flow/config/info` | `GET` | `performance:approvalFlow:configInfo` |
| 审批流配置保存 | `/admin/performance/approval-flow/config/save` | `POST` | `performance:approvalFlow:configSave` |
| 审批实例详情 | `/admin/performance/approval-flow/info` | `GET` | `performance:approvalFlow:info` |
| 审批通过 | `/admin/performance/approval-flow/approve` | `POST` | `performance:approvalFlow:approve` |
| 审批驳回 | `/admin/performance/approval-flow/reject` | `POST` | `performance:approvalFlow:reject` |
| 当前节点转办 | `/admin/performance/approval-flow/transfer` | `POST` | `performance:approvalFlow:transfer` |
| 发起人撤回 | `/admin/performance/approval-flow/withdraw` | `POST` | `performance:approvalFlow:withdraw` |
| 催办当前节点 | `/admin/performance/approval-flow/remind` | `POST` | `performance:approvalFlow:remind` |
| `HR` 人工指定 / 恢复 | `/admin/performance/approval-flow/resolve` | `POST` | `performance:approvalFlow:resolve` |
| 回退到手工审批主链 | `/admin/performance/approval-flow/fallback` | `POST` | `performance:approvalFlow:fallback` |
| `HR` 强制终止 | `/admin/performance/approval-flow/terminate` | `POST` | `performance:approvalFlow:terminate` |

### 配置接口请求参数

#### `config/info`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| objectType | string | 是 | `assessment` / `promotion` |

#### `config/save`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| objectType | string | 是 | `assessment` / `promotion` |
| enabled | boolean | 是 | 是否启用该对象自动审批流 |
| version | string | 是 | 配置版本号 |
| nodes | object[] | 是 | 至少 1 个顺序节点 |
| nodes[].nodeOrder | number | 是 | 顺序，从 `1` 开始递增 |
| nodes[].nodeCode | string | 是 | 节点编码 |
| nodes[].nodeName | string | 是 | 节点名称 |
| nodes[].resolverType | string | 是 | `specified_user` / `applicant_direct_manager` / `employee_department_manager` / `department_tree_role` / `hr_manual_assign` |
| nodes[].resolverValue | string | 否 | `specified_user` / `department_tree_role` 需要的附加值 |
| nodes[].timeoutHours | number | 否 | 超时阈值；为空表示只做人工催办 |
| nodes[].allowTransfer | boolean | 是 | 当前节点是否允许普通转办 |

### 审批实例详情返回结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| instanceId | number | 审批实例 ID |
| objectType | string | `assessment` / `promotion` |
| objectId | number | 源业务对象 ID |
| sourceStatus | string | 当前源业务对象状态 |
| status | string | `pending_resolution / in_review / manual_pending / approved / rejected / withdrawn / terminated` |
| applicantId | number | 发起人 ID |
| applicantName | string | 发起人姓名 |
| employeeId | number | 业务对象所属员工 ID |
| employeeName | string | 员工姓名 |
| departmentId | number | 部门 ID |
| departmentName | string | 部门名称 |
| configVersion | string | 配置版本快照 |
| currentNodeOrder | number | 当前节点顺序，可为空 |
| currentNodeCode | string | 当前节点编码，可为空 |
| currentNodeName | string | 当前节点名称，可为空 |
| currentApproverId | number | 当前审批人 ID，可为空 |
| currentApproverName | string | 当前审批人姓名，可为空 |
| availableActions | string[] | 当前调用方可执行动作集合 |
| createTime | string | 实例创建时间 |
| updateTime | string | 实例更新时间 |
| nodes | object[] | 节点快照与处理结果 |

#### `nodes[]` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| nodeOrder | number | 节点顺序 |
| nodeCode | string | 节点编码 |
| nodeName | string | 节点名称 |
| resolverType | string | 节点解析方式 |
| approverId | number | 当前或最终审批人，可为空 |
| approverName | string | 当前或最终审批人姓名，可为空 |
| status | string | `pending / approved / rejected / timed_out / transferred / cancelled` |
| actionTime | string | 节点处理或异常时间，可为空 |
| transferReason | string | 转办原因，可为空 |
| comment | string | 审批意见全文，按 `12` 裁剪返回 |

### 动作接口请求参数

#### `approve`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| comment | string | 否 | 审批意见 |

#### `reject`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| comment | string | 是 | 驳回意见，不允许为空 |

#### `transfer`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| toUserId | number | 是 | 转办目标用户 |
| reason | string | 是 | 转办原因 |
| force | boolean | 否 | 仅 `HR` 可传 `true`，表示边界外强制转办 |

#### `withdraw`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| reason | string | 否 | 撤回原因说明 |

#### `remind`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| note | string | 否 | 催办说明 |

#### `resolve`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| assigneeUserId | number | 是 | `HR` 指定的当前审批人 |
| reason | string | 是 | 人工指定 / 恢复原因 |

#### `fallback`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| reason | string | 是 | 回退到手工审批主链原因 |

#### `terminate`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| instanceId | number | 是 | 审批实例 ID |
| reason | string | 是 | 强制终止原因 |

### 业务规则

1. `assessment/submit` 与 `promotion/submit` 在对象已启用自动审批流时，必须创建审批实例并进入 `pending_resolution` 或 `in_review`；未启用时继续保持既有手工主链行为。
2. 同一 `objectType + objectId` 同时只允许 1 个未终态自动审批实例。
3. `approve / reject / transfer` 只允许当前节点当前审批人执行；`reject` 必须提供驳回意见。
4. `transfer` 默认只允许转给当前节点解析边界内候选人；`HR` 才能使用 `force = true` 进行边界外强制转办。
5. `withdraw` 只允许发起人在 `pending_resolution` 或“首节点仍为 `pending` 且尚无人处理”的 `in_review` 状态执行。
6. `remind` 只允许发起人或 `HR` 执行；首期不把催办扩成独立消息平台。
7. `resolve / fallback / terminate` 只允许 `HR` 执行，且必须保留原因。
8. 自动审批流详情不返回评分明细、审批意见以外的源模块全文、环评全文、`PIP` 全文、晋升评审全文和薪资金额字段；字段裁剪以 [12-数据权限与脱敏规则.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/12-数据权限与脱敏规则.md) 为准。
9. 回退到手工审批主链后，源业务对象继续使用现有 `/admin/performance/assessment/approve`、`/admin/performance/assessment/reject`、`/admin/performance/promotion/review` 作为后续审批动作入口。

## 二期主题 7：培训课程管理接口冻结基线（2026-04-18）

本节只冻结培训课程管理进入设计 / 开发前必须遵守的最小接口方向，不代表主题 7 已完成阶段 0 冻结。

### 当前冻结结论

- 当前唯一结论：`培训课程管理接口方向已冻结，且主题7已完成阶段0冻结`

### 资源边界

1. 主题 7 统一资源名固定为 `course`
2. 首批只冻结课程主链，不扩到：
   - `AI 背诵`
   - `AI 练习`
   - `能力地图`
   - `证书管理`
   - `合作伙伴`
3. 首批课程报名列表只保留只读查询，不开放员工报名动作

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 课程分页 | `/admin/performance/course/page` | `POST` | `performance:course:page` |
| 课程详情 | `/admin/performance/course/info` | `GET` | `performance:course:info` |
| 新增课程 | `/admin/performance/course/add` | `POST` | `performance:course:add` |
| 修改课程 | `/admin/performance/course/update` | `POST` | `performance:course:update` |
| 删除课程 | `/admin/performance/course/delete` | `POST` | `performance:course:delete` |
| 课程报名列表 | `/admin/performance/course/enrollmentPage` | `POST` | `performance:course:enrollmentPage` |

### 课程分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 课程标题 / 编码关键字 |
| category | string | 否 | 课程分类 |
| status | string | 否 | `draft / published / closed` |

### 课程新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 课程标题 |
| code | string | 否 | 课程编码，允许为空；如填写必须唯一 |
| category | string | 否 | 课程分类，自由文本 |
| description | string | 否 | 课程描述 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| status | string | 否 | 默认 `draft`；合法值见状态机 |

### 课程详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| title | string | 课程标题 |
| code | string | 课程编码 |
| category | string | 课程分类 |
| description | string | 课程描述 |
| startDate | string \| null | 开始日期 |
| endDate | string \| null | 结束日期 |
| status | string | 课程状态 |
| enrollmentCount | number | 报名人数摘要 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 课程报名列表请求参数与返回最小字段

请求参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| courseId | number | 是 | 课程 ID |
| keyword | string | 否 | 学员姓名关键字 |
| status | string | 否 | 报名状态摘要 |

返回最小字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| userId | number | 学员 ID |
| userName | string | 学员姓名 |
| enrollTime | string | 报名时间 |
| status | string | 报名状态摘要，不参与课程状态流 |
| score | number \| null | 成绩摘要，可为空，不参与课程状态流 |

### 业务规则

1. 删除课程只允许在 `draft` 状态执行。
2. 课程报名列表是课程后台管理视图的一部分，不单独扩展为员工自助报名主链。
3. 首批不返回证书详情、考试记录、背诵 / 练习记录等培训域扩展数据。
4. `published` 状态下只允许修改 `description`、`endDate` 和关闭动作对应的 `status`；其余字段不允许修改。

## 二期主题 8：招聘面试管理接口冻结基线（2026-04-18）

本节只冻结招聘面试管理进入设计 / 开发前必须遵守的最小接口方向，不代表主题 8 已完成阶段 0 冻结。

### 当前冻结结论

- 当前唯一结论：`招聘面试管理接口方向已冻结，且主题8已完成阶段0冻结`

### 资源边界

1. 主题 8 统一资源名固定为 `interview`
2. 首批只冻结面试主链，不扩到：
   - 招聘计划
   - 简历池
   - 职位标准
   - 录用管理
3. 首批不冻结简历附件、录用决策、面试评价全文导出
4. 主题 8 当前已接入仓库级 OpenAPI 主源，`contracts/openapi/xuedao.openapi.json` 中的 `Interview*` schema 是唯一事实源；本节继续冻结接口方向、权限和字段边界。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 面试分页 | `/admin/performance/interview/page` | `POST` | `performance:interview:page` |
| 面试详情 | `/admin/performance/interview/info` | `GET` | `performance:interview:info` |
| 新增面试 | `/admin/performance/interview/add` | `POST` | `performance:interview:add` |
| 修改面试 | `/admin/performance/interview/update` | `POST` | `performance:interview:update` |
| 删除面试 | `/admin/performance/interview/delete` | `POST` | `performance:interview:delete` |

### 面试分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| candidateName | string | 否 | 候选人姓名 |
| position | string | 否 | 职位 |
| status | string | 否 | `scheduled / completed / cancelled` |
| startDate | string | 否 | 面试开始日期 |
| endDate | string | 否 | 面试结束日期 |

### 面试新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| candidateName | string | 是 | 候选人姓名，首批为手工录入文本，不绑定简历池 |
| position | string | 是 | 职位名称 |
| departmentId | number | 否 | 归属部门 |
| interviewerId | number | 是 | 面试官，首批固定为单人字段 |
| interviewDate | string | 是 | 面试时间 |
| interviewType | string | 否 | `technical / behavioral / manager / hr` |
| score | number | 否 | 摘要分数 |
| resumePoolId | number | 否 | 弱引用来源简历 ID，只保留引用关系，不下沉简历全文 |
| recruitPlanId | number | 否 | 弱引用来源招聘计划 ID |
| sourceSnapshot | object | 否 | 来源快照，只允许 ID + 摘要字段 |
| status | string | 否 | 默认 `scheduled` |

### 面试详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| candidateName | string | 候选人姓名 |
| position | string | 职位名称 |
| departmentId | number \| null | 部门 ID |
| interviewerId | number | 面试官 ID |
| interviewerName | string | 面试官姓名 |
| interviewDate | string | 面试时间 |
| interviewType | string \| null | 面试类型 |
| score | number \| null | 分数摘要 |
| resumePoolId | number \| null | 来源简历 ID |
| recruitPlanId | number \| null | 来源招聘计划 ID |
| sourceSnapshot | object \| null | 来源快照，只允许摘要字段 |
| resumePoolSummary | object \| null | 简历来源摘要，不含 phone / email / resumeText |
| recruitPlanSummary | object \| null | 招聘计划来源摘要 |
| status | string | 面试状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. 删除面试只允许在 `scheduled` 状态执行。
2. 允许从 `resumePool / recruitPlan / talentAsset` 带入弱引用来源快照，但下游只保留 ID 与摘要，不建立全文主数据所有权。
3. 首批不返回候选人联系方式、附件、简历全文和评语全文；`resumePoolSummary / sourceSnapshot` 禁止携带 `phone / email`。
4. 首批不开放录用结果接口，也不通过面试资源创建录用单据。
5. 部门经理的数据范围首批按 `departmentId` 判定。
6. `completed / cancelled` 为终态，首批不允许再补录或修改业务字段。

## 二期主题 9：会议管理接口冻结基线（2026-04-18）

本节只冻结会议管理进入设计 / 开发前必须遵守的最小接口方向，不代表主题 9 已完成阶段 0 冻结。

### 当前冻结结论

- 当前唯一结论：`会议管理接口方向已冻结，且主题9已完成阶段0冻结`

### 资源边界

1. 主题 9 统一资源名固定为 `meeting`
2. 首批只冻结会议主链，不扩到：
   - 会议驾驶舱
   - 会议效能聚合实现
   - 外部会议系统真实接入
   - 会议纪要 / 评论全文

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 会议分页 | `/admin/performance/meeting/page` | `POST` | `performance:meeting:page` |
| 会议详情 | `/admin/performance/meeting/info` | `GET` | `performance:meeting:info` |
| 新增会议 | `/admin/performance/meeting/add` | `POST` | `performance:meeting:add` |
| 修改会议 | `/admin/performance/meeting/update` | `POST` | `performance:meeting:update` |
| 删除会议 | `/admin/performance/meeting/delete` | `POST` | `performance:meeting:delete` |
| 会议签到 | `/admin/performance/meeting/checkIn` | `POST` | `performance:meeting:checkIn` |

补充约束：

1. 会议管理当前已并入仓库级 OpenAPI 主源，`page / info / add / update / delete / checkIn` 的请求与响应字段以 `contracts/openapi/xuedao.openapi.json` 为唯一事实源。
2. 前端生成类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 刷新，不再维护第二份 meeting API 类型定义。

### 会议分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 标题 / 编码关键字 |
| status | string | 否 | `scheduled / in_progress / completed / cancelled` |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 会议新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 会议标题 |
| code | string | 否 | 会议编码 |
| type | string | 否 | 会议类型 |
| description | string | 否 | 会议描述 |
| startDate | string | 是 | 开始时间 |
| endDate | string | 是 | 结束时间 |
| location | string | 否 | 地点 |
| organizerId | number | 是 | 组织者 |
| participantIds | number[] | 否 | 参与人列表；经理只能选择本人部门树范围内人员 |
| status | string | 否 | 默认 `scheduled` |

### 会议详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| title | string | 会议标题 |
| code | string \| null | 会议编码 |
| type | string \| null | 会议类型 |
| description | string \| null | 会议描述 |
| startDate | string | 开始时间 |
| endDate | string | 结束时间 |
| location | string \| null | 会议地点 |
| organizerId | number | 组织者 ID |
| organizerName | string | 组织者姓名 |
| participantCount | number | 参与人数摘要；首批不返回参与人名单 |
| status | string | 会议状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 会议签到请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 会议 ID |

### 业务规则

1. 删除会议只允许在 `scheduled` 状态执行。
2. 会议签到只允许在 `in_progress` 状态执行，且首批为会议级签到动作，不做逐参会人签到明细。
3. 首批不返回会议纪要、评论、评分和效能分析全文。
4. 经理创建或编辑会议时，`organizerId / participantIds` 只能落在本人部门树范围内。

## 二期主题 10：合同管理接口冻结基线（2026-04-18）

本节只冻结合同管理进入设计 / 开发前必须遵守的最小接口方向，不代表主题 10 已完成阶段 0 冻结。

### 当前冻结结论

- 当前唯一结论：`合同管理接口方向已冻结`

### 资源边界

1. 主题 10 统一资源名固定为 `contract`
2. 首批只冻结合同台账主链，不扩到：
   - 电子签署
   - PDF 预览
   - 手写签名板
   - 自动审批流
   - 归档下载
3. 首批不冻结合同附件全文、签署轨迹、审批历史和员工侧签收动作

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 合同分页 | `/admin/performance/contract/page` | `POST` | `performance:contract:page` |
| 合同详情 | `/admin/performance/contract/info` | `GET` | `performance:contract:info` |
| 新增合同 | `/admin/performance/contract/add` | `POST` | `performance:contract:add` |
| 修改合同 | `/admin/performance/contract/update` | `POST` | `performance:contract:update` |
| 删除合同 | `/admin/performance/contract/delete` | `POST` | `performance:contract:delete` |

### 合同分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| employeeId | number | 否 | 员工筛选 |
| type | string | 否 | 合同类型筛选 |
| status | string | 否 | `draft / active / expired / terminated` |
| keyword | string | 否 | 标题 / 合同编号关键字 |

### 合同新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| employeeId | number | 是 | 员工 ID |
| type | string | 是 | `full-time / part-time / internship / other` |
| title | string | 否 | 合同标题 |
| contractNumber | string | 否 | 合同编号 |
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期，必须晚于开始日期 |
| probationPeriod | number | 否 | 试用期（月） |
| salary | number | 否 | 薪资金额，仅 `HR` 可见 |
| position | string | 否 | 岗位名称 |
| departmentId | number | 否 | 部门 ID |
| status | string | 否 | 默认 `draft`，只允许 `draft / active / expired / terminated` |

### 合同详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| type | string | 合同类型 |
| title | string | 合同标题 |
| contractNumber | string | 合同编号 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| probationPeriod | number \| null | 试用期（月） |
| salary | number \| null | 薪资金额，仅 `HR` 可见 |
| position | string | 岗位名称 |
| departmentId | number \| null | 部门 ID |
| departmentName | string | 部门名称 |
| status | string | 合同状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. 首批 API 只允许 `page / info / add / update / delete`，不新增 `sign / preview / archive / approve` 等动作。
2. 首批合同状态只表示台账状态，不表示电子签署或审批进度。
3. 删除只允许在 `draft` 状态执行。
4. 首批不与主题 5 自动审批流耦合，不通过合同资源自动创建审批实例。

## 二期主题 11：采购与供应商管理接口冻结基线（2026-04-19）

本节只冻结采购与供应商管理扩容重冻后进入开发 / 联调必须遵守的最小接口方向，不代表主题 11 已自动扩展到付款、对账或库存总账。

### 当前冻结结论

- 当前唯一结论：`采购与供应商管理扩容接口方向已冻结`

### 资源边界

1. 主题 11 允许在同一冻结包内定义以下资源：
   - `purchaseOrder`
   - `supplier`
   - `purchaseReport`
2. `orderManagement` 只是 `purchaseOrder` 的执行视角兼容名，不新增第二主资源。
3. 当前纳入：
   - 采购管理 / 创建采购单 / 采购单详情
   - 询价管理
   - 采购审批
   - 收货管理
   - 采购报表
   - 供应商管理
4. 当前明确不纳入：
   - 采购计划
   - 付款 / 对账
   - 库存总账联动
   - 财务凭证
   - 外部 ERP / 财务系统接入

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 采购订单分页 | `/admin/performance/purchaseOrder/page` | `POST` | `performance:purchaseOrder:page` |
| 采购订单详情 | `/admin/performance/purchaseOrder/info` | `GET` | `performance:purchaseOrder:info` |
| 新增采购订单 | `/admin/performance/purchaseOrder/add` | `POST` | `performance:purchaseOrder:add` |
| 修改采购订单 | `/admin/performance/purchaseOrder/update` | `POST` | `performance:purchaseOrder:update` |
| 删除采购订单 | `/admin/performance/purchaseOrder/delete` | `POST` | `performance:purchaseOrder:delete` |
| 提交询价 | `/admin/performance/purchaseOrder/submitInquiry` | `POST` | `performance:purchaseOrder:submitInquiry` |
| 提交审批 | `/admin/performance/purchaseOrder/submitApproval` | `POST` | `performance:purchaseOrder:submitApproval` |
| 审批通过 | `/admin/performance/purchaseOrder/approve` | `POST` | `performance:purchaseOrder:approve` |
| 审批驳回 | `/admin/performance/purchaseOrder/reject` | `POST` | `performance:purchaseOrder:reject` |
| 收货 | `/admin/performance/purchaseOrder/receive` | `POST` | `performance:purchaseOrder:receive` |
| 关闭 | `/admin/performance/purchaseOrder/close` | `POST` | `performance:purchaseOrder:close` |
| 供应商分页 | `/admin/performance/supplier/page` | `POST` | `performance:supplier:page` |
| 供应商详情 | `/admin/performance/supplier/info` | `GET` | `performance:supplier:info` |
| 新增供应商 | `/admin/performance/supplier/add` | `POST` | `performance:supplier:add` |
| 修改供应商 | `/admin/performance/supplier/update` | `POST` | `performance:supplier:update` |
| 删除供应商 | `/admin/performance/supplier/delete` | `POST` | `performance:supplier:delete` |
| 采购报表汇总 | `/admin/performance/purchaseReport/summary` | `GET` | `performance:purchaseReport:summary` |
| 采购报表趋势 | `/admin/performance/purchaseReport/trend` | `GET` | `performance:purchaseReport:trend` |
| 供应商统计 | `/admin/performance/purchaseReport/supplierStats` | `GET` | `performance:purchaseReport:supplierStats` |

### 采购订单分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 订单编号 / 标题关键字 |
| supplierId | number | 否 | 供应商 ID |
| departmentId | number | 否 | 申请部门 ID；最终仍由服务端按权限裁剪 |
| status | string | 否 | `draft / inquiring / pendingApproval / approved / received / closed / cancelled` |
| startDate | string | 否 | 采购日期开始 |
| endDate | string | 否 | 采购日期结束 |

### 采购订单新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| orderNo | string | 否 | 订单编号；允许为空，如填写需唯一 |
| title | string | 是 | 采购标题 |
| supplierId | number | 是 | 供应商 ID |
| departmentId | number | 是 | 申请部门 ID |
| requesterId | number | 是 | 申请人 ID |
| orderDate | string | 是 | 采购日期 |
| expectedDeliveryDate | string | 否 | 预计到货日期 |
| totalAmount | number | 是 | 订单总金额 |
| currency | string | 否 | 币种，默认 `CNY` |
| remark | string | 否 | 备注 |
| items | array | 否 | 采购明细快照 |
| status | string | 否 | 默认 `draft`；合法值见状态机 |

### 采购订单动作最小请求字段

| 动作 | 最小请求字段 | 说明 |
| --- | --- | --- |
| `submitInquiry` | `id` | `draft -> inquiring` |
| `submitApproval` | `id` | `inquiring -> pendingApproval` |
| `approve` | `id`, `approvalRemark?` | `pendingApproval -> approved` |
| `reject` | `id`, `approvalRemark?` | `pendingApproval -> draft` |
| `receive` | `id`, `receivedQuantity`, `receivedAt?`, `warehouseRemark?` | 支持累计收货 |
| `close` | `id`, `closedReason` | 仅允许 `approved / received` |

### 采购订单详情返回最小字段

在原有基础字段外，允许增加：

- `expectedDeliveryDate`
- `approvedBy`
- `approvedAt`
- `approvalRemark`
- `closedReason`
- `receivedQuantity`
- `receivedAt`
- `items`
- `inquiryRecords`
- `approvalLogs`
- `receiptRecords`

### 供应商分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 供应商名称 / 编码关键字 |
| category | string | 否 | 供应商分类 |
| status | string | 否 | `active / inactive` |

### 供应商新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 供应商名称 |
| code | string | 否 | 供应商编码；允许为空，如填写需唯一 |
| category | string | 否 | 分类，自由文本 |
| contactName | string | 否 | 联系人姓名 |
| contactPhone | string | 否 | 联系电话 |
| contactEmail | string | 否 | 联系邮箱 |
| bankAccount | string | 否 | 银行账户 |
| taxNo | string | 否 | 税号 |
| remark | string | 否 | 备注 |
| status | string | 否 | 默认 `active`；合法值见状态机 |

### 采购报表请求参数

`summary / trend / supplierStats` 只允许查询：

- `startDate`
- `endDate`
- `departmentId?`
- `supplierId?`

### 业务规则

1. `purchaseOrder` 是唯一主资源，`订单管理` 只是执行态视图别名。
2. 删除只允许在 `draft` 状态执行。
3. `reject` 固定 `pendingApproval -> draft`。
4. `receive` 仅允许在 `approved / received` 执行。
5. `close` 仅允许在 `approved / received` 执行，且必须记录关闭原因。
6. 供应商删除只允许在 `inactive` 状态执行，且要求无关联有效采购订单。
7. 当前允许订单明细快照、询价记录、审批轨迹和收货记录的轻量字段，不引入付款记录、对账记录或财务凭证对象。
8. 供应商详情不扩展为结算中心；银行账户、税号、联系人等敏感字段的查看口径以 [12-数据权限与脱敏规则.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/12-数据权限与脱敏规则.md) 为准。

## 二期主题 12：招聘人才资产增强接口冻结基线（2026-04-18）

本节只冻结招聘人才资产增强进入开发前评审前必须遵守的最小接口方向；已迁移 API 的请求/响应结构以 `contracts/openapi/xuedao.openapi.json` 为唯一事实源，本节继续保留业务边界和冻结说明。

### 当前冻结结论

- 当前唯一结论：`招聘人才资产增强接口方向已冻结，且主题12已完成阶段0冻结`
- 当前局部 contract evidence 固定在：
  - `performance-management-system/docs/contracts/current/theme12-openapi.json`
  - `performance-management-system/docs/contracts/current/theme12-producer-contract-model.ts`
  - `performance-management-system/docs/contracts/current/theme12-consumer-api-types.ts`

### 资源边界

1. 主题 12 统一资源名固定为 `talentAsset`
2. “人才库”并入 `talentAsset` 同一资源，当前等价于未入职优秀人才池摘要视图
3. 首批只冻结人才资产摘要主链，不扩到：
   - 主题8面试管理主链
   - 招聘计划
   - 简历池全文管理
   - 录用管理
   - 内部员工人才画像 / 能力画像
4. 首批不冻结联系方式下载、简历附件下载和人才档案导出

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 人才资产分页 | `/admin/performance/talentAsset/page` | `POST` | `performance:talentAsset:page` |
| 人才资产详情 | `/admin/performance/talentAsset/info` | `GET` | `performance:talentAsset:info` |
| 新增人才资产 | `/admin/performance/talentAsset/add` | `POST` | `performance:talentAsset:add` |
| 修改人才资产 | `/admin/performance/talentAsset/update` | `POST` | `performance:talentAsset:update` |
| 删除人才资产 | `/admin/performance/talentAsset/delete` | `POST` | `performance:talentAsset:delete` |

### 人才资产分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 候选人才姓名 / 目标岗位关键词 |
| targetDepartmentId | number | 否 | 目标部门 ID |
| source | string | 否 | 来源摘要 |
| tag | string | 否 | 标签关键字 |
| status | string | 否 | `new / tracking / archived` |

### 人才资产新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| candidateName | string | 是 | 候选人才姓名 |
| targetDepartmentId | number | 是 | 目标部门 ID，经理范围按此字段判定 |
| targetPosition | string | 否 | 目标岗位摘要 |
| source | string | 是 | 来源摘要，首批固定为自由文本 |
| tagList | string[] | 否 | 标签列表，首批固定为自由标签 |
| followUpSummary | string | 否 | 跟进摘要 |
| nextFollowUpDate | string | 否 | 下次跟进日期 |
| status | string | 否 | 默认 `new` |

### 人才资产详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| candidateName | string | 候选人才姓名 |
| targetDepartmentId | number | 目标部门 ID |
| targetDepartmentName | string | 目标部门名称 |
| targetPosition | string \| null | 目标岗位摘要 |
| source | string | 来源摘要 |
| tagList | string[] | 标签列表 |
| followUpSummary | string \| null | 跟进摘要 |
| nextFollowUpDate | string \| null | 下次跟进日期 |
| status | string | 当前状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. “人才库”不再单独定义为第二套资源模型，统一视为 `talentAsset` 的列表 / 详情视图。
2. 首批不新增 `convertToInterview` 接口。
3. 允许从人才资产详情跳转到主题8面试新增页并预填 `candidateName / targetDepartmentId / targetPosition`，但不自动创建面试单。
4. 首批不返回候选人联系方式、简历全文、附件全文和外部简历链接。
5. 删除只允许在 `new` 状态执行。

## 二期主题 13：人才发展与认证增强接口冻结基线（2026-04-18）

本节只冻结人才发展与认证增强进入开发前评审前必须遵守的最小接口方向，不代表主题 13 已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`人才发展与认证增强接口方向已冻结，且主题13已完成阶段0冻结`
- 主题13资源的 API 契约载体已开始迁移到仓库级 OpenAPI；已迁移接口的路径、请求和响应结构以 `contracts/openapi/xuedao.openapi.json` 为准，本节继续定义业务边界与冻结说明。

### 资源边界

1. 主题 13 固定为一个合并主题：`能力地图 + 证书管理`
2. 首批只冻结以下资源：
   - `capabilityModel`
   - `capabilityItem`
   - `capabilityPortrait`
   - `certificate`
3. 首批不扩到：
   - `合作伙伴`
   - 课程学习过程
   - `AI 背诵`
   - `AI 练习`
   - 面试流程
   - 员工端移动化
4. 主题 13 只承载能力模型、能力画像摘要与证书台账，不承载人才主数据、简历池、面试流程和课程主链。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 能力模型分页 | `/admin/performance/capabilityModel/page` | `POST` | `performance:capabilityModel:page` |
| 能力模型详情 | `/admin/performance/capabilityModel/info` | `GET` | `performance:capabilityModel:info` |
| 新增能力模型 | `/admin/performance/capabilityModel/add` | `POST` | `performance:capabilityModel:add` |
| 修改能力模型 | `/admin/performance/capabilityModel/update` | `POST` | `performance:capabilityModel:update` |
| 能力项详情 | `/admin/performance/capabilityItem/info` | `GET` | `performance:capabilityItem:info` |
| 能力画像摘要 | `/admin/performance/capabilityPortrait/info` | `GET` | `performance:capabilityPortrait:info` |
| 证书分页 | `/admin/performance/certificate/page` | `POST` | `performance:certificate:page` |
| 证书详情 | `/admin/performance/certificate/info` | `GET` | `performance:certificate:info` |
| 新增证书 | `/admin/performance/certificate/add` | `POST` | `performance:certificate:add` |
| 修改证书 | `/admin/performance/certificate/update` | `POST` | `performance:certificate:update` |
| 发放证书 | `/admin/performance/certificate/issue` | `POST` | `performance:certificate:issue` |
| 证书记录分页 | `/admin/performance/certificate/recordPage` | `POST` | `performance:certificate:recordPage` |

### 能力模型分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 模型名称 / 编码关键字 |
| category | string | 否 | 模型分类 |
| status | string | 否 | `draft / active / archived` |

### 能力模型新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 模型名称 |
| code | string | 否 | 模型编码；允许为空，如填写需唯一 |
| category | string | 否 | 分类，自由文本 |
| description | string | 否 | 模型说明 |
| status | string | 否 | 默认 `draft`；合法值见状态机 |

### 能力模型详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| name | string | 模型名称 |
| code | string \| null | 模型编码 |
| category | string \| null | 分类 |
| description | string \| null | 模型说明 |
| status | string | 模型状态 |
| itemCount | number | 能力项数量摘要 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 能力项详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| modelId | number | 所属模型 ID |
| name | string | 能力项名称 |
| level | string \| null | 能力等级摘要 |
| description | string \| null | 能力项说明 |
| evidenceHint | string \| null | 推荐佐证摘要 |
| updateTime | string | 更新时间 |

### 能力画像摘要请求参数与返回最小字段

请求参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| employeeId | number | 是 | 员工 ID；首批固定以员工为锚点 |

返回最小字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| departmentId | number \| null | 部门 ID |
| departmentName | string \| null | 部门名称 |
| capabilityTags | string[] | 能力标签摘要 |
| levelSummary | string[] | 等级摘要 |
| certificateCount | number | 已获得证书数量摘要 |
| lastCertifiedAt | string \| null | 最近获得证书时间 |
| updatedAt | string | 摘要更新时间 |

### 证书分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 证书名称 / 编码关键字 |
| category | string | 否 | 证书分类 |
| status | string | 否 | `draft / active / retired` |

### 证书新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 证书名称 |
| code | string | 否 | 证书编码；允许为空，如填写需唯一 |
| category | string | 否 | 证书分类，自由文本 |
| issuer | string | 否 | 发证机构摘要 |
| description | string | 否 | 证书说明 |
| validityMonths | number | 否 | 有效月数，可为空 |
| sourceCourseId | number | 否 | 关联课程 ID，可为空；首批只做引用，不强制校验课程结业 |
| status | string | 否 | 默认 `draft`；合法值见状态机 |

### 发放证书请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| certificateId | number | 是 | 证书 ID |
| employeeId | number | 是 | 获得人员工 ID |
| issuedAt | string | 是 | 发放时间 |
| remark | string | 否 | 发放备注摘要 |
| sourceCourseId | number | 否 | 来源课程 ID，可为空 |

### 证书详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| name | string | 证书名称 |
| code | string \| null | 证书编码 |
| category | string \| null | 证书分类 |
| issuer | string \| null | 发证机构摘要 |
| description | string \| null | 证书说明 |
| validityMonths | number \| null | 有效月数 |
| sourceCourseId | number \| null | 关联课程 ID，可为空 |
| status | string | 证书状态 |
| issuedCount | number | 发放数量摘要 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 证书记录分页请求参数与返回最小字段

请求参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| certificateId | number | 否 | 证书 ID |
| employeeId | number | 否 | 员工 ID |
| status | string | 否 | `issued / revoked` |
| departmentId | number | 否 | 部门筛选；经理只能查本人部门树范围 |

返回最小字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 记录 ID |
| certificateId | number | 证书 ID |
| certificateName | string | 证书名称 |
| employeeId | number | 员工 ID |
| employeeName | string | 员工姓名 |
| departmentId | number \| null | 部门 ID |
| departmentName | string \| null | 部门名称 |
| issuedAt | string | 发放时间 |
| issuedBy | string | 发放人姓名摘要 |
| sourceCourseId | number \| null | 来源课程 ID，可为空 |
| status | string | 记录状态 |

### 业务规则

1. 主题 13 作为合并主题成立，但首批只做“模型 / 台账 / 摘要”，不升级为培训全域或人才全域平台。
2. 能力画像首批只返回摘要，不返回人才档案全文、简历全文、面试评语全文或课程学习过程。
3. 证书首批只做台账和发放记录，不强制绑定课程结业，也不自动根据课程完成状态生成证书。
4. `sourceCourseId` 仅作为可选引用字段，不改变主题 7 课程主链的 owner 和状态规则。
5. 未来若开启主题 12“招聘人才资产增强”，其只负责人才主数据与人才资产主链；主题 13 继续只负责能力模型、证书台账和能力画像摘要。

## 二期主题 14：培训学习与考试增强接口冻结基线（2026-04-18）

本节只冻结主题 14 进入开发前评审必须遵守的最小接口方向，不代表已确定真实 `AI` 供应商、外部题库协议或独立考试平台。

### 当前冻结结论

- 当前唯一结论：`培训学习与考试增强已完成阶段0冻结，可进入开发前评审`

### 资源边界

1. 主题14 固定为课程增强子主题，只允许冻结：
   - `courseRecite`
   - `coursePractice`
   - `courseExam`
2. 主题7“培训课程管理”继续负责课程主链；主题14 只能消费课程关联上下文，不得反向扩写 `course` CRUD 契约。
3. 主题14 不是独立 `AI` 平台；首批不冻结模型、厂商、Prompt 平台、流式通道和音频识别协议。
4. 首批只允许文本型任务提交，不冻结音频、图片、文件上传或多轮对话接口。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 背诵任务分页 | `/admin/performance/courseRecite/page` | `POST` | `performance:courseRecite:page` |
| 背诵任务详情 | `/admin/performance/courseRecite/info` | `GET` | `performance:courseRecite:info` |
| 提交背诵任务 | `/admin/performance/courseRecite/submit` | `POST` | `performance:courseRecite:submit` |
| 练习任务分页 | `/admin/performance/coursePractice/page` | `POST` | `performance:coursePractice:page` |
| 练习任务详情 | `/admin/performance/coursePractice/info` | `GET` | `performance:coursePractice:info` |
| 提交练习任务 | `/admin/performance/coursePractice/submit` | `POST` | `performance:coursePractice:submit` |
| 考试 / 结果摘要 | `/admin/performance/courseExam/summary` | `GET` | `performance:courseExam:summary` |

### 背诵 / 练习分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| courseId | number | 是 | 课程 ID；用于固定课程关联入口 |
| status | string | 否 | `pending / submitted / evaluated` |

### 背诵 / 练习详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| courseId | number | 课程 ID |
| courseTitle | string | 课程标题快照 |
| title | string | 任务标题 |
| taskType | string | `recite` / `practice` |
| promptText | string | 当前任务内容摘要 |
| status | string | 任务状态 |
| latestScore | number \| null | 最近一次结果分数摘要 |
| feedbackSummary | string \| null | 结果摘要 |
| submittedAt | string \| null | 最近一次提交时间 |
| evaluatedAt | string \| null | 最近一次评估时间 |

### 背诵 / 练习提交请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 任务 ID |
| submissionText | string | 是 | 文本提交内容 |

### 考试 / 结果摘要请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| courseId | number | 是 | 课程 ID |

### 考试 / 结果摘要返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| courseId | number | 课程 ID |
| courseTitle | string | 课程标题快照 |
| resultStatus | string | `locked / pending / passed / failed` |
| latestScore | number \| null | 最近一次结果分数摘要 |
| passThreshold | number \| null | 通过阈值摘要 |
| summaryText | string \| null | 结果摘要文案 |
| updatedAt | string \| null | 最近更新时间 |

### 业务规则

1. `courseId` 必须落在当前登录员工本人可访问的课程学习上下文内；不允许借任务接口查看主题7课程后台管理数据。
2. 背诵 / 练习分页与详情只返回当前登录员工本人任务；不开放按员工筛选的管理视图。
3. `submit` 只接收文本型 `submissionText`，首批不开放音频、图片、附件、多轮对话与流式返回。
4. `courseExam/summary` 只返回结果摘要，不返回试卷、题目列表、标准答案或外部 `AI` 推理痕迹。
5. 真实 `AI` 能力调用若后续需要接入，只允许作为服务端内部实现细节；前端和公开接口不暴露厂商、模型、Prompt 模板或调用链字段。

## 二期主题 15：招聘简历池管理接口冻结基线（2026-04-18）

本节只冻结招聘简历池管理进入开发前评审前必须遵守的最小接口方向；已迁移 API 的请求/响应结构以 `contracts/openapi/xuedao.openapi.json` 为唯一事实源，本节继续保留业务边界和冻结说明。

### 当前冻结结论

- 当前唯一结论：`招聘简历池管理接口方向已冻结，且主题15已完成阶段0冻结`
- 当前局部 contract evidence 固定在：
  - `performance-management-system/docs/contracts/current/theme15-openapi.json`
  - `performance-management-system/docs/contracts/current/theme15-producer-contract-model.ts`
  - `performance-management-system/docs/contracts/current/theme15-consumer-api-types.ts`

### 资源边界

1. 主题 15 统一资源名固定为 `resumePool`
2. 首批只冻结招聘简历池主链，不扩到：
   - 招聘计划
   - 职位标准
   - 录用管理
   - 招聘驾驶舱
3. 主题8 继续负责面试主链；`resumePool/createInterview` 只复制候选人快照字段创建面试，不建立强绑定主数据关系
4. 主题12 继续负责人才资产摘要主链；`resumePool/convertToTalentAsset` 只创建摘要人才资产记录，不把主题12改成全文资源
5. 首批不冻结删除接口，不新增 `delete` 能力

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 简历分页 | `/admin/performance/resumePool/page` | `POST` | `performance:resumePool:page` |
| 简历详情 | `/admin/performance/resumePool/info` | `GET` | `performance:resumePool:info` |
| 新增简历 | `/admin/performance/resumePool/add` | `POST` | `performance:resumePool:add` |
| 修改简历 | `/admin/performance/resumePool/update` | `POST` | `performance:resumePool:update` |
| 导入简历 | `/admin/performance/resumePool/import` | `POST` | `performance:resumePool:import` |
| 导出简历 | `/admin/performance/resumePool/export` | `POST` | `performance:resumePool:export` |
| 上传附件 | `/admin/performance/resumePool/uploadAttachment` | `POST` | `performance:resumePool:uploadAttachment` |
| 下载附件 | `/admin/performance/resumePool/downloadAttachment` | `POST` | `performance:resumePool:downloadAttachment` |
| 转人才资产 | `/admin/performance/resumePool/convertToTalentAsset` | `POST` | `performance:resumePool:convertToTalentAsset` |
| 发起面试 | `/admin/performance/resumePool/createInterview` | `POST` | `performance:resumePool:createInterview` |

### 简历分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 候选人姓名 / 手机号 / 邮箱 / 目标岗位关键字 |
| targetDepartmentId | number | 否 | 目标部门 ID；经理范围按此字段判定 |
| status | string | 否 | `new / screening / interviewing / archived` |
| sourceType | string | 否 | `manual / attachment / external / referral` |

### 简历新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| candidateName | string | 是 | 候选人姓名 |
| targetDepartmentId | number | 是 | 目标部门 ID |
| targetPosition | string | 否 | 目标岗位 |
| phone | string | 是 | 手机号，首批返回完整值 |
| email | string | 否 | 邮箱，首批返回完整值 |
| resumeText | string | 是 | 简历全文 |
| sourceType | string | 是 | `manual / attachment / external / referral` |
| sourceRemark | string | 否 | 来源补充说明 |
| externalLink | string | 否 | 外部简历链接，仅 `sourceType=external` 时允许填写 |
| attachmentIdList | number[] | 否 | 已上传附件 ID 列表 |
| status | string | 否 | 默认 `new` |

### 简历详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| candidateName | string | 候选人姓名 |
| targetDepartmentId | number | 目标部门 ID |
| targetDepartmentName | string | 目标部门名称 |
| targetPosition | string \| null | 目标岗位 |
| phone | string | 手机号 |
| email | string \| null | 邮箱 |
| resumeText | string | 简历全文 |
| sourceType | string | 来源类型 |
| sourceRemark | string \| null | 来源补充说明 |
| externalLink | string \| null | 外部简历链接 |
| attachmentSummaryList | object[] | 附件摘要列表，仅包含 `id / name / size / uploadTime` |
| status | string | 当前状态 |
| linkedTalentAssetId | number \| null | 已转人才资产 ID |
| latestInterviewId | number \| null | 最近一次发起面试 ID |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 导入 / 附件 / 转换动作请求字段

| 接口 | 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `import` | fileId | number | 是 | 导入文件 ID |
| `uploadAttachment` | id | number | 是 | 简历 ID |
| `uploadAttachment` | fileId | number | 是 | 附件文件 ID |
| `downloadAttachment` | id | number | 是 | 简历 ID |
| `downloadAttachment` | attachmentId | number | 是 | 附件 ID |
| `convertToTalentAsset` | id | number | 是 | 简历 ID |
| `createInterview` | id | number | 是 | 简历 ID |

### 业务规则

1. `resumePool/export` 与 `resumePool/downloadAttachment` 首批只允许 `HR` 执行。
2. `HR` 与部门经理都可查看完整简历正文、完整联系方式和附件摘要；经理无附件下载权限。
3. 导入、附件上传、转人才资产和发起面试首批都允许 `HR` 与部门经理在本人部门树范围内执行。
4. `createInterview` 创建主题8面试单时，只复制 `candidateName / targetDepartmentId / targetPosition / phone / email` 等候选人快照字段，不建立强绑定主数据关系。
5. `convertToTalentAsset` 创建主题12人才资产时，只复制摘要字段，不把简历全文、联系方式和附件全文写入主题12资源。

## 二期主题 16：招聘计划管理接口冻结基线（2026-04-19）

本节只冻结招聘计划管理进入开发前评审前必须遵守的最小接口方向，不代表主题 16 已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`招聘计划管理接口方向已按备案制扩展版重新冻结，且主题16已完成新一轮阶段0冻结`

### 资源边界

1. 主题 16 统一资源名固定为 `recruitPlan`
2. 首批冻结招聘计划备案制主链，不扩到：
   - 职位标准资源库
   - 简历池
   - 面试主链
   - 录用管理
   - 招聘驾驶舱
   - 审批流引擎
3. 首批导出只开放招聘计划摘要导出，不开放审批轨迹、面试统计和录用结果汇总接口。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 招聘计划分页 | `/admin/performance/recruitPlan/page` | `POST` | `performance:recruitPlan:page` |
| 招聘计划详情 | `/admin/performance/recruitPlan/info` | `GET` | `performance:recruitPlan:info` |
| 新增招聘计划 | `/admin/performance/recruitPlan/add` | `POST` | `performance:recruitPlan:add` |
| 修改招聘计划 | `/admin/performance/recruitPlan/update` | `POST` | `performance:recruitPlan:update` |
| 删除招聘计划 | `/admin/performance/recruitPlan/delete` | `POST` | `performance:recruitPlan:delete` |
| 导入招聘计划 | `/admin/performance/recruitPlan/import` | `POST` | `performance:recruitPlan:import` |
| 导出招聘计划摘要 | `/admin/performance/recruitPlan/export` | `POST` | `performance:recruitPlan:export` |
| 提交招聘计划 | `/admin/performance/recruitPlan/submit` | `POST` | `performance:recruitPlan:submit` |
| 关闭招聘计划 | `/admin/performance/recruitPlan/close` | `POST` | `performance:recruitPlan:close` |
| 作废招聘计划 | `/admin/performance/recruitPlan/void` | `POST` | `performance:recruitPlan:void` |
| 重新开启招聘计划 | `/admin/performance/recruitPlan/reopen` | `POST` | `performance:recruitPlan:reopen` |

### 招聘计划分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 计划标题 / 目标岗位关键字 |
| targetDepartmentId | number | 否 | 目标部门 ID |
| status | string | 否 | `draft / active / voided / closed` |
| startDate | string | 否 | 计划开始日期 |
| endDate | string | 否 | 计划结束日期 |

### 招聘计划新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 招聘计划标题 |
| targetDepartmentId | number | 是 | 目标部门 ID，经理范围按此字段判定 |
| positionName | string | 是 | 目标岗位名称 |
| headcount | number | 是 | 计划招聘人数 |
| startDate | string | 是 | 计划开始日期 |
| endDate | string | 是 | 计划结束日期 |
| recruiterId | number | 否 | 负责人 ID |
| requirementSummary | string | 否 | 需求摘要 |
| jobStandardId | number | 否 | 可选职位标准引用 ID，只允许弱引用 |
| status | string | 否 | 默认 `draft`，首批不允许手填非 `draft` 值 |

### 招聘计划扩展动作请求字段

| 接口 | 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `delete` | id | number | 是 | 招聘计划 ID |
| `import` | fileId | number | 是 | 导入文件 ID |
| `submit` | id | number | 是 | 招聘计划 ID |
| `close` | id | number | 是 | 招聘计划 ID |
| `void` | id | number | 是 | 招聘计划 ID |
| `reopen` | id | number | 是 | 招聘计划 ID |

### 招聘计划导出请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 与分页筛选一致 |
| targetDepartmentId | number | 否 | 与分页筛选一致 |
| status | string | 否 | `draft / active / voided / closed` |
| startDate | string | 否 | 与分页筛选一致 |
| endDate | string | 否 | 与分页筛选一致 |

### 招聘计划详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| title | string | 招聘计划标题 |
| targetDepartmentId | number | 目标部门 ID |
| targetDepartmentName | string | 目标部门名称 |
| positionName | string | 目标岗位名称 |
| headcount | number | 计划招聘人数 |
| startDate | string | 计划开始日期 |
| endDate | string | 计划结束日期 |
| recruiterId | number \| null | 负责人 ID |
| recruiterName | string \| null | 负责人姓名 |
| requirementSummary | string \| null | 需求摘要 |
| jobStandardId | number \| null | 可选职位标准引用 ID |
| jobStandardSummary | object \| null | 只读来源摘要，首批固定为职位标准轻量快照 |
| jobStandardSnapshot | object \| null | 只读来源快照，字段与 `jobStandardSummary` 对齐 |
| status | string | 当前状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. 新增招聘计划首批允许手工创建，不要求必须绑定职位标准。
2. `submit` 表示备案生效，只把计划从 `draft` 推进到 `active`，不引入审批流、审批节点和审批意见对象。
3. `delete` 只允许 `draft` 且无下游引用时执行。
4. `import` 只允许导入招聘计划摘要模板字段，导入成功后统一落为 `draft`。
5. `export` 固定导出招聘计划摘要列，不导出联系方式、预算、Offer、审批或跨主题明细。
6. `void` 只允许 `active -> voided`；`reopen` 只允许 `closed / voided -> active`。
7. `close` 只负责关闭计划，不自动关闭简历池、面试或录用主链，也不反向改写主题8 / 15 / 18状态。
8. `recruitPlan/info` 首批不返回简历全文、候选人联系方式、面试评语全文、录用决策全文或预算明细对象。
9. 列表 / 详情 / 导出允许返回 `jobStandardId + jobStandardSummary + jobStandardSnapshot` 作为弱引用证据，但不得直接内联职位标准全文对象。
10. `recruitPlan` 当前已进入仓库级 API 契约迁移范围；前端与移动端类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 基于 `contracts/openapi/xuedao.openapi.json` 刷新，不再维护第二份手写 API 契约。

## 二期主题 17：职位标准管理接口冻结基线（2026-04-19）

本节只冻结职位标准管理进入开发前评审前必须遵守的最小接口方向，不代表主题 17 已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`职位标准管理接口方向已冻结，且主题17已完成阶段0冻结`

### 资源边界

1. 主题 17 统一资源名固定为 `jobStandard`
2. 首批只冻结职位标准主链，不扩到：
   - 招聘计划主链
   - 简历池
   - 面试排期与结果流转
   - 录用管理
   - 培训课程、能力地图和证书管理
3. 首批不冻结删除、导出、评价模板设计器、题库化维度配置和审批流接口。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 职位标准分页 | `/admin/performance/jobStandard/page` | `POST` | `performance:jobStandard:page` |
| 职位标准详情 | `/admin/performance/jobStandard/info` | `GET` | `performance:jobStandard:info` |
| 新增职位标准 | `/admin/performance/jobStandard/add` | `POST` | `performance:jobStandard:add` |
| 修改职位标准 | `/admin/performance/jobStandard/update` | `POST` | `performance:jobStandard:update` |
| 更新职位标准状态 | `/admin/performance/jobStandard/setStatus` | `POST` | `performance:jobStandard:setStatus` |

### 职位标准分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 岗位名称 / 任职要求关键字 |
| targetDepartmentId | number | 否 | 目标部门 ID |
| status | string | 否 | `draft / active / inactive` |

### 职位标准新增 / 修改请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| positionName | string | 是 | 岗位名称 |
| targetDepartmentId | number | 是 | 目标部门 ID |
| jobLevel | string | 否 | 岗位级别摘要 |
| profileSummary | string | 否 | 岗位画像摘要 |
| requirementSummary | string | 否 | 任职要求摘要 |
| skillTagList | string[] | 否 | 技能标签摘要 |
| interviewTemplateSummary | string | 否 | 面试评价模板摘要 |
| status | string | 否 | 默认 `draft` |

### 职位标准详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| positionName | string | 岗位名称 |
| targetDepartmentId | number | 目标部门 ID |
| targetDepartmentName | string | 目标部门名称 |
| jobLevel | string \| null | 岗位级别摘要 |
| profileSummary | string \| null | 岗位画像摘要 |
| requirementSummary | string \| null | 任职要求摘要 |
| skillTagList | string[] | 技能标签摘要 |
| interviewTemplateSummary | string \| null | 面试评价模板摘要 |
| status | string | 当前状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. 首批把岗位画像、任职要求和面试评价模板都冻结为摘要字段，不引入独立配置子资源。
2. 首批不要求招聘计划、面试或录用必须引用 `jobStandard`，相关主题只允许后续按弱引用或快照方式扩展，不能反向把主题17做成流程前置中心。
3. `setStatus` 只负责 `draft / active / inactive` 的状态切换，不自动改写招聘计划、面试或录用对象。
4. `jobStandard/info` 首批不返回简历全文、候选人联系方式、面试评语全文、录用决策全文和薪资区间对象。
5. 首批不开放 `delete` 动作；若后续要增加删除或引用校验，必须重新打开阶段0冻结。
6. `jobStandard` 当前已进入仓库级 API 契约迁移范围；前端与移动端类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 基于 `contracts/openapi/xuedao.openapi.json` 刷新，不再维护第二份手写 API 契约。

## 二期主题 18：录用管理接口冻结基线（2026-04-21）

本节只冻结录用管理进入开发前评审前必须遵守的最小接口方向，不代表主题 18 会扩展到入职、人事、合同或跨主题自动反写。

### 当前冻结结论

- 当前唯一结论：`录用管理接口方向已冻结，且主题18已纳入仓库级 OpenAPI 主源`

### 资源边界

1. 主题 18 统一资源名固定为 `hiring`
2. 首批只冻结录用主链，不扩到：
   - 入职管理
   - 员工主数据
   - 合同签署或 Offer PDF
   - 简历附件下载
   - 面试评语全文
   - 跨主题自动状态编排
3. 首批不冻结 `delete`、`export`、`createEmployee`、`syncTalentAssetStatus` 等扩展接口。
4. 主题 18 当前已接入仓库级 OpenAPI 主源，`contracts/openapi/xuedao.openapi.json` 中的 `Hiring*` schema 是唯一事实源；本节继续冻结接口方向、字段边界和业务规则。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 录用分页 | `/admin/performance/hiring/page` | `POST` | `performance:hiring:page` |
| 录用详情 | `/admin/performance/hiring/info` | `GET` | `performance:hiring:info` |
| 新增录用 | `/admin/performance/hiring/add` | `POST` | `performance:hiring:add` |
| 更新录用状态 | `/admin/performance/hiring/updateStatus` | `POST` | `performance:hiring:updateStatus` |
| 关闭录用 | `/admin/performance/hiring/close` | `POST` | `performance:hiring:close` |

### 录用分页请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 是 | 页码 |
| size | number | 是 | 页大小 |
| keyword | string | 否 | 候选人姓名 / 目标岗位关键字 |
| targetDepartmentId | number | 否 | 目标部门 ID；经理范围按此字段判定 |
| status | string | 否 | `offered / accepted / rejected / closed` |
| sourceType | string | 否 | `manual / resumePool / talentAsset / interview` |

### 录用新增请求字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| candidateName | string | 是 | 候选人姓名 |
| targetDepartmentId | number | 是 | 目标部门 ID |
| targetPosition | string | 否 | 目标岗位 |
| sourceType | string | 否 | 来源类型；首批允许手工或弱引用来源 |
| sourceId | number | 否 | 来源资源 ID |
| sourceStatusSnapshot | string | 否 | 来源状态快照文本 |
| sourceSnapshot | object \| string | 否 | 来源摘要 / 快照，只允许 ID + 摘要字段 |
| interviewId | number | 否 | 弱引用来源面试 ID |
| resumePoolId | number | 否 | 弱引用来源简历 ID |
| recruitPlanId | number | 否 | 弱引用来源招聘计划 ID |
| hiringDecision | string | 否 | 录用决策正文；首批兼容 `decisionContent` 入参 |
| decisionContent | string | 否 | 兼容字段，最终与 `hiringDecision` 收敛为同一语义 |
| status | string | 否 | 若传入仅允许 `offered` |

### 录用状态动作请求字段

| 接口 | 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `updateStatus` | id | number | 是 | 录用单 ID |
| `updateStatus` | status | string | 是 | 仅允许 `accepted / rejected` |
| `close` | id | number | 是 | 录用单 ID |
| `close` | closeReason | string | 是 | 关闭原因 |

### 录用详情返回最小字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 主键 |
| candidateName | string | 候选人姓名 |
| targetDepartmentId | number | 目标部门 ID |
| targetDepartmentName | string \| null | 目标部门名称 |
| targetPosition | string \| null | 目标岗位 |
| sourceType | string \| null | 来源类型 |
| sourceId | number \| null | 来源资源 ID |
| sourceStatusSnapshot | string \| null | 来源状态快照文本 |
| sourceSnapshot | object \| string \| null | 来源摘要 / 快照 |
| interviewId | number \| null | 来源面试 ID |
| resumePoolId | number \| null | 来源简历 ID |
| recruitPlanId | number \| null | 来源招聘计划 ID |
| interviewSummary / interviewSnapshot | object \| null | 面试摘要 / 快照，只允许轻量字段 |
| resumePoolSummary / resumePoolSnapshot | object \| null | 简历摘要 / 快照，只允许 `id / candidateName / targetDepartmentId / targetDepartmentName / targetPosition / status / recruitPlanId / jobStandardId` |
| recruitPlanSummary / recruitPlanSnapshot | object \| null | 招聘计划摘要 / 快照 |
| hiringDecision | string \| null | 录用决策正文 |
| decisionContent | string \| null | 与 `hiringDecision` 同语义的兼容字段 |
| status | string | 当前状态 |
| offeredAt / acceptedAt / rejectedAt / closedAt | string \| null | 状态时间线 |
| closeReason | string \| null | 关闭原因 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. `add` 首批允许手工创建，不要求必须绑定 `interviewId`。
2. `add` 成功后统一落为 `offered`，不开放 `draft`。
3. `updateStatus` 只允许 `offered -> accepted` 或 `offered -> rejected`。
4. `close` 只允许 `offered -> closed`，且必须记录 `closeReason`。
5. `accepted / rejected / closed` 都是终态，首批不允许重新打开或回退。
6. 列表 / 详情允许返回 `interviewId + resumePoolId + recruitPlanId + summary/snapshot`，但不得直接内联简历联系方式、简历全文、附件下载地址或面试评语全文。
7. `hiring` 不自动改写 `resumePool / talentAsset / interview` 主状态，也不创建员工、人事、合同记录。
8. `hiring` 当前已进入仓库级 API 契约迁移范围；前端与移动端类型必须由 `node ./scripts/openapi-contract-sync.mjs --write` 基于 `contracts/openapi/xuedao.openapi.json` 刷新，不再维护第二份手写 API 契约。

## 招聘中心跨模块整合接口协同基线（2026-04-19）

本节只冻结招聘中心跨模块整合进入设计前必须遵守的最小协同契约，不代表当前仓库已经实现统一入口或跨主题引用写链。

### 当前冻结结论

- 当前唯一结论：`招聘中心跨模块整合接口协同基线已冻结，允许按统一入口 + 独立资源 + 单向引用 + 摘要/快照进入跨主题设计`

### 统一入口与资源边界

1. 一级业务入口语义固定为 `recruitment-center`，建议聚合路由固定为 `/performance/recruitment-center`。
2. 统一入口只承担：
   - 领域导航
   - 聚合视图
   - 跨模块跳转
   - 来源引用查看
3. 统一入口不承担：
   - 替代各子资源原始接口
   - 合并各子资源状态机
   - 作为新的跨主题超级写入 API
4. 招聘中心子资源继续保持独立，不合并为单表或单资源：
   - `talentAsset`
   - `recruitPlan`
   - `jobStandard`
   - `resumePool`
   - `interview`
   - `hiring`

### 首批允许的引用字段

| 来源资源 | 引用字段 | 指向资源 | 说明 |
| --- | --- | --- | --- |
| `recruitPlan` | `jobStandardId` | `jobStandard` | 招聘计划引用目标职位标准 |
| `resumePool` | `recruitPlanId` | `recruitPlan` | 简历归属到某个招聘计划 |
| `resumePool` | `jobStandardId` | `jobStandard` | 简历与岗位标准建立来源对应 |
| `interview` | `resumePoolId` | `resumePool` | 面试引用候选人简历主记录 |
| `interview` | `recruitPlanId` | `recruitPlan` | 面试回溯招聘计划来源 |
| `hiring` | `interviewId` | `interview` | 录用单引用来源面试 |
| `hiring` | `resumePoolId` | `resumePool` | 录用单引用来源简历 |
| `hiring` | `recruitPlanId` | `recruitPlan` | 录用单回溯招聘计划来源 |

### 引用返回与禁止事项

1. 首批统一采用：`引用 ID + 来源摘要 + 来源快照`。
2. 下游列表 / 详情允许返回来源摘要或来源快照，但不得直接内联上游全文对象。
3. `talentAsset` 当前保留在招聘中心统一入口中展示和跳转，但首批不冻结为强引用必经节点。
4. 禁止 `recruitPlan submit / close / void / reopen` 自动改写：
   - `resumePool.status`
   - `interview.status`
   - `hiring.status`
5. 禁止 `hiring` 的状态动作自动改写：
   - `resumePool`
   - `talentAsset`
   - `interview`
6. 禁止招聘中心统一入口直接调用多个子资源写接口做事务编排。

## 二期主题 19：班主任化 V0.1 - 班主任渠道合作管理接口冻结基线（2026-04-19）

本节只冻结班主任化 V0.1 进入开发前评审前必须遵守的最小接口方向，不代表主题19已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`班主任化 V0.1 接口方向已冻结，且主题19已完成阶段0冻结`

### 资源边界

1. 主题19 统一资源名固定为：
   - `teacherInfo`
   - `teacherFollow`
   - `teacherCooperation`
   - `teacherClass`
   - `teacherDashboard`
   - `teacherTodo`
2. 首批只冻结 `资源录入 -> 跟进 -> 合作 -> 建班级 -> 看板 / 待办` 主链，不扩到：
   - 代理体系
   - 绩效核算
   - 复杂报表
   - 渠道结算
   - Excel 导入导出
3. 首批不冻结上传附件、批量导入、渠道结算和绩效汇总接口。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 班主任资源分页 | `/admin/performance/teacherInfo/page` | `POST` | `performance:teacherInfo:page` |
| 班主任资源详情 | `/admin/performance/teacherInfo/info` | `GET` | `performance:teacherInfo:info` |
| 新增班主任资源 | `/admin/performance/teacherInfo/add` | `POST` | `performance:teacherInfo:add` |
| 编辑班主任资源 | `/admin/performance/teacherInfo/update` | `POST` | `performance:teacherInfo:update` |
| 分配资源归属 | `/admin/performance/teacherInfo/assign` | `POST` | `performance:teacherInfo:assign` |
| 更新合作状态 | `/admin/performance/teacherInfo/updateStatus` | `POST` | `performance:teacherInfo:updateStatus` |
| 跟进记录分页 | `/admin/performance/teacherFollow/page` | `POST` | `performance:teacherFollow:page` |
| 新增跟进记录 | `/admin/performance/teacherFollow/add` | `POST` | `performance:teacherFollow:add` |
| 标记合作 | `/admin/performance/teacherCooperation/mark` | `POST` | `performance:teacherCooperation:mark` |
| 班级分页 | `/admin/performance/teacherClass/page` | `POST` | `performance:teacherClass:page` |
| 班级详情 | `/admin/performance/teacherClass/info` | `GET` | `performance:teacherClass:info` |
| 新增班级 | `/admin/performance/teacherClass/add` | `POST` | `performance:teacherClass:add` |
| 编辑班级 | `/admin/performance/teacherClass/update` | `POST` | `performance:teacherClass:update` |
| 删除班级 | `/admin/performance/teacherClass/delete` | `POST` | `performance:teacherClass:delete` |
| 首页看板汇总 | `/admin/performance/teacherDashboard/summary` | `GET` | `performance:teacherDashboard:summary` |
| 我的待跟进分页 | `/admin/performance/teacherTodo/page` | `POST` | `performance:teacherTodo:page` |

### 业务规则

1. 新增资源默认写入 `uncontacted`，首批不允许手工直接创建为 `partnered`。
2. 首次新增跟进后，若资源处于 `uncontacted`，可推进到 `contacted`。
3. `mark` 只允许在至少存在一条跟进记录后，把资源从 `contacted / negotiating` 推进到 `partnered`。
4. 只允许对 `partnered` 的班主任创建班级。
5. `teacherDashboard/summary` 与 `teacherTodo/page` 只返回当前权限范围内的聚合和待办，不返回跨范围原始明细。
6. 首批不开放 `import / export / performance / settlement / agent` 等扩展动作。

## 采购&资产 Phase 1：物资管理接口基线（2026-04-19）

本节只冻结物资管理进入开发前评审前必须遵守的最小接口方向，不代表 Phase 1 已扩展到审批流、盘点或报表。

### 当前冻结结论

- 当前唯一结论：`物资管理 Phase 1 只冻结 catalog / stock / inbound / issue 四条主链，不扩审批流、库存调整、盘点或报表导出`

### 资源边界

1. Phase 1 统一资源名固定为：
   - `materialCatalog`
   - `materialStock`
   - `materialInbound`
   - `materialIssue`
2. 首批只冻结物资侧基础台账、库存可见性、入库闭环和领用闭环，不扩到：
   - 借还审批流
   - 库存盘点
   - 物资报表
   - 采购审批中心
3. `materialCatalog` 作为 `stock / inbound / issue` 的单一来源，不允许绕开目录直接写库存或单据。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 物资台账分页 | `/admin/performance/materialCatalog/page` | `POST` | `performance:materialCatalog:page` |
| 物资台账详情 | `/admin/performance/materialCatalog/info` | `GET` | `performance:materialCatalog:info` |
| 新增物资 | `/admin/performance/materialCatalog/add` | `POST` | `performance:materialCatalog:add` |
| 编辑物资 | `/admin/performance/materialCatalog/update` | `POST` | `performance:materialCatalog:update` |
| 更新物资状态 | `/admin/performance/materialCatalog/updateStatus` | `POST` | `performance:materialCatalog:updateStatus` |
| 删除物资 | `/admin/performance/materialCatalog/delete` | `POST` | `performance:materialCatalog:delete` |
| 物资库存分页 | `/admin/performance/materialStock/page` | `POST` | `performance:materialStock:page` |
| 物资库存详情 | `/admin/performance/materialStock/info` | `GET` | `performance:materialStock:info` |
| 物资库存汇总 | `/admin/performance/materialStock/summary` | `GET` | `performance:materialStock:summary` |
| 物资入库分页 | `/admin/performance/materialInbound/page` | `POST` | `performance:materialInbound:page` |
| 物资入库详情 | `/admin/performance/materialInbound/info` | `GET` | `performance:materialInbound:info` |
| 新增物资入库单 | `/admin/performance/materialInbound/add` | `POST` | `performance:materialInbound:add` |
| 编辑物资入库单 | `/admin/performance/materialInbound/update` | `POST` | `performance:materialInbound:update` |
| 提交物资入库单 | `/admin/performance/materialInbound/submit` | `POST` | `performance:materialInbound:submit` |
| 确认物资入库 | `/admin/performance/materialInbound/receive` | `POST` | `performance:materialInbound:receive` |
| 取消物资入库单 | `/admin/performance/materialInbound/cancel` | `POST` | `performance:materialInbound:cancel` |
| 物资领用分页 | `/admin/performance/materialIssue/page` | `POST` | `performance:materialIssue:page` |
| 物资领用详情 | `/admin/performance/materialIssue/info` | `GET` | `performance:materialIssue:info` |
| 新增物资领用单 | `/admin/performance/materialIssue/add` | `POST` | `performance:materialIssue:add` |
| 编辑物资领用单 | `/admin/performance/materialIssue/update` | `POST` | `performance:materialIssue:update` |
| 提交物资领用单 | `/admin/performance/materialIssue/submit` | `POST` | `performance:materialIssue:submit` |
| 确认物资出库 | `/admin/performance/materialIssue/issue` | `POST` | `performance:materialIssue:issue` |
| 取消物资领用单 | `/admin/performance/materialIssue/cancel` | `POST` | `performance:materialIssue:cancel` |

### 业务规则

1. `materialCatalog/updateStatus` 只允许更新目录状态，不允许借此修改库存数量。
2. `materialStock` Phase 1 保持只读，只提供 `page / info / summary`，不开放手工调账接口。
3. `materialInbound/receive` 必须回写库存主记录，不允许只推进单据状态。
4. `materialIssue/issue` 必须校验库存充足后才能出库。
5. 当前 Phase 1 不新增物资借还审批资源，也不提前虚写 `approve / reject / return` 接口。

## 二期主题 20：资产管理全生命周期接口冻结基线（2026-04-19）

本节只冻结资产管理进入开发前评审前必须遵守的最小接口方向，不代表主题20已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`资产管理全生命周期接口方向已冻结，且主题20已完成阶段0冻结`

### 资源边界

1. 主题20 统一资源名固定为：
   - `assetInfo`
   - `assetAssignment`
   - `assetMaintenance`
   - `assetProcurement`
   - `assetTransfer`
   - `assetInventory`
   - `assetDepreciation`
   - `assetDisposal`
   - `assetDashboard`
   - `assetReport`
2. 首批只冻结资产侧全生命周期主链，不扩到：
   - 供应商主数据中心
   - 采购订单审批全流程
   - 财务总账 / 凭证
   - RFID / IoT / 移动扫码
3. 主题20允许弱引用 `purchaseOrderId / supplierId`，但不接管主题11主链。

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 资产首页汇总 | `/admin/performance/assetDashboard/summary` | `GET` | `performance:assetDashboard:summary` |
| 资产台账分页 | `/admin/performance/assetInfo/page` | `POST` | `performance:assetInfo:page` |
| 资产详情 | `/admin/performance/assetInfo/info` | `GET` | `performance:assetInfo:info` |
| 新增资产 | `/admin/performance/assetInfo/add` | `POST` | `performance:assetInfo:add` |
| 编辑资产 | `/admin/performance/assetInfo/update` | `POST` | `performance:assetInfo:update` |
| 删除资产 | `/admin/performance/assetInfo/delete` | `POST` | `performance:assetInfo:delete` |
| 更新资产状态 | `/admin/performance/assetInfo/updateStatus` | `POST` | `performance:assetInfo:updateStatus` |
| 领用记录分页 | `/admin/performance/assetAssignment/page` | `POST` | `performance:assetAssignment:page` |
| 新增领用记录 | `/admin/performance/assetAssignment/add` | `POST` | `performance:assetAssignment:add` |
| 编辑领用记录 | `/admin/performance/assetAssignment/update` | `POST` | `performance:assetAssignment:update` |
| 归还资产 | `/admin/performance/assetAssignment/return` | `POST` | `performance:assetAssignment:return` |
| 标记丢失 | `/admin/performance/assetAssignment/markLost` | `POST` | `performance:assetAssignment:markLost` |
| 删除领用记录 | `/admin/performance/assetAssignment/delete` | `POST` | `performance:assetAssignment:delete` |
| 维护记录分页 | `/admin/performance/assetMaintenance/page` | `POST` | `performance:assetMaintenance:page` |
| 新增维护记录 | `/admin/performance/assetMaintenance/add` | `POST` | `performance:assetMaintenance:add` |
| 编辑维护记录 | `/admin/performance/assetMaintenance/update` | `POST` | `performance:assetMaintenance:update` |
| 完成维护 | `/admin/performance/assetMaintenance/complete` | `POST` | `performance:assetMaintenance:complete` |
| 取消维护 | `/admin/performance/assetMaintenance/cancel` | `POST` | `performance:assetMaintenance:cancel` |
| 删除维护记录 | `/admin/performance/assetMaintenance/delete` | `POST` | `performance:assetMaintenance:delete` |
| 采购入库分页 | `/admin/performance/assetProcurement/page` | `POST` | `performance:assetProcurement:page` |
| 采购入库详情 | `/admin/performance/assetProcurement/info` | `GET` | `performance:assetProcurement:info` |
| 新增采购入库单 | `/admin/performance/assetProcurement/add` | `POST` | `performance:assetProcurement:add` |
| 编辑采购入库单 | `/admin/performance/assetProcurement/update` | `POST` | `performance:assetProcurement:update` |
| 提交采购入库单 | `/admin/performance/assetProcurement/submit` | `POST` | `performance:assetProcurement:submit` |
| 确认入库 | `/admin/performance/assetProcurement/receive` | `POST` | `performance:assetProcurement:receive` |
| 取消采购入库单 | `/admin/performance/assetProcurement/cancel` | `POST` | `performance:assetProcurement:cancel` |
| 调拨单分页 | `/admin/performance/assetTransfer/page` | `POST` | `performance:assetTransfer:page` |
| 调拨单详情 | `/admin/performance/assetTransfer/info` | `GET` | `performance:assetTransfer:info` |
| 新增调拨单 | `/admin/performance/assetTransfer/add` | `POST` | `performance:assetTransfer:add` |
| 编辑调拨单 | `/admin/performance/assetTransfer/update` | `POST` | `performance:assetTransfer:update` |
| 提交调拨单 | `/admin/performance/assetTransfer/submit` | `POST` | `performance:assetTransfer:submit` |
| 完成调拨 | `/admin/performance/assetTransfer/complete` | `POST` | `performance:assetTransfer:complete` |
| 取消调拨单 | `/admin/performance/assetTransfer/cancel` | `POST` | `performance:assetTransfer:cancel` |
| 盘点单分页 | `/admin/performance/assetInventory/page` | `POST` | `performance:assetInventory:page` |
| 盘点单详情 | `/admin/performance/assetInventory/info` | `GET` | `performance:assetInventory:info` |
| 新增盘点单 | `/admin/performance/assetInventory/add` | `POST` | `performance:assetInventory:add` |
| 编辑盘点单 | `/admin/performance/assetInventory/update` | `POST` | `performance:assetInventory:update` |
| 开始盘点 | `/admin/performance/assetInventory/start` | `POST` | `performance:assetInventory:start` |
| 完成盘点 | `/admin/performance/assetInventory/complete` | `POST` | `performance:assetInventory:complete` |
| 关闭盘点 | `/admin/performance/assetInventory/close` | `POST` | `performance:assetInventory:close` |
| 折旧分页 | `/admin/performance/assetDepreciation/page` | `POST` | `performance:assetDepreciation:page` |
| 折旧汇总 | `/admin/performance/assetDepreciation/summary` | `GET` | `performance:assetDepreciation:summary` |
| 折旧重算 | `/admin/performance/assetDepreciation/recalculate` | `POST` | `performance:assetDepreciation:recalculate` |
| 报废单分页 | `/admin/performance/assetDisposal/page` | `POST` | `performance:assetDisposal:page` |
| 报废单详情 | `/admin/performance/assetDisposal/info` | `GET` | `performance:assetDisposal:info` |
| 新增报废单 | `/admin/performance/assetDisposal/add` | `POST` | `performance:assetDisposal:add` |
| 编辑报废单 | `/admin/performance/assetDisposal/update` | `POST` | `performance:assetDisposal:update` |
| 提交报废单 | `/admin/performance/assetDisposal/submit` | `POST` | `performance:assetDisposal:submit` |
| 审批报废单 | `/admin/performance/assetDisposal/approve` | `POST` | `performance:assetDisposal:approve` |
| 执行报废 | `/admin/performance/assetDisposal/execute` | `POST` | `performance:assetDisposal:execute` |
| 取消报废单 | `/admin/performance/assetDisposal/cancel` | `POST` | `performance:assetDisposal:cancel` |
| 资产报表汇总 | `/admin/performance/assetReport/summary` | `GET` | `performance:assetReport:summary` |
| 资产报表分页 | `/admin/performance/assetReport/page` | `POST` | `performance:assetReport:page` |
| 导出资产报表 | `/admin/performance/assetReport/export` | `GET` | `performance:assetReport:export` |

### Theme20 L1/L2 领用申请审批化实现补记（2026-04-20）

以下内容是 2026-04-20 已在本地 stage2 runtime 中真实落地并完成 smoke 验证的接口补充，不代表 GUI 验收已完成。

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 领用申请分页 | `/admin/performance/assetAssignmentRequest/page` | `POST` | `performance:assetAssignmentRequest:page` |
| 领用申请详情 | `/admin/performance/assetAssignmentRequest/info` | `GET` | `performance:assetAssignmentRequest:info` |
| 新增领用申请草稿 | `/admin/performance/assetAssignmentRequest/add` | `POST` | `performance:assetAssignmentRequest:add` |
| 编辑领用申请草稿 | `/admin/performance/assetAssignmentRequest/update` | `POST` | `performance:assetAssignmentRequest:update` |
| 提交领用申请 | `/admin/performance/assetAssignmentRequest/submit` | `POST` | `performance:assetAssignmentRequest:submit` |
| 撤回领用申请 | `/admin/performance/assetAssignmentRequest/withdraw` | `POST` | `performance:assetAssignmentRequest:withdraw` |
| 配发资产 | `/admin/performance/assetAssignmentRequest/assign` | `POST` | `performance:assetAssignmentRequest:assign` |
| 取消领用申请 | `/admin/performance/assetAssignmentRequest/cancel` | `POST` | `performance:assetAssignmentRequest:cancel` |

补充约束：

1. `assetAssignmentRequest` 只承接 `L1 / L2` 申请、审批绑定和待配发，不承接真实资产归还、丢失或台账主数据维护。
2. `assetAssignment:add` 保留 `L0` 直领入口，但已增加门禁，命中敏感资产、跨部门借用、异常补领、高金额等非 `L0` 场景不得绕过申请层。
3. 审批动作统一继续走 `/admin/performance/approval-flow/*`，不为 `assetAssignmentRequest` 再复制一套 `approve / reject` 专用接口。

### 资产首页汇总返回补充（2026-04-19）

`/admin/performance/assetDashboard/summary` 在原有资产总量、金额、状态分布、分类分布基础上，补充以下字段：

1. `actionOverview`
   - `today.actionCount / assetCount / documentCount`
   - `thisWeek.actionCount / assetCount / documentCount`
   - `thisMonth.actionCount / assetCount / documentCount`
2. `actionTimeline`
   - 返回最近动作流水，首批与 `recentActivities` 保持同一批次数据
   - 单项字段固定包含：
     - `module`
     - `actionLabel`
     - `objectNo`
     - `objectName`
     - `departmentName`
     - `operatorName`
     - `resultStatus`
     - `occurredAt`

动作统计口径固定为：

1. `today`：当天 00:00 到当前
2. `thisWeek`：自然周，周一开始
3. `thisMonth`：自然月
4. 只统计业务动作，不统计查询、筛选、翻页或弹窗打开

首批动作来源固定为：

1. `assetInfo`
2. `assetAssignment`
3. `assetMaintenance`
4. `assetProcurement`
5. `assetTransfer`
6. `assetInventory`
7. `assetDisposal`
8. `assetDepreciation`

### 业务规则

1. `assetProcurement/receive` 必须落资产台账主记录，不允许只改变单据状态。
2. 只允许对 `available` 资产发起领用、调拨和盘点。
3. 维护完成后必须回写资产状态，不允许停留在孤立维护记录。
4. `assetDepreciation` 首批只提供分页、汇总和重算，不引入会计凭证生成。
5. `assetDisposal/execute` 必须把资产主状态推进到 `scrapped`。
6. 资产领用审批正式按 `L0 / L1 / L2` 分层执行：
   - `L0`：免审批直领
   - `L1`：单级审批
   - `L2`：加强审批
7. 当前阶段0接口仍沿用既有 `assetAssignment page / add / update / return / markLost / delete`，不新增领用审批专用接口。
8. 当前阶段0系统主链中，`assetAssignment/add` 仍表示直接办理领用；`L1 / L2` 规则当前作为正式治理口径冻结，不代表系统已新增领用申请层。
9. 资产领用正式金额阈值冻结为：
   - `L0`：单价 `< 1000`
   - `L1`：单价 `1000 - 5000`
   - `L2`：单价 `>= 5000`
10. 资产领用正式敏感资产默认名单冻结为：
   - 笔记本
   - 手机
   - 平板
   - 高配工作站
   - 涉密终端
   - 跨部门借用设备
11. 只要命中敏感资产名单、跨部门借用、遗失后补领、异常补发或报废替换发放，即使金额未达阈值，也不得按 `L0` 直领。
12. 若后续要把 `L1 / L2` 场景系统审批化，必须新增领用申请层对象并重新打开主题20与统一审批流边界，不能直接把现有 `assetAssignment` 混成审批申请单。

## 二期主题 21：文件管理与知识库接口冻结基线（2026-04-19）

本节只冻结文件管理与知识库进入开发前评审前必须遵守的最小接口方向，不代表主题21已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`文件管理与知识库接口方向已冻结，且主题21已完成阶段0冻结`

### 资源边界

1. 主题21 统一资源名固定为：
   - `documentCenter`
   - `knowledgeBase`
2. 当前阶段0保持一个合并主题，不拆成“文件管理 / 知识库”两个独立主题。
3. 首批只冻结文件元数据台账、知识条目元数据、知识图谱、关键词搜索和百问百答元数据，不冻结：
   - 文件目录树
   - 权限继承
   - 二进制文件存储服务
   - 正文富文本编辑器
   - AI 问答 / RAG / 模型推理
   - 员工自助知识门户

### 标准接口

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 文件分页 | `/admin/performance/documentCenter/page` | `POST` | `performance:documentCenter:page` |
| 文件详情 | `/admin/performance/documentCenter/info` | `GET` | `performance:documentCenter:info` |
| 文件统计 | `/admin/performance/documentCenter/stats` | `GET` | `performance:documentCenter:stats` |
| 新增文件元数据 | `/admin/performance/documentCenter/add` | `POST` | `performance:documentCenter:add` |
| 编辑文件元数据 | `/admin/performance/documentCenter/update` | `POST` | `performance:documentCenter:update` |
| 删除文件元数据 | `/admin/performance/documentCenter/delete` | `POST` | `performance:documentCenter:delete` |
| 知识条目分页 | `/admin/performance/knowledgeBase/page` | `POST` | `performance:knowledgeBase:page` |
| 知识条目统计 | `/admin/performance/knowledgeBase/stats` | `GET` | `performance:knowledgeBase:stats` |
| 新增知识条目 | `/admin/performance/knowledgeBase/add` | `POST` | `performance:knowledgeBase:add` |
| 编辑知识条目 | `/admin/performance/knowledgeBase/update` | `POST` | `performance:knowledgeBase:update` |
| 删除知识条目 | `/admin/performance/knowledgeBase/delete` | `POST` | `performance:knowledgeBase:delete` |
| 知识图谱 | `/admin/performance/knowledgeBase/graph` | `GET` | `performance:knowledgeBase:graph` |
| 知识搜索 | `/admin/performance/knowledgeBase/search` | `GET` | `performance:knowledgeBase:search` |
| 百问百答列表 | `/admin/performance/knowledgeBase/qaList` | `GET` | `performance:knowledgeBase:qaList` |
| 新增百问百答 | `/admin/performance/knowledgeBase/qaAdd` | `POST` | `performance:knowledgeBase:qaAdd` |

### 业务规则

1. `documentCenter` 首批只管理文件元数据台账与统计，不承接真实二进制上传、目录树和权限继承能力。
2. `documentCenter/page` 允许按 `status / category / confidentiality / storage / keyword` 过滤。
3. `documentCenter/update` 负责元数据编辑和状态切换，首批不再单独冻结 `publish / archive` 专用动作接口。
4. `knowledgeBase/page` 允许按 `status / category / tag / keyword` 过滤。
5. `knowledgeBase/graph` 只返回“知识条目 - 分类 - 标签 - 关联文件”图谱，不引入向量检索或外部知识源。
6. `knowledgeBase/search` 只聚合知识条目、关联文件摘要和百问百答元数据，不生成 AI 答案。
7. `knowledgeBase/qaAdd` 只写入问答元数据，不承接员工自助问答入口和模型推理。

## 二期主题 22：行政协同记录管理接口冻结基线（2026-04-19）

本节只冻结行政协同记录管理进入开发前评审前必须遵守的最小接口方向，不代表主题22已进入实现开发。

### 当前冻结结论

- 当前唯一结论：`行政协同记录管理接口方向已冻结，且主题22已完成阶段0冻结`

### 资源边界

1. 主题22 当前阶段0保持一个合并主题，不拆成“年检材料 / 荣誉管理 / 宣传资料 / 美工协同 / 快递协同”5 个独立主题。
2. 对外资源固定为：
   - `annualInspection`
   - `honor`
   - `publicityMaterial`
   - `designCollab`
   - `expressCollab`
3. 后端允许内部复用共享实体 / service / 兼容层，但这些内部命名不构成对外 API 资源名。
4. 首批只冻结 `HR-only` 元数据台账，不冻结：
   - 文件管理 / 知识库
   - 车辆管理 / 知识产权管理
   - 真实文件上传 / 下载 / 物理存储
   - 快递同步 / 配置 / 测试连接
   - 设计评论流 / 审稿流 / 审批流

### 标准接口

| 模块 | 分页 | 详情 | 统计 | 新增 | 编辑 | 删除 |
| --- | --- | --- | --- | --- | --- | --- |
| `annualInspection` | `/admin/performance/annualInspection/page` | `/admin/performance/annualInspection/info` | `/admin/performance/annualInspection/stats` | `/admin/performance/annualInspection/add` | `/admin/performance/annualInspection/update` | `/admin/performance/annualInspection/delete` |
| `honor` | `/admin/performance/honor/page` | `/admin/performance/honor/info` | `/admin/performance/honor/stats` | `/admin/performance/honor/add` | `/admin/performance/honor/update` | `/admin/performance/honor/delete` |
| `publicityMaterial` | `/admin/performance/publicityMaterial/page` | `/admin/performance/publicityMaterial/info` | `/admin/performance/publicityMaterial/stats` | `/admin/performance/publicityMaterial/add` | `/admin/performance/publicityMaterial/update` | `/admin/performance/publicityMaterial/delete` |
| `designCollab` | `/admin/performance/designCollab/page` | `/admin/performance/designCollab/info` | `/admin/performance/designCollab/stats` | `/admin/performance/designCollab/add` | `/admin/performance/designCollab/update` | `/admin/performance/designCollab/delete` |
| `expressCollab` | `/admin/performance/expressCollab/page` | `/admin/performance/expressCollab/info` | `/admin/performance/expressCollab/stats` | `/admin/performance/expressCollab/add` | `/admin/performance/expressCollab/update` | `/admin/performance/expressCollab/delete` |

### 业务规则

1. 5 个页面外壳继续统一收敛到共享实现域，但对外请求路径和权限键以各模块自身资源名为准。
2. `page` 至少支持 `keyword / status` 公共过滤，并支持各模块自己的附加过滤字段：
   - `annualInspection`：`category / department`
   - `honor`：`honorType / level / department`
   - `publicityMaterial`：`materialType / channel`
   - `designCollab`：`priority`
   - `expressCollab`：`courierCompany / serviceLevel / syncStatus / sourceSystem`
3. `stats` 只返回当前权限范围内的聚合摘要，不返回正文、二进制或外部系统凭证。
4. `add / update` 只写入元数据与轻量扩展摘要，不写真实附件、快递配置、设计稿二进制和外部系统凭证。
5. 宣传资料允许通过 `relatedDocumentId` 关联文件管理元数据；前端可使用 `documentIds` 壳层字段映射到该单值字段。
6. `honor` 模块的 `archived` 为只读终态：
   - `/admin/performance/honor/update` 对已归档记录必须拒绝
   - `/admin/performance/honor/delete` 对已归档记录必须拒绝

## 行政协同主模块补充：车辆与知识产权接口冻结基线（2026-04-19）

本节只冻结行政协同主模块下 `vehicle / intellectualProperty` 两条 HR-only 台账主链的最小接口方向，不扩成流程型业务系统。

### 当前冻结结论

- 当前唯一结论：`车辆管理与知识产权管理已形成独立资源 + 共享台账壳层的最小接口闭环`

### 资源边界

1. 对外资源固定为：
   - `vehicle`
   - `intellectualProperty`
2. 两个资源都只开放 `page / info / stats / add / update / delete`。
3. 当前明确不纳入：
   - 用车申请 / 派车 / 回车 / 维修工单 / 费用结算 / 违章处理
   - 证书附件上传 / 续费审批 / 维权流程 / 侵权处置

### 标准接口

| 模块 | 分页 | 详情 | 统计 | 新增 | 编辑 | 删除 |
| --- | --- | --- | --- | --- | --- | --- |
| `vehicle` | `/admin/performance/vehicle/page` | `/admin/performance/vehicle/info` | `/admin/performance/vehicle/stats` | `/admin/performance/vehicle/add` | `/admin/performance/vehicle/update` | `/admin/performance/vehicle/delete` |
| `intellectualProperty` | `/admin/performance/intellectualProperty/page` | `/admin/performance/intellectualProperty/info` | `/admin/performance/intellectualProperty/stats` | `/admin/performance/intellectualProperty/add` | `/admin/performance/intellectualProperty/update` | `/admin/performance/intellectualProperty/delete` |

### 车辆管理最小字段与规则

1. `vehicle/page` 至少支持：
   - `keyword`
   - `status`
   - `vehicleType`
2. `vehicle` 主字段固定为：
   - `vehicleNo`
   - `plateNo`
   - `brand`
   - `model`
   - `vehicleType`
   - `ownerDepartment`
   - `managerName`
   - `seats`
   - `registerDate`
   - `inspectionDueDate`
   - `insuranceDueDate`
   - `status`
   - `usageScope`
   - `notes`
3. `vehicleType` 只允许：
   - `sedan / suv / mpv / bus / truck / other`
4. `status` 只允许：
   - `idle / in_use / maintenance / inspection_due / retired`
5. `vehicle/stats` 只返回：
   - `total`
   - `inUseCount`
   - `maintenanceCount`
   - `inspectionDueCount`
6. `vehicleNo / plateNo` 必须唯一。
7. `inspectionDueDate / insuranceDueDate` 不得早于 `registerDate`。

### 知识产权管理最小字段与规则

1. `intellectualProperty/page` 至少支持：
   - `keyword`
   - `status`
   - `ipType`
2. `intellectualProperty` 主字段固定为：
   - `ipNo`
   - `title`
   - `ipType`
   - `ownerDepartment`
   - `ownerName`
   - `applicantName`
   - `applyDate`
   - `grantDate`
   - `expiryDate`
   - `status`
   - `registryNo`
   - `usageScope`
   - `riskLevel`
   - `notes`
3. `ipType` 只允许：
   - `patent / trademark / copyright / softwareCopyright`
4. `status` 只允许：
   - `drafting / applying / registered / expired / invalidated`
5. `intellectualProperty/stats` 只返回：
   - `total`
   - `registeredCount`
   - `expiringCount`
   - `expiredCount`
6. `ipNo` 必须唯一。
7. `grantDate` 不得早于 `applyDate`；`expiryDate` 不得早于 `applyDate / grantDate`。

## 2026-04-19 多主题收口补充

### 本次补充覆盖的资源

1. 招聘链路补充：
   - `recruitPlan`
   - `resumePool`
   - `talentAsset`
2. 采购链路补充：
   - `purchaseOrder`
   - `purchaseReport`
3. 班主任化补充：
   - `teacherInfo`
   - `teacherFollow`
   - `teacherCooperation`
   - `teacherClass`
   - `teacherDashboard`
   - `teacherTodo`
4. 行政协同补充：
   - `annualInspection`
   - `honor`
   - `publicityMaterial`
   - `designCollab`
   - `expressCollab`
   - `documentCenter`
   - `knowledgeBase`
   - `vehicle`
   - `intellectualProperty`

### 补充接口边界

1. `recruitPlan / resumePool / talentAsset` 统一维持后台管理资源形态，最小主链保持 `page / info / add / update`，主题已单独冻结的状态流与详情能力继续沿用各自任务卡。
2. `purchaseOrder` 在保留原 `page / info / add / update` 的基础上，补充按工作台阶段拆分的前端消费入口；`purchaseReport` 仅提供报表摘要与分页查询，不扩展为独立结算链。
3. `teacherInfo` 维持 `page / info / add / update / assign / updateStatus`，`teacherFollow` 维持 `page / add`，`teacherCooperation` 维持 `mark`，`teacherClass` 维持 `page / info / add / update / delete`，`teacherDashboard` 维持 `summary`，`teacherTodo` 维持 `page`。
4. `documentCenter / knowledgeBase / annualInspection / honor / publicityMaterial / designCollab / expressCollab / vehicle / intellectualProperty` 统一沿用后台资源模式：
   - `page`
   - `info`
   - `stats`
   - `add`
   - `update`
   - `delete`

### 契约对齐备注

1. `talent-asset` 的代码路径已统一收敛为 `talentAsset`，资源名与权限键保持 `talentAsset`，不再混用连字符文件名。
2. 前端 service、菜单、运行态 smoke、GUI 脚本与当前合同快照已按同一资源名回写。
3. 进入仓库级 OpenAPI 迁移后的资源，以仓库根 `contracts/openapi/xuedao.openapi.json` 为 API 唯一事实源；主题冻结卡和 `docs/contracts/current/*` 只保留阶段证据与范围说明职责。
