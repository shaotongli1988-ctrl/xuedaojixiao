<!-- 文件职责：承接角色工作台 Phase 1 的门户化首页骨架，展示欢迎头部、核心指标、待我处理、快捷入口、风险提醒、我的事项和角色专区；不负责真实聚合接口、权限注册或跨页面写入；维护重点是工作台仍只做入口分发和状态提醒，既有路径与统一卡片模型不能漂移。 -->
<template>
	<div class="performance-workbench" v-loading="loading">
		<div class="performance-workbench__atmosphere" aria-hidden="true">
			<span class="performance-workbench__orb performance-workbench__orb--primary"></span>
			<span class="performance-workbench__orb performance-workbench__orb--accent"></span>
		</div>

		<el-card shadow="never" class="performance-workbench__banner">
			<div class="performance-workbench__banner-head">
				<div class="performance-workbench__banner-copy">
					<div class="performance-workbench__eyebrow">角色门户</div>
					<h2 class="performance-workbench__title">角色工作台</h2>
					<p class="performance-workbench__description">
						{{ snapshot?.profile.welcomeText }}
					</p>
				</div>

				<div class="performance-workbench__banner-actions">
					<el-tag effect="plain" :type="roleTagType">
						{{ snapshot?.profile.roleLabel || '员工视角' }}
					</el-tag>
					<el-tag effect="plain" type="info">
						{{ snapshot?.profile.departmentName || '当前部门' }}
					</el-tag>
					<el-select
						v-if="personaOptions.length > 1"
						v-model="activePersonaKey"
						placeholder="切换视角"
						style="width: 180px"
						@change="handlePersonaChange"
					>
						<el-option
							v-for="item in personaOptions"
							:key="item.key"
							:label="item.label"
							:value="item.key"
						/>
					</el-select>
					<el-button type="primary" @click="refreshWorkbench">刷新工作台</el-button>
				</div>
			</div>

			<div class="performance-workbench__banner-meta">
				<div class="performance-workbench__identity-strip">
					<div class="performance-workbench__identity-chip">
						<span class="performance-workbench__identity-label">当前执行人</span>
						<span class="performance-workbench__identity-value">
							{{ snapshot?.profile.name || displayName }}
						</span>
					</div>
					<div class="performance-workbench__identity-chip">
						<span class="performance-workbench__identity-label">当前日期</span>
						<span class="performance-workbench__identity-value">{{ todayLabel }}</span>
					</div>
					<div class="performance-workbench__identity-chip">
						<span class="performance-workbench__identity-label">工作台状态</span>
						<span class="performance-workbench__identity-value">正常运行</span>
					</div>
					<div
						v-if="snapshot?.profile.tags?.length"
						class="performance-workbench__profile-tags"
					>
						<el-tag
							v-for="tag in snapshot?.profile.tags || []"
							:key="tag"
							size="small"
							effect="plain"
							type="success"
						>
							{{ tag }}
						</el-tag>
					</div>
				</div>

				<div v-if="primaryPendingCard" class="performance-workbench__focus-card">
					<div class="performance-workbench__focus-kicker">现在先做</div>
					<div class="performance-workbench__focus-title">
						{{ primaryPendingCard.title }}
					</div>
					<div class="performance-workbench__focus-description">
						{{ primaryPendingCard.description }}
					</div>
					<div class="performance-workbench__focus-meta">
						<el-tag
							v-if="primaryPendingCard.count !== undefined"
							effect="plain"
							type="warning"
						>
							{{ primaryPendingCard.count }}
							{{ primaryPendingCard.countLabel || '项待处理' }}
						</el-tag>
						<el-tag effect="plain">
							{{ primaryPendingCard.statusText || '优先从该入口继续处理' }}
						</el-tag>
					</div>
					<div class="performance-workbench__focus-actions">
						<el-button type="primary" @click="goToCard(primaryPendingCard)">
							{{ primaryPendingCard.actionText || '立即处理' }}
						</el-button>
						<el-button
							v-for="card in bannerActionCards"
							:key="card.id"
							plain
							@click="goToCard(card)"
						>
							{{ card.title }}
						</el-button>
					</div>
				</div>
			</div>
		</el-card>

		<el-alert
			v-if="pageError"
			class="performance-workbench__error"
			type="warning"
			:title="pageError"
			:closable="false"
			show-icon
		/>

		<section class="performance-workbench__metrics" aria-label="核心指标">
			<article
				v-for="item in snapshot?.profile.stats || []"
				:key="item.key"
				class="performance-workbench__metric-card"
			>
				<div class="performance-workbench__metric-label">{{ item.label }}</div>
				<div class="performance-workbench__metric-value">{{ item.value }}</div>
				<div class="performance-workbench__metric-hint">{{ item.hint }}</div>
			</article>
		</section>

		<div class="performance-workbench__main-grid">
			<section
				v-if="pendingSection"
				class="performance-workbench__section performance-workbench__section--pending performance-workbench__section--featured"
			>
				<div class="performance-workbench__section-header">
					<div class="performance-workbench__section-main">
						<div class="performance-workbench__section-kicker">
							<span class="performance-workbench__section-index">01</span>
							<span class="performance-workbench__section-tip">{{
								pendingSection.tip
							}}</span>
						</div>
						<div class="performance-workbench__section-title">
							{{ pendingSection.title }}
						</div>
						<div class="performance-workbench__section-description">
							{{ pendingSection.description }}
						</div>
					</div>

					<div class="performance-workbench__section-meta">
						<div class="performance-workbench__section-count">
							<span class="performance-workbench__section-count-value">
								{{ pendingSection.cards.length }}
							</span>
							<span class="performance-workbench__section-count-label"
								>个待办入口</span
							>
						</div>
					</div>
				</div>

				<div class="performance-workbench__pending-grid">
					<WorkbenchTaskCard
						v-for="card in pendingSection.cards"
						:key="card.id"
						:card="card"
					/>
				</div>
			</section>

			<div class="performance-workbench__side-column">
				<section
					v-if="shortcutSection"
					class="performance-workbench__section performance-workbench__section--shortcuts"
				>
					<div class="performance-workbench__section-header">
						<div class="performance-workbench__section-main">
							<div class="performance-workbench__section-kicker">
								<span class="performance-workbench__section-index">02</span>
								<span class="performance-workbench__section-tip">{{
									shortcutSection.tip
								}}</span>
							</div>
							<div class="performance-workbench__section-title">
								{{ shortcutSection.title }}
							</div>
						</div>
					</div>

					<div class="performance-workbench__compact-list">
						<WorkbenchTaskCard
							v-for="card in shortcutSection.cards"
							:key="card.id"
							:card="card"
						/>
					</div>
				</section>

				<section
					v-if="riskSection"
					class="performance-workbench__section performance-workbench__section--risks"
				>
					<div class="performance-workbench__section-header">
						<div class="performance-workbench__section-main">
							<div class="performance-workbench__section-kicker">
								<span class="performance-workbench__section-index">03</span>
								<span class="performance-workbench__section-tip">{{
									riskSection.tip
								}}</span>
							</div>
							<div class="performance-workbench__section-title">
								{{ riskSection.title }}
							</div>
						</div>
					</div>

					<div class="performance-workbench__compact-list">
						<WorkbenchTaskCard
							v-for="card in riskSection.cards"
							:key="card.id"
							:card="card"
						/>
					</div>
				</section>
			</div>
		</div>

		<div class="performance-workbench__secondary-grid">
			<section
				v-for="(section, index) in secondarySections"
				:key="section.key"
				class="performance-workbench__section"
				:class="`performance-workbench__section--${section.key}`"
			>
				<div class="performance-workbench__section-header">
					<div class="performance-workbench__section-main">
						<div class="performance-workbench__section-kicker">
							<span class="performance-workbench__section-index">
								{{ formatSectionIndex(index + 3) }}
							</span>
							<span class="performance-workbench__section-tip">{{
								section.tip
							}}</span>
						</div>
						<div class="performance-workbench__section-title">{{ section.title }}</div>
						<div class="performance-workbench__section-description">
							{{ section.description }}
						</div>
					</div>
				</div>

				<el-row :gutter="16">
					<el-col
						v-for="card in section.cards"
						:key="card.id"
						:xs="24"
						:sm="12"
						:xl="section.key === 'zone' ? 12 : 8"
					>
						<WorkbenchTaskCard :card="card" />
					</el-col>
				</el-row>
			</section>
		</div>

		<section
			v-for="(section, index) in extraSections"
			:key="section.key"
			class="performance-workbench__section"
			:class="`performance-workbench__section--${section.key}`"
		>
			<div class="performance-workbench__section-header">
				<div class="performance-workbench__section-main">
					<div class="performance-workbench__section-kicker">
						<span class="performance-workbench__section-index">
							{{ formatSectionIndex(index + 5) }}
						</span>
						<span class="performance-workbench__section-tip">{{ section.tip }}</span>
					</div>
					<div class="performance-workbench__section-title">{{ section.title }}</div>
					<div class="performance-workbench__section-description">
						{{ section.description }}
					</div>
				</div>
			</div>

			<el-row :gutter="16">
				<el-col v-for="card in section.cards" :key="card.id" :xs="24" :sm="12" :xl="8">
					<WorkbenchTaskCard :card="card" />
				</el-col>
			</el-row>
		</section>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-workbench'
});

