/**
 * 资产主题页面基础选项加载器。
 * 这里只负责把用户、部门、资产和供应商摘要映射成页面选择项，不负责权限判断或业务筛选逻辑。
 * 维护重点是所有资产页面复用同一套基础选项来源，避免同一资源在不同页面名称或字段不一致。
 */
import { service } from '/@/cool';
import { performanceAssetInfoService } from '../../service/asset-info';
import { performanceSupplierService } from '../../service/supplier';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import {
	createElementLookupWarningHandler,
	createLookupWarningHandler,
	resolveLookupErrorMessage
} from '../shared/lookup-warning';
import type {
	AssetOption,
	DepartmentOption,
	LookupErrorHandler,
	SupplierOption,
	UserOption
} from '../../types';
import type { CrudSelectOption } from '../shared/crud-page-shell';

export type { DepartmentOption } from '../../types';
export type { AssetOption } from '../../types';
export type { LookupErrorHandler } from '../../types';
export type { SupplierOption } from '../../types';
export { createElementLookupWarningHandler, createLookupWarningHandler, resolveLookupErrorMessage };

export function toSelectOptions<T extends { id: number; label: string }>(
	list: T[]
): CrudSelectOption[] {
	return list.map(item => ({
		label: item.label,
		value: item.id
	}));
}

export function toAssetSelectOptions(list: AssetOption[]): CrudSelectOption[] {
	return list.map(item => ({
		label: item.assetNo ? `${item.assetNo} / ${item.name}` : item.name,
		value: item.id
	}));
}

export function toSupplierSelectOptions(list: SupplierOption[]): CrudSelectOption[] {
	return list.map(item => ({
		label: item.name,
		value: item.id
	}));
}

export function toUserSelectOptions(list: UserOption[]): CrudSelectOption[] {
	return list.map(item => ({
		label: item.departmentName ? `${item.name} / ${item.departmentName}` : item.name,
		value: item.id
	}));
}

export async function loadAssetUserOptions(onError?: LookupErrorHandler) {
	return loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 500
			}),
		onError
	) as Promise<UserOption[]>;
}

export async function loadAssetDepartmentOptions(onError?: LookupErrorHandler) {
	return loadDepartmentOptions(() => service.base.sys.department.list(), onError) as Promise<
		DepartmentOption[]
	>;
}

export async function loadAssetOptions(onError?: LookupErrorHandler) {
	try {
		const result = await performanceAssetInfoService.fetchPage({
			page: 1,
			size: 500
		});

		return (result.list || []).map(item => ({
			id: Number(item.id),
			name: item.name,
			assetNo: item.assetNo,
			assetStatus: item.assetStatus
		})) as AssetOption[];
	} catch (error) {
		onError?.(error);
		return [];
	}
}

export async function loadAssetSupplierOptions(onError?: LookupErrorHandler) {
	try {
		const result = await performanceSupplierService.fetchPage({
			page: 1,
			size: 200
		});

		return (result.list || []).map(item => ({
			id: Number(item.id),
			name: item.name,
			status: item.status
		})) as SupplierOption[];
	} catch (error) {
		onError?.(error);
		return [];
	}
}
