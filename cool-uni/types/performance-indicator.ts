/**
 * cool-uni 指标库移动页类型与展示文案。
 * 这里只定义指标列表最小消费字段，不处理桌面端 CRUD、引用联动或复杂配置动作。
 */
export type {
	IndicatorApplyScope,
	IndicatorCategory,
	IndicatorPageQuery,
	IndicatorPageResult,
	IndicatorRecord,
	IndicatorSaveRequest,
	IndicatorStatus,
} from "/@/generated/performance-indicator.generated";

export interface IndicatorInfoQuery {
	id: number;
}
