/**
 * 物资管理页面共享常量。
 * 这里只负责状态映射和少量格式化，不负责接口调用或页面状态机。
 */
import type { CrudSelectOption, CrudTagMap } from '../shared/crud-page-shell';

export const materialCatalogStatusTagMap = {
	active: { label: '启用', type: 'success' },
	inactive: { label: '停用', type: 'info' }
} as const satisfies CrudTagMap;

export const materialLowStockTagMap = {
	true: { label: '低库存', type: 'warning' },
	false: { label: '正常', type: 'success' }
} as const satisfies CrudTagMap;

export const materialInboundStatusTagMap = {
	draft: { label: '草稿', type: 'info' },
	submitted: { label: '已提交', type: 'warning' },
	received: { label: '已入库', type: 'success' },
	cancelled: { label: '已取消', type: 'danger' }
} as const satisfies CrudTagMap;

export const materialIssueStatusTagMap = {
	draft: { label: '草稿', type: 'info' },
	submitted: { label: '已提交', type: 'warning' },
	issued: { label: '已领用', type: 'primary' },
	cancelled: { label: '已取消', type: 'danger' }
} as const satisfies CrudTagMap;

export function enumOptions(tagMap: Record<string, { label: string }>): CrudSelectOption[] {
	return Object.entries(tagMap).map(([value, item]) => ({
		label: item.label,
		value
	}));
}

export function formatMoney(value: unknown) {
	const amount = Number(value || 0);
	return `¥${amount.toFixed(2)}`;
}

export function formatQuantity(value: unknown) {
	const amount = Number(value || 0);
	return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}
