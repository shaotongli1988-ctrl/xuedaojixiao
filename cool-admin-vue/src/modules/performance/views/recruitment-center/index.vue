<!-- 文件职责：承接招聘中心运行态最小入口导航，统一分发到招聘计划、职位标准、简历池、面试、人才资产和录用六个既有页面；不负责聚合写入、审批流、跨主题联动或数据汇总；依赖 Vue Router 与现有 Element Plus 组件；维护重点是入口路径、备案制说明和“仅导航不写入”的边界必须保持一致。 -->
<template>
	<div class="recruitment-center-page">
		<el-card shadow="never" class="recruitment-center-page__hero">
			<div class="recruitment-center-page__hero-main">
				<div>
					<div class="recruitment-center-page__eyebrow">绩效管理 / 招聘中心</div>
					<h2 class="recruitment-center-page__title">招聘中心入口页</h2>
					<p class="recruitment-center-page__description">
						当前页面只负责运行态导航分发，帮助从招聘中心进入既有业务页；不是超级写入页，保持备案制，不做审批流。
					</p>
				</div>

				<el-tag effect="plain" type="success">最小运行态页面</el-tag>
			</div>

			<el-alert
				title="请从下方入口卡片进入对应业务页面。新增、编辑、导入、导出和状态操作仍在各自页面内完成，本页不承接聚合写入。"
				type="info"
				:closable="false"
				show-icon
			/>
		</el-card>

		<el-row :gutter="16" class="recruitment-center-page__grid">
			<el-col
				v-for="entry in entries"
				:key="entry.path"
				:xs="24"
				:sm="12"
				:lg="8"
			>
				<el-card shadow="never" class="recruitment-center-page__card">
					<div class="recruitment-center-page__card-head">
						<div>
							<div class="recruitment-center-page__card-title">{{ entry.title }}</div>
							<div class="recruitment-center-page__card-topic">{{ entry.topic }}</div>
						</div>
						<el-tag effect="plain" type="info">{{ entry.tag }}</el-tag>
					</div>

					<div class="recruitment-center-page__card-description">
						{{ entry.description }}
					</div>

					<div class="recruitment-center-page__card-foot">
						<span>{{ entry.note }}</span>
						<el-button type="primary" plain @click="goToEntry(entry.path)">
							进入页面
						</el-button>
					</div>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-recruitment-center'
});

import { useRouter } from 'vue-router';

type RecruitmentEntry = {
	title: string;
	topic: string;
	tag: string;
	description: string;
	note: string;
	path: string;
};

const router = useRouter();

const entries: RecruitmentEntry[] = [
	{
		title: '招聘计划',
		topic: '主题 16',
		tag: '计划',
		description: '查看和维护招聘计划主链，处理 draft、active、closed、voided 状态动作。',
		note: '备案制执行，不引入审批流。',
		path: '/performance/recruit-plan'
	},
	{
		title: '职位标准',
		topic: '主题 17',
		tag: '标准',
		description: '进入职位标准管理，查看岗位画像、任职要求、技能标签和模板摘要。',
		note: '仅跳转到既有标准页。',
		path: '/performance/job-standard'
	},
	{
		title: '简历池',
		topic: '主题 15',
		tag: '简历',
		description: '进入招聘简历池，承接简历录入、导入导出、附件和后续转化动作。',
		note: '本页不直接处理附件或导出。',
		path: '/performance/resumePool'
	},
	{
		title: '面试管理',
		topic: '主题 8',
		tag: '面试',
		description: '进入面试页面，查看候选人、面试官、时间、类型和状态摘要。',
		note: '不在导航页发起面试写入。',
		path: '/performance/interview'
	},
	{
		title: '人才资产',
		topic: '主题 12',
		tag: '资产',
		description: '进入人才资产页面，查看候选人沉淀、跟进摘要和后续面试入口。',
		note: '入口页只做分发，不聚合编辑。',
		path: '/performance/talentAsset'
	},
	{
		title: '录用管理',
		topic: '主题 18',
		tag: '录用',
		description: '进入录用管理，处理 offered、accepted、rejected、closed 等状态。',
		note: '录用动作继续在业务页执行。',
		path: '/performance/hiring'
	}
];

