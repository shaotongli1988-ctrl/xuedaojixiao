#!/usr/bin/env node
/**
 * 收敛 performance 域遗留 service 的权限上下文读取方式。
 * 这里只统一 currentCtx/currentAdmin/currentPerms/permissionMask/departmentIds 的事实源入口，
 * 不负责替业务模块自动猜 capability/scope/state 语义。
 * 维护重点是批量改写必须保持兼容，且后续能用 --check 持续阻断回退到分散鉴权实现。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const serviceDir = path.join(
  repoRoot,
  'cool-admin-midway',
  'src',
  'modules',
  'performance',
  'service'
);
const frontendPerformanceDir = path.join(
  repoRoot,
  'cool-admin-vue',
  'src',
  'modules',
  'performance'
);
const coolUniDir = path.join(repoRoot, 'cool-uni');

const excludedFiles = new Set([
  'access-context.ts',
  'cross-dashboard-source-adapter.ts',
]);

const helperImportBlock = `import {
  hasPerformanceLegacyPermission,
  resolvePerformanceCurrentAdmin,
  resolvePerformanceLegacyDepartmentIds,
  resolvePerformanceLegacyPerms,
  resolvePerformanceRuntimeContext,
} from './access-context';
`;

function usage() {
  console.log(
    [
      'Usage:',
      '  node scripts/rollout-performance-role-ssot.mjs --report',
      '  node scripts/rollout-performance-role-ssot.mjs --stage2-report',
      '  node scripts/rollout-performance-role-ssot.mjs --frontend-report',
      '  node scripts/rollout-performance-role-ssot.mjs --write',
      '  node scripts/rollout-performance-role-ssot.mjs --check',
      '  node scripts/rollout-performance-role-ssot.mjs --frontend-check',
    ].join('\n')
  );
}

function listTargetFiles() {
  return fs
    .readdirSync(serviceDir)
    .filter(name => name.endsWith('.ts'))
    .filter(name => !name.includes('-dict'))
    .filter(name => !name.includes('-helper'))
    .filter(name => !excludedFiles.has(name))
    .map(name => path.join(serviceDir, name))
    .sort();
}

function walkFiles(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'generated' || entry.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, collected);
      continue;
    }

    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.vue')) {
      continue;
    }

    collected.push(fullPath);
  }

  return collected;
}

function listFrontendFiles() {
  return walkFiles(frontendPerformanceDir)
    .filter(file => !file.endsWith(`${path.sep}types.ts`))
    .sort();
}

function listCoolUniFiles() {
  return walkFiles(coolUniDir).sort();
}

function hasLegacyPattern(text) {
  return (
    /private async currentPerms\s*\(/.test(text) ||
    /private get currentAdmin\s*\(/.test(text) ||
    /private get currentCtx\s*\(/.test(text) ||
    /baseSysPermsService\.departmentIds\(/.test(text)
  );
}

function isAlreadySsotBacked(text) {
  return (
    text.includes('performanceAccessContextService') ||
    text.includes('resolvePerformanceLegacyPerms(') ||
    text.includes('resolvePerformanceCurrentAdmin(') ||
    text.includes('resolvePerformanceRuntimeContext(')
  );
}

function isHelperBacked(text) {
  return (
    text.includes('resolvePerformanceLegacyPerms(') ||
    text.includes('resolvePerformanceCurrentAdmin(') ||
    text.includes('resolvePerformanceRuntimeContext(')
  );
}

function collectCandidates() {
  return listTargetFiles().filter(file => {
    const text = fs.readFileSync(file, 'utf8');
    return hasLegacyPattern(text) && !isAlreadySsotBacked(text);
  });
}

function detectStage2Profile(text) {
  const usesAccessContextService = text.includes('performanceAccessContextService');
  if (usesAccessContextService) {
    return null;
  }

  const helperBackedLegacy =
    isHelperBacked(text) ||
    text.includes('hasPerformanceLegacyPermission(') ||
    text.includes('resolvePerformanceLegacyDepartmentIds(');

  if (!helperBackedLegacy) {
    return null;
  }

  const selfOnlyCourseLearning =
    text.includes('private currentUserId()') &&
    (text.includes('requireLearningCourse(') ||
      text.includes('requireLearningContext(')) &&
    !text.includes('departmentScopeIds(') &&
    !text.includes('baseSysPermsService');

  if (selfOnlyCourseLearning) {
    return 'self-only-course-learning';
  }

  const companyOnlyCrud =
    !text.includes('departmentScopeIds(') &&
    !text.includes('baseSysPermsService') &&
    text.includes('private readonly perms = {') &&
    text.includes('page:') &&
    text.includes('info:') &&
    text.includes('add:') &&
    text.includes('update:') &&
    text.includes('delete:');

  if (companyOnlyCrud) {
    return 'company-only-crud';
  }

  const departmentScopedLegacy =
    text.includes('departmentScopeIds(') ||
    text.includes('resolvePerformanceLegacyDepartmentIds(');

  if (departmentScopedLegacy) {
    return 'department-or-custom-scope';
  }

  return 'uncategorized-legacy';
}

function collectStage2Candidates() {
  const grouped = new Map();

  for (const file of listTargetFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    const profile = detectStage2Profile(text);
    if (!profile) {
      continue;
    }
    if (!grouped.has(profile)) {
      grouped.set(profile, []);
    }
    grouped.get(profile).push(path.relative(repoRoot, file));
  }

  return grouped;
}

const frontendLegacyPatterns = [
  {
    reason: 'frontend still defines isHrRole local role alias',
    regex: /\bconst\s+isHrRole\b/,
  },
  {
    reason: 'frontend still defines isManagerRole local role alias',
    regex: /\bconst\s+isManagerRole\b/,
  },
  {
    reason: 'frontend still reads legacy accessProfile.isHr field',
    regex: /accessProfile\.isHr/,
  },
  {
    reason: 'frontend still branches on legacy result.isHr field',
    regex: /result\.isHr/,
  },
  {
    reason: 'frontend still guesses role from supplier add permission',
    regex: /const\s+isHrRole\s*=\s*computed\(\(\)\s*=>\s*checkPerm\(performanceSupplierService\.permission\.add\)\)/,
  },
  {
    reason: 'frontend still renders performance role label from local readonly ternary',
    regex: /isReadOnlyRole\s*\?\s*'经理只读'\s*:\s*'HR 管理'/,
  },
  {
    reason: 'frontend still hardcodes job-standard readonly manager copy',
    regex: /title="当前账号为经理只读角色，仅可查看本人部门树范围内摘要字段。"/,
  },
  {
    reason: 'frontend still hardcodes supplier readonly manager copy',
    regex: /title="当前账号为经理只读角色，敏感字段仅展示后端返回的脱敏摘要。"/,
  },
  {
    reason: 'frontend still hardcodes office hr admin tag in page template',
    regex: /<el-tag\s+effect="plain"\s+type="info">HR 管理员<\/el-tag>/,
  },
  {
    reason: 'frontend office generic page still renders config audience label instead of role fact',
    regex: /<el-tag\s+effect="plain"\s+type="info">\{\{\s*config\.audienceLabel\s*\}\}<\/el-tag>/,
  },
  {
    reason: 'frontend still hardcodes salary hr-only tag copy',
    regex: /<el-tag\s+effect="plain">仅 HR 可见<\/el-tag>/,
  },
  {
    reason: 'frontend still hardcodes salary denied subtitle for hr admin only',
    regex: /sub-title="薪资管理仅对 HR 管理员开放。"/,
  },
  {
    reason: 'frontend teacher-channel dashboard still uses readonly account copy as role label',
    regex: /isReadOnlyRole\s*\?\s*'只读账号'\s*:\s*'可执行写动作'/,
  },
  {
    reason: 'frontend teacher-channel teacher list still uses readonly account copy as role label',
    regex: /isReadOnlyRole\s*\?\s*'只读账号'\s*:\s*'主链可操作'/,
  },
  {
    reason: 'frontend shared permission overlay still uses readonly account wording',
    regex: /const\s+readonlyText\s*=\s*profile\.isReadonly\s*\?\s*'只读账号'\s*:\s*'可写账号'/,
  },
  {
    reason: 'frontend office ledger config still carries stale hr audience label',
    regex: /audienceLabel:\s*'HR 管理员'/,
  },
];

function collectFrontendLegacyCandidates() {
  const candidates = [];

  for (const file of listFrontendFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    const reasons = frontendLegacyPatterns
      .filter(pattern => pattern.regex.test(text))
      .map(pattern => pattern.reason);

    if (!reasons.length) {
      continue;
    }

    candidates.push({
      file: path.relative(repoRoot, file),
      reasons,
    });
  }

  return candidates;
}

function collectCoolUniLegacyCandidates() {
  const candidates = [];

  for (const file of listCoolUniFiles()) {
    const relativeFile = path.relative(repoRoot, file);
    const text = fs.readFileSync(file, 'utf8');
    const reasons = [];

    if (
      relativeFile === 'cool-uni/pages/index/home.vue' &&
      text.includes('switch (user.roleKind)')
    ) {
      reasons.push(
        'cool-uni home still switches local roleKind instead of shared persona fact'
      );
    }

    if (
      relativeFile === 'cool-uni/cool/utils/performance-role-fact.ts' &&
      text.includes('roleLabel: "只读账号"')
    ) {
      reasons.push(
        'cool-uni role fact still uses readonly account wording instead of readonly view wording'
      );
    }

    if (
      relativeFile === 'cool-uni/cool/utils/performance-role-fact.ts' &&
      text.includes('roleLabel: "未开放账号"')
    ) {
      reasons.push(
        'cool-uni role fact still uses unopened account wording instead of unopened view wording'
      );
    }

    if (reasons.length) {
      candidates.push({
        file: relativeFile,
        reasons,
      });
    }
  }

  return candidates;
}

function ensureHelperImport(text) {
  if (text.includes(`from './access-context'`)) {
    return text;
  }

  const importMatches = [...text.matchAll(/^import[\s\S]*?;\n/gm)];
  const lastImport = importMatches.at(-1);
  if (!lastImport || lastImport.index === undefined) {
    throw new Error('无法定位 import 区域');
  }

  const insertAt = lastImport.index + lastImport[0].length;
  return `${text.slice(0, insertAt)}${helperImportBlock}${text.slice(insertAt)}`;
}

function findBlockRange(text, startPattern) {
  const match = startPattern.exec(text);
  if (!match || match.index === undefined) {
    return null;
  }

  const braceStart = text.indexOf('{', match.index);
  if (braceStart < 0) {
    return null;
  }

  let depth = 0;
  for (let index = braceStart; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = index + 1;
        if (text[end] === '\r') {
          end += 1;
        }
        if (text[end] === '\n') {
          end += 1;
        }
        return {
          start: match.index,
          end,
          block: text.slice(match.index, end),
        };
      }
    }
  }

  return null;
}

function replaceBlock(text, startPattern, replacement) {
  const range = findBlockRange(text, startPattern);
  if (!range) {
    return text;
  }
  return `${text.slice(0, range.start)}${replacement}${text.slice(range.end)}`;
}

function resolveMissingAuthMessage(block) {
  const match = block.match(/throw new CoolCommException\('([^']+)'\)/);
  return match?.[1] || '登录状态已失效';
}

function resolveAllowEmptyRoleIds(block) {
  return block.includes('return [];');
}

function buildCurrentCtxBlock() {
  return [
    '  private get currentCtx() {',
    '    return resolvePerformanceRuntimeContext({',
    '      ctx: this.ctx,',
    '      app: this.app,',
    '    });',
    '  }',
    '',
  ].join('\n');
}

function buildCurrentAdminBlock() {
  return [
    '  private get currentAdmin() {',
    '    return resolvePerformanceCurrentAdmin({',
    '      ctx: this.ctx,',
    '      app: this.app,',
    '    });',
    '  }',
    '',
  ].join('\n');
}

function buildCurrentPermsBlock(block) {
  const allowEmptyRoleIds = resolveAllowEmptyRoleIds(block);
  const missingAuthMessage = resolveMissingAuthMessage(block);

  return [
    '  private async currentPerms() {',
    '    return resolvePerformanceLegacyPerms(',
    '      {',
    '        ctx: this.ctx,',
    '        app: this.app,',
    '        baseSysMenuService: this.baseSysMenuService,',
    '      },',
    '      {',
    `        allowEmptyRoleIds: ${allowEmptyRoleIds ? 'true' : 'false'},`,
    `        missingAuthMessage: '${missingAuthMessage}',`,
    '      }',
    '    );',
    '  }',
    '',
  ].join('\n');
}

function buildHasPermBlock() {
  return [
    '  private hasPerm(perms: string[], perm: string) {',
    '    return hasPerformanceLegacyPermission(',
    '      {',
    '        perms,',
    '        admin: this.currentAdmin,',
    '      },',
    '      perm',
    '    );',
    '  }',
    '',
  ].join('\n');
}

function buildAssertPermBlock(methodName) {
  return [
    `  private ${methodName}(perms: string[], perm: string, message: string) {`,
    '    if (',
    '      !hasPerformanceLegacyPermission(',
    '        {',
    '          perms,',
    '          admin: this.currentAdmin,',
    '        },',
    '        perm',
    '      )',
    '    ) {',
    '      throw new CoolCommException(message);',
    '    }',
    '  }',
    '',
  ].join('\n');
}

function transformFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  const original = text;

  text = ensureHelperImport(text);

  text = replaceBlock(text, /  private get currentCtx\(\)\s*\{/, buildCurrentCtxBlock());
  text = replaceBlock(
    text,
    /  private get currentAdmin\(\)\s*\{/,
    buildCurrentAdminBlock()
  );

  const currentPermsRange = findBlockRange(text, /  private async currentPerms\(\)\s*\{/);
  if (currentPermsRange) {
    text =
      text.slice(0, currentPermsRange.start) +
      buildCurrentPermsBlock(currentPermsRange.block) +
      text.slice(currentPermsRange.end);
  }

  text = replaceBlock(text, /  private hasPerm\((?:.|\n)*?\)\s*\{/, buildHasPermBlock());
  text = replaceBlock(
    text,
    /  private assertPerm\((?:.|\n)*?\)\s*\{/,
    buildAssertPermBlock('assertPerm')
  );
  text = replaceBlock(
    text,
    /  private assertHasPerm\((?:.|\n)*?\)\s*\{/,
    buildAssertPermBlock('assertHasPerm')
  );

  text = text.replaceAll(
    /this\.baseSysPermsService\.departmentIds\(([^)]+)\)/g,
    'resolvePerformanceLegacyDepartmentIds({ baseSysPermsService: this.baseSysPermsService }, $1)'
  );

  return {
    changed: text !== original,
    text,
  };
}

function verifyFile(text) {
  const issues = [];

  if (/private get currentCtx\(\)\s*\{[\s\S]*jwt\.verify/.test(text)) {
    issues.push('currentCtx still parses runtime locally');
  }
  if (/private get currentAdmin\(\)\s*\{[\s\S]*jwt\.verify/.test(text)) {
    issues.push('currentAdmin still parses token locally');
  }
  if (
    /private async currentPerms\(\)\s*\{[\s\S]*baseSysMenuService\.getPerms/.test(text) &&
    !text.includes('resolvePerformanceLegacyPerms(')
  ) {
    issues.push('currentPerms still reads menu perms locally');
  }
  if (/baseSysPermsService\.departmentIds\(/.test(text)) {
    issues.push('departmentIds still read directly from baseSysPermsService');
  }
  if (
    /(private hasPerm|private assertPerm|private assertHasPerm)\([\s\S]*hasPermissionKey\(/.test(
      text
    )
  ) {
    issues.push('legacy hasPermissionKey wrapper still exists locally');
  }

  return issues;
}

function printReport(files) {
  if (!files.length) {
    console.log('No candidate files.');
    return;
  }

  console.log(`Candidate files: ${files.length}`);
  files.forEach(file => {
    console.log(path.relative(repoRoot, file));
  });
}

function printStage2Report(groups) {
  if (!groups.size) {
    console.log('No stage2 SSOT candidates.');
    return;
  }

  let total = 0;
  for (const files of groups.values()) {
    total += files.length;
  }

  console.log(`Stage2 SSOT candidate files: ${total}`);
  for (const [profile, files] of [...groups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    console.log(`\n[${profile}] ${files.length}`);
    files.forEach(file => console.log(file));
  }
}

function printFrontendReport(candidates) {
  if (!candidates.length) {
    console.log('No frontend SSOT candidates.');
    return;
  }

  console.log(`Frontend SSOT candidate files: ${candidates.length}`);
  for (const candidate of candidates) {
    console.log(candidate.file);
    candidate.reasons.forEach(reason => {
      console.log(`  - ${reason}`);
    });
  }
}

const args = new Set(process.argv.slice(2));

if (!args.size || args.has('--report')) {
  printReport(collectCandidates());
  process.exit(0);
}

if (args.has('--stage2-report')) {
  printStage2Report(collectStage2Candidates());
  process.exit(0);
}

if (args.has('--frontend-report')) {
  printFrontendReport([
    ...collectFrontendLegacyCandidates(),
    ...collectCoolUniLegacyCandidates(),
  ]);
  process.exit(0);
}

if (args.has('--write')) {
  const candidates = collectCandidates();
  const changedFiles = [];

  for (const file of candidates) {
    const result = transformFile(file);
    if (!result.changed) {
      continue;
    }
    fs.writeFileSync(file, result.text);
    changedFiles.push(path.relative(repoRoot, file));
  }

  console.log(`Updated files: ${changedFiles.length}`);
  changedFiles.forEach(file => console.log(file));
  process.exit(0);
}

if (args.has('--check')) {
  const candidates = listTargetFiles();
  const failures = [];

  for (const file of candidates) {
    const text = fs.readFileSync(file, 'utf8');
    if (!hasLegacyPattern(text) || !isAlreadySsotBacked(text)) {
      if (hasLegacyPattern(text) && !isAlreadySsotBacked(text)) {
        failures.push({
          file: path.relative(repoRoot, file),
          issues: ['file still uses legacy local auth context implementation'],
        });
      }
      continue;
    }
    if (!isHelperBacked(text)) {
      continue;
    }
    const issues = verifyFile(text);
    if (issues.length) {
      failures.push({
        file: path.relative(repoRoot, file),
        issues,
      });
    }
  }

  if (failures.length) {
    console.error(`SSOT rollout check failed: ${failures.length} file(s)`);
    for (const failure of failures) {
      console.error(`- ${failure.file}`);
      for (const issue of failure.issues) {
        console.error(`  * ${issue}`);
      }
    }
    process.exit(1);
  }

  console.log('SSOT rollout check passed.');
  process.exit(0);
}

if (args.has('--frontend-check')) {
  const failures = [
    ...collectFrontendLegacyCandidates(),
    ...collectCoolUniLegacyCandidates(),
  ];

  if (failures.length) {
    console.error(`Frontend SSOT check failed: ${failures.length} file(s)`);
    for (const failure of failures) {
      console.error(`- ${failure.file}`);
      failure.reasons.forEach(reason => {
        console.error(`  * ${reason}`);
      });
    }
    process.exit(1);
  }

  console.log('Frontend SSOT check passed.');
  process.exit(0);
}

usage();
process.exit(1);
