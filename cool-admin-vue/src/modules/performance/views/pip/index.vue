<!-- 文件职责：承接 PIP 模块的筛选、列表、创建编辑、启动、完成关闭与详情跟进主链；不负责评估模块原有流程或其他绩效子模块；依赖 PIP/assessment service、基础用户数据和跟进抽屉组件；维护重点是两条创建路径、按钮显隐和状态流转必须与后端状态机保持一致。 -->
<template>
	<div v-if="canAccess" class="pip-page">
		<el-card shadow="never">
			<div class="pip-page__toolbar">
				<div class="pip-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="按标题或原因筛选"
						clearable
						style="width: 220px"
					/>
					<el-select
						v-model="filters.employeeId"
						placeholder="员工"
						clearable
						filterable
						style="width: 180px"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filters.ownerId"
						placeholder="负责人"
						clearable
						filterable
						style="width: 180px"
					>
						<el-option
							v-for="item in userOptions"
							:key="`owner-${item.id}`"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
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

				<div class="pip-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建 PIP
					</el-button>
					<el-button v-if="showExportButton" @click="handleExport">导出摘要</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="pip-page__stat-label">当前页总数</div>
					<div class="pip-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="pip-page__stat-label">草稿</div>
					<div class="pip-page__stat-value">
						{{ rows.filter(item => item.status === 'draft').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="pip-page__stat-label">进行中</div>
					<div class="pip-page__stat-value">
						{{ rows.filter(item => item.status === 'active').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="pip-page__stat-label">已完成/关闭</div>
					<div class="pip-page__stat-value">
						{{ rows.filter(item => ['completed', 'closed'].includes(item.status || '')).length }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="pip-page__header">
					<div class="pip-page__header-main">
						<h2>PIP 追踪</h2>
						<el-tag effect="plain">模块 6</el-tag>
					</div>
					<div class="pip-page__header-tags">
						<el-tag v-if="presetAssessmentId" type="warning" effect="plain">
							已带入评估单 #{{ presetAssessmentId }}
						</el-tag>
						<el-tag v-if="presetSuggestionId" type="primary" effect="plain">
							来自建议 #{{ presetSuggestionId }}
						</el-tag>
					</div>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="employeeName" label="员工" min-width="120" />
				<el-table-column prop="ownerName" label="负责人" min-width="120" />
				<el-table-column prop="title" label="标题" min-width="180" />
				<el-table-column prop="assessmentId" label="来源评估单" width="120">
					<template #default="{ row }">
						{{ row.assessmentId || '独立创建' }}
					</template>
				</el-table-column>
				<el-table-column prop="sourceReason" label="来源原因" min-width="220">
					<template #default="{ row }">
						<span class="pip-page__cell-text">{{ row.sourceReason || '评估单带入' }}</span>
					</template>
				</el-table-column>
				<el-table-column label="时间范围" min-width="200">
					<template #default="{ row }">
						{{ row.startDate }} ~ {{ row.endDate }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="360">
					<template #default="{ row }">
						<el-button text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button v-if="canStart(row)" text type="warning" @click="handleStart(row)">
							启动
						</el-button>
						<el-button v-if="canTrack(row)" text type="success" @click="openTrack(row)">
							跟进
						</el-button>
						<el-button
							v-if="canComplete(row)"
							text
							type="success"
							@click="handleResultAction(row, 'complete')"
						>
							完成
						</el-button>
						<el-button
							v-if="canClose(row)"
							text
							type="danger"
							@click="handleResultAction(row, 'close')"
						>
							关闭
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="pip-page__pagination">
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
			:title="editingPip?.id ? '编辑 PIP' : '新建 PIP'"
			width="860px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="form.assessmentId ? '当前为评估单来源创建' : '当前为独立创建'"
					:type="form.assessmentId ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="来源评估单">
							<el-input-number
								v-model="assessmentIdInput"
								:min="1"
								placeholder="可选"
								controls-position="right"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="带入操作">
							<el-button
								:disabled="!assessmentIdInput"
								:loading="assessmentLoading"
								@click="applyAssessmentSource"
							>
								带入评估信息
							</el-button>
							<el-button v-if="form.assessmentId" @click="clearAssessmentSource">
								切换为独立创建
							</el-button>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="员工" prop="employeeId">
							<el-select
								v-model="form.employeeId"
								placeholder="请选择员工"
								filterable
								clearable
							>
								<el-option
									v-for="item in userOptions"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="负责人" prop="ownerId">
							<el-select
								v-model="form.ownerId"
								placeholder="请选择负责人"
								filterable
								clearable
							>
								<el-option
									v-for="item in userOptions"
									:key="`form-owner-${item.id}`"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="标题" prop="title">
							<el-input v-model="form.title" placeholder="请输入 PIP 标题" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="时间范围">
							<el-date-picker
								v-model="dateRange"
								type="daterange"
								value-format="YYYY-MM-DD"
								range-separator="至"
								start-placeholder="开始日期"
								end-placeholder="结束日期"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="改进目标" prop="improvementGoal">
							<el-input
								v-model="form.improvementGoal"
								type="textarea"
								:rows="4"
								placeholder="请输入改进目标"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item
							label="来源原因"
							prop="sourceReason"
						>
							<el-input
								v-model="form.sourceReason"
								type="textarea"
								:rows="3"
								placeholder="独立创建时必填；评估单来源可留空"
							/>
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

		<pip-track-drawer
			v-model="detailVisible"
			:pip="detailPip"
			:loading="submitLoading"
			:can-track="detailCanTrack"
			@submit="submitTrack"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-pip'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { useRoute } from 'vue-router';
import { export_json_to_excel } from '/@/plugins/excel/utils';
import { service } from '/@/cool';
import { checkPerm } from '/$/base/utils/permission';
import PipTrackDrawer from '../../components/pip-track-drawer.vue';
import { performanceAssessmentService } from '../../service/assessment';
import { performancePipService } from '../../service/pip';
import {
	type PipExportRow,
	type PipRecord,
	type UserOption,
	createEmptyPip
} from '../../types';

const route = useRoute();

const rows = ref<PipRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const assessmentLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingPip = ref<PipRecord | null>(null);
const detailPip = ref<PipRecord | null>(null);
const formRef = ref<FormInstance>();
const assessmentIdInput = ref<number | undefined>();

const filters = reactive({
	keyword: '',
	employeeId: undefined as number | undefined,
	ownerId: undefined as number | undefined,
	status: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<PipRecord>(createEmptyPip());

const rules = {
	employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
	ownerId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
	title: [{ required: true, message: '请输入 PIP 标题', trigger: 'blur' }],
	improvementGoal: [{ required: true, message: '请输入改进目标', trigger: 'blur' }],
	sourceReason: [
		{
			validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
				if (!form.assessmentId && !String(value || '').trim()) {
					callback(new Error('独立创建必须填写来源原因'));
					return;
				}
				callback();
			},
			trigger: 'blur'
		}
	]
};

const statusOptions = [
	{ label: '草稿', value: 'draft' },
	{ label: '进行中', value: 'active' },
	{ label: '已完成', value: 'completed' },
	{ label: '已关闭', value: 'closed' }
];

const canAccess = computed(() => checkPerm(performancePipService.permission.page));
const showAddButton = computed(() => checkPerm(performancePipService.permission.add));
const showExportButton = computed(() => checkPerm(performancePipService.permission.export));
const presetAssessmentId = computed(() => {
	const value = Number(route.query.assessmentId || 0);
	return value || undefined;
});
const presetSuggestionId = computed(() => {
	const value = Number(route.query.suggestionId || 0);
	return value || undefined;
});
const dateRange = computed({
	get: () => {
		return form.startDate && form.endDate ? [form.startDate, form.endDate] : [];
	},
	set: (value: string[]) => {
		form.startDate = value?.[0] || '';
		form.endDate = value?.[1] || '';
	}
});
const detailCanTrack = computed(() => {
	if (!detailPip.value) {
		return false;
	}

	return canTrack(detailPip.value);
});

watch(
	() => form.assessmentId,
	value => {
		if (!value) {
			return;
		}

		form.sourceReason = '';
		assessmentIdInput.value = Number(value);
	}
);

onMounted(async () => {
	await loadUsers();
	await refresh();

	if (presetAssessmentId.value && showAddButton.value) {
		openCreate();
		assessmentIdInput.value = presetAssessmentId.value;
		await applyAssessmentSource();
	}
});

async function loadUsers() {
	try {
		const result = await service.base.sys.user.page({
			page: 1,
			size: 200
		});

		userOptions.value = (result.list || []).map((item: any) => ({
			id: Number(item.id),
			name: item.name,
			departmentId: item.departmentId,
			departmentName: item.departmentName
		}));
	} catch (error: any) {
		ElMessage.warning(error.message || '用户选项加载失败');
	}
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performancePipService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			employeeId: filters.employeeId,
			ownerId: filters.ownerId,
			status: filters.status || undefined,
			assessmentId: presetAssessmentId.value
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || 'PIP 列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	Object.assign(form, createEmptyPip());
	editingPip.value = null;
	assessmentIdInput.value = presetAssessmentId.value;
	formVisible.value = true;
}

async function openEdit(row: PipRecord) {
	await loadDetail(row.id!, record => {
		editingPip.value = record;
		assessmentIdInput.value = record.assessmentId || undefined;
		Object.assign(form, {
			...createEmptyPip(),
			...record
		});
		formVisible.value = true;
	});
}

async function openDetail(row: PipRecord) {
	await loadDetail(row.id!, record => {
		detailPip.value = record;
		detailVisible.value = true;
	});
}

async function openTrack(row: PipRecord) {
	await openDetail(row);
}

async function loadDetail(id: number, next: (record: PipRecord) => void) {
	try {
		const record = await performancePipService.fetchInfo({ id });
		next(record);
	} catch (error: any) {
		ElMessage.error(error.message || 'PIP 详情加载失败');
	}
}

async function applyAssessmentSource() {
	if (!assessmentIdInput.value) {
		return;
	}

	assessmentLoading.value = true;

	try {
		const assessment = await performanceAssessmentService.fetchInfo({
			id: Number(assessmentIdInput.value)
		});

		form.assessmentId = Number(assessment.id);
		form.employeeId = assessment.employeeId;
		form.ownerId = assessment.assessorId;
		form.title = form.title || `PIP-${assessment.employeeName || assessment.employeeId}`;
		form.improvementGoal = form.improvementGoal || assessment.managerFeedback || assessment.selfEvaluation || '';
		form.sourceReason = '';
		ElMessage.success('评估信息已带入');
	} catch (error: any) {
		ElMessage.error(error.message || '评估信息带入失败');
	} finally {
		assessmentLoading.value = false;
	}
}

function clearAssessmentSource() {
	form.assessmentId = null;
	assessmentIdInput.value = undefined;
}

async function submitForm() {
	await formRef.value?.validate();

	if (!form.startDate || !form.endDate) {
		ElMessage.error('请选择开始日期和结束日期');
		return;
	}

	if (form.startDate > form.endDate) {
		ElMessage.error('开始日期不能晚于结束日期');
		return;
	}

	submitLoading.value = true;

	try {
		if (editingPip.value?.id) {
			await performancePipService.updatePip(form);
		} else {
			await performancePipService.createPip(form);
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

async function handleStart(row: PipRecord) {
	try {
		await performancePipService.start({ id: row.id! });
		ElMessage.success('PIP 已启动');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || 'PIP 启动失败');
	}
}

async function submitTrack(payload: {
	id: number;
	recordDate: string;
	progress: string;
	nextPlan?: string;
}) {
	submitLoading.value = true;

	try {
		await performancePipService.track(payload);
		ElMessage.success('跟进提交成功');
		detailVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '跟进提交失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleResultAction(row: PipRecord, action: 'complete' | 'close') {
	try {
		const result = await ElMessageBox.prompt(
			action === 'complete' ? '可补充本次完成总结' : '可补充本次关闭说明',
			action === 'complete' ? '完成 PIP' : '关闭 PIP',
			{
				confirmButtonText: '确认',
				cancelButtonText: '取消',
				inputPlaceholder: '结果总结可留空',
				inputValue: row.resultSummary || '',
				inputType: 'textarea'
			}
		);

		if (action === 'complete') {
			await performancePipService.complete({
				id: row.id!,
				resultSummary: result.value
			});
			ElMessage.success('PIP 已完成');
		} else {
			await performancePipService.close({
				id: row.id!,
				resultSummary: result.value
			});
			ElMessage.success('PIP 已关闭');
		}

		await refresh();
	} catch (error: any) {
		if (error === 'cancel' || error === 'close') {
			return;
		}

		ElMessage.error(error.message || 'PIP 状态更新失败');
	}
}

async function handleExport() {
	try {
		const exportRows = await performancePipService.exportSummary({
			keyword: filters.keyword || undefined,
			employeeId: filters.employeeId,
			ownerId: filters.ownerId,
			status: filters.status || undefined,
			assessmentId: presetAssessmentId.value
		});

		export_json_to_excel({
			header: [
				'PIP ID',
				'来源评估单',
				'员工ID',
				'员工',
				'负责人ID',
				'负责人',
				'标题',
				'开始日期',
				'结束日期',
				'状态',
				'创建时间',
				'更新时间'
			],
			data: (exportRows || []).map((item: PipExportRow) => [
				item.id,
				item.assessmentId ?? '',
				item.employeeId,
				item.employeeName || '',
				item.ownerId,
				item.ownerName || '',
				item.title,
				item.startDate,
				item.endDate,
				statusLabel(item.status),
				item.createTime || '',
				item.updateTime || ''
			]),
			filename: `pip-summary-${Date.now()}`
		});
	} catch (error: any) {
		ElMessage.error(error.message || '导出失败');
	}
}

function canEdit(row: PipRecord) {
	return checkPerm(performancePipService.permission.update) && row.status === 'draft';
}

function canStart(row: PipRecord) {
	return checkPerm(performancePipService.permission.start) && row.status === 'draft';
}

function canTrack(row: PipRecord) {
	return checkPerm(performancePipService.permission.track) && row.status === 'active';
}

function canComplete(row: PipRecord) {
	return checkPerm(performancePipService.permission.complete) && row.status === 'active';
}

function canClose(row: PipRecord) {
	return checkPerm(performancePipService.permission.close) && row.status === 'active';
}

function statusLabel(status?: string) {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: string) {
	switch (status) {
		case 'active':
			return 'warning';
		case 'completed':
			return 'success';
		case 'closed':
			return 'danger';
		default:
			return 'info';
	}
}
</script>

<style lang="scss" scoped>
.pip-page {
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

	&__stat-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__stat-value {
		margin-top: 8px;
		font-size: 28px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	&__header-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
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

	&__cell-text {
		display: inline-block;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}
}
</style>
