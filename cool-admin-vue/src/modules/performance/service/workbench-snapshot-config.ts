/**
 * 角色工作台本地占位模板配置。
 * 这里只维护不同 persona/templateKey 对应的静态快照骨架与入口文案，
 * 不负责后端 access context 解析、SSOT 卡片过滤、权限判断或路由装配。
 * 维护重点是模板数据必须稳定可复用，后续逐步替换为后端真实下发时只改这一层而不污染组装逻辑。
 */
import type {
	WorkbenchRoleInput,
	WorkbenchSectionModel,
	WorkbenchSnapshot,
	WorkbenchTaskCardModel
} from '../workbench/types';

export type WorkbenchTemplateKey = 'hr' | 'manager' | 'staff' | 'analysis';

function createCard(card: WorkbenchTaskCardModel): WorkbenchTaskCardModel {
	return {
		tone: 'info',
		actionText: '进入页面',
		tags: [],
		metrics: [],
		...card
	};
}

function createSection(section: WorkbenchSectionModel): WorkbenchSectionModel {
	return {
		...section,
		cards: section.cards.map(createCard)
	};
}

function normalizeInput(
	input: WorkbenchRoleInput
): Required<Pick<WorkbenchRoleInput, 'userName' | 'departmentName'>> {
	return {
		userName: input.userName || '当前用户',
		departmentName: input.departmentName || '当前部门'
	};
}

