/**
 * 资产主题页面共享常量。
 * 这里只负责状态文案、标签样式和少量格式化，不负责接口调用或页面状态管理。
 */
export const assetStatusTagMap = {
	pendingInbound: { label: '待入库', type: 'warning' },
	available: { label: '可用', type: 'success' },
	assigned: { label: '已领用', type: 'primary' },
	maintenance: { label: '维护中', type: 'warning' },
	inTransfer: { label: '调拨中', type: 'warning' },
	inventorying: { label: '盘点中', type: 'info' },
	scrapped: { label: '已报废', type: 'danger' },
	lost: { label: '已丢失', type: 'danger' }
} as const;

export const assignmentStatusTagMap = {
	assigned: { label: '已领用', type: 'primary' },
	returned: { label: '已归还', type: 'success' },
	lost: { label: '已丢失', type: 'danger' }
} as const;

export const maintenanceStatusTagMap = {
	scheduled: { label: '待执行', type: 'info' },
	inProgress: { label: '进行中', type: 'warning' },
	completed: { label: '已完成', type: 'success' },
	cancelled: { label: '已取消', type: 'danger' }
} as const;

export const procurementStatusTagMap = {
	draft: { label: '草稿', type: 'info' },
	submitted: { label: '已提交', type: 'warning' },
	received: { label: '已入库', type: 'success' },
	cancelled: { label: '已取消', type: 'danger' }
} as const;

export const transferStatusTagMap = {
	draft: { label: '草稿', type: 'info' },
	submitted: { label: '已提交', type: 'warning' },
	inTransit: { label: '调拨中', type: 'warning' },
	completed: { label: '已完成', type: 'success' },
	cancelled: { label: '已取消', type: 'danger' }
} as const;

export const inventoryStatusTagMap = {
	draft: { label: '草稿', type: 'info' },
	counting: { label: '盘点中', type: 'warning' },
	completed: { label: '已完成', type: 'success' },
	closed: { label: '已关闭', type: 'danger' }
} as const;

export const disposalStatusTagMap = {
	draft: { label: '草稿', type: 'info' },
	submitted: { label: '已提交', type: 'warning' },
	approved: { label: '已审批', type: 'primary' },
	scrapped: { label: '已报废', type: 'success' },
	cancelled: { label: '已取消', type: 'danger' }
} as const;

export function enumOptions(tagMap: Record<string, { label: string }>) {
	return Object.entries(tagMap).map(([value, item]) => ({
		label: item.label,
		value
	}));
}

export function formatMoney(value: any) {
	const amount = Number(value || 0);
	return amount ? `¥${amount.toFixed(2)}` : '¥0.00';
}
