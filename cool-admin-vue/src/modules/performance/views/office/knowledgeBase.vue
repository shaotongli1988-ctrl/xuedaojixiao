<!-- 文件职责：承接主题21知识库的条目列表、统计、图谱、搜索和百问百答元数据主链；不负责正文富文本编辑器、AI 问答、向量检索或员工自助知识门户；依赖 knowledgeBase/documentCenter service 与共享权限工具；维护重点是页面只展示冻结允许的元数据字段和关系摘要，不暴露正文全文与模型配置。 -->
<template>
	<div v-if="canAccess" class="knowledge-base-page">
		<el-card shadow="never">
			<div class="knowledge-base-page__toolbar">
				<div class="knowledge-base-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="知识标题 / 知识编号"
						clearable
						style="width: 240px"
						@keyup.enter="applyListFilters"
					/>
					<el-input
						v-model="filters.category"
						placeholder="分类"
						clearable
						style="width: 180px"
						@keyup.enter="applyListFilters"
					/>
					<el-input
						v-model="filters.tag"
						placeholder="标签"
						clearable
						style="width: 180px"
						@keyup.enter="applyListFilters"
					/>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="knowledge-base-page__toolbar-right">
					<el-button @click="applyListFilters">查询</el-button>
					<el-button @click="resetListFilters">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增知识条目
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row v-if="showStatsSection" :gutter="16">
			<el-col v-for="card in metricCards" :key="card.label" :xs="24" :sm="12" :lg="8">
				<el-card shadow="never">
					<div class="knowledge-base-page__metric-label">{{ card.label }}</div>
					<div class="knowledge-base-page__metric-value">{{ card.value }}</div>
					<div class="knowledge-base-page__metric-helper">{{ card.helper }}</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="knowledge-base-page__header">
					<div class="knowledge-base-page__header-main">
						<h2>知识库</h2>
						<el-tag effect="plain">主题 21</el-tag>
						<el-tag effect="plain" type="info">{{ roleFact.roleLabel }}</el-tag>
					</div>
					<el-alert
						title="首批只承接知识条目元数据、关联文件、图谱、搜索和百问百答元数据，不展示正文全文、AI 答案、向量索引或模型配置。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-tabs v-model="activeTab" class="knowledge-base-page__tabs">
				<el-tab-pane label="知识条目" name="knowledge">
					<el-table :data="rows" border v-loading="tableLoading">
						<el-table-column prop="kbNo" label="知识编号" min-width="140" />
						<el-table-column prop="title" label="标题" min-width="220" />
						<el-table-column prop="category" label="分类" min-width="140">
							<template #default="{ row }">
								{{ row.category || '-' }}
							</template>
						</el-table-column>
						<el-table-column label="标签" min-width="180">
							<template #default="{ row }">
								<div class="knowledge-base-page__tag-list">
									<el-tag
										v-for="tag in row.tags || []"
										:key="tag"
										size="small"
										effect="plain"
									>
										{{ tag }}
									</el-tag>
									<span v-if="!row.tags?.length">-</span>
								</div>
							</template>
						</el-table-column>
						<el-table-column label="关联文件" width="110">
							<template #default="{ row }">
								{{ relatedFileCount(row) }}
							</template>
						</el-table-column>
						<el-table-column label="关联主题" min-width="160">
							<template #default="{ row }">
								{{ formatTopics(row.relatedTopics) }}
							</template>
						</el-table-column>
						<el-table-column prop="ownerName" label="负责人" min-width="120" />
						<el-table-column label="状态" width="110">
							<template #default="{ row }">
								<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="importance" label="重要度" width="100">
							<template #default="{ row }">
								{{ row.importance ?? 0 }}
							</template>
						</el-table-column>
						<el-table-column prop="viewCount" label="浏览量" width="100">
							<template #default="{ row }">
								{{ row.viewCount ?? 0 }}
							</template>
						</el-table-column>
						<el-table-column prop="updateTime" label="更新时间" min-width="170">
							<template #default="{ row }">
								{{ row.updateTime || '-' }}
							</template>
						</el-table-column>
						<el-table-column label="操作" fixed="right" min-width="180">
							<template #default="{ row }">
								<el-button
									v-if="canEdit(row)"
									text
									type="primary"
									@click="openEdit(row)"
								>
									编辑
								</el-button>
								<el-button
									v-if="canDelete(row)"
									text
									type="danger"
									@click="handleDelete(row)"
								>
									删除
								</el-button>
							</template>
						</el-table-column>
					</el-table>

					<div class="knowledge-base-page__pagination">
						<el-pagination
							background
							layout="total, prev, pager, next"
							:current-page="pager.page"
							:page-size="pager.size"
							:total="pager.total"
							@current-change="changeListPage"
						/>
					</div>
				</el-tab-pane>

				<el-tab-pane v-if="showGraphTab" label="知识图谱" name="graph">
					<div class="knowledge-base-page__graph">
						<el-card shadow="never" v-loading="graphLoading">
							<template #header>
								<div class="knowledge-base-page__panel-header">
									<div>
										<h3>图谱摘要</h3>
										<p>只展示知识条目、分类、标签和关联文件的元数据关系。</p>
									</div>
									<el-button @click="refreshGraph">刷新图谱</el-button>
								</div>
							</template>

							<div class="knowledge-base-page__graph-metrics">
								<el-card v-for="card in graphMetricCards" :key="card.label" shadow="hover">
									<div class="knowledge-base-page__metric-label">{{ card.label }}</div>
									<div class="knowledge-base-page__metric-value">{{ card.value }}</div>
								</el-card>
							</div>

							<el-row :gutter="16">
								<el-col :xs="24" :lg="12">
									<el-card shadow="never">
										<template #header>分类节点</template>
										<div class="knowledge-base-page__tag-list">
											<el-tag
												v-for="item in graphGroups.categories"
												:key="item"
												effect="plain"
											>
												{{ item }}
											</el-tag>
											<span v-if="!graphGroups.categories.length">暂无分类节点</span>
										</div>
									</el-card>
								</el-col>
								<el-col :xs="24" :lg="12">
									<el-card shadow="never">
										<template #header>标签节点</template>
										<div class="knowledge-base-page__tag-list">
											<el-tag
												v-for="item in graphGroups.tags"
												:key="item"
												type="success"
												effect="plain"
											>
												{{ item }}
											</el-tag>
											<span v-if="!graphGroups.tags.length">暂无标签节点</span>
										</div>
									</el-card>
								</el-col>
							</el-row>

							<el-card shadow="never">
								<template #header>关系摘要</template>
								<el-table :data="graphRelationPreview" border>
									<el-table-column prop="name" label="节点" min-width="220" />
									<el-table-column prop="category" label="类型" min-width="140" />
									<el-table-column prop="relationCount" label="关联数" min-width="100" />
								</el-table>
							</el-card>
						</el-card>
					</div>
				</el-tab-pane>

				<el-tab-pane v-if="showSearchOrQaTab" label="搜索与百问百答" name="search">
					<div class="knowledge-base-page__panel-grid">
						<el-card v-if="showSearchPanel" shadow="never" v-loading="searchLoading">
							<template #header>
								<div class="knowledge-base-page__panel-header">
									<div>
										<h3>知识搜索</h3>
										<p>只聚合知识条目、关联文件摘要和百问百答元数据，不生成 AI 答案。</p>
									</div>
									<div class="knowledge-base-page__inline-actions">
										<el-input
											v-model="searchKeyword"
											placeholder="输入关键字"
											clearable
											style="width: 220px"
											@keyup.enter="runSearch"
										/>
										<el-button type="primary" @click="runSearch">搜索</el-button>
									</div>
								</div>
							</template>

							<div class="knowledge-base-page__search-summary">
								<el-tag effect="plain">总命中 {{ searchResult.total }}</el-tag>
								<el-tag effect="plain" type="success">
									知识 {{ searchResult.knowledge.length }}
								</el-tag>
								<el-tag effect="plain" type="warning">
									文件 {{ searchResult.files.length }}
								</el-tag>
								<el-tag effect="plain" type="info">问答 {{ searchResult.qas.length }}</el-tag>
							</div>

							<el-row :gutter="16">
								<el-col :xs="24" :xl="8">
									<el-card shadow="never">
										<template #header>知识条目命中</template>
										<el-table :data="searchResult.knowledge" border>
											<el-table-column prop="title" label="标题" min-width="160" />
											<el-table-column prop="category" label="分类" min-width="120" />
											<el-table-column prop="status" label="状态" min-width="100">
												<template #default="{ row }">
													<el-tag :type="statusTagType(row.status)">
														{{ statusLabel(row.status) }}
													</el-tag>
												</template>
											</el-table-column>
										</el-table>
									</el-card>
								</el-col>
								<el-col :xs="24" :xl="8">
									<el-card shadow="never">
										<template #header>关联文件命中</template>
										<el-table :data="searchResult.files" border>
											<el-table-column prop="fileName" label="文件名称" min-width="160" />
											<el-table-column prop="fileNo" label="文件编号" min-width="120" />
											<el-table-column prop="status" label="状态" min-width="100">
												<template #default="{ row }">
													<el-tag :type="fileStatusTagType(row.status)">
														{{ fileStatusLabel(row.status) }}
													</el-tag>
												</template>
											</el-table-column>
										</el-table>
									</el-card>
								</el-col>
								<el-col :xs="24" :xl="8">
									<el-card shadow="never">
										<template #header>问答命中</template>
										<el-table :data="searchResult.qas" border>
											<el-table-column prop="question" label="问题" min-width="160" />
											<el-table-column prop="updateTime" label="更新时间" min-width="140">
												<template #default="{ row }">
													{{ row.updateTime || row.createTime || '-' }}
												</template>
											</el-table-column>
										</el-table>
									</el-card>
								</el-col>
							</el-row>
						</el-card>

						<el-card v-if="showQaPanel" shadow="never" v-loading="qaLoading">
							<template #header>
								<div class="knowledge-base-page__panel-header">
									<div>
										<h3>百问百答元数据</h3>
										<p>只维护问题、答案和关联关系元数据，不接入模型推理。</p>
									</div>
									<div class="knowledge-base-page__inline-actions">
										<el-input
											v-model="qaKeyword"
											placeholder="问题关键字"
											clearable
											style="width: 220px"
											@keyup.enter="refreshQaList"
										/>
										<el-button @click="refreshQaList">查询</el-button>
										<el-button v-if="showQaAddButton" type="primary" @click="openQaCreate">
											新增问答
										</el-button>
									</div>
								</div>
							</template>

							<el-table :data="qaRows" border>
								<el-table-column prop="question" label="问题" min-width="220" />
								<el-table-column prop="answer" label="答案摘要" min-width="260">
									<template #default="{ row }">
										{{ truncateText(row.answer, 80) }}
									</template>
								</el-table-column>
								<el-table-column label="关联知识" width="100">
									<template #default="{ row }">
										{{ row.relatedKnowledgeIds?.length || 0 }}
									</template>
								</el-table-column>
								<el-table-column label="关联文件" width="100">
									<template #default="{ row }">
										{{ row.relatedFileIds?.length || 0 }}
									</template>
								</el-table-column>
								<el-table-column prop="updateTime" label="更新时间" min-width="160">
									<template #default="{ row }">
										{{ row.updateTime || row.createTime || '-' }}
									</template>
								</el-table-column>
							</el-table>
						</el-card>
					</div>
				</el-tab-pane>
			</el-tabs>
		</el-card>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑知识条目' : '新增知识条目'"
			width="820px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingRecord?.id ? '编辑只维护条目元数据和关系；已归档条目不允许继续编辑。' : '新建条目默认保存为 draft，后续在编辑时可发布或归档。'"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="知识编号" prop="kbNo">
							<el-input v-model="form.kbNo" placeholder="例如 KB-2026-001" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="标题" prop="title">
							<el-input v-model="form.title" placeholder="请输入标题" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="分类" prop="category">
							<el-input v-model="form.category" placeholder="例如 流程制度" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="负责人" prop="ownerName">
							<el-input v-model="form.ownerName" placeholder="请输入负责人姓名" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" style="width: 100%" :disabled="!editingRecord?.id">
								<el-option
									v-for="item in formStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="重要度">
							<el-input-number v-model="form.importance" :min="0" :max="100" style="width: 100%" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-form-item label="摘要" prop="summary">
					<el-input
						v-model="form.summary"
						type="textarea"
						:rows="4"
						maxlength="500"
						show-word-limit
						placeholder="只填写摘要，不粘贴正文全文"
					/>
				</el-form-item>
				<el-form-item label="标签">
					<el-input
						v-model="form.tagsText"
						placeholder="多个标签用中文逗号、英文逗号或空格分隔"
					/>
				</el-form-item>
				<el-form-item label="关联主题">
					<el-input
						v-model="form.relatedTopicsText"
						placeholder="多个主题用中文逗号、英文逗号或空格分隔"
					/>
				</el-form-item>
				<el-form-item label="关联文件">
					<el-select
						v-model="form.relatedFileIds"
						multiple
						filterable
						clearable
						style="width: 100%"
						placeholder="选择文件元数据"
					>
						<el-option
							v-for="item in relatedFileOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<el-dialog
			v-model="qaDialogVisible"
			title="新增百问百答元数据"
			width="760px"
			destroy-on-close
		>
			<el-form ref="qaFormRef" :model="qaForm" :rules="qaRules" label-width="110px">
				<el-alert
					title="百问百答首批只维护问答元数据和关联关系，不接入 AI 回答、模型参数或外部知识源。"
					type="info"
					:closable="false"
					show-icon
				/>
				<el-form-item label="问题" prop="question">
					<el-input
						v-model="qaForm.question"
						maxlength="200"
						show-word-limit
						placeholder="请输入问题"
					/>
				</el-form-item>
				<el-form-item label="答案" prop="answer">
					<el-input
						v-model="qaForm.answer"
						type="textarea"
						:rows="5"
						maxlength="1000"
						show-word-limit
						placeholder="请输入答案摘要"
					/>
				</el-form-item>
				<el-form-item label="关联知识">
					<el-select
						v-model="qaForm.relatedKnowledgeIds"
						multiple
						filterable
						clearable
						style="width: 100%"
						placeholder="选择知识条目"
					>
						<el-option
							v-for="item in knowledgeOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="关联文件">
					<el-select
						v-model="qaForm.relatedFileIds"
						multiple
						filterable
						clearable
						style="width: 100%"
						placeholder="选择文件元数据"
					>
						<el-option
							v-for="item in relatedFileOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="qaDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="qaSubmitting" @click="submitQaForm">
					保存
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
	name: 'performance-office-knowledge-base'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceAccessContextService } from '../../service/access-context';
