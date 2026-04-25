<!-- 负责记录“业务状态与数据字典单一事实源”方案的分层边界、接口契约和迁移顺序；不负责直接落地后端接口、前端页面替换或一次性清理全部历史常量；依赖现有 base 字典能力、performance 业务模块和多端消费链路；维护重点是业务事实源必须留在后端业务域，base 只做分发，不得重新把业务常量散落回页面和工具文件。 -->
# 2026-04-21 业务状态与数据字典 SSOT 设计

## 目标

为 `xuedao` 仓库建立一套稳定的“业务状态与数据字典”单一事实源方案，避免：

1. 后端定义状态值，前端各自手写标签和判断。
2. Web、Uni、Backend 对同一状态值使用不同文案。
3. 页面里继续扩散 `status === 1`、`value: 0/1` 这类魔术数字。
4. 业务模块越来越多后，`base` 变成新的业务常量堆放点。

本方案的核心结论是：

1. 业务值域和状态机规则由后端业务域持有。
2. 展示标签、顺序、色板和可选元数据由后端统一下发。
3. `base` 只负责通用字典能力、缓存和分发，不直接手写业务真相。
4. Web 和 Uni 只消费统一入口，不再自行声明业务状态选项。

## 背景与现状问题

当前仓库已经有两类不同成熟度的“共享事实源”：

### 已经做对的一类

权限常量已经走了“后端生成 -> 多端消费”的模式，例如：

1. [permission-ssot.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/base/service/sys/permission-ssot.ts)
2. [permission-bits.generated.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/base/generated/permission-bits.generated.ts)

这一类属于平台级、低频变更、强约束常量，适合作为 `base/generated` 产物长期存在。

### 目前做错的一类

`performance` 业务状态和字典仍然散落在多端代码里，例如：

1. Web 页面内联 `statusOptions`
2. Uni 类型文件里自己写标签函数
3. 后端 service helper 内部单独维护合法状态数组
4. 局部页面直接写 `status === 1`

这已经出现实际漂移，例如同一个指标适用范围值 `employee`，Web 和 Uni 使用了不同标签。

## 范围

本设计覆盖：

1. 后端业务状态值域定义。
2. 后端统一字典下发契约。
3. Web 和 Uni 的统一消费方式。
4. `base` 与业务域的职责边界。
5. 首批迁移顺序和验收标准。

本设计不覆盖：

1. 一次性重构所有历史页面。
2. 字典后台运营管理 UI 的完整增强。
3. 多语言国际化的完整策略。
4. 非业务枚举的所有技术常量治理。

## 设计原则

### 1. 业务真相不放在前端

任何业务状态值域、默认值、状态机和合法流转都不能以“前端常量文件”作为最终事实源。

### 2. `base` 只做通用能力，不做业务裁决

`base` 可以提供：

1. 字典查询接口
2. Store 缓存
3. 生成脚本
4. 通用类型壳子
5. 翻译与展示透传

`base` 不应该直接决定：

1. 招聘状态有哪些
2. 证书状态如何流转
3. 指标适用范围标签叫什么
4. 某个业务状态在什么角色下是否可选

### 3. 值域和标签分层

同一业务常量至少拆成两层：

1. 值域层
   - 用于校验、持久化、状态机、错误语义
2. 展示层
   - 用于标签、顺序、色板、筛选项、禁用态

### 4. 页面禁止再写业务魔术数字

页面中禁止继续新增：

1. `row.status === 1`
2. `{ label: '启用', value: 1 }`
3. `switch(status)` 里硬编码业务标签

### 5. 渐进迁移，不追求一刀切

先从漂移风险高、跨端共用明显、状态值简单的模块试点，再逐步扩展。

## 推荐架构

推荐采用“后端业务域持有事实源，`base` 负责分发”的混合方案。

### 分层结构

#### 1. 后端业务域层

每个业务域维护自己的值域和规则，例如：

1. `indicator`
2. `jobStandard`
3. `certificate`
4. `workPlan`
5. `teacherChannel`

这一层负责：

1. 合法状态集合
2. 默认值
3. 状态流转规则
4. 后端异常语义
5. 字典条目的业务来源

这一层不负责：

1. 前端缓存
2. 前端下拉控件行为
3. 多端页面渲染细节

#### 2. 业务字典注册层

后端新增一个统一的“业务字典注册表”，把业务域可对外下发的字典注册进去。

推荐 key 规则：

