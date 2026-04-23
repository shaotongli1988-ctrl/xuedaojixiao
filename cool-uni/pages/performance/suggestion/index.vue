<!-- 文件职责：承接 cool-uni 自动建议移动列表与高频处理动作；不负责正式单据创建、详情抽屉或撤销复杂表单；维护重点是动作只在 pending 状态开放。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="suggestion-page" scroll-y>
			<view class="suggestion-page__header">
				<text class="suggestion-page__title">自动建议</text>
				<text class="suggestion-page__subtitle"
					>查看建议列表，并在移动端处理采用、忽略、驳回三类高频动作</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有自动建议移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="suggestion-page__body">
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

				<view class="type-tabs">
					<cl-tabs v-model="activeType" :list="typeTabs" :show-line="false" fill />
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
					title="当前暂无建议"
					description="当前筛选条件下暂无自动建议数据。"
				/>

				<view v-else class="suggestion-list">
					<view v-for="item in rows" :key="item.id" class="suggestion-card">
						<view class="suggestion-card__top">
							<view>
								<text class="suggestion-card__title">{{
									suggestionTypeLabel(item.suggestionType)
								}}</text>
								<text class="suggestion-card__meta">
									{{ item.employeeName || "-" }} ·
									{{ item.departmentName || "-" }}
								</text>
							</view>
							<status-pill
								:label="suggestionStatusLabel(item.status)"
								:tone="suggestionStatusTone(item.status)"
							/>
						</view>

						<view class="suggestion-card__grid">
							<text>来源评估单：{{ item.assessmentId || "-" }}</text>
							<text>期间：{{ item.periodValue || "-" }}</text>
							<text>生成时间：{{ item.createTime || "-" }}</text>
							<text>处理人：{{ item.handlerName || "-" }}</text>
						</view>

						<text class="suggestion-card__summary">{{
							item.triggerLabel || "暂无触发摘要"
						}}</text>

						<view class="suggestion-card__actions">
							<cl-button
								v-if="canAccept && canAcceptSuggestion(item)"
								type="primary"
								size="mini"
								:loading="actionId === item.id && actionType === 'accept'"
								@tap="runAction('accept', item.id)"
							>
								采用
							</cl-button>
							<cl-button
								v-if="canIgnore && canIgnoreSuggestion(item)"
								plain
								size="mini"
								:loading="actionId === item.id && actionType === 'ignore'"
								@tap="runAction('ignore', item.id)"
							>
								忽略
							</cl-button>
							<cl-button
								v-if="canReject && canRejectSuggestion(item)"
								plain
								size="mini"
								:loading="actionId === item.id && actionType === 'reject'"
								@tap="runAction('reject', item.id)"
							>
								驳回
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
import { performanceSuggestionService } from "/@/service/performance/suggestion";
import {
	canAcceptSuggestion,
	canIgnoreSuggestion,
	canRejectSuggestion,
	type SuggestionRecord,
} from "/@/types/performance-suggestion";

const SUGGESTION_TYPE_DICT_KEY = "performance.suggestion.type";
const SUGGESTION_STATUS_DICT_KEY = "performance.suggestion.status";

const { router } = useCool();
const { user, dict } = useStore();
const ui = useUi();

const activeStatus = ref<string>("all");
const activeType = ref<string>("all");
const periodValue = ref("");
const actionId = ref<number>(0);
const actionType = ref<"accept" | "ignore" | "reject" | "">("");
const allowed = computed(() => user.canAccessRoute("/pages/performance/suggestion/index"));
const canAccept = computed(() => user.hasPerm(performanceSuggestionService.permission.accept));
const canIgnore = computed(() => user.hasPerm(performanceSuggestionService.permission.ignore));
const canReject = computed(() => user.hasPerm(performanceSuggestionService.permission.reject));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(SUGGESTION_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const typeTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(SUGGESTION_TYPE_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const suggestionList = useListPage<SuggestionRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([SUGGESTION_TYPE_DICT_KEY, SUGGESTION_STATUS_DICT_KEY]);
		return performanceSuggestionService.fetchPage({
			page: 1,
			size: 20,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
			suggestionType: activeType.value === "all" ? undefined : activeType.value,
			periodValue: periodValue.value.trim() || undefined,
		});
	},
	resolveError: (error) => (error as any)?.message || "自动建议加载失败",
});
const rows = suggestionList.rows;
const loading = suggestionList.loading;
const error = suggestionList.error;
const load = suggestionList.reload;

async function runAction(type: "accept" | "ignore" | "reject", id?: number) {
	if (!id) return;
	actionId.value = id;
	actionType.value = type;
	try {
		if (type === "accept") {
			await performanceSuggestionService.accept({ id });
		} else if (type === "ignore") {
			await performanceSuggestionService.ignore({ id });
		} else {
			await performanceSuggestionService.reject({ id });
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
	activeStatus.value = "all";
	activeType.value = "all";
	periodValue.value = "";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function suggestionTypeLabel(value?: string | null) {
	return dict.getLabel(SUGGESTION_TYPE_DICT_KEY, value) || value || "未知";
}

function suggestionStatusLabel(value?: string | null) {
	return dict.getLabel(SUGGESTION_STATUS_DICT_KEY, value) || value || "未知";
}

function suggestionStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(SUGGESTION_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

watch(activeStatus, load);
watch(activeType, load);
onShow(load);
onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.suggestion-page {
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
.type-tabs,
.suggestion-card {
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

.suggestion-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.suggestion-card {
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
