<!-- 文件职责：承接 cool-uni 招聘计划移动列表；不负责导入导出、状态流转或职位标准联动；维护重点是只消费招聘计划摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="recruit-plan-page" scroll-y>
			<view class="recruit-plan-page__header">
				<text class="recruit-plan-page__title">招聘计划</text>
				<text class="recruit-plan-page__subtitle">查看招聘计划、岗位、人头和状态摘要，复杂维护动作仍保留桌面端</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有招聘计划移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="recruit-plan-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="标题 / 岗位关键字"
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

				<page-state v-else-if="!loading && !rows.length" title="当前暂无招聘计划" description="当前筛选条件下暂无数据。" />

				<view v-else class="recruit-plan-list">
					<view v-for="item in rows" :key="item.id" class="recruit-plan-card">
						<view class="recruit-plan-card__top">
							<view>
								<text class="recruit-plan-card__title">{{ item.title }}</text>
								<text class="recruit-plan-card__meta">
									{{ item.targetDepartmentName || "-" }} · {{ item.positionName }}
								</text>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="recruit-plan-card__grid">
							<text>人数：{{ item.headcount }}</text>
							<text>负责人：{{ item.recruiterName || "-" }}</text>
							<text>计划周期：{{ item.startDate }} ~ {{ item.endDate }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
						</view>

						<text class="recruit-plan-card__summary">{{ item.requirementSummary || "暂无需求摘要" }}</text>
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
import { performanceRecruitPlanService } from "/@/service/performance/recruitPlan";
import { type RecruitPlanRecord } from "/@/types/performance-recruit-plan";

const RECRUIT_PLAN_STATUS_DICT_KEY = "performance.recruitPlan.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/recruit-plan/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(RECRUIT_PLAN_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const recruitPlanList = useListPage<RecruitPlanRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([RECRUIT_PLAN_STATUS_DICT_KEY]);
		return performanceRecruitPlanService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "招聘计划列表加载失败",
});
const rows = recruitPlanList.rows;
const loading = recruitPlanList.loading;
const error = recruitPlanList.error;
const load = recruitPlanList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string | null) {
	return dict.getLabel(RECRUIT_PLAN_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(RECRUIT_PLAN_STATUS_DICT_KEY, value)?.tone;
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
.recruit-plan-page {
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
.recruit-plan-card {
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

.recruit-plan-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.recruit-plan-card {
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
}
</style>
