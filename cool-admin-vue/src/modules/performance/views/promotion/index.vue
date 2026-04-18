<!-- 文件职责：承接晋升管理模块的筛选、列表、创建编辑、提交评审和评审抽屉主链；不负责 PIP、薪资或自动晋升建议；依赖 promotion service、base user store 和评审抽屉组件；维护重点是两条创建路径、状态流转和按钮权限必须与后端口径一致。 -->
<template>
	<div v-if="canAccess" class="promotion-page">
		<el-card shadow="never">
			<div class="promotion-page__toolbar">
				<div class="promotion-page__toolbar-left">
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
					<el-input
						v-model="filters.assessmentId"
						placeholder="来源评估单ID"
						clearable
						style="width: 180px"
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
					<el-input
						v-model="filters.toPosition"
						placeholder="目标岗位"
						clearable
						style="width: 200px"
					/>
				</div>

				<div class="promotion-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate()">
						新建晋升单
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="promotion-page__stat-label">当前页单据数</div>
					<div class="promotion-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="promotion-page__stat-label">草稿</div>
					<div class="promotion-page__stat-value">
						{{ rows.filter(item => item.status === 'draft').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="promotion-page__stat-label">评审中</div>
					<div class="promotion-page__stat-value">
						{{ rows.filter(item => item.status === 'reviewing').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="promotion-page__stat-label">已通过</div>
					<div class="promotion-page__stat-value">
						{{ rows.filter(item => item.status === 'approved').length }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="promotion-page__header">
					<div class="promotion-page__header-main">
						<h2>晋升管理</h2>
						<el-tag effect="plain">模块 7</el-tag>
					</div>
					<el-tag v-if="presetSuggestionId" type="primary" effect="plain">
						来自建议 #{{ presetSuggestionId }}
					</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="employeeName" label="员工" min-width="120" />
				<el-table-column prop="sponsorName" label="发起人" min-width="120" />
				<el-table-column prop="assessmentId" label="来源评估单" min-width="120">
					<template #default="{ row }">
						{{ row.assessmentId || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="fromPosition" label="当前岗位" min-width="140" />
				<el-table-column prop="toPosition" label="目标岗位" min-width="140" />
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="reviewTime" label="评审时间" min-width="170">
					<template #default="{ row }">
						{{ row.reviewTime || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="280">
					<template #default="{ row }">
						<el-button text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canSubmit(row)"
							text
							type="success"
							@click="handleSubmit(row)"
						>
							提交评审
						</el-button>
						<el-button
							v-if="canReview(row)"
							text
							type="warning"
							@click="openReview(row)"
						>
							评审
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="promotion-page__pagination">
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
			:title="editingPromotion?.id ? '编辑晋升单' : '新建晋升单'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="来源评估单ID">
							<el-input
								v-model="assessmentIdInput"
								placeholder="可选，不填表示独立创建"
								clearable
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="所属员工" prop="employeeId">
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
						<el-form-item label="当前岗位" prop="fromPosition">
							<el-input v-model="form.fromPosition" placeholder="请输入当前岗位" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标岗位" prop="toPosition">
							<el-input v-model="form.toPosition" placeholder="请输入目标岗位" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-form-item label="发起原因">
					<el-input
						v-model="form.reason"
						type="textarea"
						:rows="3"
						placeholder="可选，填写发起原因"
					/>
				</el-form-item>

				<el-form-item label="独立创建原因" prop="sourceReason">
					<el-input
						v-model="form.sourceReason"
						type="textarea"
						:rows="3"
						placeholder="脱离评估单创建时必须填写"
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

		<promotion-review-drawer
			v-model="detailVisible"
			:promotion="detailPromotion"
			:loading="submitLoading"
			:can-review="detailCanReview"
			@submit="submitReview"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-promotion'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { useBase } from '/$/base';
import PromotionReviewDrawer from '../../components/promotion-review-drawer.vue';
import {
	type PromotionRecord,
	type UserOption,
	createEmptyPromotion
} from '../../types';
import { performancePromotionService } from '../../service/promotion';

const route = useRoute();
const { user } = useBase();

const rows = ref<PromotionRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingPromotion = ref<PromotionRecord | null>(null);
const detailPromotion = ref<PromotionRecord | null>(null);
const formRef = ref<FormInstance>();
const assessmentIdInput = ref('');

const filters = reactive({
	employeeId: undefined as number | undefined,
	assessmentId: '',
	status: '',
	toPosition: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<PromotionRecord>(createEmptyPromotion(Number(user.info?.id || 0)));

const rules = {
	employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
	fromPosition: [{ required: true, message: '请输入当前岗位', trigger: 'blur' }],
	toPosition: [{ required: true, message: '请输入目标岗位', trigger: 'blur' }],
	sourceReason: [
		{
			validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
				if (!assessmentIdInput.value && !String(value || '').trim()) {
					callback(new Error('独立创建时必须填写原因说明'));
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
	{ label: '评审中', value: 'reviewing' },
	{ label: '已通过', value: 'approved' },
	{ label: '已驳回', value: 'rejected' }
];

const canAccess = computed(() => checkPerm(performancePromotionService.permission.page));
const showAddButton = computed(() => checkPerm(performancePromotionService.permission.add));
const presetSuggestionId = computed(() => {
	const value = Number(route.query.suggestionId || 0);
	return value || undefined;
});
const detailCanReview = computed(() => {
	if (!detailPromotion.value) {
		return false;
	}

	return canReview(detailPromotion.value);
});

onMounted(async () => {
	await loadUsers();
	await refresh();
	applyRoutePreset();
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

function applyRoutePreset() {
	const assessmentId = Number(route.query.assessmentId || 0);
	const employeeId = Number(route.query.employeeId || 0);

	if (!assessmentId && !employeeId) {
		return;
	}

	openCreate({
		assessmentId: assessmentId || undefined,
		employeeId: employeeId || undefined
	});
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performancePromotionService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			employeeId: filters.employeeId,
			assessmentId: Number(filters.assessmentId || 0) || undefined,
			status: filters.status || undefined,
			toPosition: filters.toPosition || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '晋升列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate(preset?: Partial<PromotionRecord>) {
	Object.assign(form, createEmptyPromotion(Number(user.info?.id || 0)), preset || {});
	assessmentIdInput.value = preset?.assessmentId ? String(preset.assessmentId) : '';
	editingPromotion.value = null;
	formVisible.value = true;
}

async function openEdit(row: PromotionRecord) {
	await loadDetail(row.id!, record => {
		editingPromotion.value = record;
		Object.assign(form, createEmptyPromotion(Number(user.info?.id || 0)), record);
		assessmentIdInput.value = record.assessmentId ? String(record.assessmentId) : '';
		formVisible.value = true;
	});
}

async function openDetail(row: PromotionRecord) {
	await loadDetail(row.id!, record => {
		detailPromotion.value = record;
		detailVisible.value = true;
	});
}

async function openReview(row: PromotionRecord) {
	await openDetail(row);
}

async function loadDetail(id: number, next: (record: PromotionRecord) => void) {
	try {
		const record = await performancePromotionService.fetchInfo({ id });
		next(record);
	} catch (error: any) {
		ElMessage.error(error.message || '晋升详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	form.assessmentId = Number(assessmentIdInput.value || 0) || undefined;
	form.sponsorId = Number(user.info?.id || 0);

	if (!form.assessmentId && !String(form.sourceReason || '').trim()) {
		ElMessage.error('独立创建时必须填写原因说明');
		return;
	}

	submitLoading.value = true;

	try {
		if (editingPromotion.value?.id) {
			await performancePromotionService.updatePromotion(form);
		} else {
			await performancePromotionService.createPromotion(form);
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

async function handleSubmit(row: PromotionRecord) {
	await ElMessageBox.confirm(
		`确认提交晋升单「${row.employeeName || row.employeeId} / ${row.toPosition}」进入评审吗？`,
		'提交确认',
		{
			type: 'warning'
		}
	);

	try {
		await performancePromotionService.submit({
			id: row.id!
		});
		ElMessage.success('提交成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '提交失败');
	}
}

async function submitReview(payload: {
	id: number;
	decision: 'approved' | 'rejected';
	comment?: string;
}) {
	submitLoading.value = true;

	try {
		await performancePromotionService.review(payload);
		ElMessage.success('评审成功');
		detailVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '评审失败');
	} finally {
		submitLoading.value = false;
	}
}

function canEdit(row: PromotionRecord) {
	return (
		checkPerm(performancePromotionService.permission.update) &&
		row.status === 'draft' &&
		Number(row.sponsorId) === Number(user.info?.id || 0)
	);
}

function canSubmit(row: PromotionRecord) {
	return (
		checkPerm(performancePromotionService.permission.submit) &&
		row.status === 'draft' &&
		Number(row.sponsorId) === Number(user.info?.id || 0)
	);
}

function canReview(row: PromotionRecord) {
	return checkPerm(performancePromotionService.permission.review) && row.status === 'reviewing';
}

function statusLabel(status?: string) {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: string) {
	switch (status) {
		case 'reviewing':
			return 'warning';
		case 'approved':
			return 'success';
		case 'rejected':
			return 'danger';
		default:
			return 'info';
	}
}
</script>

<style lang="scss" scoped>
.promotion-page {
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
}
</style>
