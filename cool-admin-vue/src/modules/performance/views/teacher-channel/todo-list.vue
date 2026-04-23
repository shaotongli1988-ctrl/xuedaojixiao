<!-- 文件职责：承接主题19班主任待跟进 today / overdue 清单与跳转动作；不负责资源编辑、合作标记或复杂看板统计；依赖 teacherTodo service 和主题19路由预置参数；维护重点是待办只允许 today / overdue 两类派生桶，不能扩展新主状态。 -->
<template>
	<permission-overlay
		:denied="!canAccess"
		:permission-key="performanceTeacherTodoService.permission.page"
		title="当前账号暂未开通待跟进页权限"
		description="页面内容已切换到保护态。请联系管理员开通待跟进查看权限后再处理 today / overdue 资源。"
	>
		<div class="teacher-channel-todo-page">
		<el-card shadow="never" class="teacher-channel-todo-page__toolbar-card">
			<div class="teacher-channel-todo-page__toolbar">
				<div class="teacher-channel-todo-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						clearable
						placeholder="班主任 / 学校 / 联系方式"
						style="width: 260px"
						@keyup.enter="refresh"
					/>
					<el-select
						v-model="bucketModel"
						clearable
						placeholder="待办桶"
						style="width: 180px"
					>
						<el-option
							v-for="item in todoBucketOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="teacher-channel-todo-page__toolbar-right">
					<el-button @click="handleReset">重置</el-button>
					<el-button type="primary" :loading="loading" @click="refresh">刷新</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :md="12">
				<el-card shadow="never" class="teacher-channel-todo-page__summary-card">
					<div class="teacher-channel-todo-page__summary-label">今日待跟进</div>
					<div class="teacher-channel-todo-page__summary-value">{{ bucketSummary.today }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :md="12">
				<el-card shadow="never" class="teacher-channel-todo-page__summary-card">
					<div class="teacher-channel-todo-page__summary-label">已逾期待跟进</div>
					<div class="teacher-channel-todo-page__summary-value teacher-channel-todo-page__summary-value--danger">
						{{ bucketSummary.overdue }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never" class="teacher-channel-todo-page__content-card">
			<template #header>
				<div class="teacher-channel-todo-page__header">
					<div>
						<h2>班主任待跟进</h2>
						<p>列表只展示 today / overdue 派生待办，不新增其他状态。</p>
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

			<el-table :data="rows" border v-loading="loading">
				<el-table-column prop="teacherName" label="班主任" min-width="140" />
				<el-table-column prop="schoolName" label="学校" min-width="180">
					<template #default="{ row }">
						{{ row.schoolName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="phone" label="联系电话" min-width="150">
					<template #default="{ row }">
						{{ row.phone || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="ownerEmployeeName" label="负责人" min-width="120">
					<template #default="{ row }">
						{{ row.ownerEmployeeName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="todoBucket" label="待办桶" width="140">
					<template #default="{ row }">
						<el-tag :type="todoBucketTagType(row.todoBucket)">
							{{ todoBucketLabel(row.todoBucket) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="cooperationStatus" label="合作状态" width="120">
					<template #default="{ row }">
						<el-tag :type="cooperationStatusTagType(row.cooperationStatus)">
							{{ cooperationStatusLabel(row.cooperationStatus) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="nextFollowTime" label="下次跟进时间" min-width="170">
					<template #default="{ row }">
						{{ row.nextFollowTime || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="操作" min-width="200" fixed="right">
					<template #default="{ row }">
						<el-button text @click="openTeacher(row, false)">详情</el-button>
						<el-button v-if="canOpenFollow" text type="primary" @click="openTeacher(row, true)">
							去跟进
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<el-empty v-if="!loading && rows.length === 0" description="当前范围内暂无待跟进资源" />

			<div class="teacher-channel-todo-page__pagination">
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
		</div>
	</permission-overlay>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-teacher-channel-todo-list'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import PermissionOverlay from '../../components/permission-overlay.vue';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceTeacherTodoService } from '../../service/teacherTodo';
import { performanceTeacherFollowService } from '../../service/teacherFollow';
import { resolveErrorMessage } from '../shared/error-message';
import type { TeacherTodoBucket, TeacherTodoRecord } from '../../types';

const TEACHER_COOPERATION_STATUS_DICT_KEY = 'performance.teacherChannel.cooperationStatus';
const TEACHER_TODO_BUCKET_DICT_KEY = 'performance.teacherChannel.todoBucket';

const router = useRouter();
const { dict } = useDict();
const pageError = ref('');
const bucketSummary = reactive({
	today: 0,
	overdue: 0
});

const canAccess = computed(() => checkPerm(performanceTeacherTodoService.permission.page));
const canOpenFollow = computed(() => checkPerm(performanceTeacherFollowService.permission.add));
const todoBucketOptions = computed<Array<{ label: string; value: TeacherTodoBucket }>>(() =>
	dict.get(TEACHER_TODO_BUCKET_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as TeacherTodoBucket
	}))
);
const todoList = useListPage({
	createFilters: () => ({
		keyword: '',
		todoBucket: '' as TeacherTodoBucket | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceTeacherTodoService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			todoBucket: params.todoBucket || undefined
		});
		bucketSummary.today = result.bucketSummary?.today || 0;
		bucketSummary.overdue = result.bucketSummary?.overdue || 0;
		return result;
	},
	onError: (error: unknown) => {
		pageError.value = resolveErrorMessage(error, '班主任待办加载失败');
		ElMessage.error(pageError.value);
	}
});
const rows = todoList.rows;
const loading = todoList.loading;
const filters = todoList.filters;
const pagination = todoList.pager;
const bucketModel = computed<TeacherTodoBucket | undefined>({
	get: () => filters.todoBucket || undefined,
	set: value => {
		filters.todoBucket = value || '';
	}
});

onMounted(async () => {
	await dict.refresh([TEACHER_COOPERATION_STATUS_DICT_KEY, TEACHER_TODO_BUCKET_DICT_KEY]);
	await refresh();
});

async function refresh() {
	pageError.value = '';
	await todoList.reload();
}

function handleReset() {
	void todoList.reset();
}

function changePage(page: number) {
	void todoList.goToPage(page);
}

function openTeacher(row: TeacherTodoRecord, openFollow: boolean) {
	const teacherId = Number(row.id || row.teacherId || 0);

	if (!teacherId) {
		return;
	}

	router.push({
		path: '/performance/teacher-channel/teacher',
		query: {
			teacherId: String(teacherId),
			openDetail: '1',
			...(openFollow ? { openFollow: '1' } : {})
		}
	});
}

function todoBucketLabel(value?: TeacherTodoBucket | '') {
	return dict.getLabel(TEACHER_TODO_BUCKET_DICT_KEY, value) || value || '-';
}

function todoBucketTagType(value?: TeacherTodoBucket | '') {
	return dict.getMeta(TEACHER_TODO_BUCKET_DICT_KEY, value)?.tone || 'info';
}

function cooperationStatusLabel(value?: string) {
	return dict.getLabel(TEACHER_COOPERATION_STATUS_DICT_KEY, value) || value || '-';
}

function cooperationStatusTagType(value?: string) {
	return dict.getMeta(TEACHER_COOPERATION_STATUS_DICT_KEY, value)?.tone || 'info';
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.teacher-channel.scss' as teacherChannel;

.teacher-channel-todo-page {
	@include teacherChannel.teacher-channel-workspace-shell(1040px);

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}

	&__summary-label {
		color: var(--app-text-secondary);
		font-size: var(--app-font-size-caption);
	}

	&__summary-value {
		margin-top: 8px;
		font-size: var(--app-font-size-kpi);
		font-weight: 700;
		color: var(--app-accent-warning);
	}

	&__summary-value--danger {
		color: var(--app-accent-danger);
	}
}
</style>
