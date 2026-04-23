<!-- 文件职责：统一承接资产台账与物资台账/库存入口；不负责资产或物资各自的接口细节；依赖资产台账基页与物资页面；维护重点是“物资不再占独立左栏入口，但旧链接仍能落到正确 tab”。 -->
<template>
	<div class="asset-unified-page">
		<el-card shadow="never">
			<div class="asset-unified-page__hero">
				<div>
					<div class="asset-unified-page__eyebrow">采购&资产 / 统一入口</div>
					<h2>资产台账</h2>
					<p>
						固定资产与物资台账统一从这里进入，物资作为资产分类的一部分承接，不再单独占左栏菜单。
					</p>
				</div>
				<el-alert
					title="旧的物资台账、物资库存地址仍可访问，但会自动跳回当前统一入口。"
					type="info"
					:closable="false"
					show-icon
				/>
			</div>
		</el-card>

		<div class="asset-unified-page__overview">
			<el-card shadow="never">
				<div class="asset-unified-page__overview-card">
					<div class="asset-unified-page__overview-label">域模型</div>
					<div class="asset-unified-page__overview-title">
						物资属于采购&资产域内的资产分类
					</div>
					<p>固定资产与物资共享同一资产入口，不再拆成左栏并列模块。</p>
				</div>
			</el-card>
			<el-card shadow="never">
				<div class="asset-unified-page__overview-card">
					<div class="asset-unified-page__overview-label">台账入口</div>
					<div class="asset-unified-page__overview-title">先看主数据，再看库存状态</div>
					<p>物资目录维护物资主数据，物资库存查看部门维度在库、可用和已领用数量。</p>
				</div>
			</el-card>
			<el-card shadow="never">
				<div class="asset-unified-page__overview-card">
					<div class="asset-unified-page__overview-label">上下游关系</div>
					<div class="asset-unified-page__overview-title">
						采购入库后沉淀台账，再进入资产作业
					</div>
					<p>采购转资产承接固定资产入账；物资入库、物资领用统一在资产作业处理。</p>
				</div>
			</el-card>
		</div>

		<el-card shadow="never">
			<div class="asset-unified-page__flow-head">
				<div>
					<h3>采购&资产主链路</h3>
					<p>
						从采购转资产开始，经过台账沉淀、作业执行，再进入分析复盘。点击任一步可直接跳转。
					</p>
				</div>
				<el-tag type="success" effect="plain">当前阶段：台账</el-tag>
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
				<span class="asset-unified-page__focus-label">当前台账视图</span>
				<el-tag effect="plain" type="primary">{{ currentViewMeta.label }}</el-tag>
				<span class="asset-unified-page__focus-text">{{
					currentViewMeta.description
				}}</span>
			</div>
		</el-card>

		<el-card shadow="never">
			<div class="asset-unified-page__tab-head">
				<div>
					<h3>台账视图</h3>
					<p>按资产类型查看。固定资产看资产台账，物资看目录与库存。</p>
				</div>
			</div>
			<el-tabs :model-value="activeTab" @update:model-value="handleTabChange">
				<el-tab-pane label="固定资产台账" name="asset" />
				<el-tab-pane label="物资目录" name="materialCatalog" />
				<el-tab-pane label="物资库存" name="materialStock" />
			</el-tabs>
		</el-card>

		<asset-ledger-base v-if="activeTab === 'asset'" />
		<material-catalog-page v-else-if="activeTab === 'materialCatalog'" />
		<material-stock-page v-else />
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AssetLedgerBase from './ledger-base.vue';
import MaterialCatalogPage from '../material/catalog.vue';
import MaterialStockPage from '../material/stock.vue';

type LedgerUnifiedTab = 'asset' | 'materialCatalog' | 'materialStock';

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

const activeTab = computed<LedgerUnifiedTab>(() => {
	const value = String(route.query.assetView || 'asset');
	if (['asset', 'materialCatalog', 'materialStock'].includes(value)) {
		return value as LedgerUnifiedTab;
	}
	return 'asset';
});

const currentViewMeta = computed(() => {
	if (activeTab.value === 'materialCatalog') {
		return {
			label: '物资目录',
			description: '维护物资主数据、分类、单位和安全库存。'
		};
	}

	if (activeTab.value === 'materialStock') {
		return {
			label: '物资库存',
			description: '查看部门维度库存、可用数量和已领用数量。'
		};
	}

	return {
		label: '固定资产台账',
		description: '维护固定资产编号、状态、责任人和采购信息。'
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
		actionText: '当前所在阶段',
		active: true,
		path: '/performance/asset/ledger',
		query: {
			assetView: activeTab.value
		}
	},
	{
		key: 'operation',
		index: '03',
		title: '资产作业',
		description: '执行固定资产领用归还、物资入库和物资领用等作业动作。',
		actionText: '进入资产作业',
		active: false,
		path: '/performance/asset/assignment'
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
			assetView: String(value)
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
	--flow-entry-accent: var(--app-accent-brand);
	--flow-entry-accent-soft: var(--app-accent-brand-soft);
	--flow-entry-accent-text: var(--app-accent-brand);
	--flow-entry-step-bg: var(--app-surface-primary);
	--flow-entry-step-active-bg: color-mix(
		in srgb,
		var(--app-accent-brand-soft) 56%,
		var(--app-surface-card)
	);

	@include flowEntry.flow-entry-page;
}
</style>
