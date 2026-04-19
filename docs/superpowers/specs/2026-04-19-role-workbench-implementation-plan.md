<!-- 负责记录“角色工作台”首版实施计划、分阶段改造顺序和前后端边界；不负责直接落地业务代码；依赖已冻结设计稿、现有 cool-admin-vue 导航分组、现有 performance 路由和现有 service；维护重点是首批范围、聚合方式和验收闭环不能在开发期无限膨胀。 -->
# 2026-04-19 角色工作台实施计划

## 目标

把 [2026-04-19-role-workbench-design.md](/Users/shaotongli/Documents/xuedao/docs/superpowers/specs/2026-04-19-role-workbench-design.md) 拆成可开发、可排期、可验收的实施步骤。

首版目标不是统一全部业务，而是先把 `角色工作台` 做成一个真能用的并列入口，优先解决三件事：

1. 员工少找页面。
2. 经理少漏审批和跟进。
3. HR 少漏收集和异常事项。

## 实施总原则

### 1. 先做壳，再接真待办

先把页面骨架和入口搭出来，再逐条接入待办，不要反过来先堆一堆数据再想首页长什么样。

### 2. 先轻聚合，不先大一统

首版优先复用：

1. 现有菜单体系。
2. 现有页面路由。
3. 现有 service。
4. 现有 query/prefill 跳转模式。

不要求第一版就做成统一待办平台。

### 3. 先前端聚合，后端按需要补

如果现有接口已经能拿到首批所需数据，就先前端聚合。

只有出现下面情况时才补后端聚合接口：

1. 一个区块要同时打 3 个以上接口才凑得齐。
2. 同一个首页每次进入都要多次拼装分页接口，性能和复杂度不可接受。
3. 某类角色任务需要后端统一算权限或责任归属，前端无法可靠判断。

## 当前可复用基础

基于当前代码，已经存在以下可复用点：

### 前端现有入口

1. 导航分组在 [menu-grouping.js](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/base/store/menu-grouping.js)。
2. 已有绩效待办页：
   - [pending/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/pending/index.vue)
   - [my-assessment/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/my-assessment/index.vue)
   - [initiated/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/initiated/index.vue)
3. 行政协同已有独立页面壳：
   - [office-page-shell.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/office/office-page-shell.vue)
   - [office-ledger-page.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/office/office-ledger-page.vue)
4. 东西领用/资产相关已有独立作业页：
   - [asset/assignment.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/asset/assignment.vue)

### 前端现有跳转模式

代码里已经存在两类可直接复用的跳转模式：

1. 直接 `router.push({ path })`
2. 带 query/prefill 进入页面后消费路由参数

这说明工作台首版完全可以走：

`任务卡 -> 现有路由 -> 页面内部用 query/prefill/筛选接住`

### 后端现有基础

当前 `performance` 下面已经有大量独立业务接口和 service。首版不建议马上做“大一统工作台接口”，而是先围绕首批事项判断：

1. 是否已有列表接口能筛出“待我处理”。
2. 是否已有 summary/count 能做头部汇总。
3. 是否已有详情/编辑页能承接直达。

## 开发分阶段

首版建议拆成 4 个阶段。

## Phase 1：工作台空壳上线

### 目标

先让工作台成为一个真实可点击入口，并把首页骨架稳定下来。

### 前端范围

建议新增：

1. 一个独立工作台页面，例如：
   - `cool-admin-vue/src/modules/performance/views/workbench/index.vue`
2. 一个工作台任务卡组件，例如：
   - `cool-admin-vue/src/modules/performance/components/workbench-task-card.vue`
3. 一个工作台区块配置或 mock 数据文件，例如：
   - `cool-admin-vue/src/modules/performance/workbench/`

### 导航改造

在 [menu-grouping.js](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/base/store/menu-grouping.js) 中新增并列入口，使工作台成为现有一级业务入口旁的一个稳定可见入口。

这里建议：

1. 先做单独入口。
2. 不改掉现有业务域。
3. 工作台命名直接叫 `工作台`，不要叫“个人中心”。

### 页面结构

Phase 1 只保证 6 块结构稳定：

1. 角色头部
2. 待我处理
3. 我的事项
4. 角色专区
5. 快捷入口
6. 风险提醒

