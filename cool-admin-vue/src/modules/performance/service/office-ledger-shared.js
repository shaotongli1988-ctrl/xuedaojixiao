/**
 * 文件职责：生成行政协同元数据台账模块的标准 endpoint 与权限键；不负责实际请求发送或业务字段校验。
 * 关键依赖：moduleKey 必须与后端 admin/performance/<module> 路由和权限事实源保持一致。
 * 维护重点：只能产出 page/info/stats/add/update/delete 这一组固定动作，避免权限键漂移。
 */

const OFFICE_LEDGER_ACTIONS = ['page', 'info', 'stats', 'add', 'update', 'delete'];

export function buildOfficeLedgerEndpoint(moduleKey) {
	return `admin/performance/${moduleKey}`;
}

export function buildOfficeLedgerPermissions(moduleKey) {
	return OFFICE_LEDGER_ACTIONS.reduce((permissionMap, action) => {
		permissionMap[action] = `performance:${moduleKey}:${action}`;
		return permissionMap;
	}, {});
}

export function createOfficeLedgerModuleMeta(moduleKey) {
	return {
		moduleKey,
		endpoint: buildOfficeLedgerEndpoint(moduleKey),
		permission: buildOfficeLedgerPermissions(moduleKey)
	};
}
