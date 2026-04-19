<!-- 文件职责：承接主题19班主任待跟进 today / overdue 清单与跳转动作；不负责资源编辑、合作标记或复杂看板统计；依赖 teacherTodo service 和主题19路由预置参数；维护重点是待办只允许 today / overdue 两类派生桶，不能扩展新主状态。 -->
<template>
	<div v-if="canAccess" class="teacher-channel-todo-page">
		<el-card shadow="never">
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
							v-for="item in teacherTodoBucketOptions"
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
				<el-card shadow="never">
					<div class="teacher-channel-todo-page__summary-label">今日待跟进</div>
					<div class="teacher-channel-todo-page__summary-value">{{ bucketSummary.today }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :md="12">
				<el-card shadow="never">
					<div class="teacher-channel-todo-page__summary-label">已逾期待跟进</div>
					<div class="teacher-channel-todo-page__summary-value teacher-channel-todo-page__summary-value--danger">
						{{ bucketSummary.overdue }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
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
						<el-tag :type="row.todoBucket === 'overdue' ? 'danger' : 'warning'">
							{{ teacherTodoBucketLabel(row.todoBucket) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="cooperationStatus" label="合作状态" width="120">
					<template #default="{ row }">
						<el-tag :type="teacherCooperationStatusTagType(row.cooperationStatus)">
							{{ teacherCooperationStatusLabel(row.cooperationStatus) }}
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

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-teacher-channel-todo-list'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { performanceTeacherTodoService } from '../../service/teacherTodo';
import { performanceTeacherFollowService } from '../../service/teacherFollow';
import type { TeacherTodoBucket, TeacherTodoRecord } from '../../types';
import {
	teacherCooperationStatusLabel,
	teacherCooperationStatusTagType,
	teacherTodoBucketLabel,
	teacherTodoBucketOptions
} from '../../utils/teacher-channel.js';

const router = useRouter();
const loading = ref(false);
const pageError = ref('');
const rows = ref<TeacherTodoRecord[]>([]);

const filters = reactive({
	keyword: '',
	todoBucket: '' as TeacherTodoBucket | ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const bucketSummary = reactive({
	today: 0,
	overdue: 0
});

const canAccess = computed(() => checkPerm(performanceTeacherTodoService.permission.page));
const canOpenFollow = computed(() => checkPerm(performanceTeacherFollowService.permission.add));
const bucketModel = computed<TeacherTodoBucket | undefined>({
	get: () => filters.todoBucket || undefined,
	set: value => {
		filters.todoBucket = value || '';
	}
});

onMounted(() => {
	refresh();
});

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	loading.value = true;
	pageError.value = '';

	try {
		const result = await performanceTeacherTodoService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			todoBucket: filters.todoBucket || undefined
		});
		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
		bucketSummary.today = result.bucketSummary?.today || 0;
		bucketSummary.overdue = result.bucketSummary?.overdue || 0;
	} catch (error: any) {
		pageError.value = error.message || '班主任待办加载失败';
		ElMessage.error(pageError.value);
	} finally {
		loading.value = false;
	}
}

function handleReset() {
	filters.keyword = '';
	filters.todoBucket = '';
	pagination.page = 1;
	refresh();
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
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
</script>

<style lang="scss" scoped>
.teacher-channel-todo-page {
	display: grid;
	gap: 16px;

	&__toolbar,
	&__toolbar-left,
	&__toolbar-right,
	&__header {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	&__toolbar,
	&__header {
		justify-content: space-between;
	}

	&__summary-label {
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}

	&__summary-value {
		margin-top: 8px;
		font-size: 28px;
		font-weight: 700;
		color: var(--el-color-warning);
	}

	&__summary-value--danger {
		color: var(--el-color-danger);
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}

	h2,
	p {
		margin: 0;
	}

	p {
		margin-top: 4px;
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}
}
</style>
