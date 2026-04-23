<!-- 文件职责：承接 cool-uni 指标库移动列表；不负责桌面端 CRUD、删除或引用联动；维护重点是只消费指标摘要字段和启停状态。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="indicator-page" scroll-y>
			<view class="indicator-page__header">
				<text class="indicator-page__title">指标库</text>
				<text class="indicator-page__subtitle"
					>查看指标类型、适用范围、权重和启停状态，复杂维护动作仍保留桌面端</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有指标库移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="indicator-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="指标名称 / 编码"
					/>
					<view class="toolbar-card__actions">
						<cl-button plain size="mini" @tap="resetFilters">重置</cl-button>
						<cl-button type="primary" size="mini" @tap="load">刷新</cl-button>
					</view>
				</view>

				<view class="status-tabs">
					<cl-tabs
						v-model="activeCategory"
						:list="categoryTabs"
						:show-line="false"
						fill
					/>
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
					title="当前暂无指标"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="indicator-list">
					<view v-for="item in rows" :key="item.id" class="indicator-card">
						<view class="indicator-card__top">
							<view>
								<text class="indicator-card__title">{{ item.name }}</text>
								<text class="indicator-card__meta"
									>{{ item.code }} ·
									{{ indicatorCategoryLabel(item.category) }}</text
								>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="indicator-card__grid">
							<text>适用范围：{{ applyScopeLabel(item.applyScope) }}</text>
							<text>权重：{{ Number(item.weight || 0).toFixed(2) }}</text>
							<text>满分：{{ item.scoreScale }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
						</view>

						<text class="indicator-card__summary">{{
							item.description || "暂无指标说明"
						}}</text>
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
import { performanceIndicatorService } from "/@/service/performance/indicator";
import { type IndicatorRecord } from "/@/types/performance-indicator";

const INDICATOR_CATEGORY_DICT_KEY = "performance.indicator.category";
const INDICATOR_STATUS_DICT_KEY = "performance.indicator.status";
const INDICATOR_APPLY_SCOPE_DICT_KEY = "performance.indicator.applyScope";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeCategory = ref<string>("all");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/indicator-library/index"));
const categoryTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(INDICATOR_CATEGORY_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(INDICATOR_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const indicatorList = useListPage<IndicatorRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([
			INDICATOR_CATEGORY_DICT_KEY,
			INDICATOR_STATUS_DICT_KEY,
			INDICATOR_APPLY_SCOPE_DICT_KEY,
		]);
		return performanceIndicatorService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			category: activeCategory.value === "all" ? undefined : activeCategory.value,
			status: activeStatus.value === "all" ? undefined : Number(activeStatus.value),
		});
	},
	resolveError: (error) => (error as any)?.message || "指标列表加载失败",
});
const rows = indicatorList.rows;
const loading = indicatorList.loading;
const error = indicatorList.error;
const load = indicatorList.reload;

function resetFilters() {
	keyword.value = "";
	activeCategory.value = "all";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function indicatorCategoryLabel(value?: string | null) {
	return dict.getLabel(INDICATOR_CATEGORY_DICT_KEY, value) || value || "未知";
}

function applyScopeLabel(value?: string) {
	return dict.getLabel(INDICATOR_APPLY_SCOPE_DICT_KEY, value) || value || "未知";
}

function statusLabel(value?: number) {
	return dict.getLabel(INDICATOR_STATUS_DICT_KEY, value) || String(value ?? "未知");
}

function statusTone(value?: number): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(INDICATOR_STATUS_DICT_KEY, value)?.tone;
	return tone === "warning" || tone === "error" || tone === "success" ? tone : "info";
}

watch(activeCategory, load);
watch(activeStatus, load);
onShow(load);
onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.indicator-page {
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
.indicator-card {
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

.indicator-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.indicator-card {
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
}
</style>
