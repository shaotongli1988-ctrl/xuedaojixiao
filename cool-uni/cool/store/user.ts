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
	PERMISSION_BIT_BY_KEY,
	hasPermissionBit,
	resolvePermissionMask,
} from "/@/generated/permission-bits.generated";
import {
	canAccessMobileRoute,
	resolveMobileRoleKind,
	resolveWorkbenchPages,
} from "/@/types/performance-mobile";
import { resolveMobilePerformanceRoleFact } from "../utils/performance-role-fact";

const data = storage.info();
const storedPerms = storage.get("userPerms") || [];
const storedWorkbenchPages = storage.get("userWorkbenchPages") || [];
const storedPerformanceAccessContext = storage.get("userPerformanceAccessContext") || null;

function uniqueStrings(values: string[]) {
	return Array.from(new Set((values || []).filter(Boolean)));
}

const useUserStore = defineStore("user", function () {
	const token = ref(data.token || "");
	const performanceAccessContextSynced = ref(false);
	let performanceAccessContextSyncPromise: Promise<any> | null = null;

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
	const performanceAccessContext = ref<any>(storedPerformanceAccessContext);
	const roleKind = computed(
		() => performanceAccessContext.value?.roleKind || resolveMobileRoleKind(perms.value),
	);
	const roleFact = computed(() =>
		resolveMobilePerformanceRoleFact({
			activePersonaKey: performanceAccessContext.value?.activePersonaKey || null,
			roleKind: roleKind.value,
		}),
	);
	const roleLabel = computed(() => roleFact.value.roleLabel);
	const permissionMask = computed(() => {
		const tokenPermissionMask = String(info.value?.permissionMask || "").trim();
		return tokenPermissionMask || resolvePermissionMask(perms.value || []);
	});

	function hasPerm(value: string) {
		const permissionBit =
			PERMISSION_BIT_BY_KEY[String(value || "").trim() as keyof typeof PERMISSION_BIT_BY_KEY];

		if (permissionBit === undefined) {
			return false;
		}

		return hasPermissionBit(permissionMask.value, permissionBit);
	}

	function canAccessRoute(path: string) {
		return canAccessMobileRoute(path, perms.value);
	}

	function set(value: User.Info) {
		info.value = value;
		storage.set("userInfo", value);

		if (value && (value as any).performanceAccessContext) {
			performanceAccessContext.value = (value as any).performanceAccessContext;
			storage.set("userPerformanceAccessContext", (value as any).performanceAccessContext);
		}
	}

	function setPermContext(value: { perms?: string[]; performanceAccessContext?: any }) {
		const nextPerms = uniqueStrings(value?.perms || []);
		const nextPerformanceAccessContext =
			value?.performanceAccessContext || performanceAccessContext.value || null;
		const nextWorkbenchPages =
			Array.isArray(nextPerformanceAccessContext?.workbenchPages) &&
			nextPerformanceAccessContext.workbenchPages.length
				? uniqueStrings(nextPerformanceAccessContext.workbenchPages)
				: resolveWorkbenchPages(nextPerms);

		perms.value = nextPerms;
		workbenchPages.value = nextWorkbenchPages;
		performanceAccessContext.value = nextPerformanceAccessContext;
		performanceAccessContextSynced.value = true;

		storage.set("userPerms", nextPerms);
		storage.set("userWorkbenchPages", nextWorkbenchPages);
		if (nextPerformanceAccessContext) {
			storage.set("userPerformanceAccessContext", nextPerformanceAccessContext);
		} else {
			storage.remove("userPerformanceAccessContext");
		}
	}

	async function fetchPermMenu() {
		return adminBaseCommService.permmenu().then((res: any) => {
			setPermContext(res || {});
			return res;
		});
	}

	async function refreshPerformanceAccessContext() {
		if (performanceAccessContextSyncPromise) {
			return performanceAccessContextSyncPromise;
		}

		performanceAccessContextSyncPromise = adminBaseCommService
			.performanceAccessContext()
			.then((res: any) => {
				setPermContext({
					perms: perms.value,
					performanceAccessContext: res,
				});
				return res;
			})
			.finally(() => {
				performanceAccessContextSyncPromise = null;
			});

		return performanceAccessContextSyncPromise;
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
		storage.remove("userPerformanceAccessContext");
		token.value = "";
		info.value = undefined;
		perms.value = [];
		workbenchPages.value = [];
		performanceAccessContext.value = null;
		performanceAccessContextSynced.value = false;
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
		} else if (!performanceAccessContextSynced.value) {
			tasks.push(refreshPerformanceAccessContext());
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
		roleFact,
		roleLabel,
		performanceAccessContext,
		permissionMask,
		hasPerm,
		canAccessRoute,
		fetchPermMenu,
		refreshPerformanceAccessContext,
		hydrate,
		logout,
	};
});

export { useUserStore };
