<!-- 文件职责：沉淀 Theme20“L1/L2 领用申请审批化重开”的设计结论；不负责实现开发、运行态验证结果或把未实现接口写成已完成事实；依赖主题20冻结卡、资产领用审批分层正式冻结稿、approval-flow 共享事实源和用户逐轮确认；维护重点是 `assetAssignmentRequest` 与 `assetAssignment` 的职责边界、审批链复用方式和回退口径必须始终保持单一事实源。 -->
# Theme20 L1/L2 领用申请审批化重开设计说明

## 结论

Theme20 本轮按“`assetAssignmentRequest` 申请审批层 + `assetAssignment` 实物发放层”的双层对象方案重开。`L0` 继续保留在既有直领主链，只有 `L1 / L2` 进入新的领用申请对象和统一 `approval-flow`。员工只提交资产类型/型号需求，不直接选具体资产编号；审批通过后由资产管理员配发具体台账资产，并生成正式 `assetAssignment`。

## 设计目标

1. 让 `L1 / L2` 领用进入统一审批治理，而不破坏 `L0` 低值直领效率。
2. 保持审批态和实物发放态分离，避免把申请状态硬塞进现有 `assetAssignment`。
3. 把撤回、转办、催办、异常补领一起纳入统一治理，但不额外生长第二套审批动作接口。
4. 保证异常止血时可以回退到手工处理口径，不制造不可恢复的资产台账错账。

## 非目标

1. 不把所有领用统一改造成审批流。
2. 不允许员工在申请时直接选择具体资产台账编号。
3. 不把 `assetAssignmentRequest` 扩成采购申请、预算申请、库存占用单或通用物资申请中心。
4. 不新增独立“资产审批页”去复制统一审批中心待办。
5. 不改变现有 `assetAssignment` 承担归还、丢失等执行结果记录的职责。

## 方案比较

### 方案 A：双层对象分离（采用）

1. 新增 `assetAssignmentRequest` 承载 `L1 / L2` 申请、审批绑定、撤回、异常补领和待配发。
2. 保留 `assetAssignment` 作为审批通过后的真实发放记录。
3. 该方案最符合“先申请类型，再配具体资产”的业务约束，也最容易复用统一 `approval-flow`。

### 方案 B：直接扩 `assetAssignment`（不采用）

1. 把现有 `assetAssignment` 扩成申请、审批、发放一体对象。
2. 风险是会把现有 `assigned / returned / lost` 执行语义打乱，与 Theme20 已冻结事实源冲突过大。

### 方案 C：极薄请求单 + 大部分语义外置给 `approval-flow`（不采用）

1. `assetAssignmentRequest` 只保留需求摘要，审批和特殊场景几乎全部外置。
2. 风险是资产侧异常补领、跨部门借用和配发结果会分散在多个对象间，排障和联调成本高。

## 资源边界

### `assetAssignmentRequest`

1. 只负责员工发起的领用申请、审批链路绑定、异常补领原因、审批过程留痕、待配发和已发放回写。
2. 不负责归还、丢失、报废等真实资产执行结果。
3. 只承接 `L1 / L2` 场景，不承接 `L0`。

### `assetAssignment`

1. 继续只负责真实资产发放、归还和丢失执行记录。
2. 创建时必须绑定具体 `assetInfo.id`。
3. 不增加申请草稿、审批中、已驳回等审批状态。

### 两层对象串联规则

1. 员工提交 `assetAssignmentRequest` 时只填资产类型/型号需求。
2. 审批通过后，请求单进入 `approvedPendingAssignment`。
3. 资产管理员在待配发阶段选择具体 `assetInfo.id`，创建正式 `assetAssignment`。
4. 配发完成后，请求单进入 `issued`，并把资产主状态按既有 Theme20 口径推进到 `assigned`。

## 分层规则与审批触发

1. `L0` 继续走既有直领主链，不进入 `assetAssignmentRequest`。
2. `L1 / L2` 在提交申请时自动判层，触发条件以 [2026-04-19-资产领用审批分层规则正式冻结.md](/Users/shaotongli/Documents/xuedao/performance-management-system/tasks/2026-04-19-资产领用审批分层规则正式冻结.md) 为唯一事实源。
3. 同一申请命中多个规则时按最高层级处理，不走并行双流。
4. `L2` 的管理层确认不是默认必经节点，只在命中以下条件之一时追加：
   - 敏感资产
   - 异常补领
   - 跨部门借用
   - 高金额

## 状态机

`assetAssignmentRequest` 状态固定为：

- `draft`
- `inApproval`
- `rejected`
- `withdrawn`
- `approvedPendingAssignment`
- `issuing`
- `issued`
- `cancelled`
- `manualPending`

合法流转固定为：

