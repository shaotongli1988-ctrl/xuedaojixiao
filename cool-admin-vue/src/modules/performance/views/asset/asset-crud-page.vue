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
							v-model="filtersModel[field.prop]"
							:placeholder="field.placeholder || field.label"
							clearable
							:style="{ width: field.width || '220px' }"
							@keyup.enter="search"
						/>
						<el-select
							v-else-if="field.type === 'select'"
							v-model="filtersModel[field.prop]"
							:placeholder="field.placeholder || field.label"
							clearable
							filterable
							:style="{ width: field.width || '180px' }"
						>
							<el-option
								v-for="item in field.options || []"
								:key="String(item.value)"
								:label="item.label"
								:value="item.value"
							/>
						</el-select>
						<el-date-picker
							v-else
							v-model="filtersModel[field.prop]"
							:type="field.type === 'month' ? 'month' : 'date'"
							:value-format="field.type === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'"
							:placeholder="field.placeholder || field.label"
							:style="{ width: field.width || '180px' }"
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
							:type="resolveTagType(column.tagMap, row[column.prop], 'info')"
							effect="plain"
						>
							{{ column.tagMap[row[column.prop]]?.label || row[column.prop] || '-' }}
						</el-tag>
						<span v-else>
							{{ column.formatter ? column.formatter(row[column.prop], row) : row[column.prop] || '-' }}
						</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" min-width="280">
					<template #default="{ row }">
						<el-button text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canUpdate && createEmpty"
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
						:type="resolveTagType(field.tagMap, detailRow[field.prop], 'info')"
						effect="plain"
					>
						{{ field.tagMap[detailRow[field.prop]]?.label || detailRow[field.prop] || '-' }}
					</el-tag>
					<span v-else>
						{{ field.formatter ? field.formatter(detailRow[field.prop], detailRow) : detailRow[field.prop] || '-' }}
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
								v-model="form[field.prop]"
								:placeholder="field.placeholder || field.label"
							/>
							<el-input
								v-else-if="field.type === 'textarea'"
								v-model="form[field.prop]"
								type="textarea"
								:rows="field.rows || 3"
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
								v-else-if="field.type === 'select'"
								v-model="form[field.prop]"
								clearable
								filterable
								:placeholder="field.placeholder || field.label"
								style="width: 100%"
							>
								<el-option
									v-for="item in field.options || []"
									:key="String(item.value)"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
							<el-date-picker
								v-else
								v-model="form[field.prop]"
								:type="field.type === 'month' ? 'month' : 'date'"
								:value-format="field.type === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'"
								style="width: 100%"
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useListPage } from '../../composables/use-list-page';

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
		columns: any[];
		detailFields?: any[];
		filters: any[];
		formFields?: any[];
		createFilters: () => Record<string, any>;
		createEmpty?: () => Record<string, any>;
		fetchPage: (params: any) => Promise<any>;
		fetchInfo?: (params: { id: number }) => Promise<any>;
		createItem?: (data: any) => Promise<any>;
		updateItem?: (data: any) => Promise<any>;
		removeItem?: (data: { ids: number[] }) => Promise<any>;
		rowActions?: any[];
		toolbarActions?: any[];
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
const detailRow = ref<any>(null);
const formVisible = ref(false);
const editingRow = ref<any>(null);
const submitting = ref(false);
const form = reactive<Record<string, any>>({});

const state = useListPage({
	createFilters: props.createFilters,
	fetchPage: props.fetchPage,
	canLoad: () => canAccess.value,
	onError: (error: any) => {
		ElMessage.error(error?.message || `${props.title}加载失败`);
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

function assignForm(payload: Record<string, any>) {
	Object.keys(form).forEach(key => delete form[key]);
	Object.assign(form, payload);
}

async function openDetail(row: any) {
	try {
		detailRow.value =
			props.fetchInfo && row?.id ? await props.fetchInfo({ id: row.id }) : { ...row };
		detailVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error?.message || '详情加载失败');
	}
}

function openCreate() {
	editingRow.value = null;
	assignForm(props.createEmpty ? props.createEmpty() : {});
	formVisible.value = true;
}

function openEdit(row: any) {
	editingRow.value = row;
	assignForm({ ...(props.createEmpty ? props.createEmpty() : {}), ...row });
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
	} catch (error: any) {
		ElMessage.error(error?.message || '保存失败');
	} finally {
		submitting.value = false;
	}
}

async function removeRow(row: any) {
	if (!props.removeItem || !row?.id) {
		return;
	}
	await ElMessageBox.confirm(`确认删除当前记录吗？`, '删除确认', {
		type: 'warning'
	});
	try {
		await props.removeItem({ ids: [row.id] });
		ElMessage.success('已删除');
		await search();
	} catch (error: any) {
		ElMessage.error(error?.message || '删除失败');
	}
}

async function runToolbarAction(action: any) {
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
	} catch (error: any) {
		ElMessage.error(error?.message || `${action.label}失败`);
	}
}

async function runRowAction(action: any, row: any) {
	try {
		if (action.confirmText) {
			await ElMessageBox.confirm(action.confirmText(row), '操作确认', {
				type: 'warning'
			});
		}
		await action.handler(row);
		if (action.successMessage) {
			ElMessage.success(action.successMessage);
		}
		await search();
	} catch (error: any) {
		if (error === 'cancel') {
			return;
		}
		ElMessage.error(error?.message || `${action.label}失败`);
	}
}

if (canAccess.value) {
	reload();
}

function resolveButtonType(value?: string, fallback: any = 'default') {
	return (value || fallback) as any;
}

function resolveTagType(
	tagMap: Record<string, { type?: string }>,
	value: string,
	fallback: any = 'info'
) {
	return (tagMap?.[value]?.type || fallback) as any;
}
</script>

<style lang="scss" scoped>
.asset-crud-page {
	display: grid;
	gap: 16px;

	&__header {
		display: grid;
		gap: 16px;
	}

	&__eyebrow {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		margin-bottom: 8px;
	}

	h2 {
		margin: 0 0 8px;
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

	&__pagination {
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
	}
}
</style>