1. `performance.indicator.status`
2. `performance.indicator.applyScope`
3. `performance.jobStandard.status`
4. `performance.certificate.status`

这一层负责：

1. 聚合业务域暴露的字典
2. 统一输出结构
3. 控制可下发范围
4. 版本号或更新时间标记

#### 3. Base 分发层

`base` 复用并扩展现有字典通道，只负责：

1. 对外统一查询入口
2. 权限和租户透传
3. 缓存与刷新机制
4. 前端 Store 接入
5. 可选生成只读类型壳子

`base` 不直接保存业务字典真相。

#### 4. 前端消费层

Web 和 Uni 统一通过字典查询入口获取：

1. 筛选选项
2. 表单下拉项
3. 标签文案
4. 色板和顺序

前端页面只负责：

1. 读取字典
2. 基于值匹配项
3. 展示 label / tone / disabled

前端页面不负责自建字典。

## 接口契约建议

### 统一返回结构

```ts
type BusinessDictItem = {
  value: string | number;
  label: string;
  order: number;
  tone?: string;
  disabled?: boolean;
  extra?: Record<string, any>;
};

type BusinessDictGroup = {
  key: string;
  version: string;
  items: BusinessDictItem[];
};
```

### 查询接口建议

可复用现有字典接口能力，新增或扩展业务字典查询入口，支持按 key 批量请求：

```ts
type BusinessDictQuery = {
  keys?: string[];
};

type BusinessDictResponse = Record<string, BusinessDictGroup>;
```

### 示例

```json
{
  "performance.indicator.status": {
    "key": "performance.indicator.status",
    "version": "2026-04-21T10:00:00Z",
    "items": [
      { "value": 1, "label": "启用", "order": 10, "tone": "success" },
      { "value": 0, "label": "禁用", "order": 20, "tone": "info" }
    ]
  }
}
```

## 后端实现边界

### 业务域内部

后端业务域仍保留自己的强约束定义，例如：

1. `normalizeStatus`
2. `assertTransition`
3. `ALLOWED_STATUSES`
4. 默认值逻辑

但这些定义不能只停留在内部 helper，必须能向统一字典注册层输出展示元数据。

### 推荐组织方式

每个业务域新增一个轻量“字典导出”文件，例如：

1. `indicator-dict.ts`
2. `job-standard-dict.ts`
3. `certificate-dict.ts`

这些文件负责把业务域内部值域映射成统一字典项。

### 不推荐方式

不推荐直接在 `base/generated` 下手写：

1. `performance-status.generated.ts`
2. `job-standard-options.generated.ts`

除非这些文件是由后端业务域自动生成，且只做分发镜像，不是人工维护源头。

## 前端消费设计

### Web

在现有 [dict.ts](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/dict/store/dict.ts) 基础上扩展统一访问方式，使业务模块可以：

1. 预加载指定业务字典 key
2. 查询选项列表
3. 通过值反查标签和色板

推荐暴露能力：

1. `getOptions(key)`
2. `getLabel(key, value)`
3. `getMeta(key, value)`

页面迁移后应从：

1. 本地 `statusOptions`
2. 本地 `tagMap`
3. 本地 `switch`

切换为：

1. `businessDict.getOptions('performance.indicator.status')`
2. `businessDict.getLabel('performance.indicator.status', row.status)`

### Uni

Uni 不再在 `types/` 中手写业务标签函数，而是复用统一字典消费层。

`types/` 里可以保留：

1. 最小字段类型
2. 仅编译期所需的值类型

但不再保留：

1. `indicatorStatusLabel`
2. `indicatorApplyScopeLabel`
3. 大量业务标签 `switch`

### 页面禁令

迁移完成后，新增业务页面必须遵守：

1. 不新增内联 `statusOptions`
2. 不新增业务状态标签 `switch`
3. 不新增业务魔术数字判断

## 哪些常量可以放在 base

### 可以

适合放在 `base` 或 `base/generated` 的只有平台级、稳定、全局常量，例如：

1. 权限键
2. 权限位映射
3. 路由权限映射
4. 全局错误码命名空间
5. 协议级枚举

### 不可以直接手写在 base

不应把以下内容直接手写成 `base` 常量真相：

1. 招聘状态
2. 证书状态
3. 指标适用范围标签
4. 行政协同各台账状态
5. 资产、物资、班主任化等业务状态选项

### 例外

如果某业务常量同时满足：

