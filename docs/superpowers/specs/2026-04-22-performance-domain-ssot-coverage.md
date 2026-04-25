<!-- 文件职责：记录 performance 域当前已经落地的 SSOT 覆盖面、运行时消费入口与尚未统一的事实源；不负责替代详细设计文档或业务需求说明；依赖当天的 phase1 设计文档、ADR、registry 代码与守卫脚本；维护重点是让后续改动能快速定位“该改哪一份主源”。 -->
# 2026-04-22 Performance 域 SSOT 覆盖面

## 结论

截至 2026-04-24，`performance` 域中与 `access-context.ts` 直接相关的静态 capability-scope 真相，已经基本收敛到后端 registry/catalog。

当前最主要的唯一事实源入口是：

1. [cool-admin-midway/src/modules/performance/domain/registry/index.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/registry/index.ts)
2. [cool-admin-midway/src/modules/performance/domain/roles/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/roles/catalog.ts)
3. [cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts)
4. [cool-admin-midway/src/modules/performance/domain/errors/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/errors/catalog.ts)
5. [cool-admin-midway/src/modules/performance/domain/states/assessment.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/states/assessment.ts)
6. [cool-admin-midway/src/modules/performance/domain/states/approval-flow.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/states/approval-flow.ts)

## 已集中事实源

### 1. 后端领域统一入口

唯一入口：
[cool-admin-midway/src/modules/performance/domain/registry/index.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/registry/index.ts)

这里聚合了：

1. `errors`
2. `stateMachines`
3. `businessDicts`
4. `personas`
5. `personaInferenceRules`
6. `personaWorkbenchPages`
7. `surfaceAccessRules`
8. `workbenchPageAccessRules`
9. `capabilityScopeRuleGroups`
10. `capabilities`
11. `scopes`
12. `stateGuards`

### 2. 角色/权限/能力/范围主源

唯一入口：
[cool-admin-midway/src/modules/performance/domain/roles/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/roles/catalog.ts)

这里现在是以下事实的主源：

1. persona 定义
2. persona 优先级
3. persona 推断规则
4. workbench 页面可见性规则
5. capability 列表
6. scope 列表
7. capability-scope rule groups
8. `access-context.ts` 兼容层用到的 legacy permission alias
9. state guard 定义

已接线到 `access-context.ts` 的 rule group 包括：

1. `assessment`
2. `approval_flow`
3. `dashboard`
4. `capability_domain`
5. `certificate_domain`
6. `job_standard`
7. `purchase_report`
8. `goal`
9. `talent_asset`
10. `course_learning`
11. `course_catalog`
12. `contract`
13. `indicator`
14. `intellectual_property`
15. `material_domain`
16. `salary_domain`
17. `feedback`
18. `suggestion`
19. `promotion`
20. `pip`
21. `workplan`
22. `meeting`
23. `interview`
24. `recruit_plan`
25. `resume_pool`
26. `hiring`
27. `asset_domain`
28. `purchase_order`
29. `teacher_domain`
30. `supplier_vehicle`
31. `document_center`
32. `knowledge_base`
33. `office_collab`

### 3. 业务字典主源

唯一入口：
[cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts)

当前它是“业务字典注册信息”的主源，`DictInfoService` 已开始从这里读取统一注册信息。

### 4. 状态机主源

当前已机器可读化的状态机主源：

1. [cool-admin-midway/src/modules/performance/domain/states/assessment.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/states/assessment.ts)
2. [cool-admin-midway/src/modules/performance/domain/states/approval-flow.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/states/approval-flow.ts)

### 5. 错误目录主源

当前统一错误目录入口：
[cool-admin-midway/src/modules/performance/domain/errors/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/errors/catalog.ts)

这是“错误目录定义”的主源，但还不是所有运行时异常抛出的唯一入口。

## 运行时消费点

已经直接消费这些主源的关键运行时点包括：

1. [cool-admin-midway/src/modules/performance/service/access-context.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/access-context.ts)
2. [cool-admin-midway/src/modules/dict/service/info.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/dict/service/info.ts)

`access-context.ts` 当前主要职责已经收缩为：

1. 登录上下文解析
2. 部门/角色上下文解析
3. 动态 preset 组合
4. persona 推断与默认视角裁决

它不再是大块静态 capability-scope 真相的落点。

## 已加门禁

守卫脚本：
[scripts/check-performance-domain-model-ssot.mjs](/Users/shaotongli/Documents/xuedao/scripts/check-performance-domain-model-ssot.mjs)

当前已覆盖的结构门禁包括：

1. 前端 performance wrapper 类型必须继续从 generated 契约派生
2. `PerformanceLegacyPermissionAlias` 不得有重复 union 成员
3. `PERFORMANCE_CAPABILITIES` 不得有重复 key
4. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 的 `capabilityKey` 必须已在 capability 主表中注册
5. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 的 `capabilityKey` 不得重复
6. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 的 `scopePreset` 必须已在 preset 主表中声明
7. `PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS` 的 `legacyPermissionAliases` 必须已在 alias 主表中声明

## 已补齐的服务层专项测试

当前不只是“角色主源已经统一”，而且下面这批关键服务已经补了“谁能操作、越权是否被拒、终态还能不能推进”的专项测试。

### 1. 角色主源与边界总表回归

1. [cool-admin-midway/test/performance/access-context.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/access-context.service.test.ts)
   验证 persona 推断、默认主视角、scope 解析和 capability 命中结果。
2. [cool-admin-midway/test/performance/role-boundary-matrix.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/role-boundary-matrix.service.test.ts)
   验证 5 个 persona 在 assessment、goal、approval-flow、dashboard、salary、招聘链、采购链、teacher-channel、office/document 等分组模块中的可见面与能力边界。