async function goToEntry(path: string) {
	await router.push({ path });
}
</script>

<style lang="scss" scoped>
.recruitment-center-page {
	--recruitment-hero-bg: var(--el-bg-color);
	--recruitment-hero-border: var(--el-border-color-light);
	--recruitment-eyebrow-color: var(--el-text-color-secondary);
	--recruitment-title-color: var(--el-text-color-primary);
	--recruitment-description-color: var(--el-text-color-regular);
	--recruitment-card-bg: var(--el-bg-color-overlay);
	--recruitment-card-border-hover: var(--el-color-primary-light-7);
	--recruitment-card-shadow: 0 10px 24px rgba(31, 35, 41, 0.08);
	--recruitment-card-title-color: var(--el-text-color-primary);
	--recruitment-card-topic-color: var(--el-text-color-secondary);
	--recruitment-card-description-color: var(--el-text-color-regular);
	--recruitment-card-foot-color: var(--el-text-color-secondary);

	display: flex;
	flex-direction: column;
	gap: 16px;

	&__hero {
		border-radius: 12px;
		border: 1px solid var(--recruitment-hero-border);
		background: var(--recruitment-hero-bg);
	}

	&__hero-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
	}

	&__eyebrow {
		font-size: 13px;
		color: var(--recruitment-eyebrow-color);
		margin-bottom: 8px;
	}

	&__title {
		margin: 0 0 8px;
		font-size: 28px;
		line-height: 1.2;
		color: var(--recruitment-title-color);
	}

	&__description {
		margin: 0;
		max-width: 720px;
		line-height: 1.7;
		color: var(--recruitment-description-color);
	}

	&__grid {
		margin-bottom: 8px;
	}

	&__card {
		height: 100%;
		border-radius: 12px;
		background: var(--recruitment-card-bg);
		transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

		&:hover {
			transform: translateY(-2px);
			border-color: var(--recruitment-card-border-hover);
			box-shadow: var(--recruitment-card-shadow);
		}
	}

	&__card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}

	&__card-title {
		font-size: 18px;
		font-weight: 600;
		line-height: 1.4;
		color: var(--recruitment-card-title-color);
	}

	&__card-topic {
		margin-top: 4px;
		font-size: 13px;
		color: var(--recruitment-card-topic-color);
	}

	&__card-description {
		min-height: 66px;
		line-height: 1.7;
		color: var(--recruitment-card-description-color);
	}

	&__card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 20px;
		font-size: 13px;
		color: var(--recruitment-card-foot-color);
	}
}

:global(html.dark .recruitment-center-page) {
	--recruitment-hero-bg:
		radial-gradient(circle at top right, rgba(79, 137, 255, 0.12), transparent 34%),
		linear-gradient(135deg, rgba(24, 31, 46, 0.96) 0%, rgba(19, 24, 36, 0.98) 100%);
	--recruitment-hero-border: rgba(103, 126, 176, 0.24);
	--recruitment-eyebrow-color: #95a5c6;
	--recruitment-title-color: #eef3ff;
	--recruitment-description-color: #b5c0d4;
	--recruitment-card-bg: linear-gradient(180deg, rgba(28, 35, 50, 0.95) 0%, rgba(20, 26, 39, 0.98) 100%);
	--recruitment-card-border-hover: rgba(117, 160, 255, 0.5);
	--recruitment-card-shadow: 0 12px 28px rgba(5, 8, 15, 0.36);
	--recruitment-card-title-color: #e8eefc;
	--recruitment-card-topic-color: #95a5c6;
	--recruitment-card-description-color: #b9c4d8;
	--recruitment-card-foot-color: #95a5c6;
}

@media (max-width: 767px) {
	.recruitment-center-page {
		&__hero-main,
		&__card-foot {
			flex-direction: column;
			align-items: stretch;
		}

		&__title {
			font-size: 24px;
		}
	}
}
</style>
