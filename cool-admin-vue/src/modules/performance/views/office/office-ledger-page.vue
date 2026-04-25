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
						<el-tag effect="plain" type="info">{{ roleFact.roleLabel }}</el-tag>
					</div>
					<p>{{ config.description }}</p>
				</div>
				<el-alert :title="config.notice" type="info" :closable="false" show-icon />
			</div>
		</el-card>

		<el-card shadow="never">
			<div class="office-ledger-page__toolbar">
				<div class="office-ledger-page__filters">
					<template v-for="field in config.filters" :key="field.prop">
						<el-input
							v-if="field.type === 'text'"
							:model-value="getFilterTextValue(field.prop)"
							:placeholder="field.placeholder || field.label"
							clearable
							:style="{ width: field.width || '220px' }"
							@update:model-value="value => setFilterTextValue(field.prop, value)"
							@keyup.enter="applyFilters"
						/>
						<el-select
							v-else-if="field.type === 'select'"
							:model-value="getFilterSelectValue(field.prop)"
							:placeholder="field.placeholder || field.label"
							clearable
							filterable
							:style="{ width: field.width || '180px' }"
							@update:model-value="value => setFilterSelectValue(field.prop, value)"
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
			<el-col v-for="card in config.statsCards" :key="card.key" :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="office-ledger-page__metric-label">{{ card.label }}</div>
					<div class="office-ledger-page__metric-value">
						{{
							config.formatStatsValue?.(stats[card.key], card) ?? stats[card.key] ?? 0
						}}
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
						<el-button v-if="showInfoButton" text @click="openDetail(row)"
							>详情</el-button
						>
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
					:title="
						editingRecord?.id
							? `编辑 ${config.entityLabel} 元数据；归档记录不可继续维护。`
							: `新建记录默认只维护元数据，不触发真实上传、物流同步或外部发布。`
					"
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
								:model-value="getFormTextValue(field.prop)"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => setFormTextValue(field.prop, value)"
							/>
							<el-input
								v-else-if="field.type === 'textarea'"
								:model-value="getFormTextValue(field.prop)"
								type="textarea"
								:rows="field.rows || 4"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => setFormTextValue(field.prop, value)"
							/>
							<el-input
								v-else-if="field.type === 'tags-input'"
								:model-value="getFormTextValue(field.prop)"
								placeholder="多个标签使用中文逗号、英文逗号或空格分隔"
								@update:model-value="value => setFormTextValue(field.prop, value)"
							/>
							<el-select
								v-else-if="field.type === 'select'"
								:model-value="getFormSelectValue(field.prop)"
								clearable
								filterable
								style="width: 100%"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => setFormSelectValue(field.prop, value)"
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
								:model-value="getFormDateValue(field.prop)"
								type="date"
								value-format="YYYY-MM-DD"
								style="width: 100%"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => setFormDateValue(field.prop, value)"
							/>
							<el-input-number
								v-else-if="field.type === 'number'"
								:model-value="getFormNumberValue(field.prop)"
								:min="field.min ?? 0"
								:precision="field.precision ?? 0"
								style="width: 100%"
								@update:model-value="value => setFormNumberValue(field.prop, value)"
							/>
							<el-select
								v-else-if="field.type === 'document-multi'"
								:model-value="getFormDocumentIds(field.prop)"
								multiple
								filterable
								clearable
								style="width: 100%"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => setFormDocumentIds(field.prop, value)"
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

<script
	lang="ts"
	setup
	generic="TRecord extends OfficeLedgerBaseRecord, TStats extends OfficeLedgerStats"
