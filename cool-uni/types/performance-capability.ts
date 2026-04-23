/**
 * cool-uni 能力地图移动页类型。
 * 这里只定义能力模型列表消费字段，不处理能力项详情、画像详情或桌面端维护表单，也不承载业务状态展示文案。
 */
export type {
	CapabilityModelPageQuery,
	CapabilityModelPageResult,
	CapabilityModelRecord,
} from "/@/generated/performance-talent-development.generated";

export interface CapabilityModelInfoQuery {
	id: number;
}
