<!-- 文件职责：把 performance 角色 SSOT 进一步翻译成“谁能进哪个模块、能做什么、能看多大范围”的人话总表；不负责替代详细实现、控制器鉴权或状态机源码；依赖 roles/catalog.ts 与 access-context.ts 作为唯一事实源；维护重点是边界描述必须和运行时 capability/scope 解析保持一致，不能再回到 HR/manager/staff 的口头判断。 -->
# 2026-04-22 Performance 角色边界总表

## 这份表是干什么的

这份表只回答三件事：

1. 这个人当前是什么业务视角。
2. 这个视角能进哪些核心模块。
3. 进了模块以后，能做什么、能看多大范围、哪些状态下才算真的能操作。

一句话说，就是把“角色模型已经统一了”继续往前推进成“角色边界讲得清、测得出来、以后不再靠嘴说”。

## 唯一事实源

这份表不是新造一套规则，主源还是后端这两处：

1. [cool-admin-midway/src/modules/performance/domain/roles/catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/roles/catalog.ts)
   这里定义 persona、workbench 页面、surface access、capability 和 scope 规则组。
2. [cool-admin-midway/src/modules/performance/service/access-context.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/access-context.ts)
   这里把账号权限、部门范围、persona 推断、默认视角、scope 命中规则真正算出来。

判断顺序固定为：

1. 先算这个账号当前有哪些 `persona`
2. 再看目标模块对应哪些 `capability`
3. 再看这些 capability 的 `scope`
4. 最后再叠加模块自己的 `state` 限制

前端和移动端只消费结果，不自己猜 `HR / manager / staff`。

## 五类首批 persona

1. `org.employee`
   员工视角。重点是“我自己的目标、反馈、学习、我的考核”。
2. `org.line_manager`
   直属主管视角。重点是“我负责范围内的审批、团队目标、团队数据、招聘协同”。
3. `org.hrbp`
   HRBP 视角。重点是“公司级配置、分析、导出、薪酬和部分全局运营动作”。
4. `fn.performance_operator`
   绩效运营视角。重点是“绩效主链运营和公司级运营动作”，不是单纯的 HR 标签。
5. `fn.analysis_viewer`
   分析查看视角。重点是“看数据，不做业务写入”。

## 这次先把具体角色定死

当前 `performance` 域先冻结为下面 5 个正式角色视角，不再继续扩散新口头角色：

| 稳定 key | 中文名 | 角色类别 | roleKind | 默认入口重点 |
| --- | --- | --- | --- | --- |
| `org.employee` | 员工视角 | 组织角色 | `employee` | 我的考核、目标、反馈、学习、工作计划 |
| `org.line_manager` | 直属主管视角 | 组织角色 | `manager` | 待审批、团队目标、反馈、驾驶舱、工作计划 |
| `org.hrbp` | HRBP 视角 | 组织角色 | `hr` | 驾驶舱、发起页、薪酬、招聘链 |
| `fn.performance_operator` | 绩效运营视角 | 职能角色 | `hr` | 发起页、指标库、驾驶舱、薪酬、招聘链 |
| `fn.analysis_viewer` | 分析查看视角 | 职能角色 | `readonly` | 驾驶舱 |

这 5 个 key 的正式主源是：

1. [catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/roles/catalog.ts)
2. [access-context.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/access-context.ts)

如果后面有人再提：

1. `staff`
2. `manager`
3. `hr`
4. `只读 HR`
5. `薪酬管理员`
6. `采购管理员`
7. `老师资源负责人`

都不能直接在页面或服务里新造一类角色，必须先回答一句话：

“这是现有 5 个 persona 的一种能力组合，还是确实需要新增第 6 个 persona？”

在当前阶段，默认答案是前者。

## 岗位怎么落到这 5 个角色

不要把 `persona` 直接理解成人事岗位名称。现在的落位规则是：

1. 普通员工
   落到 `org.employee`
2. 部门经理、组长、直属主管
   落到 `org.line_manager`
3. HRBP、人事 BP、绩效 BP
   落到 `org.hrbp`
4. 绩效专员、绩效管理员、绩效运营同学
   落到 `fn.performance_operator`
5. 只看分析报表、不负责业务写入的管理者或分析岗
   落到 `fn.analysis_viewer`

一个账号可以同时落多个角色。例如：

1. 部门经理兼分析查看
   `org.line_manager + fn.analysis_viewer`
2. HRBP 兼绩效运营
   `org.hrbp + fn.performance_operator`
