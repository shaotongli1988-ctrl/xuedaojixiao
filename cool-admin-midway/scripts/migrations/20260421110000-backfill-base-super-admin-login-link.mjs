/**
 * Backfills the super-admin runtime link for environments that already have an admin user.
 * This migration only reconciles an existing admin account to a super-admin role and the related approval pointer.
 * Maintenance pitfall: keep the change additive and persist rollback state so down() never guesses what to undo.
 */

export const migrationId = '20260421110000';
export const migrationName = 'backfill-base-super-admin-login-link';

const migrationStateTableName = 'cool_schema_migration_state';

async function hasTable(connection, tableName) {
  const [rows] = await connection.query(
    `
      SELECT COUNT(1) AS total
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName]
  );

  return Number(rows?.[0]?.total || 0) > 0;
}

async function queryOne(connection, sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function nowTime() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function ensureMigrationStateTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`${migrationStateTableName}\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
      \`migrationId\` varchar(32) NOT NULL COMMENT '迁移编号',
      \`payload\` longtext NOT NULL COMMENT '回滚状态',
      \`createTime\` varchar(19) NOT NULL COMMENT '创建时间',
      \`updateTime\` varchar(19) NOT NULL COMMENT '更新时间',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_cool_schema_migration_state_id\` (\`migrationId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='迁移回滚状态';
  `);
}

async function loadMigrationState(connection) {
  if (!(await hasTable(connection, migrationStateTableName))) {
    return null;
  }

  const row = await queryOne(
    connection,
    `SELECT id, payload FROM \`${migrationStateTableName}\` WHERE migrationId = ? LIMIT 1`,
    [migrationId]
  );

  if (!row?.payload) {
    return null;
  }

  return {
    id: row.id,
    payload: JSON.parse(String(row.payload)),
  };
}

async function saveMigrationState(connection, payload) {
  await ensureMigrationStateTable(connection);

  const existing = await queryOne(
    connection,
    `SELECT id FROM \`${migrationStateTableName}\` WHERE migrationId = ? LIMIT 1`,
    [migrationId]
  );

  if (existing?.id) {
    await connection.query(
      `
        UPDATE \`${migrationStateTableName}\`
        SET payload = ?,
            updateTime = ?
        WHERE id = ?
      `,
      [JSON.stringify(payload), nowTime(), existing.id]
    );
    return existing.id;
  }

  const currentTime = nowTime();
  const [result] = await connection.query(
    `
      INSERT INTO \`${migrationStateTableName}\`
        (migrationId, payload, createTime, updateTime)
      VALUES (?, ?, ?, ?)
    `,
    [migrationId, JSON.stringify(payload), currentTime, currentTime]
  );

  return result.insertId;
}

async function clearMigrationState(connection) {
  if (!(await hasTable(connection, migrationStateTableName))) {
    return;
  }

  await connection.query(
    `DELETE FROM \`${migrationStateTableName}\` WHERE migrationId = ?`,
    [migrationId]
  );
}

