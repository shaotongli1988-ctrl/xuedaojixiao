<!-- 文件职责：承接主题11采购订单的列表、详情、新增、编辑和删除主链；不负责采购计划、收货、付款、审批或订单明细行扩展；依赖 purchaseOrder / supplier service、base 用户信息与权限工具；维护重点是经理部门树范围维护、删除限制和状态流转必须与冻结包一致。 -->
<template>
	<div v-if="canAccess" class="purchase-order-page">
		<el-card shadow="never">
			<div class="purchase-order-page__toolbar">
				<div class="purchase-order-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="订单编号 / 采购标题"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filterSupplierIdModel"
						placeholder="供应商"
						clearable
						filterable
						style="width: 220px"
					>
						<el-option
							v-for="item in supplierOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filterDepartmentIdModel"
						placeholder="部门"
						clearable
						filterable
						style="width: 180px"
					>
						<el-option
							v-for="item in departmentOptions"
							:key="item.id"
							:label="item.label"
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
							v-for="item in filterStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-date-picker
						v-model="filters.startDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="采购开始日期"
						style="width: 170px"
					/>
					<el-date-picker
						v-model="filters.endDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="采购结束日期"
						style="width: 170px"
					/>
				</div>

				<div class="purchase-order-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增采购订单
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="purchase-order-page__header">
					<div class="purchase-order-page__header-main">
						<h2>采购订单管理</h2>
						<el-tag effect="plain">主题 11</el-tag>
						<el-tag effect="plain" type="info">
							{{ isHrRole ? 'HR 管理' : '经理范围维护' }}
						</el-tag>
					</div>
					<el-alert
						title="经理仅可维护本人部门树范围内订单；删除仅保留 HR 的 draft 订单；页面不扩展审批、收货、付款或订单明细行。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="orderNo" label="订单编号" min-width="150">
					<template #default="{ row }">
						{{ row.orderNo || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="title" label="采购标题" min-width="200" />
				<el-table-column label="供应商" min-width="180">
					<template #default="{ row }">
						{{ row.supplierName || supplierLabel(row.supplierId) }}
					</template>
				</el-table-column>
				<el-table-column label="申请部门" min-width="150">
					<template #default="{ row }">
						{{ row.departmentName || departmentLabel(row.departmentId) }}
					</template>
				</el-table-column>
				<el-table-column label="申请人" min-width="140">
					<template #default="{ row }">
						{{ row.requesterName || requesterLabel(row.requesterId) }}
					</template>
				</el-table-column>
				<el-table-column prop="orderDate" label="采购日期" min-width="140" />
				<el-table-column label="总金额" min-width="140">
					<template #default="{ row }">
						{{ formatAmount(row.totalAmount, row.currency) }}
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

			<div class="purchase-order-page__pagination">
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
			title="采购订单详情"
			width="900px"
			destroy-on-close
		>
			<div v-if="detailOrder" class="purchase-order-page__detail">
				<el-alert
					:title="detailReadonlyMessage(detailOrder.status)"
					:type="detailOrder.status === 'cancelled' ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="订单编号">
						{{ detailOrder.orderNo || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailOrder.status)">
							{{ statusLabel(detailOrder.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="采购标题">
						{{ detailOrder.title }}
					</el-descriptions-item>
					<el-descriptions-item label="采购日期">
						{{ detailOrder.orderDate }}
					</el-descriptions-item>
					<el-descriptions-item label="供应商">
						{{ detailOrder.supplierName || supplierLabel(detailOrder.supplierId) }}
					</el-descriptions-item>
					<el-descriptions-item label="申请部门">
						{{ detailOrder.departmentName || departmentLabel(detailOrder.departmentId) }}
					</el-descriptions-item>
					<el-descriptions-item label="申请人">
						{{ detailOrder.requesterName || requesterLabel(detailOrder.requesterId) }}
					</el-descriptions-item>
					<el-descriptions-item label="总金额">
						{{ formatAmount(detailOrder.totalAmount, detailOrder.currency) }}
					</el-descriptions-item>
					<el-descriptions-item label="币种">
						{{ detailOrder.currency || 'CNY' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailOrder.updateTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="备注" :span="2">
						{{ detailOrder.remark || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="创建时间" :span="2">
						{{ detailOrder.createTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingOrder?.id ? '编辑采购订单' : '新增采购订单'"
			width="900px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="formAlertMessage"
					:type="editingOrder?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="订单编号">
							<el-input v-model="form.orderNo" placeholder="可选，如填写需唯一" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="采购标题" prop="title">
							<el-input v-model="form.title" placeholder="请输入采购标题" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="供应商" prop="supplierId">
							<el-select
								v-model="formSupplierIdModel"
								placeholder="请选择供应商"
								filterable
								style="width: 100%"
							>
								<el-option
									v-for="item in supplierOptions"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="申请人" prop="requesterId">
							<el-select
								v-model="formRequesterIdModel"
								placeholder="请选择申请人"
								filterable
								style="width: 100%"
								@change="syncDepartmentByRequester"
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
						<el-form-item label="申请部门" prop="departmentId">
							<el-select
								v-model="formDepartmentIdModel"
								placeholder="请选择部门"
								clearable
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
						<el-form-item label="采购日期" prop="orderDate">
							<el-date-picker
								v-model="form.orderDate"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="请选择采购日期"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="总金额" prop="totalAmount">
							<el-input-number
								v-model="totalAmountModel"
								:min="0"
								:controls="false"
								:precision="2"
								:step="100"
								style="width: 100%"
								placeholder="请输入总金额"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="币种">
							<el-input v-model="form.currency" placeholder="默认 CNY" />
						</el-form-item>
					</el-col>
					<el-col v-if="editingOrder?.id" :span="12">
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
				<div class="purchase-order-page__dialog-footer">
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
	name: 'performance-purchase-order'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { useUserStore } from '/$/base/store/user';
import { performancePurchaseOrderService } from '../../service/purchase-order';
import { performanceSupplierService } from '../../service/supplier';
import type {
	PurchaseOrderRecord,
	PurchaseOrderStatus,
	SupplierRecord,
	UserOption
} from '../../types';
import { createEmptyPurchaseOrder } from '../../types';

interface DepartmentOption {
	id: number;
	label: string;
}

interface SupplierOption {
	id: number;
	name: string;
	status?: SupplierRecord['status'];
}

const user = useUserStore();
const rows = ref<PurchaseOrderRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const supplierOptions = ref<SupplierOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingOrder = ref<PurchaseOrderRecord | null>(null);
const detailOrder = ref<PurchaseOrderRecord | null>(null);
const formRef = ref<FormInstance>();

const filters = reactive({
	keyword: '',
	supplierId: undefined as number | undefined,
	departmentId: undefined as number | undefined,
	status: '' as PurchaseOrderStatus | '',
	startDate: '',
	endDate: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<PurchaseOrderRecord>(createEmptyPurchaseOrder());

const rules: FormRules = {
	title: [{ required: true, message: '请输入采购标题', trigger: 'blur' }],
	supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
	requesterId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
	departmentId: [{ required: true, message: '请选择申请部门', trigger: 'change' }],
	orderDate: [{ required: true, message: '请选择采购日期', trigger: 'change' }],
	totalAmount: [
		{ required: true, message: '请输入采购总金额', trigger: 'change' },
		{
			validator: (_rule, value, callback) => {
				if (value == null || Number(value) <= 0) {
					callback(new Error('采购总金额必须大于 0'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const filterStatusOptions: Array<{ label: string; value: PurchaseOrderStatus }> = [
	{ label: '草稿', value: 'draft' },
	{ label: '已生效', value: 'active' },
	{ label: '已取消', value: 'cancelled' }
];

const canAccess = computed(() => checkPerm(performancePurchaseOrderService.permission.page));
const showInfoButton = computed(() => checkPerm(performancePurchaseOrderService.permission.info));
const showAddButton = computed(() => checkPerm(performancePurchaseOrderService.permission.add));
const showUpdateButton = computed(() => checkPerm(performancePurchaseOrderService.permission.update));
const showDeleteButton = computed(() => checkPerm(performancePurchaseOrderService.permission.delete));
const isHrRole = computed(() => checkPerm(performanceSupplierService.permission.add));
const formAlertMessage = computed(() => {
	if (!editingOrder.value?.id) {
		return '新建采购订单默认保存为 draft；后续可在编辑时转为 active 或 cancelled。';
	}

	if (editingOrder.value.status === 'active') {
		return isHrRole.value
			? 'active 订单仅允许 HR 改字段或取消为 cancelled。'
			: 'active 订单经理只允许维护非状态字段，状态保持 active。';
	}

	return 'draft 订单可继续保持 draft，也可更新为 active 或 cancelled。';
});
const editableStatusOptions = computed<Array<{ label: string; value: PurchaseOrderStatus }>>(() => {
	if (!editingOrder.value?.id) {
		return [{ label: '草稿', value: 'draft' }];
	}

	if (editingOrder.value.status === 'active') {
		return isHrRole.value
			? [
					{ label: '已生效', value: 'active' },
					{ label: '已取消', value: 'cancelled' }
				]
			: [{ label: '已生效', value: 'active' }];
	}

	return [
		{ label: '草稿', value: 'draft' },
		{ label: '已生效', value: 'active' },
		{ label: '已取消', value: 'cancelled' }
	];
});
const filterSupplierIdModel = computed<number | undefined>({
	get: () => filters.supplierId ?? undefined,
	set: value => {
		filters.supplierId = value;
	}
});
const filterDepartmentIdModel = computed<number | undefined>({
	get: () => filters.departmentId ?? undefined,
	set: value => {
		filters.departmentId = value;
	}
});
const formSupplierIdModel = computed<number | undefined>({
	get: () => form.supplierId ?? undefined,
	set: value => {
		form.supplierId = value;
	}
});
const formRequesterIdModel = computed<number | undefined>({
	get: () => form.requesterId ?? undefined,
	set: value => {
		form.requesterId = value;
	}
});
const formDepartmentIdModel = computed<number | undefined>({
	get: () => form.departmentId ?? undefined,
	set: value => {
		form.departmentId = value;
	}
});
const totalAmountModel = computed<number | undefined>({
	get: () => Number(form.totalAmount || 0),
	set: value => {
		form.totalAmount = Number(value || 0);
	}
});

onMounted(async () => {
	await Promise.all([loadUsers(), loadDepartments(), loadSuppliers()]);
	await refresh();
});

async function loadUsers() {
	try {
		const result = await service.base.sys.user.page({
			page: 1,
			size: 500
		});

		userOptions.value = (result.list || []).map((item: any) => ({
			id: Number(item.id),
			name: item.name,
			departmentId: item.departmentId,
			departmentName: item.departmentName
		}));
	} catch (error: any) {
		userOptions.value = [];
		ElMessage.warning(error.message || '申请人选项加载失败');
	}
}

async function loadDepartments() {
	try {
		const result = await service.base.sys.department.list();
		departmentOptions.value = flattenDepartments(result || []);
	} catch (error: any) {
		departmentOptions.value = [];
		ElMessage.warning(error.message || '部门选项加载失败');
	}
}

async function loadSuppliers() {
	try {
		const result = await performanceSupplierService.fetchPage({
			page: 1,
			size: 200
		});
		supplierOptions.value = (result.list || []).map(item => ({
			id: Number(item.id),
			name: item.name,
			status: item.status
		}));
	} catch (error: any) {
		supplierOptions.value = [];
		ElMessage.warning(error.message || '供应商选项加载失败');
	}
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performancePurchaseOrderService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			supplierId: filters.supplierId,
			departmentId: filters.departmentId,
			status: filters.status || undefined,
			startDate: filters.startDate || undefined,
			endDate: filters.endDate || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '采购订单列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function handleSearch() {
	if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
		ElMessage.warning('结束日期不能早于开始日期');
		return;
	}

	pagination.page = 1;
	refresh();
}

function handleReset() {
	filters.keyword = '';
	filters.supplierId = undefined;
	filters.departmentId = undefined;
	filters.status = '';
	filters.startDate = '';
	filters.endDate = '';
	pagination.page = 1;
	refresh();
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	editingOrder.value = null;
	Object.assign(form, createEmptyPurchaseOrder(), {
		requesterId: resolveCurrentUserId(),
		departmentId: resolveCurrentDepartmentId(),
		currency: 'CNY'
	});
	formVisible.value = true;
}

async function openDetail(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailOrder.value = await performancePurchaseOrderService.fetchInfo({ id: row.id });
		detailVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '采购订单详情加载失败');
	}
}

async function openEdit(row: PurchaseOrderRecord) {
	if (!canEdit(row) || !row.id) {
		ElMessage.warning(detailReadonlyMessage(row.status));
		return;
	}

	try {
		const detail = await performancePurchaseOrderService.fetchInfo({ id: row.id });

		if (detail.status === 'cancelled') {
			ElMessage.warning(detailReadonlyMessage(detail.status));
			return;
		}

		editingOrder.value = detail;
		Object.assign(form, createEmptyPurchaseOrder(), detail, {
			orderNo: detail.orderNo || '',
			remark: detail.remark || '',
			currency: detail.currency || 'CNY',
			status: detail.status || 'draft'
		});
		formVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '采购订单详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	syncDepartmentByRequester();

	if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
		ElMessage.error('查询日期范围不合法');
		return;
	}

	if (form.totalAmount <= 0) {
		ElMessage.error('采购总金额必须大于 0');
		return;
	}

	if (!isAllowedStatus(form.status)) {
		ElMessage.error('采购订单状态不合法');
		return;
	}

	if (editingOrder.value?.status === 'cancelled') {
		ElMessage.error('已取消订单不允许继续编辑');
		return;
	}

	if (
		editingOrder.value?.status === 'active' &&
		!isHrRole.value &&
		form.status === 'cancelled'
	) {
		ElMessage.error('经理不能将 active 订单取消');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: Partial<PurchaseOrderRecord> = {
			id: editingOrder.value?.id,
			orderNo: normalizeOptionalText(form.orderNo),
			title: form.title.trim(),
			supplierId: form.supplierId,
			departmentId: form.departmentId,
			requesterId: form.requesterId,
			orderDate: form.orderDate,
			totalAmount: Number(form.totalAmount),
			currency: normalizeOptionalText(form.currency) || 'CNY',
			remark: normalizeOptionalText(form.remark),
			status: editingOrder.value?.id ? form.status || editingOrder.value.status || 'draft' : 'draft'
		};

		if (editingOrder.value?.id) {
			await performancePurchaseOrderService.updatePurchaseOrder(
				payload as Partial<PurchaseOrderRecord> & { id: number }
			);
		} else {
			await performancePurchaseOrderService.createPurchaseOrder(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '采购订单保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	try {
		await ElMessageBox.confirm(
			`确认删除采购订单「${row.title || row.orderNo || row.id}」吗？`,
			'删除确认',
			{
				type: 'warning'
			}
		);
	} catch {
		return;
	}

	try {
		await performancePurchaseOrderService.removePurchaseOrder({
			ids: [row.id]
		});
		ElMessage.success('删除成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '采购订单删除失败');
	}
}

function syncDepartmentByRequester(value?: number) {
	const current = userOptions.value.find(item => item.id === Number(value || form.requesterId));

	if (!current?.departmentId) {
		return;
	}

	form.departmentId = current.departmentId;
	form.departmentName = current.departmentName || '';
}

function canEdit(row: PurchaseOrderRecord) {
	return showUpdateButton.value && row.status !== 'cancelled';
}

function canDelete(row: PurchaseOrderRecord) {
	return showDeleteButton.value && row.status === 'draft';
}

function isAllowedStatus(status?: PurchaseOrderStatus) {
	return filterStatusOptions.some(item => item.value === status);
}

function detailReadonlyMessage(status?: PurchaseOrderStatus) {
	switch (status) {
		case 'active':
			return isHrRole.value
				? '当前订单已生效，HR 可继续维护字段或取消为 cancelled。'
				: '当前订单已生效，经理仅允许维护非状态字段。';
		case 'cancelled':
			return '当前订单已取消，不允许再次编辑或恢复。';
		case 'draft':
		default:
			return '当前订单处于 draft，可继续编辑、激活或取消。';
	}
}

function statusLabel(status?: PurchaseOrderStatus | '') {
	const item = filterStatusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: PurchaseOrderStatus | '') {
	switch (status) {
		case 'active':
			return 'success';
		case 'cancelled':
			return 'info';
		case 'draft':
		default:
			return 'warning';
	}
}

function supplierLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return supplierOptions.value.find(item => item.id === Number(id))?.name || `供应商${id}`;
}

function requesterLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return userOptions.value.find(item => item.id === Number(id))?.name || `员工${id}`;
}

function departmentLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function formatAmount(value?: number, currency?: string) {
	if (value == null) {
		return '-';
	}

	return `${currency || 'CNY'} ${Number(value).toFixed(2)}`;
}

function resolveCurrentUserId() {
	const currentUserId = Number(user.info?.id || 0);
	return currentUserId || undefined;
}

function resolveCurrentDepartmentId() {
	const currentDepartmentId = Number(user.info?.departmentId || 0);
	return currentDepartmentId || undefined;
}

function normalizeOptionalText(value?: string | null) {
	const normalized = String(value || '').trim();
	return normalized || undefined;
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
.purchase-order-page {
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
