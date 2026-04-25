<!-- 文件职责：承接 cool-uni 会议管理移动列表与会议级签到；不负责会议编辑、逐人签到或复杂详情抽屉；维护重点是签到仅在 in_progress 状态开放。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="meeting-page" scroll-y>
			<view class="meeting-page__header">
				<text class="meeting-page__title">会议管理</text>
				<text class="meeting-page__subtitle"
					>查看会议列表，并在移动端处理进行中会议签到</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有会议管理移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="meeting-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="会议标题 / 编码"
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
					title="当前暂无会议"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="meeting-list">
					<view v-for="item in rows" :key="item.id" class="meeting-card">
						<view class="meeting-card__top">
							<view>
								<text class="meeting-card__title">{{ item.title }}</text>
								<text class="meeting-card__meta"
									>{{ item.code || "-" }} · {{ item.organizerName || "-" }}</text
								>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="meeting-card__grid">
							<text>类型：{{ item.type || "-" }}</text>
							<text>参与人数：{{ item.participantCount || 0 }}</text>
							<text>时间：{{ item.startDate || "-" }}</text>
							<text>地点：{{ item.location || "-" }}</text>
						</view>

						<text class="meeting-card__summary">{{
							item.description || "暂无会议说明"
						}}</text>

						<view class="meeting-card__actions">
							<cl-button
								v-if="canCheckIn && canMeetingCheckIn(item)"
								type="primary"
								size="mini"
								:loading="checkInId === item.id"
								@tap="handleCheckIn(item.id)"
							>
								签到
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
import { performanceMeetingService } from "/@/service/performance/meeting";
import { canMeetingCheckIn, type MeetingRecord } from "/@/types/performance-meeting";

const MEETING_STATUS_DICT_KEY = "performance.meeting.status";

const { router } = useCool();
const { user, dict } = useStore();
const ui = useUi();

const keyword = ref("");
const activeStatus = ref<string>("all");
const checkInId = ref<number>(0);
const allowed = computed(() => user.canAccessRoute("/pages/performance/meeting/index"));
const canCheckIn = computed(() => user.hasPerm(performanceMeetingService.permission.checkIn));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(MEETING_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const meetingList = useListPage<MeetingRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([MEETING_STATUS_DICT_KEY]);
		return performanceMeetingService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "会议列表加载失败",
});
const rows = meetingList.rows;
const loading = meetingList.loading;
const error = meetingList.error;
const load = meetingList.reload;

async function handleCheckIn(id?: number) {
	if (!id) return;
	checkInId.value = id;
	try {
		await performanceMeetingService.checkIn({ id });
		ui.showToast("签到成功");
		await load();
	} catch (error: any) {
		ui.showTips(error?.message || "签到失败");
	} finally {
		checkInId.value = 0;
	}
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
	return dict.getLabel(MEETING_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(MEETING_STATUS_DICT_KEY, value)?.tone;
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
.meeting-page {
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
.meeting-card {
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

.meeting-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.meeting-card {
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
