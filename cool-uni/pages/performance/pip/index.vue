<!-- 文件职责：承接 cool-uni PIP 移动列表；不负责创建编辑、跟进提交或结果动作；维护重点是只消费 PIP 摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="pip-page" scroll-y>
			<view class="pip-page__header">
				<text class="pip-page__title">PIP 追踪</text>
				<text class="pip-page__subtitle">查看 PIP 列表、负责人、时间范围和状态摘要，复杂维护动作仍保留桌面端</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有 PIP 移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="pip-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="标题 / 来源原因"
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

				<page-state v-else-if="!loading && !rows.length" title="当前暂无 PIP" description="当前筛选条件下暂无数据。" />

				<view v-else class="pip-list">
					<view v-for="item in rows" :key="item.id" class="pip-card">
						<view class="pip-card__top">
							<view>
								<text class="pip-card__title">{{ item.title }}</text>
								<text class="pip-card__meta">{{ item.employeeName || "-" }} · {{ item.ownerName || "-" }}</text>
							</view>
							<status-pill :label="statusLabel(item.status)" :tone="statusTone(item.status)" />
						</view>

						<view class="pip-card__grid">
							<text>来源评估单：{{ item.assessmentId || "独立创建" }}</text>
							<text>时间范围：{{ item.startDate }} ~ {{ item.endDate }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
						</view>

						<text class="pip-card__summary">{{ item.sourceReason || "暂无来源原因" }}</text>
						<text v-if="item.resultSummary" class="pip-card__summary">结果总结：{{ item.resultSummary }}</text>
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
import { performancePipService } from "/@/service/performance/pip";
import { type PipRecord } from "/@/types/performance-pip";

const PIP_STATUS_DICT_KEY = "performance.pip.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/pip/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(PIP_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const pipList = useListPage<PipRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([PIP_STATUS_DICT_KEY]);
		return performancePipService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "PIP 列表加载失败",
});
const rows = pipList.rows;
const loading = pipList.loading;
const error = pipList.error;
const load = pipList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string | null) {
	return dict.getLabel(PIP_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(PIP_STATUS_DICT_KEY, value)?.tone;
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
.pip-page {
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
.pip-card {
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

.pip-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.pip-card {
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
		margin-top: 18rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
		white-space: pre-wrap;
	}
}
</style>
