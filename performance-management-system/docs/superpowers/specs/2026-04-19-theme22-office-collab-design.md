<!-- 文件职责：沉淀 Theme22“行政协同记录管理”的设计结论；不负责实现开发与运行态验证结果；依赖主题22阶段0冻结卡与共享 docs 事实源；维护重点是 5 个模块对外契约与共享实现壳层必须保持同一事实源。 -->
# Theme22 行政协同记录管理设计说明

## 结论

Theme22 采用“5 个模块对外契约 + 1 套共享实现壳层”的方案，覆盖 `annualInspection / honor / publicityMaterial / designCollab / expressCollab` 五个页面。页面继续保留现有 `office/*` 路由和菜单入口；后端允许复用共享 entity / service，但外部 API、权限键和前端 service 都必须按模块名各自落地。

## 为什么是合并主题

1. 五个页面当前在 `xuedao` 内都只是行政协同骨架页，尚未形成各自独立的真实系统边界。
2. `jixiao` 虽然给出了 5 套页面和 mock API 参考，但这 5 类数据在本轮都只需要台账元数据，不需要真实文件、真实物流、真实设计稿或外部平台能力。
3. 若拆成 5 个主题，会重复冻结 5 套几乎相同的 `page / info / stats / add / update / delete`、HR-only 权限和轻量状态机，阶段0成本高但收益低。

## 共享实现域

内部共享实现域允许使用 `officeCollabRecord` / `office-collab-record` 命名，但它只负责复用字段映射、校验和统计逻辑，不构成对外资源名。

共享字段建议固定为内部标准列：

- `id`
- `recordNo`
- `recordType`
- `title`
- `ownerName`
- `department`
- `status`
- `summary`
- `tags`
- `dueDate`
- `completedAt`
- `extJson`
- `createdAt`
- `updatedAt`

其中：

1. 内部 `moduleKey` 只允许：
   - `annualInspection`
   - `honor`
   - `publicityMaterial`
   - `designCollab`
   - `expressCollab`
2. `extJson` 只承接页面差异化的轻量元数据摘要，不承接大对象和外部系统配置。
3. 任何真实附件、真实物流配置、设计稿二进制、API Token、Webhook 地址都不进入本轮字段边界。

## 5 个页面外壳映射

| 页面外壳 | 固定 `recordType` | 页面职责 | 允许的 `extJson` 摘要方向 |
| --- | --- | --- | --- |
| `office/annualInspection` | `annualInspection` | 年检资料台账和到期摘要 | `category / version / reminderDays` |
| `office/honor` | `honor` | 荣誉记录台账和发布摘要 | `honorType / level / issuer / awardedAt` |
| `office/publicityMaterial` | `publicityMaterial` | 宣传资料台账和投放摘要 | `materialType / channel / publishDate / designOwner` |
| `office/designCollab` | `designCollab` | 设计协同事项台账和排期摘要 | `priority / requesterName / assigneeName / plannedDeliveryDate` |
| `office/expressCollab` | `expressCollab` | 快递协同事项台账和物流摘要 | `trackingNo / courierCompany / senderName / receiverName / etaDate` |

映射原则：

1. 五个页面共用列表、详情、统计和编辑的实现骨架。
2. 页面间只通过固定的 `moduleKey` 和轻量 `extJson` 区分，不各自生长一套独立实现。
3. 页面路由、标题和菜单权限键继续沿用现有骨架，不改业务域归属。

## 最小闭环接口

本轮唯一事实源固定为最小闭环：

- `page`
- `info`
- `stats`
- `add`
- `update`
- `delete`

对应接口固定按模块展开：

- `/admin/performance/annualInspection/*`
- `/admin/performance/honor/*`
- `/admin/performance/publicityMaterial/*`
- `/admin/performance/designCollab/*`
- `/admin/performance/expressCollab/*`

每个模块都固定提供 `page / info / stats / add / update / delete` 六个动作；共享实现层只做复用，不对外暴露成单独资源。

## 权限与状态

权限固定为模块粒度：

1. `performance:annualInspection:(page|info|stats|add|update|delete)`
2. `performance:honor:(page|info|stats|add|update|delete)`
3. `performance:publicityMaterial:(page|info|stats|add|update|delete)`
4. `performance:designCollab:(page|info|stats|add|update|delete)`
5. `performance:expressCollab:(page|info|stats|add|update|delete)`

角色固定为：

1. `HR 管理员`：全量
2. 部门经理：无入口
3. 员工：无入口

状态按模块固定，不再强行统一成一套共享状态：

- `annualInspection`: `draft / preparing / submitted / approved / rejected / expired`
- `honor`: `draft / published / archived`
- `publicityMaterial`: `draft / review / approved / published / offline`
- `designCollab`: `todo / in_progress / review / done / cancelled`
- `expressCollab`: `created / in_transit / delivered / exception / returned`

解释：

1. 这是一个元数据台账状态机集合，不是快递系统、审批系统或设计交付系统的真实业务状态机。
2. `update` 负责元数据编辑和状态推进，不再拆出额外动作接口。
3. 只有 `honor` 模块保留 `archived` 终态；其余模块是否可删除以各模块当前实现和权限校验为准。

## 非目标

以下内容明确不属于 Theme22：

1. 文件管理与知识库
2. 车辆管理
3. 知识产权管理
4. 真实文件上传、下载和物理存储
5. 快递平台真实对接、轨迹拉取和费用结算
6. 设计评论流、设计审批流、素材库正文

## 仍需集成时确认的点

1. 运行态菜单是否已完整挂入 5 个模块各自的 `page / info / stats / add / update / delete` 权限键。
2. 后端实体是否继续维持当前共享列 + `extJson` 轻扩展方案。
3. 前端是否继续维持一个共享列表组件 + 5 个薄壳页面注入配置。
