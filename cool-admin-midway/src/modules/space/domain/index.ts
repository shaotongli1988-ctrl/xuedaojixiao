/**
 * Space 模块领域模型入口。
 * 这里只负责导出 space domain registry，不负责上传运行时和控制器逻辑。
 * 关键依赖是仓库级全域 registry 会从这里进入。
 * 维护重点是统一读取入口，避免再次散读 entity/service。
 */

export * from './registry';
