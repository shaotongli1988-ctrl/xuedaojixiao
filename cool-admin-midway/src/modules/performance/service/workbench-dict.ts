/**
 * 工作台业务字典事实源。
 * 这里只负责 persona 视角值域与展示字典导出，不负责 persona 推断、权限解析或工作台页面显隐。
 * 维护重点是 persona 字典必须与 performance 角色主源同源，避免多端继续各自维护视角名称。
 */

import {
  PERFORMANCE_PERSONAS,
  PERFORMANCE_PERSONA_OPTIONS_BY_KEY,
  type PerformanceRegisteredPersonaKey,
} from '../domain/roles/catalog';
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

export const WORKBENCH_PERSONA_DICT_KEY = 'performance.workbench.persona';
export const WORKBENCH_DICT_VERSION = 'workbench-v1';

function createItems(): BusinessDictItem[] {
  return PERFORMANCE_PERSONAS.map((persona, index) => {
    const option =
      PERFORMANCE_PERSONA_OPTIONS_BY_KEY[
        persona.key as PerformanceRegisteredPersonaKey
      ];

    return {
      id: `${WORKBENCH_PERSONA_DICT_KEY}:${persona.key}`,
      name: option?.label || persona.label,
      value: persona.key,
      orderNum: (index + 1) * 10,
      parentId: null,
      extra: {
        category: option?.category || 'org',
      },
    };
  });
}

export function getWorkbenchBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: WORKBENCH_PERSONA_DICT_KEY,
      version: WORKBENCH_DICT_VERSION,
      items: createItems(),
    },
  ];
}