import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useUserStore } from '/$/base/store/user';
import WorkbenchTaskCard from '../../components/workbench-task-card.vue';
import { performanceWorkbenchService, resolveWorkbenchRoleKey } from '../../service/workbench';
import { performanceAccessContextService } from '../../service/access-context';
import { resolveErrorMessage } from '../shared/error-message';
import type { PerformanceAccessContext } from '../../types';
import type {
	WorkbenchPageId,
	WorkbenchPersonaKey,
	WorkbenchSectionKey,
	WorkbenchSectionModel,
	WorkbenchSnapshot,
	WorkbenchTaskCardModel
} from '../../workbench/types';

const PRIMARY_SECTION_ORDER: WorkbenchSectionKey[] = [
	'pending',
	'shortcuts',
	'risks',
	'mine',
	'zone'
];

const user = useUserStore();
const router = useRouter();

const loading = ref(false);
const pageError = ref('');
const snapshot = ref<WorkbenchSnapshot | null>(null);
const accessContext = ref<PerformanceAccessContext | null>(null);
const activePersonaKey = ref<WorkbenchPersonaKey | ''>('');

const displayName = computed(() => {
	return String(user.info?.nickName || user.info?.name || user.info?.username || '当前用户');
});

const departmentName = computed(() => {
	return String(user.info?.departmentName || '当前部门');
});

