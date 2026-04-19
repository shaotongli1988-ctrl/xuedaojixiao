<!-- 文件职责：承接主题19班主任化首页看板的聚合卡片、分布摘要和只读提示；不负责资源明细下钻、复杂图表联动或跨主题跳转；依赖 teacherDashboard service 与主题19冻结状态工具；维护重点是页面只展示 summary 聚合数据，不扩展冻结外指标。 -->
<template>
	<div v-if="canAccess" class="teacher-channel-dashboard-page">
		<el-card shadow="never">
			<div class="teacher-channel-dashboard-page__hero">
				<div>
					<div class="teacher-channel-dashboard-page__eyebrow">班主任化 / 主题 19</div>
					<h2>班主任渠道合作看板</h2>
					<p>当前页面只消费 `/admin/performance/teacherDashboard/summary` 聚合结果。</p>
				</div>

				<div class="teacher-channel-dashboard-page__hero-actions">
					<el-tag effect="plain" :type="isReadOnlyRole ? 'info' : 'success'">
						{{ isReadOnlyRole ? '只读账号' : '可执行写动作' }}
					</el-tag>
					<el-button type="primary" :loading="loading" @click="refresh"
						>刷新看板</el-button
					>
				</div>
			</div>

			<el-alert
				:title="
					isReadOnlyRole
						? '当前账号无主题19任何写权限，仅查看授权范围内聚合摘要。'
						: '看板只展示聚合卡片、待跟进摘要和分布统计，不提供复杂钻取。'
				"
				:type="isReadOnlyRole ? 'info' : 'success'"
				:closable="false"
				show-icon
			/>
		</el-card>

		<el-alert
			v-if="pageError"
			class="teacher-channel-dashboard-page__error"
			type="warning"
			:title="pageError"
			:closable="false"
			show-icon
		/>

		<el-row :gutter="16">
			<el-col v-for="item in summaryCards" :key="item.key" :xs="24" :sm="12" :lg="6">
				<el-card
					shadow="never"
					class="teacher-channel-dashboard-page__metric-card"
					v-loading="loading"
				>
					<div class="teacher-channel-dashboard-page__metric-label">{{ item.label }}</div>
					<div class="teacher-channel-dashboard-page__metric-value">{{ item.value }}</div>
					<div class="teacher-channel-dashboard-page__metric-tip">{{ item.tip }}</div>
				</el-card>
			</el-col>
		</el-row>

		<el-row :gutter="16">
			<el-col :xs="24" :lg="12">
				<el-card shadow="never" v-loading="loading">
					<template #header>
						<div class="teacher-channel-dashboard-page__section-header">
							<span>待跟进摘要</span>
							<el-tag effect="plain" type="warning">today / overdue</el-tag>
						</div>
					</template>

					<div class="teacher-channel-dashboard-page__todo-grid">
						<article class="teacher-channel-dashboard-page__todo-item">
							<div class="teacher-channel-dashboard-page__todo-label">今日待跟进</div>
							<div class="teacher-channel-dashboard-page__todo-value">
								{{ summary.pendingFollowCount ?? 0 }}
							</div>
						</article>
						<article class="teacher-channel-dashboard-page__todo-item">
							<div class="teacher-channel-dashboard-page__todo-label">
								已逾期待跟进
							</div>
							<div
								class="teacher-channel-dashboard-page__todo-value teacher-channel-dashboard-page__todo-value--danger"
							>
								{{ summary.overdueFollowCount ?? 0 }}
							</div>
						</article>
					</div>
				</el-card>
			</el-col>

			<el-col :xs="24" :lg="12">
				<el-card shadow="never" v-loading="loading">
					<template #header>
						<div class="teacher-channel-dashboard-page__section-header">
							<span>合作 / 班级摘要</span>
							<el-tag effect="plain" type="info">冻结字段范围</el-tag>
						</div>
					</template>

					<el-empty
						v-if="!distributionItems.length && !loading"
						description="当前范围内暂无分布摘要"
					/>

					<div v-else class="teacher-channel-dashboard-page__distribution">
						<article
							v-for="(item, index) in distributionItems"
							:key="`${item.key || item.status || item.label || item.name || index}`"
							class="teacher-channel-dashboard-page__distribution-item"
						>
							<div>
								<div class="teacher-channel-dashboard-page__distribution-label">
									{{ distributionLabel(item) }}
								</div>
								<div class="teacher-channel-dashboard-page__distribution-meta">
									{{ distributionValue(item) }}
								</div>
							</div>
							<el-progress
								:percentage="distributionPercent(item)"
								:show-text="false"
								:stroke-width="10"
							/>
						</article>
					</div>
				</el-card>
			</el-col>
		</el-row>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-teacher-channel-dashboard'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { performanceTeacherDashboardService } from '../../service/teacherDashboard';
import type { TeacherDashboardDistributionItem, TeacherDashboardSummary } from '../../types';
import {
	hasTeacherWritePermission,
	resolveDistributionItems
} from '../../utils/teacher-channel.js';
import { performanceTeacherClassService } from '../../service/teacherClass';
import { performanceTeacherCooperationService } from '../../service/teacherCooperation';
import { performanceTeacherFollowService } from '../../service/teacherFollow';
import { performanceTeacherInfoService } from '../../service/teacherInfo';

