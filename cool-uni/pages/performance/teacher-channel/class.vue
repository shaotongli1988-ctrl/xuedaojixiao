<!-- 文件职责：承接 cool-uni 合作班级移动列表查看；不负责新增编辑删除或报名运营；维护重点是状态展示与 partnered teacher 建班规则仍以后端为准。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="class-page" scroll-y>
			<view class="class-page__header">
				<text class="class-page__title">合作班级</text>
				<text class="class-page__subtitle"
					>查看班级列表、状态和班主任归属，不在移动端处理复杂运营</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有合作班级移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="class-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="班级 / 班主任 / 学校"
					/>
					<view class="toolbar-card__actions">
						<cl-button plain size="mini" @tap="resetFilters">重置</cl-button>
						<cl-button type="primary" size="mini" @tap="load">刷新</cl-button>
					</view>
				</view>

				<view class="status-tabs">
					<cl-tabs v-model="activeStatus" :list="statusTabs" :show-line="false" fill />
				</view>

				<page-state
					v-if="error"
					title="加载失败"
					:description="error"
					action-text="重试"
					@action="load"
				/>

				<page-state
					v-else-if="!loading && !rows.length"
					title="当前范围内暂无合作班级"
					description="可切换条件后重新查询。"
				/>

				<view v-else class="class-list">
					<view v-for="item in rows" :key="item.id || item.classId" class="class-card">
						<view class="class-card__top">
							<view>
								<text class="class-card__title">{{ item.className }}</text>
								<text class="class-card__meta">
									{{ item.teacherName || "-" }} · {{ item.schoolName || "-" }}
								</text>
							</view>
							<status-pill
								:label="teacherClassStatusLabel(item.status)"
								:tone="teacherClassStatusTone(item.status)"
							/>
						</view>

						<view class="class-card__grid">
							<text>项目标签：{{ item.projectTag || "-" }}</text>
							<text>学员数：{{ item.studentCount || 0 }}</text>
							<text>年级：{{ item.grade || "-" }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
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
import { performanceTeacherClassService } from "/@/service/performance/teacherChannel";
import { type TeacherClassRecord } from "/@/types/performance-teacher-channel";

const TEACHER_CLASS_STATUS_DICT_KEY = "performance.teacherChannel.classStatus";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/teacher-channel/class"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(TEACHER_CLASS_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const teacherClassList = useListPage<TeacherClassRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([TEACHER_CLASS_STATUS_DICT_KEY]);
		return performanceTeacherClassService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "合作班级加载失败",
});
const rows = teacherClassList.rows;
const loading = teacherClassList.loading;
const error = teacherClassList.error;
const load = teacherClassList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function teacherClassStatusLabel(value?: string | null) {
	return dict.getLabel(TEACHER_CLASS_STATUS_DICT_KEY, value) || value || "未知";
}

function teacherClassStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(TEACHER_CLASS_STATUS_DICT_KEY, value)?.tone;
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
.class-page {
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
.class-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.toolbar-card {
	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 18rpx;
	}
}

.class-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.class-card {
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
}
</style>
