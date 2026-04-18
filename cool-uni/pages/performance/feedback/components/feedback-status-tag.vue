<!-- 文件职责：统一展示环评任务状态标签；不负责状态流转、权限判断或接口数据转换；依赖 cl-tag 与调用方传入的状态字符串；维护重点是状态映射只能覆盖 draft/running/closed 三种事实状态。 -->
<template>
	<cl-tag :type="tagType" round>{{ label }}</cl-tag>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
	status?: string;
}>();

const tagType = computed(() => {
	switch (props.status) {
		case "closed":
			return "success";
		case "running":
			return "warning";
		default:
			return "info";
	}
});

const label = computed(() => {
	switch (props.status) {
		case "closed":
			return "已关闭";
		case "running":
			return "进行中";
		default:
			return "草稿";
	}
});
</script>