### 验收

1. 页面能进。
2. 页面不空壳难看，至少有稳定骨架和占位逻辑。
3. 同一页面能根据角色显示不同占位内容。
4. 不影响现有菜单和现有模块入口。

## Phase 2：统一任务模型和前端聚合层

### 目标

把首页“任务卡”做成统一数据结构，避免后面接一个业务写一套。

### 建议新增前端类型

建议在 [types.ts](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/types.ts) 或独立 `workbench/types.ts` 中新增：

1. `WorkbenchRole`
2. `WorkbenchActionType`
3. `WorkbenchTaskDomain`
4. `WorkbenchTaskCard`
5. `WorkbenchSectionData`

### 任务卡字段建议

首版统一字段最少包含：

1. `id`
2. `roleScope`
3. `actionType`
4. `domainTag`
5. `title`
6. `deadlineLabel`
7. `statusHint`
8. `priority`
9. `jumpType`
10. `path`
11. `query`
12. `permission`

### 建议新增前端聚合层

建议新增一个薄层 service，例如：

1. `cool-admin-vue/src/modules/performance/service/workbench.ts`

它不直接发明业务接口，而是负责：

1. 并行调现有 service。
2. 把现有业务数据转成统一任务卡。
3. 按角色过滤。
4. 按动作类型分桶。
5. 生成首页头部统计和风险摘要。

### 是否需要后端接口

Phase 2 不强制需要。

先按“前端聚合”做，只有下面任一条件成立，才进入后端补接口：

1. 首屏请求数过多。
2. 同一事项需要多处接口拼装。
3. 角色过滤和责任归属只能后端可靠判断。

### 验收

1. 首页渲染不依赖写死文案。
2. 所有首批任务卡都来自统一模型。
3. 同一组件能渲染员工/经理/HR 三类卡片。

## Phase 3：首批业务接入

### 目标

每个角色先接 2 到 3 个最容易闭环的事项，先把“真待办”跑起来。

### 建议首批范围

#### 员工

1. 数据填报
2. 东西领用
3. 我的协同待办

#### 经理

1. 待审批
2. 待确认
3. 团队填报催办

#### HR

1. 待收集
2. 待审核
3. 异常补录

### 第一批建议优先顺序

为了更稳，建议不是三个角色同时全开，而是按下面顺序：

1. 先接 `经理待审批`
   - 现有 [pending/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/pending/index.vue) 已经比较像工作台里的标准待办落点。
2. 再接 `员工我的事项`
   - 现有 [my-assessment/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/my-assessment/index.vue) 和 [initiated/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/initiated/index.vue) 可以承接“我的结果”。
3. 再接 `东西领用`
   - 现有 [assignment.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/asset/assignment.vue) 可作为首批直达目标之一。
4. 最后接 `行政协同`
   - 现有 office 系列页面较多，适合在工作台模型稳定后再接，避免一开始被多业务差异拖慢。

### 每类接入方式

#### A. 已有明确待办页

直接接工作台卡片，跳现有页。

示例：

1. `待审批` -> `/performance/pending`

#### B. 已有列表页但需要筛选

工作台生成 query，进列表页后页面自动按 query 定位。

示例：

1. `我的事项` -> `/performance/my-assessment?from=workbench`
2. `我发起的` -> `/performance/initiated?from=workbench`

#### C. 已有作业页

直接进入作业页或带上 query/prefill。

示例：

1. `东西领用` -> `/performance/asset/assignment`

#### D. 行政协同多模块页

先只做快捷入口或筛选入口，不在首版强求所有行政页都变成统一待办源。

### Phase 3 验收

1. 每个角色至少有 2 类真事项。
2. 每类事项能点进去处理。
3. 处理后返回首页，卡片数量或状态能变化。
4. 不出现大量假待办或无效跳转。

## Phase 4：补后端聚合接口和风险提醒

### 进入条件

只有在 Phase 3 证明首版可用、但前端聚合已经明显吃力时，才进入这一阶段。

### 后端建议新增内容

如果需要，建议只补一个薄聚合接口，例如：

1. `GET /admin/performance/workbench/summary`

返回：

1. 角色头部摘要
2. 按动作类型分桶后的任务卡
3. 风险提醒
4. 我的事项摘要

