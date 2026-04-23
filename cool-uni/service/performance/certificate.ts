/**
 * 文件职责：封装 cool-uni 对证书管理移动页的列表和详情读取；
 * 不负责证书发放、发放记录、来源课程跳转或桌面端维护动作；
 * 维护重点是只复用 certificate 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	CertificateInfoQuery,
	CertificatePageQuery,
	CertificatePageResult,
	CertificateRecord,
} from "/@/types/performance-certificate";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceCertificateService {
	private requester = createServiceRequester("admin/performance/certificate");

	permission = {
		page: PERMISSIONS.performance.certificate.page,
		info: PERMISSIONS.performance.certificate.info,
	};

	fetchPage(data: CertificatePageQuery) {
		return this.requester.page(data) as Promise<CertificatePageResult>;
	}

	fetchInfo(params: CertificateInfoQuery) {
		return this.requester.info(params) as Promise<CertificateRecord>;
	}
}

export const performanceCertificateService = new PerformanceCertificateService();
