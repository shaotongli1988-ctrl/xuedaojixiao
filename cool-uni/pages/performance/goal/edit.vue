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

			<view v-else-if="form" class="edit-page__body">
				<view class="form-card">
					<text class="form-card__label">目标标题</text>
					<input
						v-model.trim="form.title"
						class="form-card__input"
						placeholder="请输入目标标题"
					/>

					<text class="form-card__label">目标说明</text>
					<textarea
						v-model.trim="form.description"
						class="form-card__textarea"
						placeholder="请输入目标说明"
					/>

					<text class="form-card__label">目标值</text>
					<input
						v-model.number="form.targetValue"
						class="form-card__input"
						type="number"
						placeholder="请输入目标值"
					/>

					<text class="form-card__label">单位</text>
					<input
						v-model.trim="form.unit"
						class="form-card__input"
						placeholder="请输入单位"
					/>

					<text class="form-card__label">权重</text>
					<input
						v-model.number="form.weight"
						class="form-card__input"
						type="number"
						placeholder="请输入权重"
					/>

					<text class="form-card__label">开始日期</text>
					<input
						v-model.trim="form.startDate"
						class="form-card__input"
						placeholder="YYYY-MM-DD"
					/>

					<text class="form-card__label">结束日期</text>
					<input
						v-model.trim="form.endDate"
						class="form-card__input"
						placeholder="YYYY-MM-DD"
					/>
				</view>

				<view class="edit-actions">
					<cl-button plain @tap="backToDetail">取消</cl-button>
					<cl-button type="primary" :loading="submitting" @tap="save">保存</cl-button>
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
	canGoalEdit,
	isMissingGoalError,
	isPermissionDeniedError,
	type GoalUpdatePayload,
} from "/@/types/performance-goal";
import GoalState from "./components/goal-state.vue";
import { PERMISSIONS } from "/@/generated/permissions.generated";

const { service, router } = useCool();
const { user } = useStore();

const form = ref<GoalUpdatePayload | null>(null);
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
			return "仅当前可维护目标允许编辑。";
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
	if (!recordId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	if (!user.hasPerm(PERMISSIONS.performance.goal.update)) {
		state.value = { mode: "denied", error: "" };
		return;
	}

	try {
		const res = await (service as any).performance.goal.fetchInfo({ id: recordId });

		if (!canGoalEdit(res)) {
			state.value = { mode: "denied", error: "" };
			return;
		}

		form.value = {
			id: Number(res.id),
			title: res.title || "",
			description: res.description || "",
			targetValue: Number(res.targetValue || 0),
			unit: res.unit || "",
			weight: Number(res.weight || 0),
			startDate: res.startDate || "",
			endDate: res.endDate || "",
		};
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: isPermissionDeniedError(error?.message)
				? "denied"
				: isMissingGoalError(error?.message)
					? "missing"
					: "error",
			error: error?.message || "目标编辑页加载失败",
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
	if (!form.value) return;

	submitting.value = true;

	try {
		await (service as any).performance.goal.updateGoal(form.value);
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

	&__label {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		font-weight: 600;
		color: #1a2233;

		&:first-child {
			margin-top: 0;
		}
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
