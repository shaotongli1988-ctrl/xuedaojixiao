<!-- 负责记录“performance 全域角色视角单一事实源”方案的核心模型、身份分层、能力范围、状态约束与迁移路径；不负责在本文内直接落地后端鉴权、前端页面切换或一次性替换全部历史权限点；依赖现有 performance 业务模块、base 权限基础设施与多端消费链路；维护重点是角色视角真相必须统一留在后端业务域，前端不再自行猜测 HR/manager/staff。 -->
# 2026-04-21 Performance 角色事实源 SSOT 设计

## 目标

为 `xuedao` 仓库中的 `performance` 全域建立一套统一的“角色视角单一事实源”方案，覆盖绩效主链、招聘、培训、薪酬、采购、资产、行政、教师渠道等模块，解决当前角色语义、权限语义、页面入口和数据范围混写的问题。

本方案要达成的结果是：

1. 一个账号可以同时承担多个业务身份。
2. Web、Uni、菜单、工作台、接口鉴权共享同一套角色事实源。
3. 页面不再自行推断 `hr / manager / staff` 之类的前端占位角色。
4. “谁能做什么、能看哪些数据、在什么状态下能做”被拆成稳定、可验证的独立层。
5. 后续新增模块和页面时，只接入统一模型，不再继续扩散特例 if/else。

## Before Starting

- Scope:
  为 `performance` 全业务域设计统一角色事实源，包括核心模型、身份分层、能力命名、数据范围、状态约束、界面绑定和迁移路径。
- Non-goals:
  本文不直接改造服务层、菜单、前端工作台，也不一次性替换所有历史权限串和页面逻辑。
- Affected modules:
  `cool-admin-midway/src/modules/performance/*`
  `cool-admin-midway/src/modules/base/menu.json`
  `cool-admin-midway/src/modules/base/middleware/authority.ts`
  `cool-admin-vue/src/modules/performance/*`
  `cool-uni/pages/performance/*`
- Acceptance criteria:
  1. 能表达一个账号多身份叠加。
  2. 能覆盖员工填写、主管打分审批、HR 查看分析、管理层看板四类主场景。
  3. 能统一约束页面入口、按钮显隐、接口鉴权和数据范围。
  4. 能提供渐进迁移路径，不要求一次性重写。
- Impact surface:
  角色模型、权限常量、菜单绑定、工作台视角、服务鉴权、数据范围判断、状态机守卫、多端入口展示。
- Source of truth:
  后端 `performance` 业务域。
- Requirement conflicts or unclear points that must be resolved before coding:
  已确认本次覆盖整个 `performance` 大域；已确认一个账号允许多身份叠加；已确认采用“默认自动判断，少量页面允许手动切换”的视角策略。
- High-risk surfaces:
  权限、数据范围、审批状态机、敏感分析与导出、工作台默认视角、菜单入口一致性。
- Required delivery evidence:
  正式设计文档、一批一批迁移计划、首批模块实施前的 capability/scope/state 审核清单。
- Required test matrix:
  正常路径、越权路径、跨身份路径、非法状态路径、数据范围边界路径。
- Key assumptions and constraints:
  1. 后端可以成为唯一事实源。
  2. 现有 `perms` 字符串需要过渡兼容，不适合一次性清除。
  3. 工作台和页面当前已有大量分散判断，需要分阶段回收。

## 背景与现状问题

当前仓库并不是没有权限体系，而是已经形成了多套并行语义：

1. 菜单与按钮权限挂在 [menu.json](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/base/menu.json)。
2. 路由和接口权限由 [authority.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/base/middleware/authority.ts) 与 token/perms 共同判定。
3. 服务层又在各模块内部继续写“本人、主管、HR、部门范围”的专用判断，例如 [assessment.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/assessment.ts)。
4. 前端工作台仍然存在占位式角色推断，例如 [workbench.ts](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/service/workbench.ts) 中的 `hr / manager / staff`。

这会带来几类实际问题：

1. 同一个“角色”在不同地方语义不同。
   - `HR` 有时表示“可导出”
   - 有时表示“可全局查看”
   - 有时又表示“首期不能审批”
2. 同一个人如果同时承担多个身份，系统缺少稳定表达。
3. 页面入口、按钮显隐、接口鉴权、数据范围过滤并不是同一套事实源。
4. 新模块增加后，容易继续复制“页面级角色判断 + 服务级补丁判断”的老问题。

## 范围

本设计覆盖整个 `performance` 大域，包括但不限于：

