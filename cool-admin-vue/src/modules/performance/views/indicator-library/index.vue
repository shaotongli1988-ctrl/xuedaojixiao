<!-- 文件职责：承接指标库页面的筛选、列表、详情和 CRUD 弹窗；不负责共享鉴权、菜单装配和评估单/环评对指标的引用联动；依赖指标服务、权限工具和 Element Plus 组件；维护重点是权限显隐、请求路径和枚举口径必须与事实源一致。 -->
<template>
	<div v-if="canAccess" class="indicator-page">
		<el-card shadow="never">
			<div class="indicator-page__toolbar">
				<div class="indicator-page__filters">
					<el-input
						v-model="filters.keyword"
						placeholder="按指标名称或编码筛选"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filters.category"
						placeholder="指标类型"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in categoryOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filters.status"
						placeholder="启停状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in indicatorStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="indicator-page__actions">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建指标
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="indicator-page__header">
					<div>
						<h2>指标库</h2>
						<p>HR 维护绩效评分项的统一配置来源</p>
					</div>
					<el-tag effect="plain">模块 4</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="name" label="指标名称" min-width="160" />
				<el-table-column prop="code" label="指标编码" min-width="150" />
				<el-table-column prop="category" label="指标类型" min-width="120">
					<template #default="{ row }">
						{{ categoryLabel(row.category) }}
					</template>
				</el-table-column>
				<el-table-column prop="weight" label="权重" min-width="100">
					<template #default="{ row }">
						{{ Number(row.weight || 0).toFixed(2) }}
					</template>
				</el-table-column>
				<el-table-column prop="scoreScale" label="满分" min-width="90" />
				<el-table-column prop="applyScope" label="适用范围" min-width="120">
					<template #default="{ row }">
						{{ applyScopeLabel(row.applyScope) }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" min-width="100">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">
							{{ statusLabel(row.status) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column
					prop="description"
					label="说明"
					min-width="220"
					show-overflow-tooltip
				/>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="210">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)"
							>详情</el-button
						>
						<el-button v-if="showEditButton" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="showDeleteButton"
							text
							type="danger"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="indicator-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pagination.page"
					:page-size="pagination.size"
					:total="pagination.total"
					@current-change="changePage"
				/>
			</div>
		</el-card>

		<el-dialog
			v-model="formVisible"
			:title="editingIndicator?.id ? '编辑指标' : '新建指标'"
			width="720px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="指标名称" prop="name">
							<el-input v-model="form.name" maxlength="100" show-word-limit />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="指标编码" prop="code">
							<el-input v-model="form.code" maxlength="50" show-word-limit />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="指标类型" prop="category">
							<el-select v-model="form.category" style="width: 100%">
								<el-option
									v-for="item in categoryOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="适用范围" prop="applyScope">
							<el-select v-model="form.applyScope" style="width: 100%">
								<el-option
									v-for="item in indicatorApplyScopeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="权重" prop="weight">
							<el-input-number
								v-model="form.weight"
								:min="0"
								:precision="2"
								:step="1"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="满分" prop="scoreScale">
							<el-input-number
								v-model="form.scoreScale"
								:min="1"
								:precision="0"
								:step="10"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="状态" prop="status">
							<el-radio-group v-model="form.status">
								<el-radio
									v-for="item in indicatorStatusOptions"
									:key="item.value"
									:value="item.value"
								>
									{{ item.label }}
								</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
				</el-row>

				<el-form-item label="说明">
					<el-input
						v-model="form.description"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="请输入指标说明"
					/>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="detailVisible" title="指标详情" width="680px" destroy-on-close>
			<el-descriptions v-if="detailIndicator" :column="2" border>
				<el-descriptions-item label="指标名称">
					{{ detailIndicator.name }}
				</el-descriptions-item>
				<el-descriptions-item label="指标编码">
					{{ detailIndicator.code }}
				</el-descriptions-item>
				<el-descriptions-item label="指标类型">
					{{ categoryLabel(detailIndicator.category) }}
				</el-descriptions-item>
				<el-descriptions-item label="适用范围">
					{{ applyScopeLabel(detailIndicator.applyScope) }}
				</el-descriptions-item>
				<el-descriptions-item label="权重">
					{{ Number(detailIndicator.weight || 0).toFixed(2) }}
				</el-descriptions-item>
				<el-descriptions-item label="满分">
					{{ detailIndicator.scoreScale }}
				</el-descriptions-item>
				<el-descriptions-item label="状态">
					{{ statusLabel(detailIndicator.status) }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ detailIndicator.updateTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="说明" :span="2">
					{{ detailIndicator.description || '-' }}
				</el-descriptions-item>
			</el-descriptions>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-indicator-library'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { useListPage } from '../../composables/use-list-page.js';
import { confirmElementAction, runTrackedElementAction } from '../shared/action-feedback';
import { resolveErrorMessage, showElementErrorFromError } from '../shared/error-message';
import {
	type IndicatorApplyScope,
	type IndicatorCategory,
	type IndicatorRecord,
	type IndicatorStatus,
	createEmptyIndicator
} from '../../types';
import { performanceIndicatorService } from '../../service/indicator';

const INDICATOR_CATEGORY_DICT_KEY = 'performance.indicator.category';
const INDICATOR_STATUS_DICT_KEY = 'performance.indicator.status';
const INDICATOR_APPLY_SCOPE_DICT_KEY = 'performance.indicator.applyScope';

const { dict } = useDict();
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingIndicator = ref<IndicatorRecord | null>(null);
const detailIndicator = ref<IndicatorRecord | null>(null);
const formRef = ref<FormInstance>();

const form = reactive<IndicatorRecord>(createEmptyIndicator());

const rules = {
	name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
	code: [{ required: true, message: '请输入指标编码', trigger: 'blur' }],
	category: [{ required: true, message: '请选择指标类型', trigger: 'change' }],
	applyScope: [{ required: true, message: '请选择适用范围', trigger: 'change' }],
	weight: [{ required: true, message: '请输入权重', trigger: 'change' }],
	scoreScale: [{ required: true, message: '请输入满分', trigger: 'change' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const categoryOptions = computed<Array<{ label: string; value: IndicatorCategory }>>(() =>
	dict.get(INDICATOR_CATEGORY_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as IndicatorCategory
	}))
);

const indicatorApplyScopeOptions = computed<Array<{ label: string; value: IndicatorApplyScope }>>(
	() =>
		dict.get(INDICATOR_APPLY_SCOPE_DICT_KEY).value.map(item => ({
			label: item.label,
			value: item.value as IndicatorApplyScope
		}))
);

const indicatorStatusOptions = computed<Array<{ label: string; value: number }>>(() =>
	dict.get(INDICATOR_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: Number(item.value)
	}))
);

const canAccess = computed(() => checkPerm(performanceIndicatorService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceIndicatorService.permission.info));
const showAddButton = computed(() => checkPerm(performanceIndicatorService.permission.add));
const showEditButton = computed(() => checkPerm(performanceIndicatorService.permission.update));
const showDeleteButton = computed(() => checkPerm(performanceIndicatorService.permission.delete));
const indicatorList = useListPage({
	createFilters: () => ({
		keyword: '',
		category: '' as IndicatorCategory | '',
		status: '' as IndicatorStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params =>
		performanceIndicatorService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			category: params.category || undefined,
			status: params.status === '' ? undefined : params.status
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '指标列表加载失败');
	}
});
const rows = indicatorList.rows;
const tableLoading = indicatorList.loading;
const filters = indicatorList.filters;
const pagination = indicatorList.pager;

onMounted(async () => {
	await dict.refresh([
		INDICATOR_CATEGORY_DICT_KEY,
		INDICATOR_STATUS_DICT_KEY,
		INDICATOR_APPLY_SCOPE_DICT_KEY
	]);
	await refresh();
});

async function refresh() {
	await indicatorList.reload();
}

function changePage(page: number) {
	void indicatorList.goToPage(page);
}

function handleSearch() {
	void indicatorList.search();
}

function handleReset() {
	void indicatorList.reset();
}

function openCreate() {
	Object.assign(form, createEmptyIndicator());
	editingIndicator.value = null;
	formVisible.value = true;
}

async function openEdit(row: IndicatorRecord) {
	const detail = await fetchDetail(row.id!);

	if (!detail) {
		return;
	}

	editingIndicator.value = detail;
	Object.assign(form, createEmptyIndicator(), detail);
	formVisible.value = true;
}

async function openDetail(row: IndicatorRecord) {
	const detail = await fetchDetail(row.id!);

	if (!detail) {
		return;
	}

	detailIndicator.value = detail;
	detailVisible.value = true;
}

async function fetchDetail(id: number) {
	try {
		return await performanceIndicatorService.fetchInfo({ id });
	} catch (error: unknown) {
		showElementErrorFromError(error, '指标详情加载失败');
		return null;
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (form.weight < 0) {
		ElMessage.error('权重必须大于等于 0');
		return;
	}

	if (form.scoreScale <= 0) {
		ElMessage.error('满分必须大于 0');
		return;
	}

	submitLoading.value = true;

	try {
		if (editingIndicator.value?.id) {
			await performanceIndicatorService.updateIndicator({
				...form,
				id: editingIndicator.value.id
			});
		} else {
			await performanceIndicatorService.createIndicator(form);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '指标保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: IndicatorRecord) {
	const confirmed = await confirmElementAction(`确认删除指标「${row.name}」吗？`, '删除确认');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: Number(row.id || 0),
		actionType: 'delete',
		request: () => performanceIndicatorService.removeIndicator({ ids: [row.id!] }),
		successMessage: '删除成功',
		errorMessage: '指标删除失败',
		onSuccess: () => {
			if (rows.value.length === 1 && pagination.page > 1) {
				pagination.page -= 1;
			}
		},
		refresh
	});
}

function categoryLabel(category: IndicatorCategory) {
	return dict.getLabel(INDICATOR_CATEGORY_DICT_KEY, category) || category;
}

function applyScopeLabel(scope: IndicatorApplyScope) {
	return dict.getLabel(INDICATOR_APPLY_SCOPE_DICT_KEY, scope) || scope;
}

function statusLabel(status: number) {
	return dict.getLabel(INDICATOR_STATUS_DICT_KEY, status) || String(status ?? '-');
}

function statusTagType(status: number) {
	return dict.getMeta(INDICATOR_STATUS_DICT_KEY, status)?.tone || 'info';
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.indicator-page {
	@include managementWorkspace.management-workspace-shell(1040px);
}
</style>
