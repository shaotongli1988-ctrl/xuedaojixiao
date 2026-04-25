/**
 * Suggestion 聚合状态机主源。
 * 这里只负责声明自动建议主链的状态集合、动作和合法流转，不负责建议生成条件、权限判定、数据库写入或正式单据联动。
 * 关键依赖是 suggestion-helper 的流转规则、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值必须与 suggestion-dict/suggestion-helper 一致，且 revoke 只允许从 pending/accepted 进入 revoked。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const SUGGESTION_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'suggestion',
  version: 'phase1-v1',
  statuses: ['pending', 'accepted', 'ignored', 'rejected', 'revoked'],
  actions: ['accept', 'ignore', 'reject', 'revoke'],
  transitions: [
    {
      from: 'pending',
      action: 'accept',
      to: 'accepted',
      actors: ['org.hrbp'],
    },
    {
      from: 'pending',
      action: 'ignore',
      to: 'ignored',
      actors: ['org.hrbp'],
    },
    {
      from: 'pending',
      action: 'reject',
      to: 'rejected',
      actors: ['org.hrbp'],
    },
    {
      from: 'pending',
      action: 'revoke',
      to: 'revoked',
      actors: ['org.hrbp'],
    },
    {
      from: 'accepted',
      action: 'revoke',
      to: 'revoked',
      actors: ['org.hrbp'],
    },
  ],
};