import { performanceDocumentCenterService } from '../../service/documentCenter';
import { performanceKnowledgeBaseService } from '../../service/knowledgeBase';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import {
	confirmElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import {
	type DocumentCenterRecord,
	type DocumentCenterStatus,
	type KnowledgeBaseFormModel,
	type KnowledgeBaseRecord,
	type KnowledgeBaseStats,
	type KnowledgeBaseStatus,
	type KnowledgeGraphNode,
	type KnowledgeGraphSummary,
	type KnowledgeQaFormModel,
	type KnowledgeQaRecord,
	type KnowledgeSearchResult,
	type PerformanceAccessContext,
	createEmptyKnowledgeBaseForm,
	createEmptyKnowledgeBaseStats,
	createEmptyKnowledgeQaForm,
	createEmptyKnowledgeSearchResult
} from '../../types';

type ElementTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined;

const KNOWLEDGE_BASE_STATUS_DICT_KEY = 'performance.knowledgeBase.status';
const DOCUMENT_CENTER_STATUS_DICT_KEY = 'performance.documentCenter.status';

const activeTab = ref('knowledge');
const formVisible = ref(false);
const submitLoading = ref(false);
const editingRecord = ref<KnowledgeBaseRecord | null>(null);
const formRef = ref<FormInstance>();

const qaDialogVisible = ref(false);
const qaSubmitting = ref(false);
const qaFormRef = ref<FormInstance>();

const stats = ref<KnowledgeBaseStats>(createEmptyKnowledgeBaseStats());
const graphLoading = ref(false);
const graphSummary = ref<KnowledgeGraphSummary>({ nodes: [], links: [], categories: [] });
const searchLoading = ref(false);
const searchKeyword = ref('');
const searchResult = ref<KnowledgeSearchResult>(createEmptyKnowledgeSearchResult());
const qaLoading = ref(false);
const qaKeyword = ref('');
const qaRows = ref<KnowledgeQaRecord[]>([]);
const relatedFileOptions = ref<Array<{ id: number; label: string }>>([]);
const accessContext = ref<PerformanceAccessContext | null>(null);
const { dict } = useDict();
const statusOptions = computed<Array<{ label: string; value: KnowledgeBaseStatus }>>(() =>
	dict.get(KNOWLEDGE_BASE_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as KnowledgeBaseStatus
	}))
);

