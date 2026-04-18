/**
 * 跨模块驾驶舱来源快照读取适配层。
 * 这里负责把招聘、培训、会议来源域的“聚合快照”统一适配为绩效模块可消费的输入结构，
 * 不负责任何来源域公式重算、原始明细读取、权限判断或 controller 出口。
 */
import { CoolCommException } from '@cool-midway/core';

export const CROSS_DASHBOARD_METRIC_DEFINITIONS = [
  {
    metricCode: 'recruitment_completion_rate',
    metricLabel: '招聘达成率',
    sourceDomain: 'recruitment',
    sort: 1,
  },
  {
    metricCode: 'training_pass_rate',
    metricLabel: '内训通关率',
    sourceDomain: 'training',
    sort: 2,
  },
  {
    metricCode: 'meeting_effectiveness_index',
    metricLabel: '会议效能看板',
    sourceDomain: 'meeting',
    sort: 3,
  },
] as const;

export type CrossDashboardMetricDefinition =
  (typeof CROSS_DASHBOARD_METRIC_DEFINITIONS)[number];
export type CrossDashboardMetricCode =
  CrossDashboardMetricDefinition['metricCode'];
export type CrossDashboardSourceDomain =
  CrossDashboardMetricDefinition['sourceDomain'];
export type CrossDashboardScopeType = 'global' | 'department_tree';
export type CrossDashboardDataStatus = 'ready' | 'delayed' | 'unavailable';
export type CrossDashboardPeriodType = 'month' | 'quarter' | 'year';

export interface CrossDashboardSnapshotReadQuery {
  periodType: CrossDashboardPeriodType;
  periodValue: string;
  scopeType: CrossDashboardScopeType;
  departmentId?: number | null;
  metricCodes?: CrossDashboardMetricCode[];
}

export interface CrossDashboardSourceSnapshot {
  metricCode: CrossDashboardMetricCode;
  metricLabel?: string | null;
  metricValue: number | string | null;
  unit: string | null;
  periodType: CrossDashboardPeriodType;
  periodValue: string;
  scopeType: CrossDashboardScopeType;
  deptKey?: number | string | null;
  updatedAt?: string | null;
  sourceStatus: CrossDashboardDataStatus;
  statusText?: string | null;
}

export interface CrossDashboardMetricInput {
  metricCode: CrossDashboardMetricCode;
  metricLabel: string;
  sourceDomain: CrossDashboardSourceDomain;
  metricValue: number | null;
  unit: string;
  periodType: CrossDashboardPeriodType;
  periodValue: string;
  scopeType: CrossDashboardScopeType;
  departmentId: number | null;
  updatedAt: string | null;
  dataStatus: CrossDashboardDataStatus;
  statusText: string;
  sort: number;
}

export interface CrossDashboardSnapshotProvider {
  domain: CrossDashboardSourceDomain;
  readSnapshots(
    query: Omit<CrossDashboardSnapshotReadQuery, 'metricCodes'> & {
      metricCodes: CrossDashboardMetricCode[];
    }
  ): Promise<CrossDashboardSourceSnapshot[]>;
}

const PERIOD_TYPES: CrossDashboardPeriodType[] = ['month', 'quarter', 'year'];
const SCOPE_TYPES: CrossDashboardScopeType[] = ['global', 'department_tree'];
const DATA_STATUSES: CrossDashboardDataStatus[] = [
  'ready',
  'delayed',
  'unavailable',
];

const METRIC_DEFINITION_MAP = CROSS_DASHBOARD_METRIC_DEFINITIONS.reduce<
  Record<CrossDashboardMetricCode, CrossDashboardMetricDefinition>
>((accumulator, item) => {
  accumulator[item.metricCode] = item;
  return accumulator;
}, {} as Record<CrossDashboardMetricCode, CrossDashboardMetricDefinition>);

export function normalizeCrossDashboardMetricCodes(metricCodes?: string[]) {
  if (!metricCodes?.length) {
    return CROSS_DASHBOARD_METRIC_DEFINITIONS.map(item => item.metricCode);
  }

  return Array.from(new Set(metricCodes.map(item => String(item).trim()))).map(
    metricCode => {
      if (!(metricCode in METRIC_DEFINITION_MAP)) {
        throw new CoolCommException('跨模块驾驶舱指标编码不合法');
      }
      return metricCode as CrossDashboardMetricCode;
    }
  );
}

export function normalizeCrossDashboardSnapshotReadQuery(
  query: CrossDashboardSnapshotReadQuery
) {
  if (!PERIOD_TYPES.includes(query.periodType)) {
    throw new CoolCommException('跨模块驾驶舱周期类型不合法');
  }

  const periodValue = String(query.periodValue || '').trim();
  if (!periodValue) {
    throw new CoolCommException('跨模块驾驶舱周期值不能为空');
  }

  if (!SCOPE_TYPES.includes(query.scopeType)) {
    throw new CoolCommException('跨模块驾驶舱范围类型不合法');
  }

  const departmentId =
    query.departmentId == null ? null : Number(query.departmentId);

  if (query.scopeType === 'department_tree') {
    if (!Number.isInteger(departmentId) || departmentId <= 0) {
      throw new CoolCommException('跨模块驾驶舱部门范围不合法');
    }
  }

  return {
    periodType: query.periodType,
    periodValue,
    scopeType: query.scopeType,
    departmentId,
    metricCodes: normalizeCrossDashboardMetricCodes(query.metricCodes),
  };
}