function buildHrSnapshot(
	input: Required<Pick<WorkbenchRoleInput, 'userName' | 'departmentName'>>
): WorkbenchSnapshot {
	return {
		profile: {
			roleKey: 'hr',
			roleLabel: 'HR / 运营视角',
			name: input.userName,
			departmentName: input.departmentName || '人力资源部',
			welcomeText: `${input.userName}，当前工作台只承接导航和占位，不代替既有业务页写入。`,
			description: '聚焦招聘、绩效、薪资和培训协同，方便从单入口回到现有页面继续处理。',
			tags: ['Phase 1 最小骨架', '导航分发', '占位数据'],
			stats: [
				{
					key: 'pending',
					label: '待收口事项',
					value: 8,
					hint: '招聘与绩效联动项'
				},
				{
					key: 'interview',
					label: '本周面试安排',
					value: 12,
					hint: '进入面试管理继续处理'
				},
				{
					key: 'risk',
					label: '风险提醒',
					value: 3,
					hint: '优先处理超时事项'
				},
				{
					key: 'ready',
					label: '快捷入口',
					value: 6,
					hint: '全部指向既有页面'
				}
			]
		},
		sections: [
			createSection({
				key: 'pending',
				title: '待我处理',
				description: '优先展示 HR 视角需要收口的占位任务。',
				tip: '本周优先',
				cards: [
					{
						id: 'hr-pending-recruit-plan',
						title: '招聘计划收口',
						description: '岗位需求、编制确认和候选人节奏需要回到招聘计划页继续处理。',
						badge: '待我处理',
						tone: 'primary',
						count: 4,
						countLabel: '项待收口',
						statusText: '优先核对高优先级岗位',
						path: '/performance/recruit-plan',
						tags: ['招聘', '计划'],
						metrics: [
							{ label: '最近节点', value: '周三 18:00' },
							{ label: '入口页面', value: '招聘计划' }
						]
					},
					{
						id: 'hr-pending-feedback',
						title: '反馈任务发起',
						description: '本轮绩效反馈尚未全部发起，继续在反馈页执行任务创建和跟进。',
						badge: '需推进',
						tone: 'warning',
						count: 2,
						countLabel: '项待发起',
						statusText: '保持反馈节奏与考核周期一致',
						path: '/performance/feedback',
						tags: ['绩效', '反馈'],
						metrics: [
							{ label: '影响范围', value: '销售一部 / 教研部' },
							{ label: '入口页面', value: '反馈管理' }
						]
					},
					{
						id: 'hr-pending-salary',
						title: '薪资归档复核',
						description: '本月归档前还需回到薪资页检查异常项和确认状态。',
						badge: '临近截止',
						tone: 'danger',
						count: 2,
						countLabel: '批次待复核',
						statusText: '截止前确认归档与调整记录',
						path: '/performance/salary',
						tags: ['薪资', '归档'],
						metrics: [
							{ label: '当前批次', value: '2026-04' },
							{ label: '入口页面', value: '薪资管理' }
						]
					}
				]
			}),
			createSection({
				key: 'mine',
				title: '我的事项',
				description: '保留当前账号近期常用的个人处理入口。',
				tip: '个人视角',
				cards: [
					{
						id: 'hr-mine-interview',
						title: '我的面试排期',
						description: '查看近期面试安排和候选人节奏，继续在面试管理页操作。',
						badge: '本周',
						tone: 'success',
						count: 5,
						countLabel: '场面试',
						statusText: '按岗位优先级安排面试官',
						path: '/performance/interview',
						tags: ['面试'],
						metrics: [
							{ label: '最近一场', value: '今天 15:30' },
							{ label: '入口页面', value: '面试管理' }
						]
					},
					{
						id: 'hr-mine-hiring',
						title: '我的录用跟进',
						description: 'Offer 发放和接受结果仍在录用管理页跟进。',
						badge: '进行中',
						tone: 'primary',
						count: 3,
						countLabel: '单据进行中',
						statusText: '优先确认 offer 超时项',
						path: '/performance/hiring',
						tags: ['录用'],
						metrics: [
							{ label: '待反馈', value: '2 人' },
							{ label: '入口页面', value: '录用管理' }
						]
					},
					{
						id: 'hr-mine-course',
						title: '培训课程跟进',
						description: '课程发布和证书发放继续在课程与证书页面拆分处理。',
						badge: '联动',
						tone: 'info',
						count: 2,
						countLabel: '条待跟进',
						statusText: '课程与证书分页面维护',
						path: '/performance/course',
						tags: ['培训', '证书'],
						metrics: [
							{ label: '关联页面', value: '课程 / 证书' },
							{ label: '入口页面', value: '课程管理' }
						]
					}
				]
			}),
			createSection({
				key: 'zone',
				title: '角色专区',
				description: '按 HR 角色聚合高频域入口，保持只导航不写入。',
				tip: '角色分发',
				cards: [
					{
						id: 'hr-zone-recruitment',
						title: '招聘中心',
						description:
							'统一跳转到招聘计划、职位标准、简历池、面试、人才资产和录用管理。',
						badge: '专区',
						tone: 'primary',
						statusText: '适合从单入口切换到招聘各子页',
						path: '/performance/recruitment-center',
						tags: ['招聘中台'],
						metrics: [
							{ label: '覆盖页面', value: '6 个' },
							{ label: '入口页面', value: '招聘中心' }
						]
					},
					{
						id: 'hr-zone-dashboard',
						title: '绩效驾驶舱',
						description: '查看模块 3 汇总结果，继续在各业务页承接细项动作。',
						badge: '聚合',
						tone: 'success',
						statusText: '只读汇总，不做聚合写入',
						path: '/data-center/dashboard',
						tags: ['绩效', '看板'],
						metrics: [
							{ label: '核心动作', value: '查看汇总' },
							{ label: '入口页面', value: '绩效驾驶舱' }
						]
					},
					{
						id: 'hr-zone-salary',
						title: '薪资专区',
						description: '围绕归档、确认和调整记录处理 HR 运行事项。',
						badge: '闭环',
						tone: 'warning',
						statusText: '继续在薪资页完成确认与调整',
						path: '/performance/salary',
						tags: ['薪资'],
						metrics: [
							{ label: '当前阶段', value: '月度归档' },
							{ label: '入口页面', value: '薪资管理' }
						]
					}
				]
			}),
			createSection({
				key: 'shortcuts',
				title: '快捷入口',
				description: '保留跨主题高频页面，减少菜单切换成本。',
				tip: '常用路径',
				cards: [
					{
						id: 'hr-shortcut-capability',
						title: '能力地图',
						description: '查看能力模型和能力画像摘要。',
						badge: '能力',
						tone: 'info',
						path: '/performance/capability',
						statusText: '从能力结果回到培训和证书联动',
						tags: ['人才发展']
					},
					{
						id: 'hr-shortcut-certificate',
						title: '证书台账',
						description: '继续处理证书维护、发放和记录查询。',
						badge: '台账',
						tone: 'success',
						path: '/performance/certificate',
						statusText: '证书动作仍在业务页完成',
						tags: ['证书']
					},
					{
						id: 'hr-shortcut-contract',
						title: '合同管理',
						description: '回到合同页查看生效、终止和到期状态摘要。',
						badge: '合同',
						tone: 'warning',
						path: '/performance/contract',
						statusText: '适合联动录用后的资料检查',
						tags: ['入转调离']
					}
				]
			}),
			createSection({
				key: 'risks',
				title: '风险提醒',
				description: '占位展示 Phase 1 需要优先关注的运行风险。',
				tip: '提醒占位',
				cards: [
					{
						id: 'hr-risk-offer',
						title: 'Offer 超时未反馈',
						description: '候选人反馈窗口接近截止，建议回到录用管理页查看状态。',
						badge: '高优先级',
						tone: 'danger',
						count: 1,
						countLabel: '项风险',
						statusText: '建议今天内完成一次跟进',
						path: '/performance/hiring',
						tags: ['录用风险']
					},
					{
						id: 'hr-risk-salary',
						title: '薪资确认临期',
						description: '本月薪资确认窗口即将关闭，需检查未确认记录。',
						badge: '截止提醒',
						tone: 'warning',
						count: 2,
						countLabel: '项提醒',
						statusText: '归档前完成复核',
						path: '/performance/salary',
						tags: ['薪资风险']
					},
					{
						id: 'hr-risk-course',
						title: '培训证书待补发',
						description: '课程已发布但证书发放未闭环，建议检查证书台账。',
						badge: '需跟进',
						tone: 'info',
						count: 3,
						countLabel: '项待补',
						statusText: '证书发放需要回到台账页处理',
						path: '/performance/certificate',
						tags: ['培训联动']
					}
				]
			})
		]
	};
}

