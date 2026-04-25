<!-- 文件职责：统一承接教师域页面的无权限模糊覆盖与权限申请提示；不负责真实鉴权决策、路由跳转或后端权限注入；依赖 base user store 提供 permissionMask/teacherAccessProfile；维护重点是 denied 态只能做展示，不能替代后端鉴权。 -->
<template>
	<div class="permission-overlay" :class="{ 'permission-overlay--denied': denied }">
		<div class="permission-overlay__content">
			<slot />
		</div>

		<div v-if="denied" class="permission-overlay__mask">
			<div class="permission-overlay__panel">
				<div class="permission-overlay__icon">
					<el-icon><lock /></el-icon>
				</div>
				<h3>{{ title }}</h3>
				<p>{{ description }}</p>

				<el-tag v-if="scopeLabel" effect="plain" type="info">
					当前数据范围：{{ scopeLabel }}
				</el-tag>

				<div class="permission-overlay__actions">
					<el-button type="primary" plain @click="copyRequestText"
						>复制申请信息</el-button
					>
				</div>

				<div class="permission-overlay__meta">
					<div>建议申请权限：{{ permissionKey || '请联系管理员确认页面权限' }}</div>
					<div v-if="scopeHint">{{ scopeHint }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-permission-overlay'
});

import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Lock } from '@element-plus/icons-vue';
import { useBase } from '/$/base';

interface TeacherAccessProfile {
	scopeType?: 'global' | 'department' | 'self';
	isReadonly?: boolean;
	scopedDepartmentIds?: number[];
	scopedTeacherIds?: number[];
	scopedClassIds?: number[];
}

const props = withDefaults(
	defineProps<{
		denied?: boolean;
		title?: string;
		description?: string;
		permissionKey?: string;
	}>(),
	{
		denied: false,
		title: '当前账号暂未开通该模块权限',
		description: '页面已进入只读保护态。请联系管理员按岗位范围开通访问权限。'
	}
);

const { user } = useBase();

const teacherAccessProfile = computed<TeacherAccessProfile | null>(() => {
	const profile = user.info?.teacherAccessProfile;
	return profile && typeof profile === 'object' ? profile : null;
});

const scopeLabel = computed(() => {
	switch (teacherAccessProfile.value?.scopeType) {
		case 'global':
			return '全局';
		case 'department':
			return '部门';
		case 'self':
			return '本人';
		default:
			return '';
	}
});

const scopeHint = computed(() => {
	const profile = teacherAccessProfile.value;

	if (!profile) {
		return '当前未加载到教师域访问画像，申请时请附上岗位和页面路径。';
	}

	const departmentCount = profile.scopedDepartmentIds?.length || 0;
	const teacherCount = profile.scopedTeacherIds?.length || 0;
	const classCount = profile.scopedClassIds?.length || 0;
	const readonlyText = profile.isReadonly ? '只读能力' : '可写能力';

	return `${readonlyText}，部门 ${departmentCount} 个，班主任 ${teacherCount} 个，班级 ${classCount} 个。`;
});

async function copyRequestText() {
	const requestText = [
		'权限申请',
		`页面权限：${props.permissionKey || '待确认'}`,
		scopeLabel.value ? `当前范围：${scopeLabel.value}` : '',
		scopeHint.value
	]
		.filter(Boolean)
		.join('\n');

	try {
		if (!navigator?.clipboard?.writeText) {
			throw new Error('clipboard-unavailable');
		}

		await navigator.clipboard.writeText(requestText);
		ElMessage.success('申请信息已复制');
	} catch (error) {
		ElMessage.info(requestText);
	}
}
</script>

<style lang="scss" scoped>
.permission-overlay {
	position: relative;
	min-height: 240px;

	&__content {
		transition:
			filter 0.2s ease,
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	&__mask {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--app-space-6);
		border-radius: var(--app-radius-xl);
		background: var(--app-permission-overlay-mask-bg);
		backdrop-filter: blur(10px);
	}

	&__panel {
		display: grid;
		gap: var(--app-space-3);
		max-width: 520px;
		padding: var(--app-space-6);
		border: 1px solid var(--app-permission-overlay-panel-border);
		border-radius: var(--app-radius-xl);
		background: var(--app-permission-overlay-panel-bg);
		box-shadow: var(--app-shadow-surface);
		text-align: center;

		h3,
		p {
			margin: 0;
		}

		p {
			color: var(--app-permission-overlay-panel-text);
			line-height: 1.6;
		}
	}

	&__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		margin: 0 auto;
		border-radius: calc(var(--app-radius-lg) + 4px);
		background: var(--app-permission-overlay-icon-bg);
		color: var(--app-permission-overlay-icon-color);
		font-size: 22px;
	}

	&__actions {
		display: flex;
		justify-content: center;
	}

	&__meta {
		display: grid;
		gap: 6px;
		font-size: var(--app-font-size-caption);
		color: var(--app-permission-overlay-panel-text);
	}

	&--denied {
		.permission-overlay__content {
			filter: blur(10px) saturate(0.75);
			opacity: 0.35;
			transform: scale(0.985);
			pointer-events: none;
			user-select: none;
		}
	}
}
</style>
