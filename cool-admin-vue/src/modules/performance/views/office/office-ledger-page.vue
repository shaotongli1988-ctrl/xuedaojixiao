<!-- 文件职责：承接 Theme22 行政协同 HR-only 元数据台账的共享列表、统计、详情与表单主链；不负责真实上传、外部协同或非标准 CRUD 接口；依赖 use-list-page、office service 工厂与 documentCenter 元数据服务；维护重点是 5 个页面共用一套状态机，但保留各自字段语义与权限键。 -->
<template>
	<div v-if="canAccess" class="office-ledger-page">
		<el-card shadow="never">
			<div class="office-ledger-page__header">
				<div>
					<div class="office-ledger-page__eyebrow">{{ config.phaseLabel }}</div>
					<div class="office-ledger-page__title-row">
						<h2>{{ config.title }}</h2>
						<el-tag effect="plain">{{ config.badgeLabel }}</el-tag>
						<el-tag effect="plain" type="info">{{ config.audienceLabel }}</el-tag>
					</div>
					<p>{{ config.description }}</p>
				</div>
				<el-alert
					:title="config.notice"
					type="info"
					:closable="false"
					show-icon
				/>
			</div>
		</el-card>

		<el-card shadow="never">
			<div class="office-ledger-page__toolbar">
				<div class="office-ledger-page__filters">
					<template v-for="field in config.filters" :key="field.prop">
						<el-input
							v-if="field.type === 'text'"
							v-model="filters[field.prop]"
							:placeholder="field.placeholder || field.label"
							clearable
							:style="{ width: field.width || '220px' }"
							@keyup.enter="applyFilters"
						/>
						<el-select
							v-else-if="field.type === 'select'"
							v-model="filters[field.prop]"
							:placeholder="field.placeholder || field.label"
							clearable
							filterable
							:style="{ width: field.width || '180px' }"
						>
							<el-option
								v-for="item in resolveFieldOptions(field)"
								:key="String(item.value)"
								:label="item.label"
								:value="item.value"
							/>
						</el-select>
					</template>
				</div>
				<div class="office-ledger-page__actions">
					<el-button @click="applyFilters">查询</el-button>
					<el-button @click="resetFilters">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增{{ config.entityLabel }}
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row v-if="showStatsSection" :gutter="16">
			<el-col
				v-for="card in config.statsCards"
				:key="card.key"
				:xs="24"
				:sm="12"
				:lg="6"
			>
				<el-card shadow="never">
					<div class="office-ledger-page__metric-label">{{ card.label }}</div>
					<div class="office-ledger-page__metric-value">
						{{ config.formatStatsValue?.(stats[card.key], card) ?? stats[card.key] ?? 0 }}
					</div>
					<div class="office-ledger-page__metric-helper">{{ card.helper }}</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column
					v-for="column in config.tableColumns"
					:key="column.prop"
					:prop="column.prop"
					:label="column.label"
					:min-width="column.minWidth || 120"
					:width="column.width"
				>
					<template #default="{ row }">
						<el-tag
							v-if="column.tag"
							:type="resolveTagType(column, row)"
							effect="plain"
						>
							{{ renderFieldValue(column, row) }}
						</el-tag>
						<span v-else>
							{{ renderFieldValue(column, row) }}
						</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" min-width="220">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="showEditButton && canEditRecord(row)"
							text
							type="primary"
							@click="openEdit(row)"
						>
							编辑
						</el-button>
						<el-button
							v-if="showDeleteButton && canDeleteRecord(row)"
							text
							type="danger"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="office-ledger-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pager.page"
					:page-size="pager.size"
					:total="pager.total"
					@current-change="changePage"
				/>
			</div>
		</el-card>

		<el-drawer
			v-model="detailVisible"
			:title="`${config.entityLabel}详情`"
			size="760px"
			destroy-on-close
		>
			<el-descriptions v-if="detailRecord" :column="2" border>
				<el-descriptions-item
					v-for="field in config.detailFields"
					:key="field.prop"
					:label="field.label"
					:span="field.span || 1"
				>
					<el-tag
						v-if="field.tag"
						:type="resolveTagType(field, detailRecord)"
						effect="plain"
					>
						{{ renderFieldValue(field, detailRecord) }}
					</el-tag>
					<span v-else>
						{{ renderFieldValue(field, detailRecord) }}
					</span>
				</el-descriptions-item>
			</el-descriptions>
		</el-drawer>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? `编辑${config.entityLabel}` : `新增${config.entityLabel}`"
			:width="config.formWidth || '860px'"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
				<el-alert
					:title="editingRecord?.id ? `编辑 ${config.entityLabel} 元数据；归档记录不可继续维护。` : `新建记录默认只维护元数据，不触发真实上传、物流同步或外部发布。`"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col
						v-for="field in config.formFields"
						:key="field.prop"
						:span="field.span || 12"
					>
						<el-form-item :label="field.label" :prop="field.prop">
							<el-input
								v-if="field.type === 'text'"
								v-model="form[field.prop]"
								:placeholder="field.placeholder || field.label"
							/>
							<el-input
								v-else-if="field.type === 'textarea'"
								v-model="form[field.prop]"
								type="textarea"
								:rows="field.rows || 4"
								:placeholder="field.placeholder || field.label"
							/>
							<el-input
								v-else-if="field.type === 'tags-input'"
								v-model="form[field.prop]"
								placeholder="多个标签使用中文逗号、英文逗号或空格分隔"
							/>
							<el-select
								v-else-if="field.type === 'select'"
								v-model="form[field.prop]"
								clearable
								filterable
								style="width: 100%"
								:placeholder="field.placeholder || field.label"
							>
								<el-option
									v-for="item in resolveFieldOptions(field)"
									:key="String(item.value)"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
							<el-date-picker
								v-else-if="field.type === 'date'"
								v-model="form[field.prop]"
								type="date"
								value-format="YYYY-MM-DD"
								style="width: 100%"
								:placeholder="field.placeholder || field.label"
							/>
							<el-input-number
								v-else-if="field.type === 'number'"
								v-model="form[field.prop]"
								:min="field.min ?? 0"
								:precision="field.precision ?? 0"
								style="width: 100%"
							/>
							<el-select
								v-else-if="field.type === 'document-multi'"
								v-model="form[field.prop]"
								multiple
								filterable
								clearable
								style="width: 100%"
								:placeholder="field.placeholder || field.label"
							>
								<el-option
									v-for="item in documentOptions"
									:key="item.id"
									:label="item.label"
									:value="item.id"
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceDocumentCenterService } from '../../service/documentCenter';

