/**
 * Plugin 模块领域模型注册中心入口。
 * 这里只负责登记插件模块当前稳定的实体与运行时装配入口，不负责插件执行、上传适配或安装流程。
 * 关键依赖是仓库级全域 registry 与后续 plugin 权限/契约治理都会从这里读取统一入口。
 * 维护重点是这里只登记稳定事实入口，不能把运行时动态插件实例误当成静态 SSOT。
 */

export const PLUGIN_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export interface PluginDomainRegistry {
  version: string;
  entityTables: readonly string[];
  serviceEntryPoints: readonly string[];
  hookEntryPoints: readonly string[];
}

export const PLUGIN_DOMAIN_REGISTRY: PluginDomainRegistry = Object.freeze({
  version: PLUGIN_DOMAIN_REGISTRY_VERSION,
  entityTables: ['plugin_info'],
  serviceEntryPoints: [
    'src/modules/plugin/service/info.ts',
    'src/modules/plugin/service/center.ts',
  ],
  hookEntryPoints: [
    'src/modules/plugin/hooks/base.ts',
    'src/modules/plugin/hooks/upload/index.ts',
  ],
});
