<!-- 文件职责：承接主题19班主任资源列表、详情、新增编辑、负责人分配、跟进记录与合作动作主链；不负责后端数据范围裁剪、代理/绩效扩展或附件链路；依赖 teacherInfo/teacherFollow/teacherCooperation service、基础用户部门选项和路由预置参数；维护重点是只读态、合作状态门禁和建班前置条件必须与冻结契约一致。 -->
<template>
	<div v-if="canAccess" class="teacher-channel-teacher-page">
		<el-card shadow="never">
			<div class="teacher-channel-teacher-page__toolbar">
				<div class="teacher-channel-teacher-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="班主任 / 学校 / 学科"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filters.cooperationStatus"
						placeholder="合作状态"
						clearable
						style="width: 180px"
					>
						<el-option
							v-for="item in cooperationStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filterDepartmentIdModel"
						placeholder="归属部门"
						clearable
						filterable
						style="width: 200px"
					>
						<el-option
							v-for="item in departmentOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
				</div>

				<div class="teacher-channel-teacher-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增班主任
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="teacher-channel-teacher-page__header">
					<div class="teacher-channel-teacher-page__header-main">
						<h2>班主任资源列表</h2>
						<el-tag effect="plain">主题 19</el-tag>
						<el-tag effect="plain" :type="isReadOnlyRole ? 'info' : 'success'">
							{{ isReadOnlyRole ? '只读账号' : '主链可操作' }}
						</el-tag>
					</div>
					<el-alert
						:title="
							isReadOnlyRole
								? '当前账号没有主题19任何写权限，页面仅展示授权范围数据，联系方式按后端返回值展示。'
								: '未至少跟进一次前不可标记合作；仅 partnered 可建班；terminated 不可再建班。'
						"
						:type="isReadOnlyRole ? 'info' : 'warning'"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-alert
				v-if="pageError"
				class="teacher-channel-teacher-page__error"
				type="warning"
				:title="pageError"
				:closable="false"
				show-icon
			/>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="teacherName" label="班主任" min-width="140" />
				<el-table-column prop="schoolName" label="学校" min-width="180">
					<template #default="{ row }">
						{{ row.schoolName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="subject" label="学科" min-width="120">
					<template #default="{ row }">
						{{ row.subject || '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="projectTags"
					label="项目标签"
					min-width="170"
					show-overflow-tooltip
				>
					<template #default="{ row }">
						{{ stringifyTagList(row.projectTags) }}
					</template>
				</el-table-column>
				<el-table-column prop="phone" label="联系电话" min-width="150">
					<template #default="{ row }">
						{{ row.phone || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="wechat" label="微信" min-width="150">
					<template #default="{ row }">
						{{ row.wechat || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="ownerEmployeeName" label="负责人" min-width="130">
					<template #default="{ row }">
						{{ row.ownerEmployeeName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="nextFollowTime" label="下次跟进时间" min-width="170">
					<template #default="{ row }">
						{{ row.nextFollowTime || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="cooperationStatus" label="合作状态" width="120">
					<template #default="{ row }">
						<el-tag :type="teacherCooperationStatusTagType(row.cooperationStatus)">
							{{ teacherCooperationStatusLabel(row.cooperationStatus) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="classCount" label="班级数" width="90">
					<template #default="{ row }">
						{{ Number(row.classCount || 0) }}
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="320">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetailFromRow(row)"
							>详情</el-button
						>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canAssign(row)"
							text
							type="warning"
							@click="openAssign(row)"
						>
							分配
						</el-button>
						<el-button
							v-if="showFollowEntry(row)"
							text
							type="success"
							@click="openDetailFromRow(row, { focusFollow: true })"
						>
							跟进
						</el-button>
						<el-button
							v-if="canMark(row)"
							text
							type="success"
							@click="handleMarkCooperation(row)"
						>
							标记合作
						</el-button>
						<el-button
							v-if="canCreateClass(row)"
							text
							type="primary"
							@click="goCreateClass(row)"
						>
							新建班级
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<el-empty
				v-if="!tableLoading && rows.length === 0"
				description="当前筛选条件下暂无班主任资源"
			/>

			<div class="teacher-channel-teacher-page__pagination">
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

		<el-drawer v-model="detailVisible" title="班主任详情" size="920px" destroy-on-close>
			<div v-loading="detailLoading" class="teacher-channel-teacher-page__drawer">
				<el-alert
					v-if="detailTeacher"
					:title="detailAlertMessage"
					:type="isReadOnlyRole ? 'info' : 'warning'"
					:closable="false"
					show-icon
				/>

				<el-descriptions v-if="detailTeacher" :column="2" border>
					<el-descriptions-item label="班主任">
						{{ detailTeacher.teacherName }}
					</el-descriptions-item>
					<el-descriptions-item label="合作状态">
						<el-tag
							:type="teacherCooperationStatusTagType(detailTeacher.cooperationStatus)"
						>
							{{ teacherCooperationStatusLabel(detailTeacher.cooperationStatus) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="联系电话">
						{{ detailTeacher.phone || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="微信">
						{{ detailTeacher.wechat || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="学校">
						{{ detailTeacher.schoolName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="区域">
						{{ detailTeacher.schoolRegion || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="学校类型">
						{{ detailTeacher.schoolType || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="年级 / 班级">
						{{ detailTeacher.grade || '-' }} / {{ detailTeacher.className || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="学科">
						{{ detailTeacher.subject || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="负责人">
						{{ detailTeacher.ownerEmployeeName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="项目标签" :span="2">
						{{ stringifyTagList(detailTeacher.projectTags) }}
					</el-descriptions-item>
					<el-descriptions-item label="意向等级">
						{{ detailTeacher.intentionLevel || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="沟通风格">
						{{ detailTeacher.communicationStyle || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="上次跟进">
						{{ detailTeacher.lastFollowTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="下次跟进">
						{{ detailTeacher.nextFollowTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="合作时间">
						{{ detailTeacher.cooperationTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="班级数">
						{{ Number(detailTeacher.classCount || 0) }}
					</el-descriptions-item>
				</el-descriptions>

				<div v-if="detailTeacher" class="teacher-channel-teacher-page__detail-actions">
					<el-button
						v-if="canAdvanceNegotiating(detailTeacher)"
						type="warning"
						:loading="detailActionLoading === 'negotiating'"
						@click="handleUpdateStatus(detailTeacher, 'negotiating')"
					>
						推进为洽谈中
					</el-button>
					<el-button
						v-if="canMark(detailTeacher)"
						type="success"
						:loading="detailActionLoading === 'partnered'"
						@click="handleMarkCooperation(detailTeacher)"
					>
						标记合作
					</el-button>
					<el-button
						v-if="canTerminate(detailTeacher)"
						type="danger"
						:loading="detailActionLoading === 'terminated'"
						@click="handleUpdateStatus(detailTeacher, 'terminated')"
					>
						终止合作
					</el-button>
					<el-button
						v-if="canCreateClass(detailTeacher)"
						type="primary"
						@click="goCreateClass(detailTeacher)"
					>
						为该班主任建班
					</el-button>
				</div>

				<section class="teacher-channel-teacher-page__follow-section">
					<div class="teacher-channel-teacher-page__section-header">
						<div>
							<h3>跟进记录</h3>
							<p>首批只展示时间线和新增跟进，不扩展附件或截图原文。</p>
						</div>
						<el-tag effect="plain"> {{ followRows.length }} 条 </el-tag>
					</div>

					<el-alert
						v-if="followError"
						type="warning"
						:title="followError"
						:closable="false"
						show-icon
					/>

					<el-form
						v-if="showFollowAddButton && detailTeacher"
						ref="followFormRef"
						:model="followForm"
						:rules="followRules"
						label-width="110px"
						class="teacher-channel-teacher-page__follow-form"
					>
						<el-row :gutter="16">
							<el-col :span="16">
								<el-form-item label="跟进内容" prop="content">
									<el-input
										v-model="followForm.content"
										type="textarea"
										:rows="3"
										maxlength="500"
										show-word-limit
										placeholder="请输入跟进内容"
									/>
								</el-form-item>
							</el-col>
							<el-col :span="8">
								<el-form-item label="下次跟进时间">
									<el-date-picker
										v-model="followNextFollowTimeModel"
										type="datetime"
										value-format="YYYY-MM-DD HH:mm:ss"
										placeholder="可选"
										style="width: 100%"
									/>
								</el-form-item>
								<el-form-item label-width="0">
									<el-button
										type="primary"
										:loading="followSubmitLoading"
										@click="submitFollow"
									>
										新增跟进
									</el-button>
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>

					<el-table :data="followRows" border v-loading="followLoading">
						<el-table-column prop="createTime" label="时间" min-width="170">
							<template #default="{ row }">
								{{ row.createTime || '-' }}
							</template>
						</el-table-column>
						<el-table-column label="操作人" min-width="130">
							<template #default="{ row }">
								{{ resolveFollowOperator(row) }}
							</template>
						</el-table-column>
						<el-table-column label="跟进内容" min-width="300" show-overflow-tooltip>
							<template #default="{ row }">
								{{ resolveFollowContent(row) }}
							</template>
						</el-table-column>
						<el-table-column prop="nextFollowTime" label="下次跟进时间" min-width="170">
							<template #default="{ row }">
								{{ row.nextFollowTime || '-' }}
							</template>
						</el-table-column>
					</el-table>

					<el-empty
						v-if="!followLoading && followRows.length === 0"
						description="当前班主任暂无跟进记录"
					/>
				</section>
			</div>
		</el-drawer>

		<el-dialog
			v-model="formVisible"
			:title="editingTeacher?.id ? '编辑班主任资源' : '新增班主任资源'"
			width="860px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="
						editingTeacher?.id
							? '编辑仅维护基础资料，不在此处直接修改合作终态。'
							: '新增资源默认保存为 uncontacted。'
					"
					:type="editingTeacher?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="班主任姓名" prop="teacherName">
							<el-input v-model="form.teacherName" maxlength="100" show-word-limit />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="学校名称" prop="schoolName">
							<el-input v-model="form.schoolName" maxlength="100" show-word-limit />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="联系电话">
							<el-input v-model="form.phone" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信">
							<el-input v-model="form.wechat" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="区域">
							<el-input v-model="form.schoolRegion" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="学校类型">
							<el-input v-model="form.schoolType" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="年级">
							<el-input v-model="form.grade" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="班级名称">
							<el-input v-model="form.className" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="学科">
							<el-input v-model="form.subject" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="下次跟进时间">
							<el-date-picker
								v-model="formNextFollowTimeModel"
								type="datetime"
								value-format="YYYY-MM-DD HH:mm:ss"
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="意向等级">
							<el-input v-model="form.intentionLevel" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="沟通风格">
							<el-input v-model="form.communicationStyle" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="项目标签">
							<el-input
								v-model="projectTagsText"
								type="textarea"
								:rows="2"
								placeholder="多个标签用逗号分隔"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="assignVisible" title="分配负责人" width="520px" destroy-on-close>
			<el-form
				ref="assignFormRef"
				:model="assignForm"
				:rules="assignRules"
				label-width="90px"
			>
				<el-form-item label="负责人" prop="ownerEmployeeId">
					<el-select
						v-model="assignOwnerModel"
						filterable
						style="width: 100%"
						placeholder="请选择负责人"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="assignVisible = false">取消</el-button>
				<el-button type="primary" :loading="assignLoading" @click="submitAssign">
					确认分配
				</el-button>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-teacher-channel-teacher-list'
});

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import { performanceTeacherInfoService } from '../../service/teacherInfo';
import { performanceTeacherFollowService } from '../../service/teacherFollow';
import { performanceTeacherCooperationService } from '../../service/teacherCooperation';
import { performanceTeacherClassService } from '../../service/teacherClass';
import type {
	TeacherCooperationStatus,
	TeacherFollowRecord,
	TeacherInfoRecord,
	UserOption
} from '../../types';
import { createEmptyTeacherFollow, createEmptyTeacherInfo } from '../../types';
import {
	canCreateTeacherClass,
	canMarkTeacherCooperation,
	getTeacherInfoId,
	hasTeacherWritePermission,
	normalizeOptionalText,
	normalizeStringArray,
	resolveFollowContent,
	resolveFollowOperator,
	stringifyTagList,
	teacherCooperationStatusLabel,
	teacherCooperationStatusOptions,
	teacherCooperationStatusTagType
} from '../../utils/teacher-channel.js';

interface DepartmentOption {
	id: number;
	label: string;
}

const route = useRoute();
const router = useRouter();

const rows = ref<TeacherInfoRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const followRows = ref<TeacherFollowRecord[]>([]);
const tableLoading = ref(false);
const detailLoading = ref(false);
const followLoading = ref(false);
const submitLoading = ref(false);
const followSubmitLoading = ref(false);
const assignLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const assignVisible = ref(false);
const pageError = ref('');
const followError = ref('');
const detailActionLoading = ref<'' | 'negotiating' | 'partnered' | 'terminated'>('');
const formRef = ref<FormInstance>();
const followFormRef = ref<FormInstance>();
const assignFormRef = ref<FormInstance>();
const editingTeacher = ref<TeacherInfoRecord | null>(null);
const detailTeacher = ref<TeacherInfoRecord | null>(null);
const assigningTeacherId = ref<number | null>(null);

const filters = reactive({
	keyword: '',
	cooperationStatus: '' as TeacherCooperationStatus | '',
	ownerDepartmentId: undefined as number | undefined
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<TeacherInfoRecord>(createEmptyTeacherInfo());
const followForm = reactive<TeacherFollowRecord>(createEmptyTeacherFollow());
const assignForm = reactive({
	ownerEmployeeId: undefined as number | undefined
});

const rules: FormRules = {
	teacherName: [
		{ required: true, message: '请输入班主任姓名', trigger: 'blur' },
		{ min: 1, max: 100, message: '班主任姓名长度需在 1-100 之间', trigger: 'blur' }
	],
	schoolName: [
		{ required: true, message: '请输入学校名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '学校名称长度需在 1-100 之间', trigger: 'blur' }
	]
};

const followRules: FormRules = {
	content: [
		{ required: true, message: '请输入跟进内容', trigger: 'blur' },
		{ min: 1, max: 500, message: '跟进内容长度需在 1-500 之间', trigger: 'blur' }
	]
};

const assignRules: FormRules = {
	ownerEmployeeId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
};

const canAccess = computed(() => checkPerm(performanceTeacherInfoService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceTeacherInfoService.permission.info));
const showAddButton = computed(() => checkPerm(performanceTeacherInfoService.permission.add));
const showUpdateButton = computed(() => checkPerm(performanceTeacherInfoService.permission.update));
const showAssignButton = computed(() => checkPerm(performanceTeacherInfoService.permission.assign));
const showUpdateStatusButton = computed(() =>
	checkPerm(performanceTeacherInfoService.permission.updateStatus)
);
const showFollowPageButton = computed(() =>
	checkPerm(performanceTeacherFollowService.permission.page)
);
const showFollowAddButton = computed(() =>
	checkPerm(performanceTeacherFollowService.permission.add)
);
const showCooperationMarkButton = computed(() =>
	checkPerm(performanceTeacherCooperationService.permission.mark)
);
const showClassAddButton = computed(() => checkPerm(performanceTeacherClassService.permission.add));
const isReadOnlyRole = computed(
	() =>
		!hasTeacherWritePermission({
			teacherAdd: showAddButton.value,
			teacherUpdate: showUpdateButton.value,
			teacherAssign: showAssignButton.value,
			teacherUpdateStatus: showUpdateStatusButton.value,
			followAdd: showFollowAddButton.value,
			cooperationMark: showCooperationMarkButton.value,
			classAdd: showClassAddButton.value,
			classUpdate: checkPerm(performanceTeacherClassService.permission.update),
			classDelete: checkPerm(performanceTeacherClassService.permission.delete)
		})
);

const filterDepartmentIdModel = computed<number | undefined>({
	get: () => filters.ownerDepartmentId ?? undefined,
	set: value => {
		filters.ownerDepartmentId = value;
	}
});

const assignOwnerModel = computed<number | undefined>({
	get: () => assignForm.ownerEmployeeId ?? undefined,
	set: value => {
		assignForm.ownerEmployeeId = value;
	}
});

const projectTagsText = computed({
	get: () => normalizeStringArray(form.projectTags).join(', '),
	set: value => {
		form.projectTags = normalizeStringArray(value);
	}
});
const formNextFollowTimeModel = computed<string | undefined>({
	get: () => String(form.nextFollowTime || '') || undefined,
	set: value => {
		form.nextFollowTime = value ?? undefined;
	}
});
const followNextFollowTimeModel = computed<string | undefined>({
	get: () => String(followForm.nextFollowTime || '') || undefined,
	set: value => {
		followForm.nextFollowTime = value ?? undefined;
	}
});

const cooperationStatusOptions = teacherCooperationStatusOptions;

const detailAlertMessage = computed(() => {
	if (isReadOnlyRole.value) {
		return '当前账号无主题19写权限，详情、联系方式和跟进时间线仅作只读展示。';
	}

	if (detailTeacher.value?.cooperationStatus === 'terminated') {
		return '当前班主任已终止合作，不允许继续新建班级。';
	}

	return '未至少跟进一次前不可标记合作；首次跟进后由后端推进为 contacted。';
});

onMounted(async () => {
	await loadUsers();
	await loadDepartments();
	await refresh();
	await consumeTeacherRoutePreset();
});

watch(
	() => route.query,
	async () => {
		await consumeTeacherRoutePreset();
	},
	{ deep: true }
);

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 200
			}),
		(error: any) => {
			ElMessage.warning(error.message || '负责人选项加载失败');
		}
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		(error: any) => {
			ElMessage.warning(error.message || '部门选项加载失败');
		}
	);
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;
	pageError.value = '';

	try {
		const result = await performanceTeacherInfoService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			cooperationStatus: filters.cooperationStatus || undefined,
			ownerDepartmentId: filters.ownerDepartmentId || undefined
		});

		rows.value = (result.list || []).map(normalizeTeacherRecord);
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		pageError.value = error.message || '班主任资源列表加载失败';
		ElMessage.error(pageError.value);
	} finally {
		tableLoading.value = false;
	}
}

function handleSearch() {
	pagination.page = 1;
	refresh();
}

function handleReset() {
	filters.keyword = '';
	filters.cooperationStatus = '';
	filters.ownerDepartmentId = undefined;
	pagination.page = 1;
	refresh();
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	editingTeacher.value = null;
	Object.assign(form, createEmptyTeacherInfo());
	formVisible.value = true;
	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

async function openEdit(row: TeacherInfoRecord) {
	if (!canEdit(row)) {
		return;
	}

	const id = getTeacherInfoId(row);

	if (!id) {
		return;
	}

	try {
		const detail = normalizeTeacherRecord(
			await performanceTeacherInfoService.fetchInfo({ id })
		);
		editingTeacher.value = detail;
		Object.assign(form, createEmptyTeacherInfo(), detail);
		formVisible.value = true;
		nextTick(() => {
			formRef.value?.clearValidate();
		});
	} catch (error: any) {
		ElMessage.error(error.message || '班主任详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	submitLoading.value = true;

	try {
		const payload: Partial<TeacherInfoRecord> = {
			id: editingTeacher.value?.id,
			teacherName: form.teacherName.trim(),
			schoolName: normalizeOptionalText(form.schoolName),
			phone: normalizeOptionalText(form.phone as string | undefined),
			wechat: normalizeOptionalText(form.wechat as string | undefined),
			schoolRegion: normalizeOptionalText(form.schoolRegion as string | undefined),
			schoolType: normalizeOptionalText(form.schoolType as string | undefined),
			grade: normalizeOptionalText(form.grade as string | undefined),
			className: normalizeOptionalText(form.className as string | undefined),
			subject: normalizeOptionalText(form.subject as string | undefined),
			projectTags: normalizeStringArray(form.projectTags),
			intentionLevel: normalizeOptionalText(form.intentionLevel as string | undefined),
			communicationStyle: normalizeOptionalText(
				form.communicationStyle as string | undefined
			),
			nextFollowTime: normalizeOptionalText(form.nextFollowTime as string | undefined)
		};

		if (editingTeacher.value?.id) {
			await performanceTeacherInfoService.updateTeacherInfo(
				payload as Partial<TeacherInfoRecord> & { id: number }
			);
		} else {
			await performanceTeacherInfoService.createTeacherInfo(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '班主任资源保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function openDetailFromRow(
	row: TeacherInfoRecord,
	options: {
		focusFollow?: boolean;
	} = {}
) {
	const id = getTeacherInfoId(row);

	if (!id) {
		return;
	}

	await openDetailById(id, options);
}

async function openDetailById(
	id: number,
	options: {
		focusFollow?: boolean;
	} = {}
) {
	detailVisible.value = true;
	detailLoading.value = true;
	followError.value = '';

	try {
		const [detail, followResult] = await Promise.all([
			performanceTeacherInfoService.fetchInfo({ id }),
			loadFollowList(id)
		]);

		detailTeacher.value = normalizeTeacherRecord(detail);
		followRows.value = followResult;

		if (options.focusFollow && showFollowAddButton.value) {
			Object.assign(followForm, createEmptyTeacherFollow(), {
				teacherId: id
			});
			nextTick(() => {
				followFormRef.value?.clearValidate();
			});
		}
	} catch (error: any) {
		ElMessage.error(error.message || '班主任详情加载失败');
	} finally {
		detailLoading.value = false;
	}
}

async function loadFollowList(teacherId: number) {
	if (!showFollowPageButton.value) {
		return [];
	}

	followLoading.value = true;
	followError.value = '';

	try {
		const result = await performanceTeacherFollowService.fetchPage({
			page: 1,
			size: 20,
			teacherId
		});

		return result.list || [];
	} catch (error: any) {
		followError.value = error.message || '跟进记录加载失败';
		return [];
	} finally {
		followLoading.value = false;
	}
}

async function submitFollow() {
	if (!detailTeacher.value?.id) {
		return;
	}

	await followFormRef.value?.validate();
	followSubmitLoading.value = true;

	try {
		await performanceTeacherFollowService.createTeacherFollow({
			teacherId: detailTeacher.value.id,
			followContent: normalizeOptionalText(followForm.content),
			nextFollowTime: normalizeOptionalText(followForm.nextFollowTime as string | undefined)
		});
		ElMessage.success('跟进已新增');
		Object.assign(followForm, createEmptyTeacherFollow(), {
			teacherId: detailTeacher.value.id
		});
		await openDetailById(detailTeacher.value.id, {
			focusFollow: true
		});
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '跟进新增失败');
	} finally {
		followSubmitLoading.value = false;
	}
}

function openAssign(row: TeacherInfoRecord) {
	if (!canAssign(row)) {
		return;
	}

	assigningTeacherId.value = getTeacherInfoId(row) || null;
	assignForm.ownerEmployeeId = Number(row.ownerEmployeeId || 0) || undefined;
	assignVisible.value = true;
	nextTick(() => {
		assignFormRef.value?.clearValidate();
	});
}

async function submitAssign() {
	if (!assigningTeacherId.value) {
		return;
	}

	await assignFormRef.value?.validate();
	assignLoading.value = true;

	try {
		await performanceTeacherInfoService.assign({
			id: assigningTeacherId.value,
			ownerEmployeeId: Number(assignForm.ownerEmployeeId)
		});
		ElMessage.success('负责人分配成功');
		assignVisible.value = false;
		await refresh();
		if (detailTeacher.value?.id === assigningTeacherId.value) {
			await openDetailById(assigningTeacherId.value);
		}
	} catch (error: any) {
		ElMessage.error(error.message || '负责人分配失败');
	} finally {
		assignLoading.value = false;
	}
}

async function handleMarkCooperation(row: TeacherInfoRecord) {
	const id = getTeacherInfoId(row);

	if (!id || !canMark(row)) {
		ElMessage.warning('当前资源未满足合作标记条件');
		return;
	}

	try {
		await ElMessageBox.confirm(
			`确认将班主任「${row.teacherName}」标记为已合作吗？`,
			'合作确认',
			{
				type: 'warning'
			}
		);
	} catch {
		return;
	}

	detailActionLoading.value = 'partnered';

	try {
		await performanceTeacherCooperationService.mark({ id });
		ElMessage.success('已标记为合作');
		await refresh();
		if (detailTeacher.value?.id === id) {
			await openDetailById(id);
		}
	} catch (error: any) {
		ElMessage.error(error.message || '合作标记失败');
	} finally {
		detailActionLoading.value = '';
	}
}

async function handleUpdateStatus(
	row: TeacherInfoRecord,
	cooperationStatus: TeacherCooperationStatus
) {
	const id = getTeacherInfoId(row);

	if (!id) {
		return;
	}

	const actionLabel =
		cooperationStatus === 'negotiating'
			? '推进为洽谈中'
			: teacherCooperationStatusLabel(cooperationStatus);

	try {
		await ElMessageBox.confirm(
			`确认将班主任「${row.teacherName}」${actionLabel}吗？`,
			'状态确认',
			{
				type: 'warning'
			}
		);
	} catch {
		return;
	}

	detailActionLoading.value = cooperationStatus === 'negotiating' ? 'negotiating' : 'terminated';

	try {
		await performanceTeacherInfoService.updateStatus({
			id,
			status: cooperationStatus
		});
		ElMessage.success('状态更新成功');
		await refresh();
		if (detailTeacher.value?.id === id) {
			await openDetailById(id);
		}
	} catch (error: any) {
		ElMessage.error(error.message || '状态更新失败');
	} finally {
		detailActionLoading.value = '';
	}
}

function canEdit(row: TeacherInfoRecord) {
	return showUpdateButton.value && row.cooperationStatus !== 'terminated';
}

function canAssign(_row: TeacherInfoRecord) {
	return showAssignButton.value;
}

function showFollowEntry(_row: TeacherInfoRecord) {
	return showFollowPageButton.value;
}

function canMark(row: TeacherInfoRecord) {
	return canMarkTeacherCooperation(row, showCooperationMarkButton.value);
}

function canCreateClass(row: TeacherInfoRecord) {
	return canCreateTeacherClass(row, showClassAddButton.value);
}

function canAdvanceNegotiating(row: TeacherInfoRecord) {
	return showUpdateStatusButton.value && row.cooperationStatus === 'contacted';
}

function canTerminate(row: TeacherInfoRecord) {
	return (
		showUpdateStatusButton.value &&
		showAssignButton.value &&
		row.cooperationStatus === 'partnered'
	);
}

function goCreateClass(row: TeacherInfoRecord) {
	const teacherId = getTeacherInfoId(row);

	if (!teacherId) {
		return;
	}

	router.push({
		path: '/performance/teacher-channel/class',
		query: {
			openCreate: '1',
			teacherId: String(teacherId)
		}
	});
}

async function consumeTeacherRoutePreset() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['teacherId', 'openDetail', 'openFollow'],
		parse: query => ({
			teacherId: normalizeQueryNumber(query.teacherId),
			openDetail: firstQueryValue(query.openDetail) === '1',
			openFollow: firstQueryValue(query.openFollow) === '1'
		}),
		shouldConsume: payload =>
			Boolean(payload.teacherId && (payload.openDetail || payload.openFollow)),
		consume: async payload => {
			await openDetailById(payload.teacherId as number, {
				focusFollow: payload.openFollow
			});
		}
	});
}

function normalizeTeacherRecord(record: TeacherInfoRecord) {
	return {
		...record,
		projectTags: normalizeStringArray(record.projectTags)
	};
}
</script>

<style lang="scss" scoped>
.teacher-channel-teacher-page {
	display: grid;
	gap: 16px;

	&__toolbar,
	&__toolbar-left,
	&__toolbar-right,
	&__header-main,
	&__section-header,
	&__detail-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	&__toolbar,
	&__section-header,
	&__header-main {
		justify-content: space-between;
	}

	&__header,
	&__drawer,
	&__follow-section {
		display: grid;
		gap: 16px;
	}

	h2,
	h3 {
		margin: 0;
	}

	p {
		margin: 4px 0 0;
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}

	&__error {
		margin-bottom: 16px;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}

	&__follow-form {
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 12px;
		padding: 16px;
		background: var(--el-fill-color-lighter);
	}
}
</style>
