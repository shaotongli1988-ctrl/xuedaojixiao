/**
 * 主题13证书台账纯逻辑工具。
 * 这里负责证书状态流转、发放输入归一化和可空 sourceCourseId 规则，不处理数据库、权限上下文或课程结业校验。
 */
import { CoolCommException } from '@cool-midway/core';

export type CertificateStatus = 'draft' | 'active' | 'retired';
export type CertificateRecordStatus = 'issued' | 'revoked';

export const CERTIFICATE_STATUSES: CertificateStatus[] = [
  'draft',
  'active',
  'retired',
];

export const CERTIFICATE_RECORD_STATUSES: CertificateRecordStatus[] = [
  'issued',
  'revoked',
];

const normalizeText = (value: any, maxLength: number, field: string) => {
  const text = String(value || '').trim();

  if (!text) {
    throw new CoolCommException(`${field}不能为空`);
  }

  if (text.length > maxLength) {
    throw new CoolCommException(`${field}长度不合法`);
  }

  return text;
};

export const normalizeCertificateOptionalText = (
  value: any,
  maxLength: number,
  field: string
) => {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    throw new CoolCommException(`${field}长度不合法`);
  }

  return text;
};

export function normalizeCertificateStatus(value: any): CertificateStatus {
  const status = String(value || '').trim() as CertificateStatus;

  if (!CERTIFICATE_STATUSES.includes(status)) {
    throw new CoolCommException('证书状态不合法');
  }

  return status;
}

export function normalizeCertificateRecordStatus(
  value: any
): CertificateRecordStatus {
  const status = String(value || '').trim() as CertificateRecordStatus;

  if (!CERTIFICATE_RECORD_STATUSES.includes(status)) {
    throw new CoolCommException('证书记录状态不合法');
  }

  return status;
}

export function normalizeOptionalPositiveNumber(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException('数字字段不合法');
  }

  return parsed;
}

export function normalizeCertificatePayload(payload: any) {
  const validityMonths = normalizeOptionalPositiveNumber(payload.validityMonths);
  const sourceCourseId = normalizeOptionalPositiveNumber(payload.sourceCourseId);

  return {
    name: normalizeText(payload.name, 200, '证书名称'),
    code: normalizeCertificateOptionalText(payload.code, 100, '证书编码'),
    category: normalizeCertificateOptionalText(payload.category, 100, '证书分类'),
    issuer: normalizeCertificateOptionalText(payload.issuer, 200, '发证机构'),
    description: normalizeCertificateOptionalText(
      payload.description,
      5000,
      '证书说明'
    ),
    validityMonths,
    sourceCourseId,
    status: normalizeCertificateStatus(payload.status || 'draft'),
  };
}

export function assertCertificateTransition(
  currentStatus: CertificateStatus | undefined,
  nextStatus: CertificateStatus,
  mode: 'add' | 'update'
) {
  if (mode === 'add') {
    if (nextStatus !== 'draft') {
      throw new CoolCommException('新增证书状态只能为 draft');
    }
    return;
  }

  if (!currentStatus) {
    throw new CoolCommException('当前状态缺失');
  }

  if (currentStatus === 'retired') {
    throw new CoolCommException('当前状态不允许编辑');
  }

  if (currentStatus === 'draft' && nextStatus !== 'draft' && nextStatus !== 'active') {
    throw new CoolCommException('当前状态不允许流转到目标状态');
  }

  if (currentStatus === 'active' && nextStatus !== 'active' && nextStatus !== 'retired') {
    throw new CoolCommException('当前状态不允许流转到目标状态');
  }
}

export function normalizeIssuePayload(payload: any) {
  const certificateId = Number(payload.certificateId || 0);
  const employeeId = Number(payload.employeeId || 0);

  if (!Number.isInteger(certificateId) || certificateId <= 0) {
    throw new CoolCommException('证书 ID 不合法');
  }

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new CoolCommException('员工 ID 不合法');
  }

  const issuedAt = normalizeText(payload.issuedAt, 19, '发放时间');
  const sourceCourseId = normalizeOptionalPositiveNumber(payload.sourceCourseId);

  return {
    certificateId,
    employeeId,
    issuedAt,
    remark: normalizeCertificateOptionalText(payload.remark, 1000, '发放备注'),
    sourceCourseId,
  };
}
