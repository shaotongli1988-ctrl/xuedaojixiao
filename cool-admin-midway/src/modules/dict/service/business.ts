/**
 * 业务字典 service 兼容层。
 * 这里只负责兼容现有 DictInfoService 的调用入口，真实 provider 注册与聚合逻辑已经收敛到 dict/domain/dicts/catalog.ts。
 * 不负责数据库字典 CRUD、翻译落库或业务域内部状态校验。
 * 维护重点是新调用方应优先读取 domain catalog，而不是继续在这里堆 provider 列表。
 */
import {
  resolveBusinessDictGroups,
} from '../domain/dicts/catalog';

export function getBusinessDictGroups(keys?: string[]) {
  return resolveBusinessDictGroups(keys);
}
