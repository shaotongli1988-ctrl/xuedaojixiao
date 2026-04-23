<!-- 文件职责：统一承接固定资产领用归还与物资入库/领用入口；不负责各自接口细节；依赖资产领用基页与物资作业页面；维护重点是作业入口统一后旧物资路由仍保持兼容。 -->
<template>
	<div class="asset-unified-page">
		<el-card shadow="never">
			<div class="asset-unified-page__hero">
				<div>
					<div class="asset-unified-page__eyebrow">采购&资产 / 统一入口</div>
					<h2>资产作业</h2>
					<p>固定资产领用归还、物资入库和物资领用统一从这里处理，物资不再单独占左栏菜单。</p>
				</div>
				<el-alert
					title="旧的物资入库、物资领用地址仍可访问，但会自动跳回当前统一入口。"
					type="info"
					:closable="false"
					show-icon
				/>
			</div>
		</el-card>

		<div class="asset-unified-page__overview">
			<el-card shadow="never">
				<div class="asset-unified-page__overview-card">
					<div class="asset-unified-page__overview-label">作业边界</div>
					<div class="asset-unified-page__overview-title">所有领用和入库动作都从这里处理</div>
					<p>固定资产领用归还、物资入库、物资领用统一归到资产作业，不再拆成多张左栏页面。</p>
				</div>
			</el-card>
			<el-card shadow="never">
				<div class="asset-unified-page__overview-card">
					<div class="asset-unified-page__overview-label">固定资产</div>
					<div class="asset-unified-page__overview-title">关注单件资产的领用、归还和丢失</div>
					<p>适合电脑、投影仪等单件资产，围绕资产编号和领用责任人流转。</p>
				</div>
			</el-card>
			<el-card shadow="never">
				<div class="asset-unified-page__overview-card">
					<div class="asset-unified-page__overview-label">物资</div>
					<div class="asset-unified-page__overview-title">关注批量入库和数量领用</div>
					<p>适合耗材和通用物资，先入库形成库存，再按数量领用并回写库存。</p>
				</div>
			</el-card>
		</div>

		<el-card shadow="never">
			<div class="asset-unified-page__flow-head">
				<div>
					<h3>采购&资产主链路</h3>
					<p>从采购转资产开始，经过台账沉淀、作业执行，再进入分析复盘。点击任一步可直接跳转。</p>
				</div>
				<el-tag type="warning" effect="plain">当前阶段：作业</el-tag>
			</div>
			<div class="asset-unified-page__flow">
				<button
					v-for="step in flowSteps"
					:key="step.key"
					type="button"
					class="asset-unified-page__flow-step"
					:class="{ 'is-active': step.active }"
					@click="goFlowStep(step)"
				>
					<div class="asset-unified-page__flow-index">{{ step.index }}</div>
					<div class="asset-unified-page__flow-body">
						<div class="asset-unified-page__flow-title">{{ step.title }}</div>
						<div class="asset-unified-page__flow-desc">{{ step.description }}</div>
						<div class="asset-unified-page__flow-link">{{ step.actionText }}</div>
					</div>
				</button>
			</div>
			<div class="asset-unified-page__focus">
				<span class="asset-unified-page__focus-label">当前作业视图</span>
				<el-tag effect="plain" type="warning">{{ currentViewMeta.label }}</el-tag>
				<span class="asset-unified-page__focus-text">{{ currentViewMeta.description }}</span>
			</div>
		</el-card>

		<el-card shadow="never">
			<div class="asset-unified-page__tab-head">
				<div>
					<h3>作业视图</h3>
					<p>按作业类型处理。固定资产走单件流转，物资走数量流转。</p>
				</div>
			</div>
			<el-tabs :model-value="activeTab" @update:model-value="handleTabChange">
				<el-tab-pane label="固定资产领用归还" name="asset" />
				<el-tab-pane label="物资入库" name="materialInbound" />
				<el-tab-pane label="物资领用" name="materialIssue" />
			</el-tabs>
		</el-card>

		<AssetAssignmentBase v-if="activeTab === 'asset'" />
		<MaterialInboundPage v-else-if="activeTab === 'materialInbound'" />
		<MaterialIssuePage v-else />
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AssetAssignmentBase from './assignment-base.vue';
import MaterialInboundPage from '../material/inbound.vue';
import MaterialIssuePage from '../material/issue.vue';

type OperationUnifiedTab = 'asset' | 'materialInbound' | 'materialIssue';

const route = useRoute();
const router = useRouter();

type FlowStep = {
	key: string;
	index: string;
	title: string;
	description: string;
	actionText: string;
	active: boolean;
	path: string;
	query?: Record<string, string>;
};

const activeTab = computed<OperationUnifiedTab>(() => {
	const value = String(route.query.operationView || 'asset');
	if (['asset', 'materialInbound', 'materialIssue'].includes(value)) {
		return value as OperationUnifiedTab;
	}
	return 'asset';
});

const currentViewMeta = computed(() => {
	if (activeTab.value === 'materialInbound') {
		return {
			label: '物资入库',
			description: '处理批量入库、提交和确认入库，库存会在确认后回写。'
		};
	}

	if (activeTab.value === 'materialIssue') {
		return {
			label: '物资领用',
			description: '处理物资数量领用、提交和确认领用，库存会同步扣减。'
		};
	}

	return {
		label: '固定资产领用归还',
		description: '处理固定资产单件领用、归还和丢失标记。'
	};
});

const flowSteps = computed<FlowStep[]>(() => [
	{
		key: 'procurement',
		index: '01',
		title: '采购转资产',
		description: '采购完成后转为正式资产记录，作为后续台账沉淀起点。',
		actionText: '进入采购转资产',
		active: false,
		path: '/performance/asset/procurement'
	},
	{
		key: 'ledger',
		index: '02',
		title: '资产台账',
		description: '沉淀固定资产和物资主数据，并在物资侧查看库存状态。',
		actionText: '回到资产台账',
		active: false,
		path: '/performance/asset/ledger'
	},
	{
		key: 'operation',
		index: '03',
		title: '资产作业',
		description: '执行固定资产领用归还、物资入库和物资领用等作业动作。',
		actionText: '当前所在阶段',
		active: true,
		path: '/performance/asset/assignment',
		query: {
			operationView: activeTab.value
		}
	},
	{
		key: 'analysis',
		index: '04',
		title: '资产分析',
		description: '查看资产总览、资产报表和折旧分析，做经营复盘。',
		actionText: '进入资产分析',
		active: false,
		path: '/performance/asset/dashboard'
	}
]);

function handleTabChange(value: string | number) {
	router.replace({
		path: route.path,
		query: {
			...route.query,
			operationView: String(value)
		}
	});
}

function goFlowStep(step: FlowStep) {
	router.push({
		path: step.path,
		query: step.query
	});
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.flow-entry.scss' as flowEntry;

.asset-unified-page {
	--flow-entry-accent: var(--app-accent-warm);
	--flow-entry-accent-soft: var(--app-accent-warm-soft);
	--flow-entry-accent-text: var(--app-accent-warm-text);
	--flow-entry-step-bg: var(--app-surface-warm-muted);
	--flow-entry-step-active-bg:
		color-mix(in srgb, var(--app-accent-warm-soft) 58%, var(--app-surface-card));

	@include flowEntry.flow-entry-page;
}
</style>