1. `assessment`
2. `approval-flow`
3. `dashboard`
4. `workbench`
5. `feedback`
6. `suggestion`
7. `promotion`
8. `pip`
9. `salary`
10. `recruit-plan`
11. `resume-pool`
12. `interview`
13. `hiring`
14. `job-standard`
15. `talent-asset`
16. `course`
17. `course-learning`
18. `capability`
19. `certificate`
20. `purchase-*`
21. `supplier`
22. `asset-*`
23. `office/*`
24. `meeting`
25. `contract`
26. `teacher-channel/*`

本设计不覆盖：

1. 系统基座级角色中心的完全重构。
2. 非 `performance` 域的统一角色建模。
3. 一次性重做所有前端页面交互。
4. 基于策略引擎的动态规则平台化。

## 设计原则

### 1. 后端业务域是唯一事实源

角色视角、能力、数据范围和状态约束必须统一收敛到后端业务域，前端只消费解析结果。

### 2. 一个账号允许多身份叠加

同一个登录账号可以同时具备多个业务身份。例如一个人可以同时是部门负责人、HRBP 和招聘负责人。

### 3. 角色视角与权限、范围、状态解耦

必须拆开：

1. 你是谁
2. 你理论上能做什么
3. 你能作用于哪些数据
4. 当前状态是否允许你做

### 4. 默认自动判断，少量页面允许手动切换

业务操作页面优先自动选取最合适的视角；工作台、驾驶舱、分析页允许用户切换当前视角，但后端不信任前端标签本身。

### 5. 迁移必须渐进式

先新增统一事实源和兼容映射，再逐步回收旧逻辑，不做一次性替换。

## 推荐方案对比

### 方案一：平铺角色表

把所有角色直接铺平，例如员工、主管、HR、管理层、招聘、培训、采购、资产、行政等。

优点：

1. 初看容易理解。

问题：

1. 角色会持续膨胀。
2. 多身份叠加和代理场景会越来越难表达。
3. 模块增长后，角色命名和职责边界会漂移。

### 方案二：分层 Persona + Capability + Scope + State

以账号为基础，把“身份、能力、范围、状态约束、界面绑定”拆成独立层。

优点：

1. 能表达多身份叠加。
2. 能统一服务鉴权、菜单、工作台和分析页。
3. 更贴合真实组织和多职能协同。

缺点：

1. 首次建模成本高于平铺角色。

### 方案三：纯规则/策略模型

不强调角色，以属性和规则为核心做动态判定。

优点：

1. 灵活度最高。

问题：

1. 当前团队理解和落地成本高。
2. 不适合你们现在要解决的“角色视角统一”问题。

### 推荐结论

采用方案二：`Subject -> Persona -> Capability -> Scope -> State Guard -> Surface Binding`。

## 核心模型

### 1. Subject

`subject` 表达登录账号，只回答“是谁”，不直接决定业务权限。

### 2. Persona

`persona` 表达业务身份，是“角色视角”的核心对象。一个 `subject` 可以挂多个 `persona`。

### 3. Capability

`capability` 表达“能做什么”，统一描述业务动作，不按页面名命名。

### 4. Scope

`scope` 表达“能作用到哪些数据”，统一数据范围语义。

### 5. State Guard

`state_guard` 表达“在什么业务状态下 capability 才生效”，将权限与状态机解耦。

### 6. Surface Binding

`surface_binding` 表达“页面、菜单、按钮、接口、卡片如何绑定到 capability”，保证多端入口统一消费同一套事实源。

### 一句话结构

`subject -> persona -> capability -> scope -> state_guard -> surface_binding`

## Persona 设计

### 组织身份 `org persona`

1. `org.employee`
2. `org.line_manager`
3. `org.department_head`
4. `org.executive`
5. `org.hrbp`

这层表达组织中的角色视角，不直接等于岗位名称。

### 职能身份 `functional persona`

1. `fn.performance_operator`
2. `fn.recruitment_owner`
3. `fn.learning_admin`
4. `fn.compensation_admin`
5. `fn.procurement_admin`
6. `fn.asset_admin`
7. `fn.office_admin`
8. `fn.teacher_channel_owner`
9. `fn.analysis_viewer`

这层表达长期职能责任，而不是某个页面的临时标签。

### 特殊身份 `special persona`

1. `sp.approval_delegate`
2. `sp.readonly_auditor`
3. `sp.super_admin`

### Persona 命名规则

1. 统一使用英文稳定 key，页面再映射中文 label。
2. `org.` 表示组织身份。
3. `fn.` 表示职能身份。
4. `sp.` 表示特殊身份。
5. 不允许继续扩散 `hr`、`manager`、`staff` 这类语义模糊、边界不清的临时命名。

## Capability 设计

### 命名原则

