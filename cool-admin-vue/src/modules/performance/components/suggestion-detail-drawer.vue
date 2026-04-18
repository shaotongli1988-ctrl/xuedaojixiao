<!-- 文件职责：承接自动建议摘要详情和人工处理入口；不负责建议列表筛选、分页或正式单据创建；依赖 suggestion 类型与 Element Plus 抽屉组件；维护重点是只能展示冻结允许的摘要字段，不能回流敏感全文。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		:title="canOperate ? '建议详情与处理' : '建议详情'"
		size="720px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="suggestion" class="suggestion-detail-drawer">
			<el-alert
				title="当前页面只展示建议摘要和处理摘要，不展示评分细节、审批意见全文、环评全文、PIP 全文、晋升评审全文或薪资金额。"
				type="info"
				:closable="false"
				show-icon
			/>

			<el-descriptions :column="2" border>
				<el-descriptions-item label="建议 ID">
					{{ suggestion.id || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="建议类型">
					{{ typeLabel }}
				</el-descriptions-item>
				<el-descriptions-item label="状态">
					<el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="来源评估单">
					{{ suggestion.assessmentId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="员工">
					{{ suggestion.employeeName || suggestion.employeeId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="部门">
					{{ suggestion.departmentName || suggestion.departmentId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="周期">
					{{ periodLabel }}
				</el-descriptions-item>
				<el-descriptions-item label="规则版本">
					{{ suggestion.ruleVersion || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="生成时间">
					{{ suggestion.createTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="最近处理时间">
					{{ suggestion.handleTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="最近处理人">
					{{ suggestion.handlerName || suggestion.handlerId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="已关联单据">
					{{ linkedEntityLabel }}
				</el-descriptions-item>
			</el-descriptions>

			<el-card shadow="never">
				<template #header>触发摘要</template>
				<div class="suggestion-detail-drawer__text">
					{{ suggestion.triggerLabel || '暂无触发摘要' }}
				</div>
			</el-card>

			<el-card v-if="suggestion.status === 'revoked'" shadow="never">
				<template #header>撤销原因</template>
				<div class="suggestion-detail-drawer__text">
					{{ suggestion.revokeReason || '未返回撤销原因' }}
				</div>
			</el-card>

			<div class="suggestion-detail-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">关闭</el-button>
				<el-button v-if="canGoCreate" type="primary" plain @click="$emit('go-create')">
					去创建{{ targetLabel }}
				</el-button>
				<el-button v-if="canAccept" type="primary" :loading="loading" @click="$emit('accept')">
					采用
				</el-button>
				<el-button v-if="canIgnore" :loading="loading" @click="$emit('ignore')">
					忽略
				</el-button>
				<el-button v-if="canReject" type="warning" :loading="loading" @click="$emit('reject')">
					驳回
				</el-button>
				<el-button v-if="canRevoke" type="danger" :loading="loading" @click="$emit('revoke')">
					撤销
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { SuggestionRecord } from '../types';

const props = defineProps<{
	modelValue: boolean;
	suggestion: SuggestionRecord | null;
	loading?: boolean;
	canAccept?: boolean;
	canIgnore?: boolean;
	canReject?: boolean;
	canRevoke?: boolean;
	canGoCreate?: boolean;
}>();

defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'accept'): void;
	(e: 'ignore'): void;
	(e: 'reject'): void;
	(e: 'revoke'): void;
	(e: 'go-create'): void;
}>();

const canOperate = computed(() => {
	return Boolean(
		props.canAccept || props.canIgnore || props.canReject || props.canRevoke || props.canGoCreate
	);
});

const typeLabel = computed(() => {
	return props.suggestion?.suggestionType === 'promotion' ? '晋升建议' : 'PIP 建议';
});

const targetLabel = computed(() => {
	return props.suggestion?.suggestionType === 'promotion' ? '晋升单' : 'PIP';
});

const periodLabel = computed(() => {
	if (!props.suggestion?.periodValue) {
		return '-';
	}

	return [props.suggestion.periodType, props.suggestion.periodValue].filter(Boolean).join(' / ');
});

const linkedEntityLabel = computed(() => {
	if (!props.suggestion?.linkedEntityId || !props.suggestion.linkedEntityType) {
		return '-';
	}

	return `${props.suggestion.linkedEntityType} #${props.suggestion.linkedEntityId}`;
});

const statusLabel = computed(() => {
	switch (props.suggestion?.status) {
		case 'accepted':
			return '已采用';
		case 'ignored':
			return '已忽略';
		case 'rejected':
			return '已驳回';
		case 'revoked':
			return '已撤销';
		default:
			return '待处理';
	}
});

const statusTagType = computed(() => {
	switch (props.suggestion?.status) {
		case 'accepted':
			return 'success';
		case 'ignored':
			return 'info';
		case 'rejected':
			return 'warning';
		case 'revoked':
			return 'danger';
		default:
			return undefined;
	}
});
</script>

<style lang="scss" scoped>
.suggestion-detail-drawer {
	display: grid;
	gap: 16px;

	&__text {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--el-text-color-regular);
	}

	&__footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 12px;
	}
}
</style>
