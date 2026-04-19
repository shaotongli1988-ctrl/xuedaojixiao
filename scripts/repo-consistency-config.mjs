/**
 * 负责定义仓库一致性守卫的固定路径、命名空间和文档回写规则。
 * 不负责执行扫描、读写 git 状态或解释具体失败明细。
 * 依赖现有 cool-admin 前后端目录、performance 项目文档和本地 pre-push 门禁。
 * 维护重点：任何菜单、权限、路由或自动化门槛范围变化后，都必须先更新这份配置。
 */

const docsRoot = 'performance-management-system/docs';

export const guardConfig = {
	namespace: 'performance:',
	menuJsonPath: 'cool-admin-midway/src/modules/base/menu.json',
	menuStorePath: 'cool-admin-vue/src/modules/base/store/menu.ts',
	permissionDocPath: `${docsRoot}/06-权限矩阵.md`,
	routeDocPath: `${docsRoot}/10-路由与菜单映射.md`,
	highValueDocs: {
		api: `${docsRoot}/04-API设计.md`,
		permissions: `${docsRoot}/06-权限矩阵.md`,
		route: `${docsRoot}/10-路由与菜单映射.md`,
		masking: `${docsRoot}/12-数据权限与脱敏规则.md`,
		automation: `${docsRoot}/24-自动化测试策略与脚本规划.md`
	},
	namingRoots: ['cool-admin-vue/src/modules/performance/views'],
	permissionCodeRoots: [
		'cool-admin-vue/src/modules/performance',
		'cool-admin-midway/src/modules/performance'
	],
	routeSensitiveRoots: [
		'cool-admin-vue/src/modules/performance/views',
		'cool-admin-vue/src/modules/base/store/menu.ts',
		'cool-admin-midway/src/modules/base/menu.json'
	],
	repoGuardRoots: [
		'cool-admin-vue/src/modules/performance',
		'cool-admin-midway/src/modules/performance',
		'cool-admin-midway/src/modules/base/menu.json',
		'cool-admin-vue/src/modules/base/store/menu.ts',
		'scripts',
		'performance-management-system/test',
		'cool-admin-midway/test',
		'cool-admin-vue/test'
	],
	docWritebackRules: [
		{
			id: 'api-contract',
			requiredDoc: `${docsRoot}/04-API设计.md`,
			description: '后端实体/控制器/服务或前端 API service 发生变化时，必须回写 API 设计。',
			matches(filePath) {
				return (
					filePath.startsWith('cool-admin-midway/src/modules/performance/controller/') ||
					filePath.startsWith('cool-admin-midway/src/modules/performance/service/') ||
					filePath.startsWith('cool-admin-midway/src/modules/performance/entity/') ||
					filePath.startsWith('cool-admin-vue/src/modules/performance/service/') ||
					filePath.startsWith(`${docsRoot}/contracts/current/`)
				);
			}
		},
		{
			id: 'permission-contract',
			requiredDoc: `${docsRoot}/06-权限矩阵.md`,
			description: '菜单、权限键或前端权限显隐面发生变化时，必须回写权限矩阵。',
			matches(filePath, fileText) {
				if (
					filePath === 'cool-admin-midway/src/modules/base/menu.json' ||
					filePath.startsWith('cool-admin-vue/src/modules/performance/service/')
				) {
					return true;
				}

				if (
					filePath.startsWith('cool-admin-vue/src/modules/performance/views/') ||
					filePath.startsWith('cool-admin-vue/src/modules/performance/components/') ||
					filePath.startsWith('cool-admin-midway/src/modules/performance/service/')
				) {
					return /checkPerm\(|v-permission|performance:[A-Za-z0-9]+:[A-Za-z0-9]+/.test(fileText);
				}

				return false;
			}
		},
		{
			id: 'route-mapping',
			requiredDoc: `${docsRoot}/10-路由与菜单映射.md`,
			description: '菜单、viewPath 或页面目录发生变化时，必须回写路由与菜单映射。',
			matches(filePath) {
				return (
					filePath === 'cool-admin-midway/src/modules/base/menu.json' ||
					filePath === 'cool-admin-vue/src/modules/base/store/menu.ts' ||
					filePath.startsWith('cool-admin-vue/src/modules/performance/views/')
				);
			}
		},
		{
			id: 'masking-contract',
			requiredDoc: `${docsRoot}/12-数据权限与脱敏规则.md`,
			description: '敏感资源或脱敏/导出相关能力变化时，必须回写脱敏规则。',
			matches(filePath, fileText) {
					if (/(salary|supplier|resumePool|talentAsset)/.test(filePath)) {
					return true;
				}

				if (/(mask|desensit|敏感|脱敏)/i.test(fileText)) {
					return (
						filePath.startsWith('cool-admin-vue/src/modules/performance/') ||
						filePath.startsWith('cool-admin-midway/src/modules/performance/') ||
						filePath.startsWith('cool-admin-vue/src/plugins/excel/')
					);
				}

				return false;
			}
		},
		{
			id: 'automation-contract',
			requiredDoc: `${docsRoot}/24-自动化测试策略与脚本规划.md`,
			description: '测试脚本、门禁脚本或自动化校验边界变化时，必须回写自动化测试策略。',
			matches(filePath) {
				return (
					filePath.startsWith('scripts/') ||
					filePath.startsWith('cool-admin-midway/test/') ||
					filePath.startsWith('cool-admin-vue/test/') ||
					filePath.startsWith('performance-management-system/test/') ||
					filePath.startsWith('cool-admin-midway/scripts/smoke-') ||
					filePath.startsWith('cool-admin-midway/scripts/seed-')
				);
			}
		}
	]
};
