<!-- 文件职责：承接会议详情抽屉与会议级签到入口；不负责会议列表筛选、创建编辑或逐人签到；依赖 meeting 类型与 Element Plus 抽屉组件；维护重点是详情只展示 participantCount 摘要，不展示参与人名单。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		title="会议详情"
		size="720px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="meeting" class="meeting-detail-drawer">
			<el-alert
				title="当前详情只展示参与人数摘要，不展示参与人名单、纪要、评论或效能分析全文。"
				type="info"
				:closable="false"
				show-icon
			/>

			<el-descriptions :column="2" border>
				<el-descriptions-item label="会议标题">
					{{ meeting.title || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="会议状态">
					<el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="会议编码">
					{{ meeting.code || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="会议类型">
					{{ meeting.type || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="组织者">
					{{ meeting.organizerName || meeting.organizerId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="参与人数">
					{{ meeting.participantCount ?? 0 }}
				</el-descriptions-item>
				<el-descriptions-item label="开始时间">
					{{ meeting.startDate || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="结束时间">
					{{ meeting.endDate || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="会议地点">
					{{ meeting.location || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="创建时间">
					{{ meeting.createTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间" :span="2">
					{{ meeting.updateTime || '-' }}
				</el-descriptions-item>
			</el-descriptions>

			<el-card shadow="never">
				<template #header>会议描述</template>
				<div class="meeting-detail-drawer__text">{{ meeting.description || '暂无会议描述' }}</div>
			</el-card>

			<div class="meeting-detail-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">关闭</el-button>
				<el-button
					v-if="canCheckIn"
					type="primary"
					:loading="loading"
					@click="emitCheckIn"
				>
					会议签到
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { MeetingRecord } from '../types';

const props = defineProps<{
	modelValue: boolean;
	meeting: MeetingRecord | null;
	loading?: boolean;
	canCheckIn?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'check-in', value: { id: number }): void;
}>();

const statusLabel = computed(() => {
	switch (props.meeting?.status) {
		case 'in_progress':
			return '进行中';
		case 'completed':
			return '已结束';
		case 'cancelled':
			return '已取消';
		default:
			return '已安排';
	}
});

const statusTagType = computed(() => {
	switch (props.meeting?.status) {
		case 'in_progress':
			return 'warning';
		case 'completed':
			return 'success';
		case 'cancelled':
			return 'info';
		default:
			return undefined;
	}
});

function emitCheckIn() {
	if (!props.meeting?.id) {
		return;
	}

	emit('check-in', {
		id: props.meeting.id
	});
}
</script>

<style lang="scss" scoped>
.meeting-detail-drawer {
	display: grid;
	gap: 16px;

	&__text {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--el-text-color-regular);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
}
</style>