### 2. 绩效主链专项测试

1. [cool-admin-midway/test/performance/assessment.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/assessment.service.test.ts)
   已覆盖“仅本人可提交”“非法状态不可审批”“范围外主管不可审批”。
2. [cool-admin-midway/test/performance/approval-flow.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/approval-flow.service.test.ts)
   已覆盖“非申请人不可撤回”“节点已处理后不可撤回”“非 HR 不可终止”“终止后不可再次终止”。
3. [cool-admin-midway/test/performance/goal.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/goal.service.test.ts)
   已覆盖“越权不可更新进度”“完成后不可继续更新进度”。
4. [cool-admin-midway/test/performance/goal-operations.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/goal-operations.service.test.ts)
   已覆盖“员工不能伪装主管管部门目标”“日报补零只处理 assigned”“已离开 assigned 状态的计划不可重复填报”。
5. [cool-admin-midway/test/performance/feedback.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/feedback.service.test.ts)
   已覆盖“重复提交拒绝”“截止后拒绝”“非该评价人不可提交”“无独立导出权限不可导出”。
6. [cool-admin-midway/test/performance/work-plan.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/work-plan.service.test.ts)
   已覆盖“来源审批未通过不能开始”“范围外不能开始”“已完成后不能取消”。

### 3. 晋升 / PIP 专项测试

1. [cool-admin-midway/test/performance/promotion.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/promotion.service.test.ts)
   已覆盖“已绑定建议不可重复关联”“审批流开启时禁止旧手工评审”“失去范围后不能再提交晋升单”。
2. [cool-admin-midway/test/performance/pip.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/pip.service.test.ts)
   已覆盖“已绑定建议不可重复关联”“范围外不能启动”“completed 后不能再 close”“导出超限拒绝”。

### 4. 招聘链专项测试

1. [cool-admin-midway/test/performance/interview.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/interview.service.test.ts)
   已覆盖“部门经理无归属部门不能新建”“终态不可编辑”“删除必须符合权限与状态”“公司级可删除空部门 scheduled 面试”。
2. [cool-admin-midway/test/performance/recruit-plan.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/recruit-plan.service.test.ts)
   已覆盖“下游引用时不可删除”“范围外不能查看/新增/提交/关闭/作废/重开”“非法状态不可流转”。
3. [cool-admin-midway/test/performance/resumePool.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/resumePool.service.test.ts)
   已覆盖“归档后不可编辑/上传/转人才资产”“面试中不可重复发起面试”“范围外不可新增、不可导入覆盖、不可转人才资产、不可发起面试”。
4. [cool-admin-midway/test/performance/hiring.service.test.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/test/performance/hiring.service.test.ts)
   已覆盖“范围外不可新增/改状态/关闭”“终态后不可再改状态或关闭”“非法新增状态拒绝”。

### 5. 当前这份覆盖面文档的人话结论

现在 `performance` 域已经不是只有一份“角色设计稿”，而是至少形成了下面这条闭环：

1. `roles/catalog.ts` 定义 persona、capability、scope 和 state guard 主源
2. `access-context.ts` 把登录人真正解析成运行时 access context
3. `role-boundary-matrix` 把角色边界翻译成人话总表
4. 关键服务测试把“越权要失败、非法状态要失败”压成可回归的事实

## 还没完全统一的事实源

下面这些还不是“registry 单一入口已经闭环”的状态：

### 1. OpenAPI 契约生成链

当前事实源仍主要在：

1. `contracts/openapi/xuedao.openapi.json`
2. `cool-admin-vue/src/modules/performance/generated/*`
3. `cool-uni/types/performance-*`

后端 registry 还没有成为 OpenAPI 的正向生成源。

### 2. 前端展示/请求类型

前端 admin/uni 的实体与请求类型仍以 generated 契约为主源，而不是直接从后端 registry 生成。

这部分的唯一事实源是“OpenAPI generated 契约链”，不是 `performance/domain/registry`。

### 3. 权限菜单与 permission bits

当前菜单、权限位和页面权限链还分散在：

1. `cool-admin-midway/src/modules/base/menu.json`
2. `cool-admin-midway/src/modules/base/generated/permissions.generated.ts`
3. `cool-admin-midway/src/modules/base/generated/permission-bits.generated.ts`

`roles/catalog.ts` 已经能描述 capability 与 legacy permission alias 的映射，但还不是菜单与权限位分配的正向主源。

### 4. 全量状态机与错误运行时抛出

当前 `states/*` 和 `errors/catalog.ts` 已有骨架，但还没有覆盖 `performance` 域内所有聚合、所有状态机和所有异常抛出路径。

## 后续改动怎么选主源

如果后续要改：

1. persona、capability、scope、workbench 页签、capability-scope 规则
改 [roles/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/roles/catalog.ts)

2. 业务字典注册信息
改 [dicts/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts)

3. 评估或审批流状态机定义
改 `states/*`

4. performance wrapper / 页面请求模型
先看 generated 契约链，再改 wrapper

5. `access-context.ts` 权限结果异常
优先查 `roles/catalog.ts` 和 preset 组合逻辑，不要先在 service 里补新的硬编码块

## 当前剩余债务

剩余更像二阶段治理，而不是继续搬静态规则：

1. 是否让 OpenAPI 或前端某些能力判断从 registry 只读消费
2. 是否继续把 persona/workbench/state guard 也做更强结构门禁
3. 是否补一份面向非研发的“performance 域事实源地图”
