<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="edit-page" scroll-y>
			<goal-state
				v-if="state.mode !== 'ready'"
				:title="stateTitle"
				:tips="stateTips"
				:action-text="stateAction"
				@action="stateActionHandler"
			/>

			<view v-else class="edit-page__body">
				<view class="form-card">
					<text class="form-card__title">{{ goalTitle }}</text>
					<text class="form-card__meta">
						当前 {{ currentValue }} / {{ targetValue }} {{ unit }}
					</text>

					<text class="form-card__label">更新后的当前值</text>
					<input
						v-model.number="currentValue"
						class="form-card__input"
						type="number"
						placeholder="请输入当前值"
					/>

					<text class="form-card__label">进度说明</text>
					<textarea
						v-model.trim="remark"
						class="form-card__textarea"
						placeholder="可选填写本次更新说明"
					/>
				</view>

				<view class="edit-actions">
					<cl-button plain @tap="backToDetail">取消</cl-button>
					<cl-button type="primary" :loading="submitting" @tap="save">提交更新</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import {
	canGoalProgressUpdate,
	isMissingGoalError,
	isPermissionDeniedError,
} from "/@/types/performance-goal";
import GoalState from "./components/goal-state.vue";
import { PERMISSIONS } from "/@/generated/permissions.generated";

const { service, router } = useCool();
const { user } = useStore();

const goalTitle = ref("");
const unit = ref("");
const targetValue = ref(0);
const currentValue = ref(0);
const remark = ref("");
const submitting = ref(false);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);

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
			return "当前目标不可更新进度。";
		case "missing":
			return "请返回详情页重新进入。";
		case "error":
			return state.value.error;
		default:
			return "正在加载";
	}
});

const stateAction = computed(() => {
	return state.value.mode === "error" ? "重试" : state.value.mode === "denied" ? "返回详情" : "返回工作台";
});

async function load() {
	if (!recordId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	if (!user.hasPerm(PERMISSIONS.performance.goal.progressUpdate)) {
		state.value = { mode: "denied", error: "" };
		return;
	}

	try {
		const res = await (service as any).performance.goal.fetchInfo({ id: recordId });

		if (!canGoalProgressUpdate(res)) {
			state.value = { mode: "denied", error: "" };
			return;
		}

		goalTitle.value = res.title || "";
		unit.value = res.unit || "";
		targetValue.value = Number(res.targetValue || 0);
		currentValue.value = Number(res.currentValue || 0);
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: isPermissionDeniedError(error?.message)
				? "denied"
				: isMissingGoalError(error?.message)
					? "missing"
					: "error",
			error: error?.message || "进度更新页加载失败",
		};
	}
}

function backToDetail() {
	router.push({
		path: "/pages/performance/goal/detail",
		mode: "redirectTo",
		query: { id: recordId },
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
		await (service as any).performance.goal.progressUpdate({
			id: recordId,
			currentValue: currentValue.value,
			remark: remark.value,
		});
		backToDetail();
	} finally {
		submitting.value = false;
	}
}

onShow(load);
</script>

<style lang="scss" scoped>
.edit-page {
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
		min-height: 180rpx;
		margin-top: 14rpx;
		padding: 22rpx 24rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 26rpx;
		color: #1a2233;
		box-sizing: border-box;
	}
}

.edit-actions {
	display: flex;
	gap: 18rpx;
	padding-bottom: 48rpx;
}
</style>