interface OfficeLedgerPermission {
	page: string;
	info: string;
	stats: string;
	add: string;
	update: string;
	delete: string;
}

interface OfficeLedgerService {
	permission: OfficeLedgerPermission;
	fetchPage: (params: any) => Promise<{
		list?: Array<Record<string, any>>;
		pagination?: { total?: number | null } | null;
	}>;
	fetchInfo: (params: { id: number }) => Promise<Record<string, any>>;
	fetchStats: (params?: Record<string, unknown>) => Promise<Record<string, any>>;
	createItem: (payload: Record<string, unknown>) => Promise<unknown>;
	updateItem: (payload: Record<string, unknown> & { id: number }) => Promise<unknown>;
	removeItem: (payload: { ids: number[] }) => Promise<void>;
}

interface OfficeLedgerFieldOption {
	label: string;
	value: string | number;
	type?: string;
}

interface OfficeLedgerField {
	prop: string;
	label: string;
	type?: string;
	options?: OfficeLedgerFieldOption[];
	optionsProp?: string;
	required?: boolean;
	rows?: number;
	span?: number;
	width?: string | number;
	minWidth?: string | number;
	min?: number;
	precision?: number;
	placeholder?: string;
	tag?: boolean;
	formatter?: (row: Record<string, any>) => string | number;
}

interface OfficeLedgerStatsCard {
	key: string;
	label: string;
	helper: string;
}

interface OfficeLedgerConfig {
	moduleKey: string;
	title: string;
	description: string;
	entityLabel: string;
	notice: string;
	phaseLabel: string;
	badgeLabel: string;
	audienceLabel: string;
	filters: OfficeLedgerField[];
	tableColumns: OfficeLedgerField[];
	detailFields: OfficeLedgerField[];
	formFields: OfficeLedgerField[];
	statsCards: OfficeLedgerStatsCard[];
	initialPageSize?: number;
	formWidth?: string;
	documentReference?: { prop: string; label: string } | null;
	createFilters: () => Record<string, unknown>;
	normalizeFilters: (filters: Record<string, unknown>) => Record<string, unknown>;
	createEmptyForm: () => Record<string, any>;
	toFormValues: (record: Record<string, any>) => Record<string, any>;
	toPayload: (form: Record<string, any>) => Record<string, any>;
	canEditRow?: (row: Record<string, any>) => boolean;
	canDeleteRow?: (row: Record<string, any>) => boolean;
	getDeleteMessage?: (row: Record<string, any>) => string;
	formatStatsValue?: (value: unknown, card: OfficeLedgerStatsCard) => unknown;
	statusMap?: Record<string, { label: string; type?: string }>;
}

