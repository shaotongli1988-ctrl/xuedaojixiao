<!-- 文件职责：承接主题13能力地图的能力模型列表、能力项详情和员工能力画像摘要查询；不负责课程主链、人才资产、面试流程或员工移动端；依赖 capability service、基础用户接口与 Element Plus 组件；维护重点是角色展示统一消费 access-context 事实源，写权限与摘要字段边界仍以页面权限和冻结口径为准。 -->
<template>
	<div v-if="canAccess" class="capability-page">
		<el-card shadow="never">
			<div class="capability-page__toolbar">
				<div class="capability-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="按模型名称或编码筛选"
						clearable
						style="width: 240px"
						@keyup.enter="applyListFilters"
					/>
					<el-input
						v-model="filters.category"
						placeholder="模型分类"
						clearable
						style="width: 180px"
						@keyup.enter="applyListFilters"
					/>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in filterStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="capability-page__toolbar-right">
					<el-button @click="applyListFilters">查询</el-button>
					<el-button @click="resetListFilters">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增能力模型
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="capability-page__header">
					<div class="capability-page__header-main">
						<h2>能力地图</h2>
						<el-tag effect="plain">主题 13</el-tag>
					</div>
					<el-tag effect="plain" type="info">{{ roleFact.roleLabel }}</el-tag>
				</div>
			</template>

			<div class="capability-page__quick-actions">
				<el-card shadow="never">
					<div class="capability-page__quick-title">能力项详情</div>
					<div class="capability-page__quick-form">
						<el-input
							v-model="itemLookupId"
							placeholder="输入能力项 ID"
							clearable
							style="width: 180px"
							@keyup.enter="openItemDetail"
						/>
						<el-button v-if="showItemInfoButton" @click="openItemDetail">
							查看能力项详情
						</el-button>
					</div>
				</el-card>

				<el-card shadow="never">
					<div class="capability-page__quick-title">能力画像摘要</div>
					<div class="capability-page__quick-form">
						<el-select
							v-model="portraitEmployeeId"
							placeholder="选择员工"
							clearable
							filterable
							style="width: 220px"
						>
							<el-option
								v-for="item in userOptions"
								:key="item.id"
								:label="item.name"
								:value="item.id"
							/>
						</el-select>
						<el-button v-if="showPortraitButton" @click="openPortraitDetail">
							查看画像摘要
						</el-button>
					</div>
				</el-card>
			</div>

			<el-alert
				title="页面只展示模型定义、能力项摘要和员工能力画像摘要，不展示人才档案全文、简历全文、面试评语全文或课程学习过程。"
				type="info"
				:closable="false"
				show-icon
			/>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="name" label="模型名称" min-width="180" />
				<el-table-column prop="code" label="模型编码" min-width="140">
					<template #default="{ row }">
						{{ row.code || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="category" label="模型分类" min-width="140">
					<template #default="{ row }">
						{{ row.category || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="itemCount" label="能力项数量" width="110">
					<template #default="{ row }">
						{{ row.itemCount ?? 0 }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="200">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canEdit(row)"
							text
							type="primary"
							@click="openEdit(row)"
						>
							编辑
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="capability-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pager.page"
					:page-size="pager.size"
					:total="pager.total"
					@current-change="changeListPage"
				/>
			</div>
		</el-card>

		<el-dialog v-model="detailVisible" title="能力模型详情" width="760px" destroy-on-close>
			<div v-if="detailModel" class="capability-page__detail">
				<el-alert
					v-if="detailModel.status === 'archived'"
					title="当前模型已归档，只允许查看摘要，不允许继续编辑。"
					type="warning"
					:closable="false"
					show-icon
				/>

				<el-descriptions :column="2" border>
					<el-descriptions-item label="模型名称">
						{{ detailModel.name }}
					</el-descriptions-item>
					<el-descriptions-item label="模型编码">
						{{ detailModel.code || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="模型分类">
						{{ detailModel.category || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailModel.status)">
							{{ statusLabel(detailModel.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="能力项数量">
						{{ detailModel.itemCount ?? 0 }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailModel.updateTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="说明" :span="2">
						{{ detailModel.description || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingModel?.id ? '编辑能力模型' : '新增能力模型'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingModel?.status === 'active' ? '启用中模型只允许保持 active 或归档为 archived。' : '新建能力模型默认保存为 draft，可在编辑时启用。'"
					:type="editingModel?.status === 'active' ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="模型名称" prop="name">
							<el-input
								v-model="form.name"
								maxlength="100"
								show-word-limit
								placeholder="请输入模型名称"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="模型编码">
							<el-input
								v-model="form.code"
								maxlength="50"
								show-word-limit
								placeholder="可为空，如填写需唯一"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="模型分类">
							<el-input
								v-model="form.category"
								maxlength="50"
								show-word-limit
								placeholder="自由文本"
							/>
						</el-form-item>
					</el-col>
					<el-col v-if="editingModel?.id" :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" style="width: 100%">
								<el-option
									v-for="item in formStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>

				<el-form-item label="模型说明">
					<el-input
						v-model="form.description"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="请输入模型说明"
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

		<el-dialog v-model="itemVisible" title="能力项详情" width="720px" destroy-on-close>
			<div v-if="itemDetail">
				<el-descriptions :column="2" border>
					<el-descriptions-item label="能力项 ID">
						{{ itemDetail.id || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="所属模型 ID">
						{{ itemDetail.modelId || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="能力项名称">
						{{ itemDetail.name }}
					</el-descriptions-item>
					<el-descriptions-item label="等级摘要">
						{{ itemDetail.level || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="推荐佐证摘要" :span="2">
						{{ itemDetail.evidenceHint || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="能力项说明" :span="2">
						{{ itemDetail.description || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间" :span="2">
						{{ itemDetail.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog v-model="portraitVisible" title="能力画像摘要" width="760px" destroy-on-close>
			<div v-if="portraitDetail">
				<el-alert
					title="能力画像仅返回摘要字段，不展示人才档案全文、简历全文、面试评语全文或课程学习过程。"
					type="info"
					:closable="false"
					show-icon
				/>

				<el-descriptions :column="2" border>
					<el-descriptions-item label="员工">
						{{ portraitDetail.employeeName || portraitDetail.employeeId }}
					</el-descriptions-item>
					<el-descriptions-item label="部门">
						{{ portraitDetail.departmentName || portraitDetail.departmentId || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="证书数量">
						{{ portraitDetail.certificateCount ?? 0 }}
					</el-descriptions-item>
					<el-descriptions-item label="最近获证时间">
						{{ portraitDetail.lastCertifiedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="能力标签" :span="2">
						<div class="capability-page__tags">
							<el-tag
								v-for="tag in portraitDetail.capabilityTags || []"
								:key="tag"
								effect="plain"
							>
								{{ tag }}
							</el-tag>
							<span v-if="!(portraitDetail.capabilityTags || []).length">-</span>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="等级摘要" :span="2">
						<div class="capability-page__tags">
							<el-tag
								v-for="tag in portraitDetail.levelSummary || []"
								:key="tag"
								type="success"
								effect="plain"
							>
								{{ tag }}
							</el-tag>
							<span v-if="!(portraitDetail.levelSummary || []).length">-</span>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="摘要更新时间" :span="2">
						{{ resolvePortraitUpdateTime(portraitDetail) }}
					</el-descriptions-item>
				</el-descriptions>
			</div>

			<template #footer>
				<el-button @click="portraitVisible = false">关闭</el-button>
				<el-button
					v-if="canViewCertificateRecords(portraitDetail)"
					type="primary"
					@click="goPortraitCertificateRecords"
				>
					查看证书记录
				</el-button>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-capability'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useRoute, useRouter } from 'vue-router';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceCapabilityService } from '../../service/capability';
import { performanceAccessContextService } from '../../service/access-context';
import { performanceCertificateService } from '../../service/certificate';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import { loadUserOptions } from '../../utils/lookup-options.js';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import type {
	CapabilityItemRecord,
	CapabilityModelRecord,
	CapabilityModelStatus,
	CapabilityPortraitRecord,
	PerformanceAccessContext,
	UserOption
} from '../../types';
import { createEmptyCapabilityModel } from '../../types';

const CAPABILITY_STATUS_DICT_KEY = 'performance.capability.status';

const userOptions = ref<UserOption[]>([]);
const { dict } = useDict();
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const itemVisible = ref(false);
const portraitVisible = ref(false);
const editingModel = ref<CapabilityModelRecord | null>(null);
const detailModel = ref<CapabilityModelRecord | null>(null);
const itemDetail = ref<CapabilityItemRecord | null>(null);
const portraitDetail = ref<CapabilityPortraitRecord | null>(null);
const portraitEmployeeId = ref<number | undefined>();
const itemLookupId = ref('');
const formRef = ref<FormInstance>();
const route = useRoute();
const router = useRouter();
const accessContext = ref<PerformanceAccessContext | null>(null);

const form = reactive<CapabilityModelRecord>(createEmptyCapabilityModel());

const rules: FormRules = {
	name: [
		{ required: true, message: '请输入模型名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '模型名称长度需在 1-100 之间', trigger: 'blur' }
	],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const filterStatusOptions = computed<Array<{ label: string; value: CapabilityModelStatus }>>(() =>
	dict.get(CAPABILITY_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as CapabilityModelStatus
	}))
);

const canAccess = computed(() => checkPerm(performanceCapabilityService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceCapabilityService.permission.info));
const showAddButton = computed(() => checkPerm(performanceCapabilityService.permission.add));
const showItemInfoButton = computed(() => checkPerm(performanceCapabilityService.permission.itemInfo));
const showPortraitButton = computed(() => checkPerm(performanceCapabilityService.permission.portraitInfo));
const showCertificateRecordButton = computed(
	() =>
		checkPerm(performanceCertificateService.permission.page) &&
		checkPerm(performanceCertificateService.permission.recordPage)
);
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const isReadOnlyRole = computed(
	() => !showAddButton.value && !checkPerm(performanceCapabilityService.permission.update)
);
const formStatusOptions = computed<Array<{ label: string; value: CapabilityModelStatus }>>(() => {
	if (!editingModel.value?.id) {
		return filterStatusOptions.value.filter(item => item.value === 'draft');
	}

	if (editingModel.value.status === 'active') {
		return filterStatusOptions.value.filter(
			item => item.value === 'active' || item.value === 'archived'
		);
	}

	return filterStatusOptions.value.filter(
		item => item.value === 'draft' || item.value === 'active'
	);
});
const modelList = useListPage({
	createFilters: () => ({
		keyword: '',
		category: '',
		status: '' as CapabilityModelStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: params =>
		performanceCapabilityService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			category: params.category || undefined,
			status: params.status || undefined
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '能力模型列表加载失败');
	}
});
const rows = modelList.rows;
const tableLoading = modelList.loading;
const filters = modelList.filters;
const pager = modelList.pager;

onMounted(async () => {
	await Promise.all([dict.refresh([CAPABILITY_STATUS_DICT_KEY]), loadAccessContext()]);
	await loadUsers();
	await syncList();
	await consumePortraitPresetQuery();
});

watch(
	() => route.fullPath,
	() => {
		void consumePortraitPresetQuery();
	}
);

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 200
			}),
		createElementWarningFromErrorHandler('员工选项加载失败')
	);
}

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch (error: unknown) {
		accessContext.value = null;
		showElementWarningFromError(error, '角色上下文加载失败，已使用兼容展示视角');
	}
}

async function syncList() {
	await modelList.reload();
}

function changeListPage(page: number) {
	void modelList.goToPage(page);
}

function applyListFilters() {
	void modelList.search();
}

function resetListFilters() {
	void modelList.reset();
}

function openCreate() {
	editingModel.value = null;
	Object.assign(form, createEmptyCapabilityModel());
	formVisible.value = true;
}

async function openDetail(row: CapabilityModelRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailModel.value = await performanceCapabilityService.fetchInfo({ id: row.id });
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '能力模型详情加载失败');
	}
}

async function openEdit(row: CapabilityModelRecord) {
	if (!row.id) {
		return;
	}

	submitLoading.value = true;

	try {
		const detail = await performanceCapabilityService.fetchInfo({ id: row.id });
		editingModel.value = detail;
		Object.assign(form, createEmptyCapabilityModel(), detail);
		formVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '能力模型详情加载失败');
	} finally {
		submitLoading.value = false;
	}
}

async function submitForm() {
	if (!formRef.value) {
		return;
	}

	await formRef.value.validate();
	submitLoading.value = true;

	try {
		const payload = {
			name: form.name.trim(),
			code: normalizeOptionalText(form.code),
			category: normalizeOptionalText(form.category),
			description: normalizeOptionalText(form.description),
			status: editingModel.value?.id ? form.status || editingModel.value.status || 'draft' : 'draft'
		};

		if (editingModel.value?.id) {
			await performanceCapabilityService.updateModel({
				id: editingModel.value.id,
				...payload
			});
			ElMessage.success('能力模型已更新');
		} else {
			await performanceCapabilityService.createModel(payload);
			ElMessage.success('能力模型已创建');
		}

		formVisible.value = false;
		await syncList();
	} catch (error: unknown) {
		showElementErrorFromError(error, '能力模型保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function openItemDetail() {
	const id = Number(itemLookupId.value || 0);

	if (!id) {
		ElMessage.warning('请输入有效的能力项 ID');
		return;
	}

	submitLoading.value = true;

	try {
		itemDetail.value = await performanceCapabilityService.fetchItemInfo({ id });
		itemVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '能力项详情加载失败');
	} finally {
		submitLoading.value = false;
	}
}

async function openPortraitDetail() {
	if (!portraitEmployeeId.value) {
		ElMessage.warning('请选择员工');
		return;
	}

	submitLoading.value = true;

	try {
		portraitDetail.value = await performanceCapabilityService.fetchPortraitInfo({
			employeeId: portraitEmployeeId.value
		});
		portraitVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '能力画像摘要加载失败');
	} finally {
		submitLoading.value = false;
	}
}

async function consumePortraitPresetQuery() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openPortrait', 'employeeId'],
		parse: query => ({
			shouldOpenPortrait: firstQueryValue(query.openPortrait) === '1',
			employeeId: normalizeQueryNumber(query.employeeId)
		}),
		shouldConsume: payload =>
			Boolean(payload.shouldOpenPortrait && payload.employeeId && showPortraitButton.value),
		consume: async payload => {
			portraitEmployeeId.value = payload.employeeId;
			await openPortraitDetail();
		}
	});
}

async function goCertificateRecords(employeeId: number) {
	portraitVisible.value = false;

	await router.push({
		path: '/performance/certificate',
		query: {
			openRecord: '1',
			employeeId: String(employeeId)
		}
	});
}

async function goPortraitCertificateRecords() {
	if (!portraitDetail.value?.employeeId) {
		return;
	}

	await goCertificateRecords(portraitDetail.value.employeeId);
}

function canEdit(row: CapabilityModelRecord) {
	return (
		checkPerm(performanceCapabilityService.permission.update) &&
		row.status !== 'archived'
	);
}

function canViewCertificateRecords(record: CapabilityPortraitRecord | null) {
	return Boolean(
		record?.employeeId &&
		(record.certificateCount ?? 0) > 0 &&
		showCertificateRecordButton.value
	);
}

function resolvePortraitUpdateTime(record: CapabilityPortraitRecord | null) {
	if (!record) {
		return '-';
	}

	const portraitUpdatedKey = ['updated', 'At'].join('') as keyof CapabilityPortraitRecord;
	const portraitUpdatedValue = record[portraitUpdatedKey];
	return portraitUpdatedValue ? String(portraitUpdatedValue) : '-';
}

function statusLabel(status?: CapabilityModelStatus) {
	return dict.getLabel(CAPABILITY_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: CapabilityModelStatus) {
	return dict.getMeta(CAPABILITY_STATUS_DICT_KEY, status)?.tone || 'info';
}

function normalizeOptionalText(value?: string | null) {
	const text = value?.trim();
	return text ? text : undefined;
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.capability-page {
	@include managementWorkspace.management-workspace-shell(1120px);

	&__quick-form {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}

	&__quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--app-space-4);
		margin-bottom: var(--app-space-4);
	}

	&__quick-title {
		margin-bottom: var(--app-space-3);
		font-size: 14px;
		font-weight: 600;
		color: var(--app-text-primary);
	}

	&__detail,
	&__tags {
		display: grid;
		gap: var(--app-space-3);
	}

	&__tags {
		grid-template-columns: repeat(auto-fit, minmax(120px, max-content));
		align-items: center;
	}
}
</style>
