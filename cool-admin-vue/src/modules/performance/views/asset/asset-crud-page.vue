<!-- 文件职责：承接主题20资产子页面的通用列表、筛选、详情与表单壳层；不负责具体接口契约定义、权限键生产或跨主题联动逻辑；依赖 Element Plus、资产 service 与绩效列表页状态 composable；维护重点是同一类页面的查询/弹窗/动作入口必须统一，避免 9 个页面各写一套状态机。 -->
<template>
	<div v-if="canAccess" class="asset-crud-page">
		<el-card shadow="never">
			<div class="asset-crud-page__header">
				<div>
					<div class="asset-crud-page__eyebrow">资产管理 / 主题20</div>
					<h2>{{ title }}</h2>
					<p>{{ description }}</p>
				</div>
				<el-alert
					:title="notice"
					type="info"
					:closable="false"
					show-icon
				/>
			</div>
		</el-card>

		<el-card shadow="never">
			<div class="asset-crud-page__toolbar">
				<div class="asset-crud-page__filters">
					<template v-for="field in filters" :key="field.prop">
						<el-input
							v-if="field.type === 'text'"
							:model-value="readTextField(filtersModel, field.prop)"
							:placeholder="field.placeholder || field.label"
							clearable
							:style="{ width: field.width || '220px' }"
							@update:model-value="value => writeField(filtersModel, field.prop, value)"
							@keyup.enter="search"
						/>
						<el-select
							v-else-if="field.type === 'select'"
							:model-value="readScalarField(filtersModel, field.prop)"
							:placeholder="field.placeholder || field.label"
							clearable
							filterable
							:style="{ width: field.width || '180px' }"
							@update:model-value="value => writeField(filtersModel, field.prop, value)"
						>
							<el-option
								v-for="item in field.options || []"
								:key="String(item.value)"
								:label="item.label"
								:value="resolveOptionValue(item.value)"
							/>
						</el-select>
						<el-date-picker
							v-else
							:model-value="readDateField(filtersModel, field.prop)"
							:type="field.type === 'month' ? 'month' : 'date'"
							:value-format="field.type === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'"
							:placeholder="field.placeholder || field.label"
							:style="{ width: field.width || '180px' }"
							@update:model-value="value => writeField(filtersModel, field.prop, value)"
						/>
					</template>
				</div>
				<div class="asset-crud-page__actions">
					<el-button @click="search">查询</el-button>
					<el-button @click="reset()">重置</el-button>
					<template v-for="action in toolbarActions" :key="action.key">
						<el-button
							v-if="checkPerm(action.permission)"
							:type="resolveButtonType(action.type)"
							@click="runToolbarAction(action)"
						>
							{{ action.label }}
						</el-button>
					</template>
					<el-button
						v-if="canCreate && createEmpty"
						type="primary"
						@click="openCreate"
					>
						{{ createLabel || '新增' }}
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<el-table :data="tableRows" border v-loading="tableLoading">
				<el-table-column
					v-for="column in columns"
					:key="column.prop"
					:prop="column.prop"
					:label="column.label"
					:min-width="column.minWidth || 140"
					:width="column.width"
				>
					<template #default="{ row }">
						<el-tag
							v-if="column.tagMap"
							:type="resolveTagType(column.tagMap, readField(row, column.prop), 'info')"
							effect="plain"
						>
							{{ resolveTagLabel(column.tagMap, readField(row, column.prop)) }}
						</el-tag>
						<span v-else>
							{{ column.formatter ? column.formatter(readField(row, column.prop), row) : readField(row, column.prop) || '-' }}
						</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" min-width="280">
					<template #default="{ row }">
						<el-button text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canUpdate && createEmpty && (!editVisible || editVisible(row))"
							text
							type="primary"
							@click="openEdit(row)"
						>
							编辑
						</el-button>
						<el-button
							v-if="canDelete && removeItem"
							text
							type="danger"
							@click="removeRow(row)"
						>
							删除
						</el-button>
						<template v-for="action in rowActions" :key="action.key">
							<el-button
								v-if="checkPerm(action.permission) && (!action.visible || action.visible(row))"
								text
								:type="resolveButtonType(action.type, 'primary')"
								@click="runRowAction(action, row)"
							>
								{{ action.label }}
							</el-button>
						</template>
					</template>
				</el-table-column>
			</el-table>

			<div class="asset-crud-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pager.page"
					:page-size="pager.size"
					:total="pager.total"
					@current-change="goToPage"
				/>
			</div>
		</el-card>

		<el-dialog v-model="detailVisible" title="详情" width="900px" destroy-on-close>
			<el-descriptions v-if="detailRow" :column="2" border>
				<el-descriptions-item
					v-for="field in detailFieldsResolved"
					:key="field.prop"
					:label="field.label"
					:span="field.span || 1"
				>
					<el-tag
						v-if="field.tagMap"
						:type="resolveTagType(field.tagMap, readField(detailRow, field.prop), 'info')"
						effect="plain"
					>
						{{ resolveTagLabel(field.tagMap, readField(detailRow, field.prop)) }}
					</el-tag>
					<span v-else>
						{{ field.formatter ? field.formatter(readField(detailRow, field.prop), detailRow) : readField(detailRow, field.prop) || '-' }}
					</span>
				</el-descriptions-item>
			</el-descriptions>
		</el-dialog>

		<el-dialog
			v-if="createEmpty"
			v-model="formVisible"
			:title="editingRow?.id ? editLabel || '编辑' : createLabel || '新增'"
			width="900px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" label-width="120px">
				<el-row :gutter="16">
					<el-col v-for="field in formFields" :key="field.prop" :span="field.span || 12">
						<el-form-item :label="field.label">
							<el-input
								v-if="field.type === 'text'"
								:model-value="readTextField(form, field.prop)"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => writeField(form, field.prop, value)"
							/>
							<el-input
								v-else-if="field.type === 'textarea'"
								:model-value="readTextField(form, field.prop)"
								type="textarea"
								:rows="field.rows || 3"
								:placeholder="field.placeholder || field.label"
								@update:model-value="value => writeField(form, field.prop, value)"
							/>
							<el-input-number
								v-else-if="field.type === 'number'"
								:model-value="readNumberField(form, field.prop)"
								:min="field.min ?? 0"
								:precision="field.precision ?? 0"
								style="width: 100%"
								@update:model-value="value => writeField(form, field.prop, value)"
							/>
							<el-select
								v-else-if="field.type === 'select'"
								:model-value="readScalarField(form, field.prop)"
								clearable
								filterable
								:placeholder="field.placeholder || field.label"
								style="width: 100%"
								@update:model-value="value => writeField(form, field.prop, value)"
							>
								<el-option
									v-for="item in field.options || []"
									:key="String(item.value)"
									:label="item.label"
									:value="resolveOptionValue(item.value)"
								/>
							</el-select>
							<el-date-picker
								v-else
								:model-value="readDateField(form, field.prop)"
								:type="field.type === 'month' ? 'month' : 'date'"
								:value-format="field.type === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'"
								style="width: 100%"
								@update:model-value="value => writeField(form, field.prop, value)"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
			</template>
		</el-dialog>
	</div>

	<el-result
		v-else
		icon="warning"
		title="暂无访问权限"
		sub-title="当前账号未被授予该页面的查询权限。"
	/>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useListPage } from '../../composables/use-list-page';
