<!-- 文件职责：统一展示环评任务状态标签；不负责状态流转、权限判断或接口数据转换；依赖 cl-tag、字典 store 与调用方传入的状态字符串；维护重点是状态标签与色板必须走后端下发的任务状态字典。 -->
<template>
	<cl-tag :type="tagType" round>{{ label }}</cl-tag>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStore } from "/@/cool/store";

const FEEDBACK_TASK_STATUS_DICT_KEY = "performance.feedback.taskStatus";

const props = defineProps<{
	status?: string;
}>();

const { dict } = useStore();

const tagType = computed(() => {
	const tone = dict.getMeta(FEEDBACK_TASK_STATUS_DICT_KEY, props.status)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
});

const label = computed(() => {
	return dict.getLabel(FEEDBACK_TASK_STATUS_DICT_KEY, props.status) || props.status || "未知";
});
</script>
