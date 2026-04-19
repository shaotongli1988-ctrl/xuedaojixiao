<!-- 文件职责：承接主题9会议管理的列表、详情、新增、编辑和会议级签到前端主链；不负责后端权限实现、逐人签到、会议驾驶舱或全文类内容展示；依赖 meeting service、基础用户服务和局部表单/详情组件；维护重点是详情只展示 participantCount 摘要，且签到按钮只能在 in_progress 状态出现。 -->
<template>
	<div v-if="canAccess" class="meeting-page">
		<el-card shadow="never">
			<div class="meeting-page__toolbar">
				<div class="meeting-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="按标题或编码筛选"
						clearable
						style="width: 220px"
					/>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in filterStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-date-picker
						v-model="filters.startDate"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						placeholder="开始时间起"
						style="width: 200px"
					/>
					<el-date-picker
						v-model="filters.endDate"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						placeholder="结束时间止"
						style="width: 200px"
					/>
				</div>

				<div class="meeting-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建会议
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="meeting-page__stat-label">当前页会议数</div>
					<div class="meeting-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="meeting-page__stat-label">已安排</div>
					<div class="meeting-page__stat-value">
						{{ rows.filter(item => item.status === 'scheduled').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="meeting-page__stat-label">进行中</div>
					<div class="meeting-page__stat-value">
						{{ rows.filter(item => item.status === 'in_progress').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="meeting-page__stat-label">已结束/已取消</div>
					<div class="meeting-page__stat-value">
						{{ rows.filter(item => ['completed', 'cancelled'].includes(item.status || '')).length }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="meeting-page__header">
					<div class="meeting-page__header-main">
						<h2>会议管理</h2>
						<el-tag effect="plain">主题 9</el-tag>
					</div>
					<el-tag effect="plain" type="info">详情仅返回参与人数摘要</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="title" label="会议标题" min-width="180" />
				<el-table-column prop="code" label="会议编码" min-width="140">
					<template #default="{ row }">
						{{ row.code || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="type" label="会议类型" min-width="130">
					<template #default="{ row }">
						{{ row.type || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="organizerName" label="组织者" min-width="120">
					<template #default="{ row }">
						{{ row.organizerName || row.organizerId || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="参与人数" width="110">
					<template #default="{ row }">
						{{ row.participantCount ?? 0 }}
					</template>
				</el-table-column>
				<el-table-column label="会议时间" min-width="280">
					<template #default="{ row }">
						{{ row.startDate || '-' }} ~ {{ row.endDate || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="location" label="地点" min-width="160">
					<template #default="{ row }">
						{{ row.location || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="220">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canCheckIn(row)"
							text
							type="success"
							@click="handleCheckIn(row)"
						>
							签到
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="meeting-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pagination.page"
					:page-size="pagination.size"
					:total="pagination.total"
					@current-change="changePage"
				/>
			</div>
		</el-card>

		<el-dialog
			v-model="formVisible"
			:title="editingMeeting?.id ? '编辑会议' : '新建会议'"
			width="860px"
			destroy-on-close
		>
			<meeting-form
				:model-value="form"
				:users="userOptions"
				:status-options="formStatusOptions"
				:loading="submitLoading"
				:editing="Boolean(editingMeeting?.id)"
				:participant-selection-unknown="participantSelectionUnknown"
				@update:model-value="updateForm"
				@participant-change="markParticipantSelectionChanged"
				@submit="submitForm"
				@cancel="formVisible = false"
			/>
		</el-dialog>

		<meeting-detail-drawer
			v-model="detailVisible"
			:meeting="detailMeeting"
			:loading="submitLoading"
			:can-check-in="detailCanCheckIn"
			@check-in="handleCheckIn"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-meeting'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { useBase } from '/$/base';
import MeetingDetailDrawer from '../../components/meeting-detail-drawer.vue';
import MeetingForm from '../../components/meeting-form.vue';
import { performanceMeetingService } from '../../service/meeting';
import { loadUserOptions } from '../../utils/lookup-options.js';
import {
	type MeetingRecord,
	type MeetingStatus,
	type UserOption,
	createEmptyMeeting
} from '../../types';

const { user } = useBase();

const rows = ref<MeetingRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingMeeting = ref<MeetingRecord | null>(null);
const detailMeeting = ref<MeetingRecord | null>(null);
const editParticipantIdsProvided = ref(false);
const participantSelectionTouched = ref(false);

const filters = reactive({
	keyword: '',
	status: '' as '' | MeetingStatus,
	startDate: '',
	endDate: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<MeetingRecord>(createEmptyMeeting(resolveCurrentUserId()));

const filterStatusOptions: Array<{ label: string; value: MeetingStatus }> = [
	{ label: '已安排', value: 'scheduled' },
	{ label: '进行中', value: 'in_progress' },
	{ label: '已结束', value: 'completed' },
	{ label: '已取消', value: 'cancelled' }
];

const canAccess = computed(() => checkPerm(performanceMeetingService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceMeetingService.permission.info));
const showAddButton = computed(() => checkPerm(performanceMeetingService.permission.add));
const participantSelectionUnknown = computed(
	() => Boolean(editingMeeting.value?.id) && !editParticipantIdsProvided.value
);
const detailCanCheckIn = computed(() => (detailMeeting.value ? canCheckIn(detailMeeting.value) : false));
const formStatusOptions = computed(() => {
	const currentStatus = editingMeeting.value?.status || 'scheduled';

	if (!editingMeeting.value?.id) {
		return [{ label: '已安排', value: 'scheduled' as MeetingStatus }];
	}

	switch (currentStatus) {
		case 'scheduled':
			return [
				{ label: '已安排', value: 'scheduled' as MeetingStatus },
				{ label: '进行中', value: 'in_progress' as MeetingStatus },
				{ label: '已取消', value: 'cancelled' as MeetingStatus }
			];
		case 'in_progress':
			return [
				{ label: '进行中', value: 'in_progress' as MeetingStatus },
				{ label: '已结束', value: 'completed' as MeetingStatus }
			];
		case 'completed':
			return [{ label: '已结束', value: 'completed' as MeetingStatus }];
		case 'cancelled':
			return [{ label: '已取消', value: 'cancelled' as MeetingStatus }];
		default:
			return [{ label: '已安排', value: 'scheduled' as MeetingStatus }];
	}
});

onMounted(async () => {
	await loadUsers();
	await refresh();
});

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
			page: 1,
			size: 200
			}),
		(error: any) => {
			ElMessage.warning(error.message || '用户选项加载失败');
		}
	);
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceMeetingService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			status: filters.status || undefined,
			startDate: filters.startDate || undefined,
			endDate: filters.endDate || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '会议列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	editingMeeting.value = null;
	editParticipantIdsProvided.value = false;
	participantSelectionTouched.value = false;
	Object.assign(form, createEmptyMeeting(resolveCurrentUserId()));
	formVisible.value = true;
}

async function openEdit(row: MeetingRecord) {
	if (!row.id) {
		return;
	}

	await loadDetail(row.id, record => {
		editingMeeting.value = record;
		editParticipantIdsProvided.value = Array.isArray(record.participantIds);
		participantSelectionTouched.value = false;
		Object.assign(form, createEmptyMeeting(resolveCurrentUserId()), record, {
			participantIds: Array.isArray(record.participantIds) ? [...record.participantIds] : []
		});
		formVisible.value = true;
	});
}

async function openDetail(row: MeetingRecord) {
	if (!row.id) {
		return;
	}

	await loadDetail(row.id, record => {
		detailMeeting.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: MeetingRecord) => void) {
	try {
		const record = await performanceMeetingService.fetchInfo({ id });
		next(record);
	} catch (error: any) {
		ElMessage.error(error.message || '会议详情加载失败');
	}
}

function updateForm(value: MeetingRecord) {
	Object.assign(form, value);
}

function markParticipantSelectionChanged() {
	participantSelectionTouched.value = true;
}

async function submitForm(payload: MeetingRecord) {
	const submitPayload = normalizePayload(payload);
	submitLoading.value = true;

	try {
		if (editingMeeting.value?.id) {
			await performanceMeetingService.updateMeeting({
				id: editingMeeting.value.id,
				...submitPayload
			});
		} else {
			await performanceMeetingService.createMeeting(submitPayload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleCheckIn(row: { id: number; title?: string }) {
	if (!row.id) {
		return;
	}

	try {
		await ElMessageBox.confirm(
			`确认对会议「${row.title || row.id}」执行会议级签到吗？本轮不记录逐参会人签到明细。`,
			'会议签到',
			{
				type: 'warning'
			}
		);
	} catch (error: any) {
		if (error === 'cancel' || error === 'close') {
			return;
		}
		ElMessage.error(error.message || '签到确认失败');
		return;
	}

	submitLoading.value = true;

	try {
		await performanceMeetingService.checkIn({ id: row.id });
		ElMessage.success('签到成功');
		await refresh();

		if (detailVisible.value && detailMeeting.value?.id === row.id) {
			await openDetail({
				id: row.id
			} as MeetingRecord);
		}
	} catch (error: any) {
		ElMessage.error(error.message || '签到失败');
	} finally {
		submitLoading.value = false;
	}
}

function normalizePayload(payload: MeetingRecord) {
	const nextPayload: Partial<MeetingRecord> = {
		title: normalizeText(payload.title),
		code: normalizeOptionalText(payload.code),
		type: normalizeOptionalText(payload.type),
		description: normalizeOptionalText(payload.description),
		startDate: payload.startDate,
		endDate: payload.endDate,
		location: normalizeOptionalText(payload.location),
		organizerId: payload.organizerId,
		status: payload.status || 'scheduled'
	};

	const normalizedParticipantIds = Array.from(
		new Set((payload.participantIds || []).map(item => Number(item)).filter(Boolean))
	);

	if (!editingMeeting.value?.id || editParticipantIdsProvided.value || participantSelectionTouched.value) {
		nextPayload.participantIds = normalizedParticipantIds;
	}

	return nextPayload;
}

function canEdit(row: MeetingRecord) {
	return (
		checkPerm(performanceMeetingService.permission.update) &&
		!['completed', 'cancelled'].includes(String(row.status || 'scheduled'))
	);
}

function canCheckIn(row: MeetingRecord) {
	return (
		checkPerm(performanceMeetingService.permission.checkIn) &&
		row.status === 'in_progress'
	);
}

function statusLabel(status?: MeetingStatus) {
	switch (status) {
		case 'in_progress':
			return '进行中';
		case 'completed':
			return '已结束';
		case 'cancelled':
			return '已取消';
		default:
			return '已安排';
	}
}

function statusTagType(status?: MeetingStatus) {
	switch (status) {
		case 'in_progress':
			return 'warning';
		case 'completed':
			return 'success';
		case 'cancelled':
			return 'info';
		default:
			return undefined;
	}
}

function resolveCurrentUserId() {
	const currentUserId = Number(user.info?.id || 0);
	return currentUserId || undefined;
}

function normalizeText(value?: string | null) {
	return String(value || '').trim();
}

function normalizeOptionalText(value?: string | null) {
	const normalized = String(value || '').trim();
	return normalized || undefined;
}
</script>

<style lang="scss" scoped>
.meeting-page {
	display: grid;
	gap: 16px;

	&__toolbar {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	&__toolbar-left,
	&__toolbar-right {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
	}

	&__stat-label {
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}

	&__stat-value {
		margin-top: 8px;
		font-size: 24px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	&__header {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: center;
		flex-wrap: wrap;
	}

	&__header-main {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
	}
}
</style>
