/**
 * Performance 领域状态机注册类型。
 * 这里只负责描述聚合状态、动作和流转结构，不负责直接执行状态变更或按钮显隐。
 * 关键依赖是后续 service、守卫脚本和文档同步都能共享同一份 machine-readable 定义。
 * 维护重点是动作命名和状态值必须稳定，避免 service 内再出现第二套真相。
 */

export interface PerformanceStateTransitionDefinition {
  from: string;
  action: string;
  to: string;
  actors?: readonly string[];
}

export interface PerformanceStateMachineDefinition {
  aggregate: string;
  version: string;
  statuses: readonly string[];
  actions: readonly string[];
  transitions: readonly PerformanceStateTransitionDefinition[];
}
