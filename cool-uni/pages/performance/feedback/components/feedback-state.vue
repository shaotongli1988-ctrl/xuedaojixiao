<!-- 文件职责：统一承载环评页面的空态、错误态、无权限态和记录失效态；不负责请求本身、路由跳转规则或权限判断；依赖 cl-empty 和调用方传入的标题、说明、按钮文案；维护重点是状态文案必须明确且不能泄露范围外数据存在性。 -->
<template>
	<view class="feedback-state">
		<cl-empty :text="title" :fixed="false">
			<view class="feedback-state__content">
				<text v-if="tips" class="feedback-state__tips">{{ tips }}</text>

				<view v-if="actionText || secondaryText" class="feedback-state__actions">
					<cl-button
						v-if="actionText"
						type="primary"
						:height="76"
						:font-size="28"
						@tap="$emit('action')"
					>
						{{ actionText }}
					</cl-button>
					<cl-button
						v-if="secondaryText"
						plain
						:height="76"
						:font-size="28"
						@tap="$emit('secondary')"
					>
						{{ secondaryText }}
					</cl-button>
				</view>
			</view>
		</cl-empty>
	</view>
</template>

<script lang="ts" setup>
defineProps<{
	title: string;
	tips?: string;
	actionText?: string;
	secondaryText?: string;
}>();

defineEmits<{
	(event: "action"): void;
	(event: "secondary"): void;
}>();
</script>

<style lang="scss" scoped>
.feedback-state {
	padding: 88rpx 32rpx 0;

	&__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 28rpx;
		margin-top: 16rpx;
	}

	&__tips {
		font-size: 24rpx;
		line-height: 1.7;
		color: #8d94a6;
		text-align: center;
	}

	&__actions {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		width: 100%;
	}
}
</style>
