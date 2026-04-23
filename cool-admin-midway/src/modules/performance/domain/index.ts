/**
 * Performance 领域模型主源目录入口。
 * 这里只负责向外导出 domain registry 和其子目录，不负责旧 service 兼容或运行时绑定。
 * 关键依赖是后续任何需要读取后端领域真相的调用方都应优先从这里进入。
 * 维护重点是导出边界必须稳定，避免调用方再次绕回 service/entity 散读真相。
 */

export * from './dicts/catalog';
export * from './errors/catalog';
export * from './registry/contracts';
export * from './registry';
export * from './roles/catalog';
export * from './states/approval-flow';
export * from './states/assessment';
export * from './states/types';