1. 后端域单点定义
2. 全系统共享
3. 极低频变更
4. 不依赖运营配置
5. 通过生成链路同步到多端

则可以产出到 `base/generated`，但源头仍然必须是后端业务域，不是前端手写常量。

## 迁移顺序

建议分三批迁移。

### 第一批：高风险、已确认漂移

1. `indicator-library`
2. `job-standard`
3. `certificate`

选择理由：

1. 已有魔术数字或跨端标签不一致。
2. 状态集合相对小，适合试点。
3. Web 和 Uni 都有明显消费面。

### 第二批：多端筛选/表单重度使用

1. `work-plan`
2. `recruit-plan`
3. `resume-pool`
4. `supplier`
5. `meeting`

### 第三批：复杂业务和配置型模块

1. `teacher-channel`
2. `office-ledger`
3. `asset`
4. `material`

这些模块状态多、页面多，适合在字典基础设施稳定后迁移。

## 试点模块建议

首个试点建议选 `indicator-library`。

原因：

1. 已存在 `status === 1` 的直接判断。
2. Web 和 Uni 已出现标签来源分裂。
3. 状态值简单，容易验证闭环。
4. 适用范围和状态两个字典都能同时覆盖。

试点完成后，应该得到：

1. 后端统一下发 `indicator.status`
2. 后端统一下发 `indicator.applyScope`
3. Web 不再写 `1/0` 对应标签
4. Uni 不再在本地写同名标签函数

## 验收标准

### 功能验收

1. 同一字典 key 在 Web 和 Uni 展示完全一致。
2. 后端修改标签或顺序后，前端无需改页面逻辑即可同步。
3. 前端筛选、表单、Tag 展示都使用统一字典源。
4. 状态流转合法性仍由后端裁决。

### 工程验收

1. 新增业务页面不再出现业务魔术数字。
2. 业务模块中不再新增重复 `statusOptions`。
3. Uni `types/` 不再承担业务标签函数职责。
4. `base` 目录未新增手写业务真相常量文件。

### 风险验收

1. 缺省字典拉取失败时有明确降级或错误提示。
2. 字典缓存不会跨账号或跨租户串数据。
3. 权限受限场景不会下发不该可见的业务字典。

## 验证计划

方案落地时至少需要以下验证：

1. 后端：
   - 字典注册单测
   - 业务域字典导出单测
   - 接口返回结构测试
2. Web：
   - 业务字典 Store 单测
   - 首批试点页面类型检查
   - 关键标签和筛选项渲染验证
3. Uni：
   - 首批试点页面渲染验证
   - 同值同标签对齐检查
4. 联动：
   - 同一 key 在 Web/Uni/接口返回一致性检查

## 风险与约束

### 1. 历史页面改造量大

仓库内已有大量页面自己维护状态选项，不能指望一次清完，必须批次推进。

### 2. “值域类型”与“展示字典”不能混为一谈

只做前端共享 TS 类型不能解决展示漂移；只做字典接口也不能替代后端状态机约束。

### 3. `office-ledger` 类配置文件存在迁移复杂度

这类配置型页面把状态项和表单项混在一起，迁移时要避免直接把所有表单配置都硬塞进全局字典。

### 4. 生成链路要谨慎

如果后续增加 `generated` 产物，必须明确源头、生成时机和覆盖范围，避免又出现一份“半自动半手写”的新漂移源。

## 结论

本仓库应采用：

1. 后端业务域持有值域和状态机
2. 统一业务字典接口下发展示元数据
3. `base` 提供分发与缓存
4. Web/Uni 统一消费

`base` 可以承载平台级常量，也可以承载“由后端业务域生成的分发产物”，但不能直接成为业务状态与数据字典的人肉真相仓库。

后续实施阶段应先用 `indicator-library` 做第一条闭环，再批量迁移其他业务模块。

## 实施进展（2026-04-21）

## 交付总览

当前累计完成了业务字典 SSOT 收口的二十六个模块：

1. 后端已能通过统一字典接口下发 `indicator`、`job-standard`、`assessment`、`certificate`、`work-plan`、`recruit-plan`、`resume-pool`、`supplier`、`meeting`、`hiring`、`talentAsset`、`course`、`promotion`、`pip`、`feedback`、`suggestion`、`salary`、`capability`、`contract`、`interview`、`goal`、`course-learning`、`teacher-channel`、`purchase-order`、`document-center`、`knowledge-base` 的业务字典。
2. Web 与 Uni 已统一消费后端字典标签，不再在页面、工具文件和 `types/` 文件中手写这二十六类模块的业务展示真相。
3. 已补充后端字典测试和前端静态回归测试，验证本轮收口没有重新引入本地状态映射。

