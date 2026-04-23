/**
 * 人才发展与认证增强前端证书台账请求服务。
 * 这里只封装主题13冻结的 certificate 台账、详情、维护、发放和记录查询接口，
 * 不负责自动发证、课程结业判断或证书附件下载。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeCertificateLedgerPageResult,
	decodeCertificatePageResult,
	decodeCertificateRecord
} from './certificate-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	CertificateIssueRequest,
	CertificateLedgerPageResult,
	CertificateInfoQuery,
	CertificatePageQuery,
	CertificatePageResult,
	CertificateRecord,
	CertificateRecordPageQuery
} from '../types';

export default class PerformanceCertificateService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.certificate.page,
		info: PERMISSIONS.performance.certificate.info,
		add: PERMISSIONS.performance.certificate.add,
		update: PERMISSIONS.performance.certificate.update,
		issue: PERMISSIONS.performance.certificate.issue,
		recordPage: PERMISSIONS.performance.certificate.recordPage
	};

	constructor() {
		super('admin/performance/certificate');
	}

	fetchPage(data: CertificatePageQuery) {
		return asPerformanceServicePromise<CertificatePageResult>(
			super.page(data),
			decodeCertificatePageResult
		);
	}

	fetchInfo(params: CertificateInfoQuery) {
		return asPerformanceServicePromise<CertificateRecord>(
			super.info(params),
			decodeCertificateRecord
		);
	}

	createCertificate(data: CertificateRecord) {
		return asPerformanceServicePromise<CertificateRecord>(
			super.add(data),
			decodeCertificateRecord
		);
	}

	updateCertificate(data: CertificateRecord & { id: number }) {
		return asPerformanceServicePromise<CertificateRecord>(
			super.update(data),
			decodeCertificateRecord
		);
	}

	issueCertificate(data: CertificateIssueRequest) {
		return asPerformanceServicePromise<void>(this.request({
			url: '/issue',
			method: 'POST',
			data
		}));
	}

	fetchRecordPage(data: CertificateRecordPageQuery) {
		return asPerformanceServicePromise<CertificateLedgerPageResult>(this.request({
			url: '/recordPage',
			method: 'POST',
			data
		}), decodeCertificateLedgerPageResult);
	}
}

export const performanceCertificateService = new PerformanceCertificateService();
