/**
 * Base 模块领域模型入口。
 * 这里只负责导出当前已建立的 domain registry 与 permissions catalog，不负责运行时 service 兼容层。
 * 关键依赖是仓库级全域 registry 与测试会从这里进入。
 * 维护重点是统一外部读取路径，避免调用方继续散读 generated 与 menu.json。
 */

export * from './permissions/catalog';
export * from './errors/catalog';
export * from './registry';
