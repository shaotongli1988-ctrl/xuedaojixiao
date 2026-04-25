/**
 * Dict 模块领域模型入口。
 * 这里只负责导出业务字典 catalog 与模块 registry，不负责数据库字典 service。
 * 关键依赖是仓库级全域 registry、DictInfoService 和测试会从这里进入。
 * 维护重点是后续业务字典聚合逻辑应优先从这里读取，而不是继续在 service 层维护 provider 列表。
 */

export * from './dicts/catalog';
export * from './errors/catalog';
export * from './registry';