const rules = {
	kbNo: [{ required: true, message: '请输入知识编号', trigger: 'blur' }],
	title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
	category: [{ required: true, message: '请输入分类', trigger: 'blur' }],
	summary: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
	ownerName: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const qaRules = {
	question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
	answer: [{ required: true, message: '请输入答案', trigger: 'blur' }]
};

const form = reactive<KnowledgeBaseFormModel>(createEmptyKnowledgeBaseForm());
const qaForm = reactive<KnowledgeQaFormModel>(createEmptyKnowledgeQaForm());

const canAccess = computed(() => checkPerm(performanceKnowledgeBaseService.permission.page));
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const showStatsSection = computed(() => checkPerm(performanceKnowledgeBaseService.permission.stats));
const showAddButton = computed(() => checkPerm(performanceKnowledgeBaseService.permission.add));
const showEditButton = computed(() => checkPerm(performanceKnowledgeBaseService.permission.update));
const showDeleteButton = computed(() => checkPerm(performanceKnowledgeBaseService.permission.delete));
const showGraphTab = computed(() => checkPerm(performanceKnowledgeBaseService.permission.graph));
const showSearchPanel = computed(() => checkPerm(performanceKnowledgeBaseService.permission.search));
const showQaPanel = computed(() => checkPerm(performanceKnowledgeBaseService.permission.qaList));
const showQaAddButton = computed(() => checkPerm(performanceKnowledgeBaseService.permission.qaAdd));
const showSearchOrQaTab = computed(() => showSearchPanel.value || showQaPanel.value);

const knowledgeList = useListPage({
	createFilters: () => ({
		keyword: '',
		category: '',
		tag: '',
		status: '' as KnowledgeBaseStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: params =>
		performanceKnowledgeBaseService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: normalizeOptionalText(params.keyword),
			category: normalizeOptionalText(params.category),
			tag: normalizeOptionalText(params.tag),
			status: params.status || undefined
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '知识条目加载失败');
	}
});

const rows = knowledgeList.rows;
const tableLoading = knowledgeList.loading;
const filters = knowledgeList.filters;
const pager = knowledgeList.pager;

const metricCards = computed(() => [
	{ label: '知识条目', value: stats.value.total || 0, helper: '当前筛选范围内的知识资产数量' },
	{ label: '已发布', value: stats.value.publishedCount || 0, helper: '可作为正式知识资料使用' },
	{ label: '草稿', value: stats.value.draftCount || 0, helper: '待完善和待发布条目' },
	{ label: '关联文件', value: stats.value.fileLinkedCount || 0, helper: '已建立文件关系的条目数' },
	{ label: '平均重要度', value: formatDecimal(stats.value.avgImportance), helper: '用于排序和治理观察' },
	{ label: '主题覆盖', value: stats.value.topicCount || 0, helper: '知识主题维度覆盖情况' }
]);

const formStatusOptions = computed(() => {
	if (!editingRecord.value?.id) {
		return buildKnowledgeBaseStatusOptions(['draft']);
	}

	if (editingRecord.value.status === 'published') {
		return buildKnowledgeBaseStatusOptions(['published', 'archived']);
	}

	return buildKnowledgeBaseStatusOptions(['draft', 'published', 'archived']);
});

const graphMetricCards = computed(() => [
	{ label: '节点数', value: graphSummary.value.nodes?.length || 0 },
	{ label: '关系数', value: graphSummary.value.links?.length || 0 },
	{ label: '知识节点', value: graphNodesByCategory('knowledge').length },
	{ label: '文件节点', value: graphNodesByCategory('file').length }
]);

const graphGroups = computed(() => ({
	categories: graphNodesByCategory('category').map(item => item.name),
	tags: graphNodesByCategory('tag').map(item => item.name)
}));

const graphRelationPreview = computed(() =>
	graphSummary.value.nodes
		.slice(0, 8)
		.map(node => ({
			name: node.name,
			category: graphCategoryLabel(node.category),
			relationCount: graphSummary.value.links.filter(
				link => link.source === node.id || link.target === node.id
			).length
		}))
);

const knowledgeOptions = computed(() =>
	rows.value
		.filter(item => item.id)
		.map(item => ({
			id: item.id as number,
			label: `${item.kbNo || '未编号'} / ${item.title || '未命名'}`
		}))
);

watch(activeTab, tab => {
	if (tab === 'graph' && showGraphTab.value && !graphSummary.value.nodes.length) {
		void refreshGraph();
	}

	if (tab === 'search') {
		if (showQaPanel.value && !qaRows.value.length) {
			void refreshQaList();
		}
	}
});

onMounted(async () => {
	await Promise.all([
		dict.refresh([KNOWLEDGE_BASE_STATUS_DICT_KEY, DOCUMENT_CENTER_STATUS_DICT_KEY]),
		loadAccessContext()
	]);
	if (canAccess.value) {
		await initializePage();
	}
});

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch (error: unknown) {
		accessContext.value = null;
		showElementWarningFromError(error, '角色上下文加载失败，已使用兼容展示视角');
	}
}

