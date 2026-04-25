/**
 * Teacher Class 聚合状态机主源。
 * 这里只负责声明班主任建班主链的状态集合、动作和合法流转，不负责删除权限、数据范围或页面按钮显隐。
 * 关键依赖是 teacher-channel-core service、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是只表达当前服务端已实现的 draft/active/closed 规则，避免把未实现的 reopen/delete 误写成合法流转。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const TEACHER_CLASS_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'teacher-class',
  version: 'phase1-v1',
  statuses: ['draft', 'active', 'closed'],
  actions: ['saveDraft', 'activate', 'keepActive', 'close'],
  transitions: [
    {
      from: 'draft',
      action: 'saveDraft',
      to: 'draft',
      actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
    },
    {
      from: 'draft',
      action: 'activate',
      to: 'active',
      actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
    },
    {
      from: 'active',
      action: 'keepActive',
      to: 'active',
      actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
    },
    {
      from: 'active',
      action: 'close',
      to: 'closed',
      actors: ['platform.super_admin'],
    },
  ],
};
