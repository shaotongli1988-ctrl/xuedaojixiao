<!-- 文件职责：统一承载目标页的空态、错误态、无权限态和记录失效态；不负责请求重试逻辑本身；依赖 cl-empty 与调用方传入的标题、说明和按钮文案；维护重点是状态文案要明确且不泄露范围外数据存在性。 -->
<template>
	<view class="goal-state">
		<cl-empty :text="title" :fixed="false">
			<view class="goal-state__content">
				<text v-if="tips" class="goal-state__tips">{{ tips }}</text>
				<cl-button
					v-if="actionText"
					type="primary"
					:height="76"
					:font-size="28"
					@tap="$emit('action')"
				>
					{{ actionText }}
				</cl-button>
			</view>
		</cl-empty>
	</view>
</template>

<script lang="ts" setup>
defineProps<{
	title: string;
	tips?: string;
	actionText?: string;
}>();

defineEmits<{
	(event: "action"): void;
}>();
</script>

<style lang="scss" scoped>
.goal-state {
	padding: 80rpx 32rpx 0;

	&__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 28rpx;
		margin-top: 12rpx;
	}

	&__tips {
		font-size: 24rpx;
		line-height: 1.7;
		color: #8d94a6;
		text-align: center;
	}
}
</style>
