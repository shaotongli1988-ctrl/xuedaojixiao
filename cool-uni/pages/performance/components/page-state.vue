<!-- 文件职责：统一承载首批移动端业务页的空态、错误态、无权限态和记录失效态；不负责请求重试逻辑本身；依赖调用方传入的标题、说明和动作文案；维护重点是状态文案必须明确且不泄露范围外数据存在性。 -->
<template>
	<view class="page-state">
		<cl-empty :text="title" :fixed="false">
			<view class="page-state__content">
				<text v-if="description" class="page-state__description">{{ description }}</text>
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
	description?: string;
	actionText?: string;
}>();

defineEmits<{
	(event: "action"): void;
}>();
</script>

<style lang="scss" scoped>
.page-state {
	padding: 96rpx 32rpx 0;

	&__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 28rpx;
		margin-top: 8rpx;
	}

	&__description {
		font-size: 24rpx;
		line-height: 1.7;
		color: #7d8698;
		text-align: center;
	}
}
</style>