- `draft -> inApproval`
- `inApproval -> rejected`
- `inApproval -> withdrawn`
- `inApproval -> approvedPendingAssignment`
- `approvedPendingAssignment -> issuing -> issued`
- `inApproval / approvedPendingAssignment / manualPending -> cancelled`

补充约束：

1. `issued` 后不得再撤回或驳回。
2. `manualPending` 只作为审批回退兼容态，不作为常规主路径。
3. 请求单进入 `issued` 后，需求核心字段不再允许修改。
4. `submit` 必须同步完成审批实例创建或绑定；接口成功返回时，请求单必须已经进入 `inApproval`，不对前端暴露独立持久化的 `submitted` 列表态。
5. 若审批实例创建失败，`submit` 直接失败并保持 `draft`，不得留下半提交状态。
6. `manualPending` 下只允许 `HR` 执行 `resolve` 或 `cancel`，不允许申请人直接再次 `submit`。

## 审批链

### `L1`

员工申请 -> 部门负责人审批 -> 待配发

### `L2`

员工申请 -> 部门负责人审批 -> 资产管理员确认 -> 待配发

### `L2` 追加管理层确认

当命中敏感资产、异常补领、跨部门借用或高金额时，链路变为：

员工申请 -> 部门负责人审批 -> 资产管理员确认 -> 管理层确认 -> 待配发

## 统一审批流复用边界

1. `assetAssignmentRequest` 不新增 `approve / reject / transfer / remind / resolve / fallback / terminate` 自有接口。
2. 节点审批动作统一复用既有 `approval-flow`：
   - `/admin/performance/approval-flow/approve`
   - `/admin/performance/approval-flow/reject`
   - `/admin/performance/approval-flow/transfer`
   - `/admin/performance/approval-flow/withdraw`
   - `/admin/performance/approval-flow/remind`
   - `/admin/performance/approval-flow/resolve`
   - `/admin/performance/approval-flow/fallback`
   - `/admin/performance/approval-flow/terminate`
3. `assetAssignmentRequest` 只负责：
   - 提交前校验与判层
   - 发起或绑定审批实例
   - 消费审批结果并回写本对象状态
   - 在待配发阶段创建正式 `assetAssignment`
4. 本轮 Theme20 重开同时要求扩展共享 `approval-flow` 角色矩阵：
   - 部门负责人：可在本人当前节点使用 `info / approve / reject / transfer / remind`
   - 资产管理员：可在本人当前节点使用 `info / approve / reject / transfer / remind`
   - 管理层：可在本人当前节点使用 `info / approve / reject / transfer / remind`
   - 员工：仅本人发起实例可使用 `info / withdraw / remind`
   - `HR`：保留全量 `info / approve / reject / transfer / withdraw / remind / resolve / fallback / terminate`

## 最小接口

### `assetAssignmentRequest`

- `page`
- `info`
- `add`
- `update`
- `submit`
- `withdraw`
- `assign`
- `cancel`

接口语义固定为：

1. `add / update` 只处理草稿。
2. `submit` 负责判层并发起 `approval-flow`。
3. `withdraw` 只允许申请人对未发放请求单执行。
4. `assign` 只允许资产管理员在 `approvedPendingAssignment` 下执行，且必须选定具体 `assetInfo.id`。
5. `cancel` 只用于 `HR` 人工止血、回退关闭。

## 权限

### 员工

1. `performance:assetAssignmentRequest:page`
2. `performance:assetAssignmentRequest:info`
3. `performance:assetAssignmentRequest:add`
4. `performance:assetAssignmentRequest:update`
5. `performance:assetAssignmentRequest:submit`
6. `performance:assetAssignmentRequest:withdraw`
7. 只允许访问本人发起的请求单。

### 部门负责人

1. 不拥有请求单编辑权。
2. 通过 `performance:approvalFlow:info / approve / reject / transfer / remind` 在本人当前审批节点处理审批。

### 资产管理员

1. `performance:assetAssignmentRequest:page`
2. `performance:assetAssignmentRequest:info`
3. `performance:assetAssignmentRequest:assign`
4. `performance:approvalFlow:info`
5. `performance:approvalFlow:approve`
6. `performance:approvalFlow:reject`
7. `performance:approvalFlow:transfer`
8. `performance:approvalFlow:remind`
9. 只在本人命中的资产管理员审批节点处理审批，只对 `approvedPendingAssignment` 请求单执行配发。

### 管理层

1. `performance:approvalFlow:info`
2. `performance:approvalFlow:approve`
3. `performance:approvalFlow:reject`
4. `performance:approvalFlow:transfer`
5. `performance:approvalFlow:remind`
6. 只处理被追加的管理层节点，不直接获取请求单编辑权。

### `HR`

