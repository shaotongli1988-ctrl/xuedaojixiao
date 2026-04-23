<!-- 文件职责：承接 cool-uni 课程管理移动列表；不负责课程编辑、报名明细和员工报名主链；维护重点是只展示课程摘要并可跳去学习增强页。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="course-page" scroll-y>
			<view class="course-page__header">
				<text class="course-page__title">课程管理</text>
				<text class="course-page__subtitle">查看课程列表、状态和报名人数，复杂维护动作仍保留桌面端</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有课程管理移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="course-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="课程标题 / 编码"
					/>
					<view class="toolbar-card__actions">
						<cl-button plain size="mini" @tap="resetFilters">重置</cl-button>
						<cl-button type="primary" size="mini" @tap="load">刷新</cl-button>
					</view>
				</view>

				<view class="status-tabs">
					<cl-tabs v-model="activeStatus" :list="statusTabs" :show-line="false" fill />
				</view>

				<page-state v-if="error" title="加载失败" :description="error" action-text="重试" @action="load" />

				<page-state v-else-if="!loading && !rows.length" title="当前暂无课程" description="当前筛选条件下暂无数据。" />

				<view v-else class="course-list">
					<view v-for="item in rows" :key="item.id" class="course-card">
						<view class="course-card__top">
							<view>
								<text class="course-card__title">{{ item.title }}</text>
								<text class="course-card__meta">{{ item.code || "-" }} · {{ item.category || "-" }}</text>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="course-card__grid">
							<text>课程时间：{{ item.startDate || "-" }} ~ {{ item.endDate || "-" }}</text>
							<text>报名人数：{{ item.enrollmentCount ?? 0 }}</text>
						</view>

						<text class="course-card__summary">{{ item.description || "暂无课程描述" }}</text>

						<view class="course-card__actions">
							<cl-button
								v-if="item.id"
								plain
								size="mini"
								@tap="openLearning(item.id)"
							>
								学习增强
							</cl-button>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { useListPage } from "/@/hooks/use-list-page";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import { performanceCourseService } from "/@/service/performance/course";
import { type CourseRecord } from "/@/types/performance-course";

const COURSE_STATUS_DICT_KEY = "performance.course.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/course/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(COURSE_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const courseList = useListPage<CourseRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([COURSE_STATUS_DICT_KEY]);
		return performanceCourseService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "课程列表加载失败",
});
const rows = courseList.rows;
const loading = courseList.loading;
const error = courseList.error;
const load = courseList.reload;

function openLearning(courseId: number) {
	router.push({
		path: "/pages/performance/course-learning/index",
		query: { courseId },
	});
}

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string | null) {
	return dict.getLabel(COURSE_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(COURSE_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

watch(activeStatus, load);
onShow(load);
onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.course-page {
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
		line-height: 1.7;
		color: #687489;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.toolbar-card,
.status-tabs,
.course-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.toolbar-card__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	margin-top: 18rpx;
}

.course-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.course-card {
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

	&__summary {
		display: block;
		margin-top: 22rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
		white-space: pre-wrap;
	}

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 24rpx;
	}
}
</style>