### 已完成首批闭环模块

当前已完成接入统一业务字典链路的模块如下：

1. `indicator-library`
2. `job-standard`
3. `certificate`
4. `work-plan`
5. `recruit-plan`
6. `resume-pool`
7. `supplier`
8. `meeting`
9. `hiring`
10. `talentAsset`
11. `course`
12. `promotion`
13. `pip`
14. `feedback`
15. `assessment`
16. `suggestion`
17. `salary`
18. `capability`
19. `contract`
20. `interview`
21. `goal`
22. `course-learning`
23. `teacher-channel`
24. `purchase-order`
25. `document-center`
26. `knowledge-base`

### 已落地的业务字典 key

后端当前已通过 `/dict/info/data` 统一下发以下业务字典组：

1. `performance.indicator.status`
2. `performance.indicator.applyScope`
3. `performance.jobStandard.status`
4. `performance.certificate.status`
5. `performance.certificate.recordStatus`
6. `performance.workPlan.status`
7. `performance.workPlan.sourceStatus`
8. `performance.workPlan.priority`
9. `performance.workPlan.sourceType`
10. `performance.recruitPlan.status`
11. `performance.resumePool.status`
12. `performance.resumePool.sourceType`
13. `performance.supplier.status`
14. `performance.meeting.status`
15. `performance.hiring.status`
16. `performance.hiring.sourceType`
17. `performance.talentAsset.status`
18. `performance.course.status`
19. `performance.promotion.status`
20. `performance.pip.status`
21. `performance.feedback.taskStatus`
22. `performance.feedback.recordStatus`
23. `performance.feedback.relationType`
24. `performance.assessment.status`
25. `performance.suggestion.type`
26. `performance.suggestion.status`
27. `performance.suggestion.revokeReasonCode`
28. `performance.salary.status`
29. `performance.capability.status`
30. `performance.contract.type`
31. `performance.contract.status`
32. `performance.interview.status`
33. `performance.interview.type`
34. `performance.goal.status`
35. `performance.goal.sourceType`
36. `performance.goal.periodType`
37. `performance.goal.planStatus`
38. `performance.goal.reportStatus`
39. `performance.courseLearning.taskStatus`
40. `performance.courseLearning.examStatus`
41. `performance.teacherChannel.cooperationStatus`
42. `performance.teacherChannel.classStatus`
43. `performance.teacherChannel.todoBucket`
44. `performance.purchaseOrder.status`
45. `performance.documentCenter.category`
46. `performance.documentCenter.fileType`
47. `performance.documentCenter.storage`
48. `performance.documentCenter.confidentiality`
49. `performance.documentCenter.status`
50. `performance.knowledgeBase.status`
51. `performance.indicator.category`

### 已收敛的消费面

当前实现已经完成以下收敛：

