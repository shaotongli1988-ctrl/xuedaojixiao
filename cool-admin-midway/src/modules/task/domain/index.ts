/**
 * Task 模块领域模型入口。
 * 这里只负责导出 task domain registry，不负责任务队列、事件或中间件运行时逻辑。
 * 关键依赖是仓库级全域 registry 会从这里进入。
 * 维护重点是统一对外读取路径，避免再次散读调度 service 和 queue。
 */

export * from './registry';