import {
	type CrudColumnConfig,
	type CrudFieldState,
	type CrudFilters,
	type CrudFormFieldConfig,
	type CrudPageResult,
	type CrudRowPredicate,
	type CrudRowShape,
	type CrudRowAction,
	type CrudToolbarAction,
	type CrudFilterFieldConfig,
	readDateField,
	readField,
	type CrudMutationHandler,
	readNumberField,
	resolveOptionValue,
	readScalarField,
	readTextField,
	resolveButtonType,
	resolveTagLabel,
	resolveTagType,
	writeField
} from '../shared/crud-page-shell';
import {
	confirmElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import { showElementErrorFromError } from '../shared/error-message';

const props = withDefaults(
	defineProps<{
		title: string;
		description: string;
		notice: string;
		pagePermission: string;
		infoPermission?: string;
		addPermission?: string;
		updatePermission?: string;
		deletePermission?: string;
		editVisible?: CrudRowPredicate;
		columns: CrudColumnConfig[];
		detailFields?: CrudColumnConfig[];
		filters: CrudFilterFieldConfig[];
		formFields?: CrudFormFieldConfig[];
		createFilters: () => CrudFilters;
		createEmpty?: () => object;
		fetchPage: (params: CrudFilters & { page: number; size: number }) => Promise<CrudPageResult>;
		fetchInfo?: (params: { id: number }) => Promise<object>;
		createItem?: CrudMutationHandler;
		updateItem?: CrudMutationHandler;
		removeItem?: (data: { ids: number[] }) => Promise<unknown>;
		rowActions?: CrudRowAction[];
		toolbarActions?: CrudToolbarAction[];
		createLabel?: string;
		editLabel?: string;
	}>(),
	{
		detailFields: () => [],
		formFields: () => [],
		rowActions: () => [],
		toolbarActions: () => []
	}
);

const canAccess = computed(() => checkPerm(props.pagePermission));
const canCreate = computed(() => props.addPermission && checkPerm(props.addPermission));
const canUpdate = computed(() => props.updatePermission && checkPerm(props.updatePermission));
const canDelete = computed(() => props.deletePermission && checkPerm(props.deletePermission));

const detailVisible = ref(false);
const detailRow = ref<CrudRowShape | null>(null);
const formVisible = ref(false);
const editingRow = ref<CrudRowShape | null>(null);
const submitting = ref(false);
const form = reactive<CrudFieldState>({});

const state = useListPage<CrudRowShape, CrudFilters>({
	createFilters: props.createFilters,
	fetchPage: props.fetchPage,
	canLoad: () => canAccess.value,
	onError: (error: unknown) => {
		showElementErrorFromError(error, `${props.title}加载失败`);
	}
});
const filtersModel = state.filters;
const pager = state.pager;
const tableRows = computed(() => state.rows.value);
const tableLoading = computed(() => state.loading.value);
const { reload, goToPage, search, reset } = state;

const detailFieldsResolved = computed(() =>
	(props.detailFields?.length ? props.detailFields : props.columns).map(item => ({
		...item,
		span: item.span || 1
	}))
);

function assignForm(payload: CrudFieldState) {
	Object.keys(form).forEach(key => delete form[key]);
	Object.assign(form, payload);
}

async function openDetail(row: CrudRowShape) {
	try {
		detailRow.value =
			props.fetchInfo && typeof row.id === 'number'
				? await props.fetchInfo({ id: row.id })
				: { ...row };
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '详情加载失败');
	}
}

