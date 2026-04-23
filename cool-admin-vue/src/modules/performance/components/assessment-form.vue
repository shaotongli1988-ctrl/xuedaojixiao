<template>
	<div class="assessment-form">
		<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
			<el-row :gutter="16">
				<el-col :span="12">
					<el-form-item label="被考核人" prop="employeeId">
						<el-select
							v-model="form.employeeId"
							placeholder="请选择被考核人"
							filterable
							clearable
							:disabled="isSelfMode"
							@change="syncDepartment"
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
					<el-form-item label="评估负责人" prop="assessorId">
						<el-select
							v-model="form.assessorId"
							placeholder="请选择评估负责人"
							filterable
							clearable
							:disabled="isSelfMode"
						>
							<el-option
								v-for="item in users"
								:key="`assessor-${item.id}`"
								:label="item.name"
								:value="item.id"
							/>
						</el-select>
					</el-form-item>
				</el-col>

				<el-col :span="12">
					<el-form-item label="周期类型" prop="periodType">
						<el-select v-model="form.periodType" :disabled="isSelfMode">
							<el-option label="月度" value="month" />
							<el-option label="季度" value="quarter" />
							<el-option label="年度" value="year" />
						</el-select>
					</el-form-item>
				</el-col>

				<el-col :span="12">
					<el-form-item label="周期值" prop="periodValue">
						<el-input
							v-model="form.periodValue"
							placeholder="例如：2026-Q2"
							:disabled="isSelfMode"
						/>
					</el-form-item>
				</el-col>

				<el-col :span="12">
					<el-form-item label="所属部门">
						<el-input v-model="departmentName" disabled />
					</el-form-item>
				</el-col>

				<el-col :span="12">
					<el-form-item label="目标完成率">
						<el-input-number
							v-model="form.targetCompletion"
							:min="0"
							:max="100"
							:precision="2"
							:step="1"
							controls-position="right"
						/>
					</el-form-item>
				</el-col>
			</el-row>

			<el-form-item label="员工自评" prop="selfEvaluation">
				<el-input
					v-model="form.selfEvaluation"
					type="textarea"
					:rows="4"
					placeholder="请输入员工自评"
				/>
			</el-form-item>

			<el-form-item label="评分明细">
				<score-item-table v-model="form.scoreItems" :readonly="false" />
			</el-form-item>
		</el-form>

		<div class="assessment-form__footer">
			<el-button @click="$emit('cancel')">取消</el-button>
			<el-button type="primary" :loading="loading" @click="submit">
				{{ form.id ? '保存修改' : '确认创建' }}
			</el-button>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type {
	AssessmentDraft,
	AssessmentMode,
	AssessmentRecord,
	AssessmentSaveRequest,
	UserOption
} from '../types';
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import ScoreItemTable from './score-item-table.vue';
import { createEmptyAssessment } from '../types';

const props = defineProps<{
	modelValue?: AssessmentRecord | null;
	mode: AssessmentMode;
	users: UserOption[];
	loading?: boolean;
}>();

const emit = defineEmits<{
	(e: 'submit', value: AssessmentSaveRequest & { id?: number }): void;
	(e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive<AssessmentDraft>(createEmptyAssessment());

const isSelfMode = computed(() => props.mode === 'my');

const departmentName = computed(() => {
	const current = props.users.find(item => item.id === form.employeeId);
	return current?.departmentName || form.departmentName || '';
});

const rules = {
	employeeId: [{ required: true, message: '请选择被考核人', trigger: 'change' }],
	assessorId: [{ required: true, message: '请选择评估负责人', trigger: 'change' }],
	periodType: [{ required: true, message: '请选择周期类型', trigger: 'change' }],
	periodValue: [{ required: true, message: '请输入周期值', trigger: 'blur' }]
};

watch(
	() => props.modelValue,
	value => {
		const sourceScoreItems = value?.scoreItems ?? [];
		const next = value
			? {
					...createEmptyAssessment(),
					...value,
					scoreItems:
						sourceScoreItems.length > 0
							? sourceScoreItems.map(item => ({
									...item,
									score: Number(item.score || 0),
									weight: Number(item.weight || 0)
								}))
							: createEmptyAssessment().scoreItems
			  }
			: createEmptyAssessment();

		Object.assign(form, next);
	},
	{
		immediate: true
	}
);

function syncDepartment(value?: number) {
	const current = props.users.find(item => item.id === Number(value || form.employeeId));
	form.departmentId = current?.departmentId || undefined;
	form.departmentName = current?.departmentName || '';
}

async function submit() {
	await formRef.value?.validate();

	if (!form.scoreItems.length) {
		ElMessage.error('至少保留一个评分项');
		return;
	}

	if (form.scoreItems.some(item => !item.indicatorName.trim())) {
		ElMessage.error('评分项名称不能为空');
		return;
	}

	syncDepartment();

	if (form.employeeId == null || form.assessorId == null) {
		ElMessage.error('请选择被考核人和评估负责人');
		return;
	}

	emit('submit', {
		id: form.id,
		code: form.code,
		employeeId: form.employeeId,
		assessorId: form.assessorId,
		departmentId: form.departmentId,
		periodType: form.periodType,
		periodValue: form.periodValue,
		targetCompletion: form.targetCompletion,
		selfEvaluation: form.selfEvaluation,
		scoreItems: form.scoreItems.map(item => ({
			...item,
			score: Number(item.score || 0),
			weight: Number(item.weight || 0),
			comment: item.comment || ''
		}))
	});
}
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.assessment-form {
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
