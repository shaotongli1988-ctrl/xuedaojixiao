/**
 * 车辆管理台账领域服务。
 * 这里只负责 vehicle 的 page/info/stats/add/update/delete 主链，不负责用车申请、调度、维保或费用结算动作。
 * 维护重点是 HR-only 权限、固定类型/状态枚举和车牌/编号唯一性必须由服务端单点收敛。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { PerformanceVehicleEntity } from '../entity/vehicle';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

const VEHICLE_TYPES = ['sedan', 'suv', 'mpv', 'bus', 'truck', 'other'];
const VEHICLE_STATUS = [
  'idle',
  'in_use',
  'maintenance',
  'inspection_due',
  'retired',
];
const PERFORMANCE_ID_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.idRequired
  );

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeText(value: any, maxLength?: number) {
  const text = String(value ?? '').trim();
  if (!maxLength || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

function normalizeOptionalText(value: any, maxLength?: number) {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function normalizeRequiredText(value: any, label: string, maxLength?: number) {
  const text = normalizeText(value, maxLength);
  if (!text) {
    throw new CoolCommException(`${label}不能为空`);
  }
  return text;
}

function normalizeOptionalDate(value: any, label: string) {
  const text = normalizeOptionalText(value, 10);
  if (!text) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new CoolCommException(`${label}格式不合法`);
  }
  return text;
}

function normalizeRequiredDate(value: any, label: string) {
  const text = normalizeOptionalDate(value, label);
  if (!text) {
    throw new CoolCommException(`${label}不能为空`);
  }
  return text;
}

function normalizeInteger(
  value: any,
  options: {
    label: string;
    fallback?: number;
    min?: number;
    max?: number;
  }
) {
  const parsed = Number(value);
  const next = Number.isFinite(parsed)
    ? Math.round(parsed)
    : Number(options.fallback ?? 0);
  const min = options.min ?? Number.MIN_SAFE_INTEGER;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  if (!Number.isInteger(next) || next < min || next > max) {
    throw new CoolCommException(`${options.label}必须在${min}-${max}之间`);
  }
  return next;
}

function normalizeIds(value: any) {
  const list = Array.isArray(value) ? value : [value];
  return Array.from(
    new Set(
      list
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
}

function compareDateDesc(left?: string | null, right?: string | null) {
  return String(right || '').localeCompare(String(left || ''));
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceVehicleService extends BaseService {
  @InjectEntityModel(PerformanceVehicleEntity)
  performanceVehicleEntity: Repository<PerformanceVehicleEntity>;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly accessContextOptions = {
    allowEmptyRoleIds: true,
    missingAuthMessage: '登录状态已失效',
  };

  async page(query: any) {
    await this.requireAccess('vehicle.read', '无权限查看车辆列表');

    const page = normalizePageNumber(query?.page, 1);
    const size = normalizePageNumber(query?.size, 20);
    const filtered = await this.listByQuery(query);

    return {
      list: filtered.slice((page - 1) * size, page * size),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async info(id: number) {
    await this.requireAccess('vehicle.read', '无权限查看车辆详情');
    const record = await this.requireRecord(Number(id));
    return this.normalizeRecord(record);
  }

  async stats(query: any) {
    await this.requireAccess('vehicle.stats', '无权限查看车辆统计');

    const list = await this.listByQuery(query);

    return {
      total: list.length,
      inUseCount: list.filter(item => item.status === 'in_use').length,
      maintenanceCount: list.filter(item => item.status === 'maintenance').length,
      inspectionDueCount: list.filter(item => item.status === 'inspection_due').length,
    };
  }

  async add(payload: any) {
    await this.requireAccess('vehicle.create', '无权限新增车辆台账');

    const normalized = await this.normalizePayload(payload, 'add');
    const saved = await this.performanceVehicleEntity.save(
      this.performanceVehicleEntity.create(normalized)
    );
    return this.info(saved.id);
  }

  async updateVehicle(payload: any) {
    await this.requireAccess('vehicle.update', '无权限更新车辆台账');

    const id = Number(payload?.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException(PERFORMANCE_ID_REQUIRED_MESSAGE);
    }

    const current = await this.requireRecord(id);
    const normalized = await this.normalizePayload(
      {
        ...current,
        ...payload,
      },
      'update',
      current
    );
    await this.performanceVehicleEntity.update({ id }, normalized);
    return this.info(id);
  }

  async delete(ids: number[]) {
    await this.requireAccess('vehicle.delete', '无权限删除车辆台账');

    const validIds = normalizeIds(ids);
    if (validIds.length === 0) {
      throw new CoolCommException('请选择需要删除的车辆记录');
    }

    const currentRows = await this.performanceVehicleEntity.findBy({
      id: In(validIds),
    });
    if (currentRows.length !== validIds.length) {
      throw new CoolCommException('部分车辆记录不存在');
    }

    await this.performanceVehicleEntity.delete(validIds as any);
  }

  private async listByQuery(query: any) {
    const rows = await this.performanceVehicleEntity.find();
    const keyword = normalizeText(query?.keyword, 100).toLowerCase();
    const status = normalizeText(query?.status, 32);
    const vehicleType = normalizeText(query?.vehicleType, 32);

    const filtered = rows
      .map(item => this.normalizeRecord(item))
      .filter(item => {
        if (status && item.status !== status) {
          return false;
        }
        if (vehicleType && item.vehicleType !== vehicleType) {
          return false;
        }
        if (
          keyword &&
          ![
            item.vehicleNo,
            item.plateNo,
            item.brand,
            item.model,
            item.ownerDepartment,
            item.managerName,
            item.usageScope,
            item.notes,
          ].some(value => String(value || '').toLowerCase().includes(keyword))
        ) {
          return false;
        }
        return true;
      });

    filtered.sort((left, right) =>
      compareDateDesc(
        String(left.updateTime || left.createTime || ''),
        String(right.updateTime || right.createTime || '')
      )
    );
    return filtered;
  }

  private async normalizePayload(
    payload: any,
    mode: 'add' | 'update',
    current?: PerformanceVehicleEntity
  ) {
    const vehicleNo = normalizeRequiredText(payload?.vehicleNo, '车辆编号', 64);
    const plateNo = normalizeRequiredText(payload?.plateNo, '车牌号', 32);
    const brand = normalizeRequiredText(payload?.brand, '品牌', 100);
    const model = normalizeRequiredText(payload?.model, '型号', 100);
    const vehicleType = normalizeRequiredText(payload?.vehicleType, '车辆类型', 32);
    const ownerDepartment = normalizeRequiredText(
      payload?.ownerDepartment,
      '归属部门',
      100
    );
    const managerName = normalizeRequiredText(payload?.managerName, '管理员', 100);
    const seats = normalizeInteger(payload?.seats, {
      label: '座位数',
      fallback: 5,
      min: 1,
      max: 99,
    });
    const registerDate = normalizeRequiredDate(payload?.registerDate, '登记日期');
    const inspectionDueDate = normalizeOptionalDate(
      payload?.inspectionDueDate,
      '年检到期日'
    );
    const insuranceDueDate = normalizeOptionalDate(
      payload?.insuranceDueDate,
      '保险到期日'
    );
    const status = normalizeRequiredText(
      payload?.status ?? (mode === 'add' ? 'idle' : current?.status),
      '状态',
      32
    );

    this.assertEnum(vehicleType, VEHICLE_TYPES, '车辆类型不合法');
    this.assertEnum(status, VEHICLE_STATUS, '车辆状态不合法');

    if (inspectionDueDate && inspectionDueDate < registerDate) {
      throw new CoolCommException('年检到期日不能早于登记日期');
    }
    if (insuranceDueDate && insuranceDueDate < registerDate) {
      throw new CoolCommException('保险到期日不能早于登记日期');
    }

    await this.assertVehicleNoUnique(vehicleNo, current?.id);
    await this.assertPlateNoUnique(plateNo, current?.id);

    return {
      vehicleNo,
      plateNo,
      brand,
      model,
      vehicleType,
      ownerDepartment,
      managerName,
      seats,
      registerDate,
      inspectionDueDate,
      insuranceDueDate,
      status,
      usageScope: normalizeOptionalText(payload?.usageScope, 1000),
      notes: normalizeOptionalText(payload?.notes, 2000),
    };
  }

  private normalizeRecord(record: PerformanceVehicleEntity) {
    return {
      id: record.id,
      vehicleNo: record.vehicleNo,
      plateNo: record.plateNo,
      brand: record.brand,
      model: record.model,
      vehicleType: record.vehicleType,
      ownerDepartment: record.ownerDepartment,
      managerName: record.managerName,
      seats: Number(record.seats || 0),
      registerDate: record.registerDate,
      inspectionDueDate: record.inspectionDueDate,
      insuranceDueDate: record.insuranceDueDate,
      status: record.status,
      usageScope: record.usageScope,
      notes: record.notes,
      createTime: record.createTime || '',
      updateTime: record.updateTime || '',
    };
  }

  private async requireRecord(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('车辆记录 ID 不合法');
    }
    const record = await this.performanceVehicleEntity.findOneBy({ id });
    if (!record) {
      throw new CoolCommException('车辆记录不存在');
    }
    return record;
  }

  private async assertVehicleNoUnique(vehicleNo: string, currentId?: number) {
    const existing = await this.performanceVehicleEntity.findOneBy({ vehicleNo });
    if (existing && Number(existing.id) !== Number(currentId || 0)) {
      throw new CoolCommException('车辆编号已存在');
    }
  }

  private async assertPlateNoUnique(plateNo: string, currentId?: number) {
    const existing = await this.performanceVehicleEntity.findOneBy({ plateNo });
    if (existing && Number(existing.id) !== Number(currentId || 0)) {
      throw new CoolCommException('车牌号已存在');
    }
  }

  private assertEnum(value: string, allowed: string[], message: string) {
    if (!allowed.includes(value)) {
      throw new CoolCommException(message);
    }
  }

  private async requireAccess(
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ): Promise<PerformanceResolvedAccessContext> {
    const access = await this.performanceAccessContextService.resolveAccessContext(
      undefined,
      this.accessContextOptions
    );
    if (!this.performanceAccessContextService.hasCapability(access, capabilityKey)) {
      throw new CoolCommException(message);
    }
    return access;
  }
}
