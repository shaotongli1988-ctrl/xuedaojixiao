<!-- 文件职责：渲染目标状态标签；不负责状态流转判断或权限控制；依赖 performance-goal 纯规则；维护重点是展示文案必须和 PC 目标状态口径一致。 -->
<template>
	<view class="goal-status-tag" :class="`is-${goalStatusTone(status)}`">
		{{ goalStatusLabel(status) }}
	</view>
</template>

<script lang="ts" setup>
import { goalStatusLabel, goalStatusTone } from "/@/types/performance-goal";

defineProps<{
	status?: string;
}>();
</script>

<style lang="scss" scoped>
.goal-status-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 112rpx;
	padding: 10rpx 20rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	font-weight: 600;

	&.is-info {
		color: #5e6473;
		background: #eef1f7;
	}

	&.is-warning {
		color: #9a5a00;
		background: #fff1d6;
	}

	&.is-success {
		color: #0f7b4d;
		background: #dbf6e8;
	}

	&.is-error {
		color: #b12c2c;
		background: #fde6e6;
	}
}
</style>

