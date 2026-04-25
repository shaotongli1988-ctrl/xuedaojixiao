<!-- 文件职责：承接 cool-uni 班主任资源详情查看与最小跟进新增；不负责合作标记、班级管理、代理体系或复杂看板；维护重点是详情和跟进时间线都继续依赖主题19既有接口与后端权限裁剪。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="detail-page" scroll-y>
			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号无法查看班主任详情。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<page-state
				v-else-if="state.mode === 'missing'"
				title="记录不存在或已失效"
				description="请返回待办页重新进入。"
				action-text="返回待办页"
				@action="backToTodo"
			/>

			<page-state
				v-else-if="state.mode === 'error'"
				title="加载失败"
				:description="state.error"
				action-text="重试"
				@action="load"
			/>

			<view v-else-if="detail" class="detail-page__body">
				<view class="detail-card">
					<view class="detail-card__top">
						<view>
							<text class="detail-card__title">{{ detail.teacherName }}</text>
							<text class="detail-card__meta">
								{{ detail.schoolName || "-" }} ·
								{{ detail.ownerEmployeeName || "-" }}
							</text>
						</view>
						<status-pill
							:label="teacherCooperationStatusLabel(detail.cooperationStatus)"
							:tone="teacherCooperationStatusTone(detail.cooperationStatus)"
						/>
					</view>

					<view class="detail-card__grid">
						<text>联系电话：{{ detail.phone || "-" }}</text>
						<text>微信号：{{ detail.wechat || "-" }}</text>
						<text>地区：{{ detail.schoolRegion || "-" }}</text>
						<text>学校类型：{{ detail.schoolType || "-" }}</text>
						<text>年级：{{ detail.grade || "-" }}</text>
						<text>学科：{{ detail.subject || "-" }}</text>
						<text>意向等级：{{ detail.intentionLevel || "-" }}</text>
						<text>沟通风格：{{ detail.communicationStyle || "-" }}</text>
						<text>班级数：{{ detail.classCount ?? 0 }}</text>
						<text>下次跟进：{{ detail.nextFollowTime || "-" }}</text>
					</view>
				</view>

				<view v-if="canFollowAdd" class="detail-card">
					<text class="detail-card__section">新增跟进</text>
					<cl-form label-position="top">
						<cl-form-item label="跟进方式">
							<cl-input
								v-model="followForm.followMethod"
								:border="false"
								:height="76"
								:border-radius="16"
								placeholder="例如：电话、微信、面谈"
							/>
						</cl-form-item>
					</cl-form>

					<view class="detail-card__picker">
						<text class="detail-card__picker-label">下次跟进日期</text>
						<picker
							mode="date"
							:value="followForm.nextFollowDate"
							@change="onNextFollowDateChange"
						>
							<view class="detail-card__picker-value">
								{{ followForm.nextFollowDate || "选择日期（可为空）" }}
							</view>
						</picker>
					</view>

					<textarea
						v-model="followForm.followContent"
						class="detail-card__textarea"
						maxlength="2000"
						placeholder="请输入跟进内容"
					/>

					<view class="detail-card__actions">
						<cl-button plain size="mini" @tap="resetFollowForm">清空</cl-button>
						<cl-button
							type="primary"
							size="mini"
							:loading="submitting"
							@tap="submitFollow"
						>
							提交跟进
						</cl-button>
					</view>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">跟进记录</text>
					<page-state
						v-if="!followList.length"
						title="暂无跟进记录"
						description="当前资源还没有跟进时间线。"
					/>

					<view v-else class="follow-list">
						<view v-for="item in followList" :key="item.id" class="follow-row">
							<text class="follow-row__title">{{
								item.followMethod || "跟进记录"
							}}</text>
							<text class="follow-row__meta">
								{{ item.operatorName || item.creatorName || "-" }} ·
								{{ item.followTime || item.createTime || "-" }}
							</text>
							<text class="follow-row__content">{{
								item.followContent || item.content || "-"
							}}</text>
							<text v-if="item.nextFollowTime" class="follow-row__next">
								下次跟进：{{ item.nextFollowTime }}
							</text>
						</view>
					</view>
				</view>

				<view class="detail-footer">
					<cl-button plain @tap="backToTodo">返回待办页</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { useUi } from "/$/cool-ui";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import {
	performanceTeacherFollowService,
	performanceTeacherInfoService,
} from "/@/service/performance/teacherChannel";
import {
	type TeacherFollowRecord,
	type TeacherInfoRecord,
} from "/@/types/performance-teacher-channel";

