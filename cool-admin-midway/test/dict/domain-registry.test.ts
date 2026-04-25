/// <reference types="jest" />
/**
 * Dict 模块 domain registry 最小测试。
 * 这里只验证业务字典 provider 注册、group 聚合和全局 registry 接线，不覆盖数据库字典 CRUD。
 */

import { GLOBAL_DOMAIN_SSOT_REGISTRY } from '../../src/domain-registry';
import {
  DICT_BUSINESS_DICT_BY_KEY,
  DICT_BUSINESS_DICT_GROUPS,
  DICT_BUSINESS_DICT_PROVIDERS,
  DICT_DOMAIN_REGISTRY,
  DICT_DOMAIN_REGISTRY_VERSION,
  resolveBusinessDictGroups,
} from '../../src/modules/dict/domain';

describe('dict domain registry', () => {
  test('should expose phase1 registry and provider catalog', () => {
    expect(DICT_DOMAIN_REGISTRY.version).toBe(DICT_DOMAIN_REGISTRY_VERSION);
    expect(DICT_DOMAIN_REGISTRY.businessDictProviders.length).toBeGreaterThan(0);
    expect(DICT_DOMAIN_REGISTRY.businessDictKeys.length).toBeGreaterThan(0);
    expect(DICT_DOMAIN_REGISTRY.businessDicts.providers.length).toBe(
      DICT_BUSINESS_DICT_PROVIDERS.length
    );
    expect(DICT_DOMAIN_REGISTRY.businessDicts.groups.length).toBe(
      DICT_BUSINESS_DICT_GROUPS.length
    );
  });

  test('should keep provider keys and business dict group keys unique', () => {
    const providerKeys = DICT_BUSINESS_DICT_PROVIDERS.map(item => item.key);
    const groupKeys = DICT_BUSINESS_DICT_GROUPS.map(item => item.key);

    expect(new Set(providerKeys).size).toBe(providerKeys.length);
    expect(new Set(groupKeys).size).toBe(groupKeys.length);
  });

  test('should point certificate business dict provider to dedicated dict entry instead of helper file', () => {
    const certificateProvider = DICT_BUSINESS_DICT_PROVIDERS.find(
      item => item.key === 'performance.certificate'
    );

    expect(certificateProvider).toEqual(
      expect.objectContaining({
        sourcePaths: ['src/modules/performance/service/certificate-dict.ts'],
      })
    );
  });

  test('should resolve business dict groups from unified catalog', () => {
    const result = resolveBusinessDictGroups([
      'performance.assessment.status',
      'performance.goal.status',
    ]);

    expect(result['performance.assessment.status']).toEqual(
      DICT_BUSINESS_DICT_BY_KEY['performance.assessment.status']
    );
    expect(result['performance.goal.status']).toEqual(
      DICT_BUSINESS_DICT_BY_KEY['performance.goal.status']
    );
  });

  test('should register dict domain registry in global ssot map', () => {
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.dict.runtimeRegistry).toBe(
      DICT_DOMAIN_REGISTRY
    );
    expect(
      GLOBAL_DOMAIN_SSOT_REGISTRY.modules.dict.surfaces.find(
        item => item.key === 'domain_registry'
      )
    ).toEqual(
      expect.objectContaining({
        status: 'implemented',
        targetSourcePath: 'src/modules/dict/domain/registry/index.ts',
      })
    );
  });
});
