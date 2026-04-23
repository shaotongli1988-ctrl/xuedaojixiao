/// <reference types="jest" />
/**
 * 仓库级全域 SSOT 注册中心最小测试。
 * 这里只验证 backend 模块覆盖清单完整、performance 样板域已接入全局入口，不覆盖具体业务运行时行为。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  GLOBAL_DOMAIN_SSOT_REGISTRY,
  GLOBAL_DOMAIN_SSOT_REGISTRY_VERSION,
} from '../src/domain-registry';
import { PERFORMANCE_DOMAIN_REGISTRY } from '../src/modules/performance/domain';

describe('global domain ssot registry', () => {
  test('should enumerate every first-level backend module directory', () => {
    const modulesDir = path.resolve(__dirname, '../src/modules');
    const moduleDirs = fs
      .readdirSync(modulesDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
    const registeredModuleKeys = [...GLOBAL_DOMAIN_SSOT_REGISTRY.moduleOrder].sort();

    expect(registeredModuleKeys).toEqual(moduleDirs);
    expect(Object.keys(GLOBAL_DOMAIN_SSOT_REGISTRY.modules).sort()).toEqual(
      moduleDirs
    );
  });

  test('should expose stable phase0 version and module statuses', () => {
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.version).toBe(
      GLOBAL_DOMAIN_SSOT_REGISTRY_VERSION
    );
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.performance.status).toBe(
      'implemented'
    );
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.base.status).toBe('partial');
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.demo.status).toBe('excluded');
  });

  test('should attach performance runtime registry as first implemented sample', () => {
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.performance.runtimeRegistry).toBe(
      PERFORMANCE_DOMAIN_REGISTRY
    );
    expect(
      GLOBAL_DOMAIN_SSOT_REGISTRY.modules.performance.surfaces.find(
        item => item.key === 'domain_registry'
      )
    ).toEqual(
      expect.objectContaining({
        status: 'implemented',
        targetSourcePath: 'src/modules/performance/domain/registry/index.ts',
      })
    );
  });
});
