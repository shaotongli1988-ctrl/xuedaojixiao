/**
 * Seeds stage-2 integration data for performance modules 1, 2, 4, 5, 6, 7, 8, and dashboard aggregation.
 * This file only prepares local menu, role, user, and sample business data for联调.
 * It does not replace the project's general initialization flow or production release scripts.
 * Maintenance pitfall: dashboard权限、模块 4/5/6/7/8 样例和 menu.json 必须一起维护，否则 smoke 断言会和 seed 脱节。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

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
  await connection.beginTransaction();

  try {
    await syncMenuTree(loadStage2PerformanceMenus());
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

    const hrMenuIds = await collectMenuIds({
      routers: [
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
      ],
      perms: [
        'performance:dashboard:summary',
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
      ],
    });
    const managerMenuIds = await collectMenuIds({
      routers: [
        '/data-center/dashboard',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/feedback',
        '/performance/suggestion',
        '/performance/pip',
        '/performance/promotion',
      ],
      perms: [
        'performance:dashboard:summary',
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
      ],
    });
    const employeeMenuIds = await collectMenuIds({
      routers: ['/performance/my-assessment', '/performance/goals', '/performance/feedback'],
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

    await replaceUserRoles(hrUserId, [hrRoleId]);
    await replaceUserRoles(managerUserId, [managerRoleId]);
    await replaceUserRoles(employeeUserId, [employeeRoleId]);
    await replaceUserRoles(feedbackUserId, [feedbackRoleId]);
    await replaceUserRoles(salesEmployeeUserId, [employeeRoleId]);

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

    await connection.commit();

    console.log('Stage-2 performance seed completed for modules 1/2/4/5/6/7/8 baseline.');
    console.log('Accounts: admin, hr_admin, manager_rd, employee_platform, feedback_peer, employee_sales');
    console.log('Password: 123456');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

await main();
