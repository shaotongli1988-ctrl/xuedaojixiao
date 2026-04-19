/**
 * 绩效模块公共选项加载工具。
 * 这里只统一用户选项映射、部门树拍平和加载失败兜底，不负责页面权限、提示文案或业务筛选条件。
 * 维护重点是保持主题内“同一类基础选项只保留一套映射口径”，避免页面继续各自复制相同 loader。
 */

/**
 * @param {any[]} list
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
 * @param {any[]} list
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
 * @param {() => Promise<{ list?: any[] } | null | undefined>} fetchUsers
 * @param {(error: any) => void} [onError]
 * @returns {Promise<{ id: number, name: string, departmentId?: number | null, departmentName?: string }[]>}
 */
export async function loadUserOptions(fetchUsers, onError) {
	try {
		const result = await fetchUsers();
		return mapUserOptions(result?.list || []);
	} catch (error) {
		onError?.(error);
		return [];
	}
}

/**
 * @param {() => Promise<any[] | null | undefined>} fetchDepartments
 * @param {(error: any) => void} [onError]
 * @returns {Promise<{ id: number, label: string }[]>}
 */
export async function loadDepartmentOptions(fetchDepartments, onError) {
	try {
		const result = await fetchDepartments();
		return flattenDepartmentOptions(result || []);
	} catch (error) {
		onError?.(error);
		return [];
	}
}
