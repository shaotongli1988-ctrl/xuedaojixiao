<template>
	<div class="error-page">
		<div class="error-page__wrap">
			<h1 class="error-page__code">
				<span v-for="c in codes" :key="c">
					{{ c }}
				</span>
			</h1>
			<p class="error-page__desc">{{ desc }}</p>

			<template v-if="user.token || isLogout">
				<div class="error-page__btns">
					<el-button @click="home">{{ $t('返回首页') }}</el-button>
					<el-button type="primary" @click="reLogin">{{ $t('重新登录') }}</el-button>
				</div>
			</template>

			<template v-else>
				<div class="error-page__btns">
					<el-button type="primary" @click="toLogin">{{ $t('返回登录页') }}</el-button>
				</div>
			</template>
		</div>

		<div class="error-page__bg is-tl">
			<cl-svg name="bg" />
		</div>

		<div class="error-page__bg is-br">
			<cl-svg name="bg" />
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'error-page'
});

import { computed, ref } from 'vue';
import { useCool } from '/@/cool';
import { useBase } from '/$/base';

const props = defineProps({
	code: Number,
	desc: String
});

const { router } = useCool();
const { user } = useBase();

const isLogout = ref(false);

const codes = computed(() => {
	return (props.code || '').toString().split('');
});

function toLogin() {
	router.push('/login');
}

async function reLogin() {
	isLogout.value = true;
	user.logout();
}

function home() {
	router.push('/');
}
</script>

<style lang="scss" scoped>
@use '../../../../../styles/patterns.auth-shell.scss' as authShell;

.error-page {
	@include authShell.auth-page-shell;

	&__wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		position: relative;
		z-index: 9;
	}

	&__bg {
		@include authShell.auth-illustration;
		width: 50%;

		.cl-svg {
			opacity: 0.92;
		}

		&.is-tl {
			left: 0;
			top: 0;
			transform: rotate(180deg) scaleY(-1);
		}

		&.is-br {
			top: 0;
			right: 0;
			transform: scaleY(-1);
		}
	}

	&__code {
		font-size: 120px;
		font-weight: normal;
		color: var(--app-auth-error-text);
		font-family: Consolas;
		margin-top: -40px;
		animation: dou 1s infinite linear;
		position: relative;
	}

	&__desc {
		font-size: 16px;
		font-weight: 400;
		color: var(--app-auth-error-text);
		margin-top: 30px;
	}

	&__btns {
		display: flex;
		margin-top: 40px;

		.el-button {
			margin: 0 10px;
		}
	}
}
</style>
