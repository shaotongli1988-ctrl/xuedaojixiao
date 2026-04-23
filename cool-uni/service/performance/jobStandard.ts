/**
 * 文件职责：封装 cool-uni 对职位标准移动页的列表和详情读取；
 * 不负责启停用、新增编辑或招聘链路跳转；
 * 维护重点是只复用 jobStandard 已有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	JobStandardInfoQuery,
	JobStandardPageQuery,
	JobStandardPageResult,
	JobStandardRecord,
} from "/@/types/performance-job-standard";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceJobStandardService {
	private requester = createServiceRequester("admin/performance/jobStandard");

	permission = {
		page: PERMISSIONS.performance.jobStandard.page,
		info: PERMISSIONS.performance.jobStandard.info,
	};

	fetchPage(data: JobStandardPageQuery) {
		return this.requester.page(data) as Promise<JobStandardPageResult>;
	}

	fetchInfo(params: JobStandardInfoQuery) {
		return this.requester.info(params) as Promise<JobStandardRecord>;
	}
}

export const performanceJobStandardService = new PerformanceJobStandardService();
