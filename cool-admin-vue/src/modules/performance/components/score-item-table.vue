<template>
	<div class="score-item-table">
		<div v-if="!readonly" class="score-item-table__actions">
			<el-button type="primary" plain @click="appendRow">新增评分项</el-button>
		</div>

		<el-table :data="rows" border>
			<el-table-column label="指标名称" min-width="180">
				<template #default="{ row, $index }">
					<el-input
						v-if="!readonly"
						:model-value="row.indicatorName"
						placeholder="请输入指标名称"
						@update:model-value="updateRow($index, 'indicatorName', $event)"
					/>
					<span v-else>{{ row.indicatorName || '-' }}</span>
				</template>
			</el-table-column>

			<el-table-column label="评分" width="140">
				<template #default="{ row, $index }">
					<el-input-number
						v-if="!readonly"
						:model-value="row.score"
						:min="0"
						:max="100"
						:precision="2"
						:step="1"
						controls-position="right"
						@update:model-value="updateRow($index, 'score', Number($event || 0))"
					/>
					<span v-else>{{ Number(row.score || 0).toFixed(2) }}</span>
				</template>
			</el-table-column>

			<el-table-column label="权重" width="140">
				<template #default="{ row, $index }">
					<el-input-number
						v-if="!readonly"
						:model-value="row.weight"
						:min="0"
						:max="100"
						:precision="2"
						:step="1"
						controls-position="right"
						@update:model-value="updateRow($index, 'weight', Number($event || 0))"
					/>
					<span v-else>{{ Number(row.weight || 0).toFixed(2) }}</span>
				</template>
			</el-table-column>

			<el-table-column label="加权结果" width="140">
				<template #default="{ row }">
					{{ Number(row.weightedScore ?? (row.score * row.weight) / 100).toFixed(2) }}
				</template>
			</el-table-column>

			<el-table-column label="说明" min-width="220">
				<template #default="{ row, $index }">
					<el-input
						v-if="!readonly"
						:model-value="row.comment"
						placeholder="请输入单项说明"
						@update:model-value="updateRow($index, 'comment', $event)"
					/>
					<span v-else>{{ row.comment || '-' }}</span>
				</template>
			</el-table-column>

			<el-table-column v-if="!readonly" label="操作" width="100" fixed="right">
				<template #default="{ $index }">
					<el-button text type="danger" @click="removeRow($index)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script lang="ts" setup>
import type { AssessmentScoreItem } from '../types';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue: AssessmentScoreItem[];
		readonly?: boolean;
	}>(),
	{
		readonly: false
	}
);

const emit = defineEmits<{
	(e: 'update:modelValue', value: AssessmentScoreItem[]): void;
}>();

const rows = computed(() => props.modelValue || []);

function updateRows(list: AssessmentScoreItem[]) {
	emit('update:modelValue', list);
}

function appendRow() {
	updateRows([
		...rows.value,
		{
			indicatorName: '',
			score: 0,
			weight: 0,
			comment: ''
		}
	]);
}

type EditableAssessmentScoreField = 'indicatorName' | 'score' | 'weight' | 'comment';
type EditableAssessmentScoreValueMap = Pick<AssessmentScoreItem, EditableAssessmentScoreField>;

function updateRow<K extends keyof EditableAssessmentScoreValueMap>(
	index: number,
	field: K,
	value: EditableAssessmentScoreValueMap[K]
) {
	const list = rows.value.map((item, current) => {
		if (current === index) {
			return {
				...item,
				[field]: value
			};
		}

		return item;
	});

	updateRows(list);
}

function removeRow(index: number) {
	updateRows(rows.value.filter((_, current) => current !== index));
}
</script>

<style lang="scss" scoped>
.score-item-table {
	display: grid;
	gap: var(--app-space-3);

	&__actions {
		display: flex;
		justify-content: flex-end;
	}
}
</style>
