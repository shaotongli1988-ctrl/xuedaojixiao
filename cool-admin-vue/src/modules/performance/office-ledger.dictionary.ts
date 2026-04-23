/**
 * 文件职责：集中定义行政协同台账的前端枚举字典与下拉选项。
 * 不负责请求发送、runtime decoder 或页面交互逻辑。
 * 维护重点：service contract 与 office 页面配置必须共用这里的值集合，避免状态/类型枚举双写后漂移。
 */

export interface OfficeLedgerDictionaryOption {
	label: string;
	value: string;
	type?: string;
}

function createOption(value: string, label: string, type?: string): OfficeLedgerDictionaryOption {
	return type ? { value, label, type } : { value, label };
}

export const ANNUAL_INSPECTION_STATUS_OPTIONS = [
	createOption('draft', '待整理'),
	createOption('preparing', '准备中', 'warning'),
	createOption('submitted', '已提交', 'primary'),
	createOption('approved', '已完成', 'success'),
	createOption('rejected', '需重提', 'danger'),
	createOption('expired', '已过期', 'info')
] as const;

export const ANNUAL_INSPECTION_STATUS_VALUES = [
	'draft',
	'preparing',
	'submitted',
	'approved',
	'rejected',
	'expired'
] as const;

export const ANNUAL_INSPECTION_CATEGORY_OPTIONS = [
	createOption('safety', '安全类'),
	createOption('equipment', '设备类'),
	createOption('license', '证照类'),
	createOption('compliance', '合规类'),
	createOption('other', '其他')
] as const;

export const ANNUAL_INSPECTION_CATEGORY_VALUES = [
	'safety',
	'equipment',
	'license',
	'compliance',
	'other'
] as const;

export const HONOR_STATUS_OPTIONS = [
	createOption('draft', '待整理'),
	createOption('published', '已发布', 'success'),
	createOption('archived', '已归档', 'info')
] as const;

export const HONOR_STATUS_VALUES = ['draft', 'published', 'archived'] as const;

export const HONOR_TYPE_OPTIONS = [
	createOption('individual', '个人'),
	createOption('team', '团队'),
	createOption('organization', '组织')
] as const;

export const HONOR_TYPE_VALUES = ['individual', 'team', 'organization'] as const;

export const HONOR_LEVEL_OPTIONS = [
	createOption('departmental', '部门级'),
	createOption('city', '市级'),
	createOption('provincial', '省级'),
	createOption('national', '国家级'),
	createOption('international', '国际级')
] as const;

export const HONOR_LEVEL_VALUES = [
	'departmental',
	'city',
	'provincial',
	'national',
	'international'
] as const;

export const PUBLICITY_MATERIAL_STATUS_OPTIONS = [
	createOption('draft', '待整理'),
	createOption('review', '待审核', 'warning'),
	createOption('approved', '已审核', 'primary'),
	createOption('published', '已发布', 'success'),
	createOption('offline', '已下线', 'danger')
] as const;

export const PUBLICITY_MATERIAL_STATUS_VALUES = [
	'draft',
	'review',
	'approved',
	'published',
	'offline'
] as const;

export const PUBLICITY_MATERIAL_TYPE_OPTIONS = [
	createOption('poster', '海报'),
	createOption('video', '视频'),
	createOption('article', '文章'),
	createOption('ppt', 'PPT'),
	createOption('brochure', '画册')
] as const;

export const PUBLICITY_MATERIAL_TYPE_VALUES = ['poster', 'video', 'article', 'ppt', 'brochure'] as const;

export const PUBLICITY_MATERIAL_CHANNEL_OPTIONS = [
	createOption('website', '官网'),
	createOption('wechat', '公众号'),
	createOption('weibo', '微博'),
	createOption('offline', '线下'),
	createOption('all', '全渠道')
] as const;

export const PUBLICITY_MATERIAL_CHANNEL_VALUES = [
	'website',
	'wechat',
	'weibo',
	'offline',
	'all'
] as const;