统一采用 `领域.对象/场景.动作` 的形式，不按页面命名，不按角色命名。

### 示例

绩效主链：

1. `assessment.self.read`
2. `assessment.self.edit`
3. `assessment.submit`
4. `assessment.review.read`
5. `assessment.review.approve`
6. `assessment.review.reject`
7. `assessment.manage.create`
8. `assessment.manage.update`
9. `assessment.manage.delete`
10. `assessment.export`

审批流：

1. `approval.config.read`
2. `approval.config.write`
3. `approval.instance.read`
4. `approval.instance.approve`
5. `approval.instance.reject`
6. `approval.instance.transfer`
7. `approval.instance.withdraw`
8. `approval.instance.remind`
9. `approval.instance.resolve`
10. `approval.instance.terminate`

分析与看板：

1. `dashboard.summary.read`
2. `dashboard.cross_summary.read`
3. `analysis.performance.read`
4. `analysis.organization.read`
5. `analysis.export`

其他职能域：

1. `salary.read`
2. `salary.manage`
3. `recruitment.manage`
4. `course.manage`
5. `asset.manage`
6. `office.manage`
7. `teacher_channel.manage`

## Scope 设计

建议统一收敛为少数稳定范围类型：

1. `self`
2. `direct_reports`
3. `department`
4. `department_tree`
5. `company`
6. `assigned_domain`
7. `explicit_list`

同一个 capability 在不同 persona 下可映射到不同 scope。

例如：

1. `assessment.review.read`
   - `org.line_manager` -> `direct_reports`
   - `org.department_head` -> `department_tree`
   - `org.hrbp` -> `company`
2. `dashboard.summary.read`
   - `org.employee` -> `self`
   - `org.line_manager` -> `department`
   - `org.executive` -> `company`

## State Guard 设计

`state_guard` 统一约束 capability 在特定业务状态下是否允许执行。

### 评估单 assessment

1. `assessment.self.edit`
   - 允许状态：`draft`, `rejected`
2. `assessment.submit`
   - 允许状态：`draft`
3. `assessment.review.approve`
   - 允许状态：`submitted`
4. `assessment.review.reject`
   - 允许状态：`submitted`
5. `assessment.manage.delete`
   - 允许状态：`draft`

### 审批流 approval

1. `approval.instance.withdraw`
   - 仅发起人且审批流允许撤回的活跃状态
2. `approval.instance.approve`
   - 仅当前待处理节点
3. `approval.instance.reject`
   - 仅当前待处理节点
4. `approval.instance.transfer`
   - 仅允许转办的活跃节点
5. `approval.instance.resolve`
   - 仅 HR 人工兜底场景
6. `approval.instance.terminate`
   - 仅高权限人工终止场景

关键原则：

1. 页面不再自行判断状态。
2. 服务层不再分散发明动作前提。
3. 所有动作统一走 `state_guard` 解析。

## Surface Binding 设计

### 绑定类型

建议统一定义五类 surface：

1. `route`
2. `menu`
3. `action`
4. `api`
5. `widget`

### 绑定规则

1. `route`
   - 绑定进入页面所需最小 capability。
2. `menu`
   - 绑定菜单展示所需 capability。
3. `action`
   - 绑定按钮或操作项所需 capability，并追加 `state_guard`。
4. `api`
   - 服务端最终校验 capability + scope + state guard。
5. `widget`
   - 绑定工作台卡片、驾驶舱卡片是否对当前 persona 可见。

### 示例：员工自评

1. route `/performance/my-assessment`
   - `assessment.self.read`
2. action 保存
   - `assessment.self.edit`
   - 状态：`draft|rejected`
3. action 提交
   - `assessment.submit`
   - 状态：`draft`
4. api
   - `info` -> `assessment.self.read`
   - `update` -> `assessment.self.edit`
   - `submit` -> `assessment.submit`

### 示例：主管审批

1. route `/performance/pending`
   - `assessment.review.read`
2. action 审批通过
   - `assessment.review.approve`
   - 状态：`submitted`
3. action 审批驳回
   - `assessment.review.reject`
   - 状态：`submitted`
4. api
   - `/approve` -> `assessment.review.approve`
   - `/reject` -> `assessment.review.reject`

### 示例：HR 分析页

1. route `/data-center/dashboard`
   - `dashboard.summary.read`
2. widget 组织横向分析
   - `dashboard.cross_summary.read`
3. action 导出
   - `analysis.export`

## 统一判定链路

以后任何页面进入、按钮展示或接口动作，统一按以下顺序处理：