export async function up(connection) {
  const requiredTables = [
    'base_sys_user',
    'base_sys_role',
    'base_sys_user_role',
  ];
  for (const tableName of requiredTables) {
    if (!(await hasTable(connection, tableName))) {
      return;
    }
  }

  const adminUser = await queryOne(
    connection,
    'SELECT id FROM base_sys_user WHERE username = ? LIMIT 1',
    ['admin']
  );
  if (!adminUser?.id) {
    return;
  }

  await ensureMigrationStateTable(connection);
  await connection.beginTransaction?.();

  try {
    const state = {};
    let superAdminRole = await queryOne(
      connection,
      `
        SELECT id, label, isSuperAdmin
        FROM base_sys_role
        WHERE isSuperAdmin = 1
           OR label IN ('system_root', 'admin')
        ORDER BY isSuperAdmin DESC, id ASC
        LIMIT 1
      `
    );

    if (!superAdminRole?.id) {
      const [result] = await connection.query(
        `
          INSERT INTO base_sys_role
            (userId, name, label, isSuperAdmin, remark, relevance, menuIdList, departmentIdList, createTime, updateTime, tenantId)
          VALUES
            ('1', '系统超管', 'system_root', 1, 'super admin login backfill', 1, '[]', '[]', NOW(), NOW(), NULL)
        `
      );
      superAdminRole = {
        id: result.insertId,
        label: 'system_root',
        isSuperAdmin: 1,
      };
      state.createdRoleId = result.insertId;
    } else if (Number(superAdminRole.isSuperAdmin || 0) !== 1) {
      await connection.query(
        `
          UPDATE base_sys_role
          SET isSuperAdmin = 1,
              updateTime = NOW()
          WHERE id = ?
        `,
        [superAdminRole.id]
      );
      state.promotedRoleId = superAdminRole.id;
    }

    const existingUserRole = await queryOne(
      connection,
      'SELECT id FROM base_sys_user_role WHERE userId = ? AND roleId = ? LIMIT 1',
      [adminUser.id, superAdminRole.id]
    );
    if (!existingUserRole?.id) {
      const [result] = await connection.query(
        `
          INSERT INTO base_sys_user_role (userId, roleId, createTime, updateTime, tenantId)
          VALUES (?, ?, NOW(), NOW(), NULL)
        `,
        [adminUser.id, superAdminRole.id]
      );
      state.insertedUserRoleId = result.insertId;
    }

    if (
      (await hasTable(connection, 'performance_approval_config')) &&
      (await hasTable(connection, 'performance_approval_config_node'))
    ) {
      const approvalConfig = await queryOne(
        connection,
        `
          SELECT id
          FROM performance_approval_config
          WHERE objectType = 'assetAssignmentRequest'
          LIMIT 1
        `
      );

      if (approvalConfig?.id) {
        const approvalNode = await queryOne(
          connection,
          `
            SELECT id, resolverValue
            FROM performance_approval_config_node
            WHERE configId = ?
              AND nodeCode = 'management-confirm'
            LIMIT 1
          `,
          [approvalConfig.id]
        );

        if (
          approvalNode?.id &&
          String(approvalNode.resolverValue ?? '') !== String(adminUser.id)
        ) {
          await connection.query(
            `
              UPDATE performance_approval_config_node
              SET resolverValue = ?,
                  updateTime = NOW()
              WHERE id = ?
            `,
            [String(adminUser.id), approvalNode.id]
          );
          state.approvalNodeId = approvalNode.id;
          state.previousApprovalResolverValue =
            approvalNode.resolverValue == null
              ? null
              : String(approvalNode.resolverValue);
        }
      }
    }

    if (Object.keys(state).length > 0) {
      await saveMigrationState(connection, state);
    }
    await connection.commit?.();
  } catch (error) {
    await connection.rollback?.();
    throw error;
  }
}

export async function down(connection) {
  const migrationState = await loadMigrationState(connection);
  if (!migrationState?.payload) {
    return;
  }

  const state = migrationState.payload;
  await connection.beginTransaction?.();

  try {
    if (state.approvalNodeId != null) {
      await connection.query(
        `
          UPDATE performance_approval_config_node
          SET resolverValue = ?,
              updateTime = NOW()
          WHERE id = ?
        `,
        [state.previousApprovalResolverValue, state.approvalNodeId]
      );
    }

    if (state.insertedUserRoleId != null) {
      await connection.query(
        'DELETE FROM base_sys_user_role WHERE id = ?',
        [state.insertedUserRoleId]
      );
    }

    if (state.createdRoleId != null) {
      await connection.query(
        'DELETE FROM base_sys_role WHERE id = ?',
        [state.createdRoleId]
      );
    } else if (state.promotedRoleId != null) {
      await connection.query(
        `
          UPDATE base_sys_role
          SET isSuperAdmin = 0,
              updateTime = NOW()
          WHERE id = ?
        `,
        [state.promotedRoleId]
      );
    }

    await clearMigrationState(connection);
    await connection.commit?.();
  } catch (error) {
    await connection.rollback?.();
    throw error;
  }
}
