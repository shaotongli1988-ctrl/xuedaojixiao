<!-- 文件职责：记录 performance 领域模型 SSOT 第一阶段为何采用“骨架优先”的架构决策；不负责描述所有业务模块细节实现；依赖同日设计文档和当前仓库现状；维护重点是决策边界、替代方案与迁移约束必须可追溯。 -->
# ADR: Performance 领域模型 SSOT 第一阶段采用骨架优先

- Status: accepted
- Date: 2026-04-22
- Owner: codex
- Scope: `cool-admin-midway/src/modules/performance/domain/*`

## 背景

当前 `performance` 域存在以下问题：

1. 前端消费模型已通过 `OpenAPI -> generated/*` 收口，但后端领域真相没有统一中心。
2. 状态机、角色能力、业务字典、错误语义分别散在 `service`、文档和局部 helper 中。
3. 直接挑业务模块做迁移，容易把结构设计和行为改造耦合在一起。

## 决策

第一阶段采用“骨架优先”方案：

1. 先新增 `performance/domain/`
2. 先建立 `errors / states / dicts / roles / registry`
3. 第一阶段只新增不替换
4. 先通过结构化主源固定边界，再逐步让现有 service、守卫和 OpenAPI 生成链接入

## 不选的方案

### 方案 A：直接模块迁移

不采用原因：

1. 会同时触碰权限、状态机、接口、页面和运行行为
2. 返工风险高
3. 难以验证“结构问题”还是“业务迁移问题”

### 方案 B：只先做字典 SSOT

不采用原因：

1. 只能解决展示真相
2. 无法收住状态机、角色和错误语义
3. 容易继续保留分散的业务裁决逻辑

## 结果

截至 2026-04-22 当前工作流结束时，仓库已经具备：

1. 一个稳定的后端领域注册中心入口
2. `DictInfoService` 与 `access-context.ts` 对 registry/catalog 的真实接线
3. 一组可以被 service、守卫和测试直接消费的结构化主源
4. 用于阻断 alias/capability/rule-group 结构漂移的仓库守卫

## 影响

正向影响：

1. 降低后续模块迁移的结构返工
2. 让“后端领域真相”有单独落点
3. 为错误码、状态机、角色和字典统一提供承载层
4. 让 `access-context.ts` 从“静态真相承载层”回退为“上下文解析 + preset 组合层”

负向影响：

1. 过渡期会出现“旧逻辑 + 新骨架”并存
2. 若不持续推进更高风险链路接线，仍可能形成“registry 完整、其它消费层未共享”的次级漂移

## 后续动作

1. Phase 1：新增骨架和最小测试，已完成
2. Phase 2：让 `DictInfoService`、`access-context.ts` 和守卫脚本逐步接入 registry，当前静态规则收敛已基本完成
3. Phase 3：评估 OpenAPI、菜单权限、前端能力判断是否继续从 registry 只读消费
4. Phase 4：把结构守卫扩展到更多 registry 主表
