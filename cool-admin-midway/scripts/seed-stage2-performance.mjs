/**
 * Seeds local integration data for performance modules and theme-7/8/9/10/11/12/13/14/15/16/17/18/20 management.
 * This file only prepares local menu, role, user, and sample business data for联调.
 * It does not replace the project's general initialization flow or production release scripts.
 * Maintenance pitfall: dashboard权限、课程/学习任务/人才资产/简历池/面试/录用/能力地图/证书/会议/合同/资产样例和 menu.json 必须一起维护，否则真实联调会和 seed 脱节。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import {
  STAGE2_RUNTIME_META_PARAM_KEY,
  buildStage2SeedMeta,
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const menuJsonPath = path.resolve(__dirname, '../src/modules/base/menu.json');
const stage2MenuRouters = new Set([
  '/data-center/dashboard',
  '/performance/my-assessment',
  '/performance/initiated',
  '/performance/pending',
  '/performance/goals',
  '/performance/indicator-library',
  '/performance/feedback',
  '/performance/suggestion',
  '/performance/pip',
  '/performance/promotion',
  '/performance/salary',
  '/performance/course',
  '/performance/capability',
  '/performance/certificate',
  '/performance/course-learning',
  '/performance/teacher-channel/dashboard',
  '/performance/teacher-channel/teacher',
  '/performance/teacher-channel/todo',
  '/performance/teacher-channel/class',
  '/performance/recruitment-center',
  '/performance/recruit-plan',
  '/performance/job-standard',
  '/performance/resumePool',
  '/performance/interview',
  '/performance/hiring',
  '/performance/meeting',
  '/performance/contract',
  '/performance/talentAsset',
  '/performance/purchase-order',
  '/performance/supplier',
  '/performance/asset/dashboard',
  '/performance/asset/ledger',
  '/performance/asset/assignment',
  '/performance/asset/maintenance',
  '/performance/asset/report',
  '/performance/asset/procurement',
  '/performance/asset/transfer',
  '/performance/asset/inventory',
  '/performance/asset/depreciation',
  '/performance/asset/disposal',
  '/performance/office/document-center',
  '/performance/office/knowledge-base',
]);

const connection = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'cool',
});

const password123456 = 'e10adc3949ba59abbe56e057f20f883e';

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function formatDateTime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function loadStage2PerformanceMenus() {
  const allMenus = JSON.parse(fs.readFileSync(menuJsonPath, 'utf8'));
  const performanceRoot = allMenus.find(item => item.router === '/performance');

  if (!performanceRoot) {
    throw new Error('Performance menu root not found in src/modules/base/menu.json');
  }

  return [
    {
      ...performanceRoot,
      childMenus: (performanceRoot.childMenus || [])
        .filter(item => stage2MenuRouters.has(item.router))
        .map(item => ({
          ...item,
          childMenus: item.childMenus || [],
        })),
    },
  ];
}

async function queryOne(sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return rows[0] || null;
}

async function ensureTableColumn(tableName, columnName, columnDefinition) {
  const [rows] = await connection.query(
    `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
    [columnName]
  );

  if (Array.isArray(rows) && rows.length > 0) {
    return;
  }

  await connection.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDefinition}`
  );
}

async function upsertMenuNode(menu, parentId = null) {
  const existing = await queryOne(
    `SELECT id
       FROM base_sys_menu
      WHERE parentId <=> ?
        AND type = ?
        AND router <=> ?
        AND perms <=> ?
      LIMIT 1`,
    [parentId, menu.type, menu.router ?? null, menu.perms ?? null]
  );

  const payload = [
    parentId,
    menu.name,
    menu.router ?? null,
    menu.perms ?? null,
    menu.type,
    menu.icon ?? null,
    menu.orderNum ?? 0,
    menu.viewPath ?? null,
    menu.keepAlive ? 1 : 0,
    menu.isShow ? 1 : 0,
    now(),
  ];

  if (existing) {
    await connection.query(
      `UPDATE base_sys_menu
          SET parentId = ?, name = ?, router = ?, perms = ?, type = ?, icon = ?, orderNum = ?, viewPath = ?, keepAlive = ?, isShow = ?, updateTime = ?
        WHERE id = ?`,
      [...payload, existing.id]
    );
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO base_sys_menu
      (parentId, name, router, perms, type, icon, orderNum, viewPath, keepAlive, isShow, createTime, updateTime, tenantId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [...payload.slice(0, 10), now(), now()]
  );

  return result.insertId;
}

async function syncMenuTree(menus, parentId = null) {
  for (const menu of menus) {
    const currentId = await upsertMenuNode(menu, parentId);
    const childMenus = menu.childMenus || [];
    if (childMenus.length > 0) {
      await syncMenuTree(childMenus, currentId);
    }
  }
}

async function ensureDepartment({ name, parentId = null, userId = 1, orderNum = 0 }) {
  const existing = await queryOne(
    'SELECT id FROM base_sys_department WHERE name = ? AND parentId <=> ? LIMIT 1',
    [name, parentId]
  );

  if (existing) {
    await connection.query(
      'UPDATE base_sys_department SET userId = ?, orderNum = ?, updateTime = ? WHERE id = ?',
      [userId, orderNum, now(), existing.id]
    );
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO base_sys_department
      (name, userId, parentId, orderNum, createTime, updateTime, tenantId)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [name, userId, parentId, orderNum, now(), now()]
  );
  return result.insertId;
}

async function ensureUser({
  username,
  name,
  nickName,
  departmentId,
  phone,
  email,
  remark,
}) {
  const existing = await queryOne(
    'SELECT id FROM base_sys_user WHERE username = ? LIMIT 1',
    [username]
  );

  if (existing) {
    await connection.query(
      `UPDATE base_sys_user
          SET departmentId = ?, userId = 1, name = ?, nickName = ?, phone = ?, email = ?, remark = ?, status = 1, updateTime = ?
        WHERE id = ?`,
      [departmentId, name, nickName, phone, email, remark, now(), existing.id]
    );
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO base_sys_user
      (departmentId, userId, name, username, password, passwordV, nickName, headImg, phone, email, remark, status, socketId, createTime, updateTime, tenantId)
     VALUES (?, 1, ?, ?, ?, 1, ?, NULL, ?, ?, ?, 1, NULL, ?, ?, NULL)`,
    [departmentId, name, username, password123456, nickName, phone, email, remark, now(), now()]
  );
  return result.insertId;
}

async function ensureRole({ name, label, remark, menuIds, departmentIds }) {
  const existing = await queryOne(
    'SELECT id FROM base_sys_role WHERE label = ? LIMIT 1',
    [label]
  );

  const menuIdList = JSON.stringify(menuIds);
  const departmentIdList = JSON.stringify(departmentIds);

  if (existing) {
    await connection.query(
      `UPDATE base_sys_role
          SET userId = '1', name = ?, remark = ?, relevance = 1, menuIdList = ?, departmentIdList = ?, updateTime = ?
        WHERE id = ?`,
      [name, remark, menuIdList, departmentIdList, now(), existing.id]
    );
    await replaceRoleBindings(existing.id, menuIds, departmentIds);
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO base_sys_role
      (userId, name, label, remark, relevance, menuIdList, departmentIdList, createTime, updateTime, tenantId)
     VALUES ('1', ?, ?, ?, 1, ?, ?, ?, ?, NULL)`,
    [name, label, remark, menuIdList, departmentIdList, now(), now()]
  );
  await replaceRoleBindings(result.insertId, menuIds, departmentIds);
  return result.insertId;
}

async function replaceRoleBindings(roleId, menuIds, departmentIds) {
  await connection.query('DELETE FROM base_sys_role_menu WHERE roleId = ?', [roleId]);
  await connection.query('DELETE FROM base_sys_role_department WHERE roleId = ?', [roleId]);

  for (const menuId of menuIds) {
    await connection.query(
      `INSERT INTO base_sys_role_menu (roleId, menuId, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, NULL)`,
      [roleId, menuId, now(), now()]
    );
  }

  for (const departmentId of departmentIds) {
    await connection.query(
      `INSERT INTO base_sys_role_department (roleId, departmentId, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, NULL)`,
      [roleId, departmentId, now(), now()]
    );
  }
}

async function replaceUserRoles(userId, roleIds) {
  await connection.query('DELETE FROM base_sys_user_role WHERE userId = ?', [userId]);
  for (const roleId of roleIds) {
    await connection.query(
      `INSERT INTO base_sys_user_role (userId, roleId, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, NULL)`,
      [userId, roleId, now(), now()]
    );
  }
}

async function upsertParam({ keyName, name, data, dataType = 0, remark = null }) {
  const existing = await queryOne(
    'SELECT id FROM base_sys_param WHERE keyName = ? LIMIT 1',
    [keyName]
  );

  if (existing) {
    await connection.query(
      `UPDATE base_sys_param
          SET name = ?, data = ?, dataType = ?, remark = ?, updateTime = ?
        WHERE id = ?`,
      [name, data, dataType, remark, now(), existing.id]
    );
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO base_sys_param
      (name, keyName, data, dataType, remark, createTime, updateTime, tenantId)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [name, keyName, data, dataType, remark, now(), now()]
  );

  return result.insertId;
}

async function syncStage2RuntimeMeta(extra = {}) {
  const seedMeta = {
    ...buildStage2SeedMeta(new Date().toISOString()),
    ...extra,
  };
  await upsertParam({
    keyName: STAGE2_RUNTIME_META_PARAM_KEY,
    name: '阶段2运行态种子版本',
    data: JSON.stringify(seedMeta),
    dataType: 0,
    remark: '由 seed-stage2-performance.mjs 自动回写，用于 smoke 前置门禁校验',
  });
  return seedMeta;
}

async function collectMenuIds({ routers = [], perms = [] }) {
  const [rows] = await connection.query(
    'SELECT id, parentId, router, perms FROM base_sys_menu'
  );
  const menuMap = new Map(rows.map(row => [row.id, row]));
  const childrenMap = new Map();
  const selected = new Set();

  for (const row of rows) {
    const key = row.parentId ?? null;
    const list = childrenMap.get(key) || [];
    list.push(row);
    childrenMap.set(key, list);
  }

  const allowedPerms = new Set(perms);

  const collectChildren = currentId => {
    for (const child of childrenMap.get(currentId) || []) {
      const childPerms = String(child.perms || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

      if (childPerms.length === 0 || childPerms.some(item => allowedPerms.has(item))) {
        selected.add(child.id);
        collectChildren(child.id);
      }
    }
  };

  for (const router of routers) {
    const pageMenu = rows.find(row => row.router === router);
    if (!pageMenu) {
      continue;
    }
    selected.add(pageMenu.id);
    collectChildren(pageMenu.id);
  }

  for (const id of [...selected]) {
    let cursor = menuMap.get(id);
    while (cursor?.parentId) {
      selected.add(cursor.parentId);
      cursor = menuMap.get(cursor.parentId);
    }
  }

  return [...selected];
}

async function replaceAssessments(seedRows) {
  const codes = seedRows.map(item => item.code);
  if (codes.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_assessment WHERE code IN (?)',
      [codes]
    );
    const assessmentIds = existing.map(item => item.id);
    if (assessmentIds.length) {
      await connection.query(
        'DELETE FROM performance_assessment_score WHERE assessmentId IN (?)',
        [assessmentIds]
      );
      await connection.query(
        'DELETE FROM performance_assessment WHERE id IN (?)',
        [assessmentIds]
      );
    }
  }

  const assessmentIdMap = new Map();

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_assessment
        (code, employeeId, assessorId, departmentId, periodType, periodValue, targetCompletion, totalScore, grade, selfEvaluation, managerFeedback, submitTime, approveTime, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.code,
        row.employeeId,
        row.assessorId,
        row.departmentId,
        row.periodType,
        row.periodValue,
        row.targetCompletion,
        row.totalScore,
        row.grade,
        row.selfEvaluation,
        row.managerFeedback,
        row.submitTime,
        row.approveTime,
        row.status,
        now(),
        now(),
      ]
    );

    for (const scoreItem of row.scoreItems) {
      await connection.query(
        `INSERT INTO performance_assessment_score
          (assessmentId, indicatorId, indicatorName, score, weight, comment, createTime, updateTime, tenantId)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          scoreItem.indicatorName,
          scoreItem.score,
          scoreItem.weight,
          scoreItem.comment,
          now(),
          now(),
        ]
      );
    }

    assessmentIdMap.set(row.code, result.insertId);
  }

  return assessmentIdMap;
}

async function replaceGoals(seedRows) {
  const titles = seedRows.map(item => item.title);
  if (titles.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_goal WHERE title IN (?)',
      [titles]
    );
    const goalIds = existing.map(item => item.id);
    if (goalIds.length) {
      await connection.query(
        'DELETE FROM performance_goal_progress WHERE goalId IN (?)',
        [goalIds]
      );
      await connection.query('DELETE FROM performance_goal WHERE id IN (?)', [goalIds]);
    }
  }

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_goal
        (employeeId, departmentId, title, description, targetValue, currentValue, unit, weight, startDate, endDate, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.employeeId,
        row.departmentId,
        row.title,
        row.description,
        row.targetValue,
        row.currentValue,
        row.unit,
        row.weight,
        row.startDate,
        row.endDate,
        row.status,
        now(),
        now(),
      ]
    );

    for (const progress of row.progressRecords) {
      await connection.query(
        `INSERT INTO performance_goal_progress
          (goalId, beforeValue, afterValue, remark, operatorId, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          progress.beforeValue,
          progress.afterValue,
          progress.remark,
          progress.operatorId,
          now(),
          now(),
        ]
      );
    }
  }
}

async function replaceIndicators(seedRows) {
  const codes = seedRows.map(item => item.code);
  if (codes.length) {
    await connection.query(
      'DELETE FROM performance_indicator WHERE code IN (?)',
      [codes]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_indicator
        (name, code, category, weight, scoreScale, applyScope, description, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.name,
        row.code,
        row.category,
        row.weight,
        row.scoreScale,
        row.applyScope,
        row.description,
        row.status,
        now(),
        now(),
      ]
    );
  }
}

async function replacePips(seedRows) {
  const titles = seedRows.map(item => item.title);
  if (titles.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_pip WHERE title IN (?)',
      [titles]
    );
    const pipIds = existing.map(item => item.id);
    if (pipIds.length) {
      await connection.query(
        'DELETE FROM performance_pip_record WHERE pipId IN (?)',
        [pipIds]
      );
      await connection.query('DELETE FROM performance_pip WHERE id IN (?)', [pipIds]);
    }
  }

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_pip
        (assessmentId, employeeId, ownerId, title, improvementGoal, sourceReason, startDate, endDate, status, resultSummary, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.assessmentId,
        row.employeeId,
        row.ownerId,
        row.title,
        row.improvementGoal,
        row.sourceReason,
        row.startDate,
        row.endDate,
        row.status,
        row.resultSummary,
        now(),
        now(),
      ]
    );

    for (const trackRecord of row.trackRecords || []) {
      await connection.query(
        `INSERT INTO performance_pip_record
          (pipId, recordDate, progress, nextPlan, operatorId, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          trackRecord.recordDate,
          trackRecord.progress,
          trackRecord.nextPlan,
          trackRecord.operatorId,
          now(),
          now(),
        ]
      );
    }
  }
}

async function replacePromotions(seedRows) {
  const toPositions = seedRows.map(item => item.toPosition);
  if (toPositions.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_promotion WHERE toPosition IN (?)',
      [toPositions]
    );
    const promotionIds = existing.map(item => item.id);
    if (promotionIds.length) {
      await connection.query(
        'DELETE FROM performance_promotion_record WHERE promotionId IN (?)',
        [promotionIds]
      );
      await connection.query(
        'DELETE FROM performance_promotion WHERE id IN (?)',
        [promotionIds]
      );
    }
  }

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_promotion
        (assessmentId, employeeId, sponsorId, fromPosition, toPosition, reason, sourceReason, status, reviewTime, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.assessmentId,
        row.employeeId,
        row.sponsorId,
        row.fromPosition,
        row.toPosition,
        row.reason,
        row.sourceReason,
        row.status,
        row.reviewTime,
        now(),
        now(),
      ]
    );

    for (const reviewRecord of row.reviewRecords || []) {
      await connection.query(
        `INSERT INTO performance_promotion_record
          (promotionId, reviewerId, decision, comment, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          reviewRecord.reviewerId,
          reviewRecord.decision,
          reviewRecord.comment,
          now(),
          now(),
        ]
      );
    }
  }
}

async function replaceSalaries(seedRows) {
  const assessmentIds = seedRows
    .map(item => item.assessmentId)
    .filter(Boolean);
  const employeeIds = [...new Set(seedRows.map(item => item.employeeId).filter(Boolean))];
  const periodValues = [...new Set(seedRows.map(item => item.periodValue).filter(Boolean))];
  const staleSalaryIds = new Set();

  if (assessmentIds.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_salary WHERE assessmentId IN (?)',
      [assessmentIds]
    );
    existing.forEach(item => staleSalaryIds.add(item.id));
  }

  if (employeeIds.length && periodValues.length) {
    const [existingByStableKey] = await connection.query(
      `SELECT id
         FROM performance_salary
        WHERE employeeId IN (?)
          AND periodValue IN (?)`,
      [employeeIds, periodValues]
    );
    existingByStableKey.forEach(item => staleSalaryIds.add(item.id));
  }

  const salaryIds = [...staleSalaryIds];

  if (salaryIds.length) {
    await connection.query(
      'DELETE FROM performance_salary_change WHERE salaryId IN (?)',
      [salaryIds]
    );
    await connection.query(
      'DELETE FROM performance_salary WHERE id IN (?)',
      [salaryIds]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_salary
        (employeeId, assessmentId, periodValue, baseSalary, performanceBonus, adjustAmount, finalAmount, grade, effectiveDate, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.employeeId,
        row.assessmentId,
        row.periodValue,
        row.baseSalary,
        row.performanceBonus,
        row.adjustAmount,
        row.finalAmount,
        row.grade,
        row.effectiveDate,
        row.status,
        now(),
        now(),
      ]
    );
  }
}

async function replaceFeedbackTasks(seedRows) {
  const titles = seedRows.map(item => item.title);
  if (titles.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_feedback_task WHERE title IN (?)',
      [titles]
    );
    const taskIds = existing.map(item => item.id);
    if (taskIds.length) {
      await connection.query(
        'DELETE FROM performance_feedback_record WHERE taskId IN (?)',
        [taskIds]
      );
      await connection.query(
        'DELETE FROM performance_feedback_task WHERE id IN (?)',
        [taskIds]
      );
    }
  }

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_feedback_task
        (assessmentId, employeeId, title, deadline, creatorId, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.assessmentId,
        row.employeeId,
        row.title,
        row.deadline,
        row.creatorId,
        row.status,
        now(),
        now(),
      ]
    );

    for (const feedbackRecord of row.records || []) {
      await connection.query(
        `INSERT INTO performance_feedback_record
          (taskId, feedbackUserId, relationType, score, content, status, submitTime, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          feedbackRecord.feedbackUserId,
          feedbackRecord.relationType,
          feedbackRecord.score,
          feedbackRecord.content,
          feedbackRecord.status,
          feedbackRecord.submitTime,
          now(),
          now(),
        ]
      );
    }
  }
}

async function replaceTalentAssets(seedRows) {
  const candidateNames = [...new Set(seedRows.map(item => item.candidateName).filter(Boolean))];
  const codes = [...new Set(seedRows.map(item => item.code).filter(Boolean))];

  const staleIds = new Set();

  if (candidateNames.length) {
    const [existingByName] = await connection.query(
      'SELECT id FROM performance_talent_asset WHERE candidateName IN (?)',
      [candidateNames]
    );
    existingByName.forEach(item => staleIds.add(item.id));
  }

  if (codes.length) {
    const [existingByCode] = await connection.query(
      'SELECT id FROM performance_talent_asset WHERE code IN (?)',
      [codes]
    );
    existingByCode.forEach(item => staleIds.add(item.id));
  }

  const ids = [...staleIds];
  if (ids.length) {
    await connection.query(
      'DELETE FROM performance_talent_asset WHERE id IN (?)',
      [ids]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_talent_asset
        (candidateName, code, targetDepartmentId, targetPosition, source, tagList, followUpSummary, nextFollowUpDate, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.candidateName,
        row.code ?? null,
        row.targetDepartmentId,
        row.targetPosition ?? null,
        row.source,
        JSON.stringify(row.tagList || []),
        row.followUpSummary ?? null,
        row.nextFollowUpDate ?? null,
        row.status,
        now(),
        now(),
      ]
    );
  }
}

async function replaceResumePools(seedRows) {
  const candidateNames = [...new Set(seedRows.map(item => item.candidateName).filter(Boolean))];

  if (candidateNames.length) {
    await connection.query(
      'DELETE FROM performance_resume_pool WHERE candidateName IN (?)',
      [candidateNames]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_resume_pool
        (candidateName, targetDepartmentId, targetPosition, phone, email, resumeText, sourceType, sourceRemark, externalLink, attachmentIdList, status, linkedTalentAssetId, latestInterviewId, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.candidateName,
        row.targetDepartmentId,
        row.targetPosition ?? null,
        row.phone,
        row.email ?? null,
        row.resumeText,
        row.sourceType,
        row.sourceRemark ?? null,
        row.externalLink ?? null,
        JSON.stringify(row.attachmentIdList || []),
        row.status,
        row.linkedTalentAssetId ?? null,
        row.latestInterviewId ?? null,
        now(),
        now(),
      ]
    );
  }
}

async function replaceHirings(seedRows) {
  const candidateNames = [...new Set(seedRows.map(item => item.candidateName).filter(Boolean))];

  if (candidateNames.length) {
    await connection.query(
      'DELETE FROM performance_hiring WHERE candidateName IN (?)',
      [candidateNames]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_hiring
        (candidateName, targetDepartmentId, targetPosition, decisionContent, sourceType, sourceId, sourceSnapshot, status, offeredAt, acceptedAt, rejectedAt, closedAt, closeReason, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.candidateName,
        row.targetDepartmentId,
        row.targetPosition ?? null,
        row.decisionContent ?? null,
        row.sourceType ?? 'manual',
        row.sourceId ?? null,
        row.sourceSnapshot ? JSON.stringify(row.sourceSnapshot) : null,
        row.status ?? 'offered',
        row.offeredAt ?? now(),
        row.acceptedAt ?? null,
        row.rejectedAt ?? null,
        row.closedAt ?? null,
        row.closeReason ?? null,
        now(),
        now(),
      ]
    );
  }
}

async function replaceRecruitPlans(seedRows) {
  const titles = [...new Set(seedRows.map(item => item.title).filter(Boolean))];

  if (titles.length) {
    await connection.query(
      'DELETE FROM performance_recruit_plan WHERE title IN (?)',
      [titles]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_recruit_plan
        (title, targetDepartmentId, positionName, headcount, startDate, endDate, recruiterId, requirementSummary, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.title,
        row.targetDepartmentId,
        row.positionName,
        row.headcount,
        row.startDate,
        row.endDate,
        row.recruiterId ?? null,
        row.requirementSummary ?? null,
        row.status ?? 'draft',
        now(),
        now(),
      ]
    );
  }
}

async function upsertSpaceInfoSeed(row) {
  const existing = await queryOne(
    'SELECT id FROM space_info WHERE fileId = ? LIMIT 1',
    [row.fileId]
  );

  const payload = [
    row.url,
    row.type,
    row.classifyId ?? null,
    row.fileId,
    row.name,
    row.size,
    row.version ?? 1,
    row.key,
    now(),
  ];

  if (existing) {
    await connection.query(
      `UPDATE space_info
          SET url = ?, type = ?, classifyId = ?, fileId = ?, name = ?, size = ?, version = ?, \`key\` = ?, updateTime = ?
        WHERE id = ?`,
      [...payload, existing.id]
    );
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO space_info
      (url, type, classifyId, fileId, name, size, version, \`key\`, createTime, updateTime, tenantId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [...payload.slice(0, 8), now(), now()]
  );

  return result.insertId;
}

async function replaceJobStandards(seedRows) {
  const positionNames = [...new Set(seedRows.map(item => item.positionName).filter(Boolean))];

  if (positionNames.length) {
    await connection.query(
      'DELETE FROM performance_job_standard WHERE positionName IN (?)',
      [positionNames]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_job_standard
        (positionName, targetDepartmentId, jobLevel, profileSummary, requirementSummary, skillTagList, interviewTemplateSummary, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.positionName,
        row.targetDepartmentId,
        row.jobLevel ?? null,
        row.profileSummary ?? null,
        row.requirementSummary ?? null,
        JSON.stringify(row.skillTagList || []),
        row.interviewTemplateSummary ?? null,
        row.status,
        now(),
        now(),
      ]
    );
  }
}

async function replaceTeacherChannelData(seedRows) {
  const teacherNames = [...new Set(seedRows.map(item => item.teacherName).filter(Boolean))];
  const classNames = [
    ...new Set(
      seedRows.flatMap(item => (item.classes || []).map(classRow => classRow.className).filter(Boolean))
    ),
  ];

  if (teacherNames.length) {
    const [existingTeachers] = await connection.query(
      'SELECT id FROM performance_teacher_info WHERE teacherName IN (?)',
      [teacherNames]
    );
    const teacherIds = existingTeachers.map(item => item.id);

    if (teacherIds.length) {
      await connection.query(
        'DELETE FROM performance_teacher_follow WHERE teacherId IN (?)',
        [teacherIds]
      );
      await connection.query(
        'DELETE FROM performance_teacher_class WHERE teacherId IN (?)',
        [teacherIds]
      );
      await connection.query(
        'DELETE FROM performance_teacher_info WHERE id IN (?)',
        [teacherIds]
      );
    }
  }

  if (classNames.length) {
    await connection.query(
      'DELETE FROM performance_teacher_class WHERE className IN (?)',
      [classNames]
    );
  }

  const inserted = [];

  for (const row of seedRows) {
    const [teacherResult] = await connection.query(
      `INSERT INTO performance_teacher_info
        (teacherName, phone, wechat, schoolName, schoolRegion, schoolType, grade, className, subject, projectTags, intentionLevel, communicationStyle, cooperationStatus, ownerEmployeeId, ownerDepartmentId, lastFollowTime, nextFollowTime, cooperationTime, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.teacherName,
        row.phone ?? null,
        row.wechat ?? null,
        row.schoolName ?? null,
        row.schoolRegion ?? null,
        row.schoolType ?? null,
        row.grade ?? null,
        row.className ?? null,
        row.subject ?? null,
        JSON.stringify(row.projectTags || []),
        row.intentionLevel ?? null,
        row.communicationStyle ?? null,
        row.cooperationStatus,
        row.ownerEmployeeId,
        row.ownerDepartmentId,
        row.lastFollowTime ?? null,
        row.nextFollowTime ?? null,
        row.cooperationTime ?? null,
        now(),
        now(),
      ]
    );

    const teacherId = teacherResult.insertId;

    for (const follow of row.follows || []) {
      await connection.query(
        `INSERT INTO performance_teacher_follow
          (teacherId, followTime, nextFollowTime, followMethod, followContent, creatorEmployeeId, creatorEmployeeName, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          teacherId,
          follow.followTime,
          follow.nextFollowTime ?? null,
          follow.followMethod ?? null,
          follow.followContent,
          follow.creatorEmployeeId,
          follow.creatorEmployeeName,
          now(),
          now(),
        ]
      );
    }

    for (const teacherClass of row.classes || []) {
      await connection.query(
        `INSERT INTO performance_teacher_class
          (teacherId, teacherName, className, schoolName, grade, projectTag, studentCount, status, ownerEmployeeId, ownerDepartmentId, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          teacherId,
          row.teacherName,
          teacherClass.className,
          row.schoolName ?? null,
          row.grade ?? null,
          teacherClass.projectTag ?? null,
          teacherClass.studentCount ?? 0,
          teacherClass.status,
          row.ownerEmployeeId,
          row.ownerDepartmentId,
          now(),
          now(),
        ]
      );
    }

    inserted.push({
      id: teacherId,
      ...row,
    });
  }

  return inserted;
}

async function ensureCourseTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_course (
      id int NOT NULL AUTO_INCREMENT,
      title varchar(200) NOT NULL,
      code varchar(100) DEFAULT NULL,
      category varchar(100) DEFAULT NULL,
      description text DEFAULT NULL,
      startDate varchar(10) DEFAULT NULL,
      endDate varchar(10) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_course_code (code),
      KEY idx_performance_course_title (title),
      KEY idx_performance_course_category (category),
      KEY idx_performance_course_status (status),
      KEY idx_performance_course_create_time (createTime),
      KEY idx_performance_course_update_time (updateTime),
      KEY idx_performance_course_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_course_enrollment (
      id int NOT NULL AUTO_INCREMENT,
      courseId int NOT NULL,
      userId int NOT NULL,
      enrollTime varchar(19) DEFAULT NULL,
      status varchar(50) DEFAULT NULL,
      score decimal(8,2) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_course_enrollment_course_user (courseId, userId),
      KEY idx_performance_course_enrollment_course (courseId),
      KEY idx_performance_course_enrollment_user (userId),
      KEY idx_performance_course_enrollment_status (status),
      KEY idx_performance_course_enrollment_enroll_time (enrollTime),
      KEY idx_performance_course_enrollment_create_time (createTime),
      KEY idx_performance_course_enrollment_update_time (updateTime),
      KEY idx_performance_course_enrollment_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function replaceCourses(seedRows) {
  const titles = seedRows.map(item => item.title);
  const inserted = [];

  if (titles.length) {
    const [existing] = await connection.query(
      'SELECT id FROM performance_course WHERE title IN (?)',
      [titles]
    );
    const courseIds = existing.map(item => item.id);

    if (courseIds.length) {
      await connection.query(
        'DELETE FROM performance_course_enrollment WHERE courseId IN (?)',
        [courseIds]
      );
      await connection.query('DELETE FROM performance_course WHERE id IN (?)', [
        courseIds,
      ]);
    }
  }

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_course
        (title, code, category, description, startDate, endDate, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.title,
        row.code,
        row.category,
        row.description,
        row.startDate,
        row.endDate,
        row.status,
        now(),
        now(),
      ]
    );

    for (const enrollment of row.enrollments || []) {
      await connection.query(
        `INSERT INTO performance_course_enrollment
          (courseId, userId, enrollTime, status, score, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          enrollment.userId,
          enrollment.enrollTime,
          enrollment.status,
          enrollment.score,
          now(),
          now(),
        ]
      );
    }

    inserted.push({
      id: result.insertId,
      ...row,
    });
  }

  return inserted;
}

async function ensureCourseLearningTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_course_recite (
      id int NOT NULL AUTO_INCREMENT,
      courseId int NOT NULL,
      employeeId int NOT NULL,
      courseTitle varchar(200) NOT NULL,
      title varchar(200) NOT NULL,
      taskType varchar(20) NOT NULL DEFAULT 'recite',
      promptText text DEFAULT NULL,
      submissionText text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      latestScore decimal(8,2) DEFAULT NULL,
      feedbackSummary varchar(500) DEFAULT NULL,
      submittedAt varchar(19) DEFAULT NULL,
      evaluatedAt varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_course_recite_scope (courseId, employeeId, title),
      KEY idx_performance_course_recite_course_id (courseId),
      KEY idx_performance_course_recite_employee_id (employeeId),
      KEY idx_performance_course_recite_status (status),
      KEY idx_performance_course_recite_update_time (updateTime),
      KEY idx_performance_course_recite_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_course_practice (
      id int NOT NULL AUTO_INCREMENT,
      courseId int NOT NULL,
      employeeId int NOT NULL,
      courseTitle varchar(200) NOT NULL,
      title varchar(200) NOT NULL,
      taskType varchar(20) NOT NULL DEFAULT 'practice',
      promptText text DEFAULT NULL,
      submissionText text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      latestScore decimal(8,2) DEFAULT NULL,
      feedbackSummary varchar(500) DEFAULT NULL,
      submittedAt varchar(19) DEFAULT NULL,
      evaluatedAt varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_course_practice_scope (courseId, employeeId, title),
      KEY idx_performance_course_practice_course_id (courseId),
      KEY idx_performance_course_practice_employee_id (employeeId),
      KEY idx_performance_course_practice_status (status),
      KEY idx_performance_course_practice_update_time (updateTime),
      KEY idx_performance_course_practice_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_course_exam (
      id int NOT NULL AUTO_INCREMENT,
      courseId int NOT NULL,
      employeeId int NOT NULL,
      courseTitle varchar(200) NOT NULL,
      resultStatus varchar(20) NOT NULL DEFAULT 'locked',
      latestScore decimal(8,2) DEFAULT NULL,
      passThreshold decimal(8,2) DEFAULT NULL,
      summaryText varchar(500) DEFAULT NULL,
      updatedAt varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_course_exam_scope (courseId, employeeId),
      KEY idx_performance_course_exam_course_id (courseId),
      KEY idx_performance_course_exam_employee_id (employeeId),
      KEY idx_performance_course_exam_status (resultStatus),
      KEY idx_performance_course_exam_update_time (updateTime),
      KEY idx_performance_course_exam_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function replaceCourseTaskRows(tableName, seedRows) {
  for (const row of seedRows) {
    await connection.query(
      `DELETE FROM ${tableName}
        WHERE courseId = ?
          AND employeeId = ?
          AND title = ?`,
      [row.courseId, row.employeeId, row.title]
    );

    await connection.query(
      `INSERT INTO ${tableName}
        (courseId, employeeId, courseTitle, title, taskType, promptText, submissionText, status, latestScore, feedbackSummary, submittedAt, evaluatedAt, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.courseId,
        row.employeeId,
        row.courseTitle,
        row.title,
        row.taskType,
        row.promptText ?? null,
        row.submissionText ?? null,
        row.status,
        row.latestScore ?? null,
        row.feedbackSummary ?? null,
        row.submittedAt ?? null,
        row.evaluatedAt ?? null,
        now(),
        now(),
      ]
    );
  }
}

async function replaceCourseExamRows(seedRows) {
  for (const row of seedRows) {
    await connection.query(
      `DELETE FROM performance_course_exam
        WHERE courseId = ?
          AND employeeId = ?`,
      [row.courseId, row.employeeId]
    );

    await connection.query(
      `INSERT INTO performance_course_exam
        (courseId, employeeId, courseTitle, resultStatus, latestScore, passThreshold, summaryText, updatedAt, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.courseId,
        row.employeeId,
        row.courseTitle,
        row.resultStatus,
        row.latestScore ?? null,
        row.passThreshold ?? null,
        row.summaryText ?? null,
        row.updatedAt ?? null,
        now(),
        now(),
      ]
    );
  }
}

async function replaceMeetings(seedRows) {
  const titles = seedRows.map(item => item.title);

  if (titles.length) {
    await connection.query('DELETE FROM performance_meeting WHERE title IN (?)', [
      titles,
    ]);
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_meeting
        (title, code, type, description, startDate, endDate, location, organizerId, participantIds, participantCount, status, lastCheckInTime, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.title,
        row.code,
        row.type,
        row.description,
        row.startDate,
        row.endDate,
        row.location,
        row.organizerId,
        JSON.stringify(row.participantIds || []),
        row.participantCount,
        row.status,
        row.lastCheckInTime ?? null,
        now(),
        now(),
      ]
    );
  }
}

async function replaceContracts(seedRows) {
  const contractNumbers = seedRows
    .map(item => item.contractNumber)
    .filter(Boolean);

  if (contractNumbers.length) {
    await connection.query(
      'DELETE FROM performance_contract WHERE contractNumber IN (?)',
      [contractNumbers]
    );
  }

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_contract
        (employeeId, type, title, contractNumber, startDate, endDate, probationPeriod, salary, position, departmentId, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.employeeId,
        row.type,
        row.title,
        row.contractNumber,
        row.startDate,
        row.endDate,
        row.probationPeriod ?? null,
        row.salary ?? null,
        row.position ?? null,
        row.departmentId ?? null,
        row.status,
        now(),
        now(),
      ]
    );
  }
}

async function replaceDocumentCenters(seedRows) {
  const fileNos = seedRows.map(item => item.fileNo).filter(Boolean);

  if (fileNos.length) {
    await connection.query(
      'DELETE FROM performance_document_center WHERE fileNo IN (?)',
      [fileNos]
    );
  }

  const inserted = [];

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_document_center
        (fileNo, fileName, category, fileType, storage, confidentiality, ownerName, department, status, version, sizeMb, downloadCount, expireDate, tags, notes, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.fileNo,
        row.fileName,
        row.category,
        row.fileType,
        row.storage,
        row.confidentiality,
        row.ownerName,
        row.department,
        row.status,
        row.version,
        row.sizeMb ?? 0,
        row.downloadCount ?? 0,
        row.expireDate ?? null,
        JSON.stringify(row.tags || []),
        row.notes ?? null,
        now(),
        now(),
      ]
    );

    inserted.push({
      id: result.insertId,
      ...row,
    });
  }

  return inserted;
}

async function replaceKnowledgeBases(seedRows) {
  const kbNos = seedRows.map(item => item.kbNo).filter(Boolean);

  if (kbNos.length) {
    await connection.query(
      'DELETE FROM performance_knowledge_base WHERE kbNo IN (?)',
      [kbNos]
    );
  }

  const inserted = [];

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_knowledge_base
        (kbNo, title, category, summary, ownerName, status, tags, relatedFileIds, relatedTopics, importance, viewCount, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.kbNo,
        row.title,
        row.category,
        row.summary,
        row.ownerName,
        row.status,
        JSON.stringify(row.tags || []),
        JSON.stringify(row.relatedFileIds || []),
        JSON.stringify(row.relatedTopics || []),
        row.importance ?? 70,
        row.viewCount ?? 0,
        now(),
        now(),
      ]
    );

    inserted.push({
      id: result.insertId,
      ...row,
    });
  }

  return inserted;
}

async function replaceKnowledgeQas(seedRows) {
  const questions = seedRows.map(item => item.question).filter(Boolean);

  if (questions.length) {
    await connection.query(
      'DELETE FROM performance_knowledge_qa WHERE question IN (?)',
      [questions]
    );
  }

  const inserted = [];

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_knowledge_qa
        (question, answer, relatedKnowledgeIds, relatedFileIds, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.question,
        row.answer,
        JSON.stringify(row.relatedKnowledgeIds || []),
        JSON.stringify(row.relatedFileIds || []),
        now(),
        now(),
      ]
    );

    inserted.push({
      id: result.insertId,
      ...row,
    });
  }

  return inserted;
}

async function replaceSuppliers(seedRows) {
  const names = seedRows.map(item => item.name);
  const codes = seedRows.map(item => item.code).filter(Boolean);

  if (names.length) {
    await connection.query('DELETE FROM performance_supplier WHERE name IN (?)', [names]);
  }

  if (codes.length) {
    await connection.query('DELETE FROM performance_supplier WHERE code IN (?)', [codes]);
  }

  const inserted = [];

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_supplier
        (name, code, category, contactName, contactPhone, contactEmail, bankAccount, taxNo, remark, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.name,
        row.code ?? null,
        row.category ?? null,
        row.contactName ?? null,
        row.contactPhone ?? null,
        row.contactEmail ?? null,
        row.bankAccount ?? null,
        row.taxNo ?? null,
        row.remark ?? null,
        row.status,
        now(),
        now(),
      ]
    );

    inserted.push({
      id: result.insertId,
      ...row,
    });
  }

  return inserted;
}

async function replacePurchaseOrders(seedRows) {
  const titles = seedRows.map(item => item.title);
  const orderNos = seedRows.map(item => item.orderNo).filter(Boolean);

  if (titles.length) {
    await connection.query('DELETE FROM performance_purchase_order WHERE title IN (?)', [titles]);
  }

  if (orderNos.length) {
    await connection.query('DELETE FROM performance_purchase_order WHERE orderNo IN (?)', [orderNos]);
  }

  const inserted = [];

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_purchase_order
        (orderNo, title, supplierId, departmentId, requesterId, orderDate, totalAmount, currency, remark, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.orderNo ?? null,
        row.title,
        row.supplierId,
        row.departmentId,
        row.requesterId,
        row.orderDate,
        row.totalAmount,
        row.currency ?? 'CNY',
        row.remark ?? null,
        row.status,
        now(),
        now(),
      ]
    );

    inserted.push({
      id: result.insertId,
      ...row,
    });
  }

  return inserted;
}

async function ensureCapabilityTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_capability_model (
      id int NOT NULL AUTO_INCREMENT,
      name varchar(200) NOT NULL,
      code varchar(100) DEFAULT NULL,
      category varchar(100) DEFAULT NULL,
      description text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_capability_model_code (code),
      KEY idx_performance_capability_model_name (name),
      KEY idx_performance_capability_model_category (category),
      KEY idx_performance_capability_model_status (status),
      KEY idx_performance_capability_model_create_time (createTime),
      KEY idx_performance_capability_model_update_time (updateTime),
      KEY idx_performance_capability_model_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_capability_item (
      id int NOT NULL AUTO_INCREMENT,
      modelId int NOT NULL,
      name varchar(200) NOT NULL,
      level varchar(50) DEFAULT NULL,
      description text DEFAULT NULL,
      evidenceHint text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_capability_item_model_name (modelId, name),
      KEY idx_performance_capability_item_model_id (modelId),
      KEY idx_performance_capability_item_level (level),
      KEY idx_performance_capability_item_update_time (updateTime),
      KEY idx_performance_capability_item_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_capability_portrait (
      id int NOT NULL AUTO_INCREMENT,
      employeeId int NOT NULL,
      departmentId int DEFAULT NULL,
      capabilityTags json DEFAULT NULL,
      levelSummary json DEFAULT NULL,
      updatedAt varchar(19) NOT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_capability_portrait_employee (employeeId),
      KEY idx_performance_capability_portrait_department_id (departmentId),
      KEY idx_performance_capability_portrait_updated_at (updatedAt),
      KEY idx_performance_capability_portrait_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_certificate (
      id int NOT NULL AUTO_INCREMENT,
      name varchar(200) NOT NULL,
      code varchar(100) DEFAULT NULL,
      category varchar(100) DEFAULT NULL,
      issuer varchar(200) DEFAULT NULL,
      description text DEFAULT NULL,
      validityMonths int DEFAULT NULL,
      sourceCourseId int DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_certificate_code (code),
      KEY idx_performance_certificate_name (name),
      KEY idx_performance_certificate_category (category),
      KEY idx_performance_certificate_status (status),
      KEY idx_performance_certificate_source_course_id (sourceCourseId),
      KEY idx_performance_certificate_update_time (updateTime),
      KEY idx_performance_certificate_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_certificate_record (
      id int NOT NULL AUTO_INCREMENT,
      certificateId int NOT NULL,
      employeeId int NOT NULL,
      departmentId int DEFAULT NULL,
      sourceCourseId int DEFAULT NULL,
      issuedAt varchar(19) NOT NULL,
      issuedById int NOT NULL,
      issuedBy varchar(100) NOT NULL,
      remark text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'issued',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_certificate_record_certificate_id (certificateId),
      KEY idx_performance_certificate_record_employee_id (employeeId),
      KEY idx_performance_certificate_record_department_id (departmentId),
      KEY idx_performance_certificate_record_source_course_id (sourceCourseId),
      KEY idx_performance_certificate_record_issued_at (issuedAt),
      KEY idx_performance_certificate_record_status (status),
      KEY idx_performance_certificate_record_update_time (updateTime),
      KEY idx_performance_certificate_record_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function replaceCapabilitySeedData({
  employeeUserId,
  salesEmployeeUserId,
  platformGroupId,
  salesCenterId,
  hrUserId,
  sourceCourseId,
}) {
  const capabilityModels = [
    {
      name: '联调-平台岗位通用能力模型',
      code: 'PMS-CAPABILITY-PLATFORM-001',
      category: '岗位能力',
      description: '主题13联调用平台岗位能力模型',
      status: 'active',
      items: [
        {
          name: '沟通协作',
          level: 'L2',
          description: '跨团队同步与反馈摘要',
          evidenceHint: '季度复盘、跨团队协作记录',
        },
        {
          name: '执行推进',
          level: 'L2',
          description: '目标推进与闭环摘要',
          evidenceHint: '目标完成率、项目里程碑',
        },
      ],
    },
    {
      name: '联调-销售岗位能力模型',
      code: 'PMS-CAPABILITY-SALES-001',
      category: '岗位能力',
      description: '主题13联调用销售岗位能力模型',
      status: 'archived',
      items: [
        {
          name: '客户洞察',
          level: 'L3',
          description: '客户需求识别摘要',
          evidenceHint: '客户拜访纪要、线索转化摘要',
        },
      ],
    },
  ];

  const [existingModels] = await connection.query(
    'SELECT id FROM performance_capability_model WHERE code IN (?)',
    [capabilityModels.map(item => item.code)]
  );
  const modelIds = existingModels.map(item => item.id);

  if (modelIds.length) {
    await connection.query('DELETE FROM performance_capability_item WHERE modelId IN (?)', [
      modelIds,
    ]);
    await connection.query('DELETE FROM performance_capability_model WHERE id IN (?)', [
      modelIds,
    ]);
  }

  for (const row of capabilityModels) {
    const [result] = await connection.query(
      `INSERT INTO performance_capability_model
        (name, code, category, description, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      [row.name, row.code, row.category, row.description, row.status, now(), now()]
    );

    for (const item of row.items) {
      await connection.query(
        `INSERT INTO performance_capability_item
          (modelId, name, level, description, evidenceHint, createTime, updateTime, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          result.insertId,
          item.name,
          item.level,
          item.description,
          item.evidenceHint,
          now(),
          now(),
        ]
      );
    }
  }

  await connection.query(
    'DELETE FROM performance_capability_portrait WHERE employeeId IN (?, ?)',
    [employeeUserId, salesEmployeeUserId]
  );
  await connection.query(
    `INSERT INTO performance_capability_portrait
      (employeeId, departmentId, capabilityTags, levelSummary, updatedAt, createTime, updateTime, tenantId)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL), (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      employeeUserId,
      platformGroupId,
      JSON.stringify(['沟通协作', '执行推进']),
      JSON.stringify(['L2', 'L2']),
      '2026-05-11 10:00:00',
      now(),
      now(),
      salesEmployeeUserId,
      salesCenterId,
      JSON.stringify(['客户洞察']),
      JSON.stringify(['L3']),
      '2026-05-11 10:05:00',
      now(),
      now(),
    ]
  );

  const certificateRows = [
    {
      name: '联调-PMP认证',
      code: 'PMS-CERT-PMP-001',
      category: '管理认证',
      issuer: 'PMI',
      description: '主题13联调用平台员工证书',
      validityMonths: 36,
      sourceCourseId: sourceCourseId ?? null,
      status: 'active',
    },
    {
      name: '联调-销售能力认证',
      code: 'PMS-CERT-SALES-001',
      category: '销售认证',
      issuer: '内部认证中心',
      description: '主题13联调用销售员工证书',
      validityMonths: 12,
      sourceCourseId: null,
      status: 'retired',
    },
  ];
  const [existingCertificates] = await connection.query(
    'SELECT id FROM performance_certificate WHERE code IN (?)',
    [certificateRows.map(item => item.code)]
  );
  const certificateIds = existingCertificates.map(item => item.id);

  if (certificateIds.length) {
    await connection.query(
      'DELETE FROM performance_certificate_record WHERE certificateId IN (?)',
      [certificateIds]
    );
    await connection.query('DELETE FROM performance_certificate WHERE id IN (?)', [
      certificateIds,
    ]);
  }

  const certificateIdMap = new Map();

  for (const row of certificateRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_certificate
        (name, code, category, issuer, description, validityMonths, sourceCourseId, status, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.name,
        row.code,
        row.category,
        row.issuer,
        row.description,
        row.validityMonths,
        row.sourceCourseId,
        row.status,
        now(),
        now(),
      ]
    );
    certificateIdMap.set(row.code, result.insertId);
  }

  await connection.query(
    `INSERT INTO performance_certificate_record
      (certificateId, employeeId, departmentId, sourceCourseId, issuedAt, issuedById, issuedBy, remark, status, createTime, updateTime, tenantId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      certificateIdMap.get('PMS-CERT-PMP-001'),
      employeeUserId,
      platformGroupId,
      sourceCourseId ?? null,
      '2026-05-12 10:00:00',
      hrUserId,
      'HR管理员',
      '主题13联调-平台员工获证',
      'issued',
      now(),
      now(),
      certificateIdMap.get('PMS-CERT-SALES-001'),
      salesEmployeeUserId,
      salesCenterId,
      null,
      '2026-05-13 15:30:00',
      hrUserId,
      'HR管理员',
      '主题13联调-销售员工获证',
      'issued',
      now(),
      now(),
    ]
  );
}

async function ensureInterviewTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_interview (
      id int NOT NULL AUTO_INCREMENT,
      candidateName varchar(100) NOT NULL,
      position varchar(100) NOT NULL,
      departmentId int DEFAULT NULL,
      interviewerId int NOT NULL,
      interviewDate varchar(19) NOT NULL,
      interviewType varchar(20) DEFAULT NULL,
      score decimal(5,2) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'scheduled',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_interview_candidate_name (candidateName),
      KEY idx_performance_interview_department_id (departmentId),
      KEY idx_performance_interview_interviewer_id (interviewerId),
      KEY idx_performance_interview_interview_date (interviewDate),
      KEY idx_performance_interview_status (status),
      KEY idx_performance_interview_create_time (createTime),
      KEY idx_performance_interview_update_time (updateTime),
      KEY idx_performance_interview_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTableColumn(
    'performance_interview',
    'resumePoolId',
    '`resumePoolId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_interview',
    'recruitPlanId',
    '`recruitPlanId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_interview',
    'resumePoolSnapshot',
    '`resumePoolSnapshot` json DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_interview',
    'recruitPlanSnapshot',
    '`recruitPlanSnapshot` json DEFAULT NULL'
  );
}

async function ensureMeetingTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_meeting (
      id int NOT NULL AUTO_INCREMENT,
      title varchar(200) NOT NULL,
      code varchar(100) DEFAULT NULL,
      type varchar(100) DEFAULT NULL,
      description text DEFAULT NULL,
      startDate varchar(19) NOT NULL,
      endDate varchar(19) NOT NULL,
      location varchar(200) DEFAULT NULL,
      organizerId int NOT NULL,
      participantIds json DEFAULT NULL,
      participantCount int NOT NULL DEFAULT 0,
      status varchar(20) NOT NULL DEFAULT 'scheduled',
      lastCheckInTime varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_meeting_title (title),
      KEY idx_performance_meeting_code (code),
      KEY idx_performance_meeting_start_date (startDate),
      KEY idx_performance_meeting_end_date (endDate),
      KEY idx_performance_meeting_organizer_id (organizerId),
      KEY idx_performance_meeting_status (status),
      KEY idx_performance_meeting_last_check_in_time (lastCheckInTime),
      KEY idx_performance_meeting_create_time (createTime),
      KEY idx_performance_meeting_update_time (updateTime),
      KEY idx_performance_meeting_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureTalentAssetTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_talent_asset (
      id int NOT NULL AUTO_INCREMENT,
      candidateName varchar(100) NOT NULL,
      code varchar(100) DEFAULT NULL,
      targetDepartmentId int NOT NULL,
      targetPosition varchar(100) DEFAULT NULL,
      source varchar(100) NOT NULL,
      tagList json DEFAULT NULL,
      followUpSummary text DEFAULT NULL,
      nextFollowUpDate varchar(19) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'new',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_talent_asset_code (code),
      KEY idx_performance_talent_asset_candidate_name (candidateName),
      KEY idx_performance_talent_asset_target_department_id (targetDepartmentId),
      KEY idx_performance_talent_asset_status (status),
      KEY idx_performance_talent_asset_create_time (createTime),
      KEY idx_performance_talent_asset_update_time (updateTime),
      KEY idx_performance_talent_asset_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureResumePoolTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_resume_pool (
      id int NOT NULL AUTO_INCREMENT,
      candidateName varchar(100) NOT NULL,
      targetDepartmentId int NOT NULL,
      targetPosition varchar(100) DEFAULT NULL,
      phone varchar(30) NOT NULL,
      email varchar(100) DEFAULT NULL,
      resumeText text NOT NULL,
      sourceType varchar(20) NOT NULL,
      sourceRemark text DEFAULT NULL,
      externalLink varchar(500) DEFAULT NULL,
      attachmentIdList json DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'new',
      linkedTalentAssetId int DEFAULT NULL,
      latestInterviewId int DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_resume_pool_candidate_name (candidateName),
      KEY idx_performance_resume_pool_target_department_id (targetDepartmentId),
      KEY idx_performance_resume_pool_phone (phone),
      KEY idx_performance_resume_pool_email (email),
      KEY idx_performance_resume_pool_source_type (sourceType),
      KEY idx_performance_resume_pool_status (status),
      KEY idx_performance_resume_pool_linked_talent_asset_id (linkedTalentAssetId),
      KEY idx_performance_resume_pool_latest_interview_id (latestInterviewId),
      KEY idx_performance_resume_pool_create_time (createTime),
      KEY idx_performance_resume_pool_update_time (updateTime),
      KEY idx_performance_resume_pool_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTableColumn(
    'performance_resume_pool',
    'recruitPlanId',
    '`recruitPlanId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_resume_pool',
    'jobStandardId',
    '`jobStandardId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_resume_pool',
    'recruitPlanSnapshot',
    '`recruitPlanSnapshot` json DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_resume_pool',
    'jobStandardSnapshot',
    '`jobStandardSnapshot` json DEFAULT NULL'
  );
}

async function ensureHiringTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_hiring (
      id int NOT NULL AUTO_INCREMENT,
      candidateName varchar(100) NOT NULL,
      targetDepartmentId int NOT NULL,
      targetPosition varchar(100) DEFAULT NULL,
      decisionContent text DEFAULT NULL,
      sourceType varchar(30) DEFAULT NULL,
      sourceId int DEFAULT NULL,
      sourceSnapshot json DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'offered',
      offeredAt varchar(19) DEFAULT NULL,
      acceptedAt varchar(19) DEFAULT NULL,
      rejectedAt varchar(19) DEFAULT NULL,
      closedAt varchar(19) DEFAULT NULL,
      closeReason text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_hiring_candidate_name (candidateName),
      KEY idx_performance_hiring_target_department_id (targetDepartmentId),
      KEY idx_performance_hiring_source_type (sourceType),
      KEY idx_performance_hiring_source_id (sourceId),
      KEY idx_performance_hiring_status (status),
      KEY idx_performance_hiring_offered_at (offeredAt),
      KEY idx_performance_hiring_accepted_at (acceptedAt),
      KEY idx_performance_hiring_rejected_at (rejectedAt),
      KEY idx_performance_hiring_closed_at (closedAt),
      KEY idx_performance_hiring_create_time (createTime),
      KEY idx_performance_hiring_update_time (updateTime),
      KEY idx_performance_hiring_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTableColumn(
    'performance_hiring',
    'interviewId',
    '`interviewId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_hiring',
    'resumePoolId',
    '`resumePoolId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_hiring',
    'recruitPlanId',
    '`recruitPlanId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_hiring',
    'interviewSnapshot',
    '`interviewSnapshot` json DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_hiring',
    'resumePoolSnapshot',
    '`resumePoolSnapshot` json DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_hiring',
    'recruitPlanSnapshot',
    '`recruitPlanSnapshot` json DEFAULT NULL'
  );
}

async function ensureRecruitPlanTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_recruit_plan (
      id int NOT NULL AUTO_INCREMENT,
      title varchar(200) NOT NULL,
      targetDepartmentId int NOT NULL,
      positionName varchar(100) NOT NULL,
      headcount int NOT NULL,
      startDate varchar(10) NOT NULL,
      endDate varchar(10) NOT NULL,
      recruiterId int DEFAULT NULL,
      requirementSummary text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_recruit_plan_title (title),
      KEY idx_performance_recruit_plan_target_department_id (targetDepartmentId),
      KEY idx_performance_recruit_plan_position_name (positionName),
      KEY idx_performance_recruit_plan_start_date (startDate),
      KEY idx_performance_recruit_plan_end_date (endDate),
      KEY idx_performance_recruit_plan_recruiter_id (recruiterId),
      KEY idx_performance_recruit_plan_status (status),
      KEY idx_performance_recruit_plan_create_time (createTime),
      KEY idx_performance_recruit_plan_update_time (updateTime),
      KEY idx_performance_recruit_plan_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTableColumn(
    'performance_recruit_plan',
    'jobStandardId',
    '`jobStandardId` int DEFAULT NULL'
  );
  await ensureTableColumn(
    'performance_recruit_plan',
    'jobStandardSnapshot',
    '`jobStandardSnapshot` json DEFAULT NULL'
  );
}

async function ensureJobStandardTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_job_standard (
      id int NOT NULL AUTO_INCREMENT,
      positionName varchar(100) NOT NULL,
      targetDepartmentId int NOT NULL,
      jobLevel varchar(100) DEFAULT NULL,
      profileSummary text DEFAULT NULL,
      requirementSummary text DEFAULT NULL,
      skillTagList json DEFAULT NULL,
      interviewTemplateSummary text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_job_standard_position_name (positionName),
      KEY idx_performance_job_standard_target_department_id (targetDepartmentId),
      KEY idx_performance_job_standard_status (status),
      KEY idx_performance_job_standard_create_time (createTime),
      KEY idx_performance_job_standard_update_time (updateTime),
      KEY idx_performance_job_standard_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureTeacherChannelTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_teacher_info (
      id int NOT NULL AUTO_INCREMENT,
      teacherName varchar(100) NOT NULL,
      phone varchar(20) DEFAULT NULL,
      wechat varchar(50) DEFAULT NULL,
      schoolName varchar(100) DEFAULT NULL,
      schoolRegion varchar(100) DEFAULT NULL,
      schoolType varchar(100) DEFAULT NULL,
      grade varchar(50) DEFAULT NULL,
      className varchar(100) DEFAULT NULL,
      subject varchar(50) DEFAULT NULL,
      projectTags json DEFAULT NULL,
      intentionLevel varchar(30) DEFAULT NULL,
      communicationStyle varchar(50) DEFAULT NULL,
      cooperationStatus varchar(20) NOT NULL DEFAULT 'uncontacted',
      ownerEmployeeId int NOT NULL,
      ownerDepartmentId int NOT NULL,
      lastFollowTime varchar(19) DEFAULT NULL,
      nextFollowTime varchar(19) DEFAULT NULL,
      cooperationTime varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_teacher_info_teacher_name (teacherName),
      KEY idx_performance_teacher_info_school_name (schoolName),
      KEY idx_performance_teacher_info_cooperation_status (cooperationStatus),
      KEY idx_performance_teacher_info_owner_employee_id (ownerEmployeeId),
      KEY idx_performance_teacher_info_owner_department_id (ownerDepartmentId),
      KEY idx_performance_teacher_info_last_follow_time (lastFollowTime),
      KEY idx_performance_teacher_info_next_follow_time (nextFollowTime),
      KEY idx_performance_teacher_info_cooperation_time (cooperationTime),
      KEY idx_performance_teacher_info_create_time (createTime),
      KEY idx_performance_teacher_info_update_time (updateTime),
      KEY idx_performance_teacher_info_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_teacher_follow (
      id int NOT NULL AUTO_INCREMENT,
      teacherId int NOT NULL,
      followTime varchar(19) NOT NULL,
      nextFollowTime varchar(19) DEFAULT NULL,
      followMethod varchar(50) DEFAULT NULL,
      followContent text NOT NULL,
      creatorEmployeeId int NOT NULL,
      creatorEmployeeName varchar(100) NOT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_teacher_follow_teacher_id (teacherId),
      KEY idx_performance_teacher_follow_follow_time (followTime),
      KEY idx_performance_teacher_follow_next_follow_time (nextFollowTime),
      KEY idx_performance_teacher_follow_creator_employee_id (creatorEmployeeId),
      KEY idx_performance_teacher_follow_create_time (createTime),
      KEY idx_performance_teacher_follow_update_time (updateTime),
      KEY idx_performance_teacher_follow_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_teacher_class (
      id int NOT NULL AUTO_INCREMENT,
      teacherId int NOT NULL,
      teacherName varchar(100) NOT NULL,
      className varchar(100) NOT NULL,
      schoolName varchar(100) DEFAULT NULL,
      grade varchar(50) DEFAULT NULL,
      projectTag varchar(50) DEFAULT NULL,
      studentCount int NOT NULL DEFAULT 0,
      status varchar(20) NOT NULL DEFAULT 'draft',
      ownerEmployeeId int NOT NULL,
      ownerDepartmentId int NOT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_teacher_class_teacher_id (teacherId),
      KEY idx_performance_teacher_class_status (status),
      KEY idx_performance_teacher_class_owner_employee_id (ownerEmployeeId),
      KEY idx_performance_teacher_class_owner_department_id (ownerDepartmentId),
      KEY idx_performance_teacher_class_create_time (createTime),
      KEY idx_performance_teacher_class_update_time (updateTime),
      KEY idx_performance_teacher_class_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureContractTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_contract (
      id int NOT NULL AUTO_INCREMENT,
      employeeId int NOT NULL,
      type varchar(20) NOT NULL,
      title varchar(200) DEFAULT NULL,
      contractNumber varchar(50) DEFAULT NULL,
      startDate varchar(10) NOT NULL,
      endDate varchar(10) NOT NULL,
      probationPeriod int DEFAULT NULL,
      salary decimal(10,2) DEFAULT NULL,
      position varchar(100) DEFAULT NULL,
      departmentId int DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_contract_employee_id (employeeId),
      KEY idx_performance_contract_type (type),
      KEY idx_performance_contract_contract_number (contractNumber),
      KEY idx_performance_contract_start_date (startDate),
      KEY idx_performance_contract_end_date (endDate),
      KEY idx_performance_contract_department_id (departmentId),
      KEY idx_performance_contract_status (status),
      KEY idx_performance_contract_create_time (createTime),
      KEY idx_performance_contract_update_time (updateTime),
      KEY idx_performance_contract_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureOfficeKnowledgeTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_document_center (
      id int NOT NULL AUTO_INCREMENT,
      fileNo varchar(64) NOT NULL,
      fileName varchar(200) NOT NULL,
      category varchar(32) NOT NULL,
      fileType varchar(32) NOT NULL,
      storage varchar(32) NOT NULL,
      confidentiality varchar(32) NOT NULL,
      ownerName varchar(100) NOT NULL,
      department varchar(100) NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'draft',
      version varchar(32) NOT NULL,
      sizeMb decimal(10,2) NOT NULL DEFAULT 0,
      downloadCount int NOT NULL DEFAULT 0,
      expireDate varchar(10) DEFAULT NULL,
      tags text DEFAULT NULL,
      notes text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_document_center_file_no (fileNo),
      KEY idx_performance_document_center_file_name (fileName),
      KEY idx_performance_document_center_category (category),
      KEY idx_performance_document_center_file_type (fileType),
      KEY idx_performance_document_center_storage (storage),
      KEY idx_performance_document_center_confidentiality (confidentiality),
      KEY idx_performance_document_center_status (status),
      KEY idx_performance_document_center_create_time (createTime),
      KEY idx_performance_document_center_update_time (updateTime),
      KEY idx_performance_document_center_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_knowledge_base (
      id int NOT NULL AUTO_INCREMENT,
      kbNo varchar(64) NOT NULL,
      title varchar(200) NOT NULL,
      category varchar(64) NOT NULL,
      summary text NOT NULL,
      ownerName varchar(100) NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'draft',
      tags text DEFAULT NULL,
      relatedFileIds text DEFAULT NULL,
      relatedTopics text DEFAULT NULL,
      importance int NOT NULL DEFAULT 70,
      viewCount int NOT NULL DEFAULT 0,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_knowledge_base_kb_no (kbNo),
      KEY idx_performance_knowledge_base_title (title),
      KEY idx_performance_knowledge_base_category (category),
      KEY idx_performance_knowledge_base_status (status),
      KEY idx_performance_knowledge_base_create_time (createTime),
      KEY idx_performance_knowledge_base_update_time (updateTime),
      KEY idx_performance_knowledge_base_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_knowledge_qa (
      id int NOT NULL AUTO_INCREMENT,
      question varchar(500) NOT NULL,
      answer text NOT NULL,
      relatedKnowledgeIds text DEFAULT NULL,
      relatedFileIds text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_knowledge_qa_question (question(191)),
      KEY idx_performance_knowledge_qa_create_time (createTime),
      KEY idx_performance_knowledge_qa_update_time (updateTime),
      KEY idx_performance_knowledge_qa_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureProcurementTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_supplier (
      id int NOT NULL AUTO_INCREMENT,
      name varchar(200) NOT NULL,
      code varchar(100) DEFAULT NULL,
      category varchar(100) DEFAULT NULL,
      contactName varchar(100) DEFAULT NULL,
      contactPhone varchar(50) DEFAULT NULL,
      contactEmail varchar(100) DEFAULT NULL,
      bankAccount varchar(100) DEFAULT NULL,
      taxNo varchar(100) DEFAULT NULL,
      remark text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'active',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_supplier_code (code),
      KEY idx_performance_supplier_name (name),
      KEY idx_performance_supplier_category (category),
      KEY idx_performance_supplier_status (status),
      KEY idx_performance_supplier_create_time (createTime),
      KEY idx_performance_supplier_update_time (updateTime),
      KEY idx_performance_supplier_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_purchase_order (
      id int NOT NULL AUTO_INCREMENT,
      orderNo varchar(100) DEFAULT NULL,
      title varchar(200) NOT NULL,
      supplierId int NOT NULL,
      departmentId int NOT NULL,
      requesterId int NOT NULL,
      orderDate varchar(10) NOT NULL,
      totalAmount decimal(12,2) NOT NULL,
      currency varchar(20) NOT NULL DEFAULT 'CNY',
      remark text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_purchase_order_order_no (orderNo),
      KEY idx_performance_purchase_order_title (title),
      KEY idx_performance_purchase_order_supplier_id (supplierId),
      KEY idx_performance_purchase_order_department_id (departmentId),
      KEY idx_performance_purchase_order_requester_id (requesterId),
      KEY idx_performance_purchase_order_order_date (orderDate),
      KEY idx_performance_purchase_order_status (status),
      KEY idx_performance_purchase_order_create_time (createTime),
      KEY idx_performance_purchase_order_update_time (updateTime),
      KEY idx_performance_purchase_order_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureAssetTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_info (
      id int NOT NULL AUTO_INCREMENT,
      assetNo varchar(50) NOT NULL,
      assetName varchar(200) NOT NULL,
      category varchar(100) DEFAULT NULL,
      assetType varchar(100) DEFAULT NULL,
      brand varchar(100) DEFAULT NULL,
      model varchar(100) DEFAULT NULL,
      serialNo varchar(100) DEFAULT NULL,
      status varchar(30) NOT NULL DEFAULT 'available',
      location varchar(200) DEFAULT NULL,
      ownerDepartmentId int NOT NULL,
      managerId int DEFAULT NULL,
      purchaseDate varchar(10) DEFAULT NULL,
      purchaseCost decimal(12,2) NOT NULL DEFAULT 0,
      supplierId int DEFAULT NULL,
      purchaseOrderId int DEFAULT NULL,
      warrantyExpiry varchar(10) DEFAULT NULL,
      depreciationMonths int NOT NULL DEFAULT 0,
      depreciatedAmount decimal(12,2) NOT NULL DEFAULT 0,
      netBookValue decimal(12,2) NOT NULL DEFAULT 0,
      lastInventoryTime varchar(19) DEFAULT NULL,
      remark text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_asset_no (assetNo),
      KEY idx_performance_asset_info_category (category),
      KEY idx_performance_asset_info_serial_no (serialNo),
      KEY idx_performance_asset_info_status (status),
      KEY idx_performance_asset_info_owner_department_id (ownerDepartmentId),
      KEY idx_performance_asset_info_manager_id (managerId),
      KEY idx_performance_asset_info_supplier_id (supplierId),
      KEY idx_performance_asset_info_purchase_order_id (purchaseOrderId),
      KEY idx_performance_asset_info_create_time (createTime),
      KEY idx_performance_asset_info_update_time (updateTime),
      KEY idx_performance_asset_info_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_assignment (
      id int NOT NULL AUTO_INCREMENT,
      assetId int NOT NULL,
      assigneeId int NOT NULL,
      departmentId int NOT NULL,
      assignDate varchar(10) NOT NULL,
      returnDate varchar(10) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'assigned',
      purpose text DEFAULT NULL,
      returnNote text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_asset_assignment_asset_id (assetId),
      KEY idx_performance_asset_assignment_assignee_id (assigneeId),
      KEY idx_performance_asset_assignment_department_id (departmentId),
      KEY idx_performance_asset_assignment_status (status),
      KEY idx_performance_asset_assignment_create_time (createTime),
      KEY idx_performance_asset_assignment_update_time (updateTime),
      KEY idx_performance_asset_assignment_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_maintenance (
      id int NOT NULL AUTO_INCREMENT,
      assetId int NOT NULL,
      departmentId int NOT NULL,
      maintenanceType varchar(50) DEFAULT NULL,
      vendor varchar(100) DEFAULT NULL,
      cost decimal(12,2) NOT NULL DEFAULT 0,
      startDate varchar(19) DEFAULT NULL,
      completedDate varchar(19) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'scheduled',
      description text DEFAULT NULL,
      result text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_asset_maintenance_asset_id (assetId),
      KEY idx_performance_asset_maintenance_department_id (departmentId),
      KEY idx_performance_asset_maintenance_status (status),
      KEY idx_performance_asset_maintenance_create_time (createTime),
      KEY idx_performance_asset_maintenance_update_time (updateTime),
      KEY idx_performance_asset_maintenance_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_procurement (
      id int NOT NULL AUTO_INCREMENT,
      procurementNo varchar(50) NOT NULL,
      title varchar(200) NOT NULL,
      purchaseOrderId int DEFAULT NULL,
      supplierId int DEFAULT NULL,
      ownerDepartmentId int NOT NULL,
      managerId int DEFAULT NULL,
      assetName varchar(200) NOT NULL,
      category varchar(100) DEFAULT NULL,
      assetType varchar(100) DEFAULT NULL,
      brand varchar(100) DEFAULT NULL,
      model varchar(100) DEFAULT NULL,
      serialNo varchar(100) DEFAULT NULL,
      location varchar(200) DEFAULT NULL,
      purchaseDate varchar(10) DEFAULT NULL,
      unitCost decimal(12,2) NOT NULL DEFAULT 0,
      quantity int NOT NULL DEFAULT 1,
      warrantyExpiry varchar(10) DEFAULT NULL,
      depreciationMonths int NOT NULL DEFAULT 0,
      receivedAssetIds json DEFAULT NULL,
      submittedAt varchar(19) DEFAULT NULL,
      receivedAt varchar(19) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      remark text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_asset_procurement_no (procurementNo),
      KEY idx_performance_asset_procurement_purchase_order_id (purchaseOrderId),
      KEY idx_performance_asset_procurement_supplier_id (supplierId),
      KEY idx_performance_asset_procurement_owner_department_id (ownerDepartmentId),
      KEY idx_performance_asset_procurement_manager_id (managerId),
      KEY idx_performance_asset_procurement_category (category),
      KEY idx_performance_asset_procurement_status (status),
      KEY idx_performance_asset_procurement_create_time (createTime),
      KEY idx_performance_asset_procurement_update_time (updateTime),
      KEY idx_performance_asset_procurement_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_transfer (
      id int NOT NULL AUTO_INCREMENT,
      transferNo varchar(50) NOT NULL,
      assetId int NOT NULL,
      fromDepartmentId int NOT NULL,
      toDepartmentId int NOT NULL,
      toManagerId int DEFAULT NULL,
      fromLocation varchar(200) DEFAULT NULL,
      toLocation varchar(200) DEFAULT NULL,
      reason text DEFAULT NULL,
      submittedAt varchar(19) DEFAULT NULL,
      completedAt varchar(19) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_asset_transfer_no (transferNo),
      KEY idx_performance_asset_transfer_asset_id (assetId),
      KEY idx_performance_asset_transfer_from_department_id (fromDepartmentId),
      KEY idx_performance_asset_transfer_to_department_id (toDepartmentId),
      KEY idx_performance_asset_transfer_to_manager_id (toManagerId),
      KEY idx_performance_asset_transfer_status (status),
      KEY idx_performance_asset_transfer_create_time (createTime),
      KEY idx_performance_asset_transfer_update_time (updateTime),
      KEY idx_performance_asset_transfer_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_inventory (
      id int NOT NULL AUTO_INCREMENT,
      inventoryNo varchar(50) NOT NULL,
      assetId int NOT NULL,
      ownerDepartmentId int NOT NULL,
      locationSnapshot varchar(200) DEFAULT NULL,
      resultSummary text DEFAULT NULL,
      startedAt varchar(19) DEFAULT NULL,
      completedAt varchar(19) DEFAULT NULL,
      closedAt varchar(19) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      remark text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_asset_inventory_no (inventoryNo),
      KEY idx_performance_asset_inventory_asset_id (assetId),
      KEY idx_performance_asset_inventory_owner_department_id (ownerDepartmentId),
      KEY idx_performance_asset_inventory_status (status),
      KEY idx_performance_asset_inventory_create_time (createTime),
      KEY idx_performance_asset_inventory_update_time (updateTime),
      KEY idx_performance_asset_inventory_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_depreciation (
      id int NOT NULL AUTO_INCREMENT,
      assetId int NOT NULL,
      periodValue varchar(7) NOT NULL,
      depreciationAmount decimal(12,2) NOT NULL DEFAULT 0,
      accumulatedAmount decimal(12,2) NOT NULL DEFAULT 0,
      netBookValue decimal(12,2) NOT NULL DEFAULT 0,
      sourceCost decimal(12,2) NOT NULL DEFAULT 0,
      recalculatedAt varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_performance_asset_depreciation_asset_id (assetId),
      KEY idx_performance_asset_depreciation_period_value (periodValue),
      KEY idx_performance_asset_depreciation_create_time (createTime),
      KEY idx_performance_asset_depreciation_update_time (updateTime),
      KEY idx_performance_asset_depreciation_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_asset_disposal (
      id int NOT NULL AUTO_INCREMENT,
      disposalNo varchar(50) NOT NULL,
      assetId int NOT NULL,
      ownerDepartmentId int NOT NULL,
      reason text NOT NULL,
      remark text DEFAULT NULL,
      approvedById int DEFAULT NULL,
      executedById int DEFAULT NULL,
      submittedAt varchar(19) DEFAULT NULL,
      approvedAt varchar(19) DEFAULT NULL,
      executedAt varchar(19) DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_performance_asset_disposal_no (disposalNo),
      KEY idx_performance_asset_disposal_asset_id (assetId),
      KEY idx_performance_asset_disposal_owner_department_id (ownerDepartmentId),
      KEY idx_performance_asset_disposal_approved_by_id (approvedById),
      KEY idx_performance_asset_disposal_executed_by_id (executedById),
      KEY idx_performance_asset_disposal_status (status),
      KEY idx_performance_asset_disposal_create_time (createTime),
      KEY idx_performance_asset_disposal_update_time (updateTime),
      KEY idx_performance_asset_disposal_tenant_id (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureFeedbackTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_feedback_task (
      id int NOT NULL AUTO_INCREMENT,
      assessmentId int NOT NULL,
      employeeId int NOT NULL,
      title varchar(200) NOT NULL,
      deadline varchar(19) DEFAULT NULL,
      creatorId int NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_feedback_task_assessment (assessmentId),
      KEY idx_feedback_task_employee (employeeId),
      KEY idx_feedback_task_deadline (deadline),
      KEY idx_feedback_task_creator (creatorId),
      KEY idx_feedback_task_status (status),
      KEY idx_feedback_task_create_time (createTime),
      KEY idx_feedback_task_update_time (updateTime),
      KEY idx_feedback_task_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_feedback_record (
      id int NOT NULL AUTO_INCREMENT,
      taskId int NOT NULL,
      feedbackUserId int NOT NULL,
      relationType varchar(20) NOT NULL,
      score decimal(5,2) NOT NULL DEFAULT 0,
      content text DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      submitTime varchar(19) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_feedback_record_task_user (taskId, feedbackUserId),
      KEY idx_feedback_record_task (taskId),
      KEY idx_feedback_record_user (feedbackUserId),
      KEY idx_feedback_record_status (status),
      KEY idx_feedback_record_submit_time (submitTime),
      KEY idx_feedback_record_create_time (createTime),
      KEY idx_feedback_record_update_time (updateTime),
      KEY idx_feedback_record_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureApprovalTables() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_approval_config (
      id int NOT NULL AUTO_INCREMENT,
      objectType varchar(30) NOT NULL,
      version varchar(30) NOT NULL,
      enabled tinyint(1) NOT NULL DEFAULT 0,
      notifyMode varchar(30) NOT NULL DEFAULT 'interface_only',
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_approval_config_object_type (objectType),
      KEY idx_performance_approval_config_version (version),
      KEY idx_performance_approval_config_enabled (enabled),
      KEY idx_performance_approval_config_create_time (createTime),
      KEY idx_performance_approval_config_update_time (updateTime),
      KEY idx_performance_approval_config_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_approval_config_node (
      id int NOT NULL AUTO_INCREMENT,
      configId int NOT NULL,
      nodeOrder int NOT NULL,
      nodeCode varchar(50) NOT NULL,
      nodeName varchar(100) NOT NULL,
      resolverType varchar(50) NOT NULL,
      resolverValue varchar(200) DEFAULT NULL,
      timeoutHours int DEFAULT NULL,
      allowTransfer tinyint(1) NOT NULL DEFAULT 1,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_approval_config_node_order (configId, nodeOrder),
      KEY idx_performance_approval_config_node_config_id (configId),
      KEY idx_performance_approval_config_node_resolver_type (resolverType),
      KEY idx_performance_approval_config_node_create_time (createTime),
      KEY idx_performance_approval_config_node_update_time (updateTime),
      KEY idx_performance_approval_config_node_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_approval_instance (
      id int NOT NULL AUTO_INCREMENT,
      objectType varchar(30) NOT NULL,
      objectId int NOT NULL,
      sourceStatus varchar(30) NOT NULL,
      configId int NOT NULL,
      configVersion varchar(30) NOT NULL,
      applicantId int NOT NULL,
      employeeId int NOT NULL,
      departmentId int NOT NULL,
      status varchar(30) NOT NULL DEFAULT 'pending_resolution',
      currentNodeOrder int DEFAULT NULL,
      currentApproverId int DEFAULT NULL,
      launchTime varchar(19) NOT NULL,
      finishTime varchar(19) DEFAULT NULL,
      fallbackReason varchar(500) DEFAULT NULL,
      fallbackOperatorId int DEFAULT NULL,
      terminateReason varchar(500) DEFAULT NULL,
      terminateOperatorId int DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_approval_instance_object_status (objectType, objectId, status),
      KEY idx_performance_approval_instance_source_status (sourceStatus),
      KEY idx_performance_approval_instance_config_id (configId),
      KEY idx_performance_approval_instance_applicant_id (applicantId),
      KEY idx_performance_approval_instance_employee_id (employeeId),
      KEY idx_performance_approval_instance_department_id (departmentId),
      KEY idx_performance_approval_instance_status (status),
      KEY idx_performance_approval_instance_current_node_order (currentNodeOrder),
      KEY idx_approval_instance_current_approver (currentApproverId),
      KEY idx_performance_approval_instance_launch_time (launchTime),
      KEY idx_performance_approval_instance_finish_time (finishTime),
      KEY idx_performance_approval_instance_fallback_operator_id (fallbackOperatorId),
      KEY idx_performance_approval_instance_terminate_operator_id (terminateOperatorId),
      KEY idx_performance_approval_instance_create_time (createTime),
      KEY idx_performance_approval_instance_update_time (updateTime),
      KEY idx_performance_approval_instance_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_approval_instance_node (
      id int NOT NULL AUTO_INCREMENT,
      instanceId int NOT NULL,
      nodeOrder int NOT NULL,
      nodeCode varchar(50) NOT NULL,
      nodeName varchar(100) NOT NULL,
      resolverType varchar(50) NOT NULL,
      resolverValueSnapshot varchar(200) DEFAULT NULL,
      allowTransfer tinyint(1) NOT NULL DEFAULT 1,
      approverId int DEFAULT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      actionTime varchar(19) DEFAULT NULL,
      transferFromUserId int DEFAULT NULL,
      transferReason varchar(500) DEFAULT NULL,
      comment text DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_approval_instance_node_order (instanceId, nodeOrder),
      KEY idx_performance_approval_instance_node_instance_id (instanceId),
      KEY idx_performance_approval_instance_node_resolver_type (resolverType),
      KEY idx_performance_approval_instance_node_approver_id (approverId),
      KEY idx_performance_approval_instance_node_status (status),
      KEY idx_performance_approval_instance_node_action_time (actionTime),
      KEY idx_performance_approval_instance_node_transfer_from_user_id (transferFromUserId),
      KEY idx_performance_approval_instance_node_create_time (createTime),
      KEY idx_performance_approval_instance_node_update_time (updateTime),
      KEY idx_performance_approval_instance_node_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS performance_approval_action_log (
      id int NOT NULL AUTO_INCREMENT,
      instanceId int NOT NULL,
      instanceNodeId int DEFAULT NULL,
      action varchar(30) NOT NULL,
      operatorId int NOT NULL,
      fromStatus varchar(30) DEFAULT NULL,
      toStatus varchar(30) DEFAULT NULL,
      reason varchar(500) DEFAULT NULL,
      detail varchar(1000) DEFAULT NULL,
      createTime varchar(19) NOT NULL,
      updateTime varchar(19) NOT NULL,
      tenantId int DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_approval_action_instance_time (instanceId, createTime),
      KEY idx_performance_approval_action_log_instance_node_id (instanceNodeId),
      KEY idx_performance_approval_action_log_action (action),
      KEY idx_performance_approval_action_log_operator_id (operatorId),
      KEY idx_performance_approval_action_log_create_time (createTime),
      KEY idx_performance_approval_action_log_update_time (updateTime),
      KEY idx_performance_approval_action_log_tenant (tenantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function main() {
  let seedMeta;
  await connection.beginTransaction();

  try {
    await syncMenuTree(loadStage2PerformanceMenus());
    await ensureCourseTables();
    await ensureCourseLearningTables();
    await ensureCapabilityTables();
    await ensureInterviewTable();
    await ensureMeetingTable();
    await ensureTalentAssetTable();
    await ensureResumePoolTable();
    await ensureHiringTable();
    await ensureRecruitPlanTable();
    await ensureJobStandardTable();
    await ensureTeacherChannelTables();
    await ensureContractTable();
    await ensureOfficeKnowledgeTables();
    await ensureProcurementTables();
    await ensureAssetTables();
    await ensureFeedbackTables();
    await ensureApprovalTables();

    const headquartersId = await ensureDepartment({
      name: '总部',
      parentId: null,
      orderNum: 10,
    });
    const rdCenterId = await ensureDepartment({
      name: '研发中心',
      parentId: headquartersId,
      orderNum: 11,
    });
    const salesCenterId = await ensureDepartment({
      name: '销售中心',
      parentId: headquartersId,
      orderNum: 12,
    });
    const hrDepartmentId = await ensureDepartment({
      name: '人力资源部',
      parentId: headquartersId,
      orderNum: 13,
    });
    const platformGroupId = await ensureDepartment({
      name: '平台组',
      parentId: rdCenterId,
      orderNum: 14,
    });
    const businessGroupId = await ensureDepartment({
      name: '业务组',
      parentId: rdCenterId,
      orderNum: 15,
    });

    const hrUserId = await ensureUser({
      username: 'hr_admin',
      name: 'HR管理员',
      nickName: 'HR管理员',
      departmentId: hrDepartmentId,
      phone: 'stage2-hr-0001',
      email: 'stage2-hr-mailbox',
      remark: '阶段2联调-HR管理员',
    });
    const managerUserId = await ensureUser({
      username: 'manager_rd',
      name: '研发经理',
      nickName: '研发经理',
      departmentId: rdCenterId,
      phone: 'stage2-manager-0001',
      email: 'stage2-manager-mailbox',
      remark: '阶段2联调-部门经理',
    });
    const employeeUserId = await ensureUser({
      username: 'employee_platform',
      name: '平台员工',
      nickName: '平台员工',
      departmentId: platformGroupId,
      phone: 'stage2-employee-0001',
      email: 'stage2-employee-mailbox',
      remark: '阶段2联调-普通员工',
    });
    const feedbackUserId = await ensureUser({
      username: 'feedback_peer',
      name: '环评价人',
      nickName: '环评价人',
      departmentId: businessGroupId,
      phone: 'stage2-feedback-0001',
      email: 'stage2-feedback-mailbox',
      remark: '阶段2联调-环评价人',
    });
    const salesEmployeeUserId = await ensureUser({
      username: 'employee_sales',
      name: '销售员工',
      nickName: '销售员工',
      departmentId: salesCenterId,
      phone: 'stage2-sales-0001',
      email: 'stage2-sales-mailbox',
      remark: '阶段2联调-跨部门校验样例',
    });
    const readonlyTeacherUserId = await ensureUser({
      username: 'readonly_teacher',
      name: '班主任只读',
      nickName: '班主任只读',
      departmentId: platformGroupId,
      phone: 'stage2-readonly-0001',
      email: 'stage2-readonly-mailbox',
      remark: '阶段2联调-班主任只读账号',
    });

    const hrMenuIds = await collectMenuIds({
      routers: [
        '/data-center/dashboard',
        '/performance/recruitment-center',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/indicator-library',
        '/performance/feedback',
        '/performance/suggestion',
        '/performance/pip',
        '/performance/promotion',
        '/performance/salary',
        '/performance/course',
        '/performance/capability',
        '/performance/certificate',
        '/performance/teacher-channel/dashboard',
        '/performance/teacher-channel/teacher',
        '/performance/teacher-channel/todo',
        '/performance/teacher-channel/class',
        '/performance/recruit-plan',
        '/performance/job-standard',
        '/performance/resumePool',
        '/performance/interview',
        '/performance/hiring',
        '/performance/meeting',
        '/performance/contract',
        '/performance/office/document-center',
        '/performance/office/knowledge-base',
        '/performance/talentAsset',
        '/performance/purchase-order',
        '/performance/supplier',
        '/performance/asset/dashboard',
        '/performance/asset/ledger',
        '/performance/asset/assignment',
        '/performance/asset/maintenance',
        '/performance/asset/report',
        '/performance/asset/procurement',
        '/performance/asset/transfer',
        '/performance/asset/inventory',
        '/performance/asset/depreciation',
        '/performance/asset/disposal',
      ],
      perms: [
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:page',
        'performance:assessment:add',
        'performance:assessment:update',
        'performance:assessment:delete',
        'performance:assessment:pendingPage',
        'performance:assessment:export',
        'performance:approvalFlow:configInfo',
        'performance:approvalFlow:configSave',
        'performance:approvalFlow:info',
        'performance:approvalFlow:approve',
        'performance:approvalFlow:reject',
        'performance:approvalFlow:transfer',
        'performance:approvalFlow:withdraw',
        'performance:approvalFlow:remind',
        'performance:approvalFlow:resolve',
        'performance:approvalFlow:fallback',
        'performance:approvalFlow:terminate',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:add',
        'performance:goal:update',
        'performance:goal:delete',
        'performance:goal:progressUpdate',
        'performance:goal:export',
        'performance:feedback:page',
        'performance:feedback:info',
        'performance:feedback:add',
        'performance:feedback:submit',
        'performance:feedback:summary',
        'performance:feedback:export',
        'performance:suggestion:page',
        'performance:suggestion:info',
        'performance:suggestion:accept',
        'performance:suggestion:ignore',
        'performance:suggestion:reject',
        'performance:suggestion:revoke',
        'performance:indicator:page',
        'performance:indicator:info',
        'performance:indicator:add',
        'performance:indicator:update',
        'performance:indicator:delete',
        'performance:pip:page',
        'performance:pip:info',
        'performance:pip:add',
        'performance:pip:start',
        'performance:pip:update',
        'performance:pip:track',
        'performance:pip:complete',
        'performance:pip:close',
        'performance:pip:export',
        'performance:promotion:page',
        'performance:promotion:info',
        'performance:promotion:add',
        'performance:promotion:update',
        'performance:promotion:submit',
        'performance:promotion:review',
        'performance:salary:page',
        'performance:salary:info',
        'performance:salary:add',
        'performance:salary:update',
        'performance:salary:confirm',
        'performance:salary:archive',
        'performance:salary:changeAdd',
        'performance:course:page',
        'performance:course:info',
        'performance:course:add',
        'performance:course:update',
        'performance:course:delete',
        'performance:course:enrollmentPage',
        'performance:capabilityModel:page',
        'performance:capabilityModel:info',
        'performance:capabilityModel:add',
        'performance:capabilityModel:update',
        'performance:capabilityItem:info',
        'performance:capabilityPortrait:info',
        'performance:certificate:page',
        'performance:certificate:info',
        'performance:certificate:add',
        'performance:certificate:update',
        'performance:certificate:issue',
        'performance:certificate:recordPage',
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherInfo:add',
        'performance:teacherInfo:update',
        'performance:teacherInfo:assign',
        'performance:teacherInfo:updateStatus',
        'performance:teacherFollow:page',
        'performance:teacherFollow:add',
        'performance:teacherCooperation:mark',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherClass:add',
        'performance:teacherClass:update',
        'performance:teacherClass:delete',
        'performance:teacherTodo:page',
        'performance:recruitPlan:page',
        'performance:recruitPlan:info',
        'performance:recruitPlan:add',
        'performance:recruitPlan:update',
        'performance:recruitPlan:delete',
        'performance:recruitPlan:import',
        'performance:recruitPlan:export',
        'performance:recruitPlan:submit',
        'performance:recruitPlan:close',
        'performance:recruitPlan:void',
        'performance:recruitPlan:reopen',
        'performance:jobStandard:page',
        'performance:jobStandard:info',
        'performance:jobStandard:add',
        'performance:jobStandard:update',
        'performance:jobStandard:setStatus',
        'performance:resumePool:page',
        'performance:resumePool:info',
        'performance:resumePool:add',
        'performance:resumePool:update',
        'performance:resumePool:import',
        'performance:resumePool:export',
        'performance:resumePool:uploadAttachment',
        'performance:resumePool:downloadAttachment',
        'performance:resumePool:convertToTalentAsset',
        'performance:resumePool:createInterview',
        'performance:interview:page',
        'performance:interview:info',
        'performance:interview:add',
        'performance:interview:update',
        'performance:interview:delete',
        'performance:hiring:page',
        'performance:hiring:info',
        'performance:hiring:add',
        'performance:hiring:updateStatus',
        'performance:hiring:close',
        'performance:meeting:page',
        'performance:meeting:info',
        'performance:meeting:add',
        'performance:meeting:update',
        'performance:meeting:delete',
        'performance:meeting:checkIn',
        'performance:contract:page',
        'performance:contract:info',
        'performance:contract:add',
        'performance:contract:update',
        'performance:contract:delete',
        'performance:documentCenter:page',
        'performance:documentCenter:info',
        'performance:documentCenter:stats',
        'performance:documentCenter:add',
        'performance:documentCenter:update',
        'performance:documentCenter:delete',
        'performance:knowledgeBase:page',
        'performance:knowledgeBase:stats',
        'performance:knowledgeBase:add',
        'performance:knowledgeBase:update',
        'performance:knowledgeBase:delete',
        'performance:knowledgeBase:graph',
        'performance:knowledgeBase:search',
        'performance:knowledgeBase:qaList',
        'performance:knowledgeBase:qaAdd',
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:info',
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
        'performance:purchaseOrder:delete',
        'performance:supplier:page',
        'performance:supplier:info',
        'performance:supplier:add',
        'performance:supplier:update',
        'performance:supplier:delete',
        'performance:assetDashboard:summary',
        'performance:assetInfo:page',
        'performance:assetInfo:info',
        'performance:assetInfo:add',
        'performance:assetInfo:update',
        'performance:assetInfo:delete',
        'performance:assetInfo:updateStatus',
        'performance:assetAssignment:page',
        'performance:assetAssignment:add',
        'performance:assetAssignment:update',
        'performance:assetAssignment:return',
        'performance:assetAssignment:markLost',
        'performance:assetAssignment:delete',
        'performance:assetMaintenance:page',
        'performance:assetMaintenance:add',
        'performance:assetMaintenance:update',
        'performance:assetMaintenance:complete',
        'performance:assetMaintenance:cancel',
        'performance:assetMaintenance:delete',
        'performance:assetProcurement:page',
        'performance:assetProcurement:info',
        'performance:assetProcurement:add',
        'performance:assetProcurement:update',
        'performance:assetProcurement:submit',
        'performance:assetProcurement:receive',
        'performance:assetProcurement:cancel',
        'performance:assetTransfer:page',
        'performance:assetTransfer:info',
        'performance:assetTransfer:add',
        'performance:assetTransfer:update',
        'performance:assetTransfer:submit',
        'performance:assetTransfer:complete',
        'performance:assetTransfer:cancel',
        'performance:assetInventory:page',
        'performance:assetInventory:info',
        'performance:assetInventory:add',
        'performance:assetInventory:update',
        'performance:assetInventory:start',
        'performance:assetInventory:complete',
        'performance:assetInventory:close',
        'performance:assetDepreciation:page',
        'performance:assetDepreciation:summary',
        'performance:assetDepreciation:recalculate',
        'performance:assetDisposal:page',
        'performance:assetDisposal:info',
        'performance:assetDisposal:add',
        'performance:assetDisposal:update',
        'performance:assetDisposal:submit',
        'performance:assetDisposal:approve',
        'performance:assetDisposal:execute',
        'performance:assetDisposal:cancel',
        'performance:assetReport:summary',
        'performance:assetReport:page',
        'performance:assetReport:export',
        'performance:talentAsset:page',
        'performance:talentAsset:info',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
        'performance:talentAsset:delete',
      ],
    });
    const managerMenuIds = await collectMenuIds({
      routers: [
        '/data-center/dashboard',
        '/performance/recruitment-center',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/feedback',
        '/performance/suggestion',
        '/performance/pip',
        '/performance/promotion',
        '/performance/course',
        '/performance/capability',
        '/performance/certificate',
        '/performance/teacher-channel/dashboard',
        '/performance/teacher-channel/teacher',
        '/performance/teacher-channel/todo',
        '/performance/teacher-channel/class',
        '/performance/recruit-plan',
        '/performance/job-standard',
        '/performance/resumePool',
        '/performance/interview',
        '/performance/hiring',
        '/performance/meeting',
        '/performance/purchase-order',
        '/performance/supplier',
        '/performance/talentAsset',
        '/performance/asset/dashboard',
        '/performance/asset/ledger',
        '/performance/asset/assignment',
        '/performance/asset/maintenance',
        '/performance/asset/report',
        '/performance/asset/transfer',
        '/performance/asset/inventory',
        '/performance/asset/disposal',
      ],
      perms: [
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:page',
        'performance:assessment:add',
        'performance:assessment:update',
        'performance:assessment:delete',
        'performance:assessment:pendingPage',
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:approvalFlow:info',
        'performance:approvalFlow:approve',
        'performance:approvalFlow:reject',
        'performance:approvalFlow:transfer',
        'performance:approvalFlow:withdraw',
        'performance:approvalFlow:remind',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:add',
        'performance:goal:update',
        'performance:goal:delete',
        'performance:goal:progressUpdate',
        'performance:goal:export',
        'performance:feedback:page',
        'performance:feedback:info',
        'performance:feedback:add',
        'performance:feedback:submit',
        'performance:feedback:summary',
        'performance:feedback:export',
        'performance:suggestion:page',
        'performance:suggestion:info',
        'performance:suggestion:accept',
        'performance:suggestion:ignore',
        'performance:suggestion:reject',
        'performance:pip:page',
        'performance:pip:info',
        'performance:pip:add',
        'performance:pip:start',
        'performance:pip:update',
        'performance:pip:track',
        'performance:pip:complete',
        'performance:pip:close',
        'performance:pip:export',
        'performance:promotion:page',
        'performance:promotion:info',
        'performance:promotion:add',
        'performance:promotion:update',
        'performance:promotion:submit',
        'performance:promotion:review',
        'performance:course:page',
        'performance:course:info',
        'performance:capabilityModel:page',
        'performance:capabilityModel:info',
        'performance:capabilityItem:info',
        'performance:capabilityPortrait:info',
        'performance:certificate:page',
        'performance:certificate:info',
        'performance:certificate:recordPage',
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherInfo:add',
        'performance:teacherInfo:update',
        'performance:teacherInfo:assign',
        'performance:teacherInfo:updateStatus',
        'performance:teacherFollow:page',
        'performance:teacherFollow:add',
        'performance:teacherCooperation:mark',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherClass:add',
        'performance:teacherClass:update',
        'performance:teacherClass:delete',
        'performance:teacherTodo:page',
        'performance:recruitPlan:page',
        'performance:recruitPlan:info',
        'performance:recruitPlan:add',
        'performance:recruitPlan:update',
        'performance:recruitPlan:delete',
        'performance:recruitPlan:import',
        'performance:recruitPlan:submit',
        'performance:recruitPlan:close',
        'performance:recruitPlan:void',
        'performance:recruitPlan:reopen',
        'performance:jobStandard:page',
        'performance:jobStandard:info',
        'performance:resumePool:page',
        'performance:resumePool:info',
        'performance:resumePool:add',
        'performance:resumePool:update',
        'performance:resumePool:import',
        'performance:resumePool:uploadAttachment',
        'performance:resumePool:convertToTalentAsset',
        'performance:resumePool:createInterview',
        'performance:interview:page',
        'performance:interview:info',
        'performance:interview:add',
        'performance:interview:update',
        'performance:hiring:page',
        'performance:hiring:info',
        'performance:hiring:add',
        'performance:hiring:updateStatus',
        'performance:hiring:close',
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:info',
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
        'performance:supplier:page',
        'performance:supplier:info',
        'performance:assetDashboard:summary',
        'performance:assetInfo:page',
        'performance:assetInfo:info',
        'performance:assetAssignment:page',
        'performance:assetAssignment:add',
        'performance:assetAssignment:update',
        'performance:assetAssignment:return',
        'performance:assetMaintenance:page',
        'performance:assetMaintenance:add',
        'performance:assetMaintenance:update',
        'performance:assetMaintenance:complete',
        'performance:assetMaintenance:cancel',
        'performance:assetTransfer:page',
        'performance:assetTransfer:info',
        'performance:assetTransfer:add',
        'performance:assetTransfer:update',
        'performance:assetTransfer:submit',
        'performance:assetTransfer:complete',
        'performance:assetTransfer:cancel',
        'performance:assetInventory:page',
        'performance:assetInventory:info',
        'performance:assetInventory:add',
        'performance:assetInventory:update',
        'performance:assetInventory:start',
        'performance:assetInventory:complete',
        'performance:assetInventory:close',
        'performance:assetDisposal:page',
        'performance:assetDisposal:info',
        'performance:assetDisposal:add',
        'performance:assetDisposal:update',
        'performance:assetDisposal:submit',
        'performance:assetDisposal:approve',
        'performance:assetDisposal:execute',
        'performance:assetDisposal:cancel',
        'performance:assetReport:summary',
        'performance:assetReport:page',
        'performance:meeting:page',
        'performance:meeting:info',
        'performance:meeting:add',
        'performance:meeting:update',
        'performance:meeting:delete',
        'performance:meeting:checkIn',
        'performance:talentAsset:page',
        'performance:talentAsset:info',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
      ],
    });
    const employeeMenuIds = await collectMenuIds({
      routers: [
        '/performance/my-assessment',
        '/performance/goals',
        '/performance/feedback',
        '/performance/course-learning',
        '/performance/teacher-channel/dashboard',
        '/performance/teacher-channel/teacher',
        '/performance/teacher-channel/todo',
        '/performance/teacher-channel/class',
      ],
      perms: [
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:update',
        'performance:assessment:submit',
        'performance:approvalFlow:info',
        'performance:approvalFlow:withdraw',
        'performance:approvalFlow:remind',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
        'performance:feedback:page',
        'performance:feedback:info',
        'performance:feedback:submit',
        'performance:feedback:summary',
        'performance:courseRecite:page',
        'performance:courseRecite:info',
        'performance:courseRecite:submit',
        'performance:coursePractice:page',
        'performance:coursePractice:info',
        'performance:coursePractice:submit',
        'performance:courseExam:summary',
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherInfo:add',
        'performance:teacherInfo:update',
        'performance:teacherInfo:updateStatus',
        'performance:teacherFollow:page',
        'performance:teacherFollow:add',
        'performance:teacherCooperation:mark',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherClass:add',
        'performance:teacherClass:update',
        'performance:teacherClass:delete',
        'performance:teacherTodo:page',
      ],
    });
    const readonlyMenuIds = await collectMenuIds({
      routers: [
        '/performance/teacher-channel/dashboard',
        '/performance/teacher-channel/teacher',
        '/performance/teacher-channel/todo',
        '/performance/teacher-channel/class',
      ],
      perms: [
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherFollow:page',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherTodo:page',
      ],
    });
    const feedbackMenuIds = await collectMenuIds({
      routers: ['/performance/feedback'],
      perms: [
        'performance:feedback:page',
        'performance:feedback:info',
        'performance:feedback:submit',
        'performance:feedback:summary',
      ],
    });

    const hrRoleId = await ensureRole({
      name: '绩效HR管理员',
      label: 'performance_hr',
      remark: '阶段2联调-HR管理员',
      menuIds: hrMenuIds,
      departmentIds: [
        headquartersId,
        rdCenterId,
        salesCenterId,
        hrDepartmentId,
        platformGroupId,
        businessGroupId,
      ],
    });
    const managerRoleId = await ensureRole({
      name: '绩效部门经理',
      label: 'performance_manager',
      remark: '阶段2联调-部门经理',
      menuIds: managerMenuIds,
      departmentIds: [rdCenterId, platformGroupId, businessGroupId],
    });
    const employeeRoleId = await ensureRole({
      name: '绩效员工',
      label: 'performance_employee',
      remark: '阶段2联调-普通员工',
      menuIds: employeeMenuIds,
      departmentIds: [platformGroupId],
    });
    const feedbackRoleId = await ensureRole({
      name: '绩效环评价人',
      label: 'performance_feedback',
      remark: '阶段2联调-环评价人',
      menuIds: feedbackMenuIds,
      departmentIds: [businessGroupId],
    });
    const readonlyTeacherRoleId = await ensureRole({
      name: '班主任只读账号',
      label: 'performance_teacher_readonly',
      remark: '阶段2联调-班主任只读账号',
      menuIds: readonlyMenuIds,
      departmentIds: [platformGroupId],
    });

    await replaceUserRoles(hrUserId, [hrRoleId]);
    await replaceUserRoles(managerUserId, [managerRoleId]);
    await replaceUserRoles(employeeUserId, [employeeRoleId]);
    await replaceUserRoles(feedbackUserId, [feedbackRoleId]);
    await replaceUserRoles(salesEmployeeUserId, [employeeRoleId]);
    await replaceUserRoles(readonlyTeacherUserId, [readonlyTeacherRoleId]);

    const seededCourses = await replaceCourses([
      {
        title: '联调-新员工训练营',
        code: 'PMS-COURSE-DRAFT-001',
        category: '通用培训',
        description: '主题7联调用草稿课程',
        startDate: '2026-05-01',
        endDate: '2026-05-08',
        status: 'draft',
        enrollments: [],
      },
      {
        title: '联调-晋升领导力训练营',
        code: 'PMS-COURSE-PUBLISHED-001',
        category: '管理培训',
        description: '主题7联调用已发布课程',
        startDate: '2026-05-10',
        endDate: '2026-05-18',
        status: 'published',
        enrollments: [
          {
            userId: employeeUserId,
            enrollTime: '2026-05-09 09:30:00',
            status: 'passed',
            score: 95.5,
          },
          {
            userId: salesEmployeeUserId,
            enrollTime: '2026-05-09 10:15:00',
            status: 'registered',
            score: null,
          },
        ],
      },
      {
        title: '联调-平台架构复盘课',
        code: null,
        category: '专业培训',
        description: '主题7联调用已关闭课程',
        startDate: '2026-04-20',
        endDate: '2026-04-28',
        status: 'closed',
        enrollments: [
          {
            userId: employeeUserId,
            enrollTime: '2026-04-19 14:00:00',
            status: 'completed',
            score: 88,
          },
        ],
      },
    ]);
    const learningCourse = seededCourses.find(
      item => item.code === 'PMS-COURSE-PUBLISHED-001'
    );

    if (!learningCourse?.id) {
      throw new Error('Stage-2 learning course seed missing PMS-COURSE-PUBLISHED-001');
    }

    await replaceCourseTaskRows('performance_course_recite', [
      {
        courseId: learningCourse.id,
        employeeId: employeeUserId,
        courseTitle: learningCourse.title,
        title: '联调-主题14背诵任务-待提交',
        taskType: 'recite',
        promptText: '请复述课程中的三条管理者沟通原则。',
        submissionText: null,
        status: 'pending',
      },
      {
        courseId: learningCourse.id,
        employeeId: employeeUserId,
        courseTitle: learningCourse.title,
        title: '联调-主题14背诵任务-已评估',
        taskType: 'recite',
        promptText: '请复述晋升沟通闭环的关键步骤。',
        submissionText: '先明确目标，再对齐预期，然后回收反馈并确认行动。',
        status: 'evaluated',
        latestScore: 93.5,
        feedbackSummary: '关键步骤齐全，表达较完整。',
        submittedAt: '2026-05-10 20:00:00',
        evaluatedAt: '2026-05-10 20:05:00',
      },
      {
        courseId: learningCourse.id,
        employeeId: salesEmployeeUserId,
        courseTitle: learningCourse.title,
        title: '联调-主题14背诵任务-销售员工',
        taskType: 'recite',
        promptText: '请复述销售场景下的课程要点。',
        submissionText: null,
        status: 'pending',
      },
    ]);

    await replaceCourseTaskRows('performance_course_practice', [
      {
        courseId: learningCourse.id,
        employeeId: employeeUserId,
        courseTitle: learningCourse.title,
        title: '联调-主题14练习任务-待提交',
        taskType: 'practice',
        promptText: '请编写一段课程结业后的主管沟通练习回复。',
        submissionText: null,
        status: 'pending',
      },
      {
        courseId: learningCourse.id,
        employeeId: employeeUserId,
        courseTitle: learningCourse.title,
        title: '联调-主题14练习任务-已评估',
        taskType: 'practice',
        promptText: '请输出一次课程回顾会议的开场白。',
        submissionText: '本次回顾聚焦三个方面：目标达成、协作改进和后续行动。',
        status: 'evaluated',
        latestScore: 91,
        feedbackSummary: '结构清晰，行动导向明确。',
        submittedAt: '2026-05-10 20:10:00',
        evaluatedAt: '2026-05-10 20:15:00',
      },
      {
        courseId: learningCourse.id,
        employeeId: salesEmployeeUserId,
        courseTitle: learningCourse.title,
        title: '联调-主题14练习任务-销售员工',
        taskType: 'practice',
        promptText: '请输出销售复盘练习内容。',
        submissionText: null,
        status: 'pending',
      },
    ]);

    await replaceCourseExamRows([
      {
        courseId: learningCourse.id,
        employeeId: employeeUserId,
        courseTitle: learningCourse.title,
        resultStatus: 'passed',
        latestScore: 95.5,
        passThreshold: 60,
        summaryText: '课程学习闭环已完成，可进入后续应用。',
        updatedAt: '2026-05-10 20:20:00',
      },
      {
        courseId: learningCourse.id,
        employeeId: salesEmployeeUserId,
        courseTitle: learningCourse.title,
        resultStatus: 'locked',
        latestScore: null,
        passThreshold: 60,
        summaryText: '当前前置任务未完成，考试结果摘要仍锁定。',
        updatedAt: '2026-05-10 20:20:00',
      },
    ]);
    await replaceCapabilitySeedData({
      employeeUserId,
      salesEmployeeUserId,
      platformGroupId,
      salesCenterId,
      hrUserId,
      sourceCourseId: learningCourse.id,
    });

    await replaceContracts([
      {
        employeeId: employeeUserId,
        type: 'full-time',
        title: '联调-主题10草稿合同',
        contractNumber: 'PMS-CONTRACT-DRAFT-001',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        probationPeriod: 3,
        salary: 18000,
        position: '平台工程师',
        departmentId: platformGroupId,
        status: 'draft',
      },
      {
        employeeId: employeeUserId,
        type: 'full-time',
        title: '联调-主题10生效合同',
        contractNumber: 'PMS-CONTRACT-ACTIVE-001',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        probationPeriod: 3,
        salary: 22000,
        position: '平台高级工程师',
        departmentId: platformGroupId,
        status: 'active',
      },
      {
        employeeId: salesEmployeeUserId,
        type: 'part-time',
        title: '联调-主题10终止合同',
        contractNumber: 'PMS-CONTRACT-TERMINATED-001',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        probationPeriod: 1,
        salary: 12500,
        position: '销售顾问',
        departmentId: salesCenterId,
        status: 'terminated',
      },
    ]);

    const documentCenterRows = await replaceDocumentCenters([
      {
        fileNo: 'PMS-DOC-21-POLICY-001',
        fileName: '联调-主题21-入职制度清单',
        category: 'policy',
        fileType: 'pdf',
        storage: 'cloud',
        confidentiality: 'internal',
        ownerName: '主题21-HR管理员',
        department: '行政部',
        status: 'published',
        version: 'V1.0',
        sizeMb: 12.5,
        downloadCount: 18,
        expireDate: '2027-12-31',
        tags: ['主题21', '制度', '入职'],
        notes: '主题21联调-文件管理已发布样例',
      },
      {
        fileNo: 'PMS-DOC-21-TEMPLATE-001',
        fileName: '联调-主题21-报销模板',
        category: 'template',
        fileType: 'xls',
        storage: 'local',
        confidentiality: 'public',
        ownerName: '主题21-HR管理员',
        department: '财务协同组',
        status: 'review',
        version: 'V0.9',
        sizeMb: 3.2,
        downloadCount: 4,
        expireDate: null,
        tags: ['主题21', '模板', '报销'],
        notes: '主题21联调-文件管理待审核样例',
      },
    ]);

    const documentCenterIdMap = new Map(
      documentCenterRows.map(item => [item.fileNo, item.id])
    );

    const knowledgeBaseRows = await replaceKnowledgeBases([
      {
        kbNo: 'PMS-KB-21-ONBOARDING-001',
        title: '联调-主题21-入职资料归档规范',
        category: '制度知识',
        summary: '用于主题21联调的知识条目样例，聚焦入职资料归档、检索和复用规则。',
        ownerName: '主题21-HR管理员',
        status: 'published',
        tags: ['主题21', '制度', '归档'],
        relatedFileIds: [documentCenterIdMap.get('PMS-DOC-21-POLICY-001')],
        relatedTopics: ['入职', '资料归档'],
        importance: 88,
        viewCount: 26,
      },
      {
        kbNo: 'PMS-KB-21-EXPENSE-001',
        title: '联调-主题21-费用报销知识卡片',
        category: '流程知识',
        summary: '用于主题21联调的知识条目样例，聚焦报销模板、填报要点和附件说明。',
        ownerName: '主题21-HR管理员',
        status: 'draft',
        tags: ['主题21', '流程', '报销'],
        relatedFileIds: [documentCenterIdMap.get('PMS-DOC-21-TEMPLATE-001')],
        relatedTopics: ['费用报销', '模板填报'],
        importance: 72,
        viewCount: 8,
      },
    ]);

    const knowledgeBaseIdMap = new Map(
      knowledgeBaseRows.map(item => [item.kbNo, item.id])
    );

    await replaceKnowledgeQas([
      {
        question: '联调-主题21-入职资料需要归档到哪里？',
        answer: '按入职资料归档规范归入文件管理台账，并在知识库挂接对应条目。',
        relatedKnowledgeIds: [knowledgeBaseIdMap.get('PMS-KB-21-ONBOARDING-001')],
        relatedFileIds: [documentCenterIdMap.get('PMS-DOC-21-POLICY-001')],
      },
      {
        question: '联调-主题21-报销模板在哪里取？',
        answer: '在文件管理的报销模板记录获取最新元数据，并在知识库查看填报说明。',
        relatedKnowledgeIds: [knowledgeBaseIdMap.get('PMS-KB-21-EXPENSE-001')],
        relatedFileIds: [documentCenterIdMap.get('PMS-DOC-21-TEMPLATE-001')],
      },
    ]);

    const seededSuppliers = await replaceSuppliers([
      {
        name: '联调-主题11平台云服务商',
        code: 'PMS-SUPPLIER-ACTIVE-001',
        category: '云服务',
        contactName: '王采购',
        contactPhone: '13812345678',
        contactEmail: 'buyer.active@example.com',
        bankAccount: '6222020202021234',
        taxNo: '913100001234567890',
        remark: '主题11联调-启用供应商',
        status: 'active',
      },
      {
        name: '联调-主题11硬件停用供应商',
        code: 'PMS-SUPPLIER-INACTIVE-001',
        category: '硬件设备',
        contactName: '李供应',
        contactPhone: '13987654321',
        contactEmail: 'supplier.inactive@example.com',
        bankAccount: '6217000000005678',
        taxNo: '913100009876543210',
        remark: '主题11联调-停用且存在有效订单',
        status: 'inactive',
      },
      {
        name: '联调-主题11咨询供应商',
        code: null,
        category: '咨询服务',
        contactName: '周合作',
        contactPhone: '13700001111',
        contactEmail: 'consulting@example.com',
        bankAccount: '6225888800009999',
        taxNo: '913100001111222233',
        remark: '主题11联调-空编码供应商',
        status: 'active',
      },
    ]);

    const supplierByCode = new Map(
      seededSuppliers.map(item => [item.code || item.name, item])
    );

    await replacePurchaseOrders([
      {
        orderNo: 'PMS-PO-DRAFT-001',
        title: '联调-主题11平台草稿采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-ACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-20',
        totalAmount: 12888.5,
        currency: 'CNY',
        remark: '主题11联调-草稿采购单，可删除',
        status: 'draft',
      },
      {
        orderNo: 'PMS-PO-ACTIVE-001',
        title: '联调-主题11平台生效采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-INACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-18',
        totalAmount: 35600,
        currency: 'CNY',
        remark: '主题11联调-生效采购单，验证删除限制',
        status: 'active',
      },
      {
        orderNo: 'PMS-PO-CANCELLED-001',
        title: '联调-主题11销售取消采购单',
        supplierId: supplierByCode.get('联调-主题11咨询供应商').id,
        departmentId: salesCenterId,
        requesterId: salesEmployeeUserId,
        orderDate: '2026-05-10',
        totalAmount: 8888,
        currency: 'CNY',
        remark: '主题11联调-跨部门取消采购单',
        status: 'cancelled',
      },
    ]);

    await replaceMeetings([
      {
        title: '联调-主题9排期会',
        code: 'PMS-MEETING-SCHEDULED-001',
        type: 'sync',
        description: '主题9联调-已安排会议样例',
        startDate: '2026-05-01 10:00:00',
        endDate: '2026-05-01 11:00:00',
        location: '研发中心-A1',
        organizerId: managerUserId,
        participantIds: [employeeUserId, feedbackUserId],
        participantCount: 2,
        status: 'scheduled',
        lastCheckInTime: null,
      },
      {
        title: '联调-主题9进行中晨会',
        code: 'PMS-MEETING-INPROGRESS-001',
        type: 'standup',
        description: '主题9联调-进行中会议样例',
        startDate: '2026-05-02 09:30:00',
        endDate: '2026-05-02 10:00:00',
        location: '研发中心-B2',
        organizerId: managerUserId,
        participantIds: [employeeUserId],
        participantCount: 1,
        status: 'in_progress',
        lastCheckInTime: '2026-05-02 09:35:00',
      },
      {
        title: '联调-主题9销售复盘会',
        code: 'PMS-MEETING-HIDDEN-001',
        type: 'review',
        description: '主题9联调-跨部门隐藏会议样例',
        startDate: '2026-05-03 14:00:00',
        endDate: '2026-05-03 15:00:00',
        location: '销售中心-C1',
        organizerId: hrUserId,
        participantIds: [salesEmployeeUserId],
        participantCount: 1,
        status: 'scheduled',
        lastCheckInTime: null,
      },
    ]);

    await replaceTalentAssets([
      {
        candidateName: '联调-主题12平台人才',
        code: 'PMS-TALENT-RD-001',
        targetDepartmentId: platformGroupId,
        targetPosition: '平台高级工程师',
        source: '内推',
        tagList: ['高潜', '可尽快到岗'],
        followUpSummary: '已完成首轮沟通，等待技术复盘。',
        nextFollowUpDate: '2026-05-06',
        status: 'new',
      },
      {
        candidateName: '联调-主题12销售人才',
        code: 'PMS-TALENT-SALES-001',
        targetDepartmentId: salesCenterId,
        targetPosition: '销售顾问',
        source: '招聘会',
        tagList: ['跨部门隐藏样例'],
        followUpSummary: '仅用于经理范围外不可见校验。',
        nextFollowUpDate: '2026-05-08',
        status: 'tracking',
      },
    ]);

    await replaceResumePools([
      {
        candidateName: '联调-主题15平台简历',
        targetDepartmentId: platformGroupId,
        targetPosition: '平台高级工程师',
        phone: '13812340001',
        email: 'theme15-rd@example.com',
        resumeText: '主题15联调-平台简历全文，用于 HR 成功与经理范围内查看校验。',
        sourceType: 'external',
        sourceRemark: '猎头推荐',
        externalLink: 'https://example.com/theme15/rd',
        attachmentIdList: [],
        status: 'new',
      },
      {
        candidateName: '联调-主题15销售简历',
        targetDepartmentId: salesCenterId,
        targetPosition: '销售顾问',
        phone: '13812340002',
        email: 'theme15-sales@example.com',
        resumeText: '主题15联调-销售简历全文，用于经理范围外不可见校验。',
        sourceType: 'referral',
        sourceRemark: '内推',
        externalLink: null,
        attachmentIdList: [],
        status: 'screening',
      },
    ]);

    await replaceHirings([
      {
        candidateName: '联调-主题18平台录用',
        targetDepartmentId: platformGroupId,
        targetPosition: '平台高级工程师',
        decisionContent: '主题18联调-平台部门录用样例，用于 HR 与经理范围内成功校验。',
        sourceType: 'manual',
        sourceId: null,
        sourceSnapshot: {
          sourceStatusSnapshot: 'manual-created',
          sourceType: 'manual',
        },
        status: 'offered',
      },
      {
        candidateName: '联调-主题18销售录用',
        targetDepartmentId: salesCenterId,
        targetPosition: '销售顾问',
        decisionContent: '主题18联调-销售部门录用样例，用于经理范围外拒绝校验。',
        sourceType: 'manual',
        sourceId: null,
        sourceSnapshot: {
          sourceStatusSnapshot: 'manual-created',
          sourceType: 'manual',
        },
        status: 'offered',
      },
    ]);

    const recruitPlanImportSpaceId = await upsertSpaceInfoSeed({
      url: 'https://example.com/stage2/theme16/recruit-plan-import-template.xlsx',
      type: 'application',
      classifyId: 1601,
      fileId: 'stage2-theme16-recruit-plan-import',
      name: 'stage2-theme16-recruit-plan-import-template.xlsx',
      size: 2048,
      version: 1,
      key: 'stage2/theme16/recruit-plan-import-template.xlsx',
    });

    await replaceRecruitPlans([
      {
        title: '联调-主题16平台招聘计划',
        targetDepartmentId: platformGroupId,
        positionName: '平台高级工程师',
        headcount: 2,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        recruiterId: hrUserId,
        requirementSummary: '主题16联调-平台部门招聘计划样例，用于 HR 与经理范围内查看校验。',
        status: 'active',
      },
      {
        title: '联调-主题16销售招聘计划',
        targetDepartmentId: salesCenterId,
        positionName: '销售顾问',
        headcount: 1,
        startDate: '2026-04-25',
        endDate: '2026-05-20',
        recruiterId: hrUserId,
        requirementSummary: '主题16联调-销售部门招聘计划样例，用于经理范围外不可见校验。',
        status: 'closed',
      },
    ]);

    await replaceJobStandards([
      {
        positionName: '联调-主题17平台职位标准',
        targetDepartmentId: platformGroupId,
        jobLevel: 'P6',
        profileSummary: '负责平台基础能力建设与核心交付稳定性。',
        requirementSummary: '要求具备 Node.js、Midway 和复杂业务联调经验。',
        skillTagList: ['Node.js', 'Midway', '联调推进'],
        interviewTemplateSummary: '技术深度、问题拆解、跨团队协作三维摘要面。',
        status: 'active',
      },
      {
        positionName: '联调-主题17销售职位标准',
        targetDepartmentId: salesCenterId,
        jobLevel: 'M3',
        profileSummary: '用于经理范围外不可见校验的销售职位标准样例。',
        requirementSummary: '要求具备销售管理与客户拓展经验。',
        skillTagList: ['销售管理', '客户拓展'],
        interviewTemplateSummary: '业务拓展、客户经营、团队带教摘要面。',
        status: 'draft',
      },
    ]);

    const currentDate = new Date();
    const followYesterday = formatDateTime(addDays(currentDate, -1));
    const followToday = formatDateTime(currentDate);
    const followTomorrow = formatDateTime(addDays(currentDate, 1));
    const followAfterTomorrow = formatDateTime(addDays(currentDate, 2));
    const cooperationYesterday = formatDateTime(addDays(currentDate, -2));

    await replaceTeacherChannelData([
      {
        teacherName: '联调-主题19平台待联系班主任',
        phone: '13812341901',
        wechat: 'theme19_waiting',
        schoolName: '联调第一中学',
        schoolRegion: '上海',
        schoolType: '公立',
        grade: '高一',
        className: '1班',
        subject: '数学',
        projectTags: ['主题19', '待建联'],
        intentionLevel: 'A',
        communicationStyle: '理性',
        cooperationStatus: 'uncontacted',
        ownerEmployeeId: employeeUserId,
        ownerDepartmentId: platformGroupId,
        lastFollowTime: null,
        nextFollowTime: null,
        cooperationTime: null,
        follows: [],
        classes: [],
      },
      {
        teacherName: '联调-主题19平台逾期待跟进班主任',
        phone: '13812341902',
        wechat: 'theme19_overdue',
        schoolName: '联调第二中学',
        schoolRegion: '上海',
        schoolType: '民办',
        grade: '高二',
        className: '2班',
        subject: '英语',
        projectTags: ['主题19', '逾期'],
        intentionLevel: 'B',
        communicationStyle: '直接',
        cooperationStatus: 'contacted',
        ownerEmployeeId: employeeUserId,
        ownerDepartmentId: platformGroupId,
        lastFollowTime: followYesterday,
        nextFollowTime: followYesterday,
        cooperationTime: null,
        follows: [
          {
            followTime: followYesterday,
            nextFollowTime: followYesterday,
            followMethod: '电话',
            followContent: '主题19联调-首次跟进，已进入逾期待办。',
            creatorEmployeeId: employeeUserId,
            creatorEmployeeName: '平台员工',
          },
        ],
        classes: [],
      },
      {
        teacherName: '联调-主题19平台已合作班主任',
        phone: '13812341903',
        wechat: 'theme19_partnered',
        schoolName: '联调第三中学',
        schoolRegion: '上海',
        schoolType: '公立',
        grade: '高三',
        className: '3班',
        subject: '物理',
        projectTags: ['主题19', '已合作'],
        intentionLevel: 'S',
        communicationStyle: '积极',
        cooperationStatus: 'partnered',
        ownerEmployeeId: employeeUserId,
        ownerDepartmentId: platformGroupId,
        lastFollowTime: followToday,
        nextFollowTime: followToday,
        cooperationTime: cooperationYesterday,
        follows: [
          {
            followTime: followToday,
            nextFollowTime: followToday,
            followMethod: '到校拜访',
            followContent: '主题19联调-已合作班主任样例。',
            creatorEmployeeId: employeeUserId,
            creatorEmployeeName: '平台员工',
          },
        ],
        classes: [
          {
            className: '联调-主题19平台进行中班级',
            projectTag: '主题19',
            studentCount: 28,
            status: 'active',
          },
          {
            className: '联调-主题19平台关闭班级',
            projectTag: '主题19',
            studentCount: 26,
            status: 'closed',
          },
        ],
      },
      {
        teacherName: '联调-主题19销售隐藏班主任',
        phone: '13812341904',
        wechat: 'theme19_sales_hidden',
        schoolName: '联调销售校',
        schoolRegion: '杭州',
        schoolType: '民办',
        grade: '初三',
        className: '销售班',
        subject: '语文',
        projectTags: ['主题19', '销售'],
        intentionLevel: 'A',
        communicationStyle: '热情',
        cooperationStatus: 'partnered',
        ownerEmployeeId: salesEmployeeUserId,
        ownerDepartmentId: salesCenterId,
        lastFollowTime: followToday,
        nextFollowTime: followAfterTomorrow,
        cooperationTime: cooperationYesterday,
        follows: [
          {
            followTime: followToday,
            nextFollowTime: followAfterTomorrow,
            followMethod: '微信',
            followContent: '主题19联调-销售部门隐藏样例。',
            creatorEmployeeId: salesEmployeeUserId,
            creatorEmployeeName: '销售员工',
          },
        ],
        classes: [
          {
            className: '联调-主题19销售班级',
            projectTag: '销售',
            studentCount: 30,
            status: 'active',
          },
        ],
      },
    ]);

    const assessmentIdMap = await replaceAssessments([
      {
        code: 'PMS-STAGE2-DRAFT-001',
        employeeId: employeeUserId,
        assessorId: managerUserId,
        departmentId: platformGroupId,
        periodType: 'quarter',
        periodValue: '2026-Q2',
        targetCompletion: 75,
        totalScore: 0,
        grade: null,
        selfEvaluation: '',
        managerFeedback: '',
        submitTime: null,
        approveTime: null,
        status: 'draft',
        scoreItems: [
          { indicatorName: '目标达成', score: 0, weight: 60, comment: '' },
          { indicatorName: '协作质量', score: 0, weight: 40, comment: '' },
        ],
      },
      {
        code: 'PMS-STAGE2-SUBMITTED-001',
        employeeId: employeeUserId,
        assessorId: managerUserId,
        departmentId: platformGroupId,
        periodType: 'quarter',
        periodValue: '2026-Q2',
        targetCompletion: 88,
        totalScore: 87.2,
        grade: 'A',
        selfEvaluation: '联调样例-已提交自评',
        managerFeedback: '',
        submitTime: now(),
        approveTime: null,
        status: 'submitted',
        scoreItems: [
          { indicatorName: '目标达成', score: 90, weight: 60, comment: '完成主要里程碑' },
          { indicatorName: '协作质量', score: 83, weight: 40, comment: '跨组协作稳定' },
        ],
      },
      {
        code: 'PMS-STAGE2-APPROVED-001',
        employeeId: employeeUserId,
        assessorId: managerUserId,
        departmentId: platformGroupId,
        periodType: 'quarter',
        periodValue: '2026-Q1',
        targetCompletion: 95,
        totalScore: 92,
        grade: 'S',
        selfEvaluation: '联调样例-已通过评估',
        managerFeedback: '表现突出，可作为优秀样例',
        submitTime: now(),
        approveTime: now(),
        status: 'approved',
        scoreItems: [
          { indicatorName: '目标达成', score: 94, weight: 60, comment: '关键目标超额完成' },
          { indicatorName: '协作质量', score: 89, weight: 40, comment: '协作响应积极' },
        ],
      },
      {
        code: 'PMS-STAGE2-REJECTED-001',
        employeeId: employeeUserId,
        assessorId: managerUserId,
        departmentId: platformGroupId,
        periodType: 'month',
        periodValue: '2026-03',
        targetCompletion: 62,
        totalScore: 67.4,
        grade: 'C',
        selfEvaluation: '联调样例-待修改评估',
        managerFeedback: '目标说明不充分，请补充事实依据',
        submitTime: now(),
        approveTime: now(),
        status: 'rejected',
        scoreItems: [
          { indicatorName: '目标达成', score: 65, weight: 60, comment: '交付延迟' },
          { indicatorName: '协作质量', score: 71, weight: 40, comment: '反馈需要更及时' },
        ],
      },
      {
        code: 'PMS-STAGE2-HIDDEN-001',
        employeeId: salesEmployeeUserId,
        assessorId: hrUserId,
        departmentId: salesCenterId,
        periodType: 'quarter',
        periodValue: '2026-Q2',
        targetCompletion: 80,
        totalScore: 81,
        grade: 'A',
        selfEvaluation: '跨部门权限校验样例',
        managerFeedback: '',
        submitTime: now(),
        approveTime: null,
        status: 'submitted',
        scoreItems: [
          { indicatorName: '销售目标', score: 82, weight: 70, comment: '订单完成稳定' },
          { indicatorName: '客户协同', score: 78, weight: 30, comment: '协同正常' },
        ],
      },
    ]);

    await replaceGoals([
      {
        employeeId: employeeUserId,
        departmentId: platformGroupId,
        title: '联调-平台组季度交付目标',
        description: '模块2联调草稿目标',
        targetValue: 12,
        currentValue: 0,
        unit: '项',
        weight: 40,
        startDate: '2026-04-01',
        endDate: '2026-06-30',
        status: 'draft',
        progressRecords: [],
      },
      {
        employeeId: employeeUserId,
        departmentId: platformGroupId,
        title: '联调-平台组质量改进目标',
        description: '模块2联调进行中目标',
        targetValue: 10,
        currentValue: 6,
        unit: '项',
        weight: 30,
        startDate: '2026-04-01',
        endDate: '2026-06-30',
        status: 'in-progress',
        progressRecords: [
          {
            beforeValue: 3,
            afterValue: 6,
            remark: '联调初始化-已推进到60%',
            operatorId: employeeUserId,
          },
        ],
      },
      {
        employeeId: employeeUserId,
        departmentId: platformGroupId,
        title: '联调-平台组稳定性目标',
        description: '模块2联调已完成目标',
        targetValue: 8,
        currentValue: 8,
        unit: '项',
        weight: 30,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        status: 'completed',
        progressRecords: [
          {
            beforeValue: 6,
            afterValue: 8,
            remark: '联调初始化-已完成',
            operatorId: managerUserId,
          },
        ],
      },
      {
        employeeId: salesEmployeeUserId,
        departmentId: salesCenterId,
        title: '联调-销售中心隐藏目标',
        description: '用于经理越权不可见校验',
        targetValue: 20,
        currentValue: 5,
        unit: '单',
        weight: 20,
        startDate: '2026-04-01',
        endDate: '2026-06-30',
        status: 'in-progress',
        progressRecords: [
          {
            beforeValue: 0,
            afterValue: 5,
            remark: '销售侧联调样例',
            operatorId: salesEmployeeUserId,
          },
        ],
      },
    ]);

    await replaceIndicators([
      {
        name: '阶段2-目标达成',
        code: 'PMS-STAGE2-IND-DELIVERY',
        category: 'assessment',
        weight: 40,
        scoreScale: 100,
        applyScope: 'all',
        description: '驾驶舱联调-启用指标样例',
        status: 1,
      },
      {
        name: '阶段2-目标推进',
        code: 'PMS-STAGE2-IND-COLLAB',
        category: 'goal',
        weight: 30,
        scoreScale: 100,
        applyScope: 'all',
        description: '驾驶舱联调-启用指标样例',
        status: 1,
      },
      {
        name: '阶段2-环评协同',
        code: 'PMS-STAGE2-IND-STABILITY',
        category: 'feedback',
        weight: 30,
        scoreScale: 100,
        applyScope: 'department',
        description: '驾驶舱联调-启用指标样例',
        status: 1,
      },
      {
        name: '阶段2-保留停用指标',
        code: 'PMS-STAGE2-IND-DISABLED',
        category: 'assessment',
        weight: 10,
        scoreScale: 100,
        applyScope: 'all',
        description: '驾驶舱联调-停用指标样例',
        status: 0,
      },
    ]);

    await replaceFeedbackTasks([
      {
        assessmentId: assessmentIdMap.get('PMS-STAGE2-APPROVED-001'),
        employeeId: employeeUserId,
        title: '联调-平台组360反馈任务',
        deadline: '2099-12-31 23:59:59',
        creatorId: managerUserId,
        status: 'running',
        records: [
          {
            feedbackUserId: feedbackUserId,
            relationType: '协作人',
            score: 88,
            content: '联调样例-已提交反馈',
            status: 'submitted',
            submitTime: now(),
          },
          {
            feedbackUserId: managerUserId,
            relationType: '上级',
            score: 0,
            content: '',
            status: 'draft',
            submitTime: null,
          },
        ],
      },
    ]);

    await replacePips([
      {
        assessmentId: assessmentIdMap.get('PMS-STAGE2-REJECTED-001'),
        employeeId: employeeUserId,
        ownerId: managerUserId,
        title: '联调-PIP-草稿-平台员工',
        improvementGoal: '补齐阶段 2 缺陷闭环和交付节奏',
        sourceReason: null,
        startDate: '2026-04-10',
        endDate: '2026-05-10',
        status: 'draft',
        resultSummary: null,
        trackRecords: [],
      },
      {
        assessmentId: null,
        employeeId: employeeUserId,
        ownerId: managerUserId,
        title: '联调-PIP-进行中-平台员工',
        improvementGoal: '提升联调稳定性和问题响应速度',
        sourceReason: '阶段2联调-独立创建-PIP进行中样例',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        status: 'active',
        resultSummary: null,
        trackRecords: [
          {
            recordDate: '2026-04-15',
            progress: '已完成 smoke 脚本初版，开始补权限回归',
            nextPlan: '补齐模块 6/7/8 联调链路',
            operatorId: managerUserId,
          },
        ],
      },
      {
        assessmentId: assessmentIdMap.get('PMS-STAGE2-SUBMITTED-001'),
        employeeId: employeeUserId,
        ownerId: managerUserId,
        title: '联调-PIP-已完成-平台员工',
        improvementGoal: '完成阶段 2 主链联调',
        sourceReason: null,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        status: 'completed',
        resultSummary: '阶段 2 联调目标已完成',
        trackRecords: [
          {
            recordDate: '2026-03-20',
            progress: '联调缺口已基本关闭',
            nextPlan: '整理自动化证据',
            operatorId: managerUserId,
          },
        ],
      },
      {
        assessmentId: null,
        employeeId: salesEmployeeUserId,
        ownerId: hrUserId,
        title: '联调-PIP-隐藏-销售员工',
        improvementGoal: '销售团队流程改进样例',
        sourceReason: '阶段2联调-跨部门隐藏PIP样例',
        startDate: '2026-04-05',
        endDate: '2026-05-05',
        status: 'active',
        resultSummary: null,
        trackRecords: [
          {
            recordDate: '2026-04-16',
            progress: '仅用于经理越权不可见校验',
            nextPlan: '保持联调样例稳定',
            operatorId: hrUserId,
          },
        ],
      },
    ]);

    await replacePromotions([
      {
        assessmentId: null,
        employeeId: salesEmployeeUserId,
        sponsorId: hrUserId,
        fromPosition: '销售专员',
        toPosition: '阶段2-销售主管',
        reason: '阶段2联调-销售晋升草稿',
        sourceReason: '阶段2联调-独立创建-销售晋升样例',
        status: 'draft',
        reviewTime: null,
        reviewRecords: [],
      },
      {
        assessmentId: assessmentIdMap.get('PMS-STAGE2-SUBMITTED-001'),
        employeeId: employeeUserId,
        sponsorId: managerUserId,
        fromPosition: '平台工程师',
        toPosition: '阶段2-平台高级工程师',
        reason: '阶段2联调-晋升评审中样例',
        sourceReason: null,
        status: 'reviewing',
        reviewTime: null,
        reviewRecords: [],
      },
      {
        assessmentId: assessmentIdMap.get('PMS-STAGE2-APPROVED-001'),
        employeeId: employeeUserId,
        sponsorId: managerUserId,
        fromPosition: '平台工程师',
        toPosition: '阶段2-平台技术专家',
        reason: '阶段2联调-晋升已通过样例',
        sourceReason: null,
        status: 'approved',
        reviewTime: now(),
        reviewRecords: [
          {
            reviewerId: hrUserId,
            decision: 'approved',
            comment: '阶段2联调-已通过',
          },
        ],
      },
      {
        assessmentId: assessmentIdMap.get('PMS-STAGE2-REJECTED-001'),
        employeeId: employeeUserId,
        sponsorId: managerUserId,
        fromPosition: '平台工程师',
        toPosition: '阶段2-平台架构师',
        reason: '阶段2联调-晋升已驳回样例',
        sourceReason: null,
        status: 'rejected',
        reviewTime: now(),
        reviewRecords: [
          {
            reviewerId: hrUserId,
            decision: 'rejected',
            comment: '阶段2联调-已驳回',
          },
        ],
      },
    ]);

    await replaceSalaries([
      {
        employeeId: employeeUserId,
        assessmentId: assessmentIdMap.get('PMS-STAGE2-DRAFT-001'),
        periodValue: '2026-STAGE2-Q2',
        baseSalary: 15000,
        performanceBonus: 2000,
        adjustAmount: 0,
        finalAmount: 17000,
        grade: 'B',
        effectiveDate: '2026-06-30',
        status: 'confirmed',
      },
      {
        employeeId: employeeUserId,
        assessmentId: assessmentIdMap.get('PMS-STAGE2-SUBMITTED-001'),
        periodValue: '2026-STAGE2-Q2',
        baseSalary: 15000,
        performanceBonus: 2500,
        adjustAmount: 500,
        finalAmount: 18000,
        grade: 'A',
        effectiveDate: '2026-06-30',
        status: 'archived',
      },
      {
        employeeId: salesEmployeeUserId,
        assessmentId: assessmentIdMap.get('PMS-STAGE2-HIDDEN-001'),
        periodValue: '2026-STAGE2-Q2',
        baseSalary: 12000,
        performanceBonus: 1800,
        adjustAmount: 200,
        finalAmount: 14000,
        grade: 'A',
        effectiveDate: '2026-06-30',
        status: 'archived',
      },
    ]);

    seedMeta = await syncStage2RuntimeMeta({
      recruitPlanImportSpaceId,
      recruitPlanImportSpaceName: 'stage2-theme16-recruit-plan-import-template.xlsx',
    });

    await connection.commit();

    console.log('Stage-2 performance seed completed for modules 1/2/4/5/6/7/8/9 baseline.');
    console.log('Accounts: admin, hr_admin, manager_rd, employee_platform, feedback_peer, employee_sales, readonly_teacher');
    console.log('Password: 123456');
    console.log(`Runtime seed version: ${seedMeta.version}`);
    console.log(`Runtime seed scopes: ${seedMeta.scopes.join(', ')}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

await main();
