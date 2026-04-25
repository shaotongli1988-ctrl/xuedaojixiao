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
  '/performance/workbench',
  '/performance/work-plan',
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
  '/performance/purchase-inquiry',
  '/performance/purchase-approval',
  '/performance/purchase-execution',
  '/performance/purchase-receipt',
  '/performance/purchase-report',
  '/performance/supplier',
  '/performance/asset/dashboard',
  '/performance/asset/ledger',
  '/performance/asset/request',
  '/performance/asset/request-pending',
  '/performance/asset/assignment',
  '/performance/asset/maintenance',
  '/performance/asset/report',
  '/performance/asset/procurement',
  '/performance/asset/transfer',
  '/performance/asset/inventory',
  '/performance/asset/depreciation',
  '/performance/asset/disposal',
  '/performance/material/catalog',
  '/performance/material/stock',
  '/performance/material/inbound',
  '/performance/material/issue',
  '/performance/office/annual-inspection',
  '/performance/office/honor',
  '/performance/office/publicity-material',
  '/performance/office/design-collab',
  '/performance/office/express-collab',
  '/performance/office/document-center',
  '/performance/office/knowledge-base',
  '/performance/office/vehicle',
  '/performance/office/intellectual-property',
]);

const connection = await mysql.createConnection({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: Number(process.env.LOCAL_DB_PORT || 3306),
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '123456',
  database: process.env.LOCAL_DB_NAME || 'cool',
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

function serializeJsonValue(value) {
  return value === undefined || value === null ? null : JSON.stringify(value);
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

async function ensureRole({
  name,
  label,
  remark,
  menuIds,
  departmentIds,
  isSuperAdmin = false,
}) {
  const menuIdList = JSON.stringify(menuIds);
  const departmentIdList = JSON.stringify(departmentIds);
  const superAdminFlag = isSuperAdmin ? 1 : 0;
  const existing = isSuperAdmin
    ? await queryOne(
        `SELECT id
           FROM base_sys_role
          WHERE isSuperAdmin = 1
             OR label = ?
          LIMIT 1`,
        [label]
      )
    : await queryOne(
        `SELECT id
           FROM base_sys_role
          WHERE label = ?
          LIMIT 1`,
        [label]
      );

  if (existing) {
    await connection.query(
      `UPDATE base_sys_role
          SET userId = '1', name = ?, remark = ?, isSuperAdmin = ?, relevance = 1, menuIdList = ?, departmentIdList = ?, updateTime = ?
        WHERE id = ?`,
      [name, remark, superAdminFlag, menuIdList, departmentIdList, now(), existing.id]
    );
    await replaceRoleBindings(existing.id, menuIds, departmentIds);
    return existing.id;
  }

  const [result] = await connection.query(
    `INSERT INTO base_sys_role
      (userId, name, label, isSuperAdmin, remark, relevance, menuIdList, departmentIdList, createTime, updateTime, tenantId)
     VALUES ('1', ?, ?, ?, ?, 1, ?, ?, ?, ?, NULL)`,
    [name, label, superAdminFlag, remark, menuIdList, departmentIdList, now(), now()]
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

async function listAllMenuIds() {
  const [rows] = await connection.query('SELECT id FROM base_sys_menu ORDER BY id ASC');
  return (Array.isArray(rows) ? rows : [])
    .map(item => Number(item.id))
    .filter(item => Number.isInteger(item) && item > 0);
}

async function listAllDepartmentIds() {
  const [rows] = await connection.query(
    'SELECT id FROM base_sys_department ORDER BY id ASC'
  );
  return (Array.isArray(rows) ? rows : [])
    .map(item => Number(item.id))
    .filter(item => Number.isInteger(item) && item > 0);
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

async function upsertApprovalConfig({ objectType, version, enabled, nodes }) {
  const existing = await queryOne(
    'SELECT id FROM performance_approval_config WHERE objectType = ? LIMIT 1',
    [objectType]
  );

  let configId = existing?.id || null;

  if (configId) {
    await connection.query(
      `UPDATE performance_approval_config
          SET version = ?, enabled = ?, notifyMode = 'interface_only', updateTime = ?
        WHERE id = ?`,
      [version, enabled ? 1 : 0, now(), configId]
    );
  } else {
    const [result] = await connection.query(
      `INSERT INTO performance_approval_config
        (objectType, version, enabled, notifyMode, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, 'interface_only', ?, ?, NULL)`,
      [objectType, version, enabled ? 1 : 0, now(), now()]
    );
    configId = result.insertId;
  }

  await connection.query(
    'DELETE FROM performance_approval_config_node WHERE configId = ?',
    [configId]
  );

  for (const item of nodes) {
    await connection.query(
      `INSERT INTO performance_approval_config_node
        (configId, nodeOrder, nodeCode, nodeName, resolverType, resolverValue, timeoutHours, allowTransfer, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        configId,
        item.nodeOrder,
        item.nodeCode,
        item.nodeName,
        item.resolverType,
        item.resolverValue ?? null,
        item.timeoutHours ?? null,
        item.allowTransfer ? 1 : 0,
        now(),
        now(),
      ]
    );
  }

  return configId;
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

async function replaceGoalOpsSeed({ configs = [], plans = [], reports = [] }) {
  const departmentIds = Array.from(
    new Set(
      [...configs, ...plans, ...reports]
        .map(item => Number(item.departmentId))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );

  if (departmentIds.length) {
    await connection.query(
      'DELETE FROM performance_goal_ops_report WHERE departmentId IN (?)',
      [departmentIds]
    );
    await connection.query(
      'DELETE FROM performance_goal_ops_plan WHERE departmentId IN (?)',
      [departmentIds]
    );
    await connection.query(
      'DELETE FROM performance_goal_ops_department_config WHERE departmentId IN (?)',
      [departmentIds]
    );
  }

  for (const row of configs) {
    await connection.query(
      `INSERT INTO performance_goal_ops_department_config
        (departmentId, assignTime, submitDeadline, reportSendTime, reportPushMode, reportPushTarget, updatedBy, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.departmentId,
        row.assignTime,
        row.submitDeadline,
        row.reportSendTime,
        row.reportPushMode,
        row.reportPushTarget,
        row.updatedBy,
        now(),
        now(),
      ]
    );
  }

  for (const row of plans) {
    await connection.query(
      `INSERT INTO performance_goal_ops_plan
        (departmentId, employeeId, periodType, planDate, periodStartDate, periodEndDate, sourceType, title, description, targetValue, actualValue, unit, status, parentPlanId, isSystemGenerated, assignedBy, submittedBy, submittedAt, extJson, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.departmentId,
        row.employeeId,
        row.periodType,
        row.planDate,
        row.periodStartDate,
        row.periodEndDate,
        row.sourceType,
        row.title,
        row.description,
        row.targetValue,
        row.actualValue,
        row.unit,
        row.status,
        row.parentPlanId,
        row.isSystemGenerated,
        row.assignedBy,
        row.submittedBy,
        row.submittedAt,
        row.extJson,
        now(),
        now(),
      ]
    );
  }

  for (const row of reports) {
    await connection.query(
      `INSERT INTO performance_goal_ops_report
        (departmentId, reportDate, status, summaryJson, generatedAt, sentAt, pushMode, pushTarget, generatedBy, operatedBy, operationRemark, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.departmentId,
        row.reportDate,
        row.status,
        row.summaryJson,
        row.generatedAt,
        row.sentAt,
        row.pushMode,
        row.pushTarget,
        row.generatedBy,
        row.operatedBy,
        row.operationRemark,
        now(),
        now(),
      ]
    );
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

async function replaceTeacherChannelAgentData({
  seededTeachers = [],
  seedAgents = [],
  seedRelations = [],
  seedAttributions = [],
  seedConflicts = [],
}) {
  const teacherIdByName = new Map(
    seededTeachers.map(item => [String(item.teacherName || ''), Number(item.id || 0)])
  );
  const teacherIds = Array.from(
    new Set([...teacherIdByName.values()].filter(item => Number.isInteger(item) && item > 0))
  );
  const agentNames = Array.from(
    new Set(
      seedAgents.map(item => String(item.name || '').trim()).filter(Boolean)
    )
  );

  if (teacherIds.length) {
    await connection.query(
      'DELETE FROM performance_teacher_attribution_conflict WHERE teacherId IN (?)',
      [teacherIds]
    );
    await connection.query(
      'DELETE FROM performance_teacher_attribution WHERE teacherId IN (?)',
      [teacherIds]
    );
  }

  if (agentNames.length) {
    const [existingAgents] = await connection.query(
      'SELECT id FROM performance_teacher_agent WHERE name IN (?)',
      [agentNames]
    );
    const agentIds = existingAgents
      .map(item => Number(item.id || 0))
      .filter(item => Number.isInteger(item) && item > 0);

    if (agentIds.length) {
      await connection.query(
        'DELETE FROM performance_teacher_agent_relation WHERE parentAgentId IN (?) OR childAgentId IN (?)',
        [agentIds, agentIds]
      );
    }

    await connection.query('DELETE FROM performance_teacher_agent WHERE name IN (?)', [agentNames]);
  }

  const insertedAgents = [];
  const agentIdByName = new Map();
  const agentRowByName = new Map();

  for (const row of seedAgents) {
    const [result] = await connection.query(
      `INSERT INTO performance_teacher_agent
        (name, agentType, level, region, cooperationStatus, status, blacklistStatus, remark, ownerEmployeeId, ownerDepartmentId, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.name,
        row.agentType,
        row.level ?? null,
        row.region ?? null,
        row.cooperationStatus ?? null,
        row.status ?? 'active',
        row.blacklistStatus ?? 'normal',
        row.remark ?? null,
        row.ownerEmployeeId,
        row.ownerDepartmentId,
        now(),
        now(),
      ]
    );

    const inserted = {
      id: Number(result.insertId || 0),
      ...row,
    };
    insertedAgents.push(inserted);
    agentIdByName.set(row.name, inserted.id);
    agentRowByName.set(row.name, inserted);
  }

  const insertedRelations = [];
  for (const row of seedRelations) {
    const parentAgentId = Number(agentIdByName.get(row.parentAgentName) || 0);
    const childAgentId = Number(agentIdByName.get(row.childAgentName) || 0);
    const parentAgent = agentRowByName.get(row.parentAgentName);

    if (!parentAgentId || !childAgentId || !parentAgent) {
      throw new Error(`teacher-channel agent relation seed missing agent: ${row.parentAgentName} / ${row.childAgentName}`);
    }

    const [result] = await connection.query(
      `INSERT INTO performance_teacher_agent_relation
        (parentAgentId, childAgentId, status, effectiveTime, remark, ownerEmployeeId, ownerDepartmentId, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        parentAgentId,
        childAgentId,
        row.status ?? 'active',
        row.effectiveTime ?? null,
        row.remark ?? null,
        row.ownerEmployeeId,
        row.ownerDepartmentId ?? parentAgent.ownerDepartmentId,
        now(),
        now(),
      ]
    );

    insertedRelations.push({
      id: Number(result.insertId || 0),
      parentAgentId,
      childAgentId,
      parentAgentName: row.parentAgentName,
      childAgentName: row.childAgentName,
      status: row.status ?? 'active',
      effectiveTime: row.effectiveTime ?? null,
      remark: row.remark ?? null,
      ownerEmployeeId: row.ownerEmployeeId,
      ownerDepartmentId: row.ownerDepartmentId ?? parentAgent.ownerDepartmentId,
    });
  }

  const insertedAttributions = [];
  for (const row of seedAttributions) {
    const teacherId = Number(teacherIdByName.get(row.teacherName) || 0);
    const agentId = row.agentName ? Number(agentIdByName.get(row.agentName) || 0) : null;

    if (!teacherId || (row.agentName && !agentId)) {
      throw new Error(`teacher-channel attribution seed missing target: ${row.teacherName} / ${row.agentName || 'direct'}`);
    }

    const [result] = await connection.query(
      `INSERT INTO performance_teacher_attribution
        (teacherId, agentId, attributionType, status, sourceType, sourceRemark, effectiveTime, operatorId, operatorName, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        teacherId,
        agentId,
        row.attributionType ?? (agentId ? 'agent' : 'direct'),
        row.status ?? 'active',
        row.sourceType ?? 'assign',
        row.sourceRemark ?? null,
        row.effectiveTime ?? null,
        row.operatorId ?? null,
        row.operatorName ?? null,
        now(),
        now(),
      ]
    );

    insertedAttributions.push({
      id: Number(result.insertId || 0),
      teacherId,
      teacherName: row.teacherName,
      agentId,
      agentName: row.agentName || null,
      attributionType: row.attributionType ?? (agentId ? 'agent' : 'direct'),
      status: row.status ?? 'active',
      sourceType: row.sourceType ?? 'assign',
      sourceRemark: row.sourceRemark ?? null,
      effectiveTime: row.effectiveTime ?? null,
      operatorId: row.operatorId ?? null,
      operatorName: row.operatorName ?? null,
    });
  }

  const insertedConflicts = [];
  for (const row of seedConflicts) {
    const teacherId = Number(teacherIdByName.get(row.teacherName) || 0);
    const currentAgentId = row.currentAgentName
      ? Number(agentIdByName.get(row.currentAgentName) || 0)
      : null;
    const requestedAgentId = row.requestedAgentName
      ? Number(agentIdByName.get(row.requestedAgentName) || 0)
      : null;
    const candidateAgentIds = Array.from(
      new Set(
        (row.candidateAgentNames || [])
          .map(item => Number(agentIdByName.get(item) || 0))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    if (!teacherId) {
      throw new Error(`teacher-channel conflict seed missing teacher: ${row.teacherName}`);
    }

    const [result] = await connection.query(
      `INSERT INTO performance_teacher_attribution_conflict
        (teacherId, candidateAgentIds, status, resolution, resolutionRemark, resolvedBy, resolvedTime, currentAgentId, requestedAgentId, requestedById, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        teacherId,
        JSON.stringify(candidateAgentIds),
        row.status ?? 'open',
        row.resolution ?? null,
        row.resolutionRemark ?? null,
        row.resolvedBy ?? null,
        row.resolvedTime ?? null,
        currentAgentId,
        requestedAgentId,
        row.requestedById ?? null,
        now(),
        now(),
      ]
    );

    insertedConflicts.push({
      id: Number(result.insertId || 0),
      teacherId,
      teacherName: row.teacherName,
      candidateAgentIds,
      status: row.status ?? 'open',
      resolution: row.resolution ?? null,
      resolutionRemark: row.resolutionRemark ?? null,
      resolvedBy: row.resolvedBy ?? null,
      resolvedTime: row.resolvedTime ?? null,
      currentAgentId,
      currentAgentName: row.currentAgentName || null,
      requestedAgentId,
      requestedAgentName: row.requestedAgentName || null,
      requestedById: row.requestedById ?? null,
    });
  }

  return {
    insertedAgents,
    insertedRelations,
    insertedAttributions,
    insertedConflicts,
    agentIdByName,
  };
}

async function replaceTeacherChannelAgentAuditData(seedRows) {
  const seedOperatorName = 'Stage2 Theme19 Seed';

  await connection.query(
    'DELETE FROM performance_teacher_agent_audit WHERE operatorName = ?',
    [seedOperatorName]
  );

  for (const row of seedRows) {
    await connection.query(
      `INSERT INTO performance_teacher_agent_audit
        (resourceType, resourceId, action, beforeSnapshot, afterSnapshot, operatorId, operatorName, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.resourceType,
        row.resourceId,
        row.action,
        row.beforeSnapshot ? JSON.stringify(row.beforeSnapshot) : null,
        row.afterSnapshot ? JSON.stringify(row.afterSnapshot) : null,
        row.operatorId,
        seedOperatorName,
        now(),
        now(),
      ]
    );
  }
}

async function ensureCourseTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
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
  // Performance schema is owned by formal migrations; seed only writes data.
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
        (courseId, employeeId, courseTitle, title, promptText, submissionText, status, latestScore, feedbackSummary, submittedAt, evaluatedAt, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.courseId,
        row.employeeId,
        row.courseTitle,
        row.title,
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

async function ensureOfficeCollabTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function replaceOfficeCollabRecords(seedRows) {
  await ensureOfficeCollabTable();
  const recordNos = seedRows.map(item => item.recordNo).filter(Boolean);

  if (recordNos.length) {
    await connection.query(
      'DELETE FROM performance_office_collab WHERE recordNo IN (?)',
      [recordNos]
    );
  }

  const inserted = [];

  for (const row of seedRows) {
    const [result] = await connection.query(
      `INSERT INTO performance_office_collab
        (moduleKey, recordNo, title, status, department, ownerName, assigneeName, category, priority, version, dueDate, eventDate, progressValue, scoreValue, relatedDocumentId, extJson, notes, createTime, updateTime, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.moduleKey,
        row.recordNo,
        row.title,
        row.status,
        row.department ?? null,
        row.ownerName ?? null,
        row.assigneeName ?? null,
        row.category ?? null,
        row.priority ?? null,
        row.version ?? null,
        row.dueDate ?? null,
        row.eventDate ?? null,
        row.progressValue ?? 0,
        row.scoreValue ?? 0,
        row.relatedDocumentId ?? null,
        JSON.stringify(row.extra || {}),
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
        (
          orderNo,
          title,
          supplierId,
          departmentId,
          requesterId,
          orderDate,
          expectedDeliveryDate,
          approvedBy,
          approvedAt,
          approvalRemark,
          closedReason,
          receivedQuantity,
          receivedAt,
          items,
          inquiryRecords,
          approvalLogs,
          receiptRecords,
          totalAmount,
          currency,
          remark,
          status,
          createTime,
          updateTime,
          tenantId
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        row.orderNo ?? null,
        row.title,
        row.supplierId,
        row.departmentId,
        row.requesterId,
        row.orderDate,
        row.expectedDeliveryDate ?? null,
        row.approvedBy ?? null,
        row.approvedAt ?? null,
        row.approvalRemark ?? null,
        row.closedReason ?? null,
        row.receivedQuantity ?? 0,
        row.receivedAt ?? null,
        serializeJsonValue(row.items ?? []),
        serializeJsonValue(row.inquiryRecords ?? []),
        serializeJsonValue(row.approvalLogs ?? []),
        serializeJsonValue(row.receiptRecords ?? []),
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
  // Performance schema is owned by formal migrations; seed only writes data.
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
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureGoalPlanTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureMeetingTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureTalentAssetTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureResumePoolTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureHiringTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureRecruitPlanTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureJobStandardTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureTeacherChannelTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureContractTable() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureOfficeKnowledgeTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureProcurementTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureAssetTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureFeedbackTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
}

async function ensureApprovalTables() {
  // Performance schema is owned by formal migrations; seed only writes data.
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
    await ensureGoalPlanTables();

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

    const adminUserId = await ensureUser({
      username: 'admin',
      name: '系统超管',
      nickName: '系统超管',
      departmentId: headquartersId,
      phone: 'stage2-admin-0001',
      email: 'stage2-admin-mailbox',
      remark: '阶段2联调-系统超管账号',
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
    const assetAdminUserId = await ensureUser({
      username: 'asset_admin',
      name: '资产管理员',
      nickName: '资产管理员',
      departmentId: headquartersId,
      phone: 'stage2-asset-0001',
      email: 'stage2-asset-mailbox',
      remark: '阶段2联调-资产管理员',
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
        '/performance/workbench',
        '/performance/work-plan',
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
        '/performance/office/annual-inspection',
        '/performance/office/honor',
        '/performance/office/publicity-material',
        '/performance/office/design-collab',
        '/performance/office/express-collab',
        '/performance/office/document-center',
        '/performance/office/knowledge-base',
        '/performance/office/vehicle',
        '/performance/office/intellectual-property',
        '/performance/talentAsset',
        '/performance/purchase-order',
        '/performance/purchase-inquiry',
        '/performance/purchase-approval',
        '/performance/purchase-execution',
        '/performance/purchase-receipt',
        '/performance/purchase-report',
        '/performance/supplier',
        '/performance/asset/dashboard',
        '/performance/asset/ledger',
        '/performance/asset/request',
        '/performance/asset/request-pending',
        '/performance/asset/assignment',
        '/performance/asset/maintenance',
        '/performance/asset/report',
        '/performance/asset/procurement',
        '/performance/asset/transfer',
        '/performance/asset/inventory',
        '/performance/asset/depreciation',
        '/performance/asset/disposal',
        '/performance/material/catalog',
        '/performance/material/stock',
        '/performance/material/inbound',
        '/performance/material/issue',
      ],
      perms: [
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:workPlan:page',
        'performance:workPlan:info',
        'performance:workPlan:add',
        'performance:workPlan:update',
        'performance:workPlan:delete',
        'performance:workPlan:start',
        'performance:workPlan:complete',
        'performance:workPlan:cancel',
        'performance:workPlan:sync',
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
        'performance:goal:opsManage',
        'performance:goal:opsGlobalScope',
        'performance:goal:opsAccessProfile',
        'performance:goal:opsDepartmentConfig',
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
        'performance:teacherAgent:page',
        'performance:teacherAgent:info',
        'performance:teacherAgent:add',
        'performance:teacherAgent:update',
        'performance:teacherAgent:updateStatus',
        'performance:teacherAgent:blacklist',
        'performance:teacherAgent:unblacklist',
        'performance:teacherAgentRelation:page',
        'performance:teacherAgentRelation:add',
        'performance:teacherAgentRelation:update',
        'performance:teacherAgentRelation:delete',
        'performance:teacherAttribution:page',
        'performance:teacherAttribution:info',
        'performance:teacherAttribution:assign',
        'performance:teacherAttribution:change',
        'performance:teacherAttribution:remove',
        'performance:teacherAttributionConflict:page',
        'performance:teacherAttributionConflict:info',
        'performance:teacherAttributionConflict:create',
        'performance:teacherAttributionConflict:resolve',
        'performance:teacherAgentAudit:page',
        'performance:teacherAgentAudit:info',
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
        'performance:hiring:all',
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
        'performance:annualInspection:page',
        'performance:annualInspection:info',
        'performance:annualInspection:stats',
        'performance:annualInspection:add',
        'performance:annualInspection:update',
        'performance:annualInspection:delete',
        'performance:honor:page',
        'performance:honor:info',
        'performance:honor:stats',
        'performance:honor:add',
        'performance:honor:update',
        'performance:honor:delete',
        'performance:publicityMaterial:page',
        'performance:publicityMaterial:info',
        'performance:publicityMaterial:stats',
        'performance:publicityMaterial:add',
        'performance:publicityMaterial:update',
        'performance:publicityMaterial:delete',
        'performance:designCollab:page',
        'performance:designCollab:info',
        'performance:designCollab:stats',
        'performance:designCollab:add',
        'performance:designCollab:update',
        'performance:designCollab:delete',
        'performance:expressCollab:page',
        'performance:expressCollab:info',
        'performance:expressCollab:stats',
        'performance:expressCollab:add',
        'performance:expressCollab:update',
        'performance:expressCollab:delete',
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
        'performance:vehicle:page',
        'performance:vehicle:info',
        'performance:vehicle:stats',
        'performance:vehicle:add',
        'performance:vehicle:update',
        'performance:vehicle:delete',
        'performance:intellectualProperty:page',
        'performance:intellectualProperty:info',
        'performance:intellectualProperty:stats',
        'performance:intellectualProperty:add',
        'performance:intellectualProperty:update',
        'performance:intellectualProperty:delete',
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:info',
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
        'performance:purchaseOrder:delete',
        'performance:purchaseOrder:submitInquiry',
        'performance:purchaseOrder:submitApproval',
        'performance:purchaseOrder:approve',
        'performance:purchaseOrder:reject',
        'performance:purchaseOrder:receive',
        'performance:purchaseOrder:close',
        'performance:purchaseReport:summary',
        'performance:purchaseReport:trend',
        'performance:purchaseReport:supplierStats',
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
        'performance:materialCatalog:page',
        'performance:materialCatalog:info',
        'performance:materialCatalog:add',
        'performance:materialCatalog:update',
        'performance:materialCatalog:updateStatus',
        'performance:materialCatalog:delete',
        'performance:materialStock:page',
        'performance:materialStock:info',
        'performance:materialStock:summary',
        'performance:materialInbound:page',
        'performance:materialInbound:info',
        'performance:materialInbound:add',
        'performance:materialInbound:update',
        'performance:materialInbound:submit',
        'performance:materialInbound:receive',
        'performance:materialInbound:cancel',
        'performance:materialIssue:page',
        'performance:materialIssue:info',
        'performance:materialIssue:add',
        'performance:materialIssue:update',
        'performance:materialIssue:submit',
        'performance:materialIssue:issue',
        'performance:materialIssue:cancel',
        'performance:talentAsset:page',
        'performance:talentAsset:info',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
        'performance:talentAsset:delete',
      ],
    });
    const assetAdminMenuIds = await collectMenuIds({
      routers: [
        '/performance/pending',
        '/performance/asset/dashboard',
        '/performance/asset/ledger',
        '/performance/asset/request-pending',
        '/performance/asset/assignment',
      ],
      perms: [
        'performance:approvalFlow:info',
        'performance:approvalFlow:approve',
        'performance:approvalFlow:reject',
        'performance:approvalFlow:transfer',
        'performance:approvalFlow:remind',
        'performance:assetDashboard:summary',
        'performance:assetInfo:page',
        'performance:assetInfo:info',
        'performance:assetAssignmentRequest:page',
        'performance:assetAssignmentRequest:info',
        'performance:assetAssignmentRequest:assign',
        'performance:assetAssignment:page',
        'performance:assetAssignment:add',
        'performance:assetAssignment:update',
        'performance:assetAssignment:return',
      ],
    });
    const managerMenuIds = await collectMenuIds({
      routers: [
        '/data-center/dashboard',
        '/performance/workbench',
        '/performance/work-plan',
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
        '/performance/purchase-inquiry',
        '/performance/purchase-approval',
        '/performance/purchase-execution',
        '/performance/purchase-receipt',
        '/performance/purchase-report',
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
        'performance:workPlan:page',
        'performance:workPlan:info',
        'performance:workPlan:add',
        'performance:workPlan:update',
        'performance:workPlan:delete',
        'performance:workPlan:start',
        'performance:workPlan:complete',
        'performance:workPlan:cancel',
        'performance:workPlan:sync',
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
        'performance:goal:opsManage',
        'performance:goal:opsAccessProfile',
        'performance:goal:opsDepartmentConfig',
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
        'performance:teacherAgent:page',
        'performance:teacherAgent:info',
        'performance:teacherAgent:add',
        'performance:teacherAgent:update',
        'performance:teacherAgent:updateStatus',
        'performance:teacherAgent:blacklist',
        'performance:teacherAgent:unblacklist',
        'performance:teacherAgentRelation:page',
        'performance:teacherAgentRelation:add',
        'performance:teacherAgentRelation:update',
        'performance:teacherAgentRelation:delete',
        'performance:teacherAttribution:page',
        'performance:teacherAttribution:info',
        'performance:teacherAttribution:assign',
        'performance:teacherAttribution:change',
        'performance:teacherAttribution:remove',
        'performance:teacherAttributionConflict:page',
        'performance:teacherAttributionConflict:info',
        'performance:teacherAttributionConflict:create',
        'performance:teacherAttributionConflict:resolve',
        'performance:teacherAgentAudit:page',
        'performance:teacherAgentAudit:info',
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
        'performance:purchaseOrder:submitInquiry',
        'performance:purchaseOrder:submitApproval',
        'performance:purchaseOrder:approve',
        'performance:purchaseOrder:reject',
        'performance:purchaseOrder:receive',
        'performance:purchaseOrder:close',
        'performance:purchaseReport:summary',
        'performance:purchaseReport:trend',
        'performance:purchaseReport:supplierStats',
        'performance:supplier:page',
        'performance:supplier:info',
        'performance:assetDashboard:summary',
        'performance:assetInfo:page',
        'performance:assetInfo:info',
        'performance:assetAssignmentRequest:page',
        'performance:assetAssignmentRequest:info',
        'performance:assetAssignmentRequest:add',
        'performance:assetAssignmentRequest:update',
        'performance:assetAssignmentRequest:submit',
        'performance:assetAssignmentRequest:withdraw',
        'performance:assetAssignmentRequest:assign',
        'performance:assetAssignmentRequest:cancel',
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
        '/performance/workbench',
        '/performance/work-plan',
        '/performance/my-assessment',
        '/performance/goals',
        '/performance/feedback',
        '/performance/course-learning',
        '/performance/asset/request',
        '/performance/teacher-channel/dashboard',
        '/performance/teacher-channel/teacher',
        '/performance/teacher-channel/todo',
        '/performance/teacher-channel/class',
      ],
      perms: [
        'performance:workPlan:page',
        'performance:workPlan:info',
        'performance:workPlan:start',
        'performance:workPlan:complete',
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:update',
        'performance:assessment:submit',
        'performance:approvalFlow:info',
        'performance:approvalFlow:withdraw',
        'performance:approvalFlow:remind',
        'performance:assetAssignmentRequest:page',
        'performance:assetAssignmentRequest:info',
        'performance:assetAssignmentRequest:add',
        'performance:assetAssignmentRequest:update',
        'performance:assetAssignmentRequest:submit',
        'performance:assetAssignmentRequest:withdraw',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
        'performance:goal:opsAccessProfile',
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
        'performance:teacherAgent:page',
        'performance:teacherAgent:info',
        'performance:teacherAgentRelation:page',
        'performance:teacherAttribution:page',
        'performance:teacherAttribution:info',
        'performance:teacherAttribution:assign',
        'performance:teacherAttribution:change',
        'performance:teacherAttributionConflict:page',
        'performance:teacherAttributionConflict:info',
        'performance:teacherAgentAudit:page',
        'performance:teacherAgentAudit:info',
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
        'performance:teacherAgent:page',
        'performance:teacherAgent:info',
        'performance:teacherAgentRelation:page',
        'performance:teacherAttribution:page',
        'performance:teacherAttribution:info',
        'performance:teacherAttributionConflict:page',
        'performance:teacherAttributionConflict:info',
        'performance:teacherAgentAudit:page',
        'performance:teacherAgentAudit:info',
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
    const superAdminMenuIds = await listAllMenuIds();
    const superAdminDepartmentIds = await listAllDepartmentIds();

    const superAdminRoleId = await ensureRole({
      name: '系统超管',
      label: 'system_root',
      remark: '阶段2联调-系统超管角色',
      menuIds: superAdminMenuIds,
      departmentIds: superAdminDepartmentIds,
      isSuperAdmin: true,
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
    const assetAdminRoleId = await ensureRole({
      name: '绩效资产管理员',
      label: 'performance_asset_admin',
      remark: '阶段2联调-资产管理员',
      menuIds: assetAdminMenuIds,
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

    await replaceUserRoles(adminUserId, [superAdminRoleId]);
    await replaceUserRoles(hrUserId, [hrRoleId]);
    await replaceUserRoles(assetAdminUserId, [assetAdminRoleId]);
    await replaceUserRoles(managerUserId, [managerRoleId]);
    await replaceUserRoles(employeeUserId, [employeeRoleId]);
    await replaceUserRoles(feedbackUserId, [feedbackRoleId]);
    await replaceUserRoles(salesEmployeeUserId, [employeeRoleId]);
    await replaceUserRoles(readonlyTeacherUserId, [readonlyTeacherRoleId]);

    await upsertApprovalConfig({
      objectType: 'assetAssignmentRequest',
      version: 'theme20-asset-request-v1',
      enabled: true,
      nodes: [
        {
          nodeOrder: 1,
          nodeCode: 'department-manager-review',
          nodeName: '部门负责人审批',
          resolverType: 'applicant_direct_manager',
          resolverValue: null,
          timeoutHours: 24,
          allowTransfer: true,
        },
        {
          nodeOrder: 2,
          nodeCode: 'asset-admin-confirm',
          nodeName: '资产管理员确认',
          resolverType: 'specified_user',
          resolverValue: String(assetAdminUserId),
          timeoutHours: 24,
          allowTransfer: true,
        },
        {
          nodeOrder: 3,
          nodeCode: 'management-confirm',
          nodeName: '管理层确认',
          resolverType: 'specified_user',
          resolverValue: String(adminUserId),
          timeoutHours: 24,
          allowTransfer: true,
        },
      ],
    });

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

    await replaceOfficeCollabRecords([
      {
        moduleKey: 'annualInspection',
        recordNo: 'PMS-T22-NJ-001',
        title: '联调-主题22-消防设施年检材料',
        status: 'preparing',
        department: '行政部',
        ownerName: '主题22-HR管理员',
        category: 'safety',
        version: 'V1.2',
        dueDate: '2026-12-20',
        progressValue: 78,
        extra: {
          reminderDays: 15,
        },
        notes: '主题22联调-年检材料样例',
      },
      {
        moduleKey: 'honor',
        recordNo: 'PMS-T22-RY-001',
        title: '联调-主题22-市级优秀校区荣誉',
        status: 'published',
        department: '校区运营中心',
        ownerName: '主题22-校区团队',
        eventDate: '2026-04-18',
        scoreValue: 91,
        extra: {
          honorType: 'team',
          level: 'city',
          issuer: '上海市教委',
          evidenceUrl: null,
        },
        notes: '主题22联调-荣誉管理样例',
      },
      {
        moduleKey: 'publicityMaterial',
        recordNo: 'PMS-T22-XC-001',
        title: '联调-主题22-春招宣传海报',
        status: 'review',
        ownerName: '主题22-HR管理员',
        assigneeName: '主题22-设计负责人',
        eventDate: '2026-04-22',
        scoreValue: 256,
        relatedDocumentId: documentCenterIdMap.get('PMS-DOC-21-POLICY-001') ?? null,
        extra: {
          materialType: 'poster',
          channel: 'wechat',
          downloads: 18,
        },
        notes: '主题22联调-宣传资料样例',
      },
      {
        moduleKey: 'designCollab',
        recordNo: 'PMS-T22-MG-001',
        title: '联调-主题22-招生物料设计协同',
        status: 'in_progress',
        ownerName: '主题22-市场中心',
        assigneeName: '主题22-视觉设计师',
        priority: 'high',
        dueDate: '2026-05-12',
        progressValue: 64,
        extra: {
          workload: 3,
          relatedMaterialNo: 'PMS-T22-XC-001',
        },
        notes: '主题22联调-美工协同样例',
      },
      {
        moduleKey: 'expressCollab',
        recordNo: 'PMS-T22-KD-001',
        title: '联调-主题22-校区资料快递协同',
        status: 'in_transit',
        ownerName: '主题22-行政专员',
        assigneeName: '主题22-杭州校区',
        category: '顺丰',
        dueDate: '2026-04-28',
        eventDate: '2026-04-19 10:30:00',
        extra: {
          orderNo: 'PMS-T22-EXP-001',
          courierCompany: '顺丰',
          serviceLevel: 'express',
          origin: '上海总部',
          destination: '杭州校区',
          sourceSystem: 'manual',
          syncStatus: 'pending',
          lastEvent: '已揽收',
        },
        notes: '主题22联调-快递协同样例',
      },
    ]);

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

    const seededPurchaseOrders = await replacePurchaseOrders([
      {
        orderNo: 'PMS-PO-DRAFT-001',
        title: '联调-主题11平台草稿采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-ACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-20',
        expectedDeliveryDate: '2026-05-28',
        items: [
          {
            itemName: '云主机扩容',
            quantity: 3,
            unitPrice: 4296.17,
            amount: 12888.5,
          },
        ],
        totalAmount: 12888.5,
        currency: 'CNY',
        remark: '主题11联调-草稿采购单，可删除',
        status: 'draft',
      },
      {
        orderNo: 'PMS-PO-INQUIRING-001',
        title: '联调-主题11平台询价采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-ACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-18',
        expectedDeliveryDate: '2026-05-30',
        items: [
          {
            itemName: '询价带宽扩容',
            quantity: 2,
            unitPrice: 4600,
            amount: 9200,
          },
        ],
        inquiryRecords: [
          {
            round: 1,
            supplierName: '联调-主题11平台云服务商',
            quotedAmount: 9200,
            quotedAt: '2026-05-18 14:00:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
          },
        ],
        totalAmount: 9200,
        currency: 'CNY',
        remark: '主题11联调-询价中样例',
        status: 'inquiring',
      },
      {
        orderNo: 'PMS-PO-PENDING-001',
        title: '联调-主题11待审批采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-ACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-17',
        expectedDeliveryDate: '2026-05-29',
        items: [
          {
            itemName: '审批前服务器采购',
            quantity: 4,
            unitPrice: 5250,
            amount: 21000,
          },
        ],
        inquiryRecords: [
          {
            round: 1,
            supplierName: '联调-主题11平台云服务商',
            quotedAmount: 21000,
            quotedAt: '2026-05-17 16:30:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
          },
        ],
        totalAmount: 21000,
        currency: 'CNY',
        remark: '主题11联调-待审批样例',
        status: 'pendingApproval',
      },
      {
        orderNo: 'PMS-PO-APPROVED-001',
        title: '联调-主题11已审批采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-ACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-16',
        expectedDeliveryDate: '2026-05-27',
        approvedBy: hrUserId,
        approvedAt: '2026-05-16 18:00:00',
        approvalRemark: '预算已核定，同意采购。',
        items: [
          {
            itemName: '数据库许可证',
            quantity: 5,
            unitPrice: 3000,
            amount: 15000,
          },
        ],
        inquiryRecords: [
          {
            round: 1,
            supplierName: '联调-主题11平台云服务商',
            quotedAmount: 15000,
            quotedAt: '2026-05-16 11:00:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
          },
        ],
        approvalLogs: [
          {
            decision: 'approved',
            remark: '预算已核定，同意采购。',
            operatorId: hrUserId,
            operatorName: 'HR管理员',
            operatedAt: '2026-05-16 18:00:00',
          },
        ],
        totalAmount: 15000,
        currency: 'CNY',
        remark: '主题11联调-已审批样例',
        status: 'approved',
      },
      {
        orderNo: 'PMS-PO-RECEIVED-001',
        title: '联调-主题11已收货采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-ACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-15',
        expectedDeliveryDate: '2026-05-26',
        approvedBy: hrUserId,
        approvedAt: '2026-05-15 15:20:00',
        approvalRemark: '分批收货，允许入场。',
        receivedQuantity: 6,
        receivedAt: '2026-05-19 10:00:00',
        items: [
          {
            itemName: '办公终端',
            quantity: 6,
            unitPrice: 1800,
            amount: 10800,
          },
        ],
        inquiryRecords: [
          {
            round: 1,
            supplierName: '联调-主题11平台云服务商',
            quotedAmount: 10800,
            quotedAt: '2026-05-15 10:30:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
          },
        ],
        approvalLogs: [
          {
            decision: 'approved',
            remark: '同意收货。',
            operatorId: hrUserId,
            operatorName: 'HR管理员',
            operatedAt: '2026-05-15 15:20:00',
          },
        ],
        receiptRecords: [
          {
            receivedQuantity: 6,
            receivedAt: '2026-05-19 10:00:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
            remark: '首批到货验收完成。',
          },
        ],
        totalAmount: 10800,
        currency: 'CNY',
        remark: '主题11联调-已收货样例',
        status: 'received',
      },
      {
        orderNo: 'PMS-PO-CLOSED-001',
        title: '联调-主题11已关闭采购单',
        supplierId: supplierByCode.get('联调-主题11咨询供应商').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-12',
        expectedDeliveryDate: '2026-05-22',
        approvedBy: hrUserId,
        approvedAt: '2026-05-13 09:00:00',
        approvalRemark: '项目结项前补充采购。',
        closedReason: '项目已验收，采购执行完成。',
        receivedQuantity: 1,
        receivedAt: '2026-05-18 17:30:00',
        items: [
          {
            itemName: '咨询交付包',
            quantity: 1,
            unitPrice: 9800,
            amount: 9800,
          },
        ],
        inquiryRecords: [
          {
            round: 1,
            supplierName: '联调-主题11咨询供应商',
            quotedAmount: 9800,
            quotedAt: '2026-05-12 14:00:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
          },
        ],
        approvalLogs: [
          {
            decision: 'approved',
            remark: '项目结项前补充采购。',
            operatorId: hrUserId,
            operatorName: 'HR管理员',
            operatedAt: '2026-05-13 09:00:00',
          },
        ],
        receiptRecords: [
          {
            receivedQuantity: 1,
            receivedAt: '2026-05-18 17:30:00',
            operatorId: managerUserId,
            operatorName: '研发经理',
            remark: '咨询材料已验收并归档。',
          },
        ],
        totalAmount: 9800,
        currency: 'CNY',
        remark: '主题11联调-已关闭样例',
        status: 'closed',
      },
      {
        orderNo: 'PMS-PO-ACTIVE-LEGACY-001',
        title: '联调-主题11兼容生效采购单',
        supplierId: supplierByCode.get('PMS-SUPPLIER-INACTIVE-001').id,
        departmentId: platformGroupId,
        requesterId: managerUserId,
        orderDate: '2026-05-18',
        expectedDeliveryDate: '2026-05-31',
        items: [
          {
            itemName: '遗留兼容硬件采购',
            quantity: 2,
            unitPrice: 17800,
            amount: 35600,
          },
        ],
        totalAmount: 35600,
        currency: 'CNY',
        remark: '主题11联调-兼容现有 supplier delete guard 的 legacy active 样例',
        status: 'active',
      },
      {
        orderNo: 'PMS-PO-CANCELLED-001',
        title: '联调-主题11销售取消采购单',
        supplierId: supplierByCode.get('联调-主题11咨询供应商').id,
        departmentId: salesCenterId,
        requesterId: salesEmployeeUserId,
        orderDate: '2026-05-10',
        expectedDeliveryDate: '2026-05-19',
        items: [
          {
            itemName: '跨部门咨询采购',
            quantity: 1,
            unitPrice: 8888,
            amount: 8888,
          },
        ],
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

    const seededTeacherRows = await replaceTeacherChannelData([
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

    const teacherChannelAgentSeed = await replaceTeacherChannelAgentData({
      seededTeachers: seededTeacherRows,
      seedAgents: [
        {
          name: '联调-主题19平台直营渠道',
          agentType: 'direct',
          level: 'L0',
          region: '上海',
          cooperationStatus: 'partnered',
          status: 'active',
          blacklistStatus: 'normal',
          remark: '主题19 V0.2 联调-直营渠道样例',
          ownerEmployeeId: managerUserId,
          ownerDepartmentId: platformGroupId,
        },
        {
          name: '联调-主题19平台一级代理',
          agentType: 'institution',
          level: 'L1',
          region: '上海',
          cooperationStatus: 'partnered',
          status: 'active',
          blacklistStatus: 'normal',
          remark: '主题19 V0.2 联调-一级代理样例',
          ownerEmployeeId: managerUserId,
          ownerDepartmentId: platformGroupId,
        },
        {
          name: '联调-主题19平台二级代理',
          agentType: 'individual',
          level: 'L2',
          region: '上海',
          cooperationStatus: 'negotiating',
          status: 'active',
          blacklistStatus: 'normal',
          remark: '主题19 V0.2 联调-二级代理样例',
          ownerEmployeeId: employeeUserId,
          ownerDepartmentId: platformGroupId,
        },
        {
          name: '联调-主题19销售代理',
          agentType: 'institution',
          level: 'L1',
          region: '杭州',
          cooperationStatus: 'partnered',
          status: 'active',
          blacklistStatus: 'normal',
          remark: '主题19 V0.2 联调-跨部门隐藏代理样例',
          ownerEmployeeId: salesEmployeeUserId,
          ownerDepartmentId: salesCenterId,
        },
      ],
      seedRelations: [
        {
          parentAgentName: '联调-主题19平台一级代理',
          childAgentName: '联调-主题19平台二级代理',
          status: 'active',
          effectiveTime: followYesterday,
          remark: '主题19 V0.2 联调-平台代理树样例',
          ownerEmployeeId: managerUserId,
          ownerDepartmentId: platformGroupId,
        },
      ],
      seedAttributions: [
        {
          teacherName: '联调-主题19平台已合作班主任',
          agentName: '联调-主题19平台一级代理',
          attributionType: 'agent',
          status: 'active',
          sourceType: 'assign',
          sourceRemark: '主题19 V0.2 联调-已合作班主任归因样例',
          effectiveTime: followToday,
          operatorId: managerUserId,
          operatorName: '研发经理',
        },
        {
          teacherName: '联调-主题19销售隐藏班主任',
          agentName: '联调-主题19销售代理',
          attributionType: 'agent',
          status: 'active',
          sourceType: 'assign',
          sourceRemark: '主题19 V0.2 联调-跨部门隐藏归因样例',
          effectiveTime: followToday,
          operatorId: salesEmployeeUserId,
          operatorName: '销售员工',
        },
      ],
      seedConflicts: [
        {
          teacherName: '联调-主题19平台逾期待跟进班主任',
          candidateAgentNames: ['联调-主题19平台一级代理', '联调-主题19平台二级代理'],
          status: 'open',
          resolution: null,
          resolutionRemark: '主题19 V0.2 联调-待处理归因冲突样例',
          currentAgentName: '联调-主题19平台一级代理',
          requestedAgentName: '联调-主题19平台二级代理',
          requestedById: employeeUserId,
        },
      ],
    });

    await replaceTeacherChannelAgentAuditData(
      [
        {
          resourceType: 'teacherAgent',
          resourceId: teacherChannelAgentSeed.insertedAgents[1]?.id,
          action: 'seed',
          operatorId: hrUserId,
          beforeSnapshot: null,
          afterSnapshot: {
            name: '联调-主题19平台一级代理',
            status: 'active',
          },
        },
        {
          resourceType: 'teacherAgentRelation',
          resourceId: teacherChannelAgentSeed.insertedRelations[0]?.id,
          action: 'seed',
          operatorId: hrUserId,
          beforeSnapshot: null,
          afterSnapshot: {
            parentAgentName: '联调-主题19平台一级代理',
            childAgentName: '联调-主题19平台二级代理',
          },
        },
        {
          resourceType: 'teacherAttribution',
          resourceId: teacherChannelAgentSeed.insertedAttributions[0]?.id,
          action: 'seed',
          operatorId: hrUserId,
          beforeSnapshot: null,
          afterSnapshot: {
            teacherName: '联调-主题19平台已合作班主任',
            agentName: '联调-主题19平台一级代理',
          },
        },
        {
          resourceType: 'teacherAttributionConflict',
          resourceId: teacherChannelAgentSeed.insertedConflicts[0]?.id,
          action: 'seed',
          operatorId: hrUserId,
          beforeSnapshot: null,
          afterSnapshot: {
            teacherName: '联调-主题19平台逾期待跟进班主任',
            status: 'open',
          },
        },
      ].filter(item => Number(item.resourceId || 0) > 0)
    );

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

    const goalPlanSmokeDate = '2026-04-19';
    await replaceGoalOpsSeed({
      configs: [
        {
          departmentId: platformGroupId,
          assignTime: '09:15',
          submitDeadline: '18:00',
          reportSendTime: '18:30',
          reportPushMode: 'system_and_group',
          reportPushTarget: 'goal-plan-stage2-group',
          updatedBy: managerUserId,
        },
      ],
      plans: [],
      reports: [],
    });

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

    const purchaseOrderByNo = new Map(
      seededPurchaseOrders.map(item => [item.orderNo || item.title, item])
    );

    seedMeta = await syncStage2RuntimeMeta({
      goalPlanSmokeDate,
      goalPlanDepartmentId: Number(platformGroupId || 0),
      goalPlanManagerUserId: Number(managerUserId || 0),
      goalPlanEmployeeUserId: Number(employeeUserId || 0),
      recruitPlanImportSpaceId,
      recruitPlanImportSpaceName: 'stage2-theme16-recruit-plan-import-template.xlsx',
      theme11SupplierInfoId: Number(supplierByCode.get('PMS-SUPPLIER-ACTIVE-001')?.id || 0),
      theme11PurchaseOrderInfoId: Number(
        purchaseOrderByNo.get('PMS-PO-APPROVED-001')?.id || 0
      ),
      theme11ProtectedOrderDeleteId: Number(
        purchaseOrderByNo.get('PMS-PO-APPROVED-001')?.id || 0
      ),
      theme11ReferencedSupplierDeleteId: Number(
        supplierByCode.get('PMS-SUPPLIER-INACTIVE-001')?.id || 0
      ),
      theme11InquiryOrderId: Number(
        purchaseOrderByNo.get('PMS-PO-INQUIRING-001')?.id || 0
      ),
      theme11PendingApprovalOrderId: Number(
        purchaseOrderByNo.get('PMS-PO-PENDING-001')?.id || 0
      ),
      theme11ApprovedOrderId: Number(
        purchaseOrderByNo.get('PMS-PO-APPROVED-001')?.id || 0
      ),
      theme11ReceivedOrderId: Number(
        purchaseOrderByNo.get('PMS-PO-RECEIVED-001')?.id || 0
      ),
      theme11ClosedOrderId: Number(
        purchaseOrderByNo.get('PMS-PO-CLOSED-001')?.id || 0
      ),
      theme11ProcurementSampleDepartmentId: Number(platformGroupId || 0),
    });

    await connection.commit();

    console.log('Stage-2 performance seed completed for modules 1/2/4/5/6/7/8/9 baseline.');
    console.log('Accounts: admin, hr_admin, asset_admin, manager_rd, employee_platform, feedback_peer, employee_sales, readonly_teacher');
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
