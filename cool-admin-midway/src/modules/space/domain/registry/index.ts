/**
 * Space 模块领域模型注册中心入口。
 * 这里只负责登记空间/文件模块当前稳定的实体与 service 主入口，不负责上传实现、签名地址或存储供应商细节。
 * 关键依赖是仓库级全域 registry 与后续 space 契约治理都会从这里读取统一入口。
 * 维护重点是静态 schema 与 service 入口可以登记，运行时存储配置不能误升为领域真相。
 */

export const SPACE_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export interface SpaceDomainRegistry {
  version: string;
  entityTables: readonly string[];
  serviceEntryPoints: readonly string[];
}

export const SPACE_DOMAIN_REGISTRY: SpaceDomainRegistry = Object.freeze({
  version: SPACE_DOMAIN_REGISTRY_VERSION,
  entityTables: ['space_info', 'space_type'],
  serviceEntryPoints: [
    'src/modules/space/service/info.ts',
    'src/modules/space/service/type.ts',
  ],
});
