/**
 * Plugin 模块领域模型入口。
 * 这里只负责导出 plugin domain registry，不负责运行时插件发现、注入或执行。
 * 关键依赖是仓库级全域 registry 会从这里进入。
 * 维护重点是对外读取路径必须稳定，避免再次退回散读 service/config。
 */

export * from './registry';
