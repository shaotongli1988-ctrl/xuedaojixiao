import { ModuleConfig } from '@cool-midway/core';

/**
 * 绩效模块入口配置。
 * 这里只负责让模块骨架被 Midway 识别，不承载业务实体、接口或权限实现。
 */
export default () => {
	return {
		name: '绩效管理',
		description: '绩效管理系统首期模块骨架与后续业务落点',
		middlewares: [],
		globalMiddlewares: [],
		order: 0
	} as ModuleConfig;
};
