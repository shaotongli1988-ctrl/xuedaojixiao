/**
 * cool-uni 合同管理移动页类型。
 * 这里只定义合同台账摘要字段，不处理附件、签署轨迹、审批历史或删除动作，也不承载业务状态或类型展示文案。
 */
export type {
	ContractPageQuery,
	ContractRecord,
	ContractStatus,
	ContractType,
} from "/@/generated/performance-contract.generated";

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

export type ContractPageResult = {
	list: import("/@/generated/performance-contract.generated").ContractRecord[];
	pagination: PagePagination;
};

export interface ContractInfoQuery {
	id: number;
}

export function formatContractSalary(value?: number | null) {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "-";
	}
	return `¥${value.toFixed(2)}`;
}
