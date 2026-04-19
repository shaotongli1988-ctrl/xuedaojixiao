<!-- 文件职责：承接主题20资产报表页面；不负责 BI 看板、外部导出模板或财务总账分析；依赖 asset-report service、共享金额格式化和通用资产 CRUD 页面壳；维护重点是 summary/page/export 三个冻结接口必须全部有入口。 -->
<template>
	<div class="asset-report-page">
		<AssetCrudPage
			title="资产报表"
			description="查看资产原值、净值、报废状态和月度折旧，支持导出。"
			notice="报表导出首批只做资产侧导出，不进入财务总账或税务分析。"
			page-permission="performance:assetReport:page"
			:columns="columns"
			:filters="filters"
			:create-filters="createFilters"
			:fetch-page="performanceAssetReportService.fetchPage.bind(performanceAssetReportService)"
			:toolbar-actions="toolbarActions"
		/>
		<el-card shadow="never" v-loading="loading">
			<template #header>报表汇总</template>
			<div class="asset-report-page__summary">
				<el-tag effect="plain">资产数 {{ summary.assetCount }}</el-tag>
				<el-tag effect="plain">原值 {{ formatMoney(summary.totalOriginalAmount) }}</el-tag>
				<el-tag effect="plain">净值 {{ formatMoney(summary.totalNetValue) }}</el-tag>
				<el-tag effect="plain">已领用 {{ summary.assignedCount }}</el-tag>
				<el-tag effect="plain">维护中 {{ summary.maintenanceCount }}</el-tag>
				<el-tag effect="plain">已报废 {{ summary.scrappedCount }}</el-tag>
			</div>
		</el-card>
	</div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { export_json_to_excel } from '/@/plugins/excel/utils';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetReportService } from '../../service/asset-report';
import {
	assetStatusTagMap,
	disposalStatusTagMap,
	enumOptions,
	formatMoney
} from './shared';

const columns = [
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'assetName', label: '资产名称', minWidth: 180 },
	{ prop: 'category', label: '分类', minWidth: 120 },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'assetStatus', label: '资产状态', minWidth: 120, tagMap: assetStatusTagMap },
	{ prop: 'originalAmount', label: '原值', minWidth: 120, formatter: formatMoney },
	{ prop: 'netValue', label: '净值', minWidth: 120, formatter: formatMoney }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '资产编号 / 名称' },
	{ prop: 'category', label: '分类', type: 'text' },
	{ prop: 'assetStatus', label: '状态', type: 'select', options: enumOptions(assetStatusTagMap) },
	{ prop: 'reportDate', label: '报表月份', type: 'month' }
];

const summary = reactive({
	assetCount: 0,
	totalOriginalAmount: 0,
	totalNetValue: 0,
	assignedCount: 0,
	maintenanceCount: 0,
	scrappedCount: 0
});
const loading = ref(false);

const toolbarActions = [
	{
		key: 'export',
		label: '导出',
		permission: 'performance:assetReport:export',
		handler: async (context: { filters?: Record<string, any> }) => {
			const filters = normalizeFilters(context?.filters || createFilters());
			const response = await performanceAssetReportService.exportReport(filters);
			const exportedList = extractList(response);

			if (exportedList) {
				downloadExportAsExcel(exportedList, filters.reportDate);
				return;
			}

			const fallback = await performanceAssetReportService.fetchPage({
				...filters,
				page: 1,
				size: 10000
			});

			downloadExportAsExcel(fallback?.list || [], filters.reportDate);
		}
	}
];

function createFilters() {
	return {
		keyword: '',
		category: '',
		assetStatus: '',
		reportDate: new Date().toISOString().slice(0, 7)
	};
}

async function loadSummary() {
	loading.value = true;
	try {
		const result = await performanceAssetReportService.fetchSummary({
			reportDate: createFilters().reportDate
		});
		Object.assign(summary, result || {});
	} catch (error: any) {
		ElMessage.error(error?.message || '报表汇总加载失败');
	} finally {
		loading.value = false;
	}
}

loadSummary();

function normalizeFilters(raw: Record<string, any>) {
	return {
		keyword: raw.keyword || undefined,
		category: raw.category || undefined,
		assetStatus: raw.assetStatus || undefined,
		reportDate: raw.reportDate || undefined
	};
}

function extractList(response: any) {
	if (Array.isArray(response)) {
		return response;
	}

	if (Array.isArray(response?.list)) {
		return response.list;
	}

	if (Array.isArray(response?.data)) {
		return response.data;
	}

	return null;
}

function downloadExportAsExcel(list: any[], reportDate?: string) {
		export_json_to_excel({
		header: [
			'报表月份',
			'资产编号',
			'资产名称',
			'分类',
			'所属部门',
			'资产状态',
			'原值',
			'净值',
			'月折旧',
			'报废状态',
			'备注'
		],
		data: (list || []).map(item => [
			item.reportDate || reportDate || '',
			item.assetNo || '',
			item.assetName || '',
			item.category || '',
			item.departmentName || '',
			assetStatusTagMap[item.assetStatus as keyof typeof assetStatusTagMap]?.label || item.assetStatus || '',
			Number(item.originalAmount || 0).toFixed(2),
			Number(item.netValue || 0).toFixed(2),
			Number(item.monthlyDepreciation || 0).toFixed(2),
			disposalStatusTagMap[item.disposalStatus as keyof typeof disposalStatusTagMap]?.label ||
				item.disposalStatus ||
				'',
			item.remark || ''
		]),
		filename: `资产报表_${reportDate || new Date().toISOString().slice(0, 7)}_${Date.now()}`,
		autoWidth: true
	});

	ElMessage.success('导出成功');
}
</script>

<style lang="scss" scoped>
.asset-report-page {
	display: grid;
	gap: 16px;

	&__summary {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
}
</style>
