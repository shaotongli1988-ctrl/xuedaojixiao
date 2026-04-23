/**
 * 仓库级全域 SSOT 模块目录。
 * 这里只负责登记 backend 各模块当前事实源覆盖状态，并把已落地的模块 registry 汇总进来。
 * 不负责替代模块内部 registry，也不负责把 OpenAPI、菜单或前端类型链改造成正向生成。
 * 维护重点是所有 backend 一级模块都必须在这里有记录，否则全域治理会再次出现盲区。
 */

import { BASE_DOMAIN_REGISTRY } from '../modules/base/domain';
import { DICT_DOMAIN_REGISTRY } from '../modules/dict/domain';
import { PERFORMANCE_DOMAIN_REGISTRY } from '../modules/performance/domain';
import { USER_DOMAIN_REGISTRY } from '../modules/user/domain';

import type {
  GlobalSsotModuleDescriptor,
  GlobalSsotModuleKey,
} from './types';

const GLOBAL_SSOT_MODULE_ORDER = [
  'base',
  'demo',
  'dict',
  'performance',
  'plugin',
  'recycle',
  'space',
  'swagger',
  'task',
  'user',
] as const satisfies readonly GlobalSsotModuleKey[];

export const GLOBAL_SSOT_MODULES: Readonly<
  Record<GlobalSsotModuleKey, GlobalSsotModuleDescriptor>
