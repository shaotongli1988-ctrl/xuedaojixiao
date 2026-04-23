<!-- 文件职责：承接 cool-uni 薪资管理移动列表；不负责确认归档、调整记录或个人薪资详情；维护重点是只消费薪资摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="salary-page" scroll-y>
			<view class="salary-page__header">
				<text class="salary-page__title">薪资管理</text>
				<text class="salary-page__subtitle">查看薪资记录、期间、金额和状态摘要，复杂维护动作仍保留桌面端</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有薪资管理移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="salary-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="periodValue"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="期间，例如 2026-Q2"
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
					title="当前暂无薪资记录"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="salary-list">
					<view v-for="item in rows" :key="item.id" class="salary-card">
						<view class="salary-card__top">
							<view>
								<text class="salary-card__title">{{ item.employeeName || "未命名员工" }}</text>
								<text class="salary-card__meta">{{ item.periodValue }} · {{ item.grade || "-" }}</text>
							</view>
							<status-pill :label="salaryStatusLabel(item.status)" :tone="salaryStatusTone(item.status)" />
						</view>

						<view class="salary-card__grid">
							<text>生效日期：{{ item.effectiveDate || "-" }}</text>
							<text>基础薪资：{{ salaryAmountLabel(item.baseSalary) }}</text>
							<text>绩效奖金：{{ salaryAmountLabel(item.performanceBonus) }}</text>
							<text>累计调整：{{ salaryAmountLabel(item.adjustAmount) }}</text>
							<text>最终金额：{{ salaryAmountLabel(item.finalAmount) }}</text>
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
import { performanceSalaryService } from "/@/service/performance/salary";
import {
	salaryAmountLabel,
	type SalaryRecord,
} from "/@/types/performance-salary";

const SALARY_STATUS_DICT_KEY = "performance.salary.status";

const { router } = useCool();
const { user, dict } = useStore();

const periodValue = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/salary/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(SALARY_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const salaryList = useListPage<SalaryRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([SALARY_STATUS_DICT_KEY]);
		return performanceSalaryService.fetchPage({
			page: 1,
			size: 20,
			periodValue: periodValue.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "薪资列表加载失败",
});
const rows = salaryList.rows;
const loading = salaryList.loading;
const error = salaryList.error;
const load = salaryList.reload;

function resetFilters() {
	periodValue.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function salaryStatusLabel(value?: string | null) {
	return dict.getLabel(SALARY_STATUS_DICT_KEY, value) || value || "未知";
}

function salaryStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(SALARY_STATUS_DICT_KEY, value)?.tone;
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
.salary-page {
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
.salary-card {
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

.salary-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.salary-card {
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
