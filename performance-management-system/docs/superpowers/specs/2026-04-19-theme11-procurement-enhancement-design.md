<!-- 文件职责：沉淀 Theme11“采购与供应商管理扩容重冻”的设计结论；不负责实现开发与运行态验证结果；依赖主题11冻结卡与共享 docs 事实源；维护重点是采购增强继续围绕 purchaseOrder 单主资源，不扩成财务与库存总账平台。 -->
# Theme11 采购与供应商管理扩容设计说明

## 结论

Theme11 按“`purchaseOrder` 单主资源扩容 + `supplier` 主数据延续”的方案推进。`订单管理` 只是采购单执行视角兼容名，不新增第二个主资源。首批扩容后的主题11覆盖 `采购单 / 创建采购单 / 采购单详情 / 询价管理 / 供应商 / 采购审批 / 订单管理 / 收货管理 / 采购报表`，但仍不接入付款、对账和库存总账联动。

## 资源边界

1. 主资源固定为 `purchaseOrder`。
2. 主数据资源继续固定为 `supplier`。
3. `inquiry / approval / receipt / report` 作为围绕采购单的流程动作、派生视图或统计接口，不升级为独立主数据中心。
4. `orderManagement` 仅表示 `purchaseOrder` 在执行态下的兼容页面视图，不单独建资源。

## 页面映射

| 页面 | 路由建议 | 资源归属 | 说明 |
| --- | --- | --- | --- |
| 采购管理 | `/performance/purchase-order` | `purchaseOrder` | 采购主列表 |
| 创建采购单 | `/performance/purchase-order` | `purchaseOrder` | 通过新增弹窗或新增页承载 |
| 采购单详情 | `/performance/purchase-order` | `purchaseOrder` | 主详情包含流程摘要 |
| 询价管理 | `/performance/purchase-inquiry` | `purchaseOrder` | 询价态筛选 + 询价动作 |
| 供应商 | `/performance/supplier` | `supplier` | 继续独立页 |
| 采购审批 | `/performance/purchase-approval` | `purchaseOrder` | 待审批视图 + 审批动作 |
| 订单管理 | `/performance/purchase-execution` | `purchaseOrder` | 已审批 / 收货中 / 已关闭执行视图 |
| 收货管理 | `/performance/purchase-receipt` | `purchaseOrder` | 收货视图 + 收货动作 |
| 采购报表 | `/performance/purchase-report` | `purchaseReport` | 只读统计页 |

## 最小接口

### `purchaseOrder`

- `page`
- `info`
- `add`
- `update`
- `delete`
- `submitInquiry`
- `submitApproval`
- `approve`
- `reject`
- `receive`
- `close`

### `supplier`

- `page`
- `info`
- `add`
- `update`
- `delete`

### `purchaseReport`

- `summary`
- `trend`
- `supplierStats`

## 状态机

采购单状态固定为：

- `draft`
- `inquiring`
- `pendingApproval`
- `approved`
- `received`
- `closed`
- `cancelled`

合法流转固定为：

- `draft -> inquiring`
- `inquiring -> pendingApproval`
- `pendingApproval -> approved`
- `pendingApproval -> draft`
- `approved -> received`
- `approved -> closed`
- `received -> closed`
- `draft / inquiring / pendingApproval -> cancelled`

补充约束：

1. `delete` 只允许 `draft`。
2. `close` 必须记录关闭原因。
3. `reject` 固定回退到 `draft`，不直接生成第二张订单。
4. `receive` 仅允许在 `approved / received` 下执行，支持累计收货。

## 权限

1. `HR`：采购单与供应商全量；可执行询价提交、审批、驳回、收货、关闭和报表查看。
2. 部门经理：仅本人部门树范围内管理采购单，可执行询价提交、提交审批、审批、驳回、收货和关闭；对供应商保持只读；报表仅本人部门树范围。
3. 员工：无入口、无页面、无接口。

## 字段边界

采购单允许扩容的最小流程字段：

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

补充约束：

1. `items` 只承接明细快照，不接库存总账。
2. `inquiryRecords / approvalLogs / receiptRecords` 只承接轻量记录，不接外部审批系统或财务凭证。
3. 供应商仍不扩到资质、评级、结算中心和合同附件全文。

## 非目标

Theme11 扩容后仍明确不做：

1. 付款
2. 对账
3. 库存总账联动
4. 财务凭证
5. 外部 ERP / 合同 / 电子签集成
6. 第二套独立订单资源

## 实施拆分

1. 先重冻主题11事实源和任务卡。
2. 后端扩 `purchaseOrder` 领域模型、动作接口、统计接口和定向测试。
3. 前端扩采购增强页面、动作显隐和状态视图。
4. 联调补菜单、seed、smoke、GUI 留痕和最终验收回写。
