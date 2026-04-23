/**
 * 物资管理页面基础选项加载器。
 * 这里只负责把用户、部门和物资目录摘要映射成选择项，
 * 不负责权限判断、业务筛选策略或库存计算。
 */
import { service } from '/@/cool';
import { performanceMaterialCatalogService } from '../../service/material-catalog';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import {
	createElementLookupWarningHandler,
	createLookupWarningHandler,
	resolveLookupErrorMessage
} from '../shared/lookup-warning';
import type { DepartmentOption, LookupErrorHandler, MaterialOption, UserOption } from '../../types';
import type { CrudSelectOption } from '../shared/crud-page-shell';

export type { DepartmentOption } from '../../types';
export type { LookupErrorHandler } from '../../types';
export type { MaterialOption } from '../../types';
export { createElementLookupWarningHandler, createLookupWarningHandler, resolveLookupErrorMessage };

export function toSelectOptions<T extends { id: number; label: string }>(
	list: T[]
): CrudSelectOption[] {
	return list.map(item => ({
		label: item.label,
		value: item.id
	}));
}

export async function loadMaterialUserOptions(onError?: LookupErrorHandler) {
	return loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 500
			}),
		onError
	) as Promise<UserOption[]>;
}

export async function loadMaterialDepartmentOptions(onError?: LookupErrorHandler) {
	return loadDepartmentOptions(() => service.base.sys.department.list(), onError) as Promise<
		DepartmentOption[]
	>;
}

export function toMaterialCatalogSelectOptions(list: MaterialOption[]): CrudSelectOption[] {
	return list.map(item => ({
		label: item.code ? `${item.code} / ${item.name}` : item.name,
		value: item.id
	}));
}

export function toMaterialUserSelectOptions(list: UserOption[]): CrudSelectOption[] {
	return list.map(item => ({
		label: item.departmentName ? `${item.name} / ${item.departmentName}` : item.name,
		value: item.id
	}));
}

export async function loadMaterialCatalogOptions(onError?: LookupErrorHandler) {
	try {
		const result = await performanceMaterialCatalogService.fetchPage({
			page: 1,
			size: 500
		});

		return (result.list || []).map(item => ({
			id: Number(item.id),
			name: item.name,
			code: item.code,
			category: item.category,
			specification: item.specification,
			unit: item.unit,
			status: item.status
		})) as MaterialOption[];
	} catch (error) {
		onError?.(error);
		return [];
	}
}