const props = defineProps<{
	config: OfficeLedgerConfig;
	service: OfficeLedgerService;
}>();

const formRef = ref<FormInstance>();
const detailVisible = ref(false);
const formVisible = ref(false);
const submitLoading = ref(false);
const detailRecord = ref<Record<string, any> | null>(null);
const editingRecord = ref<Record<string, any> | null>(null);
const stats = ref<Record<string, any>>({});
const documentOptions = ref<Array<{ id: number; label: string }>>([]);
const form = reactive<Record<string, any>>({});

const canAccess = computed(() => checkPerm(props.service.permission.page));
const showInfoButton = computed(() => checkPerm(props.service.permission.info));
const showStatsSection = computed(() => checkPerm(props.service.permission.stats));
const showAddButton = computed(() => checkPerm(props.service.permission.add));
const showEditButton = computed(() => checkPerm(props.service.permission.update));
const showDeleteButton = computed(() => checkPerm(props.service.permission.delete));

const pageState = useListPage({
	createFilters: () => props.config.createFilters(),
	canLoad: () => canAccess.value,
	initialPageSize: props.config.initialPageSize,
	fetchPage: params =>
		props.service.fetchPage({
			page: params.page,
			size: params.size,
			...props.config.normalizeFilters(params as Record<string, unknown>)
		}),
	onError: (error: any) => {
		ElMessage.error(error?.message || `${props.config.entityLabel}列表加载失败`);
	}
});

const filters = pageState.filters as Record<string, any>;
const rows = pageState.rows;
const tableLoading = pageState.loading;
const pager = pageState.pager;

const rules = computed<FormRules>(() => {
	return props.config.formFields.reduce((result, field) => {
		if (!field.required) {
			return result;
		}
		result[field.prop] = [
			{
				required: true,
				message: `请输入${field.label}`,
				trigger: field.type === 'select' || field.type === 'date' || field.type === 'document-multi'
					? 'change'
					: 'blur'
			}
		];
		return result;
	}, {} as FormRules);
});

onMounted(() => {
	if (!canAccess.value) {
		return;
	}
	void initializePage();
});

async function initializePage() {
	await Promise.all([pageState.reload(), loadStats(), loadDocumentReferences()]);
}

async function loadStats() {
	if (!showStatsSection.value) {
		stats.value = {};
		return;
	}
	try {
		stats.value = await props.service.fetchStats(props.config.normalizeFilters({ ...filters }));
	} catch (error: any) {
		ElMessage.error(error?.message || `${props.config.entityLabel}统计加载失败`);
	}
}

async function loadDocumentReferences() {
	if (!props.config.documentReference) {
		documentOptions.value = [];
		return;
	}
	try {
		const result = await performanceDocumentCenterService.fetchPage({
			page: 1,
			size: 200,
			status: 'published'
		});
		documentOptions.value = (result?.list || []).map(item => ({
			id: Number(item.id),
			label: `${item.fileNo || '未编号'} / ${item.fileName || '未命名'}`
		}));
	} catch (error: any) {
		ElMessage.warning(error?.message || '引用文件元数据加载失败');
	}
}

async function applyFilters() {
	await Promise.all([pageState.search(), loadStats()]);
}

async function resetFilters() {
	await pageState.reset();
	await loadStats();
}

function changePage(page: number) {
	return pageState.goToPage(page);
}

function assignForm(payload: Record<string, any>) {
	Object.keys(form).forEach(key => delete form[key]);
	Object.assign(form, payload);
}

function resolveFieldOptions(field: OfficeLedgerField) {
	if (field.type === 'document-multi') {
		return documentOptions.value.map(item => ({
			label: item.label,
			value: item.id
		}));
	}
	return field.options || [];
}

function resolveOptionsByProp(prop?: string) {
	if (!prop) {
		return [];
	}
	const field = [...props.config.filters, ...props.config.formFields, ...props.config.tableColumns].find(
		item => item.prop === prop
	);
	return field?.options || [];
}

function resolveLabel(options: OfficeLedgerFieldOption[], value: unknown) {
	const matched = options.find(item => String(item.value) === String(value));
	return matched?.label || value || '-';
}

