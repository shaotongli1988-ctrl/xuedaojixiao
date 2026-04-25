/**
 * Task 模块领域模型注册中心入口。
 * 这里只负责登记任务模块当前稳定的实体和调度 service 入口，不负责任务执行时机、队列状态或中间件副作用。
 * 关键依赖是仓库级全域 registry 与后续 task 契约治理都会从这里读取统一入口。
 * 维护重点是只登记静态调度主源，不能把运行中的 job 状态误当成 registry 真相。
 */

export const TASK_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export interface TaskDomainRegistry {
  version: string;
  entityTables: readonly string[];
  serviceEntryPoints: readonly string[];
  queueEntryPoints: readonly string[];
}

export const TASK_DOMAIN_REGISTRY: TaskDomainRegistry = Object.freeze({
  version: TASK_DOMAIN_REGISTRY_VERSION,
  entityTables: ['task_info', 'task_log'],
  serviceEntryPoints: [
    'src/modules/task/service/info.ts',
    'src/modules/task/service/local.ts',
    'src/modules/task/service/bull.ts',
  ],
  queueEntryPoints: ['src/modules/task/queue/task.ts'],
});