1. 找到当前 `subject`
2. 解析其可用 `persona`
3. 根据当前场景自动选取默认 persona
4. 在允许切换的页面支持手动切换 persona
5. 根据当前 surface 解析所需 capability
6. 校验 capability 对应的 scope
7. 校验 state guard
8. 通过后才展示入口、返回数据或执行动作

## 全模块映射

### 一、绩效主链

- 模块：
  `assessment`、`approval-flow`、`dashboard`、`workbench`
- 主 persona：
  `org.employee`、`org.line_manager`、`org.department_head`、`org.executive`、`org.hrbp`、`fn.performance_operator`
- 特点：
  强状态机、强审批、强数据范围控制

### 二、人才与组织

- 模块：
  `recruit-plan`、`resume-pool`、`interview`、`hiring`、`job-standard`、`talent-asset`
- 主 persona：
  `org.line_manager`、`org.department_head`、`org.hrbp`、`fn.recruitment_owner`
- 特点：
  HR 与业务负责人共治，读写边界容易漂移

### 三、学习发展

- 模块：
  `course`、`course-learning`、`capability`、`certificate`
- 主 persona：
  `org.employee`、`org.line_manager`、`org.hrbp`、`fn.learning_admin`
- 特点：
  员工参与、主管跟进、HR 运营

### 四、薪酬与异动

- 模块：
  `salary`、`promotion`、`pip`、`suggestion`、`feedback`
- 主 persona：
  `org.line_manager`、`org.department_head`、`org.hrbp`、`fn.compensation_admin`、`fn.performance_operator`
- 特点：
  敏感数据多，导出、人工处理、分析必须单独控

### 五、采购与资产

- 模块：
  `purchase-*`、`supplier`、`asset-*`
- 主 persona：
  `org.line_manager`、`org.department_head`、`fn.procurement_admin`、`fn.asset_admin`
- 特点：
  申请人、审批人、管理员三套视角并存

### 六、行政协同

- 模块：
  `office/*`、`meeting`、`contract`
- 主 persona：
  `fn.office_admin`、`org.department_head`、`org.executive`
- 特点：
  当前存在 HR-only 语义，后续需改成 persona/capability 表达

### 七、教师渠道

- 模块：
  `teacher-channel/*`
- 主 persona：
  `fn.teacher_channel_owner`、`org.department_head`、`org.executive`
- 特点：
  当前已有独立范围语义，后续统一纳入 scope 模型

## 迁移路径

### 第一步：建立后端 SSOT 注册中心

新增统一注册层，定义：

1. persona 清单
2. capability 清单
3. scope 类型
4. state guard 规则
5. surface binding 关系

这一阶段只新增，不替换旧逻辑。

### 第二步：建立旧权限到 capability 的兼容映射

将当前 `perms` 字符串映射到新 capability，确保 `menu.json`、`authority.ts` 和已有前端入口仍可运行。

### 第三步：先收服务层，不先收前端

优先把服务层中的分散判断改成统一解析入口。首批收口对象包括：

1. [assessment.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/assessment.ts)
2. [approval-flow.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/approval-flow.ts)
3. 工作台默认 persona 解析接口
4. 驾驶舱 capability 与 scope 解析

### 第四步：收 Surface Binding

逐步将 route/menu/action/api/widget 接入 capability 绑定关系。

### 第五步：收工作台与驾驶舱

把前端本地猜角色改成后端返回：

1. 可用 persona 列表
2. 默认 persona
3. 允许切换的 persona
4. 当前 persona 下的 widget 可见性与动作入口

### 第六步：清理旧逻辑

完成分阶段迁移后，再清理：

1. 前端 `hr / manager / staff` 占位角色
2. 服务层中基于导出权限推断 HR 的逻辑
3. 路由直接写死旧 perms 的临时兼容规则

## 实施顺序建议

### 第一批

1. `assessment`
2. `approval-flow`
3. `workbench`
4. `dashboard`

这四块最能定义统一模型，也最能验证设计是否正确。

### 第二批

1. `feedback`
2. `suggestion`
3. `promotion`
4. `pip`
5. `salary`

### 第三批

1. 招聘/培训/人才
2. 采购/资产
3. 行政协同
4. 教师渠道

## 迁移期间硬规则

1. 只允许新增兼容，不允许一次性删除旧权限体系。
2. 后端必须先成为事实源，前端再切。
3. 每迁一个模块，都必须给出：
   - persona 解析证据
   - capability/scope 解析证据
   - state guard 非法路径拦截证据
4. 不允许继续新增散落的 HR、主管、本人、部门树硬编码判断。

## 验收标准

### 正常路径