const todayLabel = computed(() => {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short'
	}).format(new Date());
});

const roleKey = computed(() => {
	return resolveWorkbenchRoleKey({
		userName: displayName.value,
		departmentName: departmentName.value,
		personaKey: (accessContext.value?.activePersonaKey || null) as WorkbenchPersonaKey | null,
		roleKind: accessContext.value?.roleKind || null
	});
});

const personaOptions = computed(() => accessContext.value?.availablePersonas || []);

const roleTagType = computed(() => {
	if (roleKey.value === 'hr') {
		return 'success';
	}

	if (roleKey.value === 'manager') {
		return 'warning';
	}

	return 'info';
});

const sections = computed(() => snapshot.value?.sections || []);

const sectionMap = computed(() => {
	return new Map(sections.value.map(section => [section.key, section]));
});

const pendingSection = computed(() => sectionMap.value.get('pending'));
const shortcutSection = computed(() => sectionMap.value.get('shortcuts'));
const riskSection = computed(() => sectionMap.value.get('risks'));
const primaryPendingCard = computed(() => pendingSection.value?.cards?.[0]);
const bannerActionCards = computed(() => {
	const actions = [
		...(pendingSection.value?.cards?.slice(1, 2) || []),
		...(shortcutSection.value?.cards?.slice(0, 2) || [])
	];

	return actions.filter(card => Boolean(card.path)).slice(0, 3);
});

