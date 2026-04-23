<!-- 文件职责：承接环评反馈填写抽屉，展示任务基础信息并提交 score/content/relationType；不负责任务列表刷新、重复提交拦截策略或后端权限校验；依赖环评任务类型和 Element Plus 抽屉表单组件；维护重点是提交载荷必须严格对齐 submit 接口契约。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		title="填写环评反馈"
		size="640px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="task" class="feedback-submit-drawer">
			<el-descriptions :column="1" border>
				<el-descriptions-item label="任务标题">
					{{ task.title || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="被评价人">
					{{ task.employeeName || task.employeeId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="来源评估单">
					{{ task.assessmentId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="截止时间">
					{{ task.deadline || '未设置' }}
				</el-descriptions-item>
				<el-descriptions-item label="任务状态">
					{{ taskStatusLabel(task.status) }}
				</el-descriptions-item>
			</el-descriptions>

			<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
				<el-form-item label="评价关系" prop="relationType">
					<el-select v-model="form.relationType" placeholder="请选择评价关系" clearable>
						<el-option
							v-for="item in relationOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="评分" prop="score">
					<el-slider
						v-model="form.score"
						:min="0"
						:max="100"
						:step="1"
						show-input
						input-size="small"
					/>
				</el-form-item>
				<el-form-item label="反馈内容">
					<el-input
						v-model="form.content"
						type="textarea"
						:rows="5"
						maxlength="1000"
						show-word-limit
						placeholder="请输入反馈内容"
					/>
				</el-form-item>
			</el-form>

			<div class="feedback-submit-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">取消</el-button>
				<el-button type="primary" :loading="loading" @click="handleSubmit">
					提交反馈
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useDict } from '/$/dict';
import type { FeedbackTaskRecord } from '../types';

const FEEDBACK_TASK_STATUS_DICT_KEY = 'performance.feedback.taskStatus';
const FEEDBACK_RELATION_TYPE_DICT_KEY = 'performance.feedback.relationType';

const props = defineProps<{
	modelValue: boolean;
	task: FeedbackTaskRecord | null;
	loading?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(
		e: 'submit',
		value: { taskId: number; score: number; content?: string; relationType: string }
	): void;
}>();

const formRef = ref<FormInstance>();
const { dict } = useDict();
const form = reactive({
	score: 80,
	content: '',
	relationType: ''
});

const relationOptions = computed<Array<{ label: string; value: string }>>(() =>
	dict.get(FEEDBACK_RELATION_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: String(item.value)
	}))
);

const rules: FormRules = {
	relationType: [{ required: true, message: '请选择评价关系', trigger: 'change' }],
	score: [{ required: true, message: '请输入评分', trigger: 'blur' }]
};

watch(
	() => props.modelValue,
	value => {
		if (value) {
			form.score = 80;
			form.content = '';
			form.relationType = '';
		}
	}
);

function taskStatusLabel(value?: string) {
	return dict.getLabel(FEEDBACK_TASK_STATUS_DICT_KEY, value) || value || '-';
}

async function handleSubmit() {
	if (!props.task?.id) {
		return;
	}

	await formRef.value?.validate();

	emit('submit', {
		taskId: props.task.id,
		score: Number(form.score || 0),
		content: String(form.content || '').trim(),
		relationType: String(form.relationType || '')
	});
}
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.feedback-submit-drawer {
	display: grid;
	gap: var(--app-space-4);

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
	}

	@include overlayResponsive.overlay-responsive;
}
</style>
