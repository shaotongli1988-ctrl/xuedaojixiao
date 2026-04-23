/**
 * cool-uni 证书管理移动页类型与展示文案。
 * 这里只定义证书台账列表最小字段，不处理发放记录、来源课程跳转或桌面端维护动作。
 */
export type {
	CertificatePageQuery,
	CertificateRecord,
} from "/@/generated/performance-certificate.generated";
export type { CertificatePageResult } from "/@/generated/performance-talent-development.generated";

export interface CertificateInfoQuery {
	id: number;
}