### 后端设计原则

1. 聚合接口只做首页分发。
2. 不替代现有业务接口。
3. 不改现有业务状态流。
4. 不把所有业务硬并成统一模型后再返给前端。

### 风险提醒补法

建议只补轻量规则：

1. 今日截止
2. 已逾期
3. 被退回
4. 缺关键材料

不做消息中心，不做订阅系统。

## 前端文件级改造建议

首版前端大概率会落在这些位置：

### 必改

1. [menu-grouping.js](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/base/store/menu-grouping.js)
   - 新增工作台入口归组
2. `cool-admin-vue/src/modules/performance/views/workbench/index.vue`
   - 新增工作台首页
3. `cool-admin-vue/src/modules/performance/service/workbench.ts`
   - 新增前端聚合 service
4. [types.ts](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/types.ts)
   - 新增工作台任务模型类型

### 大概率会改

1. [pending/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/pending/index.vue)
   - 接工作台来源 query 或返回逻辑
2. [my-assessment/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/my-assessment/index.vue)
   - 接工作台筛选和回跳
3. [initiated/index.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/initiated/index.vue)
   - 接工作台筛选和回跳
4. [assignment.vue](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/asset/assignment.vue)
   - 接工作台来源、筛选或快捷操作

### 后续再改

1. office 系列页
   - 视首批接入结果逐步接

## 后端是否必须改

结论是：

`第一版不必须`

建议顺序：

1. 先前端聚合。
2. 做出首版可用工作台。
3. 再评估是否补后端聚合接口。

这样风险更低，因为我们先验证“用户到底怎么用”，避免先造一个大而全的 workbench API，最后却不适合真实首页。

## 开发顺序建议

建议真实开发按下面顺序排：

1. 加导航入口。
2. 建工作台页面壳。
3. 建任务类型和任务卡组件。
4. 接经理待审批。
5. 接员工我的事项。
6. 接东西领用。
7. 接 HR 收集/审核摘要。
8. 再补风险提醒。

这个顺序的好处是：

1. 最快能看到页面成形。
2. 最快能看到“真待办闭环”。
3. 最少受复杂业务差异影响。

## 验收拆解

### 开发自测

每接入一类事项，都至少验证：

1. 任务能出现。
2. 任务只出现在正确角色下。
3. 点击能到正确页面。
4. 处理后首页状态变化。

### 产品验收

产品侧至少确认：

1. 首页信息顺序是否符合“先动作，后结果”。
2. 员工、经理、HR 差异是否明显。
3. 首批事项是否真的是最高频、最值得放首页的那几类。

### UI 验收

UI 侧至少确认：

1. 首页 6 块结构稳定。
2. 任务卡信息层级清晰。
3. 不同角色页面仍然保持同一套视觉语言。

### 研发验收

研发侧至少确认：

1. 现有页面没有被工作台接入破坏。
2. 没有改坏现有权限控制。
3. 首屏请求量可接受。

## 风险与对策

### 风险 1：一开始就想接太多业务

对策：

1. 严格按首批接入清单推进。
2. 不满足“四明确”的事项先不进。

### 风险 2：工作台变成一堆模块入口拼盘

对策：

1. 首页只接受任务卡，不接受模块卡。
2. 无动作内容只能去快捷入口或我的事项。

### 风险 3：跳转进去还得自己再找

对策：

1. 能直达就直达。
2. 不能直达必须带筛选 query。

### 风险 4：角色边界不清，出现错看或漏看

对策：

1. 任务模型显式带 `roleScope` 和 `permission`。
2. 后续如发现前端无法可靠判断，再补后端聚合接口。

## 本计划完成标准

这份实施计划算可执行，至少要满足：

1. 能明确前端先改哪里。
2. 能明确第一批先接哪几类事项。
3. 能明确后端第一版是不是必须改。
4. 能明确每一步怎么验收。

## 结论

下一步最合理的动作不是直接开干所有业务，而是：

1. 先做 `工作台空壳 + 统一任务模型`
2. 再接 `经理待审批 + 员工我的事项 + 东西领用`
3. 跑通后再决定是否补后端聚合接口

这样最稳，也最符合这次设计稿的本意。