3. HRBP 兼分析查看
   `org.hrbp + fn.analysis_viewer`

## 默认主视角也定死

一个账号命中多个 persona 时，默认主视角优先级固定为：

1. `org.hrbp`
2. `fn.performance_operator`
3. `org.line_manager`
4. `org.employee`
5. `fn.analysis_viewer`

这意味着：

1. HRBP 兼分析查看，默认先进 `org.hrbp`
2. 绩效运营兼主管，默认先进 `fn.performance_operator`
3. 主管兼员工，默认先进 `org.line_manager`

这个顺序不是前端定的，是后端事实源已经定死的。

## 哪些现在故意不单列成新角色

下面这些，现在先不单列成独立 persona：

1. 薪酬管理员
   先落到 `org.hrbp` 或 `fn.performance_operator`，再用 `salary.*` capability 区分能做什么。
2. 招聘负责人
   先落到 `org.line_manager`、`org.hrbp` 或 `fn.performance_operator`，再用 `recruit_plan.* / resume_pool.* / hiring.*` capability 区分。
3. 采购负责人
   先用现有 persona 承载，再用 `purchase_order.* / purchase_report.*` capability 区分。
4. 教师渠道负责人
   先用现有 persona 承载，再用 `teacher_*` capability 和 scope 区分。
5. 只读 HR
   不单列。只读需求先用 `fn.analysis_viewer`，如果后面确实存在“全局 HR 只读但不是 dashboard-only”的稳定场景，再单独评估是否新增 persona。

这样做的目的只有一个：

先把“角色是谁”控制在 5 个稳定视角里，把复杂度放到 capability 和 scope 层解决，而不是继续堆更多口头角色。

## 范围词怎么理解

1. `self`
   只能操作我自己的数据。
2. `assigned_domain`
   只能操作系统认定分配给我的责任域数据。
3. `department_tree`
   只能操作我所在部门树内的数据。
4. `company`
   公司全量范围。

## 角色边界总表

### 1. `assessment`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 可进“我的考核” | 查看本人考核、编辑本人考核、提交本人考核 | `self` | 只有当前考核记录属于本人，且业务状态允许填写/提交时才可写 |
| `org.line_manager` | 可进“待我审批” | 查看待审考核、审批、驳回 | `assigned_domain` + `department_tree` | 只有待审批状态才能批；不能跨部门树审批 |
| `org.hrbp` | 可进发起/管理面，但公司级稳定能力先以导出为准 | 导出考核；若同时具备发起页权限，可读管理面 | `company` | 导出不等于任意状态都能改数据；写入仍看具体 capability |
| `fn.performance_operator` | 可进“发起考核” | 读发起列表、建考核、改考核、删考核 | 全局运营账号为 `company`，否则回落到规则预设范围 | 是否能新增/修改/删除，要同时满足 capability 和考核状态 |
| `fn.analysis_viewer` | 不作为考核业务操作视角 | 无稳定写能力 | 无 | 只读分析视角不进入考核操作链 |

### 2. `goal`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 可进“目标管理” | 看我的目标、更新我的进展 | `self` | 只能改自己的目标进展；目标关闭后不能继续写 |
| `org.line_manager` | 可进“目标管理” | 看团队目标、建目标、改目标、删目标 | `department_tree` | 只能处理本部门树目标；非法状态不能继续改 |
| `org.hrbp` | 可进“目标管理”但以全局管控为准 | 公司级查看、导出；若具备 ops 全局权限可做公司级运营 | `company` | 是否能做 ops 管理，看 `goal.ops.manage` / `goal.ops.global` |
| `fn.performance_operator` | 可进目标运营链 | 看 ops 面、做运营管理、处理公司级计划 | 具备全局 ops 权限时为 `company`，否则按部门树/本人回落 | 日报、计划、报告是否可写，仍受目标流程状态约束 |
| `fn.analysis_viewer` | 不作为目标写入视角 | 无稳定写能力 | 无 | 只读分析不进入目标写链 |

### 3. `approval-flow`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 只能处理和我发起相关的少量动作 | 撤回、催办本人流程 | `self` | 只有本人发起且流程状态允许时才可操作 |
| `org.line_manager` | 可进审批实例页 | 查看审批实例、审批、驳回、转交 | `assigned_domain` + `department_tree` | 只有待我处理状态才可批；不能越过本部门树 |
| `org.hrbp` | 可进流程配置和全局处理面 | 查看配置、保存配置、人工处理、回退、终止 | `company` | 这些动作本身也受流程当前状态限制，不是拿到权限就随时可做 |
| `fn.performance_operator` | 可参与全局处理 | 读流程实例、转交、全局提醒 | 全局运营账号通常为 `company` | 运营视角不是审批人替代；具体节点能否处理仍看流程状态 |
| `fn.analysis_viewer` | 不进审批链 | 无 | 无 | 只读分析不参与流程处理 |

