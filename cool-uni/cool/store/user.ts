/**
 * 文件职责：维护 cool-uni 的登录态、当前用户最小身份信息和首批页面权限上下文；不负责具体页面渲染、业务数据缓存或后端权限判定；依赖 admin/base/open、admin/base/comm 本地 service 与全局 storage；维护重点是 token、refreshToken、permmenu 派生白名单和退出清理必须保持一致。
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { deepMerge, storage } from "../utils";
import { router } from "../router";
import type { User } from "../types";
import { adminBaseCommService } from "/@/service/admin/base/comm";
import { adminBaseOpenService } from "/@/service/admin/base/open";
import {
	canAccessMobileRoute,
	resolveMobileRoleKind,
	resolveWorkbenchPages,
} from "/@/types/performance-mobile";

const data = storage.info();
const storedPerms = storage.get("userPerms") || [];
const storedWorkbenchPages = storage.get("userWorkbenchPages") || [];

function uniqueStrings(values: string[]) {
	return Array.from(new Set((values || []).filter(Boolean)));
}

function hasPermValue(perms: string[], target: string) {
	return (perms || []).some((item) => {
		const normalizedItem = String(item || "").replace(/\s/g, "");
		const normalizedTarget = target.replace(/\s/g, "");

		return (
			normalizedItem === normalizedTarget ||
			normalizedItem.includes(normalizedTarget.replace(/:/g, "/"))
		);
	});
}

const useUserStore = defineStore("user", function () {
	const token = ref(data.token || "");

	function setToken(data: User.Token) {
		token.value = data.token;
		storage.set("token", data.token, data.expire - 5);
		storage.set("refreshToken", data.refreshToken, data.refreshExpire - 5);
	}

	async function refreshToken() {
		return adminBaseOpenService
			.refreshToken({
				refreshToken: storage.get("refreshToken"),
			})
			.then((res: any) => {
				setToken(res);
				return res.token;
			});
	}

	const info = ref<User.Info | undefined>(data.userInfo);
	const perms = ref<string[]>(storedPerms);
	const workbenchPages = ref<string[]>(storedWorkbenchPages);
	const roleKind = computed(() => resolveMobileRoleKind(perms.value));

	function hasPerm(value: string) {
		return hasPermValue(perms.value, value);
	}

	function canAccessRoute(path: string) {
		return canAccessMobileRoute(path, perms.value);
	}

	function set(value: User.Info) {
		info.value = value;
		storage.set("userInfo", value);
	}

	function setPermContext(value: { perms?: string[] }) {
		const nextPerms = uniqueStrings(value?.perms || []);
		const nextWorkbenchPages = resolveWorkbenchPages(nextPerms);

		perms.value = nextPerms;
		workbenchPages.value = nextWorkbenchPages;

		storage.set("userPerms", nextPerms);
		storage.set("userWorkbenchPages", nextWorkbenchPages);
	}

	async function fetchPermMenu() {
		return adminBaseCommService.permmenu().then((res: any) => {
			setPermContext(res || {});
			return res;
		});
	}

	async function update(data: User.Info & { [key: string]: any }) {
		set(deepMerge(info.value, data));
		return Promise.resolve(data);
	}

	function clear() {
		storage.remove("userInfo");
		storage.remove("token");
		storage.remove("refreshToken");
		storage.remove("userPerms");
		storage.remove("userWorkbenchPages");
		token.value = "";
		info.value = undefined;
		perms.value = [];
		workbenchPages.value = [];
	}

	async function logout(options?: { remote?: boolean; reLaunch?: boolean }) {
		if (options?.remote && token.value) {
			try {
				await adminBaseCommService.logout();
			} catch (error) {}
		}

		clear();

		if (options?.reLaunch !== false) {
			router.login({ reLaunch: true });
		}
	}

	async function get() {
		return adminBaseCommService
			.person()
			.then((res: any) => {
				if (res) {
					set(res);
				}
				return res;
			})
			.catch(() => {
				logout({ remote: false, reLaunch: true });
			});
	}

	async function hydrate() {
		if (!token.value) {
			return false;
		}

		const tasks: Promise<any>[] = [];

		if (!info.value) {
			tasks.push(get());
		}

		if (!perms.value.length) {
			tasks.push(fetchPermMenu());
		}

		if (tasks.length) {
			await Promise.all(tasks);
		}

		return workbenchPages.value.length > 0;
	}

	return {
		token,
		setToken,
		refreshToken,
		info,
		get,
		set,
		update,
		perms,
		workbenchPages,
		roleKind,
		hasPerm,
		canAccessRoute,
		fetchPermMenu,
		hydrate,
		logout,
	};
});

export { useUserStore };
