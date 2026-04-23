/**
 * Dict 模块错误语义目录。
 * 这里只负责登记业务字典聚合阶段的稳定错误模板，不负责数据库字典 CRUD 或翻译逻辑。
 * 关键依赖是 dict 领域 provider 聚合守卫与仓库级 SSOT 校验会从这里读取统一模板。
 * 维护重点是模板占位符必须稳定，避免 provider 缺失时的诊断文案再次散落回实现层。
 */

export type DictDomainErrorCategory = 'consistency' | 'internal';

export interface DictDomainErrorDefinition {
  code: string;
  category: DictDomainErrorCategory;
  defaultMessage: string;
}

export const DICT_DOMAIN_ERROR_CODES = Object.freeze({
  businessDictProviderOutputMissing: 'DICT_BUSINESS_DICT_PROVIDER_OUTPUT_MISSING',
});

export const DICT_DOMAIN_ERRORS = Object.freeze([
  {
    code: DICT_DOMAIN_ERROR_CODES.businessDictProviderOutputMissing,
    category: 'consistency',
    defaultMessage: 'Registered business dict key is missing provider output: {requestedKey}',
  },
] as const satisfies readonly DictDomainErrorDefinition[]);

export const DICT_DOMAIN_ERROR_BY_CODE = Object.freeze(
  DICT_DOMAIN_ERRORS.reduce<Record<string, DictDomainErrorDefinition>>(
    (result, item) => {
      result[item.code] = item;
      return result;
    },
    {}
  )
);

export const DICT_DOMAIN_ERROR_RUNTIME_SOURCES = [
  'src/modules/dict/domain/dicts/catalog.ts',
] as const;
