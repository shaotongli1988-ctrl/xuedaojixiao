<!-- 文件职责：承接会议创建与编辑表单，输出 meeting 主链基础字段；不负责列表刷新、详情展示、逐人签到或权限判定；依赖会议类型、用户选项和 Element Plus 表单组件；维护重点是详情脱敏约束下不回显参与人名单，且状态选择必须受父层传入的合法状态集合约束。 -->
<template>
	<el-form ref="formRef" :model="localValue" :rules="rules" label-width="110px">
		<el-alert
			title="首批只维护会议基础信息与会议级签到，不展示纪要、评论或效能分析全文。"
			type="info"
			:closable="false"
			show-icon
		/>

		<el-alert
			v-if="editing && participantSelectionUnknown"
			class="meeting-form__alert"
			title="当前页不回显原参与人名单；如需调整参与人，请重新选择，未重新选择则保持后端现状。"
			type="warning"
			:closable="false"
			show-icon
		/>

		<el-row :gutter="16">
			<el-col :span="12">
				<el-form-item label="会议标题" prop="title">
					<el-input v-model="localValue.title" placeholder="请输入会议标题" />
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="会议编码">
					<el-input v-model="localValue.code" placeholder="可选，手工填写会议编码" />
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="会议类型">
					<el-input v-model="localValue.type" placeholder="可选，填写会议类型" />
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="会议地点">
					<el-input v-model="localValue.location" placeholder="可选，填写会议地点" />
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="组织者" prop="organizerId">
					<el-select
						v-model="localValue.organizerId"
						placeholder="请选择组织者"
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
			<el-col :span="12">
				<el-form-item label="状态" prop="status">
					<el-select v-model="localValue.status" placeholder="请选择状态">
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="开始时间" prop="startDate">
					<el-date-picker
						v-model="localValue.startDate"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						placeholder="请选择开始时间"
						style="width: 100%"
					/>
				</el-form-item>
			</el-col>
			<el-col :span="12">
				<el-form-item label="结束时间" prop="endDate">
					<el-date-picker
						v-model="localValue.endDate"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						placeholder="请选择结束时间"
						style="width: 100%"
					/>
				</el-form-item>
			</el-col>
		</el-row>

		<el-form-item label="参与人">
			<el-select
				v-model="selectedParticipantIds"
				placeholder="可选，选择会议参与人"
				filterable
				clearable
				multiple
				style="width: 100%"
				@change="handleParticipantChange"
			>
				<el-option
					v-for="item in users"
					:key="item.id"
					:label="item.name"
					:value="item.id"
				/>
			</el-select>
		</el-form-item>

		<el-form-item label="会议描述">
			<el-input
				v-model="localValue.description"
				type="textarea"
				:rows="4"
				maxlength="1000"
				show-word-limit
				placeholder="可选，填写会议描述"
			/>
		</el-form-item>

		<div class="meeting-form__footer">
			<el-button @click="$emit('cancel')">取消</el-button>
			<el-button type="primary" :loading="loading" @click="handleSubmit">
				{{ editing ? '保存修改' : '创建会议' }}
			</el-button>
		</div>
	</el-form>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import {
	type MeetingRecord,
	type MeetingStatus,
	type UserOption,
	createEmptyMeeting
} from '../types';

const props = defineProps<{
	modelValue: MeetingRecord;
	users: UserOption[];
	statusOptions: Array<{ label: string; value: MeetingStatus }>;
	loading?: boolean;
	editing?: boolean;
	participantSelectionUnknown?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: MeetingRecord): void;
	(e: 'submit', value: MeetingRecord): void;
	(e: 'cancel'): void;
	(e: 'participant-change'): void;
}>();

const formRef = ref<FormInstance>();
const localValue = reactive<MeetingRecord>(createEmptyMeeting());

const rules: FormRules = {
	title: [{ required: true, message: '请输入会议标题', trigger: 'blur' }],
	organizerId: [{ required: true, message: '请选择组织者', trigger: 'change' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }],
	startDate: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
	endDate: [
		{ required: true, message: '请选择结束时间', trigger: 'change' },
		{
			validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
				if (!value || !localValue.startDate) {
					callback();
					return;
				}

				if (new Date(value).getTime() < new Date(localValue.startDate).getTime()) {
					callback(new Error('结束时间不能早于开始时间'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	]
};

watch(
	() => props.modelValue,
	value => {
		Object.assign(localValue, createEmptyMeeting(), value || {});
		localValue.participantIds = Array.isArray(value?.participantIds) ? [...value.participantIds] : [];
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
			participantIds: selectedParticipantIds.value
		});
	},
	{
		deep: true
	}
);

const selectedParticipantIds = computed({
	get() {
		return Array.isArray(localValue.participantIds) ? localValue.participantIds : [];
	},
	set(value: number[]) {
		localValue.participantIds = value;
	}
});

function handleParticipantChange() {
	emit('participant-change');
}

async function handleSubmit() {
	await formRef.value?.validate();
	emit('submit', {
		...localValue,
		participantIds: selectedParticipantIds.value
	});
}
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.meeting-form {
	&__alert {
		margin-top: var(--app-space-3);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
	}

	@include overlayResponsive.overlay-responsive;
}
</style>