async function initializePage() {
	await Promise.all([knowledgeList.reload(), loadStats(), loadRelatedFileOptions()]);

	if (showGraphTab.value) {
		await refreshGraph();
	}

	if (showQaPanel.value) {
		await refreshQaList();
	}
}

async function loadStats() {
	if (!showStatsSection.value) {
		stats.value = createEmptyKnowledgeBaseStats();
		return;
	}

	try {
		stats.value = await performanceKnowledgeBaseService.fetchStats({
			keyword: normalizeOptionalText(filters.keyword),
			category: normalizeOptionalText(filters.category),
			tag: normalizeOptionalText(filters.tag),
			status: filters.status || undefined
		});
	} catch (error: unknown) {
		showElementErrorFromError(error, '知识统计加载失败');
	}
}

async function loadRelatedFileOptions() {
	try {
		const result = await performanceDocumentCenterService.fetchPage({
			page: 1,
			size: 100
		});
		relatedFileOptions.value = (result.list || [])
			.filter(item => item.id)
			.map(item => ({
				id: item.id as number,
				label: `${item.fileNo || '未编号'} / ${item.fileName || '未命名'}`
			}));
	} catch {
		relatedFileOptions.value = [];
	}
}

function changeListPage(page: number) {
	void knowledgeList.goToPage(page);
}