>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceAccessContextService } from '../../service/access-context';
import { performanceDocumentCenterService } from '../../service/documentCenter';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import { confirmElementAction, runTrackedElementAction } from '../shared/action-feedback';
import {
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import type { PerformanceAccessContext } from '../../types';
import type { OfficeLedgerBaseRecord, OfficeLedgerStats } from '../../service/office-ledger';
import type {
	OfficeLedgerConfig,
	OfficeLedgerCrudService,
	OfficeLedgerField,
	OfficeLedgerFieldOption,
	OfficeLedgerFilterState,
	OfficeLedgerFormState,
	OfficeLedgerStatsCard,
	OfficeLedgerStatsView,
	OfficeLedgerTagType
} from './office-ledger.types';

const props = defineProps<{
	config: OfficeLedgerConfig<TRecord>;
	service: OfficeLedgerCrudService<TRecord, TStats>;
}>();

const formRef = ref<FormInstance>();
const detailVisible = ref(false);
const formVisible = ref(false);
const submitLoading = ref(false);
const detailRecord = ref<TRecord | null>(null);
const editingRecord = ref<TRecord | null>(null);
const stats = ref<OfficeLedgerStatsView>({});
const documentOptions = ref<Array<{ id: number; label: string }>>([]);
const accessContext = ref<PerformanceAccessContext | null>(null);
const form = reactive<OfficeLedgerFormState>({});

const canAccess = computed(() => checkPerm(props.service.permission.page));
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const showInfoButton = computed(() => checkPerm(props.service.permission.info));
const showStatsSection = computed(() => checkPerm(props.service.permission.stats));
const showAddButton = computed(() => checkPerm(props.service.permission.add));
const showEditButton = computed(() => checkPerm(props.service.permission.update));
const showDeleteButton = computed(() => checkPerm(props.service.permission.delete));

const pageState = useListPage<TRecord, OfficeLedgerFilterState>({
	createFilters: props.config.createFilters,
	canLoad: () => canAccess.value,
	initialPageSize: props.config.initialPageSize,
	fetchPage: params =>
		props.service.fetchPage({
			page: params.page,
			size: params.size,
			...props.config.normalizeFilters(params)
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, `${props.config.entityLabel}列表加载失败`);
	}
});

const filters = pageState.filters;
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
				trigger:
					field.type === 'select' ||
					field.type === 'date' ||
					field.type === 'document-multi'
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
	await Promise.all([
		loadAccessContext(),
		pageState.reload(),
		loadStats(),
		loadDocumentReferences()
	]);
}

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch (error: unknown) {
		accessContext.value = null;
		showElementWarningFromError(error, '角色上下文加载失败，已使用兼容展示视角');
	}
}

