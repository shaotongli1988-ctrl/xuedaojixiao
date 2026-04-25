/**
 * Teacher Cooperation 聚合状态机主源。
 * 这里只负责声明班主任资源合作主链的状态集合、动作和合法流转，不负责跟进计数、脱敏或人员范围校验。
 * 关键依赖是 teacher-channel-core service、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是只表达当前服务端真实存在的合作状态动作，不把代理归因或待办派生桶混入同一聚合。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const TEACHER_COOPERATION_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'teacher-cooperation',
    version: 'phase1-v1',
    statuses: [
      'uncontacted',
      'contacted',
      'negotiating',
      'partnered',
      'terminated',
    ],
    actions: [
      'firstFollow',
      'follow',
      'markNegotiating',
      'markPartnered',
      'terminate',
    ],
    transitions: [
      {
        from: 'uncontacted',
        action: 'firstFollow',
        to: 'contacted',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'contacted',
        action: 'follow',
        to: 'contacted',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'contacted',
        action: 'markNegotiating',
        to: 'negotiating',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'negotiating',
        action: 'follow',
        to: 'negotiating',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'negotiating',
        action: 'markNegotiating',
        to: 'negotiating',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'contacted',
        action: 'markPartnered',
        to: 'partnered',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'negotiating',
        action: 'markPartnered',
        to: 'partnered',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'partnered',
        action: 'follow',
        to: 'partnered',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
      {
        from: 'partnered',
        action: 'terminate',
        to: 'terminated',
        actors: ['platform.super_admin'],
      },
      {
        from: 'terminated',
        action: 'follow',
        to: 'terminated',
        actors: ['platform.super_admin', 'performance.teacher_channel.manager'],
      },
    ],
  };