1. 查看全量请求单。
2. 保留 `performance:approvalFlow:info / resolve / fallback / terminate`。
3. 可对异常实例执行 `cancel`、人工恢复和回退治理。

## 页面与列表口径

1. 员工侧新增“我的领用申请”，展示草稿、审批中、已驳回、待配发、已发放、已撤回；不单独展示 `submitted`。
2. 资产管理员新增“待配发申请”，只处理 `approvedPendingAssignment`。
3. 审批人继续复用统一审批中心待办，不新增第二套独立资产审批页。
4. 现有资产台账和领用归还页继续只展示正式 `assetAssignment` 执行结果，不混入申请草稿。
5. `assetAssignmentRequest` 负责展示“申请过程”，`assetAssignment` 负责展示“执行结果”。

## 最小字段

### 标识与层级

- `id`
- `requestNo`
- `requestLevel`
- `requestType`

### 申请主体

- `applicantId`
- `applicantDepartmentId`

### 需求描述

- `assetCategory`
- `assetModelRequest`
- `quantity`
- `unitPriceEstimate`
- `usageReason`
- `expectedUseStartDate`
- `targetDepartmentId`

### 异常补领与替换

- `exceptionReason`
- `originalAssetId`
- `originalAssignmentId`

### 审批绑定

- `approvalInstanceId`
- `approvalStatus`
- `currentApproverId`
- `approvalTriggeredRules`

### 配发结果

- `assignedAssetId`
- `assignmentRecordId`
- `assignedBy`
- `assignedAt`

### 审计

- `submitTime`
- `withdrawTime`
- `cancelReason`
- `createTime`
- `updateTime`

补充约束：

1. 员工提交时不得写 `assignedAssetId / assignmentRecordId`。
2. `crossDepartmentBorrow` 必须带 `targetDepartmentId`。
3. `lostReplacement / abnormalReissue / scrapReplacement` 必须带 `exceptionReason`。
4. `approvalTriggeredRules` 必须保留命中规则快照。

## 测试矩阵

### 正常路径

1. `L1` 请求单提交成功 -> 审批通过 -> 待配发 -> 配发成功 -> 生成 `assetAssignment`。
2. `L2` 敏感资产请求单提交成功 -> 追加管理层 -> 审批通过 -> 配发成功。

### 异常路径

1. 员工尝试在 `L1 / L2` 申请中直接指定 `assetInfo.id` 被拒绝。
2. 审批未通过不得执行 `assign`。
3. 非当前审批人调用 `approval-flow/approve` 被拒绝。

### 边界

1. 命中多规则时按最高层级。
2. 敏感资产即使 `< 1000` 也不得走 `L0`。
3. 已 `issued` 请求单不可撤回。

### 权限

1. 员工只能看到本人请求单。
2. 部门负责人只能处理落到自己节点的审批。
3. 资产管理员只能对 `approvedPendingAssignment` 执行配发。
4. `HR` 才能 `fallback / terminate / resolve`。

### 回退

1. `approval-flow/fallback` 后，请求单进入 `manualPending` 或 `cancelled`。
2. 审批实例审计仍可查询。
3. 回退后不得凭空生成 `assetAssignment`。

## 回退口径

1. 代码回滚时，优先隐藏 `assetAssignmentRequest` 相关菜单和入口，并撤销对应授权。
2. 数据回滚不要求删除请求单历史，优先停入口、停权限、停自动审批实例创建。
3. 审批链异常时，先关闭新提交入口，再对未终态实例执行 `approval-flow/fallback`。
4. 已 `issued` 的执行记录不因审批链回退被物理删除，避免资产实物账错乱。

## Theme20 重开方式

1. Theme20 原阶段0冻结继续保留为历史事实源，不回写成“从未冻结”。
2. 因 `L1 / L2` 系统审批化，本轮正式重开 Theme20 的二期开窗。
3. 重开后必须新增并同步以下任务卡：
   - Theme20-L1L2 领用申请审批化-范围与非目标重开卡
   - Theme20-L1L2 领用申请审批化-接口权限状态重开卡
   - Theme20-L1L2 领用申请审批化-测试与回滚重开卡
   - Theme20-L1L2 领用申请审批化-最终验收卡
4. 同步回写共享事实源：
   - `04-API设计.md`
   - `05-状态机与流转规则.md`
   - `06-权限矩阵.md`
   - `09-测试清单.md`
   - `15-回滚说明.md`
   - `24-自动化测试策略与脚本规划.md`
   - `13-版本与变更记录.md`

## 可进入实现的门槛

1. `assetAssignmentRequest` 与 `assetAssignment` 的边界已经冻结。
2. `approval-flow` 复用边界已经冻结。
3. 回退口径已经冻结。
4. `L0` 直领不受本轮改造影响已经冻结。
5. 共享 docs 与重开任务卡完成回写前，不进入实现阶段。
