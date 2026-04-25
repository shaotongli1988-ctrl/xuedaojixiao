/**
 * PIP 聚合状态机主源。
 * 这里只负责声明 PIP 主链的状态集合、动作和合法流转，不负责跟进记录写入、结果摘要校验或权限范围解析。
 * 关键依赖是 pip service 中的状态流转规则、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值必须与 pip-dict/pip service 一致，且 completed/closed 终态不能被第二套局部规则回退。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const PIP_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'pip',
  version: 'phase1-v1',
  statuses: ['draft', 'active', 'completed', 'closed'],
  actions: ['start', 'track', 'complete', 'close'],
  transitions: [
    {
      from: 'draft',
      action: 'start',
      to: 'active',
      actors: ['org.hrbp'],
    },
    {
      from: 'active',
      action: 'track',
      to: 'active',
      actors: ['org.hrbp'],
    },
    {
      from: 'active',
      action: 'complete',
      to: 'completed',
      actors: ['org.hrbp'],
    },
    {
      from: 'active',
      action: 'close',
      to: 'closed',
      actors: ['org.hrbp'],
    },
  ],
};
