/**
 * 车辆管理台账领域服务。
 * 这里只负责 vehicle 的 page/info/stats/add/update/delete 主链，不负责用车申请、调度、维保或费用结算动作。
 * 维护重点是 HR-only 权限、固定类型/状态枚举和车牌/编号唯一性必须由服务端单点收敛。
 */
import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceVehicleEntity } from '../entity/vehicle';
import * as jwt from 'jsonwebtoken';

const VEHICLE_TYPES = ['sedan', 'suv', 'mpv', 'bus', 'truck', 'other'];
const VEHICLE_STATUS = [
  'idle',
  'in_use',
  'maintenance',
  'inspection_due',
  'retired',
];
let vehicleTableReadyPromise: Promise<void> | null = null;

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

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
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:vehicle:page',
    info: 'performance:vehicle:info',
    stats: 'performance:vehicle:stats',
    add: 'performance:vehicle:add',
    update: 'performance:vehicle:update',
    delete: 'performance:vehicle:delete',
  };

  private get currentCtx() {
    if (this.ctx?.admin) {
      return this.ctx;
    }
    try {
      const contextManager: AsyncContextManager = this.app
        .getApplicationContext()
        .get(ASYNC_CONTEXT_MANAGER_KEY);
      return contextManager.active().getValue(ASYNC_CONTEXT_KEY) as any;
    } catch (error) {
      return this.ctx;
    }
  }

  private get currentAdmin() {
    if (this.currentCtx?.admin) {
      return this.currentCtx.admin;
    }
    const token =
      this.currentCtx?.get?.('Authorization') ||
      this.currentCtx?.headers?.authorization;
    if (!token) {
      return undefined;
    }
    try {
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret);
    } catch (error) {
      return undefined;
    }
  }

  async page(query: any) {
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看车辆列表');

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
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.info, '无权限查看车辆详情');
    const record = await this.requireRecord(Number(id));
    return this.normalizeRecord(record);
  }

  async stats(query: any) {
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.stats, '无权限查看车辆统计');

    const list = await this.listByQuery(query);

    return {
      total: list.length,
      inUseCount: list.filter(item => item.status === 'in_use').length,
      maintenanceCount: list.filter(item => item.status === 'maintenance').length,
      inspectionDueCount: list.filter(item => item.status === 'inspection_due').length,
    };
  }

  async add(payload: any) {
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.add, '无权限新增车辆台账');

    const normalized = await this.normalizePayload(payload, 'add');
    const saved = await this.performanceVehicleEntity.save(
      this.performanceVehicleEntity.create(normalized)
    );
    return this.info(saved.id);
  }

  async updateVehicle(payload: any) {
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.update, '无权限更新车辆台账');

    const id = Number(payload?.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('ID不能为空');
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
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.delete, '无权限删除车辆台账');

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
    await this.ensureTableReady();
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
    await this.ensureTableReady();
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
    await this.ensureTableReady();
    const existing = await this.performanceVehicleEntity.findOneBy({ vehicleNo });
    if (existing && Number(existing.id) !== Number(currentId || 0)) {
      throw new CoolCommException('车辆编号已存在');
    }
  }

  private async assertPlateNoUnique(plateNo: string, currentId?: number) {
    await this.ensureTableReady();
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

  private async currentPerms() {
    const roleIds = this.currentAdmin?.roleIds || [];
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return [];
    }
    return this.baseSysMenuService.getPerms(roleIds);
  }

  private assertHasPerm(perms: string[], perm: string, message: string) {
    if (!Array.isArray(perms) || !perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  /**
   * current latest 关闭了 TypeORM auto-sync，新增台账表需要在首次访问时兜底建表，
   * 否则运行态只会在页面首屏阶段暴露“table does not exist”。
   */
  private async ensureTableReady() {
    if (!vehicleTableReadyPromise) {
      vehicleTableReadyPromise = this.performanceVehicleEntity
        .query(`
          CREATE TABLE IF NOT EXISTS performance_vehicle (
            id int NOT NULL AUTO_INCREMENT,
            vehicleNo varchar(64) NOT NULL,
            plateNo varchar(32) NOT NULL,
            brand varchar(100) NOT NULL,
            model varchar(100) NOT NULL,
            vehicleType varchar(32) NOT NULL,
            ownerDepartment varchar(100) NOT NULL,
            managerName varchar(100) NOT NULL,
            seats int NOT NULL DEFAULT 5,
            registerDate varchar(10) NOT NULL,
            inspectionDueDate varchar(10) DEFAULT NULL,
            insuranceDueDate varchar(10) DEFAULT NULL,
            status varchar(32) NOT NULL DEFAULT 'idle',
            usageScope text DEFAULT NULL,
            notes text DEFAULT NULL,
            createTime varchar(19) NOT NULL,
            updateTime varchar(19) NOT NULL,
            tenantId int DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uk_performance_vehicle_no (vehicleNo),
            UNIQUE KEY uk_performance_vehicle_plate (plateNo),
            KEY idx_performance_vehicle_type (vehicleType),
            KEY idx_performance_vehicle_status (status),
            KEY idx_performance_vehicle_create_time (createTime),
            KEY idx_performance_vehicle_update_time (updateTime),
            KEY idx_performance_vehicle_tenant (tenantId)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `)
        .then(() => undefined)
        .catch(error => {
          vehicleTableReadyPromise = null;
          throw error;
        });
    }
    await vehicleTableReadyPromise;
  }
}
