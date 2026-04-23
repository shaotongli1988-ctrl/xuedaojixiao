/**
 * Dict 模块领域模型注册中心入口。
 * 这里只负责聚合当前已收口的业务字典 provider 目录，不负责数据库字典 CRUD 或翻译逻辑。
 * 关键依赖是 dict/service/business、DictInfoService、仓库级全域 registry 和测试都会从这里读取统一入口。
 * 维护重点是 provider 注册表与 group 快照必须保持 additive-first，避免切断现有 dict/info/data 行为。
 */

import {
  DICT_BUSINESS_DICT_BY_KEY,
  DICT_BUSINESS_DICT_CATALOG,
  DICT_BUSINESS_DICT_GROUPS,
  DICT_BUSINESS_DICT_PROVIDERS,
  type DictBusinessDictCatalog,
} from '../dicts/catalog';

export const DICT_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export interface DictDomainRegistry {
  version: string;
  businessDicts: DictBusinessDictCatalog;
  businessDictProviders: readonly string[];
  businessDictKeys: readonly string[];
}

export const DICT_DOMAIN_REGISTRY: DictDomainRegistry = Object.freeze({
  version: DICT_DOMAIN_REGISTRY_VERSION,
  businessDicts: DICT_BUSINESS_DICT_CATALOG,
  businessDictProviders: DICT_BUSINESS_DICT_PROVIDERS.map(item => item.key),
  businessDictKeys: DICT_BUSINESS_DICT_GROUPS.map(item => item.key),
});

export { DICT_BUSINESS_DICT_BY_KEY };