1. `cool-admin-midway` 由业务域文件导出字典组，`dict` 模块只做聚合与分发。
2. `cool-admin-vue` 字典 store 同时兼容数据库字典数组和业务字典 `{ key, version, items }` 结构。
3. `cool-uni` 字典 store 同样兼容业务字典结构，并为页面提供 `getLabel/getMeta` 消费能力。
4. `job-standard` 与 `certificate` 的 Web/Uni 页面已切换到后端下发字典，不再在页面或 `types/` 中保留本地状态标签函数。
5. `work-plan` 的 Web/Uni 页面已切换到后端下发字典，统一收口执行状态、来源审批状态、优先级和来源类型四组常量。
6. `recruit-plan` 的 Web/Uni 页面已切换到后端下发字典，统一收口招聘计划状态筛选项、标签文案和色板映射。
7. `resume-pool` 的 Web/Uni 页面已切换到后端下发字典，统一收口简历状态与来源类型两组常量。
8. `supplier` 的 Web/Uni 页面已切换到后端下发字典，统一收口供应商启停状态筛选项、标签文案和色板映射。
9. `meeting` 的 Web/Uni 页面与 Web 详情抽屉已切换到后端下发字典，统一收口会议状态筛选项、状态标签和表单状态选项。
10. `hiring` 的 Web 页面已切换到后端下发字典，统一收口录用状态与来源类型两组常量；当前仓库未提供 Uni 对应页面，因此本批次没有移动端消费改造。
11. `talentAsset` 的 Web/Uni 页面已切换到后端下发字典，统一收口人才资产状态筛选项、标签文案和色板映射。
12. `course` 的 Web/Uni 页面已切换到后端下发字典，统一收口课程状态筛选项、标签文案和表单状态选项。
13. `promotion` 的 Web 页面与评审抽屉、Uni 页面已切换到后端下发字典，统一收口晋升状态筛选项、标签文案和详情展示。
14. `pip` 的 Web/Uni 页面已切换到后端下发字典，统一收口 PIP 状态筛选项、标签文案和移动端状态标签展示。
15. `feedback` 的 Web 页面、汇总/提交/创建组件与 Uni `list/detail` 页面、共享状态组件已切换到后端下发字典，统一收口任务状态、反馈记录状态和评价关系下拉选项。
16. `assessment` 的 Web 共享组件与 Uni `assessment/approval` 页面已切换到后端下发字典，统一收口评估单状态筛选项、标签文案和审批列表状态展示。
17. `suggestion` 的 Web 页面、详情抽屉与 Uni 页面已切换到后端下发字典，统一收口建议类型、建议状态和撤销原因下拉选项。
18. `salary` 的 Web/Uni 页面已切换到后端下发字典，统一收口薪酬调整状态筛选项、标签文案和色板映射。
19. `capability` 的 Web/Uni 页面已切换到后端下发字典，统一收口能力评估状态筛选项、标签文案和色板映射。
20. `contract` 的 Web/Uni 页面已切换到后端下发字典，统一收口合同类型、合同状态、筛选项和详情展示。
21. `interview` 的 Web 页面已切换到后端下发字典，统一收口面试类型与状态标签；当前仓库未提供 Uni 对应页面，因此本批次没有移动端消费改造。
22. `goal` 的 Web 运营台、Uni `list/detail/status-tag` 页面已切换到后端下发字典，统一收口目标来源、周期、计划状态、日报状态和目标状态展示。
23. `course-learning` 的 Web/Uni 页面已切换到后端下发字典，统一收口学习任务状态和考试结果状态。
24. `teacher-channel` 的 Web `teacher/class/todo` 页面与 Uni `teacher/detail/class/todo` 页面已切换到后端下发字典，统一收口合作状态、班级状态和待办桶展示。
25. `purchase-order` 的 Web 工作台已切换到后端下发字典，统一收口采购单状态筛选项、详情标签和状态归一化校验。
26. `document-center` 的 Web 页面已切换到后端下发字典，统一收口分类、文件类型、存储、密级和状态五组筛选项与详情标签。
27. `knowledge-base` 的 Web 页面已切换到后端下发字典，统一收口知识状态和关联文件状态展示。
28. `indicator-library` 在原有 `status/applyScope` 基础上补齐 `category` 字典，Web/Uni 不再本地维护指标类型标签。

### 本批次统一口径

为了消除 Web/Uni 历史漂移，本批次固定以下展示标签：

