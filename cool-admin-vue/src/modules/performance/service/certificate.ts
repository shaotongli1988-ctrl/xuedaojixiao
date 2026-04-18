/**
 * 人才发展与认证增强前端证书台账请求服务。
 * 这里只封装主题13冻结的 certificate 台账、详情、维护、发放和记录查询接口，
 * 不负责自动发证、课程结业判断或证书附件下载。
 */
import { BaseService } from '/@/cool';
import type {
	CertificateLedgerPageResult,
	CertificateRecord,
	CertificatePageResult
} from '../types';

export default class PerformanceCertificateService extends BaseService {
	permission = {
		page: 'performance:certificate:page',
		info: 'performance:certificate:info',
		add: 'performance:certificate:add',
		update: 'performance:certificate:update',
		issue: 'performance:certificate:issue',
		recordPage: 'performance:certificate:recordPage'
	};

	constructor() {
		super('admin/performance/certificate');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		category?: string;
		status?: string;
	}) {
		return super.page(data) as unknown as Promise<CertificatePageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<CertificateRecord>;
	}

	createCertificate(data: Partial<CertificateRecord>) {
		return super.add(data) as unknown as Promise<CertificateRecord>;
	}

	updateCertificate(data: Partial<CertificateRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<CertificateRecord>;
	}

	issueCertificate(data: {
		certificateId: number;
		employeeId: number;
		issuedAt: string;
		remark?: string;
		sourceCourseId?: number | null;
	}) {
		return this.request({
			url: '/issue',
			method: 'POST',
			data
		}) as unknown as Promise<void>;
	}

	fetchRecordPage(data: {
		page: number;
		size: number;
		certificateId?: number;
		employeeId?: number;
		status?: string;
		departmentId?: number;
	}) {
		return this.request({
			url: '/recordPage',
			method: 'POST',
			data
		}) as unknown as Promise<CertificateLedgerPageResult>;
	}
}

export const performanceCertificateService = new PerformanceCertificateService();
