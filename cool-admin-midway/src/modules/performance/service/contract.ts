/**
 * 合同台账领域服务。
 * 这里只负责主题10首批冻结的分页、详情和标准 CRUD，不负责电子签、PDF 预览、签名板、审批流或归档下载。
 * 维护重点是首批只允许 HR 访问，状态流只保留台账主链，且非 draft 不可删除。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceContractEntity } from '../entity/contract';
import {
  CONTRACT_STATUS_VALUES,
  CONTRACT_TYPE_VALUES,
} from './contract-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

const CONTRACT_TYPES = [...CONTRACT_TYPE_VALUES];
const CONTRACT_STATUS = [...CONTRACT_STATUS_VALUES];
const PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeNotFound
  );
const PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.departmentNotFound
  );
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );
const PERFORMANCE_CONTRACT_CREATE_DRAFT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.contractCreateDraftOnly
  );
const PERFORMANCE_CONTRACT_TYPE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.contractTypeInvalid
  );
const PERFORMANCE_CONTRACT_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.contractStatusInvalid
  );
const PERFORMANCE_CONTRACT_PROBATION_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.contractProbationInvalid
  );
const PERFORMANCE_CONTRACT_SALARY_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.contractSalaryInvalid
  );
const PERFORMANCE_CONTRACT_DATE_RANGE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.contractDateRangeInvalid
  );

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceContractService extends BaseService {
  @InjectEntityModel(PerformanceContractEntity)
  performanceContractEntity: Repository<PerformanceContractEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  async page(query: any) {
    await this.requireAccess('contract.read', '无权限查看合同列表');

    const page = this.normalizePageNumber(query.page, 1);
    const size = this.normalizePageNumber(query.size, 20);
    const qb = this.performanceContractEntity
      .createQueryBuilder('contract')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = contract.employeeId')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = contract.departmentId'
      )
      .select([
        'contract.id as id',
        'contract.employeeId as employeeId',
        'employee.name as employeeName',
        'contract.type as type',
        'contract.title as title',
        'contract.contractNumber as contractNumber',
        'contract.startDate as startDate',
        'contract.endDate as endDate',
        'contract.probationPeriod as probationPeriod',
        'contract.salary as salary',
        'contract.position as position',
        'contract.departmentId as departmentId',
        'department.name as departmentName',
        'contract.status as status',
        'contract.createTime as createTime',
        'contract.updateTime as updateTime',
      ]);

    if (query.employeeId) {
      qb.andWhere('contract.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.type) {
      qb.andWhere('contract.type = :type', {
        type: String(query.type).trim(),
      });
    }

    if (query.status) {
      qb.andWhere('contract.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('contract.title like :keyword', { keyword })
            .orWhere('contract.contractNumber like :keyword', { keyword });
        })
      );
    }

    qb.orderBy('contract.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeContractRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    await this.requireAccess('contract.read', '无权限查看合同详情');

    const contract = await this.requireContract(id);
    return this.buildContractDetail(contract);
  }

  async add(payload: any) {
    await this.requireAccess('contract.create', '无权限新增合同');

    const normalized = await this.normalizePayload(payload, 'add');
    const saved = await this.performanceContractEntity.save(
      this.performanceContractEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateContract(payload: any) {
    await this.requireAccess('contract.update', '无权限修改合同');

    const contract = await this.requireContract(Number(payload.id));
    this.assertEditable(contract.status);
    const normalized = await this.normalizePayload(
      {
        ...contract,
        ...payload,
      },
      'update',
      contract.status
    );

    await this.performanceContractEntity.update({ id: contract.id }, normalized);
    return this.info(contract.id);
  }

  async delete(ids: number[]) {
    await this.requireAccess('contract.delete', '无权限删除合同');

    const validIds = (ids || [])
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);

    if (!validIds.length) {
      return;
    }

    const contracts = await this.performanceContractEntity.findBy({
      id: In(validIds),
    });

    if (contracts.length !== validIds.length) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    contracts.forEach(item => {
      if (item.status !== 'draft') {
        throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
      }
    });

    await this.performanceContractEntity.delete(validIds);
  }

  private async requireAccess(
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ): Promise<PerformanceResolvedAccessContext> {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    if (!this.performanceAccessContextService.hasCapability(access, capabilityKey)) {
      throw new CoolCommException(message);
    }
    return access;
  }

  private assertEditable(status?: string) {
    if (status === 'expired' || status === 'terminated') {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }
  }

  private async normalizePayload(
    payload: any,
    mode: 'add' | 'update',
    currentStatus?: string
  ) {
    const employeeId = Number(payload.employeeId || 0);
    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employeeId || !employee) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE);
    }

    const startDate = this.normalizeDate(payload.startDate, '开始日期不能为空');
    const endDate = this.normalizeDate(payload.endDate, '结束日期不能为空');
    await this.validateDateRange(startDate, endDate);
    const departmentId = await this.resolveDepartmentId(payload.departmentId, employee.departmentId);

    return {
      employeeId,
      type: this.normalizeType(payload.type),
      title: this.normalizeOptionalString(payload.title, 200, '合同标题长度不合法'),
      contractNumber: this.normalizeOptionalString(
        payload.contractNumber,
        50,
        '合同编号长度不合法'
      ),
      startDate,
      endDate,
      probationPeriod: this.normalizeProbation(payload.probationPeriod),
      salary: this.normalizeSalary(payload.salary),
      position: this.normalizeOptionalString(payload.position, 100, '岗位名称长度不合法'),
      departmentId,
      status: this.normalizeTransitionStatus(
        mode === 'add' ? payload.status || 'draft' : payload.status || currentStatus || 'draft',
        currentStatus,
        mode
      ),
    };
  }

  private normalizeTransitionStatus(
    nextStatusRaw: any,
    currentStatus: string | undefined,
    mode: 'add' | 'update'
  ) {
    const nextStatus = this.normalizeStatus(nextStatusRaw);

    if (mode === 'add') {
      if (nextStatus !== 'draft') {
        throw new CoolCommException(PERFORMANCE_CONTRACT_CREATE_DRAFT_ONLY_MESSAGE);
      }
      return nextStatus;
    }

    const current = String(currentStatus || '').trim();

    if (current === 'draft' && ['draft', 'active'].includes(nextStatus)) {
      return nextStatus;
    }

    if (current === 'active' && ['active', 'expired', 'terminated'].includes(nextStatus)) {
      return nextStatus;
    }

    if (current === nextStatus) {
      return nextStatus;
    }

    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
  }

  private normalizeType(value: any) {
    const type = String(value || '').trim();

    if (!CONTRACT_TYPES.some(item => item === type)) {
      throw new CoolCommException(PERFORMANCE_CONTRACT_TYPE_INVALID_MESSAGE);
    }

    return type;
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'draft').trim();

    if (!CONTRACT_STATUS.some(item => item === status)) {
      throw new CoolCommException(PERFORMANCE_CONTRACT_STATUS_INVALID_MESSAGE);
    }

    return status;
  }

  private normalizeDate(value: any, emptyMessage: string) {
    const date = String(value || '').trim();

    if (!date) {
      throw new CoolCommException(emptyMessage);
    }

    return date;
  }

  private normalizeOptionalString(value: any, maxLength: number, invalidMessage: string) {
    const normalized = value === null || value === undefined ? '' : String(value).trim();

    if (normalized.length > maxLength) {
      throw new CoolCommException(invalidMessage);
    }

    return normalized;
  }

  private normalizeProbation(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const probationPeriod = Number(value);

    if (!Number.isInteger(probationPeriod) || probationPeriod < 0) {
      throw new CoolCommException(PERFORMANCE_CONTRACT_PROBATION_INVALID_MESSAGE);
    }

    return probationPeriod;
  }

  private normalizeSalary(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const salary = Number(value);

    if (!Number.isFinite(salary)) {
      throw new CoolCommException(PERFORMANCE_CONTRACT_SALARY_INVALID_MESSAGE);
    }

    return Math.round(salary * 100) / 100;
  }

  private async resolveDepartmentId(value: any, employeeDepartmentId: any) {
    if (
      value !== null &&
      value !== undefined &&
      value !== '' &&
      this.normalizeNullableNumber(value) === null
    ) {
      throw new CoolCommException(PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }

    const departmentId = this.normalizeNullableNumber(value);

    if (departmentId === null) {
      return this.normalizeNullableNumber(employeeDepartmentId);
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({ id: departmentId });

    if (!department) {
      throw new CoolCommException(PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }

    return departmentId;
  }

  private normalizeNullableNumber(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  private async requireContract(id: number) {
    const contract = await this.performanceContractEntity.findOneBy({ id });

    if (!contract) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return contract;
  }

  private async buildContractDetail(contract: PerformanceContractEntity) {
    const [employee, department] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: contract.employeeId }),
      contract.departmentId
        ? this.baseSysDepartmentEntity.findOneBy({ id: Number(contract.departmentId) })
        : Promise.resolve(null),
    ]);

    return this.normalizeContractRow({
      ...contract,
      employeeName: employee?.name || '',
      departmentName: department?.name || '',
    });
  }

  private normalizeContractRow(item: any) {
    return {
      id: Number(item.id),
      employeeId: Number(item.employeeId),
      employeeName: item.employeeName || '',
      type: item.type,
      title: item.title || '',
      contractNumber: item.contractNumber || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      probationPeriod: this.normalizeNullableNumber(item.probationPeriod),
      salary: this.normalizeSalary(item.salary),
      position: item.position || '',
      departmentId: this.normalizeNullableNumber(item.departmentId),
      departmentName: item.departmentName || '',
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private normalizePageNumber(value: any, fallback: number) {
    const normalized = Number(value || fallback);

    if (!Number.isInteger(normalized) || normalized <= 0) {
      return fallback;
    }

    return normalized;
  }

  async validateDateRange(startDate: string, endDate: string) {
    if (endDate <= startDate) {
      throw new CoolCommException(PERFORMANCE_CONTRACT_DATE_RANGE_INVALID_MESSAGE);
    }
  }
}