1. `performance.jobStandard.status.active` -> `已启用`
2. `performance.jobStandard.status.inactive` -> `已停用`
3. `performance.certificate.status.active` -> `已启用`
4. `performance.certificate.status.retired` -> `已停用`
5. `performance.indicator.applyScope.employee` -> `员工/岗位`
6. `performance.workPlan.status.planned` -> `已计划`
7. `performance.workPlan.sourceStatus.none` -> `无来源审批`
8. `performance.recruitPlan.status.active` -> `生效中`
9. `performance.recruitPlan.status.closed` -> `已关闭`
10. `performance.recruitPlan.status.voided` -> `已作废`
11. `performance.resumePool.status.screening` -> `筛选中`
12. `performance.resumePool.sourceType.attachment` -> `附件解析`
13. `performance.resumePool.sourceType.referral` -> `内推`
14. `performance.supplier.status.active` -> `启用`
15. `performance.supplier.status.inactive` -> `停用`
16. `performance.meeting.status.scheduled` -> `已安排`
17. `performance.meeting.status.in_progress` -> `进行中`
18. `performance.meeting.status.completed` -> `已结束`
19. `performance.meeting.status.cancelled` -> `已取消`
20. `performance.hiring.status.offered` -> `待候选人反馈`
21. `performance.hiring.status.accepted` -> `已接受`
22. `performance.hiring.sourceType.resumePool` -> `简历池`
23. `performance.hiring.sourceType.talentAsset` -> `人才资产`
24. `performance.talentAsset.status.new` -> `新建`
25. `performance.talentAsset.status.tracking` -> `跟进中`
26. `performance.talentAsset.status.archived` -> `已归档`
27. `performance.course.status.draft` -> `草稿`
28. `performance.course.status.published` -> `已发布`
29. `performance.course.status.closed` -> `已关闭`
30. `performance.promotion.status.draft` -> `草稿`
31. `performance.promotion.status.reviewing` -> `评审中`
32. `performance.promotion.status.approved` -> `已通过`
33. `performance.promotion.status.rejected` -> `已驳回`
34. `performance.pip.status.draft` -> `草稿`
35. `performance.pip.status.active` -> `进行中`
36. `performance.pip.status.completed` -> `已完成`
37. `performance.pip.status.closed` -> `已关闭`
38. `performance.feedback.taskStatus.draft` -> `草稿`
39. `performance.feedback.taskStatus.running` -> `进行中`
40. `performance.feedback.taskStatus.closed` -> `已关闭`
41. `performance.feedback.recordStatus.draft` -> `草稿`
42. `performance.feedback.recordStatus.submitted` -> `已提交`
43. `performance.assessment.status.draft` -> `草稿`
44. `performance.assessment.status.submitted` -> `待审批`
45. `performance.assessment.status.approved` -> `已通过`
46. `performance.assessment.status.rejected` -> `已驳回`
47. `performance.suggestion.type.pip` -> `PIP 建议`
48. `performance.suggestion.type.promotion` -> `晋升建议`
49. `performance.suggestion.status.pending` -> `待处理`
50. `performance.suggestion.status.accepted` -> `已采用`
51. `performance.suggestion.status.ignored` -> `已忽略`
52. `performance.suggestion.status.rejected` -> `已驳回`
53. `performance.suggestion.status.revoked` -> `已撤销`
54. `performance.suggestion.revokeReasonCode.thresholdError` -> `阈值命中错误`
55. `performance.suggestion.revokeReasonCode.assessmentCorrected` -> `评估数据已更正`
56. `performance.suggestion.revokeReasonCode.scopeError` -> `数据范围判断错误`
57. `performance.suggestion.revokeReasonCode.duplicateSuggestion` -> `重复建议`
58. `performance.salary.status.confirmed` -> `已确认`
59. `performance.salary.status.archived` -> `已归档`
60. `performance.capability.status.active` -> `已生效`
61. `performance.contract.type.full-time` -> `全职`
62. `performance.contract.status.expired` -> `到期`
63. `performance.contract.status.terminated` -> `终止`
64. `performance.interview.status.scheduled` -> `待执行`
65. `performance.interview.type.technical` -> `技术面`
66. `performance.goal.sourceType.public` -> `公共目标`
67. `performance.goal.periodType.month` -> `月目标`
68. `performance.goal.planStatus.assigned` -> `待填报`
69. `performance.goal.reportStatus.intercepted` -> `已拦截`
70. `performance.courseLearning.taskStatus.pending` -> `待完成`
71. `performance.courseLearning.examStatus.locked` -> `未解锁`
72. `performance.teacherChannel.cooperationStatus.contacted` -> `已跟进`
73. `performance.teacherChannel.classStatus.closed` -> `已关闭`
74. `performance.teacherChannel.todoBucket.overdue` -> `已逾期待跟进`
75. `performance.purchaseOrder.status.pendingApproval` -> `待审批`
76. `performance.documentCenter.category.policy` -> `制度`
77. `performance.documentCenter.fileType.img` -> `图片`
78. `performance.documentCenter.storage.hybrid` -> `混合`
79. `performance.documentCenter.confidentiality.secret` -> `机密`
80. `performance.documentCenter.status.review` -> `待审核`
81. `performance.knowledgeBase.status.published` -> `已发布`
82. `performance.indicator.category.feedback` -> `环评指标`

## 当前验证记录（2026-04-21）

### 已执行

1. 后端定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/job-standard.service.test.ts test/performance/certificate.service.test.ts`
2. Web 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/dict/store/dict.ts src/modules/performance/views/job-standard/index.vue src/modules/performance/views/certificate/index.vue`
3. 前端静态回归测试：
   - `cd cool-admin-vue && node --test test/business-dict-ssot.test.mjs`