function buildManagerSnapshot(
	input: Required<Pick<WorkbenchRoleInput, 'userName' | 'departmentName'>>
): WorkbenchSnapshot {
	return {
		profile: {
			roleKey: 'manager',
			roleLabel: '主管 / 负责人视角',
			name: input.userName,
			departmentName: input.departmentName || '当前部门',
			welcomeText: `${input.userName}，这里先提供部门经营类工作的入口骨架，细项仍回到原页面完成。`,
			description: '聚焦目标、反馈、晋升、PIP 和会议协同，方便主管在一个页面分发日常动作。',
			tags: ['Phase 1 最小骨架', '部门视角', '只导航不写入'],
			stats: [
				{
					key: 'approval',
					label: '待我处理',
					value: 6,
					hint: '反馈与目标事项'
				},
				{
					key: 'people',
					label: '团队关注点',
					value: 4,
					hint: '覆盖反馈 / 晋升 / PIP'
				},
				{
					key: 'meeting',
					label: '本周会议',
					value: 3,
					hint: '回到会议管理页处理'
				},
				{
					key: 'risk',
					label: '风险提醒',
					value: 2,
					hint: '先看逾期项'
				}
			]
		},
		sections: [
			createSection({
				key: 'pending',
				title: '待我处理',
				description: '突出主管角色最常见的部门经营动作。',
				tip: '团队优先',
				cards: [
					{
						id: 'manager-pending-feedback',
						title: '反馈结果确认',
						description: '本轮反馈结果需要确认和收口，继续在反馈页处理。',
						badge: '待确认',
						tone: 'primary',
						count: 3,
						countLabel: '项待确认',
						statusText: '优先关闭逾期反馈',
						path: '/performance/feedback',
						tags: ['反馈'],
						metrics: [
							{ label: '影响范围', value: input.departmentName || '当前部门' },
							{ label: '入口页面', value: '反馈管理' }
						]
					},
					{
						id: 'manager-pending-goal',
						title: '目标差距跟进',
						description: '团队目标和实际结果存在差距，需要回到目标页跟进。',
						badge: '需跟进',
						tone: 'warning',
						count: 2,
						countLabel: '项差距',
						statusText: '关注低完成率成员',
						path: '/performance/goals',
						tags: ['目标'],
						metrics: [
							{ label: '今日视图', value: '部门目标运营' },
							{ label: '入口页面', value: '目标运营' }
						]
					},
					{
						id: 'manager-pending-meeting',
						title: '面谈会议安排',
						description: '绩效面谈和团队会议排期需要继续在会议管理页处理。',
						badge: '本周',
						tone: 'success',
						count: 1,
						countLabel: '场待安排',
						statusText: '优先安排绩效面谈',
						path: '/performance/meeting',
						tags: ['会议']
					}
				]
			}),
			createSection({
				key: 'mine',
				title: '我的事项',
				description: '保留主管近期需要频繁回访的个人事项。',
				tip: '个人安排',
				cards: [
					{
						id: 'manager-mine-promotion',
						title: '晋升建议跟进',
						description: '继续在晋升页查看待审建议和当前进度。',
						badge: '进行中',
						tone: 'primary',
						count: 2,
						countLabel: '条建议',
						statusText: '继续在晋升页做后续动作',
						path: '/performance/promotion',
						tags: ['晋升']
					},
					{
						id: 'manager-mine-pip',
						title: 'PIP 跟踪',
						description: '保留正在跟踪的改进计划入口，便于快速回到 PIP 页。',
						badge: '持续关注',
						tone: 'danger',
						count: 1,
						countLabel: '条计划',
						statusText: '重点关注 active 状态项',
						path: '/performance/pip',
						tags: ['PIP']
					},
					{
						id: 'manager-mine-dashboard',
						title: '部门汇总观察',
						description: '先看驾驶舱摘要，再回到各明细页继续操作。',
						badge: '只读汇总',
						tone: 'info',
						statusText: '驾驶舱只展示汇总，不承接写入',
						path: '/data-center/dashboard',
						tags: ['驾驶舱']
					}
				]
			}),
			createSection({
				key: 'zone',
				title: '角色专区',
				description: '给主管角色固定一组常用经营类专区入口。',
				tip: '主管专区',
				cards: [
					{
						id: 'manager-zone-goals',
						title: '目标运营专区',
						description: '集中查看目标完成率、日报上报和部门配置。',
						badge: '专区',
						tone: 'success',
						path: '/performance/goals',
						statusText: '适合从主管视角进入当天运营',
						tags: ['目标运营']
					},
					{
						id: 'manager-zone-feedback',
						title: '反馈专区',
						description: '汇总反馈任务、详情抽屉和后续联动入口。',
						badge: '反馈',
						tone: 'primary',
						path: '/performance/feedback',
						statusText: '反馈动作继续在原页面执行',
						tags: ['反馈闭环']
					},
					{
						id: 'manager-zone-promotion',
						title: '人才发展专区',
						description: '围绕晋升建议和能力画像快速切换到发展页面。',
						badge: '发展',
						tone: 'warning',
						path: '/performance/promotion',
						statusText: '建议联动能力地图和课程页',
						tags: ['晋升', '发展']
					}
				]
			}),
			createSection({
				key: 'shortcuts',
				title: '快捷入口',
				description: '保留主管高频访问的既有页面路径。',
				tip: '常用入口',
				cards: [
					{
						id: 'manager-shortcut-capability',
						title: '能力地图',
						description: '查看团队能力画像和模型摘要。',
						badge: '画像',
						tone: 'info',
						path: '/performance/capability',
						statusText: '适合配合晋升建议查看',
						tags: ['能力']
					},
					{
						id: 'manager-shortcut-course',
						title: '课程管理',
						description: '查看课程发布情况和培训安排。',
						badge: '培训',
						tone: 'success',
						path: '/performance/course',
						statusText: '课程动作仍在原页面执行',
						tags: ['培训']
					},
					{
						id: 'manager-shortcut-certificate',
						title: '证书台账',
						description: '查看证书维护和发放记录。',
						badge: '台账',
						tone: 'warning',
						path: '/performance/certificate',
						statusText: '适合补全培训闭环',
						tags: ['证书']
					}
				]
			}),
			createSection({
				key: 'risks',
				title: '风险提醒',
				description: '先占位展示主管视角最常见的异常提醒。',
				tip: '风险占位',
				cards: [
					{
						id: 'manager-risk-feedback',
						title: '反馈逾期',
						description: '团队内仍有反馈未按期完成，建议优先回到反馈页处理。',
						badge: '高优先级',
						tone: 'danger',
						count: 1,
						countLabel: '项逾期',
						statusText: '建议今天内完成确认',
						path: '/performance/feedback',
						tags: ['反馈风险']
					},
					{
						id: 'manager-risk-goal',
						title: '目标偏差扩大',
						description: '目标完成率偏低的成员需要继续在目标页下钻查看。',
						badge: '需关注',
						tone: 'warning',
						count: 2,
						countLabel: '人待关注',
						statusText: '优先看今日未提交项',
						path: '/performance/goals',
						tags: ['目标风险']
					},
					{
						id: 'manager-risk-pip',
						title: 'PIP 节点临近',
						description: '改进计划里程碑即将到期，建议回到 PIP 页检查记录。',
						badge: '里程碑',
						tone: 'info',
						count: 1,
						countLabel: '项提醒',
						statusText: '重点看 active 状态',
						path: '/performance/pip',
						tags: ['PIP 风险']
					}
				]
			})
		]
	};
}

