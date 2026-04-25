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

/**
 * 模块成熟度语义：
 * - implemented: 模块已纳入仓库级治理主链，并具备稳定 registry 或 machine source 主入口；局部 surface 仍可为 partial，但缺口必须显式登记。
 * - partial: 已有局部事实源或消费者链，但尚未形成可依赖的全模块闭环。
 * - planned: 已进入治理路线图，但 machine source 或守卫还未稳定到可执行状态。
 * - excluded: 明确排除在当前业务域治理范围外，但必须保留显式登记以避免盲区。
 */
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

/**
 * 表面成熟度语义：
 * - implemented: 已有唯一主源且消费者链真实使用。
 * - partial: 已有主源雏形，但仍存在影子源、双向维护或消费链不闭合。
 * - missing: 当前没有可信主源。
 * - out_of_scope: 当前模块不以该表面作为治理重点。
 */
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
