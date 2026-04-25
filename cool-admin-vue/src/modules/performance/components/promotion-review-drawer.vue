<!-- 文件职责：承接晋升详情与评审抽屉；不负责晋升列表筛选、创建和提交；依赖晋升记录类型与 Element Plus 表单组件；维护重点是详情查看和评审动作始终围绕同一条晋升记录。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		:title="canReview ? '晋升详情与评审' : '晋升详情'"
		size="720px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="promotion" class="promotion-review-drawer">
			<el-descriptions :column="2" border>
				<el-descriptions-item label="员工">
					{{ promotion.employeeName || promotion.employeeId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="状态">{{ statusLabel }}</el-descriptions-item>
				<el-descriptions-item label="来源评估单">
					{{ promotion.assessmentId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="发起人">
					{{ promotion.sponsorName || promotion.sponsorId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="当前岗位">
					{{ promotion.fromPosition || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="目标岗位">
					{{ promotion.toPosition || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="评审时间">
					{{ promotion.reviewTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ promotion.updateTime || '-' }}
				</el-descriptions-item>
			</el-descriptions>

			<el-card shadow="never">
				<template #header>发起原因</template>
				<div class="promotion-review-drawer__text">{{ promotion.reason || '暂无' }}</div>
			</el-card>

			<el-card shadow="never">
				<template #header>独立创建原因</template>
				<div class="promotion-review-drawer__text">
					{{ promotion.sourceReason || '来源评估单，无独立创建原因' }}
				</div>
			</el-card>

			<el-card shadow="never">
				<template #header>评审记录</template>
				<el-empty v-if="!promotion.reviewRecords?.length" description="暂无评审记录" />
				<el-timeline v-else>
					<el-timeline-item
						v-for="item in promotion.reviewRecords"
						:key="item.id"
						:timestamp="item.createTime || ''"
					>
						<div class="promotion-review-drawer__record">
							<div>
								<el-tag :type="item.decision === 'approved' ? 'success' : 'danger'">
									{{ item.decision === 'approved' ? '通过' : '驳回' }}
								</el-tag>
							</div>
							<div class="promotion-review-drawer__record-meta">
								{{ item.reviewerName || item.reviewerId || '-' }}
							</div>
							<div class="promotion-review-drawer__text">
								{{ item.comment || '无评审意见' }}
							</div>
						</div>
					</el-timeline-item>
				</el-timeline>
			</el-card>

			<el-card v-if="canReview" shadow="never">
				<template #header>评审动作</template>
				<el-form label-width="100px">
					<el-form-item label="评审结论">
						<el-radio-group v-model="decision">
							<el-radio label="approved">通过</el-radio>
							<el-radio label="rejected">驳回</el-radio>
						</el-radio-group>
					</el-form-item>
					<el-form-item label="评审意见">
						<el-input
							v-model="comment"
							type="textarea"
							:rows="3"
							placeholder="请输入评审意见"
						/>
					</el-form-item>
				</el-form>
			</el-card>

			<div class="promotion-review-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">关闭</el-button>
				<el-button
					v-if="showSourceAssessmentButton && promotion?.assessmentId"
					type="primary"
					plain
					@click="goSourceAssessment(promotion.assessmentId)"
				>
					查看来源评估单
				</el-button>
				<el-button v-if="canReview" type="primary" :loading="loading" @click="submit">
					提交评审
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import type { PromotionRecord } from '../types';
import { performanceAssessmentService } from '../service/assessment';

const PROMOTION_STATUS_DICT_KEY = 'performance.promotion.status';

const props = defineProps<{
	modelValue: boolean;
	promotion: PromotionRecord | null;
	loading?: boolean;
	canReview?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'submit', value: { id: number; decision: 'approved' | 'rejected'; comment?: string }): void;
}>();

const decision = ref<'approved' | 'rejected'>('approved');
const comment = ref('');
const router = useRouter();
const { dict } = useDict();

const statusLabel = computed(
	() =>
		dict.getLabel(PROMOTION_STATUS_DICT_KEY, props.promotion?.status) ||
		props.promotion?.status ||
		'草稿'
);

const showSourceAssessmentButton = computed(() => {
	return (
		checkPerm(performanceAssessmentService.permission.info) &&
		resolveAssessmentPagePath() !== ''
	);
});

watch(
	() => props.modelValue,
	value => {
		if (value) {
			decision.value = 'approved';
			comment.value = '';
		}
	}
);

function submit() {
	if (!props.promotion?.id) {
		return;
	}

	if (!decision.value) {
		ElMessage.error('请选择评审结论');
		return;
	}

	emit('submit', {
		id: props.promotion.id,
		decision: decision.value,
		comment: comment.value || ''
	});
}

async function goSourceAssessment(assessmentId: number) {
	const path = resolveAssessmentPagePath();

	if (!path) {
		return;
	}

	emit('update:modelValue', false);

	await router.push({
		path,
		query: {
			openDetail: '1',
			assessmentId: String(assessmentId)
		}
	});
}

function resolveAssessmentPagePath() {
	if (checkPerm(performanceAssessmentService.permission.page)) {
		return '/performance/initiated';
	}

	if (checkPerm(performanceAssessmentService.permission.myPage)) {
		return '/performance/my-assessment';
	}

	if (checkPerm(performanceAssessmentService.permission.pendingPage)) {
		return '/performance/pending';
	}

	return '';
}
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.promotion-review-drawer {
	display: grid;
	gap: var(--app-space-4);

	&__text {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--app-text-secondary);
	}

	&__record {
		display: grid;
		gap: 8px;
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