function buildStaffSnapshot(
	input: Required<Pick<WorkbenchRoleInput, 'userName' | 'departmentName'>>
): WorkbenchSnapshot {
	return {
		profile: {
			roleKey: 'staff',
			roleLabel: '员工视角',
			name: input.userName,
			departmentName: input.departmentName || '当前部门',
			welcomeText: `${input.userName}，当前页面先提供个人工作入口骨架，具体任务仍回到业务页处理。`,
			description: '聚焦个人目标、课程、会议和能力成长入口，避免在多个菜单间来回查找。',
			tags: ['Phase 1 最小骨架', '个人视角', '导航分发'],
			stats: [
				{
					key: 'todo',
					label: '待处理事项',
					value: 5,
					hint: '目标 / 课程 / 反馈'
				},
				{
					key: 'learning',
					label: '学习成长入口',
					value: 3,
					hint: '课程 / 能力 / 证书'
				},
				{
					key: 'meeting',
					label: '近期会议',
					value: 2,
					hint: '回到会议管理页查看'
				},
				{
					key: 'risk',
					label: '提醒占位',
					value: 2,
					hint: '优先看截止项'
				}
			]
		},
		sections: [
			createSection({
				key: 'pending',
				title: '待我处理',
				description: '个人待办先收拢到目标、课程和反馈三个方向。',
				tip: '今日事项',
				cards: [
					{
						id: 'staff-pending-goals',
						title: '目标进度更新',
						description: '今日目标结果需要补充，继续在目标页提交或查看进度。',
						badge: '待处理',
						tone: 'primary',
						count: 2,
						countLabel: '项待更新',
						statusText: '优先处理今天的个人目标',
						path: '/performance/goals',
						tags: ['目标']
					},
					{
						id: 'staff-pending-course',
						title: '课程学习提醒',
						description: '本周课程仍需继续学习，入口保持在课程管理页。',
						badge: '学习',
						tone: 'success',
						count: 1,
						countLabel: '门课程',
						statusText: '继续在课程页查看学习安排',
						path: '/performance/course',
						tags: ['培训']
					},
					{
						id: 'staff-pending-feedback',
						title: '反馈确认',
						description: '个人反馈结果需要查看和确认，继续在反馈页完成。',
						badge: '确认',
						tone: 'warning',
						count: 2,
						countLabel: '项待查看',
						statusText: '建议先确认最新反馈',
						path: '/performance/feedback',
						tags: ['反馈']
					}
				]
			}),
			createSection({
				key: 'mine',
				title: '我的事项',
				description: '保留员工最常回访的个人入口。',
				tip: '个人常用',
				cards: [
					{
						id: 'staff-mine-meeting',
						title: '我的会议安排',
						description: '查看近期会议和绩效面谈安排。',
						badge: '本周',
						tone: 'info',
						count: 2,
						countLabel: '场会议',
						statusText: '会议信息继续在会议页查看',
						path: '/performance/meeting',
						tags: ['会议']
					},
					{
						id: 'staff-mine-certificate',
						title: '我的证书进度',
						description: '查看证书发放和记录摘要，继续在证书台账页处理。',
						badge: '成长',
						tone: 'success',
						count: 1,
						countLabel: '项待查看',
						statusText: '证书与课程联动查看',
						path: '/performance/certificate',
						tags: ['证书']
					},
					{
						id: 'staff-mine-capability',
						title: '我的能力画像',
						description: '从能力地图查看当前画像和发展方向。',
						badge: '画像',
						tone: 'primary',
						statusText: '适合配合课程页一起查看',
						path: '/performance/capability',
						tags: ['能力']
					}
				]
			}),
			createSection({
				key: 'zone',
				title: '角色专区',
				description: '员工专区聚焦成长和个人执行入口。',
				tip: '成长专区',
				cards: [
					{
						id: 'staff-zone-course',
						title: '学习专区',
						description: '统一回到课程页查看课程、学习状态和后续证书动作。',
						badge: '专区',
						tone: 'success',
						path: '/performance/course',
						statusText: '课程页是学习主入口',
						tags: ['学习']
					},
					{
						id: 'staff-zone-goals',
						title: '目标专区',
						description: '集中查看个人目标、日报结果和完成率。',
						badge: '个人目标',
						tone: 'primary',
						path: '/performance/goals',
						statusText: '个人结果仍在目标页提交',
						tags: ['目标运营']
					},
					{
						id: 'staff-zone-feedback',
						title: '反馈专区',
						description: '查看反馈结果和后续改进动作。',
						badge: '反馈',
						tone: 'warning',
						path: '/performance/feedback',
						statusText: '反馈确认继续在业务页处理',
						tags: ['反馈闭环']
					}
				]
			}),
			createSection({
				key: 'shortcuts',
				title: '快捷入口',
				description: '提供几个个人视角的高频页面快捷跳转。',
				tip: '常用路径',
				cards: [
					{
						id: 'staff-shortcut-dashboard',
						title: '绩效驾驶舱',
						description: '先看汇总观察，再决定回到哪一个明细页。',
						badge: '只读',
						tone: 'info',
						path: '/data-center/dashboard',
						statusText: '驾驶舱不承接写入',
						tags: ['汇总']
					},
					{
						id: 'staff-shortcut-meeting',
						title: '会议管理',
						description: '查看近期会议和面谈安排。',
						badge: '会议',
						tone: 'success',
						path: '/performance/meeting',
						statusText: '适合快速确认时间安排',
						tags: ['会议']
					},
					{
						id: 'staff-shortcut-certificate',
						title: '证书台账',
						description: '查看证书状态和历史记录。',
						badge: '证书',
						tone: 'warning',
						path: '/performance/certificate',
						statusText: '适合核对成长闭环',
						tags: ['证书']
					}
				]
			}),
			createSection({
				key: 'risks',
				title: '风险提醒',
				description: '先占位展示个人视角需要关注的截止类提醒。',
				tip: '提醒占位',
				cards: [
					{
						id: 'staff-risk-goals',
						title: '目标日报未更新',
						description: '今日个人目标结果尚未补齐，建议回到目标页处理。',
						badge: '截止前',
						tone: 'danger',
						count: 1,
						countLabel: '项提醒',
						statusText: '建议下班前更新',
						path: '/performance/goals',
						tags: ['目标提醒']
					},
					{
						id: 'staff-risk-course',
						title: '课程学习临期',
						description: '课程完成节点临近，建议继续在课程页查看安排。',
						badge: '学习提醒',
						tone: 'warning',
						count: 1,
						countLabel: '门课程',
						statusText: '先完成已发布课程',
						path: '/performance/course',
						tags: ['课程提醒']
					},
					{
						id: 'staff-risk-feedback',
						title: '反馈结果待确认',
						description: '最新反馈结果尚未查看，建议回到反馈页确认。',
						badge: '需确认',
						tone: 'info',
						count: 1,
						countLabel: '项待确认',
						statusText: '建议今天完成查看',
						path: '/performance/feedback',
						tags: ['反馈提醒']
					}
				]
			})
		]
	};
}

