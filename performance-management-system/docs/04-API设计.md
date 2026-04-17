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
