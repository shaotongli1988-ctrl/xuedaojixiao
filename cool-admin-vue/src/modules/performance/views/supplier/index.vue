<!-- 文件职责：承接主题11供应商台账的列表、详情、新增、编辑和删除主链；不负责资质、评级、结算中心、附件全文或外部采购系统接入；依赖 supplier service 与既有权限工具；维护重点是 HR 管理、经理只读和敏感字段展示必须与冻结口径一致。 -->
<template>
	<div v-if="canAccess" class="supplier-page">
		<el-card shadow="never">
			<div class="supplier-page__toolbar">
				<div class="supplier-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="供应商名称 / 编码"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-input
						v-model="filters.category"
						placeholder="供应商分类"
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
							v-for="item in filterStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="supplier-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增供应商
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="supplier-page__header">
					<div class="supplier-page__header-main">
						<h2>供应商管理</h2>
						<el-tag effect="plain">主题 11</el-tag>
						<el-tag effect="plain" type="info">
							{{ isReadOnlyRole ? '经理只读' : 'HR 管理' }}
						</el-tag>
					</div>
					<el-alert
						title="首批只覆盖供应商台账摘要；经理仅可查看脱敏后的联系人、税号和银行账户摘要，不提供新增、编辑或删除入口。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="name" label="供应商名称" min-width="180" />
				<el-table-column prop="code" label="编码" min-width="140">
					<template #default="{ row }">
						{{ row.code || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="category" label="分类" min-width="140">
					<template #default="{ row }">
						{{ row.category || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="contactName" label="联系人" min-width="120">
					<template #default="{ row }">
						{{ row.contactName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="contactPhone" label="联系电话" min-width="150">
					<template #default="{ row }">
						{{ row.contactPhone || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="contactEmail" label="联系邮箱" min-width="220">
					<template #default="{ row }">
						{{ row.contactEmail || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="bankAccount" label="银行账户" min-width="180">
					<template #default="{ row }">
						{{ row.bankAccount || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="taxNo" label="税号" min-width="160">
					<template #default="{ row }">
						{{ row.taxNo || '-' }}
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

			<div class="supplier-page__pagination">
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

		<el-dialog v-model="detailVisible" title="供应商详情" width="860px" destroy-on-close>
			<div v-if="detailSupplier" class="supplier-page__detail">
				<el-alert
					v-if="isReadOnlyRole"
					title="当前账号为经理只读角色，敏感字段仅展示后端返回的脱敏摘要。"
					type="info"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="供应商名称">
						{{ detailSupplier.name }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailSupplier.status)">
							{{ statusLabel(detailSupplier.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="编码">
						{{ detailSupplier.code || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="分类">
						{{ detailSupplier.category || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="联系人">
						{{ detailSupplier.contactName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="联系电话">
						{{ detailSupplier.contactPhone || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="联系邮箱">
						{{ detailSupplier.contactEmail || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="银行账户">
						{{ detailSupplier.bankAccount || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="税号">
						{{ detailSupplier.taxNo || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailSupplier.updateTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="备注" :span="2">
						{{ detailSupplier.remark || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="创建时间" :span="2">
						{{ detailSupplier.createTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingSupplier?.id ? '编辑供应商' : '新增供应商'"
			width="860px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingSupplier?.id ? '供应商仅支持 active / inactive 状态维护；删除只允许 inactive 且无关联有效采购订单。' : '新建供应商默认保存为 active。'"
					:type="editingSupplier?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="供应商名称" prop="name">
							<el-input v-model="form.name" placeholder="请输入供应商名称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="供应商编码">
							<el-input v-model="form.code" placeholder="可选，如填写需唯一" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="供应商分类">
							<el-input v-model="form.category" placeholder="可选，自由文本" />
						</el-form-item>
					</el-col>
					<el-col v-if="editingSupplier?.id" :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" style="width: 100%">
								<el-option
									v-for="item in filterStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="联系人">
							<el-input v-model="form.contactName" placeholder="可选" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="联系电话">
							<el-input v-model="form.contactPhone" placeholder="可选" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="联系邮箱">
							<el-input v-model="form.contactEmail" placeholder="可选" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="银行账户">
							<el-input v-model="form.bankAccount" placeholder="可选" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="税号">
							<el-input v-model="form.taxNo" placeholder="可选" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-form-item label="备注">
					<el-input
						v-model="form.remark"
						type="textarea"
						:rows="4"
						placeholder="可选"
					/>
				</el-form-item>
			</el-form>

			<template #footer>
				<div class="supplier-page__dialog-footer">
					<el-button @click="formVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitForm">
						保存
					</el-button>
				</div>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-supplier'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { performanceSupplierService } from '../../service/supplier';
import {
	type SupplierRecord,
	type SupplierStatus,
	createEmptySupplier
} from '../../types';

const rows = ref<SupplierRecord[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingSupplier = ref<SupplierRecord | null>(null);
const detailSupplier = ref<SupplierRecord | null>(null);
const formRef = ref<FormInstance>();

const filters = reactive({
	keyword: '',
	category: '',
	status: '' as SupplierStatus | ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<SupplierRecord>(createEmptySupplier());

const rules: FormRules = {
	name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const filterStatusOptions: Array<{ label: string; value: SupplierStatus }> = [
	{ label: '启用中', value: 'active' },
	{ label: '已停用', value: 'inactive' }
];

const canAccess = computed(() => checkPerm(performanceSupplierService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceSupplierService.permission.info));
const showAddButton = computed(() => checkPerm(performanceSupplierService.permission.add));
const showUpdateButton = computed(() => checkPerm(performanceSupplierService.permission.update));
const showDeleteButton = computed(() => checkPerm(performanceSupplierService.permission.delete));
const isReadOnlyRole = computed(
	() => !showAddButton.value && !showUpdateButton.value && !showDeleteButton.value
);

onMounted(() => {
	refresh();
});

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceSupplierService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			category: filters.category || undefined,
			status: filters.status || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '供应商列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function handleSearch() {
	pagination.page = 1;
	refresh();
}

function handleReset() {
	filters.keyword = '';
	filters.category = '';
	filters.status = '';
	pagination.page = 1;
	refresh();
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	editingSupplier.value = null;
	Object.assign(form, createEmptySupplier());
	formVisible.value = true;
}

async function openDetail(row: SupplierRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailSupplier.value = await performanceSupplierService.fetchInfo({ id: row.id });
		detailVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '供应商详情加载失败');
	}
}

async function openEdit(row: SupplierRecord) {
	if (!canEdit(row) || !row.id) {
		ElMessage.warning('当前供应商仅支持 HR 维护');
		return;
	}

	try {
		const detail = await performanceSupplierService.fetchInfo({ id: row.id });
		editingSupplier.value = detail;
		Object.assign(form, createEmptySupplier(), detail, {
			status: detail.status || 'active'
		});
		formVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '供应商详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (!isAllowedStatus(form.status)) {
		ElMessage.error('供应商状态不合法');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: Partial<SupplierRecord> = {
			id: editingSupplier.value?.id,
			name: form.name.trim(),
			code: normalizeOptionalText(form.code),
			category: normalizeOptionalText(form.category),
			contactName: normalizeOptionalText(form.contactName),
			contactPhone: normalizeOptionalText(form.contactPhone),
			contactEmail: normalizeOptionalText(form.contactEmail),
			bankAccount: normalizeOptionalText(form.bankAccount),
			taxNo: normalizeOptionalText(form.taxNo),
			remark: normalizeOptionalText(form.remark),
			status: editingSupplier.value?.id ? form.status || 'active' : 'active'
		};

		if (editingSupplier.value?.id) {
			await performanceSupplierService.updateSupplier(
				payload as Partial<SupplierRecord> & { id: number }
			);
		} else {
			await performanceSupplierService.createSupplier(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '供应商保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: SupplierRecord) {
	if (!row.id) {
		return;
	}

	try {
		await ElMessageBox.confirm(`确认删除供应商「${row.name}」吗？`, '删除确认', {
			type: 'warning'
		});
	} catch {
		return;
	}

	try {
		await performanceSupplierService.removeSupplier({
			ids: [row.id]
		});
		ElMessage.success('删除成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '供应商删除失败');
	}
}

function canEdit(row: SupplierRecord) {
	return showUpdateButton.value && ['active', 'inactive'].includes(String(row.status || 'active'));
}

function canDelete(row: SupplierRecord) {
	return showDeleteButton.value && row.status === 'inactive';
}

function isAllowedStatus(status?: SupplierStatus) {
	return filterStatusOptions.some(item => item.value === status);
}

function statusLabel(status?: SupplierStatus | '') {
	const item = filterStatusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: SupplierStatus | '') {
	switch (status) {
		case 'inactive':
			return 'info';
		case 'active':
		default:
			return 'success';
	}
}

function normalizeOptionalText(value?: string | null) {
	const normalized = String(value || '').trim();
	return normalized || undefined;
}
</script>

<style lang="scss" scoped>
.supplier-page {
	display: grid;
	gap: 16px;

	&__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	&__toolbar-left,
	&__toolbar-right,
	&__header-main {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	&__header,
	&__detail {
		display: grid;
		gap: 12px;
	}

	&__header-main h2 {
		margin: 0;
		font-size: 18px;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}

	&__dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
}
</style>
