/**
 * User 模块领域模型入口。
 * 这里只负责导出 auth catalog 和 domain registry，不负责 app 侧用户实体或运行时 service。
 * 关键依赖是仓库级全域 registry 与测试会从这里进入。
 * 维护重点是对外读取路径必须稳定，避免身份语义继续散读 base service。
 */

export * from './auth/catalog';
export * from './errors/catalog';
export * from './registry';