function resolveTagType(field: OfficeLedgerField, row: Record<string, any>) {
	const value = row?.[field.prop];
	const options = field.options || resolveOptionsByProp(field.optionsProp);
	const matched = options.find(item => String(item.value) === String(value));
	return (matched?.type || props.config.statusMap?.[String(value)]?.type || 'info') as any;
}

function renderDocumentLabels(value: unknown) {
	const ids = Array.isArray(value) ? value : [];
	if (!ids.length) {
		return '-';
	}
	return ids
		.map(id => documentOptions.value.find(item => item.id === Number(id))?.label || `资料#${id}`)
		.join('，');
}

function renderFieldValue(field: OfficeLedgerField, row: Record<string, any>) {
	if (typeof field.formatter === 'function') {
		return field.formatter(row);
	}

	const value = row?.[field.prop];
	if (field.type === 'document-multi') {
		return renderDocumentLabels(value);
	}
	if (field.type === 'tags') {
		return Array.isArray(value) && value.length ? value.join('，') : '-';
	}
	if (field.options?.length) {
		return resolveLabel(field.options, value);
	}
	if (field.optionsProp) {
		return resolveLabel(resolveOptionsByProp(field.optionsProp), value);
	}
	if (field.type === 'date') {
		return value || '-';
	}
	return value === null || value === undefined || value === '' ? '-' : value;
}

async function openDetail(row: Record<string, any>) {
	try {
		detailRecord.value =
			showInfoButton.value && row?.id ? await props.service.fetchInfo({ id: Number(row.id) }) : row;
		detailVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error?.message || `${props.config.entityLabel}详情加载失败`);
	}
}

function openCreate() {
	editingRecord.value = null;
	assignForm(props.config.createEmptyForm());
	formVisible.value = true;
}

async function openEdit(row: Record<string, any>) {
	try {
		const source =
			showInfoButton.value && row?.id ? await props.service.fetchInfo({ id: Number(row.id) }) : row;
		editingRecord.value = row;
		assignForm({
			...props.config.createEmptyForm(),
			...props.config.toFormValues(source)
		});
		formVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error?.message || `${props.config.entityLabel}详情加载失败`);
	}
}

function canEditRecord(row: Record<string, any>) {
	return props.config.canEditRow ? props.config.canEditRow(row) : true;
}

function canDeleteRecord(row: Record<string, any>) {
	return props.config.canDeleteRow ? props.config.canDeleteRow(row) : true;
}

async function submitForm() {
	if (!formRef.value) {
		return;
	}
	await formRef.value.validate();
	submitLoading.value = true;
	try {
		const payload = props.config.toPayload({ ...form });
		if (editingRecord.value?.id) {
			await props.service.updateItem({
				...payload,
				id: Number(editingRecord.value.id)
			});
			ElMessage.success(`${props.config.entityLabel}已更新`);
		} else {
			await props.service.createItem(payload);
			ElMessage.success(`${props.config.entityLabel}已创建`);
		}
		formVisible.value = false;
		await Promise.all([pageState.search(), loadStats()]);
	} catch (error: any) {
		ElMessage.error(error?.message || `${props.config.entityLabel}保存失败`);
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: Record<string, any>) {
	if (!row?.id) {
		return;
	}
	try {
		await ElMessageBox.confirm(
			props.config.getDeleteMessage?.(row) || `确认删除当前${props.config.entityLabel}吗？`,
			'删除确认',
			{
				type: 'warning'
			}
		);
		await props.service.removeItem({
			ids: [Number(row.id)]
		});
		ElMessage.success(`${props.config.entityLabel}已删除`);
		await Promise.all([pageState.search(), loadStats()]);
	} catch (error: any) {
		if (error === 'cancel') {
			return;
		}
		ElMessage.error(error?.message || `${props.config.entityLabel}删除失败`);
	}
}
</script>

<style lang="scss" scoped>
.office-ledger-page {
	display: grid;
	gap: 16px;

	&__header {
		display: grid;
		gap: 16px;
	}

	&__eyebrow {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__title-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}

	h2 {
		margin: 0;
	}

	p {
		margin: 0;
		color: var(--el-text-color-regular);
		line-height: 1.6;
	}

	&__toolbar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
	}

	&__filters,
	&__actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	&__metric-label {
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}

	&__metric-value {
		font-size: 28px;
		font-weight: 600;
		margin-top: 8px;
	}

	&__metric-helper {
		margin-top: 8px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		line-height: 1.5;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
	}
}
</style>