### 4. `dashboard`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 默认不作为核心看板视角 | 无稳定 dashboard capability | 无 | 员工日常入口以我的任务页为主 |
| `org.line_manager` | 可进驾驶舱 | 查看摘要看板 | 非全局账号时通常为 `department_tree`，无部门则回落 `assigned_domain` | 只读，不涉及业务写入状态 |
| `org.hrbp` | 可进驾驶舱 | 查看摘要、交叉分析 | `company` | 只读分析，不放开业务写动作 |
| `fn.performance_operator` | 可进驾驶舱 | 查看摘要看板，配合其他运营页工作 | 全局运营账号通常为 `company` | dashboard 本身只读 |
| `fn.analysis_viewer` | 这是主场景 | 查看摘要、交叉分析 | 取决于账号范围，常见为 `department_tree` 或 `company` | 明确是只读视角，不承接业务写入 |

### 5. `salary`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 不进 | 无稳定能力 | 无 | 薪酬页不向员工视角开放 |
| `org.line_manager` | 不作为稳定入口 | 无稳定公司级能力 | 无 | 主管不因为有部门管理权就自动拿到薪酬页 |
| `org.hrbp` | 可进 | 查看、创建、修改、确认、归档、发起调薪 | `company` | 草稿、已确认、已归档等状态会限制后续动作 |
| `fn.performance_operator` | 可进 | 创建、修改、确认、归档、调薪 | `company` | 运营写入仍受薪酬状态流限制 |
| `fn.analysis_viewer` | 不进 | 无 | 无 | 只读分析视角不承接薪酬操作 |

### 6. `purchase-order / purchase-report`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 不作为稳定入口 | 无稳定能力 | 无 | 采购链不按员工视角开放 |
| `org.line_manager` | 可进部门范围采购 | 看采购单、建单、改单、发起询价、发起审批、审批、驳回、收货；看采购报表 | `department_tree` | 只有落在本部门树的数据可见可操作；单据状态不合法时不能继续推进 |
| `org.hrbp` | 可进全局采购分析/管理 | 公司级删除采购单、公司级查看采购报表 | `company` | 删除、收货、关闭等仍受采购单状态限制 |
| `fn.performance_operator` | 不是这个模块的主 persona | 一般不作为稳定采购入口 | 以 capability 实际计算为准 | 若未来运营接采购动作，也必须走 capability/scope，不新增口头角色 |
| `fn.analysis_viewer` | 只读看报表时可复用 dashboard 风格入口，但不是采购主 persona | 只读查看取决于是否真实拥有采购报表 capability | 按 capability 实际范围 | 不能把“会看 dashboard”误认为“会看采购报表” |

### 7. `teacher-channel`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 默认不进 | 无稳定能力 | 无 | 不对普通员工开放 |
| `org.line_manager` | 可以承接老师资源管理动作 | 查看老师资源、查看班主任化汇总、分配老师资源 | 常见为 `department_tree`，无部门树时回落到 capability 预设 | 分配、变更、冲突处理是否可做，要看老师资源当前状态 |
| `org.hrbp` | 可以承接更大范围的老师资源管理 | 读资源、做分配、看汇总 | 以 capability 实际算出的范围为准，常见高于主管视角 | 不是天然“全公司都能管”，要看账号是否真有对应 permission |
| `fn.performance_operator` | 可以复用这个模块做运营协同 | 读资源、跟进、协同处理 | 以 capability/scope 实时计算为准 | 老师资源模块当前没有单独 persona，复用现有 persona 承载 |
| `fn.analysis_viewer` | 不是老师资源主 persona | 无稳定写能力 | 无 | 只读分析不直接承接老师资源写动作 |