function buildAnalysisSnapshot(
	input: Required<Pick<WorkbenchRoleInput, 'userName' | 'departmentName'>>
): WorkbenchSnapshot {
	return {
		profile: {
			roleKey: 'staff',
			roleLabel: '分析视角',
			name: input.userName,
			departmentName: input.departmentName || '当前部门',
			welcomeText: `${input.userName}，当前工作台聚焦只读观察入口，分析动作以汇总页面为主。`,
			description: '聚焦汇总看板和分析入口，不在工作台承接业务写入。',
			tags: ['Phase 1 最小骨架', '只读分析', '导航分发'],
			stats: [
				{
					key: 'todo',
					label: '分析入口',
					value: 1,
					hint: '优先查看驾驶舱'
				},
				{
					key: 'learning',
					label: '可见专区',
					value: 1,
					hint: '以后端 persona 为准'
				},
				{
					key: 'meeting',
					label: '可用页面',
					value: 1,
					hint: '仅展示当前可用入口'
				},
				{
					key: 'risk',
					label: '运行提醒',
					value: 0,
					hint: '无待处理写入动作'
				}
			]
		},
		sections: [
			createSection({
				key: 'pending',
				title: '当前入口',
				description: '分析视角只保留当前 persona 可见的只读分析入口。',
				tip: '分析优先',
				cards: [
					{
						id: 'analysis-pending-dashboard',
						title: '绩效驾驶舱',
						description: '查看绩效汇总、跨模块观察点和分析摘要。',
						badge: '只读分析',
						tone: 'primary',
						count: 1,
						countLabel: '个核心入口',
						statusText: '当前 persona 不承接写入动作',
						path: '/data-center/dashboard',
						tags: ['分析', '汇总'],
						metrics: [
							{ label: '当前模式', value: '只读' },
							{ label: '入口页面', value: '绩效驾驶舱' }
						]
					}
				]
			}),
			createSection({
				key: 'shortcuts',
				title: '快捷入口',
				description: '保留分析视角的最小导航集。',
				tip: '只读路径',
				cards: [
					{
						id: 'analysis-shortcut-dashboard',
						title: '进入驾驶舱',
						description: '直接跳转到汇总分析页查看最新结果。',
						badge: '汇总',
						tone: 'info',
						path: '/data-center/dashboard',
						statusText: '由后端事实源控制入口可见性',
						tags: ['统一事实源']
					}
				]
			})
		]
	};
}

export function buildWorkbenchTemplateSnapshot(
	templateKey: WorkbenchTemplateKey,
	input: WorkbenchRoleInput
): WorkbenchSnapshot {
	const normalizedInput = normalizeInput(input);

	if (templateKey === 'hr') {
		return buildHrSnapshot(normalizedInput);
	}

	if (templateKey === 'manager') {
		return buildManagerSnapshot(normalizedInput);
	}

	if (templateKey === 'analysis') {
		return buildAnalysisSnapshot(normalizedInput);
	}

	return buildStaffSnapshot(normalizedInput);
}
