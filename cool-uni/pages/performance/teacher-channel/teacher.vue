<!-- 文件职责：承接 cool-uni 班主任资源移动列表与详情跳转；不负责新增编辑、分配、合作标记或代理体系扩展；维护重点是资源详情仍回到既有 detail 页面，数据范围以后端裁剪为准。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="teacher-list-page" scroll-y>
			<view class="teacher-list-page__header">
				<text class="teacher-list-page__title">班主任资源</text>
				<text class="teacher-list-page__subtitle">查看资源列表，进入详情后继续跟进和查看脱敏联系人</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有班主任资源移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="teacher-list-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="班主任 / 学校 / 学科"
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
					v-if="state.error"
					title="加载失败"
					:description="state.error"
					action-text="重试"
					@action="load"
				/>

				<page-state
					v-else-if="!state.loading && !rows.length"
					title="当前范围内暂无班主任资源"
					description="可切换条件后重新查询。"
				/>

				<view v-else class="teacher-list">
					<view v-for="item in rows" :key="item.id" class="teacher-card">
						<view class="teacher-card__top">
							<view>
								<text class="teacher-card__title">{{ item.teacherName }}</text>
								<text class="teacher-card__meta">
									{{ item.schoolName || "-" }} · {{ item.ownerEmployeeName || "-" }}
								</text>
							</view>
							<status-pill
								:label="teacherCooperationStatusLabel(item.cooperationStatus)"
								:tone="teacherCooperationStatusTone(item.cooperationStatus)"
							/>
						</view>

						<view class="teacher-card__grid">
							<text>学科：{{ item.subject || "-" }}</text>
							<text>年级：{{ item.grade || "-" }}</text>
							<text>下次跟进：{{ item.nextFollowTime || "-" }}</text>
							<text>班级数：{{ item.classCount || 0 }}</text>
						</view>

						<view class="teacher-card__actions">
							<cl-button plain size="mini" @tap="openDetail(item.id)">查看详情</cl-button>
							<cl-button
								v-if="canFollowAdd"
								type="primary"
								size="mini"
								@tap="openDetail(item.id, true)"
							>
								去跟进
							</cl-button>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import {
	performanceTeacherFollowService,
	performanceTeacherInfoService,
} from "/@/service/performance/teacherChannel";
import { type TeacherInfoRecord } from "/@/types/performance-teacher-channel";

const TEACHER_COOPERATION_STATUS_DICT_KEY = "performance.teacherChannel.cooperationStatus";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const state = reactive({
	loading: false,
	error: "",
});
const rows = ref<TeacherInfoRecord[]>([]);

const allowed = computed(() => user.canAccessRoute("/pages/performance/teacher-channel/teacher"));
const canFollowAdd = computed(() => user.hasPerm(performanceTeacherFollowService.permission.add));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(TEACHER_COOPERATION_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		await dict.refresh([TEACHER_COOPERATION_STATUS_DICT_KEY]);
		const res = await performanceTeacherInfoService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			cooperationStatus: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
		rows.value = res?.list || [];
	} catch (error: any) {
		state.error = error?.message || "班主任资源加载失败";
	} finally {
		state.loading = false;
	}
}

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function openDetail(id?: number, openFollow = false) {
	if (!id) return;

	router.push({
		path: "/pages/performance/teacher-channel/detail",
		query: {
			teacherId: id,
			...(openFollow ? { openFollow: 1 } : {}),
		},
	});
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function teacherCooperationStatusLabel(value?: string | null) {
	return dict.getLabel(TEACHER_COOPERATION_STATUS_DICT_KEY, value) || value || "未知";
}

function teacherCooperationStatusTone(
	value?: string | null
): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(TEACHER_COOPERATION_STATUS_DICT_KEY, value)?.tone;
	if (tone === "success" || tone === "warning") {
		return tone;
	}
	if (tone === "danger") {
		return "error";
	}
	return tone === "primary" ? "warning" : "info";
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
.teacher-list-page {
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
.teacher-card {
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

.teacher-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.teacher-card {
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

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 24rpx;
	}
}
</style>
