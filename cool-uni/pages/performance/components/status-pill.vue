<!-- 文件职责：统一渲染首批移动端业务页的状态标签；不负责状态流转判断或权限控制；依赖调用方传入的 label 和 tone；维护重点是色彩和文案只表达状态，不表达额外业务结论。 -->
<template>
	<view class="status-pill" :class="`is-${tone || 'info'}`">
		{{ label }}
	</view>
</template>

<script lang="ts" setup>
defineProps<{
	label: string;
	tone?: "info" | "warning" | "success" | "error";
}>();
</script>

<style lang="scss" scoped>
.status-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 112rpx;
	padding: 10rpx 20rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	font-weight: 600;

	&.is-info {
		color: #5d6678;
		background: #edf1f7;
	}

	&.is-warning {
		color: #935400;
		background: #fff1d7;
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
