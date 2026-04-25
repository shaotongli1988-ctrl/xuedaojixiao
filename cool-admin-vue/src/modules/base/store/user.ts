import { defineStore } from 'pinia';
import { ref } from 'vue';
import { storage } from '/@/cool/utils';
import { service, router } from '/@/cool';

// 本地缓存
const data = storage.info();

function parseTokenPayload(token?: string) {
	const rawToken = String(token || '').trim();

	if (!rawToken) {
		return null;
	}

	const segments = rawToken.split('.');

	if (segments.length < 2) {
		return null;
	}

	try {
		const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
		const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
		return JSON.parse(globalThis.atob(normalized));
	} catch (error) {
		return null;
	}
}

function mergeUserRuntimeInfo(value: any, token?: string) {
	if (!value) {
		return value;
	}

	const tokenPayload = parseTokenPayload(token);

	return {
		...value,
		permissionMask: value.permissionMask || tokenPayload?.permissionMask || '',
		isAdmin: typeof value.isAdmin === 'boolean' ? value.isAdmin : tokenPayload?.isAdmin === true
	};
}

export const useUserStore = defineStore('user', function () {
	// 标识
	const token = ref<string>(data.token);

	// 设置标识
	function setToken(data: {
		token: string;
		expire: number;
		refreshToken: string;
		refreshExpire: number;
	}) {
		// 请求的唯一标识
		token.value = data.token;
		storage.set('token', data.token, data.expire);

		// 刷新 token 的唯一标识
		storage.set('refreshToken', data.refreshToken, data.refreshExpire);

		if (info.value) {
			set(info.value);
		}
	}

	// 刷新标识
	async function refreshToken(): Promise<string> {
		return new Promise((resolve, reject) => {
			service.base.open
				.refreshToken({
					refreshToken: storage.get('refreshToken')
				})
				.then(res => {
					setToken(res);
					resolve(res.token);
				})
				.catch(err => {
					logout();
					reject(err);
				});
		});
	}

	// 用户信息
	const info = ref<Eps.BaseSysUserEntity | null>(mergeUserRuntimeInfo(data.userInfo, data.token));

	// 设置用户信息
	function set(value: any) {
		const nextValue = mergeUserRuntimeInfo(value, token.value);
		info.value = nextValue;
		storage.set('userInfo', nextValue);
	}

	// 清除用户
	function clear() {
		storage.remove('userInfo');
		storage.remove('token');
		token.value = '';
		info.value = null;
	}

	// 退出
	async function logout() {
		clear();
		router.clear();
		router.push('/login');
	}

	// 获取用户信息
	async function get() {
		return service.base.comm.person().then(res => {
			set(res);
			return res;
		});
	}

	return {
		token,
		info,
		get,
		set,
		logout,
		clear,
		setToken,
		refreshToken
	};
});