async function loadStats() {
	if (!showStatsSection.value) {
		stats.value = {};
		return;
	}
	try {
		stats.value = normalizeStats(
			await props.service.fetchStats(props.config.normalizeFilters({ ...filters }))
		);
	} catch (error: unknown) {
		showElementErrorFromError(error, `${props.config.entityLabel}统计加载失败`);
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
	} catch (error: unknown) {
		showElementWarningFromError(error, '引用文件元数据加载失败');
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

function assignForm(payload: OfficeLedgerFormState) {
	Object.keys(form).forEach(key => delete form[key]);
	Object.assign(form, payload);
}

function getFilterTextValue(prop: string) {
	const value = filters[prop];
	return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function setFilterTextValue(prop: string, value: string) {
	filters[prop] = value;
}

function getFilterSelectValue(prop: string) {
	const value = filters[prop];
	return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function setFilterSelectValue(prop: string, value: string | number | undefined) {
	filters[prop] = value;
}

function getFormTextValue(prop: string) {
	const value = form[prop];
	return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function setFormTextValue(prop: string, value: string) {
	form[prop] = value;
}

function getFormSelectValue(prop: string) {
	const value = form[prop];
	return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function setFormSelectValue(prop: string, value: string | number | undefined) {
	form[prop] = value;
}

function getFormDateValue(prop: string) {
	const value = form[prop];
	return typeof value === 'string' ? value : undefined;
}

function setFormDateValue(prop: string, value: string | undefined) {
	form[prop] = value;
}

function getFormNumberValue(prop: string) {
	const value = form[prop];
	return typeof value === 'number' ? value : undefined;
}

function setFormNumberValue(prop: string, value: number | undefined) {
	form[prop] = value;
}

function getFormDocumentIds(prop: string) {
	const value = form[prop];
	return Array.isArray(value)
		? value.map(item => Number(item)).filter(item => Number.isFinite(item))
		: [];
}

function setFormDocumentIds(prop: string, value: number[]) {
	form[prop] = value;
}

function resolveFieldOptions(field: OfficeLedgerField<TRecord>) {
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
	const field = [
		...props.config.filters,
		...props.config.formFields,
		...props.config.tableColumns
	].find(item => item.prop === prop);
	return field?.options || [];
}

function resolveLabel(options: OfficeLedgerFieldOption[], value: unknown) {
	const matched = options.find(item => String(item.value) === String(value));
	return matched?.label || value || '-';
}

function resolveTagType(
	field: OfficeLedgerField<TRecord>,
	row: OfficeLedgerBaseRecord | null | undefined
) {
	const value = row?.[field.prop];
	const options = field.options || resolveOptionsByProp(field.optionsProp);
	const matched = options.find(item => String(item.value) === String(value));
	return (
		(matched?.type as OfficeLedgerTagType) ||
		(props.config.statusMap?.[String(value)]?.type as OfficeLedgerTagType) ||
		'info'
	);
}

function renderDocumentLabels(value: unknown) {
	const ids = Array.isArray(value) ? value : [];
	if (!ids.length) {
		return '-';
	}
	return ids
		.map(
			id => documentOptions.value.find(item => item.id === Number(id))?.label || `资料#${id}`
		)
		.join('，');
}

function renderFieldValue(
	field: OfficeLedgerField<TRecord>,
	row: OfficeLedgerBaseRecord | null | undefined
) {
	if (typeof field.formatter === 'function') {
		return row ? field.formatter(row as TRecord) : '-';
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

async function openDetail(row: TRecord) {
	try {
		const rowId = resolveNumericId(row.id);
		detailRecord.value =
			showInfoButton.value && rowId ? await props.service.fetchInfo({ id: rowId }) : row;
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, `${props.config.entityLabel}详情加载失败`);
	}
}

function openCreate() {
	editingRecord.value = null;
	assignForm(props.config.createEmptyForm());
	formVisible.value = true;
}

async function openEdit(row: TRecord) {
	try {
		const rowId = resolveNumericId(row.id);
		const source =
			showInfoButton.value && rowId ? await props.service.fetchInfo({ id: rowId }) : row;
		editingRecord.value = row;
		assignForm({
			...props.config.createEmptyForm(),
			...props.config.toFormValues(source)
		});
		formVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, `${props.config.entityLabel}详情加载失败`);
	}
}

function canEditRecord(row: TRecord) {
	return props.config.canEditRow ? props.config.canEditRow(row) : true;
}

function canDeleteRecord(row: TRecord) {
	return props.config.canDeleteRow ? props.config.canDeleteRow(row) : true;
}

async function submitForm() {
	if (!formRef.value) {
		return;
	}
	await formRef.value.validate();
	submitLoading.value = true;
	try {
		const payload = props.config.toPayload({ ...form } as OfficeLedgerFormState);
		const editingId = resolveNumericId(editingRecord.value?.id);
		if (editingId) {
			await props.service.updateItem({
				...payload,
				id: editingId
			});
			ElMessage.success(`${props.config.entityLabel}已更新`);
		} else {
			await props.service.createItem(payload);
			ElMessage.success(`${props.config.entityLabel}已创建`);
		}
		formVisible.value = false;
		await Promise.all([pageState.search(), loadStats()]);
	} catch (error: unknown) {
		showElementErrorFromError(error, `${props.config.entityLabel}保存失败`);
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: TRecord) {
	const rowId = resolveNumericId(row.id);
	if (!rowId) {
		return;
	}

	const confirmed = await confirmElementAction(
		props.config.getDeleteMessage?.(row) || `确认删除当前${props.config.entityLabel}吗？`,
		'删除确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId,
		actionType: 'delete',
		request: () =>
			props.service.removeItem({
				ids: [rowId]
			}),
		successMessage: `${props.config.entityLabel}已删除`,
		errorMessage: `${props.config.entityLabel}删除失败`,
		refresh: async () => {
			await Promise.all([pageState.search(), loadStats()]);
		}
	});
}

function resolveNumericId(value: unknown) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeStats(value: TStats): OfficeLedgerStatsView {
	return Object.entries(value || {}).reduce<OfficeLedgerStatsView>((result, [key, item]) => {
		if (
			typeof item === 'string' ||
			typeof item === 'number' ||
			item === null ||
			item === undefined
		) {
			result[key] = item;
		}
		return result;
	}, {});
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.metadata-workspace.scss' as metadataWorkspace;

.office-ledger-page {
	@include metadataWorkspace.metadata-workspace-shell(1180px);

	&__header {
		display: grid;
		gap: var(--app-space-4);
		padding: 4px;
		border-radius: var(--app-radius-lg);
		background: var(--app-surface-hero);
	}

	&__eyebrow {
		font-size: var(--app-font-size-caption);
		color: var(--app-text-tertiary);
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
		color: var(--app-text-primary);
	}

	p {
		margin: 0;
		color: var(--app-text-secondary);
		line-height: 1.6;
	}
}
</style>
