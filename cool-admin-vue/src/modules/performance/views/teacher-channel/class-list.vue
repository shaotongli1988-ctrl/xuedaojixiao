<!-- 文件职责：承接主题19班级列表、新增、编辑、删除和详情查看主链；不负责报名转化、复杂统计或跨主题班级运营；依赖 teacherClass / teacherInfo service 与路由预置参数；维护重点是只有 partnered teacher 可建班、closed 班级前端也要禁用编辑删除。 -->
<template>
	<permission-overlay
		:denied="!canAccess"
		:permission-key="performanceTeacherClassService.permission.page"
		title="当前账号暂未开通合作班级页权限"
		description="页面内容已切换到保护态。请联系管理员开通班级查看权限后再处理合作班级。"
	>
		<div class="teacher-channel-class-page">
		<el-card shadow="never" class="teacher-channel-class-page__toolbar-card">
			<div class="teacher-channel-class-page__toolbar">
				<div class="teacher-channel-class-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						clearable
						placeholder="班级 / 班主任 / 学校"
						style="width: 260px"
						@keyup.enter="refresh"
					/>
					<el-select
						v-model="statusModel"
						clearable
						placeholder="班级状态"
						style="width: 180px"
					>
						<el-option
							v-for="item in classStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="teacher-channel-class-page__toolbar-right">
					<el-button @click="handleReset">重置</el-button>
					<el-button type="primary" :loading="tableLoading" @click="refresh">刷新</el-button>
					<el-button v-if="showAddButton" type="primary" plain @click="openCreate()">
						新增班级
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never" class="teacher-channel-class-page__content-card">
			<template #header>
				<div class="teacher-channel-class-page__header">
					<div>
						<h2>合作班级列表</h2>
						<p>仅 partnered teacher 可建班，closed 班级不可编辑、删除、重开。</p>
					</div>
					<el-tag effect="plain">{{ rows.length }} 条</el-tag>
				</div>
			</template>

			<el-alert
				v-if="pageError"
				type="warning"
				:title="pageError"
				:closable="false"
				show-icon
			/>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="teacherName" label="班主任" min-width="140" />
				<el-table-column prop="className" label="班级" min-width="180" />
				<el-table-column prop="schoolName" label="学校" min-width="180">
					<template #default="{ row }">
						{{ row.schoolName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="projectTag" label="项目标签" min-width="120">
					<template #default="{ row }">
						{{ row.projectTag || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="studentCount" label="学员数" width="100" />
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="classStatusTagType(row.status)">
							{{ classStatusLabel(row.status) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" min-width="220" fixed="right">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canEditTeacherClass(row, showUpdateButton)"
							text
							type="primary"
							@click="openEdit(row)"
						>
							编辑
						</el-button>
						<el-button
							v-if="canDeleteTeacherClass(row, showDeleteButton)"
							text
							type="danger"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<el-empty v-if="!tableLoading && rows.length === 0" description="当前范围内暂无合作班级" />

			<div class="teacher-channel-class-page__pagination">
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

		<el-dialog v-model="detailVisible" title="班级详情" width="720px" destroy-on-close>
			<el-descriptions v-if="detailRecord" :column="2" border>
				<el-descriptions-item label="班主任">{{ detailRecord.teacherName || '-' }}</el-descriptions-item>
				<el-descriptions-item label="班级">{{ detailRecord.className }}</el-descriptions-item>
				<el-descriptions-item label="学校">{{ detailRecord.schoolName || '-' }}</el-descriptions-item>
				<el-descriptions-item label="年级">{{ detailRecord.grade || '-' }}</el-descriptions-item>
				<el-descriptions-item label="项目标签">{{ detailRecord.projectTag || '-' }}</el-descriptions-item>
				<el-descriptions-item label="学员数">{{ detailRecord.studentCount || 0 }}</el-descriptions-item>
				<el-descriptions-item label="状态">
					<el-tag :type="classStatusTagType(detailRecord.status)">
						{{ classStatusLabel(detailRecord.status) }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">{{ detailRecord.updateTime || '-' }}</el-descriptions-item>
			</el-descriptions>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑班级' : '新增班级'"
			width="720px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="
						editingRecord?.id
							? 'closed 班级只能查看不能编辑，最终以后端校验为准。'
							: '仅 partnered teacher 出现在可选项中，terminated teacher 不可建班。'
					"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-form-item label="班主任" prop="teacherId">
					<el-select
						v-model="teacherIdModel"
						filterable
						placeholder="请选择班主任"
						style="width: 100%"
						:disabled="Boolean(editingRecord?.id)"
					>
						<el-option
							v-for="item in teacherOptions"
							:key="Number(item.id || 0)"
							:label="item.teacherName"
							:value="Number(item.id || 0)"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="班级名称" prop="className">
					<el-input v-model="form.className" maxlength="100" show-word-limit />
				</el-form-item>
				<el-form-item label="项目标签">
					<el-input v-model="form.projectTag" maxlength="50" />
				</el-form-item>
				<el-form-item label="学员数">
					<el-input-number v-model="studentCountModel" :min="0" :max="9999" />
				</el-form-item>
				<el-form-item v-if="editingRecord?.id" label="状态">
					<el-select v-model="classStatusModel" style="width: 100%">
						<el-option
							v-for="item in editableStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
			</template>
		</el-dialog>
		</div>
	</permission-overlay>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-teacher-channel-class-list'
});

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import PermissionOverlay from '../../components/permission-overlay.vue';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceTeacherClassService } from '../../service/teacherClass';
import { performanceTeacherInfoService } from '../../service/teacherInfo';
import {
	confirmElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import {
	createEmptyTeacherClass,
	type TeacherClassRecord,
	type TeacherClassStatus,
	type TeacherInfoRecord
} from '../../types';
import { canDeleteTeacherClass, canEditTeacherClass } from '../../utils/teacher-channel.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';

const TEACHER_CLASS_STATUS_DICT_KEY = 'performance.teacherChannel.classStatus';

const route = useRoute();
const router = useRouter();
const { dict } = useDict();
const teacherOptions = ref<TeacherInfoRecord[]>([]);
const submitLoading = ref(false);
const pageError = ref('');
const formVisible = ref(false);
const detailVisible = ref(false);
const editingRecord = ref<TeacherClassRecord | null>(null);
const detailRecord = ref<TeacherClassRecord | null>(null);
const formRef = ref<FormInstance>();

const form = reactive<TeacherClassRecord>(createEmptyTeacherClass());

const rules: FormRules = {
	teacherId: [{ required: true, message: '请选择班主任', trigger: 'change' }],
	className: [
		{ required: true, message: '请输入班级名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '班级名称长度需在 1-100 之间', trigger: 'blur' }
	]
};

const canAccess = computed(() => checkPerm(performanceTeacherClassService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceTeacherClassService.permission.info));
const showAddButton = computed(() => checkPerm(performanceTeacherClassService.permission.add));
const showUpdateButton = computed(() => checkPerm(performanceTeacherClassService.permission.update));
const showDeleteButton = computed(() => checkPerm(performanceTeacherClassService.permission.delete));
const statusModel = computed<TeacherClassStatus | undefined>({
	get: () => filters.status || undefined,
	set: value => {
		filters.status = value || '';
	}
});
const teacherIdModel = computed<number | undefined>({
	get: () => form.teacherId ?? undefined,
	set: value => {
		form.teacherId = value;
	}
});
const studentCountModel = computed<number>({
	get: () => Number(form.studentCount || 0),
	set: value => {
		form.studentCount = value;
	}
});
const classStatusModel = computed<TeacherClassStatus>({
	get: () => (form.status || 'draft') as TeacherClassStatus,
	set: value => {
		form.status = value;
	}
});
const classStatusOptions = computed<Array<{ label: string; value: TeacherClassStatus }>>(() =>
	dict.get(TEACHER_CLASS_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as TeacherClassStatus
	}))
);
const editableStatusOptions = computed(() =>
	classStatusOptions.value.filter(
		item => item.value !== 'closed' || editingRecord.value?.status === 'active'
	)
);
const teacherClassList = useListPage({
	createFilters: () => ({
		keyword: '',
		status: '' as TeacherClassStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params =>
		performanceTeacherClassService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			status: params.status || undefined
		}),
	onError: (error: unknown) => {
		pageError.value = resolveErrorMessage(error, '班级列表加载失败');
		ElMessage.error(pageError.value);
	}
});
const rows = teacherClassList.rows;
const tableLoading = teacherClassList.loading;
const filters = teacherClassList.filters;
const pagination = teacherClassList.pager;

onMounted(async () => {
	await dict.refresh([TEACHER_CLASS_STATUS_DICT_KEY]);
	await loadTeacherOptions();
	await refresh();
	await consumeClassRoutePreset();
});

watch(
	() => route.query,
	async () => {
		await consumeClassRoutePreset();
	},
	{ deep: true }
);

async function loadTeacherOptions() {
	try {
		const result = await performanceTeacherInfoService.fetchPage({
			page: 1,
			size: 200,
			cooperationStatus: 'partnered'
		});
		teacherOptions.value = result.list || [];
	} catch (error: unknown) {
		showElementWarningFromError(error, '合作班主任选项加载失败');
	}
}

async function refresh() {
	pageError.value = '';
	await teacherClassList.reload();
}

function handleReset() {
	void teacherClassList.reset();
}

function changePage(page: number) {
	void teacherClassList.goToPage(page);
}

function openCreate(presetTeacherId?: number) {
	editingRecord.value = null;
	Object.assign(form, createEmptyTeacherClass(), {
		teacherId: presetTeacherId || undefined
	});
	formVisible.value = true;
	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

async function openDetail(row: TeacherClassRecord) {
	const id = Number(row.id || row.classId || 0);

	if (!id) {
		return;
	}

	try {
		detailRecord.value = await performanceTeacherClassService.fetchInfo({ id });
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '班级详情加载失败');
	}
}

async function openEdit(row: TeacherClassRecord) {
	const id = Number(row.id || row.classId || 0);

	if (!id) {
		return;
	}

	try {
		const detail = await performanceTeacherClassService.fetchInfo({ id });
		editingRecord.value = detail;
		Object.assign(form, createEmptyTeacherClass(), detail, {
			id: detail.id || detail.classId
		});
		formVisible.value = true;
		nextTick(() => {
			formRef.value?.clearValidate();
		});
	} catch (error: unknown) {
		showElementErrorFromError(error, '班级详情加载失败');
	}
}

function classStatusLabel(value?: TeacherClassStatus | '') {
	return dict.getLabel(TEACHER_CLASS_STATUS_DICT_KEY, value) || value || '-';
}

function classStatusTagType(value?: TeacherClassStatus | '') {
	return dict.getMeta(TEACHER_CLASS_STATUS_DICT_KEY, value)?.tone || 'info';
}

async function submitForm() {
	await formRef.value?.validate();
	submitLoading.value = true;

	try {
		const payload = {
			id: editingRecord.value?.id || editingRecord.value?.classId,
			teacherId: Number(form.teacherId),
			className: String(form.className || '').trim(),
			projectTag: String(form.projectTag || '').trim() || undefined,
			studentCount: Number(form.studentCount || 0),
			status: editingRecord.value?.id ? form.status : undefined
		};

		if (editingRecord.value?.id || editingRecord.value?.classId) {
			await performanceTeacherClassService.updateTeacherClass(payload as TeacherClassRecord & { id: number });
		} else {
			await performanceTeacherClassService.createTeacherClass(payload);
		}

		ElMessage.success('班级保存成功');
		formVisible.value = false;
		await loadTeacherOptions();
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '班级保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: TeacherClassRecord) {
	const id = Number(row.id || row.classId || 0);

	if (!id) {
		return;
	}

	const confirmed = await confirmElementAction(`确认删除班级「${row.className}」吗？`, '删除确认');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: id,
		actionType: 'delete',
		request: () =>
			performanceTeacherClassService.removeTeacherClass({
				ids: [id]
			}),
		successMessage: '班级已删除',
		errorMessage: '班级删除失败',
		refresh
	});
}

async function consumeClassRoutePreset() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['teacherId', 'openCreate'],
		parse: query => ({
			teacherId: normalizeQueryNumber(query.teacherId),
			openCreate: firstQueryValue(query.openCreate) === '1'
		}),
		shouldConsume: payload => Boolean(payload.openCreate && payload.teacherId),
		consume: async payload => {
			if (!showAddButton.value) {
				return;
			}

			if (payload.teacherId) {
				const teacher = await performanceTeacherInfoService.fetchInfo({
					id: payload.teacherId
				});
				if (teacher.cooperationStatus !== 'partnered') {
					ElMessage.warning('仅已合作班主任可建班');
					return;
				}
			}

			openCreate(payload.teacherId);
		}
	});
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.teacher-channel.scss' as teacherChannel;

.teacher-channel-class-page {
	@include teacherChannel.teacher-channel-workspace-shell(980px);

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}
}
</style>
