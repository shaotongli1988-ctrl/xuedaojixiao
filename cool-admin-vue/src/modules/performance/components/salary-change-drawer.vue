<!-- 文件职责：承载已确认薪资的单次调整录入；不负责薪资详情展示和主表编辑；依赖薪资记录类型与外部提交回调；维护重点是 confirmed 后只能通过这里提交调整原因和本次调整金额。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		title="新增调整记录"
		size="460px"
		destroy-on-close
		@close="emit('update:modelValue', false)"
	>
		<template v-if="record">
			<el-alert
				type="warning"
				show-icon
				:closable="false"
				title="已确认薪资不能直接编辑金额，请通过调整记录变更。"
			/>

			<el-descriptions :column="1" border class="salary-change-drawer__summary">
				<el-descriptions-item label="员工">
					{{ record.employeeName || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="当前最终金额">
					{{ formatAmount(record.finalAmount) }}
				</el-descriptions-item>
				<el-descriptions-item label="当前累计调整">
					{{ formatAmount(record.adjustAmount) }}
				</el-descriptions-item>
			</el-descriptions>

			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="本次调整" prop="adjustAmount">
					<el-input-number
						v-model="form.adjustAmount"
						:step="100"
						:precision="2"
						controls-position="right"
					/>
				</el-form-item>
				<el-form-item label="调整原因" prop="changeReason">
					<el-input
						v-model="form.changeReason"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="请输入本次薪资调整原因"
					/>
				</el-form-item>
			</el-form>
		</template>

		<template #footer>
			<div class="salary-change-drawer__footer">
				<el-button @click="emit('update:modelValue', false)">取消</el-button>
				<el-button type="primary" :loading="loading" @click="submit">
					保存调整
				</el-button>
			</div>
		</template>
	</el-drawer>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref, watch } from 'vue';
import type { SalaryRecord } from '../types';

const props = defineProps<{
	modelValue: boolean;
	record: SalaryRecord | null;
	loading?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(
		e: 'submit',
		payload: { salaryId: number; adjustAmount: number; changeReason: string }
	): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
	adjustAmount: 0,
	changeReason: ''
});

const rules: FormRules = {
	adjustAmount: [{ required: true, message: '请输入本次调整金额', trigger: 'change' }],
	changeReason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
};

watch(
	() => props.modelValue,
	value => {
		if (value) {
			form.adjustAmount = 0;
			form.changeReason = '';
		}
	}
);

function formatAmount(value?: number) {
	return Number(value || 0).toFixed(2);
}

async function submit() {
	await formRef.value?.validate();

	if (!props.record?.id) {
		return;
	}

	emit('submit', {
		salaryId: props.record.id,
		adjustAmount: Number(form.adjustAmount || 0),
		changeReason: String(form.changeReason || '').trim()
	});
}
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.salary-change-drawer {
	&__summary {
		margin: var(--app-space-4) 0 var(--app-space-5);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
	}

	@include overlayResponsive.overlay-responsive;
}
</style>
