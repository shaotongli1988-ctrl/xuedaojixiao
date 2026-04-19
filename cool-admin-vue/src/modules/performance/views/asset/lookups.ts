/**
 * 资产主题页面基础选项加载器。
 * 这里只负责把用户、部门、资产和供应商摘要映射成页面选择项，不负责权限判断或业务筛选逻辑。
 * 维护重点是所有资产页面复用同一套基础选项来源，避免同一资源在不同页面名称或字段不一致。
 */
import { service } from '/@/cool';
import { performanceAssetInfoService } from '../../service/asset-info';
import { performanceSupplierService } from '../../service/supplier';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import type { AssetInfoRecord, SupplierRecord, UserOption } from '../../types';

export interface DepartmentOption {
	id: number;
	label: string;
}

export interface AssetOption {
	id: number;
	name: string;
	assetNo?: string;
	assetStatus?: AssetInfoRecord['assetStatus'];
}

export interface SupplierOption {
	id: number;
	name: string;
	status?: SupplierRecord['status'];
}

export async function loadAssetUserOptions(onError?: (error: any) => void) {
	return loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 500
			}),
		onError
	) as Promise<UserOption[]>;
}

export async function loadAssetDepartmentOptions(onError?: (error: any) => void) {
	return loadDepartmentOptions(() => service.base.sys.department.list(), onError) as Promise<
		DepartmentOption[]
	>;
}

export async function loadAssetOptions(onError?: (error: any) => void) {
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

export async function loadAssetSupplierOptions(onError?: (error: any) => void) {
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