const secondarySections = computed(() => {
	return PRIMARY_SECTION_ORDER.slice(3)
		.map(key => sectionMap.value.get(key))
		.filter((section): section is WorkbenchSectionModel => Boolean(section));
});

const extraSections = computed(() => {
	return sections.value.filter(section => !PRIMARY_SECTION_ORDER.includes(section.key));
});

onMounted(() => {
	refreshWorkbench();
});

function formatSectionIndex(index: number) {
	return String(index + 1).padStart(2, '0');
}

async function goToCard(card?: WorkbenchTaskCardModel | null) {
	if (!card?.path) {
		return;
	}

	await router.push({
		path: card.path,
		query: card.query
	});
}

async function refreshWorkbench() {
	loading.value = true;
	pageError.value = '';

	try {
		const context = await performanceAccessContextService.fetchContext(
			activePersonaKey.value || null
		);
		await applyWorkbenchContext(context);
	} catch (error: unknown) {
		pageError.value = resolveErrorMessage(error, '角色工作台占位数据加载失败');
		ElMessage.error(pageError.value);
	} finally {
		loading.value = false;
	}
}

async function handlePersonaChange(value: WorkbenchPersonaKey) {
	loading.value = true;
	pageError.value = '';

	try {
		const context = await performanceAccessContextService.saveActivePersonaKey(value || null);
		await applyWorkbenchContext(context);
	} catch (error: unknown) {
		pageError.value = resolveErrorMessage(error, '角色工作台视角切换失败');
		ElMessage.error(pageError.value);
	} finally {
		loading.value = false;
	}
}

async function applyWorkbenchContext(context: PerformanceAccessContext) {
	accessContext.value = context;
	activePersonaKey.value = (context.activePersonaKey || '') as WorkbenchPersonaKey | '';

	if (!context.surfaceAccess.workbench) {
		snapshot.value = null;
		pageError.value = '当前账号暂无角色工作台入口';
		return;
	}

	snapshot.value = await performanceWorkbenchService.fetchSnapshot({
		userName: displayName.value,
		departmentName: departmentName.value,
		personaKey: (context.activePersonaKey || null) as WorkbenchPersonaKey | null,
		roleKind: context.roleKind || null,
		workbenchPages: (context.workbenchPages || []) as WorkbenchPageId[],
		surfaceAccess: context.surfaceAccess || {}
	});
}
</script>

