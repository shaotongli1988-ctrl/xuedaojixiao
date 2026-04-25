/**
 * 文件职责：封装 cool-uni 对 PIP 移动页的列表和详情读取；
 * 不负责创建编辑、跟进、完成关闭或导出；
 * 维护重点是只复用 pip 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	PipFetchInfoQuery,
	PipFetchPageRequest,
	PipPageResult,
	PipRecord,
} from "/@/types/performance-pip";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformancePipService {
	private requester = createServiceRequester("admin/performance/pip");

	permission = {
		page: PERMISSIONS.performance.pip.page,
		info: PERMISSIONS.performance.pip.info,
	};

	fetchPage(data: PipFetchPageRequest) {
		return this.requester.page(data) as Promise<PipPageResult>;
	}

	fetchInfo(params: PipFetchInfoQuery) {
		return this.requester.info(params) as Promise<PipRecord>;
	}
}

export const performancePipService = new PerformancePipService();
