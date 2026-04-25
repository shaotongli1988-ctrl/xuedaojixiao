/**
 * 主题13证书台账纯逻辑工具。
 * 这里负责证书状态流转、发放输入归一化和可空 sourceCourseId 规则，不处理数据库、权限上下文或课程结业校验。
 */
import { CoolCommException } from '@cool-midway/core';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

export type CertificateStatus = 'draft' | 'active' | 'retired';
export type CertificateRecordStatus = 'issued' | 'revoked';

interface CertificateOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const CERTIFICATE_STATUSES: CertificateStatus[] = [
  'draft',
  'active',
  'retired',
];

export const CERTIFICATE_RECORD_STATUSES: CertificateRecordStatus[] = [
  'issued',
  'revoked',
];

export const CERTIFICATE_STATUS_DICT_KEY = 'performance.certificate.status';
export const CERTIFICATE_RECORD_STATUS_DICT_KEY =
  'performance.certificate.recordStatus';
export const CERTIFICATE_DICT_VERSION = 'certificate-v1';
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_MISSING_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateMissing
  );
const PERFORMANCE_NUMERIC_FIELD_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.numericFieldInvalid
  );
const PERFORMANCE_EMPLOYEE_ID_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeIdInvalid
  );
const PERFORMANCE_STATE_TRANSITION_TARGET_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateTransitionTargetNotAllowed
  );
const PERFORMANCE_CERTIFICATE_ID_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.certificateIdInvalid
  );
const PERFORMANCE_CERTIFICATE_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.certificateStatusInvalid
  );
const PERFORMANCE_CERTIFICATE_RECORD_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.certificateRecordStatusInvalid
  );
const PERFORMANCE_CERTIFICATE_ADD_DRAFT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.certificateAddDraftOnly
  );

const CERTIFICATE_STATUS_OPTIONS: ReadonlyArray<CertificateOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'active',
    label: '已启用',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'retired',
    label: '已停用',
    orderNum: 30,
    tone: 'info',
  },
];

const CERTIFICATE_RECORD_STATUS_OPTIONS: ReadonlyArray<CertificateOption> = [
  {
    value: 'issued',
    label: '已发放',
    orderNum: 10,
    tone: 'success',
  },
  {
    value: 'revoked',
    label: '已撤销',
    orderNum: 20,
    tone: 'danger',
  },
];

function createBusinessDictItems(
  dictKey: string,
  options: ReadonlyArray<CertificateOption>
): BusinessDictItem[] {
  return options.map(option => ({
    id: `${dictKey}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getCertificateBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: CERTIFICATE_STATUS_DICT_KEY,
      version: CERTIFICATE_DICT_VERSION,
      items: createBusinessDictItems(
        CERTIFICATE_STATUS_DICT_KEY,
        CERTIFICATE_STATUS_OPTIONS
      ),
    },
    {
      key: CERTIFICATE_RECORD_STATUS_DICT_KEY,
      version: CERTIFICATE_DICT_VERSION,
      items: createBusinessDictItems(
        CERTIFICATE_RECORD_STATUS_DICT_KEY,
        CERTIFICATE_RECORD_STATUS_OPTIONS
      ),
    },
  ];
}

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
    throw new CoolCommException(PERFORMANCE_CERTIFICATE_STATUS_INVALID_MESSAGE);
  }

  return status;
}

export function normalizeCertificateRecordStatus(
  value: any
): CertificateRecordStatus {
  const status = String(value || '').trim() as CertificateRecordStatus;

  if (!CERTIFICATE_RECORD_STATUSES.includes(status)) {
    throw new CoolCommException(
      PERFORMANCE_CERTIFICATE_RECORD_STATUS_INVALID_MESSAGE
    );
  }

  return status;
}

export function normalizeOptionalPositiveNumber(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(PERFORMANCE_NUMERIC_FIELD_INVALID_MESSAGE);
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
      throw new CoolCommException(
        PERFORMANCE_CERTIFICATE_ADD_DRAFT_ONLY_MESSAGE
      );
    }
    return;
  }

  if (!currentStatus) {
    throw new CoolCommException(PERFORMANCE_STATE_MISSING_MESSAGE);
  }

  if (currentStatus === 'retired') {
    throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
  }

  if (currentStatus === 'draft' && nextStatus !== 'draft' && nextStatus !== 'active') {
    throw new CoolCommException(
      PERFORMANCE_STATE_TRANSITION_TARGET_NOT_ALLOWED_MESSAGE
    );
  }

  if (currentStatus === 'active' && nextStatus !== 'active' && nextStatus !== 'retired') {
    throw new CoolCommException(
      PERFORMANCE_STATE_TRANSITION_TARGET_NOT_ALLOWED_MESSAGE
    );
  }
}

export function normalizeIssuePayload(payload: any) {
  const certificateId = Number(payload.certificateId || 0);
  const employeeId = Number(payload.employeeId || 0);

  if (!Number.isInteger(certificateId) || certificateId <= 0) {
    throw new CoolCommException(PERFORMANCE_CERTIFICATE_ID_INVALID_MESSAGE);
  }

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new CoolCommException(PERFORMANCE_EMPLOYEE_ID_INVALID_MESSAGE);
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
