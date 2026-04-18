/**
 * 文件职责：为 cool-uni 的本地业务 service 提供最小 namespaced request 组合能力；不负责登录态刷新、鉴权语义或页面态编排；依赖既有 config.baseUrl 与 cool/request；维护重点是 URL 拼接、GET/POST 参数位置与原 BaseService 保持一致。
 */
import { config } from "/@/config";
import request from "./request";

type ServiceRequestOptions = {
	url?: string;
	method?: string;
	data?: any;
	params?: any;
	proxy?: boolean;
	[key: string]: any;
};

export function createServiceRequester(namespace: string) {
	function send(options: ServiceRequestOptions = {}) {
		let url = options.url || "";

		if (url && url.indexOf("http") < 0) {
			url = namespace + url;

			if (options.proxy !== false) {
				url = config.baseUrl + "/" + url;
			}
		}

		return request({
			...options,
			url,
			data: options.method?.toUpperCase() === "POST" ? options.data : options.params,
		});
	}

	return {
		request: send,
		page(data: any) {
			return send({
				url: "/page",
				method: "POST",
				data,
			});
		},
		info(params: any) {
			return send({
				url: "/info",
				params,
			});
		},
		update(data: any) {
			return send({
				url: "/update",
				method: "POST",
				data,
			});
		},
	};
}