export const DESIGN_COLLAB_STATUS_OPTIONS = [
	createOption('todo', '待受理'),
	createOption('in_progress', '处理中', 'warning'),
	createOption('review', '待复核', 'primary'),
	createOption('done', '已完成', 'success'),
	createOption('cancelled', '已取消', 'info')
] as const;

export const DESIGN_COLLAB_STATUS_VALUES = ['todo', 'in_progress', 'review', 'done', 'cancelled'] as const;

export const DESIGN_COLLAB_PRIORITY_OPTIONS = [
	createOption('low', '低', 'info'),
	createOption('medium', '中', 'warning'),
	createOption('high', '高', 'danger'),
	createOption('urgent', '紧急', 'danger')
] as const;

export const DESIGN_COLLAB_PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'] as const;

export const EXPRESS_COLLAB_STATUS_OPTIONS = [
	createOption('created', '已创建'),
	createOption('in_transit', '运输中', 'warning'),
	createOption('delivered', '已送达', 'success'),
	createOption('exception', '异常件', 'danger'),
	createOption('returned', '已退回', 'info')
] as const;

export const EXPRESS_COLLAB_STATUS_VALUES = [
	'created',
	'in_transit',
	'delivered',
	'exception',
	'returned'
] as const;

export const EXPRESS_COLLAB_SERVICE_LEVEL_OPTIONS = [
	createOption('standard', '标准'),
	createOption('express', '加急'),
	createOption('same_day', '当日达')
] as const;

export const EXPRESS_COLLAB_SERVICE_LEVEL_VALUES = ['standard', 'express', 'same_day'] as const;

export const EXPRESS_COLLAB_SYNC_STATUS_OPTIONS = [
	createOption('synced', '已同步', 'success'),
	createOption('pending', '待同步', 'warning'),
	createOption('failed', '同步失败', 'danger')
] as const;

export const EXPRESS_COLLAB_SYNC_STATUS_VALUES = ['synced', 'pending', 'failed'] as const;

export const VEHICLE_STATUS_OPTIONS = [
	createOption('idle', '闲置'),
	createOption('in_use', '使用中', 'primary'),
	createOption('maintenance', '维修中', 'warning'),
	createOption('inspection_due', '待年检', 'danger'),
	createOption('retired', '已停用', 'info')
] as const;

export const VEHICLE_STATUS_VALUES = [
	'idle',
	'in_use',
	'maintenance',
	'inspection_due',
	'retired'
] as const;

export const VEHICLE_TYPE_OPTIONS = [
	createOption('sedan', '轿车'),
	createOption('suv', 'SUV'),
	createOption('mpv', 'MPV'),
	createOption('bus', '客车'),
	createOption('truck', '货车'),
	createOption('other', '其他')
] as const;

export const VEHICLE_TYPE_VALUES = ['sedan', 'suv', 'mpv', 'bus', 'truck', 'other'] as const;

export const INTELLECTUAL_PROPERTY_STATUS_OPTIONS = [
	createOption('drafting', '起草中'),
	createOption('applying', '申请中', 'warning'),
	createOption('registered', '已登记', 'success'),
	createOption('expired', '已到期', 'danger'),
	createOption('invalidated', '已失效', 'info')
] as const;

export const INTELLECTUAL_PROPERTY_STATUS_VALUES = [
	'drafting',
	'applying',
	'registered',
	'expired',
	'invalidated'
] as const;

export const INTELLECTUAL_PROPERTY_TYPE_OPTIONS = [
	createOption('patent', '专利'),
	createOption('trademark', '商标'),
	createOption('copyright', '著作权'),
	createOption('softwareCopyright', '软件著作权')
] as const;

export const INTELLECTUAL_PROPERTY_TYPE_VALUES = [
	'patent',
	'trademark',
	'copyright',
	'softwareCopyright'
] as const;

export const INTELLECTUAL_PROPERTY_RISK_LEVEL_OPTIONS = [
	createOption('low', '低', 'success'),
	createOption('medium', '中', 'warning'),
	createOption('high', '高', 'danger')
] as const;

export const INTELLECTUAL_PROPERTY_RISK_LEVEL_VALUES = ['low', 'medium', 'high'] as const;
