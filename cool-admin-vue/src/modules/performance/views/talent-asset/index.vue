<!-- 文件职责：承接主题12招聘人才资产增强的列表、详情、新增、编辑和删除主链；不负责后端权限裁剪、面试自动转化、简历全文下载或联系方式导出；依赖 talentAsset service 与基础部门接口；维护重点是字段边界、权限显隐和删除/归档状态约束必须与冻结包一致。 -->
<template>
	<div v-if="canAccess" class="talent-asset-page">
		<el-card shadow="never">
			<div class="talent-asset-page__toolbar">
				<div class="talent-asset-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="姓名/目标岗位关键词"
						clearable
						style="width: 220px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filters.targetDepartmentId"
						placeholder="目标部门"
						clearable
						filterable
						style="width: 220px"
					>
						<el-option
							v-for="item in departmentOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
					<el-input
						v-model="filters.source"
						placeholder="来源摘要"
						clearable
						style="width: 180px"
						@keyup.enter="handleSearch"
					/>
					<el-input
						v-model="filters.tag"
						placeholder="标签关键词"
						clearable
						style="width: 180px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="talent-asset-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建人才资产
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="talent-asset-page__header">
					<div class="talent-asset-page__header-main">
						<h2>招聘人才资产</h2>
						<el-tag effect="plain">主题 12</el-tag>
					</div>
					<el-alert
						title="仅展示冻结允许的摘要字段，不展示手机号、邮箱、简历全文或附件。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="candidateName" label="候选人" min-width="140" />
				<el-table-column prop="code" label="编码" min-width="140">
					<template #default="{ row }">
						{{ row.code || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="目标部门" min-width="160">
					<template #default="{ row }">
						{{ row.targetDepartmentName || departmentLabel(row.targetDepartmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="targetPosition" label="目标岗位" min-width="140">
					<template #default="{ row }">
						{{ row.targetPosition || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="source" label="来源摘要" min-width="150" show-overflow-tooltip />
				<el-table-column label="标签" min-width="180" show-overflow-tooltip>
					<template #default="{ row }">
						{{ renderTagList(row.tagList) }}
					</template>
				</el-table-column>
				<el-table-column prop="followUpSummary" label="跟进摘要" min-width="220" show-overflow-tooltip>
					<template #default="{ row }">
						{{ row.followUpSummary || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="nextFollowUpDate" label="下次跟进日期" min-width="130">
					<template #default="{ row }">
						{{ row.nextFollowUpDate || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="220">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canDelete(row)"
							text
							type="danger"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="talent-asset-page__pagination">
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
			v-model="detailVisible"
			title="人才资产详情"
			width="760px"
			destroy-on-close
		>
			<div v-if="detailTalentAsset" class="talent-asset-page__detail">
				<el-alert
					v-if="detailTalentAsset.status === 'archived'"
					title="当前记录已归档，不允许继续编辑或删除。"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="候选人">
						{{ detailTalentAsset.candidateName }}
					</el-descriptions-item>
					<el-descriptions-item label="编码">
						{{ detailTalentAsset.code || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="目标部门">
						{{ detailTalentAsset.targetDepartmentName || departmentLabel(detailTalentAsset.targetDepartmentId) }}
					</el-descriptions-item>
					<el-descriptions-item label="目标岗位">
						{{ detailTalentAsset.targetPosition || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源摘要">
						{{ detailTalentAsset.source || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="标签">
						{{ renderTagList(detailTalentAsset.tagList) }}
					</el-descriptions-item>
					<el-descriptions-item label="下次跟进日期">
						{{ detailTalentAsset.nextFollowUpDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="跟进摘要" :span="2">
						{{ detailTalentAsset.followUpSummary || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailTalentAsset.status)">
							{{ statusLabel(detailTalentAsset.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailTalentAsset.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailTalentAsset.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingTalentAsset?.id ? '编辑人才资产' : '新建人才资产'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingTalentAsset?.id ? '归档后不可再编辑；删除只允许 HR 对 new 状态执行。' : '新建保存后默认进入 new 状态。'"
					:type="editingTalentAsset?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="候选人姓名" prop="candidateName">
							<el-input
								v-model="form.candidateName"
								maxlength="100"
								show-word-limit
								placeholder="请输入候选人姓名"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="编码">
							<el-input
								v-model="form.code"
								maxlength="100"
								show-word-limit
								placeholder="可选，非空时需唯一"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标部门" prop="targetDepartmentId">
							<el-select
								v-model="form.targetDepartmentId"
								placeholder="请选择目标部门"
								filterable
								style="width: 100%"
							>
								<el-option
									v-for="item in departmentOptions"
									:key="item.id"
									:label="item.label"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标岗位">
							<el-input
								v-model="form.targetPosition"
								maxlength="100"
								show-word-limit
								placeholder="可选"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源摘要" prop="source">
							<el-input
								v-model="form.source"
								maxlength="100"
								show-word-limit
								placeholder="请输入来源摘要"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="标签">
							<el-select
								v-model="form.tagList"
								multiple
								filterable
								allow-create
								default-first-option
								placeholder="输入后回车，支持多个标签"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="跟进摘要">
							<el-input
								v-model="form.followUpSummary"
								type="textarea"
								:rows="4"
								maxlength="500"
								show-word-limit
								placeholder="请输入跟进摘要"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="下次跟进日期">
							<el-date-picker
								v-model="nextFollowUpDateModel"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col v-if="editingTalentAsset?.id" :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" style="width: 100%">
								<el-option
									v-for="item in editableStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
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
	name: 'performance-talent-asset'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import {
	type TalentAssetRecord,
	type TalentAssetStatus,
	createEmptyTalentAsset
} from '../../types';
import { performanceTalentAssetService } from '../../service/talent-asset';

interface DepartmentOption {
	id: number;
	label: string;
}

const rows = ref<TalentAssetRecord[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingTalentAsset = ref<TalentAssetRecord | null>(null);
const detailTalentAsset = ref<TalentAssetRecord | null>(null);
const formRef = ref<FormInstance>();

const filters = reactive({
	keyword: '',
	targetDepartmentId: undefined as number | undefined,
	source: '',
	tag: '',
	status: '' as TalentAssetStatus | ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<TalentAssetRecord>(createEmptyTalentAsset());

const rules: FormRules = {
	candidateName: [
		{ required: true, message: '请输入候选人姓名', trigger: 'blur' },
		{ min: 1, max: 100, message: '候选人姓名长度需在 1-100 之间', trigger: 'blur' }
	],
	targetDepartmentId: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
	source: [
		{ required: true, message: '请输入来源摘要', trigger: 'blur' },
		{ min: 1, max: 100, message: '来源摘要长度需在 1-100 之间', trigger: 'blur' }
	],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const statusOptions: Array<{ label: string; value: TalentAssetStatus }> = [
	{ label: '新建', value: 'new' },
	{ label: '跟进中', value: 'tracking' },
	{ label: '已归档', value: 'archived' }
];

const canAccess = computed(() => checkPerm(performanceTalentAssetService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceTalentAssetService.permission.info));
const showAddButton = computed(() => checkPerm(performanceTalentAssetService.permission.add));
const nextFollowUpDateModel = computed<string | undefined>({
	get: () => form.nextFollowUpDate || undefined,
	set: value => {
		form.nextFollowUpDate = value;
	}
});
const editableStatusOptions = computed(() => {
	if (!editingTalentAsset.value?.id) {
		return statusOptions.filter(item => item.value === 'new');
	}

	if (editingTalentAsset.value.status === 'tracking') {
		return statusOptions.filter(item => ['tracking', 'archived'].includes(item.value));
	}

	return statusOptions;
});

onMounted(async () => {
	await loadDepartments();
	await refresh();
});

async function loadDepartments() {
	try {
		const result = await service.base.sys.department.list();
		departmentOptions.value = flattenDepartments(result || []);
	} catch (error: any) {
		departmentOptions.value = [];
		ElMessage.warning(error.message || '部门选项加载失败');
	}
}

function handleSearch() {
	pagination.page = 1;
	refresh();
}

function handleReset() {
	filters.keyword = '';
	filters.targetDepartmentId = undefined;
	filters.source = '';
	filters.tag = '';
	filters.status = '';
	pagination.page = 1;
	refresh();
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceTalentAssetService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: toOptionalText(filters.keyword),
			targetDepartmentId: filters.targetDepartmentId || undefined,
			source: toOptionalText(filters.source),
			tag: toOptionalText(filters.tag),
			status: filters.status || undefined
		});

		rows.value = (result.list || []).map(item => ({
			...item,
			tagList: normalizeTagList(item.tagList)
		}));
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '人才资产列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	Object.assign(form, createEmptyTalentAsset());
	editingTalentAsset.value = null;
	formVisible.value = true;
}

async function openEdit(row: TalentAssetRecord) {
	if (row.status === 'archived') {
		ElMessage.warning('归档记录不允许编辑');
		return;
	}

	await loadDetail(row.id!, record => {
		if (record.status === 'archived') {
			ElMessage.warning('归档记录不允许编辑');
			return;
		}

		editingTalentAsset.value = record;
		Object.assign(form, createEmptyTalentAsset(), {
			...record,
			targetDepartmentId: record.targetDepartmentId ?? undefined,
			tagList: normalizeTagList(record.tagList),
			targetPosition: record.targetPosition || '',
			followUpSummary: record.followUpSummary || '',
			nextFollowUpDate: record.nextFollowUpDate || '',
			status: record.status || 'new'
		});
		formVisible.value = true;
	});
}

async function openDetail(row: TalentAssetRecord) {
	await loadDetail(row.id!, record => {
		detailTalentAsset.value = {
			...record,
			tagList: normalizeTagList(record.tagList)
		};
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: TalentAssetRecord) => void) {
	try {
		const record = await performanceTalentAssetService.fetchInfo({ id });
		next({
			...record,
			tagList: normalizeTagList(record.tagList)
		});
	} catch (error: any) {
		ElMessage.error(error.message || '人才资产详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (editingTalentAsset.value?.status === 'archived') {
		ElMessage.error('归档记录不允许编辑');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: Partial<TalentAssetRecord> = {
			candidateName: form.candidateName.trim(),
			code: toOptionalText(form.code),
			targetDepartmentId: form.targetDepartmentId,
			targetPosition: toOptionalText(form.targetPosition),
			source: form.source.trim(),
			tagList: normalizeTagList(form.tagList),
			followUpSummary: toOptionalText(form.followUpSummary),
			nextFollowUpDate: form.nextFollowUpDate || undefined,
			status: editingTalentAsset.value?.id ? form.status || 'new' : 'new'
		};

		if (editingTalentAsset.value?.id) {
			await performanceTalentAssetService.updateTalentAsset({
				id: editingTalentAsset.value.id,
				...payload
			});
		} else {
			await performanceTalentAssetService.createTalentAsset(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: TalentAssetRecord) {
	if (row.status !== 'new') {
		ElMessage.warning('仅 new 状态允许删除');
		return;
	}

	await ElMessageBox.confirm(`确认删除人才资产「${row.candidateName}」吗？`, '删除确认', {
		type: 'warning'
	});

	try {
		await performanceTalentAssetService.removeTalentAsset({
			ids: [row.id!]
		});
		ElMessage.success('删除成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '删除失败');
	}
}

function canEdit(row: TalentAssetRecord) {
	return checkPerm(performanceTalentAssetService.permission.update) && row.status !== 'archived';
}

function canDelete(row: TalentAssetRecord) {
	return checkPerm(performanceTalentAssetService.permission.delete) && row.status === 'new';
}

function statusLabel(status?: TalentAssetStatus | '') {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: TalentAssetStatus | '') {
	switch (status) {
		case 'tracking':
			return 'warning';
		case 'archived':
			return 'info';
		default:
			return 'success';
	}
}

function renderTagList(tagList?: string[]) {
	if (!tagList?.length) {
		return '-';
	}

	return tagList.join('、');
}

function departmentLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function toOptionalText(value?: string | null) {
	const text = String(value || '').trim();
	return text ? text : undefined;
}

function normalizeTagList(tagList?: string[]) {
	if (!Array.isArray(tagList)) {
		return [];
	}

	return Array.from(
		new Set(
			tagList
				.map(item => String(item || '').trim())
				.filter(Boolean)
		)
	);
}

function flattenDepartments(list: any[], result: DepartmentOption[] = []) {
	for (const item of list) {
		result.push({
			id: Number(item.id),
			label: item.name
		});

		if (item.children?.length) {
			flattenDepartments(item.children, result);
		}
	}

	return result;
}
</script>

<style lang="scss" scoped>
.talent-asset-page {
	display: grid;
	gap: 16px;

	&__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}

	&__toolbar-left,
	&__toolbar-right {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	&__header {
		display: grid;
		gap: 12px;
	}

	&__header-main {
		display: flex;
		align-items: center;
		gap: 12px;

		h2 {
			margin: 0;
			font-size: 18px;
		}
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}

	&__detail {
		display: grid;
		gap: 16px;
	}
}
</style>