const loading = ref(false);
const pageError = ref('');
const summary = reactive<TeacherDashboardSummary>({
	resourceTotal: 0,
	pendingFollowCount: 0,
	overdueFollowCount: 0,
	partneredCount: 0,
	classCount: 0,
	memberDistribution: []
});

const permissionState = {
	teacherAdd: checkPerm(performanceTeacherInfoService.permission.add),
	teacherUpdate: checkPerm(performanceTeacherInfoService.permission.update),
	teacherAssign: checkPerm(performanceTeacherInfoService.permission.assign),
	teacherUpdateStatus: checkPerm(performanceTeacherInfoService.permission.updateStatus),
	followAdd: checkPerm(performanceTeacherFollowService.permission.add),
	cooperationMark: checkPerm(performanceTeacherCooperationService.permission.mark),
	classAdd: checkPerm(performanceTeacherClassService.permission.add),
	classUpdate: checkPerm(performanceTeacherClassService.permission.update),
	classDelete: checkPerm(performanceTeacherClassService.permission.delete)
};

const canAccess = computed(() => checkPerm(performanceTeacherDashboardService.permission.summary));
const isReadOnlyRole = computed(() => !hasTeacherWritePermission(permissionState));

const summaryCards = computed(() => [
	{
		key: 'resourceTotal',
		label: '班主任资源总数',
		value: summary.resourceTotal ?? 0,
		tip: '授权范围内资源总量'
	},
	{
		key: 'pendingFollowCount',
		label: '今日待跟进',
		value: summary.pendingFollowCount ?? 0,
		tip: 'today 派生桶'
	},
	{
		key: 'overdueFollowCount',
		label: '已逾期待跟进',
		value: summary.overdueFollowCount ?? 0,
		tip: 'overdue 派生桶'
	},
	{
		key: 'partneredCount',
		label: '已合作资源',
		value: summary.partneredCount ?? 0,
		tip: `班级数 ${summary.classCount ?? 0}`
	}
]);

const distributionItems = computed(() => resolveDistributionItems(summary));

onMounted(() => {
	refresh();
});

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	loading.value = true;
	pageError.value = '';

	try {
		const result = await performanceTeacherDashboardService.fetchSummary();
		Object.assign(summary, {
			resourceTotal: 0,
			pendingFollowCount: 0,
			overdueFollowCount: 0,
			partneredCount: 0,
			classCount: 0,
			memberDistribution: [],
			cooperationDistribution: [],
			classStatusDistribution: [],
			...result
		});
	} catch (error: any) {
		pageError.value = error.message || '班主任看板加载失败';
		ElMessage.error(pageError.value);
	} finally {
		loading.value = false;
	}
}

function distributionLabel(item: TeacherDashboardDistributionItem) {
	return item.label || item.name || item.status || '未命名项';
}

function distributionValue(item: TeacherDashboardDistributionItem) {
	return Number(item.count ?? item.value ?? 0);
}

function distributionPercent(item: TeacherDashboardDistributionItem) {
	const currentValue = Math.max(Number(item.count ?? item.value ?? 0), 0);
	const total = distributionItems.value.reduce((sum, current) => {
		return sum + Math.max(Number(current.count ?? current.value ?? 0), 0);
	}, 0);

	if (!total) {
		return 0;
	}

	return Math.min(Math.round((currentValue / total) * 100), 100);
}
</script>

<style lang="scss" scoped>
.teacher-channel-dashboard-page {
	display: grid;
	gap: 16px;

	&__hero,
	&__hero-actions,
	&__section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	&__eyebrow {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h2 {
		margin: 4px 0 8px;
		font-size: 22px;
	}

	p {
		margin: 0;
		color: var(--el-text-color-secondary);
	}

	&__error {
		margin-top: -4px;
	}

	&__metric-card,
	&__todo-item {
		min-height: 132px;
	}

	&__metric-card {
		display: grid;
		gap: 8px;
	}

	&__metric-label,
	&__todo-label {
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}

	&__metric-value,
	&__todo-value {
		font-size: 34px;
		font-weight: 700;
		line-height: 1;
	}

	&__metric-tip {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__todo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
	}

	&__todo-item,
	&__distribution-item {
		border: 1px solid var(--el-border-color-light);
		border-radius: 12px;
		padding: 16px;
		background: var(--el-fill-color-lighter);
	}

	&__todo-item {
		display: grid;
		align-content: space-between;
	}

	&__todo-value--danger {
		color: var(--el-color-danger);
	}

	&__distribution {
		display: grid;
		gap: 12px;
	}

	&__distribution-item {
		display: grid;
		gap: 12px;
	}

	&__distribution-label {
		font-weight: 600;
	}

	&__distribution-meta {
		color: var(--el-text-color-secondary);
		font-size: 13px;
		margin-top: 4px;
	}
}
</style>