### 8. `feedback`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 可进 | 看分配给我的反馈任务、提交我的反馈记录 | `self` | 只能提交我自己的反馈记录；反馈关闭后不能继续提交 |
| `org.line_manager` | 可进 | 看反馈任务、给团队发起反馈任务 | 常见为 `self + department_tree`；如果只有查看权限则主要是 `self` | 发任务、导出、汇总都要同时满足 capability 和当前反馈状态 |
| `org.hrbp` | 可进 | 公司级查看、汇总、导出、发起反馈任务 | `company` | 汇总和导出是只读动作；发任务仍受反馈周期状态限制 |
| `fn.performance_operator` | 可进 | 运营反馈任务、协同推进反馈收集 | 取决于 capability 实际范围，常见为 `company` | 不是天然全能，仍要看具体 capability 是否存在 |
| `fn.analysis_viewer` | 不是主反馈 persona | 一般不承接反馈写动作 | 无稳定写范围 | 只读分析不直接做反馈任务 |

### 9. `workplan`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 可进 | 看我的工作计划、启动/完成我自己的计划 | `self` | 只能处理自己的计划；计划开始后、完成后、取消后动作不同 |
| `org.line_manager` | 可进 | 看团队工作计划、建计划、改计划、删计划、启动、完成、取消 | 常见为 `self + department_tree`；管理动作以 `department_tree` 为主 | 不能跨部门树动计划；开始/完成/取消必须符合计划当前状态 |
| `org.hrbp` | 可进 | 公司级工作计划同步和管理 | `company` | 同步、取消、批量推进等动作仍受计划状态限制 |
| `fn.performance_operator` | 可进 | 运营工作计划、做跨团队推进 | 常见为 `company` | 运营视角能做多少，以 `workplan.*` capability 为准 |
| `fn.analysis_viewer` | 不作为工作计划 persona | 无稳定写能力 | 无 | 只读分析不进入工作计划写链 |

### 10. `promotion / pip`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 默认不作为主入口 | 无稳定发起能力 | 无 | 员工不因自助视角自动获得晋升/PIP 管理能力 |
| `org.line_manager` | 可进 | 看本部门树晋升/PIP、发起、更新、提交、跟踪、评审 | `department_tree`；PIP 阅读常见是 `self + department_tree` | 晋升提交、评审、PIP 启动、跟踪、完成、关闭都必须看流程状态 |
| `org.hrbp` | 可进 | 公司级晋升/PIP 管理、导出 | `company` | HRBP 能看到全局，但非法状态同样不能推进 |
| `fn.performance_operator` | 可进 | 运营晋升/PIP 流程、跨团队推进 | 常见为 `company` | 是否有创建、评审、关闭能力，看对应 capability |
| `fn.analysis_viewer` | 不是主 persona | 无稳定写能力 | 无 | 不直接处理晋升/PIP 业务动作 |

### 11. `recruitment-chain`

这里把 `interview / recruit_plan / resume_pool / hiring` 放在一起看，因为它们本来就是一条招聘链。

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 不作为稳定入口 | 无稳定能力 | 无 | 招聘链不按员工自助视角开放 |
| `org.line_manager` | 可进 | 看招聘计划、建招聘计划、维护简历池、安排面试、推进录用 | `department_tree` | 只能处理本部门树招聘链数据；计划关闭、候选人状态结束后不能乱推进 |
| `org.hrbp` | 可进 | 公司级看面试、简历池、录用数据；做导出、删除、全局推进 | `company` | 公司级不等于无状态限制，面试删除、录用关闭等仍要看当前状态 |
| `fn.performance_operator` | 可参与招聘链运营 | 以公司级运营协同为主 | 常见为 `company`，但仍以 capability 实际结果为准 | 招聘链当前主要还是由主管和 HRBP 承载，运营视角只承接命中的 capability |
| `fn.analysis_viewer` | 不作为招聘链 persona | 无稳定写能力 | 无 | 只读分析不进入招聘链写入 |

### 12. `course-learning`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 可进 | 看课程背诵、实操、考试汇总并提交学习结果 | `self` | 学习任务关闭或考试期结束后，不能继续提交通关结果 |
| `org.line_manager` | 不是主学习 persona | 一般不直接承接员工学习写动作 | 无稳定团队写范围 | 主管看学习分析应走别的分析面，而不是替员工学习 |
| `org.hrbp` | 如果持有课程目录能力可进课程管理面，但不是学习主 persona | 更偏课程配置和目录管理 | 目录管理常见为 `company` | 学习记录仍不是 HRBP 的主写链 |
| `fn.performance_operator` | 如果持有课程目录能力可协同课程管理 | 更偏课程运营，不是员工学习提交 | 常见为 `company` | 课程运营与学习提交分开 |
| `fn.analysis_viewer` | 不作为学习主 persona | 无稳定写能力 | 无 | 只读分析不进入学习提交流程 |

