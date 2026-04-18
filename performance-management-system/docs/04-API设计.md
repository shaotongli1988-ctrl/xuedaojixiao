# API 设计

## 文档职责

这份文档是“接口契约”的唯一事实源。

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

#### 目标导出业务规则

- 首期仅 `HR` 和 `部门经理` 可导出目标数据。
- 导出字段必须按角色裁剪，不返回无权限字段。
- 首期目标导出固定为标准摘要列，不导出审批类、薪资类和越权字段。

### 4. 指标库

| 接口名称 | 请求路径 | 请求方式 | 权限要求 |
| --- | --- | --- | --- |
| 指标分页 | `/admin/performance/indicator/page` | `POST` | `performance:indicator:page` |
| 指标详情 | `/admin/performance/indicator/info` | `GET` | `performance:indicator:info` |
| 新增指标 | `/admin/performance/indicator/add` | `POST` | `performance:indicator:add` |
| 修改指标 | `/admin/performance/indicator/update` | `POST` | `performance:indicator:update` |
| 删除指标 | `/admin/performance/indicator/delete` | `POST` | `performance:indicator:delete` |

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
| status | string | 面试状态 |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

### 业务规则

1. 删除面试只允许在 `scheduled` 状态执行。
2. 首批不返回候选人联系方式、附件、简历全文和评语全文。
3. 首批不开放录用结果接口，也不通过面试资源创建录用单据。
4. 部门经理的数据范围首批按 `departmentId` 判定。
5. `completed / cancelled` 为终态，首批不允许再补录或修改业务字段。

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
