<!-- 文件职责：承接 cool-uni 班主任待办 today / overdue 清单与跳转动作；不负责资源编辑、合作标记、班级管理或复杂看板；维护重点是待办桶只能消费 today / overdue 两类派生值。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="todo-page" scroll-y>
			<view class="todo-page__header">
				<text class="todo-page__title">班主任待办</text>
				<text class="todo-page__subtitle">只展示 today / overdue 两类派生待办，联系方式以后端返回为准</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有班主任待办入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="todo-page__body">
				<view class="todo-toolbar">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="班主任 / 学校 / 联系方式"
					/>
					<view class="todo-toolbar__actions">
						<cl-button plain size="mini" @tap="resetFilters">重置</cl-button>
						<cl-button type="primary" size="mini" @tap="load">刷新</cl-button>
					</view>
				</view>

				<view class="todo-stats">
					<view class="todo-stat">
						<text class="todo-stat__label">今日待跟进</text>
						<text class="todo-stat__value">{{ bucketSummary.today }}</text>
					</view>
					<view class="todo-stat">
						<text class="todo-stat__label">已逾期待跟进</text>
						<text class="todo-stat__value todo-stat__value--danger">{{ bucketSummary.overdue }}</text>
					</view>
				</view>

				<view class="todo-panel">
					<cl-tabs v-model="activeBucket" :list="bucketTabs" :show-line="false" fill />

					<page-state v-if="error" title="加载失败" :description="error" action-text="重试" @action="load" />

					<page-state v-else-if="!loading && !rows.length" title="当前范围内暂无待办" description="可以切换筛选条件后再试。" />

					<view v-else class="todo-list">
						<view v-for="item in rows" :key="item.id" class="todo-card">
							<view class="todo-card__top">
								<view>
									<text class="todo-card__title">{{ item.teacherName }}</text>
									<text class="todo-card__meta">
										{{ item.schoolName || "-" }} · {{ item.ownerEmployeeName || "-" }}
									</text>
								</view>
								<status-pill
									:label="teacherTodoBucketLabel(item.todoBucket)"
									:tone="teacherTodoBucketTone(item.todoBucket)"
								/>
							</view>

							<view class="todo-card__grid">
								<text>联系电话：{{ item.phone || "-" }}</text>
								<text>合作状态：{{ teacherCooperationStatusLabel(item.cooperationStatus) }}</text>
								<text>下次跟进：{{ item.nextFollowTime || "-" }}</text>
								<text>上次跟进：{{ item.lastFollowTime || "-" }}</text>
							</view>

							<view class="todo-card__actions">
								<cl-button plain size="mini" @tap="openDetail(item.id)">查看详情</cl-button>
								<cl-button v-if="canFollowAdd" type="primary" size="mini" @tap="openDetail(item.id, true)">
									去跟进
								</cl-button>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { useListPage } from "/@/hooks/use-list-page";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import {
	performanceTeacherFollowService,
	performanceTeacherTodoService,
} from "/@/service/performance/teacherChannel";
import { type TeacherInfoRecord } from "/@/types/performance-teacher-channel";

const { router } = useCool();
const { user, dict } = useStore();

const TEACHER_COOPERATION_STATUS_DICT_KEY = "performance.teacherChannel.cooperationStatus";
const TEACHER_TODO_BUCKET_DICT_KEY = "performance.teacherChannel.todoBucket";

const keyword = ref("");
const activeBucket = ref<"all" | "today" | "overdue">("all");
const pagination = reactive({
	page: 1,
	size: 20,
	total: 0,
});
const bucketSummary = reactive({
	today: 0,
	overdue: 0,
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/teacher-channel/todo"));
const canFollowAdd = computed(() => user.hasPerm(performanceTeacherFollowService.permission.add));
const bucketTabs = computed(() => [
	{ label: `全部 (${pagination.total})`, value: "all" },
	...dict.get(TEACHER_TODO_BUCKET_DICT_KEY).map((item) => ({
		label: `${item.label} (${item.value === "today" ? bucketSummary.today : bucketSummary.overdue})`,
		value: String(item.value),
	})),
]);
const teacherTodoList = useListPage<TeacherInfoRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([TEACHER_COOPERATION_STATUS_DICT_KEY, TEACHER_TODO_BUCKET_DICT_KEY]);
		const res = await performanceTeacherTodoService.fetchPage({
			page: 1,
			size: pagination.size,
			keyword: keyword.value.trim() || undefined,
			todoBucket: activeBucket.value === "all" ? undefined : activeBucket.value,
		});
		pagination.total = res?.pagination?.total || 0;
		bucketSummary.today = res?.bucketSummary?.today || 0;
		bucketSummary.overdue = res?.bucketSummary?.overdue || 0;
		return {
			list: (res?.list || []) as TeacherInfoRecord[],
		};
	},
	resolveError: (error) => (error as any)?.message || "班主任待办加载失败",
});
const rows = teacherTodoList.rows;
const loading = teacherTodoList.loading;
const error = teacherTodoList.error;
const load = teacherTodoList.reload;

function resetFilters() {
	keyword.value = "";
	activeBucket.value = "all";
	load();
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function openDetail(id?: number, openFollow = false) {
	if (!id) return;

	router.push({
		path: "/pages/performance/teacher-channel/detail",
		query: {
			teacherId: id,
			...(openFollow ? { openFollow: 1 } : {}),
		},
	});
}

function teacherTodoBucketLabel(value?: string | null) {
	return dict.getLabel(TEACHER_TODO_BUCKET_DICT_KEY, value) || value || "待跟进";
}

function teacherTodoBucketTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(TEACHER_TODO_BUCKET_DICT_KEY, value)?.tone;
	return tone === "warning" || tone === "success" ? tone : tone === "danger" ? "error" : "info";
}

function teacherCooperationStatusLabel(value?: string | null) {
	return dict.getLabel(TEACHER_COOPERATION_STATUS_DICT_KEY, value) || value || "未知";
}

watch(activeBucket, load);

onShow(load);

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.todo-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__header {
		padding: 12rpx 8rpx 20rpx;
	}

	&__title {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__subtitle {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #687489;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.todo-toolbar,
.todo-panel,
.todo-card,
.todo-stat {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.todo-toolbar {
	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 18rpx;
	}
}

.todo-stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
}

.todo-stat {
	&__label {
		display: block;
		font-size: 22rpx;
		color: #748198;
	}

	&__value {
		display: block;
		margin-top: 12rpx;
		font-size: 38rpx;
		font-weight: 700;
		color: #1e4db7;
	}

	&__value--danger {
		color: #c43333;
	}
}

.todo-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-top: 24rpx;
}

.todo-card {
	&__top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #748198;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
		margin-top: 24rpx;
		font-size: 24rpx;
		line-height: 1.6;
		color: #4f5c74;
	}

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 24rpx;
	}
}
</style>