4. 后端 `work-plan` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/work-plan.service.test.ts`
5. Web `work-plan` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/work-plan/index.vue`
6. 后端 `recruit-plan` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/recruit-plan.service.test.ts`
7. Web `recruit-plan` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/recruit-plan/index.vue`
8. 后端 `resume-pool` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/resumePool.service.test.ts`
9. Web `resume-pool` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/resumePool/index.vue`
10. 后端 `supplier` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/supplier.service.test.ts`
11. Web `supplier` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/supplier/index.vue`
12. 后端 `meeting` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/meeting.service.test.ts`
13. Web `meeting` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/meeting/index.vue src/modules/performance/components/meeting-detail-drawer.vue`
14. 后端 `hiring` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/hiring.service.test.ts`
15. Web `hiring` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/hiring/index.vue`
16. 后端 `talentAsset` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/talentAsset.service.test.ts`
17. Web `talentAsset` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/talentAsset/index.vue`
18. 后端 `course` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/course.service.test.ts`
19. Web `course` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/course/index.vue`
20. 后端 `promotion` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/promotion.service.test.ts`
21. Web `promotion` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/promotion/index.vue src/modules/performance/components/promotion-review-drawer.vue`
22. 后端 `pip` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/pip.service.test.ts`
23. Web `pip` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/pip/index.vue`
24. 前端静态回归测试复跑：
   - `cd cool-admin-vue && node --test test/business-dict-ssot.test.mjs`
25. 后端 `feedback` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/feedback.service.test.ts`
26. Web `feedback` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/feedback/index.vue src/modules/performance/components/feedback-summary-drawer.vue src/modules/performance/components/feedback-submit-drawer.vue src/modules/performance/components/feedback-task-form.vue`
27. 前端静态回归测试复跑：
   - `cd cool-admin-vue && node --test test/business-dict-ssot.test.mjs`
28. 后端 `assessment` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/assessment.service.test.ts`
29. Web `assessment` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/components/assessment-page.vue`
30. 前端静态回归测试复跑：
   - `cd cool-admin-vue && node --test test/business-dict-ssot.test.mjs`
31. 后端 `suggestion` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/suggestion.service.test.ts`
32. Web `suggestion` 定向 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/suggestion/index.vue src/modules/performance/components/suggestion-detail-drawer.vue`
33. 前端静态回归测试复跑：
   - `cd cool-admin-vue && node --test test/business-dict-ssot.test.mjs`
34. Web 本轮批量 lint：
   - `cd cool-admin-vue && npx eslint src/modules/performance/views/course-learning/index.vue src/modules/performance/views/goals/index.vue src/modules/performance/views/teacher-channel/teacher-list.vue src/modules/performance/views/teacher-channel/class-list.vue src/modules/performance/views/teacher-channel/todo-list.vue src/modules/performance/views/purchase-order/workspace.vue src/modules/performance/views/office/documentCenter.vue src/modules/performance/views/office/knowledgeBase.vue src/modules/performance/views/indicator-library/index.vue`
35. 前端静态回归测试复跑：
   - `cd cool-admin-vue && node --test test/business-dict-ssot.test.mjs`
