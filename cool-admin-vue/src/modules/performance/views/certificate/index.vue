<!-- 文件职责：承接主题13证书台账的列表、详情、维护、发放和记录查询；不负责自动发证、课程学习过程、证书附件下载或移动端入口；依赖 certificate service、基础用户/部门接口与 Element Plus 组件；维护重点是经理只读、员工无入口，且页面只消费冻结允许的摘要字段。 -->
<template>
	<div v-if="canAccess" class="certificate-page">
		<el-card shadow="never">
			<div class="certificate-page__toolbar">
				<div class="certificate-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="按证书名称或编码筛选"
						clearable
						style="width: 240px"
						@keyup.enter="applyListFilters"
					/>
					<el-input
						v-model="filters.category"
						placeholder="证书分类"
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

				<div class="certificate-page__toolbar-right">
					<el-button @click="applyListFilters">查询</el-button>
					<el-button @click="resetListFilters">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增证书
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="certificate-page__header">
					<div class="certificate-page__header-main">
						<h2>证书管理</h2>
						<el-tag effect="plain">主题 13</el-tag>
					</div>
					<el-tag effect="plain" type="info">{{ isReadOnlyRole ? '经理只读' : 'HR 管理' }}</el-tag>
				</div>
			</template>

			<el-alert
				title="证书首批只做台账与发放记录，不做自动发证，不展示证书附件、扫描件或课程学习过程。"
				type="info"
				:closable="false"
				show-icon
			/>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="name" label="证书名称" min-width="180" />
				<el-table-column prop="code" label="证书编码" min-width="140">
					<template #default="{ row }">
						{{ row.code || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="category" label="证书分类" min-width="140">
					<template #default="{ row }">
						{{ row.category || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="issuer" label="发证机构" min-width="160">
					<template #default="{ row }">
						{{ row.issuer || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="validityMonths" label="有效期(月)" width="110">
					<template #default="{ row }">
						{{ formatInteger(row.validityMonths) }}
					</template>
				</el-table-column>
				<el-table-column prop="issuedCount" label="发放数量" width="110">
					<template #default="{ row }">
						{{ row.issuedCount ?? 0 }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="380">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canViewSourceCourse(row)"
							text
							type="primary"
							@click="goSourceCourse(row.sourceCourseId!)"
						>
							来源课程
						</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button v-if="canIssue(row)" text type="success" @click="openIssue(row)">
							发放
						</el-button>
						<el-button
							v-if="showRecordButton"
							text
							type="warning"
							@click="openRecordDialog(row)"
						>
							记录
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="certificate-page__pagination">
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

		<el-dialog v-model="detailVisible" title="证书详情" width="760px" destroy-on-close>
			<div v-if="detailCertificate">
				<el-alert
					v-if="detailCertificate.status === 'retired'"
					title="当前证书已停用，只允许查看历史摘要，不允许继续维护或发放。"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="证书名称">
						{{ detailCertificate.name }}
					</el-descriptions-item>
					<el-descriptions-item label="证书编码">
						{{ detailCertificate.code || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="证书分类">
						{{ detailCertificate.category || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="发证机构">
						{{ detailCertificate.issuer || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="有效期(月)">
						{{ formatInteger(detailCertificate.validityMonths) }}
					</el-descriptions-item>
					<el-descriptions-item label="来源课程 ID">
						{{ formatInteger(detailCertificate.sourceCourseId) }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailCertificate.status)">
							{{ statusLabel(detailCertificate.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="发放数量">
						{{ detailCertificate.issuedCount ?? 0 }}
					</el-descriptions-item>
					<el-descriptions-item label="说明" :span="2">
						{{ detailCertificate.description || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailCertificate.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailCertificate.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>

			<template #footer>
				<el-button @click="detailVisible = false">关闭</el-button>
				<el-button
					v-if="showSourceCourseButton && detailCertificate?.sourceCourseId"
					type="primary"
					@click="goSourceCourse(detailCertificate.sourceCourseId)"
				>
					查看来源课程
				</el-button>
			</template>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingCertificate?.id ? '编辑证书' : '新增证书'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingCertificate?.status === 'active' ? '启用中证书只允许保持 active 或停用为 retired。' : '新建证书默认保存为 draft，可在编辑时启用。'"
					:type="editingCertificate?.status === 'active' ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="证书名称" prop="name">
							<el-input
								v-model="form.name"
								maxlength="100"
								show-word-limit
								placeholder="请输入证书名称"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="证书编码">
							<el-input
								v-model="form.code"
								maxlength="50"
								show-word-limit
								placeholder="可为空，如填写需唯一"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="证书分类">
							<el-input
								v-model="form.category"
								maxlength="50"
								show-word-limit
								placeholder="自由文本"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="发证机构">
							<el-input
								v-model="form.issuer"
								maxlength="100"
								show-word-limit
								placeholder="请输入发证机构摘要"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="有效期(月)">
							<el-input-number
								v-model="validityMonthsModel"
								:min="0"
								:precision="0"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源课程 ID">
							<el-input-number
								v-model="sourceCourseIdModel"
								:min="1"
								:precision="0"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col v-if="editingCertificate?.id" :span="12">
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

				<el-form-item label="证书说明">
					<el-input
						v-model="form.description"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="请输入证书说明"
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

		<el-dialog v-model="issueVisible" title="发放证书" width="620px" destroy-on-close>
			<el-form ref="issueFormRef" :model="issueForm" :rules="issueRules" label-width="110px">
				<el-alert
					title="发放动作只生成证书台账记录，不会自动创建课程结业、学习过程或附件。"
					type="info"
					:closable="false"
					show-icon
				/>
				<el-form-item label="证书">
					<el-input :model-value="issueTarget?.name || '-'" disabled />
				</el-form-item>
				<el-form-item label="员工" prop="employeeId">
					<el-select
						v-model="issueForm.employeeId"
						placeholder="请选择员工"
						filterable
						clearable
						style="width: 100%"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="发放时间" prop="issuedAt">
					<el-date-picker
						v-model="issueForm.issuedAt"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						placeholder="请选择发放时间"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="来源课程 ID">
					<el-input-number
						v-model="issueSourceCourseIdModel"
						:min="1"
						:precision="0"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="备注摘要">
					<el-input
						v-model="issueForm.remark"
						type="textarea"
						:rows="3"
						maxlength="200"
						show-word-limit
						placeholder="可选"
					/>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="issueVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitIssue">
					确认发放
				</el-button>
			</template>
		</el-dialog>

		<el-dialog
			v-model="recordVisible"
			title="证书发放记录"
			width="960px"
			destroy-on-close
		>
			<div class="certificate-page__record-toolbar">
				<el-select
					v-model="recordFilters.employeeId"
					placeholder="员工"
					clearable
					filterable
					style="width: 200px"
				>
					<el-option
						v-for="item in userOptions"
						:key="item.id"
						:label="item.name"
						:value="item.id"
					/>
				</el-select>
				<el-select
					v-model="recordFilters.departmentId"
					placeholder="部门"
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
				<el-select
					v-model="recordFilters.status"
					placeholder="记录状态"
					clearable
					style="width: 160px"
				>
					<el-option
						v-for="item in recordStatusOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>
				<el-button @click="refreshRecords">查询</el-button>
				<el-button @click="resetRecordFilters">重置</el-button>
			</div>

			<el-alert
				title="记录页只展示获得记录摘要字段，不展示证书附件、扫描件或课程学习过程。"
				type="info"
				:closable="false"
				show-icon
			/>

			<el-table :data="recordRows" border v-loading="recordLoading">
				<el-table-column prop="certificateName" label="证书" min-width="180" />
				<el-table-column prop="employeeName" label="员工" min-width="140">
					<template #default="{ row }">
						{{ row.employeeName || employeeLabel(row.employeeId) }}
					</template>
				</el-table-column>
				<el-table-column prop="departmentName" label="部门" min-width="160">
					<template #default="{ row }">
						{{ row.departmentName || departmentLabel(row.departmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="issuedAt" label="发放时间" min-width="180" />
				<el-table-column prop="issuedBy" label="发放人" min-width="140">
					<template #default="{ row }">
						{{ row.issuedBy || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="sourceCourseId" label="来源课程 ID" width="120">
					<template #default="{ row }">
						{{ formatInteger(row.sourceCourseId) }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="recordStatusTagType(row.status)">
							{{ recordStatusLabel(row.status) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" min-width="220">
					<template #default="{ row }">
						<el-button
							v-if="canViewCapabilityPortrait(row)"
							text
							type="primary"
							@click="goCapabilityPortrait(row.employeeId!)"
						>
							能力画像
						</el-button>
						<el-button
							v-if="canViewSourceCourse(row)"
							text
							type="primary"
							@click="goSourceCourse(row.sourceCourseId!)"
						>
							来源课程
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="certificate-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="recordPagination.page"
					:page-size="recordPagination.size"
					:total="recordPagination.total"
					@current-change="changeRecordPage"
				/>
			</div>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-certificate'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { useRoute, useRouter } from 'vue-router';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceCapabilityService } from '../../service/capability';
import { performanceCourseService } from '../../service/course';
import { performanceCertificateService } from '../../service/certificate';
import {
	loadDepartmentOptions,
	loadUserOptions
} from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import type {
	CertificateLedgerRecord,
	CertificateRecord,
	CertificateRecordStatus,
	CertificateStatus,
	UserOption
} from '../../types';
import { createEmptyCertificate } from '../../types';

interface DepartmentOption {
	id: number;
	label: string;
}

const recordRows = ref<CertificateLedgerRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const recordLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const issueVisible = ref(false);
const recordVisible = ref(false);
const editingCertificate = ref<CertificateRecord | null>(null);
const detailCertificate = ref<CertificateRecord | null>(null);
const issueTarget = ref<CertificateRecord | null>(null);
const formRef = ref<FormInstance>();
const issueFormRef = ref<FormInstance>();
const route = useRoute();
const router = useRouter();

const recordFilters = reactive({
	certificateId: undefined as number | undefined,
	employeeId: undefined as number | undefined,
	departmentId: undefined as number | undefined,
	status: '' as CertificateRecordStatus | ''
});

const recordPagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<CertificateRecord>(createEmptyCertificate());
const issueForm = reactive({
	employeeId: undefined as number | undefined,
	issuedAt: '',
	remark: '',
	sourceCourseId: undefined as number | undefined
});

const rules: FormRules = {
	name: [
		{ required: true, message: '请输入证书名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '证书名称长度需在 1-100 之间', trigger: 'blur' }
	],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const issueRules: FormRules = {
	employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
	issuedAt: [{ required: true, message: '请选择发放时间', trigger: 'change' }]
};

const filterStatusOptions: Array<{ label: string; value: CertificateStatus }> = [
	{ label: '草稿', value: 'draft' },
	{ label: '已启用', value: 'active' },
	{ label: '已停用', value: 'retired' }
];

const recordStatusOptions: Array<{ label: string; value: CertificateRecordStatus }> = [
	{ label: '已发放', value: 'issued' },
	{ label: '已撤销', value: 'revoked' }
];

const canAccess = computed(() => checkPerm(performanceCertificateService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceCertificateService.permission.info));
const showAddButton = computed(() => checkPerm(performanceCertificateService.permission.add));
const showSourceCourseButton = computed(
	() =>
		checkPerm(performanceCourseService.permission.page) &&
		checkPerm(performanceCourseService.permission.info)
);
const showCapabilityPortraitButton = computed(
	() =>
		checkPerm(performanceCapabilityService.permission.page) &&
		checkPerm(performanceCapabilityService.permission.portraitInfo)
);
const showRecordButton = computed(() => checkPerm(performanceCertificateService.permission.recordPage));
const isReadOnlyRole = computed(
	() =>
		!showAddButton.value &&
		!checkPerm(performanceCertificateService.permission.update) &&
		!checkPerm(performanceCertificateService.permission.issue)
);
const formStatusOptions = computed<Array<{ label: string; value: CertificateStatus }>>(() => {
	if (!editingCertificate.value?.id) {
		return [{ label: '草稿', value: 'draft' }];
	}

	if (editingCertificate.value.status === 'active') {
		return [
			{ label: '已启用', value: 'active' },
			{ label: '已停用', value: 'retired' }
		];
	}

	return [
		{ label: '草稿', value: 'draft' },
		{ label: '已启用', value: 'active' }
	];
});
const validityMonthsModel = computed<number | undefined>({
	get: () => form.validityMonths ?? undefined,
	set: value => {
		form.validityMonths = value ?? null;
	}
});
const sourceCourseIdModel = computed<number | undefined>({
	get: () => form.sourceCourseId ?? undefined,
	set: value => {
		form.sourceCourseId = value ?? null;
	}
});
const issueSourceCourseIdModel = computed<number | undefined>({
	get: () => issueForm.sourceCourseId,
	set: value => {
		issueForm.sourceCourseId = value;
	}
});
const certificateList = useListPage({
	createFilters: () => ({
		keyword: '',
		category: '',
		status: '' as CertificateStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: params =>
		performanceCertificateService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword ? String(params.keyword) : undefined,
			category: params.category ? String(params.category) : undefined,
			status: params.status ? String(params.status) : undefined
		}),
	onError: (error: any) => {
		ElMessage.error(error.message || '证书列表加载失败');
	}
});
const rows = certificateList.rows;
const tableLoading = certificateList.loading;
const filters = certificateList.filters;
const pager = certificateList.pager;

onMounted(async () => {
	await Promise.all([loadUsers(), loadDepartments()]);
	await syncList();
	await consumeCreatePresetQuery();
	await consumeRecordPresetQuery();
});

watch(
	() => route.fullPath,
	() => {
		void consumeCreatePresetQuery();
		void consumeRecordPresetQuery();
	}
);

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 200
			}),
		(error: any) => {
			ElMessage.warning(error.message || '员工选项加载失败');
		}
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		(error: any) => {
			ElMessage.warning(error.message || '部门选项加载失败');
		}
	);
}

async function syncList() {
	await certificateList.reload();
}

async function refreshRecords() {
	if (!showRecordButton.value) {
		return;
	}

	recordLoading.value = true;

	try {
		const result = await performanceCertificateService.fetchRecordPage({
			page: recordPagination.page,
			size: recordPagination.size,
			certificateId: recordFilters.certificateId,
			employeeId: recordFilters.employeeId,
			departmentId: recordFilters.departmentId,
			status: recordFilters.status || undefined
		});

		recordRows.value = result.list || [];
		recordPagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '证书记录加载失败');
	} finally {
		recordLoading.value = false;
	}
}

function changeListPage(page: number) {
	void certificateList.goToPage(page);
}

function changeRecordPage(page: number) {
	recordPagination.page = page;
	refreshRecords();
}

function applyListFilters() {
	void certificateList.search();
}

function resetListFilters() {
	void certificateList.reset();
}

function resetRecordFilters() {
	recordFilters.employeeId = undefined;
	recordFilters.departmentId = undefined;
	recordFilters.status = '';
	recordPagination.page = 1;
	refreshRecords();
}

function openCreate() {
	editingCertificate.value = null;
	Object.assign(form, createEmptyCertificate());
	formVisible.value = true;
}

async function consumeCreatePresetQuery() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openCreate', 'sourceCourseId'],
		parse: query => ({
			shouldOpenCreate: firstQueryValue(query.openCreate) === '1',
			sourceCourseId: normalizeQueryNumber(query.sourceCourseId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenCreate && showAddButton.value),
		consume: payload => {
			openCreate();
			form.sourceCourseId = payload.sourceCourseId ?? null;
		}
	});
}

async function consumeRecordPresetQuery() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openRecord', 'employeeId'],
		parse: query => ({
			shouldOpenRecord: firstQueryValue(query.openRecord) === '1',
			employeeId: normalizeQueryNumber(query.employeeId)
		}),
		shouldConsume: payload =>
			Boolean(payload.shouldOpenRecord && showRecordButton.value && payload.employeeId),
		consume: async payload => {
			recordFilters.certificateId = undefined;
			recordFilters.employeeId = payload.employeeId;
			recordFilters.departmentId = undefined;
			recordFilters.status = '';
			recordPagination.page = 1;
			recordVisible.value = true;
			await refreshRecords();
		}
	});
}

async function openDetail(row: CertificateRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailCertificate.value = await performanceCertificateService.fetchInfo({ id: row.id });
		detailVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '证书详情加载失败');
	}
}

async function goSourceCourse(sourceCourseId: number) {
	detailVisible.value = false;

	await router.push({
		path: '/performance/course',
		query: {
			openDetail: '1',
			courseId: String(sourceCourseId)
		}
	});
}

async function goCapabilityPortrait(employeeId: number) {
	recordVisible.value = false;

	await router.push({
		path: '/performance/capability',
		query: {
			openPortrait: '1',
			employeeId: String(employeeId)
		}
	});
}

async function openEdit(row: CertificateRecord) {
	if (!row.id) {
		return;
	}

	submitLoading.value = true;

	try {
		const detail = await performanceCertificateService.fetchInfo({ id: row.id });
		editingCertificate.value = detail;
		Object.assign(form, createEmptyCertificate(), detail);
		formVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '证书详情加载失败');
	} finally {
		submitLoading.value = false;
	}
}

function openIssue(row: CertificateRecord) {
	issueTarget.value = row;
	issueForm.employeeId = undefined;
	issueForm.issuedAt = '';
	issueForm.remark = '';
	issueForm.sourceCourseId = normalizeOptionalNumber(row.sourceCourseId) ?? undefined;
	issueVisible.value = true;
}

async function openRecordDialog(row: CertificateRecord) {
	recordFilters.certificateId = row.id;
	recordFilters.employeeId = undefined;
	recordFilters.departmentId = undefined;
	recordFilters.status = '';
	recordPagination.page = 1;
	recordVisible.value = true;
	await refreshRecords();
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
			issuer: normalizeOptionalText(form.issuer),
			description: normalizeOptionalText(form.description),
			validityMonths: normalizeOptionalNumber(form.validityMonths),
			sourceCourseId: normalizeOptionalNumber(form.sourceCourseId),
			status: editingCertificate.value?.id
				? form.status || editingCertificate.value.status || 'draft'
				: 'draft'
		};

		if (editingCertificate.value?.id) {
			await performanceCertificateService.updateCertificate({
				id: editingCertificate.value.id,
				...payload
			});
			ElMessage.success('证书已更新');
		} else {
			await performanceCertificateService.createCertificate(payload);
			ElMessage.success('证书已创建');
		}

		formVisible.value = false;
		await syncList();
	} catch (error: any) {
		ElMessage.error(error.message || '证书保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function submitIssue() {
	if (!issueFormRef.value || !issueTarget.value?.id) {
		return;
	}

	await issueFormRef.value.validate();
	submitLoading.value = true;

	try {
		await performanceCertificateService.issueCertificate({
			certificateId: issueTarget.value.id,
			employeeId: Number(issueForm.employeeId),
			issuedAt: issueForm.issuedAt,
			remark: normalizeOptionalText(issueForm.remark),
			sourceCourseId: normalizeOptionalNumber(issueForm.sourceCourseId) ?? null
		});

		ElMessage.success('证书已发放');
		issueVisible.value = false;
		await Promise.all([syncList(), recordVisible.value ? refreshRecords() : Promise.resolve()]);
	} catch (error: any) {
		ElMessage.error(error.message || '证书发放失败');
	} finally {
		submitLoading.value = false;
	}
}

function canEdit(row: CertificateRecord) {
	return (
		checkPerm(performanceCertificateService.permission.update) &&
		row.status !== 'retired'
	);
}

function canViewSourceCourse(row: CertificateRecord | CertificateLedgerRecord) {
	return Boolean(row.sourceCourseId) && showSourceCourseButton.value;
}

function canViewCapabilityPortrait(row: CertificateLedgerRecord) {
	return Boolean(row.employeeId) && showCapabilityPortraitButton.value;
}

function canIssue(row: CertificateRecord) {
	return (
		checkPerm(performanceCertificateService.permission.issue) &&
		row.status === 'active'
	);
}

function statusLabel(status?: CertificateStatus) {
	switch (status) {
		case 'active':
			return '已启用';
		case 'retired':
			return '已停用';
		case 'draft':
		default:
			return '草稿';
	}
}

function statusTagType(status?: CertificateStatus) {
	switch (status) {
		case 'active':
			return 'success';
		case 'retired':
			return 'info';
		case 'draft':
		default:
			return 'warning';
	}
}

function recordStatusLabel(status?: CertificateRecordStatus) {
	switch (status) {
		case 'revoked':
			return '已撤销';
		case 'issued':
		default:
			return '已发放';
	}
}

function recordStatusTagType(status?: CertificateRecordStatus) {
	switch (status) {
		case 'revoked':
			return 'danger';
		case 'issued':
		default:
			return 'success';
	}
}

function employeeLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return userOptions.value.find(item => item.id === Number(id))?.name || `员工${id}`;
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function formatInteger(value?: number | null) {
	if (value === null || value === undefined) {
		return '-';
	}

	return String(value);
}

function normalizeOptionalText(value?: string | null) {
	const text = value?.trim();
	return text ? text : undefined;
}

function normalizeOptionalNumber(value?: number | null) {
	if (value === null || value === undefined || Number.isNaN(Number(value))) {
		return undefined;
	}

	return Number(value);
}

</script>

<style lang="scss" scoped>
.certificate-page {
	display: grid;
	gap: 16px;

	&__toolbar,
	&__header,
	&__record-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
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

	&__header-main h2 {
		margin: 0;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
	}
}
</style>
