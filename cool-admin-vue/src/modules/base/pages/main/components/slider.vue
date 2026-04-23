<!-- 文件职责：承载后台主壳左侧导航、分组摘要与菜单搜索；不负责菜单树数据生产或业务权限判定；维护重点是导航视觉必须跟随全局语义 token，而不是继续维护一套壳层私有配色。 -->
<template>
	<div
		class="app-slider"
		:class="{
			'is-collapse': app.isFold
		}"
	>
		<div class="app-slider__logo">
			<img src="/logo.png" />
			<span v-if="!app.isFold || browser.isMini">{{ app.info.name }}</span>
		</div>

		<div class="app-slider__section" v-if="app.info.menu.isGroup && currentGroupName">
			<div class="app-slider__section-label">{{ currentGroupName }}</div>
			<div class="app-slider__section-tip">当前业务域菜单</div>
		</div>

		<div class="app-slider__search">
			<el-input
				v-model="keyWord"
				:placeholder="$t('搜索关键字')"
				clearable
				@focus="app.fold(false)"
			>
				<template #prefix>
					<cl-svg name="search" :size="16" />
				</template>
			</el-input>
		</div>

		<div class="app-slider__container">
			<el-scrollbar>
				<b-menu :keyWord="keyWord" />
			</el-scrollbar>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'app-slider'
});

import { useBase } from '/$/base';
import { useBrowser } from '/@/cool';
import BMenu from './bmenu';
import { computed, ref } from 'vue';

const { browser } = useBrowser();
const { app, menu } = useBase();

const keyWord = ref('');
const currentGroupName = computed(() => menu.currentGroup?.meta?.label || '');
</script>

<style lang="scss">
.app-slider {
	$slider-menu-height: 50px;
	--slider-bg-color: var(--app-nav-surface);
	--slider-text-color: var(--app-nav-text);
	--slider-title-color: var(--app-nav-title);
	--slider-section-bg: var(--app-nav-section-bg);
	--slider-section-border: var(--app-nav-section-border);
	--slider-section-tip-color: var(--app-nav-section-tip);
	--slider-search-bg: var(--app-nav-search-bg);
	--slider-badge-bg: var(--app-nav-badge-bg);
	--slider-badge-text: var(--app-nav-badge-text);
	--slider-item-hover-bg: var(--app-nav-hover-bg);
	--slider-item-hover-color: var(--app-nav-hover-text);

	height: 100%;
	display: flex;
	flex-direction: column;
	background-color: var(--slider-bg-color);
	border-right: 1px solid var(--app-shell-border);

	&__logo {
		display: flex;
		align-items: center;
		height: 66px;
		padding: 0 21px;
		user-select: none;

		img {
			height: 24px;
			width: 24px;
		}

		span {
			color: var(--slider-title-color);
			font-weight: bold;
			font-size: 20px;
			margin-left: 10px;
			white-space: nowrap;
			letter-spacing: 1px;
		}
	}

	&__section {
		margin: 0 12px 10px;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--slider-section-bg);
		border: 1px solid var(--slider-section-border);
		overflow: hidden;
	}

	&__section-label {
		color: var(--slider-title-color);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	&__section-tip {
		margin-top: 4px;
		color: var(--slider-section-tip-color);
		font-size: 11px;
	}

	&__search {
		margin: 0 10px 10px 10px;
		overflow: hidden;
		border-radius: 6px;

		.el-input__wrapper {
			background-color: var(--slider-search-bg);
			box-shadow: none;
			height: 36px;
			padding: 0 14px;

			.el-input__inner {
				color: var(--slider-text-color);
			}
		}
	}

	&__container {
		flex: 1;
		min-height: 0;
	}

	&__menu {
		user-select: none;

		.b-menu__badge {
			display: flex;
			align-items: center;
			justify-content: center;
			height: $slider-menu-height;
			font-size: 10px;
			height: 14px;
			min-width: 14px;
			padding: 0 3px;
			border-radius: 4px;
			background-color: var(--slider-badge-bg);
			font-weight: bold;
			color: var(--slider-badge-text);
			transition: background-color 0.3s;
		}

		.el-menu {
			width: 100%;
			border-right: 0;
			background-color: transparent;

			&--popup {
				border-radius: 6px;
				padding: 5px;

				&-container {
					padding: 0;
				}

				.el-menu-item,
				.el-sub-menu__title {
					height: $slider-menu-height;
					border-radius: 6px;

					&:hover {
						background-color: var(--el-fill-color-light);
					}
				}
			}

			&:not(&--popup) {
				--el-menu-base-level-padding: 23px;

				.el-menu-item,
				.el-sub-menu__title {
					height: $slider-menu-height;
					color: var(--slider-text-color);

					.cl-svg {
						flex-shrink: 0;
					}

					&.is-active,
					&:hover {
						background-color: var(--slider-item-hover-bg);
						color: var(--slider-item-hover-color);
					}

					&.is-active {
						background-color: var(--el-color-primary);
					}
				}
			}
		}
	}

	&.is-collapse {
		.app-slider__section {
			padding-left: 10px;
			padding-right: 10px;
		}

		.app-slider__section-label,
		.app-slider__section-tip {
			opacity: 0;
		}

		.app-slider__search {
			.el-input__inner {
				opacity: 0;
			}
		}

		.app-slider__menu {
			.el-sub-menu {
				&.is-active {
					background-color: var(--slider-item-hover-bg);
				}
			}
		}
	}
}
</style>
