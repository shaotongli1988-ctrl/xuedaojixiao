/**
 * 培训课程领域服务。
 * 这里负责主题 7 课程主链查询、维护和报名摘要读取，不负责员工报名动作、培训扩展域或共享鉴权基础层。
 * 维护重点是 `published` 编辑白名单、`code` 可空唯一和报名摘要字段裁剪必须始终与冻结文档一致。
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
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceCourseEntity } from '../entity/course';
import { PerformanceCourseEnrollmentEntity } from '../entity/course-enrollment';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  assertCourseDeletable,
  buildCourseUpdatePatch,
  normalizeCourseAddPayload,
  type CourseSnapshot,
} from './course-helper';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

const normalizePagination = (value: any, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceCourseService extends BaseService {
  @InjectEntityModel(PerformanceCourseEntity)
  performanceCourseEntity: Repository<PerformanceCourseEntity>;

  @InjectEntityModel(PerformanceCourseEnrollmentEntity)
  performanceCourseEnrollmentEntity: Repository<PerformanceCourseEnrollmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    page: PERMISSIONS.performance.course.page,
    info: PERMISSIONS.performance.course.info,
    add: PERMISSIONS.performance.course.add,
    update: PERMISSIONS.performance.course.update,
    delete: PERMISSIONS.performance.course.delete,
    enrollmentPage: PERMISSIONS.performance.course.enrollmentPage,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.course.page]: 'course.read',
    [PERMISSIONS.performance.course.info]: 'course.read',
    [PERMISSIONS.performance.course.add]: 'course.create',
    [PERMISSIONS.performance.course.update]: 'course.update',
    [PERMISSIONS.performance.course.delete]: 'course.delete',
    [PERMISSIONS.performance.course.enrollmentPage]: 'course.enrollment.read',
  };

  async page(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.page, '无权限查看课程列表');

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const qb = this.performanceCourseEntity
      .createQueryBuilder('course')
      .select([
        'course.id as id',
        'course.title as title',
        'course.code as code',
        'course.category as category',
        'course.description as description',
        'course.startDate as startDate',
        'course.endDate as endDate',
        'course.status as status',
        'course.createTime as createTime',
        'course.updateTime as updateTime',
      ]);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('course.title like :keyword', { keyword })
            .orWhere('course.code like :keyword', { keyword });
        })
      );
    }

    if (query.category) {
      qb.andWhere('course.category = :category', {
        category: String(query.category).trim(),
      });
    }

    if (query.status) {
      qb.andWhere('course.status = :status', {
        status: String(query.status).trim(),
      });
    }

    qb.orderBy('course.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();
    const countMap = await this.loadEnrollmentCountMap(
      list.map(item => Number(item.id))
    );

    return {
      list: list.map(item => this.normalizeCourseRow(item, countMap)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看课程详情');

    const course = await this.requireCourse(id);
    const countMap = await this.loadEnrollmentCountMap([course.id]);
    return this.normalizeCourseRow(course, countMap);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增课程');

    const normalized = normalizeCourseAddPayload(payload);
    await this.assertCodeUnique(normalized.code);

    const saved = await this.performanceCourseEntity.save(
      this.performanceCourseEntity.create({
        ...normalized,
        code: normalized.code,
        category: normalized.category,
        description: normalized.description,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
      })
    );

    return this.info(saved.id);
  }

  async updateCourse(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改课程');

    const course = await this.requireCourse(Number(payload.id));
    const patch = buildCourseUpdatePatch(this.toCourseSnapshot(course), payload);
    await this.assertCodeUnique(
      Object.prototype.hasOwnProperty.call(patch, 'code')
        ? (patch.code ?? null)
        : course.code,
      course.id
    );

    await this.performanceCourseEntity.update({ id: course.id }, patch);
    return this.info(course.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除课程');

    const validIds = Array.from(
      new Set(
        (ids || [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    if (!validIds.length) {
      return;
    }

    const courses = await this.performanceCourseEntity.findBy({
      id: In(validIds),
    });

    if (!courses.length) {
      return;
    }

    courses.forEach(item => {
      assertCourseDeletable(item.status as any);
    });

    await this.performanceCourseEntity.delete(courses.map(item => item.id));
  }

  async enrollmentPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.enrollmentPage, '无权限查看课程报名列表');

    const courseId = Number(query.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new CoolCommException('课程 ID 不合法');
    }

    await this.requireCourse(courseId);

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const qb = this.performanceCourseEnrollmentEntity
      .createQueryBuilder('enrollment')
      .leftJoin(BaseSysUserEntity, 'user', 'user.id = enrollment.userId')
      .select([
        'enrollment.userId as userId',
        'user.name as userName',
        'enrollment.enrollTime as enrollTime',
        'enrollment.status as status',
        'enrollment.score as score',
      ])
      .where('enrollment.courseId = :courseId', { courseId });

    if (query.keyword) {
      qb.andWhere('user.name like :keyword', {
        keyword: `%${String(query.keyword).trim()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('enrollment.status = :status', {
        status: String(query.status).trim(),
      });
    }

    qb.orderBy('enrollment.enrollTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => ({
        userId: Number(item.userId),
        userName: item.userName || '',
        enrollTime: item.enrollTime || '',
        status: item.status || '',
        score:
          item.score === null || item.score === undefined
            ? null
            : Number(item.score),
      })),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  private async currentPerms() {
    return this.performanceAccessContextService.resolveAccessContext(undefined, {
      allowEmptyRoleIds: false,
      missingAuthMessage: '登录状态已失效',
    });
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的课程权限: ${perm}`);
    }
    return capabilityKey;
  }

  private assertPerm(
    access: PerformanceResolvedAccessContext,
    perm: string,
    message: string
  ) {
    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        this.resolveCapabilityKey(perm)
      )
    ) {
      throw new CoolCommException(message);
    }
  }

  private async requireCourse(id: number) {
    const course = await this.performanceCourseEntity.findOneBy({ id });

    if (!course) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return course;
  }

  private async assertCodeUnique(code?: string | null, excludeId?: number) {
    if (!code) {
      return;
    }

    const exists = await this.performanceCourseEntity.findOneBy({ code });

    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('课程编码已存在');
    }
  }

  private async loadEnrollmentCountMap(courseIds: number[]) {
    const ids = Array.from(
      new Set(
        (courseIds || [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    const result = new Map<number, number>();

    if (!ids.length) {
      return result;
    }

    const rows = await this.performanceCourseEnrollmentEntity
      .createQueryBuilder('enrollment')
      .select('enrollment.courseId', 'courseId')
      .addSelect('COUNT(1)', 'count')
      .where('enrollment.courseId IN (:...courseIds)', { courseIds: ids })
      .groupBy('enrollment.courseId')
      .getRawMany();

    rows.forEach(item => {
      result.set(Number(item.courseId), Number(item.count || 0));
    });

    return result;
  }

  private normalizeCourseRow(
    item: Partial<PerformanceCourseEntity>,
    countMap?: Map<number, number>
  ) {
    const id = Number(item.id || 0);

    return {
      id,
      title: item.title || '',
      code: item.code || '',
      category: item.category || '',
      description: item.description || '',
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      status: item.status || 'draft',
      enrollmentCount: countMap?.get(id) ?? 0,
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private toCourseSnapshot(item: PerformanceCourseEntity): CourseSnapshot {
    return {
      title: item.title,
      code: item.code || null,
      category: item.category || null,
      description: item.description || null,
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      status: item.status as any,
    };
  }
}
