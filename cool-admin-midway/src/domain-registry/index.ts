/**
 * 仓库级全域 SSOT 注册中心入口。
 * 这里只负责聚合 backend 模块的 SSOT 覆盖状态和已落地 registry，不负责运行时依赖注入或生成脚本执行。
 * 关键依赖是测试、守卫脚本和后续全域文档都会从这里读取统一模块地图。
 * 维护重点是新增 backend 模块时必须同步更新这里，否则全局治理会出现盲区。
 */

import { GLOBAL_SSOT_MODULE_ORDER, GLOBAL_SSOT_MODULES } from './catalog';

import type { GlobalDomainSsotRegistry } from './types';

export const GLOBAL_DOMAIN_SSOT_REGISTRY_VERSION = 'phase0-v1';

export const GLOBAL_DOMAIN_SSOT_REGISTRY: GlobalDomainSsotRegistry =
  Object.freeze({
    version: GLOBAL_DOMAIN_SSOT_REGISTRY_VERSION,
    moduleOrder: GLOBAL_SSOT_MODULE_ORDER,
    modules: GLOBAL_SSOT_MODULES,
  });

export * from './catalog';
export * from './types';