36. 后端 `goal` / `teacher-channel` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/goal.service.test.ts test/performance/goal-operations.service.test.ts test/performance/teacher-channel-core.service.test.ts`
37. 后端 `course` / `course-learning` / `purchase-order` / `document-center` / `knowledge-base` / `indicator` 定向测试：
   - `cd cool-admin-midway && npm test -- --runInBand test/dict/info.service.test.ts test/performance/course.service.test.ts`
   - `cd cool-admin-midway && npm test -- --runInBand test/performance/course-learning.service.test.ts test/performance/purchase-order.service.test.ts test/performance/document-center.service.test.ts test/performance/knowledge-base.service.test.ts test/performance/indicator.service.test.ts`

### 已验证的重点

1. 后端 `dict/info/data` 能返回新增的 `job-standard` 与 `certificate` 业务字典组。
2. Web 页面不再依赖本地 `statusOptions/filterStatusOptions/recordStatusOptions`。
3. Uni 页面不再依赖 `types/` 中的 `certificateStatusLabel/certificateStatusTone` 一类业务标签函数。
4. `job-standard` 与 `certificate` 页面都通过统一字典 key 查询标签与色板。
5. `work-plan` 页面不再依赖本地 `statusOptions/sourceStatusOptions/priorityOptions`，Uni `types/` 也不再承担工作计划展示文案函数。
6. `recruit-plan` 页面不再依赖本地 `statusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担招聘计划展示文案函数。
7. `resume-pool` 页面不再依赖本地 `statusOptions/sourceTypeOptions/statusLabel/sourceTypeLabel`，Uni `types/` 也不再承担简历池展示文案函数。
8. `supplier` 页面不再依赖本地 `filterStatusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担供应商展示文案函数。
9. `meeting` 页面和详情抽屉不再依赖本地 `filterStatusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担会议展示文案函数。
10. `hiring` 页面不再依赖本地 `statusOptions/sourceTypeOptions/statusLabel/sourceTypeLabel`；当前仓库不存在 `cool-uni` 对应页面，因此没有 Uni 侧回归项。
11. `talentAsset` 页面不再依赖本地 `statusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担人才资产展示文案函数。
12. `course` 页面不再依赖本地 `courseStatusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担课程展示文案函数。
13. `promotion` 页面和评审抽屉不再依赖本地 `statusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担晋升展示文案函数。
14. `pip` 页面不再依赖本地 `statusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担 PIP 展示文案函数。
15. `feedback` 页面和相关组件不再依赖本地 `statusOptions/relationOptions/statusLabel/statusTagType`，Uni `types/` 与共享组件也不再承担环评状态展示文案函数。
16. `assessment` 共享组件和 Uni `assessment/approval` 页面不再依赖本地 `statusOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担评估单展示文案函数。
17. `suggestion` 页面和详情抽屉不再依赖本地 `suggestionTypeOptions/statusOptions/revokeReasonOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担自动建议展示文案函数。
18. `salary/capability/contract` 页面不再依赖本地 `statusOptions/typeOptions/statusLabel/statusTagType`，Uni `types/` 也不再承担展示文案函数。
19. `goal/course-learning` 的 Web/Uni 页面不再依赖本地 `statusOptions/taskStatusOptions/examStatusLabel` 一类业务展示常量。
20. `teacher-channel` 的 Web/Uni 页面不再依赖 `teacher-channel.js` 或 `types/` 中的业务状态选项、标签函数和色调函数。
21. `purchase-order` 工作台不再维护本地 `ALL_STATUS_OPTIONS`。
22. `document-center` 页面不再维护本地 `categoryOptions/fileTypeOptions/storageOptions/confidentialityOptions/statusOptions`。
23. `knowledge-base` 页面不再维护本地 `statusOptions/statusLabel/fileStatusLabel`。
24. `indicator-library` 的 Web/Uni 页面不再维护本地 `categoryOptions/categoryLabel`。

### 当前已知限制

1. 实施阶段守卫中的 `api-schema-drift-checker` 仍然报告仓库级现存 OpenAPI/consumer 漂移，结论集中在历史接口和分页模型映射，不是本次业务字典接入新增的问题。
2. `fullstack-test-matrix` 对 `work-plan` 的 `sync` 语义触发了“切流回归”中等级提示，但本批次没有热状态拆表、正式表切读或兼容切流改动，该提示记录为工具误判，不视为当前阻塞。
3. 仓库已补齐 `scripts/unified_delivery_guard.py`、`scripts/state_machine_guard.py` 与 `scripts/component_reuse_guard.py`。本批次收口时已用本地脚本完成可执行性验证，但由于仓库存在大量并行脏改动，守卫结果仍应结合定向测试、Web lint、`cool-uni` 独立 lint 和静态回归测试一起解释。
4. `state_machine_guard.py` 与 `component_reuse_guard.py` 当前为仓库内轻量启发式实现，能够覆盖“脚本存在且可执行”的基座要求，但仍不能替代模块级业务语义评审；后续若误报频率升高，需要按仓库路径和模块契约继续收敛规则。

## 当前留存的非阻断事项

1. `P2` 维护性事项：[`job-standard/index.vue`](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/job-standard/index.vue) 仍有分页和查询状态机可进一步抽到共享 hook。
   owner：frontend-owner
   deadline：2026-04-30
   cleanup action：下次触达该页的功能迭代时，评估并抽取到现有 `useListPage` 或等价共享 hook，避免重复分页请求状态逻辑继续扩散。
2. `P2` 维护性事项：[`work-plan/index.vue`](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/views/work-plan/index.vue) 仍有分页、查询和并行动作状态机可进一步抽到共享 hook。
   owner：frontend-owner
   deadline：2026-04-30
   cleanup action：下次触达该页的功能迭代时，评估抽取到 `useListPage` 或等价共享 hook，避免页面级请求状态逻辑继续复制。
