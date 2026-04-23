/**
 * 绩效模块公共选项加载工具。
 * 这里只统一用户选项映射、部门树拍平和加载失败兜底，不负责页面权限、提示文案或业务筛选条件。
 * 维护重点是保持主题内“同一类基础选项只保留一套映射口径”，避免页面继续各自复制相同 loader。
 */
import { BaseService } from '/@/cool';

const baseCommLookupService = new BaseService('admin/base/comm');

function isMissingLookupEndpoint(error) {
	if (!error) {
		return false;
	}

	return (
		error.code === 1001 ||
		String(error.message || '')
			.toLowerCase()
			.includes('not found')
	);
}

/**
 * @param {Array<Record<string, unknown>>} list
 * @returns {{ id: number, name: string, departmentId?: number | null, departmentName?: string }[]}
 */
export function mapUserOptions(list) {
	return (list || []).map(item => ({
		id: Number(item.id),
		name: item.name,
		departmentId: item.departmentId,
		departmentName: item.departmentName
	}));
}

/**
 * @param {Array<Record<string, unknown> & { children?: Array<Record<string, unknown>> }>} list
 * @param {{ id: number, label: string }[]} [result]
 * @returns {{ id: number, label: string }[]}
 */
export function flattenDepartmentOptions(list, result = []) {
	for (const item of list || []) {
		result.push({
			id: Number(item.id),
			label: item.name
		});

		if (Array.isArray(item.children) && item.children.length > 0) {
			flattenDepartmentOptions(item.children, result);
		}
	}

	return result;
}

/**
 * @param {() => Promise<{ list?: Array<Record<string, unknown>> } | null | undefined>} _fetchUsers
 * @param {(error: unknown) => void} [onError]
 * @returns {Promise<{ id: number, name: string, departmentId?: number | null, departmentName?: string }[]>}
 */
export async function loadUserOptions(_fetchUsers, onError) {
	try {
		const result = await baseCommLookupService.request({
			url: '/userOptions',
			method: 'GET'
		});
		return mapUserOptions(result?.list || []);
	} catch (error) {
		if (isMissingLookupEndpoint(error) && typeof _fetchUsers === 'function') {
			try {
				const legacyResult = await _fetchUsers();
				return mapUserOptions(legacyResult?.list || []);
			} catch (legacyError) {
				onError?.(legacyError);
				return [];
			}
		}

		onError?.(error);
		return [];
	}
}

/**
 * @param {() => Promise<Array<Record<string, unknown>> | null | undefined>} _fetchDepartments
 * @param {(error: unknown) => void} [onError]
 * @returns {Promise<{ id: number, label: string }[]>}
 */
export async function loadDepartmentOptions(_fetchDepartments, onError) {
	try {
		const result = await baseCommLookupService.request({
			url: '/departmentOptions',
			method: 'GET'
		});
		return flattenDepartmentOptions(result || []);
	} catch (error) {
		if (isMissingLookupEndpoint(error) && typeof _fetchDepartments === 'function') {
			try {
				const legacyResult = await _fetchDepartments();
				return flattenDepartmentOptions(legacyResult || []);
			} catch (legacyError) {
				onError?.(legacyError);
				return [];
			}
		}

		onError?.(error);
		return [];
	}
}
