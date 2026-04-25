<!-- 文件职责：承接 cool-uni 工作计划移动列表与执行动作；不负责新建编辑、钉钉来源同步或复杂审批映射；维护重点是开始/完成/取消动作必须继续遵守 workPlan 既有状态机。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="work-plan-page" scroll-y>
			<view class="work-plan-page__header">
				<text class="work-plan-page__title">工作计划</text>
				<text class="work-plan-page__subtitle"
					>查看计划列表并在移动端处理开始、完成、取消三类高频动作</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有工作计划移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="work-plan-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="计划标题 / 单号 / 来源标题"
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
					title="当前暂无工作计划"
					description="可切换状态条件后重新查询。"
				/>

				<view v-else class="plan-list">
					<view v-for="item in rows" :key="item.id" class="plan-card">
						<view class="plan-card__top">
							<view>
								<text class="plan-card__title">{{ item.title }}</text>
								<text class="plan-card__meta">
									{{ item.workNo || "-" }} ·
									{{ item.ownerName || item.ownerDepartmentName || "-" }}
								</text>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="plan-card__grid">
							<text>优先级：{{ priorityLabel(item.priority) }}</text>
							<text>来源：{{ sourceTypeLabel(item.sourceType) }}</text>
							<text>来源审批：{{ sourceStatusLabel(item.sourceStatus) }}</text>
							<text
								>计划周期：{{ item.plannedStartDate || "-" }} ~
								{{ item.plannedEndDate || "-" }}</text
							>
						</view>

						<text class="plan-card__summary">
							{{
								item.progressSummary ||
								item.resultSummary ||
								item.description ||
								item.sourceTitle ||
								"暂无补充说明"
							}}
						</text>

						<view class="plan-card__actions">
							<cl-button
								v-if="canStart && canStartWorkPlan(item)"
								type="primary"
								size="mini"
								:loading="actionId === item.id && actionType === 'start'"
								@tap="runAction('start', item)"
							>
								开始
							</cl-button>
							<cl-button
								v-if="canComplete && canCompleteWorkPlan(item)"
								type="primary"
								size="mini"
								:loading="actionId === item.id && actionType === 'complete'"
								@tap="runAction('complete', item)"
							>
								完成
							</cl-button>
							<cl-button
								v-if="canCancel && canCancelWorkPlan(item)"
								plain
								size="mini"
								:loading="actionId === item.id && actionType === 'cancel'"
								@tap="runAction('cancel', item)"
							>
								取消
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
import { useUi } from "/$/cool-ui";
import { useListPage } from "/@/hooks/use-list-page";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import { performanceWorkPlanService } from "/@/service/performance/workPlan";
import {
	canCancelWorkPlan,
	canCompleteWorkPlan,
	canStartWorkPlan,
	type WorkPlanRecord,
} from "/@/types/performance-work-plan";

const WORK_PLAN_STATUS_DICT_KEY = "performance.workPlan.status";
const WORK_PLAN_SOURCE_STATUS_DICT_KEY = "performance.workPlan.sourceStatus";
const WORK_PLAN_PRIORITY_DICT_KEY = "performance.workPlan.priority";
const WORK_PLAN_SOURCE_TYPE_DICT_KEY = "performance.workPlan.sourceType";

const { router } = useCool();
const { user, dict } = useStore();
const ui = useUi();

const keyword = ref("");
const activeStatus = ref<string>("all");
const actionId = ref<number>(0);
const actionType = ref<"start" | "complete" | "cancel" | "">("");
const allowed = computed(() => user.canAccessRoute("/pages/performance/work-plan/index"));
const canStart = computed(() => user.hasPerm(performanceWorkPlanService.permission.start));
const canComplete = computed(() => user.hasPerm(performanceWorkPlanService.permission.complete));
const canCancel = computed(() => user.hasPerm(performanceWorkPlanService.permission.cancel));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(WORK_PLAN_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const workPlanList = useListPage<WorkPlanRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([
			WORK_PLAN_STATUS_DICT_KEY,
			WORK_PLAN_SOURCE_STATUS_DICT_KEY,
			WORK_PLAN_PRIORITY_DICT_KEY,
			WORK_PLAN_SOURCE_TYPE_DICT_KEY,
		]);
		return performanceWorkPlanService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "工作计划加载失败",
});
const rows = workPlanList.rows;
const loading = workPlanList.loading;
const error = workPlanList.error;
const load = workPlanList.reload;

async function runAction(type: "start" | "complete" | "cancel", item: WorkPlanRecord) {
	if (!item.id) {
		return;
	}

	actionId.value = item.id;
	actionType.value = type;

	try {
		if (type === "start") {
			await performanceWorkPlanService.start({ id: item.id });
		} else if (type === "complete") {
			await performanceWorkPlanService.complete({ id: item.id });
		} else {
			await performanceWorkPlanService.cancel({ id: item.id });
		}
		ui.showToast("操作成功");
		await load();
	} catch (error: any) {
		ui.showTips(error?.message || "操作失败");
	} finally {
		actionId.value = 0;
		actionType.value = "";
	}
}

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

function statusLabel(value?: string | null) {
	return dict.getLabel(WORK_PLAN_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(WORK_PLAN_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

function sourceStatusLabel(value?: string | null) {
	return dict.getLabel(WORK_PLAN_SOURCE_STATUS_DICT_KEY, value) || value || "未知";
}

function priorityLabel(value?: string | null) {
	return (
		dict.getLabel(WORK_PLAN_PRIORITY_DICT_KEY, value) ||
		value ||
		dict.getLabel(WORK_PLAN_PRIORITY_DICT_KEY, "medium") ||
		"未设置"
	);
}

function sourceTypeLabel(value?: string | null) {
	return dict.getLabel(WORK_PLAN_SOURCE_TYPE_DICT_KEY, value) || value || "未知来源";
}

watch(activeStatus, () => {
	load();
});

onShow(load);

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.work-plan-page {
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
.plan-card {
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

.plan-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.plan-card {
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
