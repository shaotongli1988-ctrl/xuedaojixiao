/**
 * 文件职责：封装 cool-uni 对后台开放登录接口的复用访问；不负责用户状态持久化、页面跳转或业务权限判断；依赖现有 admin/base/open 接口；维护重点是验证码、登录、刷新 token 的请求语义必须与后台保持一致。
 */
import { createServiceRequester } from "/@/cool/service/requester";

export default class AdminBaseOpenService {
	private requester = createServiceRequester("admin/base/open");

	constructor() {
		this.requester = createServiceRequester("admin/base/open");
	}

	captcha(params?: { width?: number; height?: number; color?: string }) {
		return this.requester.request({
			url: "/captcha",
			method: "GET",
			params,
		}) as Promise<{
			captchaId: string;
			data: string;
		}>;
	}

	login(data: {
		username: string;
		password: string;
		captchaId: string;
		verifyCode: string;
	}) {
		return this.requester.request({
			url: "/login",
			method: "POST",
			data,
		}) as Promise<{
			token: string;
			expire: number;
			refreshToken: string;
			refreshExpire: number;
		}>;
	}

	refreshToken(params: { refreshToken: string }) {
		return this.requester.request({
			url: "/refreshToken",
			method: "GET",
			params,
		}) as Promise<{
			token: string;
			expire: number;
			refreshToken: string;
			refreshExpire: number;
		}>;
	}
}

export const adminBaseOpenService = new AdminBaseOpenService();
