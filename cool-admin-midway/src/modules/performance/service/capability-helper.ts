/**
 * 主题13能力地图纯逻辑工具。
 * 这里负责能力模型状态流转、输入裁剪和摘要数组归一化，不处理数据库、权限上下文或路由编排。
 */
import { CoolCommException } from '@cool-midway/core';

export type CapabilityModelStatus = 'draft' | 'active' | 'archived';

export const CAPABILITY_MODEL_STATUSES: CapabilityModelStatus[] = [
  'draft',
  'active',
  'archived',
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
    throw new CoolCommException('能力模型状态不合法');
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
      throw new CoolCommException('新增能力模型状态只能为 draft');
    }
    return;
  }

  if (!currentStatus) {
    throw new CoolCommException('当前状态缺失');
  }

  if (currentStatus === 'archived') {
    throw new CoolCommException('当前状态不允许编辑');
  }

  if (currentStatus === 'draft' && nextStatus !== 'draft' && nextStatus !== 'active') {
    throw new CoolCommException('当前状态不允许流转到目标状态');
  }

  if (currentStatus === 'active' && nextStatus !== 'active' && nextStatus !== 'archived') {
    throw new CoolCommException('当前状态不允许流转到目标状态');
  }
}