function openCreate() {
	editingRow.value = null;
	assignForm(props.createEmpty ? (props.createEmpty() as CrudFieldState) : {});
	formVisible.value = true;
}

function openEdit(row: CrudRowShape) {
	editingRow.value = row;
	assignForm({ ...(props.createEmpty ? props.createEmpty() : {}), ...(row as CrudFieldState) });
	formVisible.value = true;
}

async function submitForm() {
	if (!props.createEmpty) {
		return;
	}
	submitting.value = true;
	try {
		if (editingRow.value?.id && props.updateItem) {
			await props.updateItem({ ...form, id: editingRow.value.id });
			ElMessage.success('已更新');
		} else if (props.createItem) {
			await props.createItem({ ...form });
			ElMessage.success('已新增');
		}
		formVisible.value = false;
		await search();
	} catch (error: unknown) {
		showElementErrorFromError(error, '保存失败');
	} finally {
		submitting.value = false;
	}
}

async function removeRow(row: CrudRowShape) {
	if (!props.removeItem || typeof row.id !== 'number') {
		return;
	}

	const rowId = row.id;

	const confirmed = await confirmElementAction('确认删除当前记录吗？', '删除确认');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId,
		actionType: 'delete',
		request: () => props.removeItem!({ ids: [rowId] }),
		successMessage: '已删除',
		errorMessage: '删除失败',
		refresh: search
	});
}

async function runToolbarAction(action: CrudToolbarAction) {
	try {
		await action.handler?.({
			filters: { ...state.filters },
			rows: Array.isArray(state.rows.value) ? [...state.rows.value] : [],
			pager: { ...state.pager }
		});
		if (action.successMessage) {
			ElMessage.success(action.successMessage);
		}
		await search();
	} catch (error: unknown) {
		showElementErrorFromError(error, `${action.label}失败`);
	}
}

async function runRowAction(action: CrudRowAction, row: CrudRowShape) {
	if (action.confirmText) {
		const confirmed = await confirmElementAction(action.confirmText(row), '操作确认');
		if (!confirmed) {
			return;
		}
	}

	await runTrackedElementAction({
		rowId: typeof row.id === 'number' ? row.id : 0,
		actionType: action.key,
		request: () => Promise.resolve(action.handler(row)),
		successMessage: action.successMessage,
		errorMessage: `${action.label}失败`,
		refresh: search
	});
}

if (canAccess.value) {
	reload();
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.metadata-workspace.scss' as metadataWorkspace;

.asset-crud-page {
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
		margin-bottom: var(--app-space-2);
	}

	h2 {
		margin: 0 0 8px;
		color: var(--app-text-primary);
	}

	p {
		margin: 0;
		color: var(--app-text-secondary);
		line-height: 1.6;
	}
}
</style>
