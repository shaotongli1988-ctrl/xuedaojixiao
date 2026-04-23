/**
 * 仓库级全域 SSOT 注册中心类型。
 * 这里只负责描述模块覆盖状态、事实面状态与聚合入口契约，不负责运行时权限判断或 OpenAPI 生成。
 * 关键依赖是各模块 domain registry、守卫脚本与文档同步都会复用这些结构。
 * 维护重点是模块状态必须反映真实成熟度，不能把“局部收口”误报成“全域完成”。
 */

export type GlobalSsotModuleKey =
  | 'base'
  | 'demo'
  | 'dict'
  | 'performance'
  | 'plugin'
  | 'recycle'
  | 'space'
  | 'swagger'
  | 'task'
  | 'user';

export type GlobalSsotModuleCategory = 'business' | 'platform' | 'support';

export type GlobalSsotModuleStatus =
  | 'implemented'
  | 'partial'
  | 'planned'
  | 'excluded';

export type GlobalSsotSurfaceKey =
  | 'domain_registry'
  | 'api_contract'
  | 'menu_rbac'
  | 'state_machine'
  | 'error_catalog'
  | 'business_dict'
  | 'frontend_types';

export type GlobalSsotSurfaceStatus =
  | 'implemented'
  | 'partial'
  | 'missing'
  | 'out_of_scope';

export interface GlobalSsotSurfaceDescriptor {
  key: GlobalSsotSurfaceKey;
  status: GlobalSsotSurfaceStatus;
  currentSourcePaths: readonly string[];
  targetSourcePath?: string;
  notes?: string;
}

export interface GlobalSsotModuleDescriptor {
  key: GlobalSsotModuleKey;
  category: GlobalSsotModuleCategory;
  status: GlobalSsotModuleStatus;
  summary: string;
  surfaces: readonly GlobalSsotSurfaceDescriptor[];
  nextMilestone?: string;
  runtimeRegistry?: unknown;
}

export interface GlobalDomainSsotRegistry {
  version: string;
  moduleOrder: readonly GlobalSsotModuleKey[];
  modules: Readonly<Record<GlobalSsotModuleKey, GlobalSsotModuleDescriptor>>;
}