1. 员工只能编辑和提交本人允许状态下的评估单。
2. 直属主管或部门负责人能看到自己范围内的待审批数据。
3. HRBP 和分析类身份能访问符合范围的分析页与看板。
4. 同一账号具备多 persona 时，系统能自动选中当前场景默认视角。

### 异常路径

1. 无 capability 不能进页面、不能看到按钮、不能调接口。
2. 有 capability 但超出 scope，不能读取或操作越权数据。
3. 有 capability 和 scope 但状态不合法，动作必须被拒绝。

### 边界路径

1. 多身份账号可切换分析页视角，但后端鉴权不依赖前端切换标签。
2. 代理审批人只能在代理规则生效时拥有临时审批能力。
3. HR 只读分析身份与 HR 运营身份不能混为一谈。

## 风险与注意事项

1. `HR` 在现有代码中被混用于导出、全局可见、流程配置和人工处理，不拆开一定继续漂移。
2. `manager` 当前可能既表示直属主管，也表示部门负责人，必须用 persona + scope 明确区分。
3. 工作台是最容易出现“前端视角与后端真相不一致”的入口，不能继续做本地猜测。
4. 若不建立旧权限兼容层，一次性替换会直接冲击现有 menu、route、service。

## During Implementation

- Change summary:
  本次仅新增设计文档，收敛 `performance` 全域角色事实源方案。
- Reused modules or patterns:
  参考现有 spec 文档结构、现有权限与状态事实源治理方式。
- New dependencies and why existing tools were insufficient:
  无。
- Verification run after each meaningful change:
  本次为设计文档，不涉及代码执行验证。
- Normal-path evidence:
  已在设计中给出员工、主管、HR、管理层主链规则。
- Error-path evidence:
  已定义越权、越范围、非法状态三类拒绝路径。
- Boundary-case evidence:
  已定义多身份叠加、代理审批和只读分析身份边界。
- Permission checks:
  设计要求所有 surface 绑定 capability，不再直接绑定角色名。
- State-flow checks:
  设计要求所有动作统一挂到 state guard。
- Contract checks:
  设计要求 Web、Uni、menu、api 共享同一套解析结果。
- Change-type verification mapping:
  当前为设计阶段，无自动化验证；实施阶段需补 persona/capability/scope/state 四类验证。
- High-risk trigger changes:
  权限、范围、状态机、审批、导出、工作台默认视角。
- Compatibility or fallback impact:
  明确要求旧 perms 到 capability 的兼容层。
- Privacy/PII review result:
  本文未新增用户数据字段或日志输出。
- Docs or operational updates made:
  新增统一角色事实源设计文档。

## Blockers And Waivers

- Open `P0` blockers:
  无。
- Open `P1` blockers:
  尚未形成实施计划与验证矩阵，不能直接进入代码改造。
- Open `P2` issues:
  无。
- Approved waivers:
  无。

## Before Commit

- Diff review result:
  仅新增一份设计文档，未触碰现有业务代码。
- Verification summary:
  设计文档已与当前代码现状对照，未执行自动化测试。
- What was run:
  当前项目结构、现有 spec、绩效模块角色/权限/状态相关代码检视。
- What passed:
  设计与当前实现现状已对齐，无目录或命名冲突。
- What was not run:
  未运行测试、lint、构建；本次无代码改动。
- Remaining risk:
  设计落地时仍需细化 capability 清单和第一批模块映射。
- Tests added or updated, or why not:
  未新增测试；本次仅为设计文档。
- Commit scope statement:
  仅提交 `performance` 角色事实源设计说明。
- Commit summary:
  docs: add performance role ssot design

## Before Release Or Handoff

- Acceptance-to-verification mapping:
  需在后续实施计划中补齐。
- Contract alignment result:
  设计要求通过 capability/scope/state/surface 统一收敛。
- Config changes:
  无。
- Migration plan:
  已定义六步渐进迁移路径。
- Rollout steps:
  先第一批模块，再第二批，再第三批。
- Rollback path:
  初期通过旧 perms 兼容层保留旧行为，可逐批回退。
- Feature flag, kill switch, or staged rollout plan:
  建议按模块分批切换，不做整域一次切换。
- Data recovery path:
  本阶段无数据变更。
- Monitoring and diagnostic entry points:
  后续实施阶段应记录 persona/capability/scope/state 解析日志与拒绝原因。
- Final `P0` and `P1` blocker check:
  无 `P0`；存在“未出实施计划”的 `P1`，因此当前只能作为设计阶段产出。
- Approved waivers:
  无。
- Final release risk statement:
  本文可作为后续实施唯一设计入口，但未完成实施计划前不应直接进入跨模块代码改造。
