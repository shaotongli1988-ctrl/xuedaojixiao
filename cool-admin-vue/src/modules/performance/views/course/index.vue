<!-- 文件职责：承接培训课程管理的列表、详情、新增、编辑和报名摘要只读查询；不负责员工报名、移动端课程页和培训全域扩展；依赖 course service、权限工具和 Element Plus 组件；维护重点是经理只读、员工无入口，且 published 状态下只能暴露冻结允许的编辑字段。 -->
<template>
	<div v-if="canAccess" class="course-page">
		<el-card shadow="never">
			<div class="course-page__toolbar">
				<div class="course-page__filters">
					<el-input
						v-model="filters.keyword"
						placeholder="按课程标题或编码筛选"
						clearable
						style="width: 240px"
						@keyup.enter="applyListFilters"
					/>
					<el-input
						v-model="filters.category"
						placeholder="课程分类"
						clearable
						style="width: 180px"
						@keyup.enter="applyListFilters"
					/>
					<el-select
						v-model="filters.status"
						placeholder="课程状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in courseStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="course-page__actions">
					<el-button @click="applyListFilters">查询</el-button>
					<el-button @click="resetListFilters">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增课程
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="course-page__header">
					<div>
						<h2>培训课程管理</h2>
						<p>课程主链仅覆盖后台管理能力，不开放员工报名页。</p>
					</div>
					<el-tag effect="plain">{{ isReadOnlyRole ? '经理只读' : 'HR 管理' }}</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="title" label="课程标题" min-width="180" />
				<el-table-column prop="code" label="课程编码" min-width="140">
					<template #default="{ row }">
						{{ row.code || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="category" label="课程分类" min-width="140">
					<template #default="{ row }">
						{{ row.category || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="课程时间" min-width="220">
					<template #default="{ row }">
						{{ formatDateRange(row.startDate, row.endDate) }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="enrollmentCount" label="报名人数" width="100">
					<template #default="{ row }">
						{{ row.enrollmentCount ?? 0 }}
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="360">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canEnterCourseLearning(row)"
							text
							type="primary"
							@click="goCourseLearning(row.id!)"
						>
							学习增强
						</el-button>
						<el-button
							v-if="canCreateCertificate(row)"
							text
							type="primary"
							@click="goCreateCertificate(row.id!)"
						>
							新建证书
						</el-button>
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
						<el-button
							v-if="canViewEnrollment(row)"
							text
							type="warning"
							@click="openEnrollment(row)"
						>
							报名摘要
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="course-page__pagination">
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

		<el-dialog
			v-model="formVisible"
			:title="editingCourse?.id ? '编辑课程' : '新增课程'"
			width="760px"
			destroy-on-close
		>
			<el-alert
				v-if="isPublishedEditing"
				type="warning"
				show-icon
				:closable="false"
				title="当前课程已发布，只允许修改课程描述、结束日期和关闭动作。"
			/>

			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<template v-if="!isPublishedEditing">
					<el-row :gutter="16">
						<el-col :span="12">
							<el-form-item label="课程标题" prop="title">
								<el-input
									v-model="form.title"
									maxlength="100"
									show-word-limit
									placeholder="请输入课程标题"
								/>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="课程编码">
								<el-input
									v-model="form.code"
									maxlength="50"
									show-word-limit
									placeholder="可为空，如填写必须唯一"
								/>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="课程分类">
								<el-input
									v-model="form.category"
									maxlength="50"
									show-word-limit
									placeholder="自由文本"
								/>
							</el-form-item>
						</el-col>
						<el-col v-if="editingCourse?.id" :span="12">
							<el-form-item label="课程状态" prop="status">
								<el-select v-model="form.status" style="width: 100%">
									<el-option
										v-for="item in draftEditableStatusOptions"
										:key="item.value"
										:label="item.label"
										:value="item.value"
									/>
								</el-select>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="开始日期">
								<el-date-picker
									v-model="form.startDate"
									type="date"
									value-format="YYYY-MM-DD"
									placeholder="可选"
									style="width: 100%"
								/>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="结束日期">
								<el-date-picker
									v-model="form.endDate"
									type="date"
									value-format="YYYY-MM-DD"
									placeholder="可选"
									style="width: 100%"
								/>
							</el-form-item>
						</el-col>
					</el-row>
				</template>

				<el-descriptions
					v-else
					:column="2"
					border
					class="course-page__locked-summary"
				>
					<el-descriptions-item label="课程标题">
						{{ editingCourse?.title || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="课程编码">
						{{ editingCourse?.code || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="课程分类">
						{{ editingCourse?.category || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="开始日期">
						{{ editingCourse?.startDate || '-' }}
					</el-descriptions-item>
				</el-descriptions>

				<el-form-item label="课程描述">
					<el-input
						v-model="form.description"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="请输入课程描述"
					/>
				</el-form-item>

				<template v-if="isPublishedEditing">
					<el-row :gutter="16">
						<el-col :span="12">
							<el-form-item label="结束日期">
								<el-date-picker
									v-model="form.endDate"
									type="date"
									value-format="YYYY-MM-DD"
									placeholder="可选"
									style="width: 100%"
								/>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="状态" prop="status">
								<el-select v-model="form.status" style="width: 100%">
									<el-option
										v-for="item in publishedEditableStatusOptions"
										:key="item.value"
										:label="item.label"
										:value="item.value"
									/>
								</el-select>
							</el-form-item>
						</el-col>
					</el-row>
				</template>

				<el-alert
					v-else-if="!editingCourse?.id"
					type="info"
					show-icon
					:closable="false"
					title="新增课程默认保存为 draft，后续可在编辑时发布。"
				/>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<el-drawer
			v-model="detailVisible"
			title="课程详情"
			size="720px"
			destroy-on-close
		>
			<el-descriptions v-if="detailCourse" :column="2" border>
				<el-descriptions-item label="课程标题">
					{{ detailCourse.title }}
				</el-descriptions-item>
				<el-descriptions-item label="课程编码">
					{{ detailCourse.code || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="课程分类">
					{{ detailCourse.category || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="课程状态">
					{{ statusLabel(detailCourse.status) }}
				</el-descriptions-item>
				<el-descriptions-item label="开始日期">
					{{ detailCourse.startDate || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="结束日期">
					{{ detailCourse.endDate || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="报名人数">
					{{ detailCourse.enrollmentCount ?? 0 }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ detailCourse.updateTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="课程描述" :span="2">
					{{ detailCourse.description || '-' }}
				</el-descriptions-item>
			</el-descriptions>

			<template #footer>
				<el-button @click="detailVisible = false">关闭</el-button>
				<el-button
					v-if="canEnterCourseLearning(detailCourse)"
					type="primary"
					plain
					@click="goDetailCourseLearning"
				>
					学习增强
				</el-button>
				<el-button
					v-if="showCreateCertificateButton && detailCourse?.id"
					type="primary"
					@click="goCreateCertificate(detailCourse.id)"
				>
					新建证书
				</el-button>
			</template>
		</el-drawer>

		<el-drawer
			v-model="enrollmentVisible"
			title="课程报名摘要"
			size="860px"
			destroy-on-close
		>
			<template v-if="enrollmentCourse">
				<div class="course-page__enrollment-toolbar">
					<div class="course-page__enrollment-title">
						<h3>{{ enrollmentCourse.title }}</h3>
						<p>报名状态和成绩只作为摘要展示，不参与课程状态流。</p>
					</div>

					<div class="course-page__enrollment-filters">
						<el-input
							v-model="enrollmentFilters.keyword"
							placeholder="学员姓名关键字"
							clearable
							style="width: 180px"
							@keyup.enter="refreshEnrollment"
						/>
						<el-input
							v-model="enrollmentFilters.status"
							placeholder="报名状态摘要"
							clearable
							style="width: 160px"
							@keyup.enter="refreshEnrollment"
						/>
						<el-button @click="refreshEnrollment">查询</el-button>
						<el-button @click="resetEnrollmentFilters">重置</el-button>
					</div>
				</div>

				<el-table :data="enrollmentRows" border v-loading="enrollmentLoading">
					<el-table-column prop="userId" label="学员ID" min-width="100" />
					<el-table-column prop="userName" label="学员姓名" min-width="140" />
					<el-table-column prop="enrollTime" label="报名时间" min-width="170" />
					<el-table-column prop="status" label="报名状态" min-width="130">
						<template #default="{ row }">
							{{ row.status || '-' }}
						</template>
					</el-table-column>
					<el-table-column prop="score" label="成绩摘要" min-width="120">
						<template #default="{ row }">
							{{ row.score ?? '-' }}
						</template>
					</el-table-column>
				</el-table>

				<div class="course-page__pagination">
					<el-pagination
						background
						layout="total, prev, pager, next"
						:current-page="enrollmentPagination.page"
						:page-size="enrollmentPagination.size"
						:total="enrollmentPagination.total"
						@current-change="changeEnrollmentPage"
					/>
				</div>
			</template>
		</el-drawer>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-course'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useRoute, useRouter } from 'vue-router';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceCertificateService } from '../../service/certificate';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import {
	performanceCourseExamService,
	performanceCoursePracticeService,
	performanceCourseReciteService
} from '../../service/course-learning';
import {
	type CourseEnrollmentRecord,
	type CourseRecord,
	type CourseStatus,
	createEmptyCourse
} from '../../types';
import { performanceCourseService } from '../../service/course';

interface CourseFormModel {
	title: string;
	code: string;
	category: string;
	description: string;
	startDate?: string;
	endDate?: string;
	status: CourseStatus;
}

const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const enrollmentVisible = ref(false);
const detailCourse = ref<CourseRecord | null>(null);
const editingCourse = ref<CourseRecord | null>(null);
const enrollmentCourse = ref<CourseRecord | null>(null);
const enrollmentRows = ref<CourseEnrollmentRecord[]>([]);
const enrollmentLoading = ref(false);
const formRef = ref<FormInstance>();
const route = useRoute();
const router = useRouter();

const form = reactive<CourseFormModel>(createEmptyCourseForm());

const enrollmentFilters = reactive({
	keyword: '',
	status: ''
});

const enrollmentPagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const rules = {
	title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
	status: [{ required: true, message: '请选择课程状态', trigger: 'change' }]
};

const courseStatusOptions: Array<{ label: string; value: CourseStatus }> = [
	{ label: '草稿', value: 'draft' },
	{ label: '已发布', value: 'published' },
	{ label: '已关闭', value: 'closed' }
];

const draftEditableStatusOptions: Array<{ label: string; value: CourseStatus }> = [
	{ label: '草稿', value: 'draft' },
	{ label: '发布', value: 'published' }
];

const publishedEditableStatusOptions: Array<{ label: string; value: CourseStatus }> = [
	{ label: '保持已发布', value: 'published' },
	{ label: '关闭课程', value: 'closed' }
];

const canAccess = computed(() => checkPerm(performanceCourseService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceCourseService.permission.info));
const showAddButton = computed(() => checkPerm(performanceCourseService.permission.add));
const showEditButton = computed(() => checkPerm(performanceCourseService.permission.update));
const showDeleteButton = computed(() => checkPerm(performanceCourseService.permission.delete));
const showEnrollmentButton = computed(() =>
	checkPerm(performanceCourseService.permission.enrollmentPage)
);
const showCreateCertificateButton = computed(() =>
	checkPerm(performanceCertificateService.permission.add)
);
const showCourseLearningButton = computed(() =>
	[
		performanceCourseReciteService.permission.page,
		performanceCoursePracticeService.permission.page,
		performanceCourseExamService.permission.summary
	].some(checkPerm)
);
const isReadOnlyRole = computed(() => canAccess.value && !showAddButton.value && !showEditButton.value);
const isPublishedEditing = computed(() => editingCourse.value?.status === 'published');
const courseList = useListPage({
	createFilters: () => ({
		keyword: '',
		category: '',
		status: '' as CourseStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: params =>
		performanceCourseService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: normalizeOptionalText(String(params.keyword || '')),
			category: normalizeOptionalText(String(params.category || '')),
			status: params.status ? String(params.status) : undefined
		}),
	onError: (error: any) => {
		ElMessage.error(error.message || '课程列表加载失败');
	}
});
const rows = courseList.rows;
const tableLoading = courseList.loading;
const filters = courseList.filters;
const pager = courseList.pager;

onMounted(async () => {
	await syncList();
	await consumeRouteDetailQuery();
});

watch(
	() => route.fullPath,
	() => {
		void consumeRouteDetailQuery();
	}
);

async function syncList() {
	await courseList.reload();
}

function changeListPage(page: number) {
	void courseList.goToPage(page);
}

function applyListFilters() {
	void courseList.search();
}

function resetListFilters() {
	void courseList.reset();
}

function openCreate() {
	editingCourse.value = null;
	Object.assign(form, createEmptyCourseForm());
	formVisible.value = true;
}

async function openEdit(row: CourseRecord) {
	const detail = await fetchDetail(row.id!);

	if (!detail) {
		return;
	}

	if (detail.status === 'closed') {
		ElMessage.warning('已关闭课程不允许继续编辑');
		return;
	}

	editingCourse.value = detail;
	Object.assign(form, mapCourseToForm(detail));
	formVisible.value = true;
}

async function openDetail(row: CourseRecord) {
	const detail = await fetchDetail(row.id!);

	if (!detail) {
		return;
	}

	detailCourse.value = detail;
	detailVisible.value = true;
}

async function goCreateCertificate(courseId: number) {
	detailVisible.value = false;

	await router.push({
		path: '/performance/certificate',
		query: {
			openCreate: '1',
			sourceCourseId: String(courseId)
		}
	});
}

async function goCourseLearning(courseId: number) {
	detailVisible.value = false;

	await router.push({
		path: '/performance/course-learning',
		query: {
			courseId: String(courseId)
		}
	});
}

async function goDetailCourseLearning() {
	if (!detailCourse.value?.id) {
		return;
	}

	await goCourseLearning(detailCourse.value.id);
}

async function openEnrollment(row: CourseRecord) {
	const detail = await fetchDetail(row.id!);

	if (!detail) {
		return;
	}

	enrollmentCourse.value = detail;
	enrollmentPagination.page = 1;
	enrollmentFilters.keyword = '';
	enrollmentFilters.status = '';
	enrollmentVisible.value = true;
	await refreshEnrollment();
}

async function fetchDetail(id: number) {
	try {
		return await performanceCourseService.fetchInfo({ id });
	} catch (error: any) {
		ElMessage.error(error.message || '课程详情加载失败');
		return null;
	}
}

async function consumeRouteDetailQuery() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openDetail', 'courseId'],
		parse: query => ({
			shouldOpenDetail: firstQueryValue(query.openDetail) === '1',
			courseId: normalizeQueryNumber(query.courseId)
		}),
		shouldConsume: payload =>
			Boolean(payload.shouldOpenDetail && payload.courseId && showInfoButton.value),
		consume: async payload => {
			const detail = await fetchDetail(payload.courseId);

			if (detail) {
				detailCourse.value = detail;
				detailVisible.value = true;
			}
		}
	});
}

async function submitForm() {
	await formRef.value?.validate();

	if (hasInvalidDateRange()) {
		ElMessage.error('结束日期不能早于开始日期');
		return;
	}

	submitLoading.value = true;

	try {
		if (editingCourse.value?.id) {
			await performanceCourseService.updateCourse(buildUpdatePayload(editingCourse.value));
		} else {
			await performanceCourseService.createCourse(buildCreatePayload());
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await syncList();
	} catch (error: any) {
		ElMessage.error(error.message || '课程保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: CourseRecord) {
	try {
		await ElMessageBox.confirm(`确认删除课程「${row.title}」吗？`, '删除确认', {
			type: 'warning'
		});
		await performanceCourseService.removeCourse({ ids: [row.id!] });
		ElMessage.success('删除成功');

		if (rows.value.length === 1 && pager.page > 1) {
			pager.page -= 1;
		}

		await syncList();
	} catch (error: any) {
		if (error !== 'cancel') {
			ElMessage.error(error.message || '课程删除失败');
		}
	}
}

async function refreshEnrollment() {
	if (!enrollmentVisible.value || !enrollmentCourse.value?.id) {
		return;
	}

	enrollmentLoading.value = true;

	try {
		const result = await performanceCourseService.fetchEnrollmentPage({
			page: enrollmentPagination.page,
			size: enrollmentPagination.size,
			courseId: enrollmentCourse.value.id,
			keyword: normalizeOptionalText(enrollmentFilters.keyword),
			status: normalizeOptionalText(enrollmentFilters.status)
		});

		enrollmentRows.value = result.list || [];
		enrollmentPagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '报名摘要加载失败');
	} finally {
		enrollmentLoading.value = false;
	}
}

function resetEnrollmentFilters() {
	enrollmentFilters.keyword = '';
	enrollmentFilters.status = '';
	enrollmentPagination.page = 1;
	refreshEnrollment();
}

function changeEnrollmentPage(page: number) {
	enrollmentPagination.page = page;
	refreshEnrollment();
}

function buildCreatePayload(): Partial<CourseRecord> {
	return {
		title: form.title.trim(),
		code: normalizeOptionalText(form.code),
		category: normalizeOptionalText(form.category),
		description: normalizeOptionalText(form.description),
		startDate: normalizeOptionalText(form.startDate || ''),
		endDate: normalizeOptionalText(form.endDate || ''),
		status: 'draft' as CourseStatus
	};
}

function buildUpdatePayload(course: CourseRecord): Partial<CourseRecord> & { id: number } {
	if (course.status === 'published') {
		return {
			id: course.id!,
			description: normalizeOptionalText(form.description),
			endDate: normalizeOptionalText(form.endDate || ''),
			status: (form.status === 'closed' ? 'closed' : 'published') as CourseStatus
		};
	}

	return {
		id: course.id!,
		title: form.title.trim(),
		code: normalizeOptionalText(form.code),
		category: normalizeOptionalText(form.category),
		description: normalizeOptionalText(form.description),
		startDate: normalizeOptionalText(form.startDate || ''),
		endDate: normalizeOptionalText(form.endDate || ''),
		status: form.status || 'draft'
	};
}

function hasInvalidDateRange() {
	if (!form.startDate || !form.endDate) {
		return false;
	}

	return form.endDate < form.startDate;
}

function canEdit(row: CourseRecord) {
	if (!showEditButton.value) {
		return false;
	}

	return row.status === 'draft' || row.status === 'published';
}

function canDelete(row: CourseRecord) {
	return showDeleteButton.value && row.status === 'draft';
}

function canCreateCertificate(row: CourseRecord) {
	return showCreateCertificateButton.value && Boolean(row.id);
}

function canEnterCourseLearning(row: CourseRecord | null) {
	return Boolean(
		row?.id &&
		showCourseLearningButton.value &&
		(row.status === 'published' || row.status === 'closed')
	);
}

function canViewEnrollment(row: CourseRecord) {
	if (!showEnrollmentButton.value) {
		return false;
	}

	return row.status === 'published' || row.status === 'closed';
}

function statusLabel(status?: CourseStatus) {
	return courseStatusOptions.find(item => item.value === status)?.label || status || '-';
}

function statusTagType(status?: CourseStatus) {
	const map: Record<CourseStatus, 'info' | 'success' | 'warning'> = {
		draft: 'info',
		published: 'success',
		closed: 'warning'
	};

	return status ? map[status] : 'info';
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
	const start = startDate || '-';
	const end = endDate || '-';
	return `${start} ~ ${end}`;
}

function normalizeOptionalText(value?: string | null) {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

function createEmptyCourseForm(): CourseFormModel {
	const course = createEmptyCourse();
	return {
		title: course.title,
		code: course.code || '',
		category: course.category || '',
		description: course.description || '',
		startDate: course.startDate || undefined,
		endDate: course.endDate || undefined,
		status: course.status || 'draft'
	};
}

function mapCourseToForm(course: CourseRecord): CourseFormModel {
	return {
		title: course.title || '',
		code: course.code || '',
		category: course.category || '',
		description: course.description || '',
		startDate: course.startDate || undefined,
		endDate: course.endDate || undefined,
		status: course.status || 'draft'
	};
}
</script>

<style scoped>
.course-page {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.course-page__toolbar,
.course-page__header,
.course-page__enrollment-toolbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
}

.course-page__filters,
.course-page__actions,
.course-page__enrollment-filters {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.course-page__header h2,
.course-page__enrollment-title h3 {
	margin: 0;
	font-size: 20px;
	color: var(--el-text-color-primary);
}

.course-page__header p,
.course-page__enrollment-title p {
	margin: 6px 0 0;
	color: var(--el-text-color-secondary);
}

.course-page__pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
}

.course-page__locked-summary {
	margin-bottom: 16px;
}

@media (max-width: 768px) {
	.course-page__toolbar,
	.course-page__header,
	.course-page__enrollment-toolbar {
		flex-direction: column;
	}
}
</style>