### 13. `meeting / suggestion`

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 默认不作为主入口 | 无稳定会议/建议箱管理能力 | 无 | 员工不因为自助视角自动获得会议管理或建议处理能力 |
| `org.line_manager` | 可进 | 看会议、建会议、签到、处理本部门树建议 | 常见为 `department_tree` | 会议签到、删除、建议驳回/忽略都要满足当前状态 |
| `org.hrbp` | 可进 | 公司级会议管理、公司级建议撤回/处理 | `company`，但部分晋升类相邻动作仍可能停留在 `department_tree` | 拿到公司级范围也不能越过会议或建议当前状态 |
| `fn.performance_operator` | 可进 | 运营会议和建议处理 | 常见为 `company` | 是否能处理建议或会议，以实际 capability 为准 |
| `fn.analysis_viewer` | 不是主 persona | 无稳定写能力 | 无 | 只读分析不进入会议/建议写链 |

### 14. `capability / certificate / job-standard / talent-asset`

这几块都属于“人才标准与人才资产”域，不单独造新角色，仍挂到现有 5 个角色。

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 默认不进 | 无稳定能力 | 无 | 不对员工自助开放 |
| `org.line_manager` | 可承接部分查看或部门树内操作 | 看能力画像、证书记录、岗位标准、人才资产 | 常见为 `department_tree` | 只有命中对应 capability 才能看；删除/发证/变更状态不自动开放 |
| `org.hrbp` | 可进 | 管能力模型、证书、岗位标准、人才资产 | `company` | 发证、上下架、删除等动作受各自业务状态限制 |
| `fn.performance_operator` | 可进 | 做人才标准和人才资产运营 | 常见为 `company` | 运营视角和 HRBP 共用功能域，但不是新 persona |
| `fn.analysis_viewer` | 不是主 persona | 无稳定写能力 | 无 | 只读分析不进入标准/资产写链 |

### 15. `document-center / knowledge-base / office-collab`

这几块属于“公司级办公协同域”。这里最容易被叫成“文档管理员、知识库管理员、行政管理员”，但当前不单列新角色。

| persona | 能不能进 | 主要能力 | 数据范围 | 状态限制 |
| --- | --- | --- | --- | --- |
| `org.employee` | 默认不进 | 无稳定能力 | 无 | 不按员工自助开放 |
| `org.line_manager` | 只有拿到 capability 才能进 | 看文档中心、知识库、行政协同数据，部分账号也可能有写能力 | 这些模块当前命中后通常就是 `company` | 能进不代表所有主管都能进，必须真实持有 capability |
| `org.hrbp` | 可进 | 公司级文档中心、知识库、行政协同管理 | `company` | 创建、更新、删除都要满足具体业务记录状态 |
| `fn.performance_operator` | 可进 | 公司级协同运营、知识维护、文档维护 | `company` | 仍按具体 capability 生效 |
| `fn.analysis_viewer` | 不是主 persona | 无稳定写能力 | 无 | 只读分析不直接进入办公协同写链 |

## 当前已经定死的边界

1. persona 的真假不再由前端页面自己猜。
2. 页面能不能进，不等于这个人能对所有数据做所有动作。
3. `scope` 是硬边界，不能靠页面过滤替代。
4. `state` 是最后一道闸，拿到 capability 也不代表可以绕过流程状态。
5. `teacher-channel` 当前没有单独 persona，先复用现有 persona，只把能力和范围统一进同一事实源。

## 下一步怎么落

1. 用参数化后端测试把这张表的首批样例固化下来。
2. 后续每加一个新模块，必须先补 capability/scope，再补这张边界表。
3. 如果未来确实需要给 `teacher-channel` 单独 persona，也必须先改 [catalog.ts](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/domain/roles/catalog.ts)，不能在页面里先写特判。

## 本次对应验证

首批测试将直接覆盖：

1. `org.employee`
2. `org.line_manager`
3. `org.hrbp`
4. `fn.performance_operator`
5. `fn.analysis_viewer`

并选取以下模块做代表性验证：

1. `assessment`
2. `goal`
3. `approval-flow`
4. `dashboard`
5. `salary`
6. `purchase-order / purchase-report`
7. `teacher-channel`
8. `feedback`
9. `workplan`
10. `promotion / pip`
11. `recruitment-chain`
12. `course-learning`
13. `meeting / suggestion`
14. `capability / certificate / job-standard / talent-asset`
15. `document-center / knowledge-base / office-collab`
