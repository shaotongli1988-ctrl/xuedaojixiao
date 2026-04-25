/**
 * Feedback 聚合状态机主源。
 * 这里只负责声明 360 环评任务主链的状态集合、动作和合法流转，不负责单条反馈记录提交校验、截止时间判断或汇总裁剪。
 * 关键依赖是 feedback service 的任务状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是任务状态值必须与 feedback-dict/feedback service 一致，且 running -> closed 只允许由最后一次 record submit 触发。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const FEEDBACK_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'feedback',
  version: 'phase1-v1',
  statuses: ['draft', 'running', 'closed'],
  actions: ['add', 'submit'],
  transitions: [
    {
      from: 'draft',
      action: 'add',
      to: 'running',
    },
    {
      from: 'running',
      action: 'submit',
      to: 'closed',
    },
  ],
};
