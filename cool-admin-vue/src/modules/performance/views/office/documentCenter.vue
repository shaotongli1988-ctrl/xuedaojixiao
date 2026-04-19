<!-- 文件职责：承接主题21文件管理的列表、统计、详情、新增、编辑和删除元数据主链；不负责目录树、权限继承、真实文件上传器或二进制内容下载；依赖 documentCenter service 与共享权限工具；维护重点是页面只消费冻结允许的元数据字段，且状态切换只在 HR 管理员权限内进行。 -->
<template>
	<div v-if="canAccess" class="document-center-page">
		<el-card shadow="never">
			<div class="document-center-page__toolbar">
				<div class="document-center-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="文件名称 / 文件编号"
						clearable
						style="width: 240px"
						@keyup.enter="applyListFilters"
					/>
					<el-select
						v-model="filters.category"
						placeholder="分类"
						clearable
						style="width: 150px"
					>
						<el-option
							v-for="item in categoryOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filters.confidentiality"
						placeholder="密级"
						clearable
						style="width: 150px"
					>
						<el-option
							v-for="item in confidentialityOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filters.storage"
						placeholder="存储"
						clearable
						style="width: 150px"
					>
						<el-option
							v-for="item in storageOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 150px"
					>
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="document-center-page__toolbar-right">
					<el-button @click="applyListFilters">查询</el-button>
					<el-button @click="resetListFilters">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增文件元数据
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row v-if="showStatsSection" :gutter="16">
			<el-col v-for="card in metricCards" :key="card.label" :xs="24" :sm="12" :lg="8">
				<el-card shadow="never">
					<div class="document-center-page__metric-label">{{ card.label }}</div>
					<div class="document-center-page__metric-value">{{ card.value }}</div>
					<div class="document-center-page__metric-helper">{{ card.helper }}</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="document-center-page__header">
					<div class="document-center-page__header-main">
						<h2>文件管理</h2>
						<el-tag effect="plain">主题 21</el-tag>
						<el-tag effect="plain" type="info">HR 管理员</el-tag>
					</div>
					<el-alert
						title="首批只维护文件元数据台账与统计，不展示真实文件内容、存储路径、外部协作链接或权限继承链路。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="fileNo" label="文件编号" min-width="140" />
				<el-table-column prop="fileName" label="文件名称" min-width="220" />
				<el-table-column label="分类" min-width="120">
					<template #default="{ row }">
						{{ categoryLabel(row.category) }}
					</template>
				</el-table-column>
				<el-table-column label="类型" width="100">
					<template #default="{ row }">
						{{ fileTypeLabel(row.fileType) }}
					</template>
				</el-table-column>
				<el-table-column prop="ownerName" label="负责人" min-width="120" />
				<el-table-column prop="department" label="部门" min-width="120" />
				<el-table-column label="存储" width="100">
					<template #default="{ row }">
						{{ storageLabel(row.storage) }}
					</template>
				</el-table-column>
				<el-table-column label="密级" width="100">
					<template #default="{ row }">
						<el-tag :type="confidentialityTagType(row.confidentiality)" effect="plain">
							{{ confidentialityLabel(row.confidentiality) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="version" label="版本" width="100" />
				<el-table-column prop="sizeMb" label="容量(MB)" width="110">
					<template #default="{ row }">
						{{ formatDecimal(row.sizeMb) }}
					</template>
				</el-table-column>
				<el-table-column prop="downloadCount" label="下载" width="90">
					<template #default="{ row }">
						{{ row.downloadCount ?? 0 }}
					</template>
				</el-table-column>
				<el-table-column prop="expireDate" label="失效日期" min-width="130">
					<template #default="{ row }">
						{{ row.expireDate || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170">
					<template #default="{ row }">
						{{ row.updateTime || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" min-width="220">
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

			<div class="document-center-page__pagination">
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

		<el-drawer
			v-model="detailVisible"
			title="文件元数据详情"
			size="720px"
			destroy-on-close
		>
			<el-descriptions v-if="detailRecord" :column="2" border>
				<el-descriptions-item label="文件编号">
					{{ detailRecord.fileNo }}
				</el-descriptions-item>
				<el-descriptions-item label="文件名称">
					{{ detailRecord.fileName }}
				</el-descriptions-item>
				<el-descriptions-item label="分类">
					{{ categoryLabel(detailRecord.category) }}
				</el-descriptions-item>
				<el-descriptions-item label="文件类型">
					{{ fileTypeLabel(detailRecord.fileType) }}
				</el-descriptions-item>
				<el-descriptions-item label="存储">
					{{ storageLabel(detailRecord.storage) }}
				</el-descriptions-item>
				<el-descriptions-item label="密级">
					<el-tag :type="confidentialityTagType(detailRecord.confidentiality)" effect="plain">
						{{ confidentialityLabel(detailRecord.confidentiality) }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="负责人">
					{{ detailRecord.ownerName || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="部门">
					{{ detailRecord.department || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="状态">
					<el-tag :type="statusTagType(detailRecord.status)">
						{{ statusLabel(detailRecord.status) }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="版本">
					{{ detailRecord.version || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="容量(MB)">
					{{ formatDecimal(detailRecord.sizeMb) }}
				</el-descriptions-item>
				<el-descriptions-item label="下载次数">
					{{ detailRecord.downloadCount ?? 0 }}
				</el-descriptions-item>
				<el-descriptions-item label="失效日期">
					{{ detailRecord.expireDate || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ detailRecord.updateTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="标签" :span="2">
					<div class="document-center-page__tag-list">
						<el-tag
							v-for="tag in detailRecord.tags || []"
							:key="tag"
							effect="plain"
							size="small"
						>
							{{ tag }}
						</el-tag>
						<span v-if="!detailRecord.tags?.length">-</span>
					</div>
				</el-descriptions-item>
				<el-descriptions-item label="备注" :span="2">
					{{ detailRecord.notes || '-' }}
				</el-descriptions-item>
			</el-descriptions>
		</el-drawer>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑文件元数据' : '新增文件元数据'"
			width="820px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingRecord?.id ? '编辑可维护元数据并执行状态切换；已归档文件不允许继续编辑。' : '新建记录默认保存为 draft，后续在编辑时可转为 review / published / archived。'"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="文件编号" prop="fileNo">
							<el-input v-model="form.fileNo" placeholder="例如 DOC-2026-001" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="文件名称" prop="fileName">
							<el-input v-model="form.fileName" placeholder="请输入文件名称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="分类" prop="category">
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
						<el-form-item label="文件类型" prop="fileType">
							<el-select v-model="form.fileType" style="width: 100%">
								<el-option
									v-for="item in fileTypeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="存储" prop="storage">
							<el-select v-model="form.storage" style="width: 100%">
								<el-option
									v-for="item in storageOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="密级" prop="confidentiality">
							<el-select v-model="form.confidentiality" style="width: 100%">
								<el-option
									v-for="item in confidentialityOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="负责人" prop="ownerName">
							<el-input v-model="form.ownerName" placeholder="请输入负责人姓名" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="部门" prop="department">
							<el-input v-model="form.department" placeholder="请输入所属部门" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="版本" prop="version">
							<el-input v-model="form.version" placeholder="例如 v1.0.0" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="失效日期">
							<el-date-picker
								v-model="form.expireDate"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="容量(MB)">
							<el-input-number
								v-model="form.sizeMb"
								:min="0"
								:step="0.1"
								:precision="1"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" style="width: 100%" :disabled="!editingRecord?.id">
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

				<el-form-item label="标签">
					<el-input
						v-model="form.tagsText"
						placeholder="多个标签用中文逗号、英文逗号或空格分隔"
					/>
				</el-form-item>
				<el-form-item label="备注">
					<el-input
						v-model="form.notes"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="仅填写元数据备注，不粘贴正文或真实存储路径"
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
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-office-document-center'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceDocumentCenterService } from '../../service/documentCenter';
import {
	type DocumentCenterCategory,
	type DocumentCenterConfidentiality,
	type DocumentCenterFileType,
	type DocumentCenterRecord,
	type DocumentCenterStats,
	type DocumentCenterStatus,
	type DocumentCenterStorage,
	createEmptyDocumentCenter
} from '../../types';

interface DocumentCenterFormModel {
	fileNo: string;
	fileName: string;
	category: DocumentCenterCategory;
	fileType: DocumentCenterFileType;
	storage: DocumentCenterStorage;
	confidentiality: DocumentCenterConfidentiality;
	ownerName: string;
	department: string;
	status: DocumentCenterStatus;
	version: string;
	sizeMb: number;
	expireDate: string;
	tagsText: string;
	notes: string;
}

const detailVisible = ref(false);
const formVisible = ref(false);
const submitLoading = ref(false);
const detailRecord = ref<DocumentCenterRecord | null>(null);
const editingRecord = ref<DocumentCenterRecord | null>(null);
const formRef = ref<FormInstance>();
const stats = ref<DocumentCenterStats>(createEmptyStats());

const statusOptions: Array<{ label: string; value: DocumentCenterStatus }> = [
	{ label: '草稿', value: 'draft' },
	{ label: '待审核', value: 'review' },
	{ label: '已发布', value: 'published' },
	{ label: '已归档', value: 'archived' }
];

const categoryOptions: Array<{ label: string; value: DocumentCenterCategory }> = [
	{ label: '制度', value: 'policy' },
	{ label: '流程', value: 'process' },
	{ label: '模板', value: 'template' },
	{ label: '合同', value: 'contract' },
	{ label: '归档', value: 'archive' },
	{ label: '其他', value: 'other' }
];

const fileTypeOptions: Array<{ label: string; value: DocumentCenterFileType }> = [
	{ label: 'PDF', value: 'pdf' },
	{ label: 'DOC', value: 'doc' },
	{ label: 'XLS', value: 'xls' },
	{ label: 'PPT', value: 'ppt' },
	{ label: '图片', value: 'img' },
	{ label: 'ZIP', value: 'zip' },
	{ label: '其他', value: 'other' }
];

const storageOptions: Array<{ label: string; value: DocumentCenterStorage }> = [
	{ label: '本地', value: 'local' },
	{ label: '云端', value: 'cloud' },
	{ label: '混合', value: 'hybrid' }
];

const confidentialityOptions: Array<{ label: string; value: DocumentCenterConfidentiality }> = [
	{ label: '公开', value: 'public' },
	{ label: '内部', value: 'internal' },
	{ label: '机密', value: 'secret' }
];

const rules = {
	fileNo: [{ required: true, message: '请输入文件编号', trigger: 'blur' }],
	fileName: [{ required: true, message: '请输入文件名称', trigger: 'blur' }],
	category: [{ required: true, message: '请选择分类', trigger: 'change' }],
	fileType: [{ required: true, message: '请选择文件类型', trigger: 'change' }],
	storage: [{ required: true, message: '请选择存储', trigger: 'change' }],
	confidentiality: [{ required: true, message: '请选择密级', trigger: 'change' }],
	ownerName: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
	department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
	version: [{ required: true, message: '请输入版本', trigger: 'blur' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const form = reactive<DocumentCenterFormModel>(createEmptyForm());

const canAccess = computed(() => checkPerm(performanceDocumentCenterService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceDocumentCenterService.permission.info));
const showStatsSection = computed(() => checkPerm(performanceDocumentCenterService.permission.stats));
const showAddButton = computed(() => checkPerm(performanceDocumentCenterService.permission.add));
const showEditButton = computed(() => checkPerm(performanceDocumentCenterService.permission.update));
const showDeleteButton = computed(() => checkPerm(performanceDocumentCenterService.permission.delete));

const documentList = useListPage({
	createFilters: () => ({
		keyword: '',
		status: '' as DocumentCenterStatus | '',
		category: '' as DocumentCenterCategory | '',
		confidentiality: '' as DocumentCenterConfidentiality | '',
		storage: '' as DocumentCenterStorage | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: params =>
		performanceDocumentCenterService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: normalizeOptionalText(params.keyword),
			status: params.status || undefined,
			category: params.category || undefined,
			confidentiality: params.confidentiality || undefined,
			storage: params.storage || undefined
		}),
	onError: (error: any) => {
		ElMessage.error(error?.message || '文件列表加载失败');
	}
});

const rows = documentList.rows;
const tableLoading = documentList.loading;
const filters = documentList.filters;
const pager = documentList.pager;

const metricCards = computed(() => [
	{ label: '文件总数', value: stats.value.total || 0, helper: '当前筛选条件下的台账数量' },
	{ label: '已发布', value: stats.value.publishedCount || 0, helper: '可作为有效资料使用' },
	{ label: '待审核', value: stats.value.reviewCount || 0, helper: '待后台管理复核发布' },
	{ label: '已归档', value: stats.value.archivedCount || 0, helper: '历史版本与失效资料' },
	{ label: '总容量(MB)', value: formatDecimal(stats.value.totalSizeMb), helper: '仅统计元数据容量摘要' },
	{ label: '累计下载', value: stats.value.totalDownloads || 0, helper: '用于判断资料热度' }
]);

const formStatusOptions = computed(() => {
	if (!editingRecord.value?.id) {
		return [{ label: '草稿', value: 'draft' as DocumentCenterStatus }];
	}

	if (editingRecord.value.status === 'published') {
		return [
			{ label: '保持已发布', value: 'published' as DocumentCenterStatus },
			{ label: '归档', value: 'archived' as DocumentCenterStatus }
		];
	}

	if (editingRecord.value.status === 'review') {
		return [
			{ label: '待审核', value: 'review' as DocumentCenterStatus },
			{ label: '发布', value: 'published' as DocumentCenterStatus },
			{ label: '归档', value: 'archived' as DocumentCenterStatus }
		];
	}

	return [
		{ label: '草稿', value: 'draft' as DocumentCenterStatus },
		{ label: '提交审核', value: 'review' as DocumentCenterStatus },
		{ label: '发布', value: 'published' as DocumentCenterStatus },
		{ label: '归档', value: 'archived' as DocumentCenterStatus }
	];
});

onMounted(() => {
	if (canAccess.value) {
		void syncPage();
	}
});

async function syncPage() {
	await Promise.all([documentList.reload(), loadStats()]);
}

async function loadStats() {
	if (!showStatsSection.value) {
		stats.value = createEmptyStats();
		return;
	}

	try {
		stats.value = await performanceDocumentCenterService.fetchStats({
			keyword: normalizeOptionalText(filters.keyword),
			status: filters.status || undefined,
			category: filters.category || undefined,
			confidentiality: filters.confidentiality || undefined,
			storage: filters.storage || undefined
		});
	} catch (error: any) {
		ElMessage.error(error?.message || '文件统计加载失败');
	}
}

function changeListPage(page: number) {
	void documentList.goToPage(page);
}

function applyListFilters() {
	void Promise.all([documentList.search(), loadStats()]);
}

function resetListFilters() {
	void Promise.all([documentList.reset(), loadStats()]);
}

function openCreate() {
	editingRecord.value = null;
	Object.assign(form, createEmptyForm());
	formVisible.value = true;
}

async function openDetail(row: DocumentCenterRecord) {
	const detail = await fetchDetail(row.id);

	if (!detail) {
		return;
	}

	detailRecord.value = detail;
	detailVisible.value = true;
}

async function openEdit(row: DocumentCenterRecord) {
	const detail = await fetchDetail(row.id);

	if (!detail) {
		return;
	}

	if (detail.status === 'archived') {
		ElMessage.warning('已归档文件只允许查看，不允许继续编辑');
		return;
	}

	editingRecord.value = detail;
	Object.assign(form, mapRecordToForm(detail));
	formVisible.value = true;
}

async function fetchDetail(id?: number) {
	if (!id) {
		return null;
	}

	try {
		return await performanceDocumentCenterService.fetchInfo({ id });
	} catch (error: any) {
		ElMessage.error(error?.message || '文件详情加载失败');
		return null;
	}
}

async function submitForm() {
	const valid = await formRef.value?.validate().catch(() => false);

	if (!valid) {
		return;
	}

	submitLoading.value = true;

	try {
		const payload = buildPayload();

		if (editingRecord.value?.id) {
			await performanceDocumentCenterService.updateDocument({
				id: editingRecord.value.id,
				...payload
			});
			ElMessage.success('文件元数据已更新');
		} else {
			await performanceDocumentCenterService.createDocument(payload);
			ElMessage.success('文件元数据已创建');
		}

		formVisible.value = false;
		await syncPage();
	} catch (error: any) {
		ElMessage.error(error?.message || '文件元数据保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: DocumentCenterRecord) {
	if (!row.id) {
		return;
	}

	try {
		await ElMessageBox.confirm(
			`确认删除文件元数据“${row.fileName || row.fileNo}”吗？此操作只移除台账记录，不代表真实文件被物理删除。`,
			'删除确认',
			{ type: 'warning' }
		);
		await performanceDocumentCenterService.removeDocument({ ids: [row.id] });
		ElMessage.success('文件元数据已删除');
		await syncPage();
	} catch (error: any) {
		if (error !== 'cancel') {
			ElMessage.error(error?.message || '文件元数据删除失败');
		}
	}
}

function canEdit(row: DocumentCenterRecord) {
	return showEditButton.value && row.status !== 'archived';
}

function canDelete(_row: DocumentCenterRecord) {
	return showDeleteButton.value;
}

function buildPayload(): Partial<DocumentCenterRecord> {
	return {
		fileNo: form.fileNo.trim(),
		fileName: form.fileName.trim(),
		category: form.category,
		fileType: form.fileType,
		storage: form.storage,
		confidentiality: form.confidentiality,
		ownerName: form.ownerName.trim(),
		department: form.department.trim(),
		status: editingRecord.value?.id ? form.status : 'draft',
		version: form.version.trim(),
		sizeMb: Number(form.sizeMb || 0),
		expireDate: normalizeOptionalText(form.expireDate),
		tags: splitCommaText(form.tagsText),
		notes: normalizeOptionalText(form.notes)
	};
}

function mapRecordToForm(record: DocumentCenterRecord): DocumentCenterFormModel {
	return {
		fileNo: record.fileNo || '',
		fileName: record.fileName || '',
		category: record.category || 'policy',
		fileType: record.fileType || 'pdf',
		storage: record.storage || 'local',
		confidentiality: record.confidentiality || 'internal',
		ownerName: record.ownerName || '',
		department: record.department || '',
		status: record.status || 'draft',
		version: record.version || 'v1.0.0',
		sizeMb: Number(record.sizeMb || 0),
		expireDate: record.expireDate || '',
		tagsText: (record.tags || []).join(', '),
		notes: record.notes || ''
	};
}

function createEmptyForm(): DocumentCenterFormModel {
	const record = createEmptyDocumentCenter();
	return {
		fileNo: record.fileNo,
		fileName: record.fileName,
		category: record.category,
		fileType: record.fileType,
		storage: record.storage,
		confidentiality: record.confidentiality,
		ownerName: record.ownerName,
		department: record.department,
		status: record.status || 'draft',
		version: record.version,
		sizeMb: Number(record.sizeMb || 0),
		expireDate: record.expireDate || '',
		tagsText: '',
		notes: record.notes || ''
	};
}

function createEmptyStats(): DocumentCenterStats {
	return {
		total: 0,
		publishedCount: 0,
		reviewCount: 0,
		archivedCount: 0,
		totalSizeMb: 0,
		totalDownloads: 0
	};
}

function categoryLabel(value?: DocumentCenterCategory) {
	return categoryOptions.find(item => item.value === value)?.label || value || '-';
}

function fileTypeLabel(value?: DocumentCenterFileType) {
	return fileTypeOptions.find(item => item.value === value)?.label || value || '-';
}

function storageLabel(value?: DocumentCenterStorage) {
	return storageOptions.find(item => item.value === value)?.label || value || '-';
}

function confidentialityLabel(value?: DocumentCenterConfidentiality) {
	return confidentialityOptions.find(item => item.value === value)?.label || value || '-';
}

function confidentialityTagType(value?: DocumentCenterConfidentiality) {
	if (value === 'secret') {
		return 'danger';
	}

	if (value === 'internal') {
		return 'warning';
	}

	return 'success';
}

function statusLabel(value?: DocumentCenterStatus) {
	return statusOptions.find(item => item.value === value)?.label || value || '-';
}

function statusTagType(value?: DocumentCenterStatus) {
	if (value === 'published') {
		return 'success';
	}

	if (value === 'review') {
		return 'warning';
	}

	if (value === 'archived') {
		return 'info';
	}

	return undefined;
}

function formatDecimal(value?: number | null) {
	return Number(value || 0).toFixed(1);
}

function splitCommaText(value?: string | null) {
	return String(value || '')
		.split(/[，,\s]+/)
		.map(item => item.trim())
		.filter(Boolean);
}

function normalizeOptionalText(value?: string | null) {
	const nextValue = String(value || '').trim();
	return nextValue || undefined;
}
</script>

<style lang="scss" scoped>
.document-center-page {
	display: grid;
	gap: 16px;

	&__toolbar,
	&__toolbar-left,
	&__toolbar-right,
	&__header-main,
	&__tag-list {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
	}

	&__toolbar {
		justify-content: space-between;
	}

	&__header {
		display: grid;
		gap: 12px;
	}

	&__metric-label,
	&__metric-helper {
		color: var(--el-text-color-secondary);
	}

	&__metric-label,
	&__metric-helper {
		font-size: 12px;
	}

	&__metric-value {
		margin-top: 8px;
		font-size: 28px;
		font-weight: 600;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
	}
}
</style>
