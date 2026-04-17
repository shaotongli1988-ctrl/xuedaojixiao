<!-- 文件职责：承接环评任务创建表单，输出 assessmentId、employeeId、title、deadline、feedbackUserIds 和 relationTypes；不负责任务列表刷新、后端权限判断或提交请求；依赖绩效模块类型定义和 Element Plus 表单组件；维护重点是评价人列表与 relationTypes 必须保持同一份选人结果。 -->
<template>
	<el-form ref="formRef" :model="localValue" :rules="rules" label-width="110px">
		<el-alert
			title="评价人由发起人显式选择，首期不支持匿名和自动推荐"
			type="info"
			:closable="false"
			show-icon
		/>

		<el-row :gutter="16">
			<el-col :span="12">
				<el-form-item label="来源评估单" prop="assessmentId">
					<el-input-number
						v-model="assessmentIdInput"
						:min="1"
						controls-position="right"
						placeholder="请输入评估单 ID"
						style="width: 100%"
					/>
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="被评价人" prop="employeeId">
					<el-select
						v-model="localValue.employeeId"
						placeholder="请选择被评价人"
						filterable
						clearable
					>
						<el-option
							v-for="item in users"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
			</el-col>
		</el-row>

		<el-form-item label="任务标题" prop="title">
			<el-input v-model="localValue.title" placeholder="请输入环评任务标题" />
		</el-form-item>

		<el-form-item label="截止时间">
			<el-date-picker
				v-model="localValue.deadline"
				type="datetime"
				value-format="YYYY-MM-DD HH:mm:ss"
				placeholder="不填表示使用后端默认策略"
				style="width: 100%"
			/>
		</el-form-item>

		<el-form-item label="评价人" prop="feedbackUserIds">
			<el-select
				v-model="selectedFeedbackUsers"
				placeholder="请选择评价人"
				filterable
				clearable
				multiple
				style="width: 100%"
			>
				<el-option
					v-for="item in feedbackCandidates"
					:key="item.id"
					:label="item.name"
					:value="item.id"
				/>
			</el-select>
		</el-form-item>

		<el-card shadow="never">
			<template #header>
				<div class="feedback-task-form__relation-header">
					<span>评价关系</span>
					<el-tag effect="plain">可选补充</el-tag>
				</div>
			</template>

			<el-empty
				v-if="!selectedFeedbackUsers.length"
				description="先选择评价人，再按人维护关系类型"
			/>

			<div v-else class="feedback-task-form__relation-list">
				<div
					v-for="item in selectedFeedbackUsers"
					:key="item"
					class="feedback-task-form__relation-item"
				>
					<div class="feedback-task-form__relation-user">
						{{ userLabel(item) }}
					</div>
					<el-select
						:model-value="relationTypeValue(item)"
						placeholder="关系类型"
						clearable
						style="width: 180px"
						@change="value => updateRelationType(item, value)"
					>
						<el-option
							v-for="option in relationOptions"
							:key="option.value"
							:label="option.label"
							:value="option.value"
						/>
					</el-select>
				</div>
			</div>
		</el-card>

		<div class="feedback-task-form__footer">
			<el-button @click="$emit('cancel')">取消</el-button>
			<el-button type="primary" :loading="loading" @click="handleSubmit">
				创建任务
			</el-button>
		</div>
	</el-form>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import {
	type FeedbackRelationType,
	type FeedbackTaskRecord,
	type UserOption,
	createEmptyFeedbackTask
} from '../types';

const props = defineProps<{
	modelValue: FeedbackTaskRecord;
	users: UserOption[];
	loading?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: FeedbackTaskRecord): void;
	(e: 'submit', value: FeedbackTaskRecord): void;
	(e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const assessmentIdInput = ref<number | undefined>(undefined);
const localValue = reactive(createEmptyFeedbackTask());

const relationOptions: Array<{ label: string; value: FeedbackRelationType }> = [
	{ label: '上级', value: '上级' },
	{ label: '同级', value: '同级' },
	{ label: '下级', value: '下级' },
	{ label: '协作人', value: '协作人' }
];

const rules: FormRules = {
	assessmentId: [{ required: true, message: '请输入来源评估单 ID', trigger: 'blur' }],
	employeeId: [{ required: true, message: '请选择被评价人', trigger: 'change' }],
	title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
	feedbackUserIds: [
		{
			type: 'array',
			required: true,
			min: 1,
			message: '请至少选择一位评价人',
			trigger: 'change'
		}
	]
};

watch(
	() => props.modelValue,
	value => {
		Object.assign(localValue, createEmptyFeedbackTask(), value || {});
		assessmentIdInput.value = value?.assessmentId ? Number(value.assessmentId) : undefined;
	},
	{
		immediate: true,
		deep: true
	}
);

watch(
	localValue,
	value => {
		emit('update:modelValue', {
			...value,
			assessmentId: assessmentIdInput.value || null,
			relationTypes: (value.relationTypes || []).filter(item =>
				(value.feedbackUserIds || []).includes(Number(item.feedbackUserId))
			)
		});
	},
	{
		deep: true
	}
);

watch(assessmentIdInput, value => {
	localValue.assessmentId = value || null;
});

const selectedFeedbackUsers = computed({
	get() {
		return localValue.feedbackUserIds || [];
	},
	set(value: number[]) {
		localValue.feedbackUserIds = value;
		localValue.relationTypes = (localValue.relationTypes || []).filter(item =>
			value.includes(Number(item.feedbackUserId))
		);
	}
});

const feedbackCandidates = computed(() => {
	return props.users.filter(item => Number(item.id) !== Number(localValue.employeeId || 0));
});

function relationTypeValue(userId: number) {
	return localValue.relationTypes?.find(item => Number(item.feedbackUserId) === Number(userId))
		?.relationType;
}

function updateRelationType(userId: number, value?: FeedbackRelationType) {
	const list = [...(localValue.relationTypes || [])];
	const current = props.users.find(item => Number(item.id) === Number(userId));
	const index = list.findIndex(item => Number(item.feedbackUserId) === Number(userId));

	if (!value) {
		if (index >= 0) {
			list.splice(index, 1);
		}
		localValue.relationTypes = list;
		return;
	}

	const payload = {
		feedbackUserId: Number(userId),
		feedbackUserName: current?.name,
		relationType: value
	};

	if (index >= 0) {
		list[index] = payload;
	} else {
		list.push(payload);
	}

	localValue.relationTypes = list;
}

function userLabel(userId: number) {
	return props.users.find(item => Number(item.id) === Number(userId))?.name || `用户${userId}`;
}

async function handleSubmit() {
	localValue.assessmentId = assessmentIdInput.value || null;
	await formRef.value?.validate();

	emit('submit', {
		...localValue,
		assessmentId: assessmentIdInput.value || null,
		relationTypes: (localValue.relationTypes || []).filter(item =>
			(localValue.feedbackUserIds || []).includes(Number(item.feedbackUserId))
		)
	});
}
</script>

<style lang="scss" scoped>
.feedback-task-form {
	&__relation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	&__relation-list {
		display: grid;
		gap: 12px;
	}

	&__relation-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		border-radius: 8px;
		background: var(--el-fill-color-light);
	}

	&__relation-user {
		font-weight: 500;
		color: var(--el-text-color-primary);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 20px;
	}
}
</style>
