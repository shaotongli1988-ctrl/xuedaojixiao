<template>
	<el-drawer
		:model-value="modelValue"
		title="审批评估单"
		size="720px"
		@close="$emit('update:modelValue', false)"
	>
		<div class="approval-drawer">
			<assessment-detail :assessment="assessment" />

			<el-form label-width="90px">
				<el-form-item label="审批意见">
					<el-input
						v-model="comment"
						type="textarea"
						:rows="4"
						placeholder="请输入审批意见"
					/>
				</el-form-item>
			</el-form>

			<div class="approval-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">取消</el-button>
				<el-button
					v-if="canReject"
					type="danger"
					:loading="loading"
					@click="$emit('reject', comment)"
				>
					审批驳回
				</el-button>
				<el-button
					v-if="canApprove"
					type="primary"
					:loading="loading"
					@click="$emit('approve', comment)"
				>
					审批通过
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { AssessmentRecord } from '../types';
import AssessmentDetail from './assessment-detail.vue';

const props = defineProps<{
	modelValue: boolean;
	assessment: AssessmentRecord | null;
	loading?: boolean;
	canApprove?: boolean;
	canReject?: boolean;
}>();

defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'approve', comment: string): void;
	(e: 'reject', comment: string): void;
}>();

const comment = ref('');

watch(
	() => props.modelValue,
	value => {
		if (value) {
			comment.value = props.assessment?.managerFeedback || '';
		}
	}
);
</script>

<style lang="scss" scoped>
.approval-drawer {
	display: grid;
	gap: 16px;

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
}
</style>
