<!-- 文件职责：承接 cool-uni 人才资产移动列表；不负责面试联动、删除或桌面端维护动作；维护重点是只消费人才资产摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="talent-asset-page" scroll-y>
			<view class="talent-asset-page__header">
				<text class="talent-asset-page__title">人才资产</text>
				<text class="talent-asset-page__subtitle"
					>查看候选人台账、来源、标签和跟进状态摘要，复杂维护动作仍保留桌面端</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有人才资产移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="talent-asset-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="候选人 / 目标岗位"
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
					title="当前暂无人才资产"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="talent-asset-list">
					<view v-for="item in rows" :key="item.id" class="talent-asset-card">
						<view class="talent-asset-card__top">
							<view>
								<text class="talent-asset-card__title">{{
									item.candidateName
								}}</text>
								<text class="talent-asset-card__meta">
									{{ item.targetDepartmentName || "-" }} ·
									{{ item.targetPosition || "-" }}
								</text>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="talent-asset-card__grid">
							<text>来源：{{ item.source }}</text>
							<text>下次跟进：{{ item.nextFollowUpDate || "-" }}</text>
							<text>标签：{{ talentAssetTagsLabel(item.tagList) }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
						</view>

						<text class="talent-asset-card__summary">{{
							item.followUpSummary || "暂无跟进摘要"
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
import { performanceTalentAssetService } from "/@/service/performance/talentAsset";
import { talentAssetTagsLabel, type TalentAssetRecord } from "/@/types/performance-talent-asset";

const TALENT_ASSET_STATUS_DICT_KEY = "performance.talentAsset.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/talent-asset/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(TALENT_ASSET_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const talentAssetList = useListPage<TalentAssetRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([TALENT_ASSET_STATUS_DICT_KEY]);
		return performanceTalentAssetService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "人才资产列表加载失败",
});
const rows = talentAssetList.rows;
const loading = talentAssetList.loading;
const error = talentAssetList.error;
const load = talentAssetList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string | null) {
	return dict.getLabel(TALENT_ASSET_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(TALENT_ASSET_STATUS_DICT_KEY, value)?.tone;
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
.talent-asset-page {
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
.talent-asset-card {
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

.talent-asset-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.talent-asset-card {
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
	}
}
</style>
