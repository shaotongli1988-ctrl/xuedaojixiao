/**
 * cool-uni 指标库移动页类型与展示文案。
 * 这里只定义指标列表最小消费字段，不处理桌面端 CRUD、引用联动或复杂配置动作。
 */
export type {
	IndicatorApplyScope,
	IndicatorCategory,
	IndicatorPageQuery,
	IndicatorRecord,
	IndicatorSaveRequest,
	IndicatorStatus,
} from "/@/generated/performance-indicator.generated";

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

export type IndicatorPageResult = {
	list: import("/@/generated/performance-indicator.generated").IndicatorRecord[];
	pagination: PagePagination;
};

export interface IndicatorInfoQuery {
	id: number;
}
