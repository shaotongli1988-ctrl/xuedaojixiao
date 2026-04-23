<!-- 文件职责：承接 cool-uni 职位标准移动列表；不负责新增编辑、启停用或招聘链路跳转；维护重点是只消费职位标准摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="job-standard-page" scroll-y>
			<view class="job-standard-page__header">
				<text class="job-standard-page__title">职位标准</text>
				<text class="job-standard-page__subtitle"
					>查看岗位画像、任职要求、技能标签和状态，复杂维护动作仍保留桌面端</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有职位标准移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="job-standard-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="岗位名称 / 任职要求关键字"
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
					title="当前暂无职位标准"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="job-standard-list">
					<view v-for="item in rows" :key="item.id" class="job-standard-card">
						<view class="job-standard-card__top">
							<view>
								<text class="job-standard-card__title">{{
									item.positionName
								}}</text>
								<text class="job-standard-card__meta">
									{{ item.targetDepartmentName || "-" }} ·
									{{ item.jobLevel || "-" }}
								</text>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="job-standard-card__section">
							<text class="job-standard-card__label">岗位画像</text>
							<text class="job-standard-card__content">{{
								item.profileSummary || "暂无岗位画像摘要"
							}}</text>
						</view>

						<view class="job-standard-card__section">
							<text class="job-standard-card__label">任职要求</text>
							<text class="job-standard-card__content">{{
								item.requirementSummary || "暂无任职要求摘要"
							}}</text>
						</view>

						<view class="job-standard-card__tags">
							<text
								v-for="tag in item.skillTagList || []"
								:key="`${item.id}-${tag}`"
								class="job-standard-card__tag"
							>
								{{ tag }}
							</text>
							<text
								v-if="!(item.skillTagList || []).length"
								class="job-standard-card__empty-tag"
								>暂无技能标签</text
							>
						</view>

						<text class="job-standard-card__footer"
							>更新时间：{{ item.updateTime || "-" }}</text
						>
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
import { performanceJobStandardService } from "/@/service/performance/jobStandard";
import { type JobStandardRecord } from "/@/types/performance-job-standard";

const JOB_STANDARD_STATUS_DICT_KEY = "performance.jobStandard.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/job-standard/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(JOB_STANDARD_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const jobStandardList = useListPage<JobStandardRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([JOB_STANDARD_STATUS_DICT_KEY]);
		return performanceJobStandardService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "职位标准列表加载失败",
});
const rows = jobStandardList.rows;
const loading = jobStandardList.loading;
const error = jobStandardList.error;
const load = jobStandardList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string) {
	return dict.getLabel(JOB_STANDARD_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(JOB_STANDARD_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" || tone === "error" ? tone : "info";
}

watch(activeStatus, load);
onShow(load);
onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.job-standard-page {
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
.job-standard-card {
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

.job-standard-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.job-standard-card {
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

	&__section {
		margin-top: 22rpx;
	}

	&__label {
		display: block;
		font-size: 22rpx;
		font-weight: 600;
		color: #516078;
	}

	&__content {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
		white-space: pre-wrap;
	}

	&__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 22rpx;
	}

	&__tag,
	&__empty-tag {
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		background: #eef3ff;
		font-size: 22rpx;
		color: #4662a3;
	}

	&__footer {
		display: block;
		margin-top: 22rpx;
		font-size: 22rpx;
		color: #748198;
	}
}
</style>