<style lang="scss" scoped>
.performance-workbench {
	--workbench-bg: var(--app-surface-page);
	--workbench-panel-bg: var(--app-surface-card);
	--workbench-panel-border: var(--app-border-strong);
	--workbench-panel-shadow: var(--app-shadow-surface);
	--workbench-title: var(--app-text-primary);
	--workbench-text: var(--app-text-secondary);
	--workbench-kicker: var(--app-text-tertiary);
	--workbench-primary: var(--app-accent-brand);
	--workbench-primary-soft: var(--app-accent-brand-soft);
	--workbench-accent: var(--app-accent-warning);
	--workbench-risk: var(--app-accent-danger);
	--workbench-number: var(--app-font-mono);

	position: relative;
	display: flex;
	flex-direction: column;
	gap: var(--app-space-4);
	padding: var(--app-space-2) 0 var(--app-space-6);
	background: var(--workbench-bg);
	font-family: var(--app-font-sans);

	&__atmosphere {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	&__orb {
		position: absolute;
		border-radius: 999px;
		filter: blur(36px);
		opacity: 0.55;
	}

	&__orb--primary {
		top: 24px;
		right: -20px;
		width: 240px;
		height: 240px;
		background: var(--app-atmosphere-brand);
	}

	&__orb--accent {
		top: 120px;
		left: -40px;
		width: 200px;
		height: 200px;
		background: var(--app-atmosphere-warning);
	}

	&__banner,
	&__section,
	&__metric-card {
		position: relative;
		z-index: 1;
		border: 1px solid var(--workbench-panel-border);
		background: var(--workbench-panel-bg);
		box-shadow: var(--workbench-panel-shadow);
	}

	&__banner {
		border-radius: var(--app-radius-xl);

		:deep(.el-card__body) {
			padding: var(--app-space-5) calc(var(--app-space-5) + 2px);
		}
	}

	&__banner-head,
	&__banner-meta {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-4);
	}

	&__banner-meta {
		margin-top: var(--app-space-4);
		padding-top: var(--app-space-4);
		border-top: 1px solid var(--app-divider);
	}

	&__banner-copy,
	&__identity-strip {
		min-width: 0;
		flex: 1;
	}

	&__banner-actions,
	&__profile-tags,
	&__focus-actions,
	&__focus-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--app-space-2);
	}

	&__banner-actions {
		flex-shrink: 0;
		justify-content: flex-end;
	}

	&__eyebrow {
		font-size: var(--app-font-size-caption);
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--workbench-kicker);
	}

	&__title {
		margin: 10px 0 8px;
		font-size: clamp(28px, 4vw, 34px);
		line-height: 1.08;
		color: var(--workbench-title);
	}

	&__description {
		margin: 0;
		font-size: 14px;
		line-height: 1.75;
		color: var(--workbench-text);
	}

	&__identity-strip,
	&__focus-card {
		padding: var(--app-space-4) calc(var(--app-space-4) + 2px);
		border-radius: var(--app-radius-lg);
		background: var(--app-surface-soft);
		border: 1px solid var(--app-border-soft);
		box-shadow: var(--app-shadow-inset);
	}

	&__focus-card {
		min-width: 280px;
	}

	&__identity-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--app-space-3);
		align-content: start;
	}

	&__identity-chip {
		display: grid;
		gap: 6px;
	}

	&__identity-label {
		font-size: var(--app-font-size-caption);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--workbench-kicker);
	}

	&__identity-value {
		font-size: 15px;
		font-weight: 600;
		color: var(--workbench-title);
	}

	&__profile-tags {
		grid-column: 1 / -1;
		padding-top: var(--app-space-2);
		border-top: 1px dashed var(--app-divider);
	}

	&__focus-kicker {
		font-size: var(--app-font-size-caption);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--workbench-primary);
	}

	&__focus-title {
		margin-top: 10px;
		font-size: 22px;
		font-weight: 700;
		line-height: 1.2;
		color: var(--workbench-title);
	}

	&__focus-description {
		margin-top: 8px;
		font-size: var(--app-font-size-body);
		line-height: 1.7;
		color: var(--workbench-text);
	}

	&__focus-meta {
		margin-top: var(--app-space-4);
	}

	&__focus-actions {
		margin-top: var(--app-space-3);
	}

	&__metrics {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--app-space-3);
	}

	&__metric-card {
		padding: var(--app-space-4) calc(var(--app-space-4) + 2px);
		border-radius: var(--app-radius-lg);
		background: var(--app-surface-spotlight);
	}

	&__metric-label {
		font-size: var(--app-font-size-caption);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--workbench-kicker);
	}

	&__metric-value {
		margin-top: 10px;
		font-family: var(--workbench-number);
		font-size: 30px;
		font-weight: 700;
		line-height: 1;
		color: var(--workbench-primary);
	}

	&__metric-hint {
		margin-top: 10px;
		font-size: var(--app-font-size-body);
		line-height: 1.6;
		color: var(--workbench-text);
	}

	&__main-grid,
	&__secondary-grid {
		position: relative;
		z-index: 1;
		display: grid;
		gap: var(--app-space-4);
	}

	&__main-grid {
		grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.92fr);
		align-items: start;
	}

	&__secondary-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	&__side-column,
	&__compact-list,
	&__pending-grid {
		display: grid;
		gap: var(--app-space-4);
	}

	&__pending-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	&__section {
		padding: var(--app-space-5);
		border-radius: var(--app-radius-xl);
	}

	&__section--featured {
		background: var(--app-surface-spotlight);
	}

	&__section--pending {
		border-top: 3px solid var(--workbench-primary);
	}

	&__section--shortcuts {
		border-top: 3px solid var(--workbench-accent);
	}

	&__section--risks {
		border-top: 3px solid var(--workbench-risk);
	}

	&__section--mine,
	&__section--zone {
		border-top: 3px solid var(--app-border-hover);
	}

	&__section-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-4);
		margin-bottom: var(--app-space-4);
	}

	&__section-main {
		min-width: 0;
	}

	&__section-kicker {
		display: flex;
		align-items: center;
		gap: var(--app-space-2);
	}

	&__section-index {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 26px;
		padding: 0 10px;
		border-radius: 999px;
		background: var(--workbench-primary-soft);
		font-family: var(--workbench-number);
		font-size: var(--app-font-size-caption);
		font-weight: 700;
		color: var(--workbench-primary);
	}

	&__section-tip {
		font-size: var(--app-font-size-caption);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--workbench-kicker);
	}

	&__section-title {
		margin-top: 10px;
		font-size: 24px;
		font-weight: 700;
		line-height: 1.2;
		color: var(--workbench-title);
	}

	&__section-description {
		margin-top: 8px;
		font-size: var(--app-font-size-body);
		line-height: 1.7;
		color: var(--workbench-text);
	}

	&__section-meta {
		flex-shrink: 0;
	}

	&__section-count {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 10px 14px;
		border-radius: var(--app-radius-md);
		background: var(--app-surface-soft);
		border: 1px solid var(--app-border-soft);
	}

	&__section-count-value {
		font-family: var(--workbench-number);
		font-size: 20px;
		font-weight: 700;
		color: var(--workbench-primary);
	}

	&__section-count-label {
		font-size: var(--app-font-size-caption);
		color: var(--workbench-text);
	}

	&__error {
		position: relative;
		z-index: 1;
	}
}

@media (max-width: 1279px) {
	.performance-workbench {
		&__identity-strip,
		&__metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		&__main-grid,
		&__secondary-grid,
		&__pending-grid {
			grid-template-columns: 1fr;
		}
	}
}

@media (max-width: 991px) {
	.performance-workbench {
		&__banner-head,
		&__banner-meta,
		&__section-header {
			flex-direction: column;
			align-items: stretch;
		}

		&__banner-actions {
			justify-content: flex-start;
		}

		&__identity-strip {
			grid-template-columns: 1fr;
		}
	}
}

@media (max-width: 767px) {
	.performance-workbench {
		&__metrics {
			grid-template-columns: 1fr;
		}

		&__banner,
		&__section,
		&__metric-card {
			border-radius: var(--app-radius-lg);
		}

		&__title {
			font-size: 28px;
		}

		&__banner :deep(.el-card__body),
		&__section,
		&__metric-card {
			padding: var(--app-space-4);
		}

		&__section-title {
			font-size: 20px;
		}
	}
}

@media (prefers-reduced-motion: reduce) {
	.performance-workbench,
	.performance-workbench * {
		animation: none !important;
		transition: none !important;
	}
}
</style>
