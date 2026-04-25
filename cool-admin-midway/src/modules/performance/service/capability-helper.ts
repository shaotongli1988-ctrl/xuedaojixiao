/**
 * 主题13能力地图纯逻辑工具。
 * 这里负责能力模型状态流转、输入裁剪和摘要数组归一化，不处理数据库、权限上下文或路由编排。
 */
import { CoolCommException } from '@cool-midway/core';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import { CAPABILITY_MODEL_STATUS_VALUES } from './capability-dict';

export type CapabilityModelStatus =
  (typeof CAPABILITY_MODEL_STATUS_VALUES)[number];

export const CAPABILITY_MODEL_STATUSES: CapabilityModelStatus[] = [
  ...CAPABILITY_MODEL_STATUS_VALUES,
];
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_MISSING_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateMissing
  );
const PERFORMANCE_STATE_TRANSITION_TARGET_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateTransitionTargetNotAllowed
  );
const PERFORMANCE_CAPABILITY_MODEL_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelStatusInvalid
  );
const PERFORMANCE_CAPABILITY_MODEL_ADD_DRAFT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelAddDraftOnly
  );

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

export const normalizeCapabilityOptionalText = (
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

export const normalizeCapabilityArray = (value: any) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 20)
    )
  );
};

export function normalizeCapabilityModelPayload(payload: any) {
  return {
    name: normalizeText(payload.name, 200, '模型名称'),
    code: normalizeCapabilityOptionalText(payload.code, 100, '模型编码'),
    category: normalizeCapabilityOptionalText(payload.category, 100, '模型分类'),
    description: normalizeCapabilityOptionalText(
      payload.description,
      5000,
      '模型说明'
    ),
    status: normalizeCapabilityModelStatus(payload.status || 'draft'),
  };
}

export function normalizeCapabilityModelStatus(value: any): CapabilityModelStatus {
  const status = String(value || '').trim() as CapabilityModelStatus;

  if (!CAPABILITY_MODEL_STATUSES.includes(status)) {
    throw new CoolCommException(
      PERFORMANCE_CAPABILITY_MODEL_STATUS_INVALID_MESSAGE
    );
  }

  return status;
}

export function assertCapabilityModelTransition(
  currentStatus: CapabilityModelStatus | undefined,
  nextStatus: CapabilityModelStatus,
  mode: 'add' | 'update'
) {
  if (mode === 'add') {
    if (nextStatus !== 'draft') {
      throw new CoolCommException(
        PERFORMANCE_CAPABILITY_MODEL_ADD_DRAFT_ONLY_MESSAGE
      );
    }
    return;
  }

  if (!currentStatus) {
    throw new CoolCommException(PERFORMANCE_STATE_MISSING_MESSAGE);
  }

  if (currentStatus === 'archived') {
    throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
  }

  if (currentStatus === 'draft' && nextStatus !== 'draft' && nextStatus !== 'active') {
    throw new CoolCommException(
      PERFORMANCE_STATE_TRANSITION_TARGET_NOT_ALLOWED_MESSAGE
    );
  }

  if (currentStatus === 'active' && nextStatus !== 'active' && nextStatus !== 'archived') {
    throw new CoolCommException(
      PERFORMANCE_STATE_TRANSITION_TARGET_NOT_ALLOWED_MESSAGE
    );
  }
}