const { router } = useCool();
const { user, dict } = useStore();
const ui = useUi();

const TEACHER_COOPERATION_STATUS_DICT_KEY = "performance.teacherChannel.cooperationStatus";

const teacherId = Number(router.query.teacherId || 0);
const detail = ref<TeacherInfoRecord | null>(null);
const followList = ref<TeacherFollowRecord[]>([]);
const submitting = ref(false);
const state = ref({
	mode: "loading",
	error: "",
});

const allowed = user.canAccessRoute("/pages/performance/teacher-channel/detail");
const canFollowAdd = user.hasPerm(performanceTeacherFollowService.permission.add);
const followForm = reactive({
	followMethod: "电话",
	nextFollowDate: "",
	followContent: "",
});

function resolveMode(message?: string) {
	if (/不存在|失效/.test(String(message || ""))) {
		return "missing";
	}

	return "error";
}

async function load() {
	if (!teacherId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	try {
		await dict.refresh([TEACHER_COOPERATION_STATUS_DICT_KEY]);
		const [detailRes, followRes] = await Promise.all([
			performanceTeacherInfoService.fetchInfo({ id: teacherId }),
			performanceTeacherFollowService.fetchPage({
				page: 1,
				size: 50,
				teacherId,
			}),
		]);
		detail.value = detailRes;
		followList.value = followRes?.list || [];
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "班主任详情加载失败",
		};
	}
}

function onNextFollowDateChange(event: any) {
	followForm.nextFollowDate = event?.detail?.value || "";
}

function resetFollowForm() {
	followForm.followMethod = "电话";
	followForm.nextFollowDate = "";
	followForm.followContent = "";
}

async function submitFollow() {
	if (!canFollowAdd) {
		ui.showTips("当前无权新增跟进");
		return;
	}

	if (!followForm.followContent.trim()) {
		ui.showTips("请输入跟进内容");
		return;
	}

	submitting.value = true;

	try {
		await performanceTeacherFollowService.createFollow({
			teacherId,
			followMethod: followForm.followMethod.trim() || undefined,
			followContent: followForm.followContent.trim(),
			nextFollowTime: followForm.nextFollowDate || undefined,
		});
		ui.showTips("跟进已提交");
		resetFollowForm();
		await load();
	} catch (error: any) {
		ui.showToast(error?.message || "跟进提交失败");
	} finally {
		submitting.value = false;
	}
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function backToTodo() {
	router.push({
		path: "/pages/performance/teacher-channel/todo",
	});
}

function teacherCooperationStatusLabel(value?: string | null) {
	return dict.getLabel(TEACHER_COOPERATION_STATUS_DICT_KEY, value) || value || "未知";
}

function teacherCooperationStatusTone(
	value?: string | null,
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

onShow(load);
</script>

<style lang="scss" scoped>
.detail-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.detail-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);

	&__top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__title {
		display: block;
		font-size: 32rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #748198;
	}

	&__section {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2233;
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

	&__picker {
		margin-top: 20rpx;
	}

	&__picker-label {
		display: block;
		font-size: 24rpx;
		color: #43506a;
	}

	&__picker-value {
		margin-top: 14rpx;
		padding: 22rpx 24rpx;
		border-radius: 20rpx;
		background: #f6f8fb;
		font-size: 24rpx;
		color: #4f5c74;
	}

	&__textarea {
		width: 100%;
		min-height: 240rpx;
		margin-top: 20rpx;
		padding: 24rpx;
		border-radius: 24rpx;
		background: #f6f8fb;
		box-sizing: border-box;
		font-size: 26rpx;
		line-height: 1.7;
		color: #1a2233;
	}

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 22rpx;
	}
}

.follow-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-top: 20rpx;
}

.follow-row {
	padding: 22rpx 0;
	border-bottom: 1rpx solid #eef2f7;

	&:last-child {
		padding-bottom: 0;
		border-bottom: none;
	}

	&__title {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta,
	&__next {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #748198;
	}

	&__content {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
		white-space: pre-wrap;
	}
}

.detail-footer {
	display: flex;
	padding-bottom: 24rpx;
}
</style>
