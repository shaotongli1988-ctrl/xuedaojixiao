/**
 * 证书业务字典 provider 入口。
 * 这里只负责暴露 dict 模块消费的证书字典 group，不负责证书状态流转、表单校验或业务写入逻辑。
 * 关键依赖是 dict/domain catalog 应只依赖 provider 入口，而不是直接依赖 helper 实现文件。
 * 维护重点：若证书字典来源变更，优先改这里的导出，再同步 dict domain sourcePath，避免 provider 清单重新漂回 helper 文件。
 */

export { getCertificateBusinessDictGroups } from './certificate-helper';
