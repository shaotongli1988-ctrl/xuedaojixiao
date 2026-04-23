<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="submit-page" scroll-y>
			<page-state
				v-if="state.mode !== 'ready'"
				:title="stateTitle"
				:description="stateTips"
				:action-text="stateAction"
				@action="stateActionHandler"
			/>

			<view v-else class="submit-page__body">
				<view class="form-card">
					<text class="form-card__title">{{ taskTitle }}</text>
					<text class="form-card__meta">
						关系：{{ relationType || "-" }} · 截止：{{ deadline || "-" }}
					</text>

					<text class="form-card__label">评分</text>
					<input
						v-model.number="score"
						class="form-card__input"
						type="number"
						placeholder="请输入评分"
					/>

					<text class="form-card__label">反馈内容</text>
					<textarea
						v-model.trim="content"
						class="form-card__textarea"
						placeholder="请输入反馈内容"
					/>
				</view>

				<view class="submit-actions">
					<cl-button plain @tap="backToDetail">取消</cl-button>
					<cl-button type="primary" :loading="submitting" @tap="save">提交反馈</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import PageState from "/@/pages/performance/components/page-state.vue";
import {
	buildFeedbackDetailQuery,
	canSubmitFeedbackTask,
	getSubmitDisabledReason,
	isRouteSourceValid,
} from "./utils";

const { service, router } = useCool();

const taskTitle = ref("");
const relationType = ref("");
const deadline = ref("");
const score = ref<number | undefined>(undefined);
const content = ref("");
const submitting = ref(false);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);
const routeSource = router.query.source;

const stateTitle = computed(() => {
	switch (state.value.mode) {
		case "denied":
			return "无权限访问该页面";
		case "missing":
			return "记录不存在或已失效";
		case "error":
			return "加载失败";
		default:
			return "加载中";
	}
});

const stateTips = computed(() => {
	switch (state.value.mode) {
		case "denied":
			return state.value.error || "仅当前账号被分配且未提交的环评任务允许提交反馈。";
		case "missing":
			return "请返回详情页重新进入。";
		case "error":
			return state.value.error;
		default:
			return "正在加载";
	}
});

const stateAction = computed(() => {
	return state.value.mode === "error"
		? "重试"
		: state.value.mode === "denied"
			? "返回详情"
			: "返回工作台";
});

async function load() {
	if (!isRouteSourceValid(routeSource, "detail")) {
		uni.showToast({
			title: "页面来源已失效，已返回工作台",
			icon: "none",
		});
		goHome();
		return;
	}

	if (!recordId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	try {
		const res = await (service as any).performance.feedback.fetchInfo({ id: recordId });
		if (!canSubmitFeedbackTask(res)) {
			state.value = {
				mode: "denied",
				error: getSubmitDisabledReason(res),
			};
			return;
		}
		taskTitle.value = res.title || "";
		relationType.value = res.currentUserRecord?.relationType || "";
		deadline.value = res.deadline || "";
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: /无权限|无权/.test(String(error?.message || "")) ? "denied" : "error",
			error: error?.message || "反馈提交页加载失败",
		};
	}
}

function backToDetail() {
	router.push({
		path: "/pages/performance/feedback/detail",
		mode: "redirectTo",
		query: buildFeedbackDetailQuery(recordId),
	});
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function stateActionHandler() {
	if (state.value.mode === "error") {
		load();
		return;
	}

	if (state.value.mode === "denied") {
		backToDetail();
		return;
	}

	goHome();
}

async function save() {
	submitting.value = true;

	try {
		await (service as any).performance.feedback.submitFeedback({
			taskId: recordId,
			score: Number(score.value || 0),
			content: content.value,
			relationType: relationType.value,
		});
		backToDetail();
	} finally {
		submitting.value = false;
	}
}

onShow(load);
</script>

<style lang="scss" scoped>
.submit-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.form-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);

	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #687489;
	}

	&__label {
		display: block;
		margin-top: 24rpx;
		font-size: 26rpx;
		font-weight: 600;
		color: #1a2233;
	}

	&__input {
		height: 88rpx;
		margin-top: 14rpx;
		padding: 0 24rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 26rpx;
		color: #1a2233;
		box-sizing: border-box;
	}

	&__textarea {
		width: 100%;
		min-height: 220rpx;
		margin-top: 14rpx;
		padding: 22rpx 24rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 26rpx;
		color: #1a2233;
		box-sizing: border-box;
	}
}

.submit-actions {
	display: flex;
	gap: 18rpx;
	padding-bottom: 48rpx;
}
</style>