function normalizeMetricValue(value: number | string | null) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new CoolCommException('来源快照聚合值不合法');
  }
  return parsed;
}

function normalizeDepartmentId(
  scopeType: CrossDashboardScopeType,
  deptKey: number | string | null | undefined
) {
  if (scopeType === 'global') {
    return null;
  }

  const departmentId = Number(deptKey);
  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    throw new CoolCommException('来源快照缺少合法的部门范围标识');
  }
  return departmentId;
}

function createUnavailableMetricInput(
  definition: CrossDashboardMetricDefinition,
  query: ReturnType<typeof normalizeCrossDashboardSnapshotReadQuery>
): CrossDashboardMetricInput {
  return {
    metricCode: definition.metricCode,
    metricLabel: definition.metricLabel,
    sourceDomain: definition.sourceDomain,
    metricValue: null,
    unit: '',
    periodType: query.periodType,
    periodValue: query.periodValue,
    scopeType: query.scopeType,
    departmentId: query.scopeType === 'department_tree' ? query.departmentId : null,
    updatedAt: null,
    dataStatus: 'unavailable',
    statusText: '暂不可用',
    sort: definition.sort,
  };
}

export class PerformanceCrossDashboardSourceAdapter {
  private readonly providers = new Map<
    CrossDashboardSourceDomain,
    CrossDashboardSnapshotProvider
  >();

  constructor(providers: CrossDashboardSnapshotProvider[] = []) {
    this.useProviders(providers);
  }

  useProviders(providers: CrossDashboardSnapshotProvider[]) {
    this.providers.clear();
    providers.forEach(provider => {
      this.providers.set(provider.domain, provider);
    });
  }

  async readMetricInputs(query: CrossDashboardSnapshotReadQuery) {
    const normalizedQuery = normalizeCrossDashboardSnapshotReadQuery(query);
    const inputs = new Map<CrossDashboardMetricCode, CrossDashboardMetricInput>();

    CROSS_DASHBOARD_METRIC_DEFINITIONS.forEach(definition => {
      if (normalizedQuery.metricCodes.includes(definition.metricCode)) {
        inputs.set(
          definition.metricCode,
          createUnavailableMetricInput(definition, normalizedQuery)
        );
      }
    });

    const domainMetricCodes = new Map<
      CrossDashboardSourceDomain,
      CrossDashboardMetricCode[]
    >();

    normalizedQuery.metricCodes.forEach(metricCode => {
      const definition = METRIC_DEFINITION_MAP[metricCode];
      const metricCodes = domainMetricCodes.get(definition.sourceDomain) || [];
      metricCodes.push(metricCode);
      domainMetricCodes.set(definition.sourceDomain, metricCodes);
    });

    for (const [domain, metricCodes] of domainMetricCodes.entries()) {
      const provider = this.providers.get(domain);
      if (!provider) {
        continue;
      }

      const snapshots = await provider.readSnapshots({
        periodType: normalizedQuery.periodType,
        periodValue: normalizedQuery.periodValue,
        scopeType: normalizedQuery.scopeType,
        departmentId: normalizedQuery.departmentId,
        metricCodes,
      });

      for (const snapshot of snapshots || []) {
        const definition = METRIC_DEFINITION_MAP[snapshot.metricCode];

        if (!definition || definition.sourceDomain !== domain) {
          throw new CoolCommException('来源快照指标与来源域不匹配');
        }
        if (snapshot.periodType !== normalizedQuery.periodType) {
          throw new CoolCommException('来源快照周期类型不匹配');
        }
        if (snapshot.periodValue !== normalizedQuery.periodValue) {
          throw new CoolCommException('来源快照周期值不匹配');
        }
        if (!SCOPE_TYPES.includes(snapshot.scopeType)) {
          throw new CoolCommException('来源快照范围类型不合法');
        }
        if (snapshot.scopeType !== normalizedQuery.scopeType) {
          throw new CoolCommException('来源快照范围类型不匹配');
        }
        if (!DATA_STATUSES.includes(snapshot.sourceStatus)) {
          throw new CoolCommException('来源快照状态不合法');
        }

        const departmentId = normalizeDepartmentId(
          snapshot.scopeType,
          snapshot.deptKey
        );

        if (
          snapshot.scopeType === 'department_tree' &&
          departmentId !== normalizedQuery.departmentId
        ) {
          throw new CoolCommException('来源快照部门范围不匹配');
        }

        inputs.set(definition.metricCode, {
          metricCode: definition.metricCode,
          metricLabel: String(snapshot.metricLabel || definition.metricLabel),
          sourceDomain: definition.sourceDomain,
          metricValue: normalizeMetricValue(snapshot.metricValue),
          unit: String(snapshot.unit || ''),
          periodType: snapshot.periodType,
          periodValue: snapshot.periodValue,
          scopeType: snapshot.scopeType,
          departmentId,
          updatedAt: snapshot.updatedAt ? String(snapshot.updatedAt) : null,
          dataStatus: snapshot.sourceStatus,
          statusText: String(snapshot.statusText || ''),
          sort: definition.sort,
        });
      }
    }

    return normalizedQuery.metricCodes.map(metricCode => inputs.get(metricCode)!);
  }
}