function applyListFilters() {
	void Promise.all([knowledgeList.search(), loadStats()]);
}

function resetListFilters() {
	void Promise.all([knowledgeList.reset(), loadStats()]);
}

function openCreate() {
	editingRecord.value = null;
	Object.assign(form, createEmptyKnowledgeBaseForm());
	formVisible.value = true;
}

function openQaCreate() {
	Object.assign(qaForm, createEmptyKnowledgeQaForm());
	qaDialogVisible.value = true;
}

async function openEdit(row: KnowledgeBaseRecord) {
	if (row.status === 'archived') {
		ElMessage.warning('已归档知识条目只允许查看，不允许继续编辑');
		return;
	}

	editingRecord.value = row;
	Object.assign(form, mapRecordToForm(row));

	if (!relatedFileOptions.value.length) {
		await loadRelatedFileOptions();
	}

	formVisible.value = true;
}

async function submitForm() {
	const valid = await formRef.value?.validate().catch(() => false);

	if (!valid) {
		return;
	}

	submitLoading.value = true;

	try {
		const payload = buildPayload();

		if (editingRecord.value?.id) {
			await performanceKnowledgeBaseService.updateKnowledge({
				id: editingRecord.value.id,
				...payload
			});
			ElMessage.success('知识条目已更新');
		} else {
			await performanceKnowledgeBaseService.createKnowledge(payload);
			ElMessage.success('知识条目已创建');
		}

		formVisible.value = false;
		await Promise.all([knowledgeList.reload(), loadStats()]);
	} catch (error: unknown) {
		showElementErrorFromError(error, '知识条目保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function submitQaForm() {
	const valid = await qaFormRef.value?.validate().catch(() => false);

	if (!valid) {
		return;
	}

	qaSubmitting.value = true;

	try {
		await performanceKnowledgeBaseService.createQa({
			question: qaForm.question.trim(),
			answer: qaForm.answer.trim(),
			relatedKnowledgeIds: qaForm.relatedKnowledgeIds,
			relatedFileIds: qaForm.relatedFileIds
		});
		ElMessage.success('问答元数据已创建');
		qaDialogVisible.value = false;
		await refreshQaList();
	} catch (error: unknown) {
		showElementErrorFromError(error, '问答元数据保存失败');
	} finally {
		qaSubmitting.value = false;
	}
}

async function handleDelete(row: KnowledgeBaseRecord) {
	if (!row.id) {
		return;
	}

	const rowId = row.id;
	const confirmed = await confirmElementAction(
		`确认删除知识条目“${row.title || row.kbNo}”吗？此操作只移除元数据记录。`,
		'删除确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId,
		actionType: 'delete',
		request: () => performanceKnowledgeBaseService.removeKnowledge({ ids: [rowId] }),
		successMessage: '知识条目已删除',
		errorMessage: '知识条目删除失败',
		refresh: async () => {
			await Promise.all([knowledgeList.reload(), loadStats(), refreshQaList()]);
		}
	});
}

async function refreshGraph() {
	if (!showGraphTab.value) {
		return;
	}

	graphLoading.value = true;

	try {
		graphSummary.value = await performanceKnowledgeBaseService.fetchGraph();
	} catch (error: unknown) {
		showElementErrorFromError(error, '知识图谱加载失败');
	} finally {
		graphLoading.value = false;
	}
}

async function runSearch() {
	if (!showSearchPanel.value) {
		return;
	}

	searchLoading.value = true;

	try {
		const result = await performanceKnowledgeBaseService.fetchSearch({
			keyword: searchKeyword.value.trim()
		});
		searchResult.value = normalizeSearchResult(result);
	} catch (error: unknown) {
		showElementErrorFromError(error, '知识搜索失败');
	} finally {
		searchLoading.value = false;
	}
}

async function refreshQaList() {
	if (!showQaPanel.value) {
		return;
	}

	qaLoading.value = true;

	try {
		const result = await performanceKnowledgeBaseService.fetchQaList({
			keyword: normalizeOptionalText(qaKeyword.value)
		});
		qaRows.value = Array.isArray(result) ? result : result?.list || [];
	} catch (error: unknown) {
		showElementErrorFromError(error, '百问百答列表加载失败');
	} finally {
		qaLoading.value = false;
	}
}

function canEdit(row: KnowledgeBaseRecord) {
	return showEditButton.value && row.status !== 'archived';
}

function canDelete(_row: KnowledgeBaseRecord) {
	return showDeleteButton.value;
}

function buildPayload(): Partial<KnowledgeBaseRecord> {
	return {
		kbNo: form.kbNo.trim(),
		title: form.title.trim(),
		category: form.category.trim(),
		summary: form.summary.trim(),
		ownerName: form.ownerName.trim(),
		status: editingRecord.value?.id ? form.status : 'draft',
		importance: Number(form.importance || 0),
		tags: splitCommaText(form.tagsText),
		relatedTopics: splitCommaText(form.relatedTopicsText),
		relatedFileIds: form.relatedFileIds
	};
}

function mapRecordToForm(record: KnowledgeBaseRecord): KnowledgeBaseFormModel {
	return {
		kbNo: record.kbNo || '',
		title: record.title || '',
		category: record.category || '',
		summary: record.summary || '',
		ownerName: record.ownerName || '',
		status: record.status || 'draft',
		importance: Number(record.importance || 0),
		tagsText: (record.tags || []).join(', '),
		relatedTopicsText: (record.relatedTopics || []).join(', '),
		relatedFileIds: normalizeRelatedFileIds(record.relatedFileIds)
	};
}

function buildKnowledgeBaseStatusOptions(values: KnowledgeBaseStatus[]) {
	return statusOptions.value.filter(item => values.includes(item.value));
}

function normalizeSearchResult(result?: Partial<KnowledgeSearchResult> | null): KnowledgeSearchResult {
	return {
		total: Number(result?.total || 0),
		knowledge: Array.isArray(result?.knowledge) ? result.knowledge : [],
		files: Array.isArray(result?.files) ? result.files : [],
		qas: Array.isArray(result?.qas) ? result.qas : []
	};
}

function normalizeRelatedFileIds(value?: KnowledgeBaseRecord['relatedFileIds']) {
	return (value || [])
		.map(item => Number(item))
		.filter(item => Number.isFinite(item) && item > 0);
}

function relatedFileCount(record: KnowledgeBaseRecord) {
	return normalizeRelatedFileIds(record.relatedFileIds).length;
}

function formatTopics(value?: string[]) {
	return value?.length ? value.join(' / ') : '-';
}

function splitCommaText(value?: string | null) {
	return String(value || '')
		.split(/[，,\s]+/)
		.map(item => item.trim())
		.filter(Boolean);
}

function statusLabel(value?: KnowledgeBaseStatus) {
	return dict.getLabel(KNOWLEDGE_BASE_STATUS_DICT_KEY, value) || value || '-';
}

function statusTagType(value?: KnowledgeBaseStatus): ElementTagType {
	return (dict.getMeta(KNOWLEDGE_BASE_STATUS_DICT_KEY, value)?.tone as ElementTagType) || 'info';
}

function fileStatusLabel(value?: DocumentCenterStatus) {
	return dict.getLabel(DOCUMENT_CENTER_STATUS_DICT_KEY, value) || value || '-';
}

function fileStatusTagType(value?: DocumentCenterStatus): ElementTagType {
	return (dict.getMeta(DOCUMENT_CENTER_STATUS_DICT_KEY, value)?.tone as ElementTagType) || 'info';
}

function graphNodesByCategory(category: string) {
	return (graphSummary.value.nodes || []).filter(item => item.category === category);
}

function graphCategoryLabel(value?: string) {
	if (value === 'knowledge') {
		return '知识条目';
	}

	if (value === 'category') {
		return '分类';
	}

	if (value === 'tag') {
		return '标签';
	}

	if (value === 'file') {
		return '关联文件';
	}

	return value || '-';
}

function truncateText(value?: string | null, maxLength = 60) {
	const text = String(value || '').trim();
	if (!text) {
		return '-';
	}

	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function normalizeOptionalText(value?: string | null) {
	const nextValue = String(value || '').trim();
	return nextValue || undefined;
}

function formatDecimal(value?: number | null) {
	return Number(value || 0).toFixed(1);
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.metadata-workspace.scss' as metadataWorkspace;

.knowledge-base-page {
	@include metadataWorkspace.metadata-workspace-shell(1120px);

	&__graph,
	&__panel-grid {
		display: grid;
		gap: var(--app-space-4);
	}

	&__graph-metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: var(--app-space-3);
		margin-bottom: var(--app-space-4);
	}
}
</style>
