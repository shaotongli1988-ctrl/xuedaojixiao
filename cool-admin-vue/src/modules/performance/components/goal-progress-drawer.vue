<!-- 文件职责：承接目标详情与进度更新抽屉；不负责目标列表筛选、新增或导出；依赖目标记录类型与 Element Plus 表单组件；维护重点是详情展示和进度提交始终使用同一条目标记录。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		:title="canUpdate ? '目标详情与进度更新' : '目标详情'"
		size="720px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="goal" class="goal-progress-drawer">
			<el-descriptions :column="2" border>
				<el-descriptions-item label="目标标题">{{ goal.title }}</el-descriptions-item>
				<el-descriptions-item label="状态">{{ statusLabel }}</el-descriptions-item>
				<el-descriptions-item label="员工">
					{{ goal.employeeName || goal.employeeId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="部门">
					{{ goal.departmentName || goal.departmentId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="当前值 / 目标值">
					{{ Number(goal.currentValue || 0).toFixed(2) }} /
					{{ Number(goal.targetValue || 0).toFixed(2) }}
				</el-descriptions-item>
				<el-descriptions-item label="完成进度">
					{{ Number(goal.progressRate || 0).toFixed(2) }}%
				</el-descriptions-item>
				<el-descriptions-item label="时间范围">
					{{ goal.startDate }} ~ {{ goal.endDate }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ goal.updateTime || '-' }}
				</el-descriptions-item>
			</el-descriptions>

			<el-card shadow="never">
				<template #header>目标说明</template>
				<div class="goal-progress-drawer__text">{{ goal.description || '暂无' }}</div>
			</el-card>

			<el-card shadow="never">
				<template #header>进度记录</template>
				<el-empty
					v-if="!goal.progressRecords?.length"
					description="暂无进度记录"
				/>
				<el-timeline v-else>
					<el-timeline-item
						v-for="item in goal.progressRecords"
						:key="item.id"
						:timestamp="item.createTime || ''"
					>
						<div class="goal-progress-drawer__record">
							<div>
								{{ Number(item.beforeValue || 0).toFixed(2) }} ->
								{{ Number(item.afterValue || 0).toFixed(2) }}
								（{{ Number(item.progressRate || 0).toFixed(2) }}%）
							</div>
							<div class="goal-progress-drawer__record-meta">
								{{ item.operatorName || item.operatorId || '-' }}
							</div>
							<div class="goal-progress-drawer__record-remark">
								{{ item.remark || '无说明' }}
							</div>
						</div>
					</el-timeline-item>
				</el-timeline>
			</el-card>

			<el-card v-if="canUpdate" shadow="never">
				<template #header>更新进度</template>
				<el-form label-width="100px">
					<el-form-item label="最新当前值">
						<el-input-number
							v-model="currentValue"
							:min="0"
							:precision="2"
							:step="1"
							controls-position="right"
						/>
					</el-form-item>
					<el-form-item label="更新说明">
						<el-input
							v-model="remark"
							type="textarea"
							:rows="3"
							placeholder="请输入进度更新说明"
						/>
					</el-form-item>
				</el-form>
			</el-card>

			<div class="goal-progress-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">关闭</el-button>
				<el-button v-if="canUpdate" type="primary" :loading="loading" @click="submit">
					更新进度
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { GoalRecord } from '../types';

const props = defineProps<{
	modelValue: boolean;
	goal: GoalRecord | null;
	loading?: boolean;
	canUpdate?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'submit', value: { id: number; currentValue: number; remark?: string }): void;
}>();

const currentValue = ref(0);
const remark = ref('');

const statusLabel = computed(() => {
	switch (props.goal?.status) {
		case 'in-progress':
			return '进行中';
		case 'completed':
			return '已完成';
		case 'cancelled':
			return '已取消';
		default:
			return '草稿';
	}
});

watch(
	() => props.modelValue,
	value => {
		if (value) {
			currentValue.value = Number(props.goal?.currentValue || 0);
			remark.value = '';
		}
	}
);

function submit() {
	if (!props.goal?.id) {
		return;
	}

	if (currentValue.value < 0) {
		ElMessage.error('当前值不能小于 0');
		return;
	}

	emit('submit', {
		id: props.goal.id,
		currentValue: Number(currentValue.value || 0),
		remark: remark.value || ''
	});
}
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.goal-progress-drawer {
	display: grid;
	gap: var(--app-space-4);

	&__text,
	&__record-remark {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--app-text-secondary);
	}

	&__record {
		display: grid;
		gap: 6px;
	}

	&__record-meta {
		font-size: var(--app-font-size-caption);
		color: var(--app-text-tertiary);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
	}

	@include overlayResponsive.overlay-responsive;
}
</style>
