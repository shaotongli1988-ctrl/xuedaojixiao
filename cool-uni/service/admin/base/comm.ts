/**
 * 文件职责：封装 cool-uni 对后台通用登录后接口的复用访问；不负责业务页数据聚合、角色推断或缓存策略；依赖现有 admin/base/comm 接口；维护重点是 person、permmenu、logout 的调用路径和返回语义不得漂移。
 */
import { createServiceRequester } from "/@/cool/service/requester";

export interface AdminPermMenu {
	perms: string[];
	menus: any[];
}

export default class AdminBaseCommService {
	private requester = createServiceRequester("admin/base/comm");

	constructor() {
		this.requester = createServiceRequester("admin/base/comm");
	}

	person() {
		return this.requester.request({
			url: "/person",
			method: "GET",
		}) as Promise<any>;
	}

	personUpdate(data: any) {
		return this.requester.request({
			url: "/personUpdate",
			method: "POST",
			data,
		}) as Promise<void>;
	}

	permmenu() {
		return this.requester.request({
			url: "/permmenu",
			method: "GET",
		}) as Promise<AdminPermMenu>;
	}

	logout() {
		return this.requester.request({
			url: "/logout",
			method: "POST",
		}) as Promise<void>;
	}
}

export const adminBaseCommService = new AdminBaseCommService();
