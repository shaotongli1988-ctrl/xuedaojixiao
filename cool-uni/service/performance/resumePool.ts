/**
 * 文件职责：封装 cool-uni 对简历池移动页的列表和详情读取；
 * 不负责附件、导入导出、转人才资产或发起面试；
 * 维护重点是只复用 resumePool 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	ResumePoolInfoQuery,
	ResumePoolPageQuery,
	ResumePoolPageResult,
	ResumePoolRecord,
} from "/@/types/performance-resume-pool";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceResumePoolService {
	private requester = createServiceRequester("admin/performance/resumePool");

	permission = {
		page: PERMISSIONS.performance.resumePool.page,
		info: PERMISSIONS.performance.resumePool.info,
	};

	fetchPage(data: ResumePoolPageQuery) {
		return this.requester.page(data) as Promise<ResumePoolPageResult>;
	}

	fetchInfo(params: ResumePoolInfoQuery) {
		return this.requester.info(params) as Promise<ResumePoolRecord>;
	}
}

export const performanceResumePoolService = new PerformanceResumePoolService();