> = Object.freeze({
  base: {
    key: 'base',
    category: 'platform',
    status: 'partial',
    summary: '基础菜单、路由、权限位和角色能力链仍以 base 模块散落文件为主。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'implemented',
        currentSourcePaths: ['src/modules/base/domain/registry/index.ts'],
        targetSourcePath: 'src/modules/base/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'partial',
        currentSourcePaths: ['contracts/openapi/xuedao.openapi.json'],
        notes: '接口已进入 OpenAPI，但 producer 主源尚未回收为机器可读 registry。',
      },
      {
        key: 'menu_rbac',
        status: 'partial',
        currentSourcePaths: [
          'src/modules/base/menu.json',
          'src/modules/base/domain/permissions/catalog.ts',
          'src/modules/base/generated/permissions.generated.ts',
          'src/modules/base/generated/permission-bits.generated.ts',
          'src/modules/base/generated/route-permissions.generated.ts',
        ],
        targetSourcePath: 'src/modules/base/domain/permissions/catalog.ts',
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
        notes: 'base 当前不是以业务状态机为中心的模块。',
      },
      {
        key: 'error_catalog',
        status: 'missing',
        currentSourcePaths: [],
        targetSourcePath: 'src/modules/base/domain/errors/catalog.ts',
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'partial',
        currentSourcePaths: ['../cool-admin-vue/src/modules/base/generated'],
        notes: '前端消费链存在，但未从 backend registry 正向派生。',
      },
    ],
    nextMilestone:
      '先为 menu/permission bits/route permissions 建立统一 registry，再收口角色与权限语义。',
    runtimeRegistry: BASE_DOMAIN_REGISTRY,
  },
  demo: {
    key: 'demo',
    category: 'support',
    status: 'excluded',
    summary: '示例模块不作为业务域 SSOT 优先治理对象，但必须在全局覆盖图中显式标记。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'api_contract',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'menu_rbac',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
    ],
    nextMilestone: '保持显式排除，避免后续治理遗漏或误解范围。',
  },
  dict: {
    key: 'dict',
    category: 'platform',
    status: 'partial',
    summary: '字典运行时已有统一服务入口，但模块级 domain registry 尚未建立。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'implemented',
        currentSourcePaths: ['src/modules/dict/domain/registry/index.ts'],
        targetSourcePath: 'src/modules/dict/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'partial',
        currentSourcePaths: ['contracts/openapi/xuedao.openapi.json'],
      },
      {
        key: 'menu_rbac',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'partial',
        currentSourcePaths: [
          'src/modules/dict/service/info.ts',
          'src/modules/dict/service/business.ts',
          'src/modules/dict/domain/dicts/catalog.ts',
        ],
        targetSourcePath: 'src/modules/dict/domain/dicts/catalog.ts',
      },
      {
        key: 'frontend_types',
        status: 'partial',
        currentSourcePaths: ['../cool-admin-vue/src/modules/dict'],
      },
    ],
    nextMilestone:
      '继续把数据库字典 type/info 也做成机器可读 registry，再决定是否与各业务域 rollout 目录做更强一致性门禁。',
    runtimeRegistry: DICT_DOMAIN_REGISTRY,
  },
  performance: {
    key: 'performance',
    category: 'business',
    status: 'implemented',
    summary: '后端静态权限、能力、字典和部分状态机已汇总进 domain registry，是当前全仓库样板域。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'implemented',
        currentSourcePaths: ['src/modules/performance/domain/registry/index.ts'],
        targetSourcePath: 'src/modules/performance/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'partial',
        currentSourcePaths: [
          'contracts/openapi/xuedao.openapi.json',
          'src/modules/performance/domain/registry/contract-source.json',
          'src/modules/performance/domain/registry/contract-source.mjs',
          'src/modules/performance/domain/registry/contracts.ts',
        ],
        targetSourcePath:
          'src/modules/performance/domain/registry/contract-source.json',
        notes:
          'OpenAPI 仍是仓库级发布主链，但 performance 模块覆盖范围、consumer targets 与 closure guard 已收口到 backend registry source；剩余缺口是少量 publish-only 历史模块尚未完全正向生成。',
      },
      {
        key: 'menu_rbac',
        status: 'partial',
        currentSourcePaths: [
          'src/modules/base/menu.json',
          'src/modules/base/generated/permissions.generated.ts',
          'src/modules/base/generated/permission-bits.generated.ts',
          'src/modules/base/generated/route-permissions.generated.ts',
        ],
        targetSourcePath: 'src/modules/performance/domain/roles/catalog.ts',
      },
      {
        key: 'state_machine',
        status: 'partial',
        currentSourcePaths: [
          'src/modules/performance/domain/states/assessment.ts',
          'src/modules/performance/domain/states/approval-flow.ts',
        ],
        targetSourcePath: 'src/modules/performance/domain/states',
      },
      {
        key: 'error_catalog',
        status: 'partial',
        currentSourcePaths: ['src/modules/performance/domain/errors/catalog.ts'],
        targetSourcePath: 'src/modules/performance/domain/errors/catalog.ts',
      },
      {
        key: 'business_dict',
        status: 'implemented',
        currentSourcePaths: ['src/modules/performance/domain/dicts/catalog.ts'],
        targetSourcePath: 'src/modules/performance/domain/dicts/catalog.ts',
      },
      {
        key: 'frontend_types',
        status: 'partial',
        currentSourcePaths: [
          'src/modules/performance/domain/registry/contract-source.json',
          '../cool-admin-vue/src/modules/performance/generated',
          '../cool-uni/types',
        ],
        notes:
          '前端 generated types 仍从 OpenAPI 消费，但 web/uni target coverage 已改为 registry-driven，不再靠扫描现有 service 文件反推。',
      },
    ],
    nextMilestone:
      '继续把 publish-only 的历史 performance API 模块从 legacy/openapi-only 状态迁移到 registry-driven producer，最终消除剩余 partial 标记。',
    runtimeRegistry: PERFORMANCE_DOMAIN_REGISTRY,
  },
  plugin: {
    key: 'plugin',
    category: 'platform',
    status: 'planned',
    summary: '插件模块当前以运行时配置和装配逻辑为主，尚未建立模块级 SSOT 骨架。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'missing',
        currentSourcePaths: [],
        targetSourcePath: 'src/modules/plugin/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'menu_rbac',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'missing',
        currentSourcePaths: [],
      },
    ],
    nextMilestone: '先识别插件可配置事实与权限边界，再决定是否需要独立 registry。',
  },
  recycle: {
    key: 'recycle',
    category: 'support',
    status: 'excluded',
    summary: '回收站模块以框架支撑为主，当前不单独作为业务域 SSOT 治理对象。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'api_contract',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'menu_rbac',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
    ],
    nextMilestone: '保持清单覆盖即可，不额外引入业务域治理复杂度。',
  },
  space: {
    key: 'space',
    category: 'platform',
    status: 'planned',
    summary: '文件与空间模块尚未整理其配置、权限和接口事实源。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'missing',
        currentSourcePaths: [],
        targetSourcePath: 'src/modules/space/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'partial',
        currentSourcePaths: ['contracts/openapi/xuedao.openapi.json'],
      },
      {
        key: 'menu_rbac',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'partial',
        currentSourcePaths: ['../cool-admin-vue/src/modules/space'],
      },
    ],
    nextMilestone: '确认 space 模块的权限、错误和接口契约是否需要独立治理。',
  },
  swagger: {
    key: 'swagger',
    category: 'support',
    status: 'excluded',
    summary: 'swagger 模块是契约发布通道，不应被误当成业务真相主源。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'api_contract',
        status: 'out_of_scope',
        currentSourcePaths: ['contracts/openapi/xuedao.openapi.json'],
        notes: 'Swagger 负责发布，不负责定义业务事实。',
      },
      {
        key: 'menu_rbac',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
    ],
    nextMilestone: '后续只作为 consumer/derived pipeline 节点存在。',
  },
  task: {
    key: 'task',
    category: 'platform',
    status: 'planned',
    summary: '任务模块当前偏运行时调度，尚未建立结构化事实表。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'missing',
        currentSourcePaths: [],
        targetSourcePath: 'src/modules/task/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'menu_rbac',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'missing',
        currentSourcePaths: [],
      },
    ],
    nextMilestone: '先确定 task 模块是否需要业务域契约治理，而不只是运行时装配。',
  },
  user: {
    key: 'user',
    category: 'business',
    status: 'partial',
    summary: '用户身份、登录态与角色链存在关键事实，但仍缺少模块级 registry 和统一错误目录。',
    surfaces: [
      {
        key: 'domain_registry',
        status: 'implemented',
        currentSourcePaths: ['src/modules/user/domain/registry/index.ts'],
        targetSourcePath: 'src/modules/user/domain/registry/index.ts',
      },
      {
        key: 'api_contract',
        status: 'partial',
        currentSourcePaths: ['contracts/openapi/xuedao.openapi.json'],
      },
      {
        key: 'menu_rbac',
        status: 'partial',
        currentSourcePaths: [
          'src/modules/base/menu.json',
          'src/modules/user/domain/auth/catalog.ts',
          'src/modules/base/service/sys/user.ts',
          'src/modules/base/service/sys/role.ts',
        ],
        targetSourcePath: 'src/modules/user/domain/auth/catalog.ts',
      },
      {
        key: 'state_machine',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'error_catalog',
        status: 'missing',
        currentSourcePaths: [],
      },
      {
        key: 'business_dict',
        status: 'out_of_scope',
        currentSourcePaths: [],
      },
      {
        key: 'frontend_types',
        status: 'partial',
        currentSourcePaths: [
          '../cool-admin-vue/src/modules/user',
          '../cool-uni/pages/user',
        ],
      },
    ],
    nextMilestone:
      '让 base 登录、鉴权和用户保护逻辑优先只读消费 user/domain/registry，再补错误目录与角色目录。',
    runtimeRegistry: USER_DOMAIN_REGISTRY,
  },
});

export { GLOBAL_SSOT_MODULE_ORDER };
